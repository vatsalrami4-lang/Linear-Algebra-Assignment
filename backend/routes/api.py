"""
Flask Blueprint containing all API routes for the Linear System Solver Suite.
"""
from flask import Blueprint, request, jsonify
import time
import statistics
import math

from algorithms.matrix_operations import (
    matrix_shape, matrix_add, matrix_subtract, matrix_multiply,
    matrix_transpose, matrix_identity, random_matrix, random_vector,
    compute_residual
)
from algorithms.determinant import determinant_elimination, determinant_cofactor
from algorithms.matrix_rank import compute_rank, compute_augmented_rank
from algorithms.classifier import classify_system
from algorithms.gauss_jordan import solve_gauss_jordan
from algorithms.inverse_method import solve_inverse_method, invert_matrix
from algorithms.cramer_rule import solve_cramer_rule
from algorithms.lu_decomposition import solve_lu_decomposition
from database.db import (
    get_dashboard_statistics, save_problem_and_solutions,
    save_benchmark_timings, get_history, get_problem_details,
    delete_problem, clear_all_history, get_benchmark_history
)

api_bp = Blueprint('api', __name__)

@api_bp.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'service': 'Linear System Solver Suite API'})

@api_bp.route('/dashboard/stats', methods=['GET'])
def dashboard_stats():
    try:
        stats = get_dashboard_statistics()
        return jsonify({'success': True, 'data': stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/samples', methods=['GET'])
def get_sample_systems():
    samples = [
        {
            'id': 'unique-3x3',
            'name': '3x3 Unique System (Circuit Mesh Current)',
            'description': 'Standard well-conditioned system with a single unique intersection point.',
            'size': 3,
            'matrix_a': [
                [2, 1, -1],
                [-3, -1, 2],
                [-2, 1, 2]
            ],
            'vector_b': [8, -11, -3],
            'expected_classification': 'Unique',
            'expected_solution': [2, 3, -1]
        },
        {
            'id': 'unique-4x4',
            'name': '4x4 Unique System (Structural Analysis)',
            'description': 'Four-variable system with integer solution.',
            'size': 4,
            'matrix_a': [
                [1, 2, 1, -1],
                [3, -1, 4, 2],
                [2, 2, 3, 1],
                [-1, 3, 2, 2]
            ],
            'vector_b': [4, 15, 11, 6],
            'expected_classification': 'Unique',
            'expected_solution': [1, -1, 3, 2]
        },
        {
            'id': 'unique-5x5',
            'name': '5x5 Diagonally Dominant System',
            'description': 'Well-conditioned five-variable engineering model.',
            'size': 5,
            'matrix_a': [
                [10, -1, 2, 0, 1],
                [-1, 11, -1, 3, 0],
                [2, -1, 10, -1, 2],
                [0, 3, -1, 8, -1],
                [1, 0, 2, -1, 9]
            ],
            'vector_b': [6, 25, -11, 15, -12],
            'expected_classification': 'Unique',
            'expected_solution': None
        },
        {
            'id': 'inconsistent-3x3',
            'name': '3x3 Inconsistent System (Parallel Hyperplanes)',
            'description': 'Equations represent parallel/conflicting planes where rank(A) ≠ rank([A|b]).',
            'size': 3,
            'matrix_a': [
                [1, 1, 1],
                [1, 1, 1],
                [2, 3, 1]
            ],
            'vector_b': [2, 5, 8],
            'expected_classification': 'Inconsistent',
            'expected_solution': None
        },
        {
            'id': 'infinite-1dof-3x3',
            'name': '3x3 Infinite Solutions (1 Degree of Freedom)',
            'description': 'Planes intersect in a single infinite line; rank(A) = rank([A|b]) = 2 < 3.',
            'size': 3,
            'matrix_a': [
                [1, 2, -1],
                [2, 4, -2],
                [3, 6, -3]
            ],
            'vector_b': [3, 6, 9],
            'expected_classification': 'Infinite',
            'expected_solution': None
        },
        {
            'id': 'singular-3x3',
            'name': '3x3 Singular Matrix (det = 0)',
            'description': 'Row 3 is the exact sum of Row 1 and Row 2. Coefficient matrix is non-invertible.',
            'size': 3,
            'matrix_a': [
                [1, 2, 3],
                [4, 5, 6],
                [5, 7, 9]
            ],
            'vector_b': [1, 2, 3],
            'expected_classification': 'Infinite / Singular',
            'expected_solution': None
        }
    ]
    return jsonify({'success': True, 'samples': samples})

@api_bp.route('/random', methods=['POST'])
def generate_random():
    data = request.get_json() or {}
    size = int(data.get('size', 3))
    mode = data.get('mode', 'well_conditioned') # 'well_conditioned' | 'random' | 'singular'
    min_val = float(data.get('min_val', -10))
    max_val = float(data.get('max_val', 10))
    integer_only = bool(data.get('integer_only', True))
    
    if size < 2 or size > 200:
        return jsonify({'success': False, 'error': 'Matrix size must be between 2 and 200.'}), 400
        
    if mode == 'well_conditioned':
        # Make strictly diagonally dominant matrix to guarantee unique solution
        A = random_matrix(size, size, min_val, max_val, integer_only)
        for i in range(size):
            row_sum = sum(abs(A[i][j]) for j in range(size) if j != i)
            # Add margin
            A[i][i] = int(row_sum + 5) if integer_only else round(row_sum + 5.0, 2)
        b = random_vector(size, min_val, max_val, integer_only)
    elif mode == 'singular':
        A = random_matrix(size, size, min_val, max_val, integer_only)
        if size >= 2:
            # Set row 1 = row 0 to guarantee singularity
            A[1] = list(A[0])
        b = random_vector(size, min_val, max_val, integer_only)
    else:
        A = random_matrix(size, size, min_val, max_val, integer_only)
        b = random_vector(size, min_val, max_val, integer_only)
        
    return jsonify({'success': True, 'matrix_a': A, 'vector_b': b, 'size': size})

@api_bp.route('/classify', methods=['POST'])
def classify():
    try:
        data = request.get_json() or {}
        A = data.get('matrix_a')
        b = data.get('vector_b')
        
        if not A or not b:
            return jsonify({'success': False, 'error': 'matrix_a and vector_b are required.'}), 400
            
        res = classify_system(A, b)
        return jsonify({'success': True, 'data': res})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@api_bp.route('/solve', methods=['POST'])
def solve_system():
    try:
        data = request.get_json() or {}
        A = data.get('matrix_a')
        b = data.get('vector_b')
        methods = data.get('methods', 'all')
        max_cramer_size = int(data.get('max_cramer_size', 8))
        save_history = bool(data.get('save_to_history', True))
        
        if not A or not b:
            return jsonify({'success': False, 'error': 'matrix_a and vector_b are required.'}), 400
            
        r, c = matrix_shape(A)
        if r != len(b):
            return jsonify({'success': False, 'error': f"Matrix rows ({r}) must match vector dimension ({len(b)})."}), 400
            
        # Classify first
        classification = classify_system(A, b)
        
        # Decide which methods to run
        all_methods = ['gauss_jordan', 'inverse_method', 'cramer_rule', 'lu_decomposition']
        if methods == 'all':
            selected_methods = all_methods
        elif isinstance(methods, list):
            selected_methods = [m for m in methods if m in all_methods]
        else:
            selected_methods = [methods] if methods in all_methods else all_methods
            
        results = {}
        solutions_for_db = []
        
        # Run Gauss-Jordan
        if 'gauss_jordan' in selected_methods:
            res_gj = solve_gauss_jordan(A, b)
            results['gauss_jordan'] = res_gj
            solutions_for_db.append(res_gj)
            
        # Run Inverse Method
        if 'inverse_method' in selected_methods:
            res_inv = solve_inverse_method(A, b)
            results['inverse_method'] = res_inv
            solutions_for_db.append(res_inv)
            
        # Run Cramer's Rule
        if 'cramer_rule' in selected_methods:
            res_cramer = solve_cramer_rule(A, b, max_size=max_cramer_size)
            results['cramer_rule'] = res_cramer
            solutions_for_db.append(res_cramer)
            
        # Run LU Decomposition
        if 'lu_decomposition' in selected_methods:
            res_lu = solve_lu_decomposition(A, b)
            results['lu_decomposition'] = res_lu
            solutions_for_db.append(res_lu)
            
        # Cross-method consistency check
        successful_solutions = [
            (k, res['solution']) for k, res in results.items() 
            if res.get('status') == 'Success' and res.get('solution') is not None
        ]
        
        consistency_status = "Consistent"
        max_discrepancy = 0.0
        if len(successful_solutions) > 1:
            base_method, base_sol = successful_solutions[0]
            for other_method, other_sol in successful_solutions[1:]:
                diff = max(abs(float(base_sol[i]) - float(other_sol[i])) for i in range(len(base_sol)))
                if diff > max_discrepancy:
                    max_discrepancy = diff
            if max_discrepancy > 1e-4:
                consistency_status = "Discrepancy Detected"
                
        comparison_summary = {
            'consistent': (consistency_status == "Consistent"),
            'status': consistency_status,
            'max_discrepancy': max_discrepancy,
            'methods_evaluated': len(results),
            'methods_succeeded': len(successful_solutions)
        }
        
        # Save to database if requested
        problem_id = None
        if save_history and solutions_for_db:
            try:
                problem_id = save_problem_and_solutions(A, b, r, solutions_for_db)
            except Exception as dbe:
                print(f"Warning: Failed to save to history DB: {dbe}")
                
        return jsonify({
            'success': True,
            'problem_id': problem_id,
            'matrix_size': r,
            'classification': classification,
            'results': results,
            'comparison': comparison_summary
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@api_bp.route('/matrix-operations', methods=['POST'])
def matrix_operations():
    try:
        data = request.get_json() or {}
        operation = data.get('operation')
        A = data.get('matrix_a')
        B = data.get('matrix_b')
        det_method = data.get('det_method', 'auto')
        dimension = data.get('dimension')
        
        if not operation:
            return jsonify({'success': False, 'error': 'operation is required.'}), 400
            
        start_time = time.perf_counter()
        
        if operation == 'identity':
            n = int(dimension or 3)
            if n < 1 or n > 200:
                return jsonify({'success': False, 'error': 'Dimension must be between 1 and 200.'}), 400
            res_matrix, steps = matrix_identity(n)
            return jsonify({
                'success': True,
                'operation': 'Identity Matrix Generation',
                'result_matrix': res_matrix,
                'steps': steps,
                'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
            })
            
        if not A:
            return jsonify({'success': False, 'error': 'matrix_a is required for this operation.'}), 400
            
        if operation == 'add':
            if not B:
                return jsonify({'success': False, 'error': 'matrix_b is required for addition.'}), 400
            res_matrix, steps = matrix_add(A, B)
            return jsonify({
                'success': True,
                'operation': 'Matrix Addition',
                'result_matrix': res_matrix,
                'steps': steps,
                'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
            })
            
        elif operation == 'subtract':
            if not B:
                return jsonify({'success': False, 'error': 'matrix_b is required for subtraction.'}), 400
            res_matrix, steps = matrix_subtract(A, B)
            return jsonify({
                'success': True,
                'operation': 'Matrix Subtraction',
                'result_matrix': res_matrix,
                'steps': steps,
                'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
            })
            
        elif operation == 'multiply':
            if not B:
                return jsonify({'success': False, 'error': 'matrix_b is required for multiplication.'}), 400
            res_matrix, steps = matrix_multiply(A, B)
            return jsonify({
                'success': True,
                'operation': 'Matrix Multiplication',
                'result_matrix': res_matrix,
                'steps': steps,
                'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
            })
            
        elif operation == 'transpose':
            res_matrix, steps = matrix_transpose(A)
            return jsonify({
                'success': True,
                'operation': 'Matrix Transpose',
                'result_matrix': res_matrix,
                'steps': steps,
                'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
            })
            
        elif operation == 'rank':
            res = compute_rank(A)
            return jsonify({
                'success': True,
                'operation': 'Matrix Rank',
                'rank': res['rank'],
                'row_echelon_form': res['row_echelon_form'],
                'steps': "\n".join(res['steps']),
                'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
            })
            
        elif operation == 'determinant':
            r, c = matrix_shape(A)
            if r != c:
                return jsonify({'success': False, 'error': f"Determinant requires a square matrix. Received ({r}x{c})."}), 400
                
            if det_method == 'cofactor':
                res = determinant_cofactor(A)
            elif det_method == 'elimination':
                res = determinant_elimination(A)
            else:
                # auto: if <= 4, can show cofactor or both
                res_elim = determinant_elimination(A)
                res_cof = determinant_cofactor(A) if r <= 5 else None
                return jsonify({
                    'success': True,
                    'operation': 'Determinant Calculation',
                    'determinant': res_elim['determinant'],
                    'method_elimination': res_elim,
                    'method_cofactor': res_cof,
                    'steps': "\n".join(res_elim['steps']),
                    'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
                })
                
            return jsonify({
                'success': True,
                'operation': f"Determinant ({res['method']})",
                'determinant': res['determinant'],
                'details': res,
                'steps': "\n".join(res['steps']),
                'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
            })
            
        elif operation == 'inverse':
            inv_matrix, steps = invert_matrix(A)
            return jsonify({
                'success': True,
                'operation': 'Matrix Inverse',
                'inverse_matrix': inv_matrix,
                'steps': "\n".join(steps),
                'execution_time_ms': (time.perf_counter() - start_time) * 1000.0
            })
            
        else:
            return jsonify({'success': False, 'error': f"Unknown operation: '{operation}'"}), 400
            
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@api_bp.route('/benchmark/run', methods=['POST'])
def run_benchmark():
    try:
        data = request.get_json() or {}
        sizes = data.get('sizes', [2, 4, 8, 16, 32, 64, 100, 150, 200])
        methods = data.get('methods', ['gauss_jordan', 'inverse_method', 'cramer_rule', 'lu_decomposition'])
        repetitions = min(max(int(data.get('repetitions', 3)), 1), 5)
        max_cramer_size = int(data.get('max_cramer_size', 8))
        time_limit_ms = float(data.get('time_limit_ms', 5000))
        
        # Validate sizes
        sizes = [int(s) for s in sizes if 2 <= int(s) <= 200]
        sizes.sort()
        if not sizes:
            sizes = [2, 4, 8, 16, 32, 64, 100]
            
        timings_records_to_save = []
        benchmark_results = {m: [] for m in methods}
        
        for size in sizes:
            # Generate consistent well-conditioned test matrix for this size
            A = random_matrix(size, size, -5, 5, integer_only=True)
            for i in range(size):
                row_sum = sum(abs(A[i][j]) for j in range(size) if j != i)
                A[i][i] = int(row_sum + 10)
            b = random_vector(size, -5, 5, integer_only=True)
            
            for method in methods:
                if method == 'cramer_rule' and size > max_cramer_size:
                    benchmark_results['cramer_rule'].append({
                        'size': size,
                        'median_ms': None,
                        'skipped': True,
                        'reason': f"Skipped: size {size} exceeds Cramer max ({max_cramer_size}). Theoretical cost: {math.factorial(size+1) if size <= 15 else '>>10^15'} ops."
                    })
                    continue
                    
                times = []
                for rep in range(repetitions):
                    t0 = time.perf_counter()
                    if method == 'gauss_jordan':
                        solve_gauss_jordan(A, b)
                    elif method == 'inverse_method':
                        solve_inverse_method(A, b)
                    elif method == 'cramer_rule':
                        solve_cramer_rule(A, b, max_size=max_cramer_size, det_method='elimination')
                    elif method == 'lu_decomposition':
                        solve_lu_decomposition(A, b)
                    elapsed_ms = (time.perf_counter() - t0) * 1000.0
                    times.append(elapsed_ms)
                    
                    timings_records_to_save.append({
                        'problem_id': None,
                        'method_name': method,
                        'matrix_size': size,
                        'execution_time': elapsed_ms,
                        'test_iteration': rep + 1
                    })
                    
                med_time = round(statistics.median(times), 4)
                benchmark_results[method].append({
                    'size': size,
                    'median_ms': med_time,
                    'min_ms': round(min(times), 4),
                    'max_ms': round(max(times), 4),
                    'raw_times': [round(t, 4) for t in times],
                    'skipped': False
                })
                
        # Save to SQLite database
        try:
            save_benchmark_timings(timings_records_to_save)
        except Exception as e:
            print(f"Warning: Failed to save benchmark timings: {e}")
            
        return jsonify({
            'success': True,
            'sizes': sizes,
            'repetitions': repetitions,
            'max_cramer_size': max_cramer_size,
            'results': benchmark_results
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

@api_bp.route('/benchmark/history', methods=['GET'])
def benchmark_history():
    try:
        data = get_benchmark_history()
        return jsonify({'success': True, 'data': data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/history', methods=['GET'])
def list_history():
    try:
        search = request.args.get('search', '').strip()
        method = request.args.get('method', '').strip()
        classification = request.args.get('classification', '').strip()
        sort_by = request.args.get('sort_by', 'created_at')
        sort_order = request.args.get('sort_order', 'DESC')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 15))
        
        res = get_history(search, method, classification, sort_by, sort_order, page, per_page)
        return jsonify({'success': True, 'data': res})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/history/<int:problem_id>', methods=['GET'])
def get_history_detail(problem_id):
    try:
        prob = get_problem_details(problem_id)
        if not prob:
            return jsonify({'success': False, 'error': f'Problem with ID {problem_id} not found.'}), 404
        return jsonify({'success': True, 'data': prob})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/history/<int:problem_id>', methods=['DELETE'])
def delete_history_item(problem_id):
    try:
        deleted = delete_problem(problem_id)
        if not deleted:
            return jsonify({'success': False, 'error': f'Problem with ID {problem_id} not found.'}), 404
        return jsonify({'success': True, 'message': f'Problem {problem_id} deleted successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@api_bp.route('/history/clear', methods=['POST'])
def clear_history():
    try:
        clear_all_history()
        return jsonify({'success': True, 'message': 'All problem and timing history cleared successfully.'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
