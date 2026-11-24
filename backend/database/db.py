"""
Database management for Linear System Solver Suite using SQLite.
Implements tables: problems, solutions, method_timings.
"""
import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'solver_suite.db')

def get_connection():
    """Returns a connection to the SQLite database with row factory enabled."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    """Initializes database schema with required tables and indexes."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Table 1: problems
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS problems (
        problem_id INTEGER PRIMARY KEY AUTOINCREMENT,
        matrix_a TEXT NOT NULL,
        vector_b TEXT NOT NULL,
        matrix_size INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # Table 2: solutions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS solutions (
        solution_id INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_id INTEGER NOT NULL,
        method_name TEXT NOT NULL,
        solution TEXT,
        classification TEXT NOT NULL,
        execution_time REAL NOT NULL,
        residual REAL,
        status TEXT NOT NULL,
        FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE
    );
    """)
    
    # Table 3: method_timings
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS method_timings (
        timing_id INTEGER PRIMARY KEY AUTOINCREMENT,
        problem_id INTEGER,
        method_name TEXT NOT NULL,
        matrix_size INTEGER NOT NULL,
        execution_time REAL NOT NULL,
        test_iteration INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (problem_id) REFERENCES problems(problem_id) ON DELETE CASCADE
    );
    """)
    
    # Indexes for fast querying and history search
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_problems_created ON problems(created_at DESC);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_solutions_problem ON solutions(problem_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_timings_size ON method_timings(matrix_size);")
    
    conn.commit()
    conn.close()

def save_problem_and_solutions(matrix_a, vector_b, matrix_size, solutions_list):
    """
    Saves problem and its calculated solutions into the database in a single transaction.
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        a_json = json.dumps(matrix_a)
        b_json = json.dumps(vector_b)
        
        cursor.execute(
            "INSERT INTO problems (matrix_a, vector_b, matrix_size) VALUES (?, ?, ?);",
            (a_json, b_json, int(matrix_size))
        )
        problem_id = cursor.lastrowid
        
        for sol in solutions_list:
            sol_json = json.dumps(sol.get('solution')) if sol.get('solution') is not None else None
            residual_val = None
            if sol.get('residual') and isinstance(sol.get('residual'), dict):
                residual_val = sol['residual'].get('norm_inf')
            elif isinstance(sol.get('residual'), (int, float)):
                residual_val = float(sol['residual'])
                
            cursor.execute("""
            INSERT INTO solutions (problem_id, method_name, solution, classification, execution_time, residual, status)
            VALUES (?, ?, ?, ?, ?, ?, ?);
            """, (
                problem_id,
                sol.get('method', 'Unknown'),
                sol_json,
                sol.get('classification', 'Unknown'),
                float(sol.get('execution_time_ms', 0.0)),
                residual_val,
                sol.get('status', 'Unknown')
            ))
            
            # Record timing entry
            cursor.execute("""
            INSERT INTO method_timings (problem_id, method_name, matrix_size, execution_time, test_iteration)
            VALUES (?, ?, ?, ?, ?);
            """, (
                problem_id,
                sol.get('method', 'Unknown'),
                int(matrix_size),
                float(sol.get('execution_time_ms', 0.0)),
                1
            ))
            
        conn.commit()
        return problem_id
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def save_benchmark_timings(timings_data):
    """
    Saves a batch of benchmark timing records:
    timings_data = [{'method_name': ..., 'matrix_size': ..., 'execution_time': ..., 'test_iteration': ...}]
    """
    conn = get_connection()
    cursor = conn.cursor()
    try:
        for t in timings_data:
            cursor.execute("""
            INSERT INTO method_timings (problem_id, method_name, matrix_size, execution_time, test_iteration)
            VALUES (?, ?, ?, ?, ?);
            """, (
                t.get('problem_id'),
                t['method_name'],
                int(t['matrix_size']),
                float(t['execution_time']),
                int(t['test_iteration'])
            ))
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def get_dashboard_statistics():
    """Returns overview statistics from SQLite database."""
    conn = get_connection()
    cursor = conn.cursor()
    
    # Total problems
    cursor.execute("SELECT COUNT(*) FROM problems;")
    total_problems = cursor.fetchone()[0]
    
    # Total benchmark runs / method timings
    cursor.execute("SELECT COUNT(*) FROM method_timings;")
    total_timings = cursor.fetchone()[0]
    
    # Solutions count by classification
    cursor.execute("""
    SELECT classification, COUNT(*) as count 
    FROM solutions 
    GROUP BY classification;
    """)
    classifications_breakdown = {row['classification']: row['count'] for row in cursor.fetchall()}
    
    # Recent calculations (last 6)
    cursor.execute("""
    SELECT p.problem_id, p.matrix_size, p.created_at,
           GROUP_CONCAT(s.method_name, ', ') as methods,
           MAX(s.classification) as primary_classification,
           MIN(s.execution_time) as min_time
    FROM problems p
    LEFT JOIN solutions s ON p.problem_id = s.problem_id
    GROUP BY p.problem_id
    ORDER BY p.created_at DESC
    LIMIT 6;
    """)
    recent = []
    for row in cursor.fetchall():
        recent.append({
            'problem_id': row['problem_id'],
            'matrix_size': row['matrix_size'],
            'created_at': row['created_at'],
            'methods': row['methods'] or 'N/A',
            'classification': row['primary_classification'] or 'N/A',
            'min_time': round(row['min_time'] or 0.0, 3)
        })
        
    conn.close()
    
    available_algorithms = [
        {'name': 'Gauss-Jordan Elimination', 'complexity': 'O(n³)', 'features': 'Partial pivoting, RREF, unique/infinite/inconsistent detection'},
        {'name': 'Inverse Matrix Method', 'complexity': 'O(n³)', 'features': 'A⁻¹ · b calculation, determinant verification, [A|I] reduction'},
        {'name': "Cramer's Rule", 'complexity': 'O((n+1)!) / O(n⁴)', 'features': 'Column replacement with b, det(Aⱼ)/det(A), capped for n ≤ 8'},
        {'name': 'LU Decomposition', 'complexity': 'O(n³)', 'features': 'PA = LU factorization, forward and backward substitution'}
    ]
    
    return {
        'total_problems': total_problems,
        'total_benchmark_tests': total_timings,
        'classifications': classifications_breakdown,
        'recent_calculations': recent,
        'available_algorithms': available_algorithms
    }

def get_history(search='', method='', classification='', sort_by='created_at', sort_order='DESC', page=1, per_page=15):
    """
    Retrieves paginated problem history with search and filtering.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    query = """
    SELECT p.problem_id, p.matrix_size, p.matrix_a, p.vector_b, p.created_at,
           s.solution_id, s.method_name, s.solution, s.classification, s.execution_time, s.residual, s.status
    FROM problems p
    INNER JOIN solutions s ON p.problem_id = s.problem_id
    WHERE 1=1
    """
    params = []
    
    if search:
        query += " AND (CAST(p.problem_id AS TEXT) LIKE ? OR s.method_name LIKE ? OR s.classification LIKE ?)"
        term = f"%{search}%"
        params.extend([term, term, term])
        
    if method:
        query += " AND s.method_name = ?"
        params.append(method)
        
    if classification:
        query += " AND s.classification = ?"
        params.append(classification)
        
    # Allowed sorting fields
    allowed_sorts = {
        'problem_id': 'p.problem_id',
        'matrix_size': 'p.matrix_size',
        'created_at': 'p.created_at',
        'execution_time': 's.execution_time',
        'method_name': 's.method_name'
    }
    sort_field = allowed_sorts.get(sort_by, 'p.created_at')
    order_dir = "ASC" if sort_order.upper() == 'ASC' else "DESC"
    
    # Count total matching
    count_query = f"SELECT COUNT(*) FROM ({query})"
    cursor.execute(count_query, params)
    total_count = cursor.fetchone()[0]
    
    # Apply ordering and pagination
    query += f" ORDER BY {sort_field} {order_dir} LIMIT ? OFFSET ?;"
    offset = (page - 1) * per_page
    params.extend([per_page, offset])
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    
    records = []
    for r in rows:
        records.append({
            'problem_id': r['problem_id'],
            'matrix_size': r['matrix_size'],
            'matrix_a': json.loads(r['matrix_a']),
            'vector_b': json.loads(r['vector_b']),
            'created_at': r['created_at'],
            'solution_id': r['solution_id'],
            'method_name': r['method_name'],
            'solution': json.loads(r['solution']) if r['solution'] else None,
            'classification': r['classification'],
            'execution_time': round(r['execution_time'], 4),
            'residual': r['residual'],
            'status': r['status']
        })
        
    conn.close()
    return {
        'records': records,
        'total': total_count,
        'page': page,
        'per_page': per_page,
        'total_pages': max(1, (total_count + per_page - 1) // per_page)
    }

def get_problem_details(problem_id):
    """Retrieves full details for a problem along with all associated method solutions."""
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM problems WHERE problem_id = ?;", (problem_id,))
    prob = cursor.fetchone()
    if not prob:
        conn.close()
        return None
        
    cursor.execute("SELECT * FROM solutions WHERE problem_id = ? ORDER BY solution_id ASC;", (problem_id,))
    sols = cursor.fetchall()
    
    solutions = []
    for s in sols:
        solutions.append({
            'solution_id': s['solution_id'],
            'method_name': s['method_name'],
            'solution': json.loads(s['solution']) if s['solution'] else None,
            'classification': s['classification'],
            'execution_time': s['execution_time'],
            'residual': s['residual'],
            'status': s['status']
        })
        
    res = {
        'problem_id': prob['problem_id'],
        'matrix_size': prob['matrix_size'],
        'matrix_a': json.loads(prob['matrix_a']),
        'vector_b': json.loads(prob['vector_b']),
        'created_at': prob['created_at'],
        'solutions': solutions
    }
    conn.close()
    return res

def delete_problem(problem_id):
    """Deletes problem and cascades to solutions and method_timings."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM problems WHERE problem_id = ?;", (problem_id,))
    cursor.execute("DELETE FROM method_timings WHERE problem_id = ?;", (problem_id,))
    conn.commit()
    deleted = cursor.rowcount > 0
    conn.close()
    return deleted

def clear_all_history():
    """Clears all stored problems, solutions and timings."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM solutions;")
    cursor.execute("DELETE FROM problems;")
    cursor.execute("DELETE FROM method_timings;")
    conn.commit()
    conn.close()
    return True

def get_benchmark_history():
    """
    Returns aggregated benchmark history grouped by method and matrix size.
    Computes average/median execution time for each size.
    """
    conn = get_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
    SELECT method_name, matrix_size, AVG(execution_time) as avg_time, MIN(execution_time) as min_time, MAX(execution_time) as max_time, COUNT(*) as sample_count
    FROM method_timings
    GROUP BY method_name, matrix_size
    ORDER BY matrix_size ASC, method_name ASC;
    """)
    rows = cursor.fetchall()
    
    data = {}
    for r in rows:
        method = r['method_name']
        if method not in data:
            data[method] = []
        data[method].append({
            'matrix_size': r['matrix_size'],
            'avg_time': round(r['avg_time'], 4),
            'min_time': round(r['min_time'], 4),
            'max_time': round(r['max_time'], 4),
            'sample_count': r['sample_count']
        })
        
    conn.close()
    return data
