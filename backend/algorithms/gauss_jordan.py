"""
Gauss-Jordan Elimination solver implemented strictly from scratch.
Features:
- Partial pivoting for numerical stability
- Conversion to Reduced Row Echelon Form (RREF)
- Detection and handling of Unique, Infinite, and Inconsistent systems
"""
import time
from algorithms.matrix_operations import matrix_shape, compute_residual
from algorithms.classifier import classify_system

def solve_gauss_jordan(A, b, tolerance=1e-10):
    """
    Solves Ax = b using Gauss-Jordan elimination with partial pivoting.
    Time Complexity: O(n^3)
    Space Complexity: O(n^2)
    """
    start_time = time.perf_counter()
    rA, cA = matrix_shape(A)
    if rA != len(b):
        raise ValueError(f"Matrix rows ({rA}) does not match vector b dimension ({len(b)})")
        
    n = cA
    m = rA
    total_cols = n + 1
    
    # Check classification first
    classification_info = classify_system(A, b, tolerance)
    classification = classification_info['classification']
    
    # Build augmented matrix [A | b]
    M = [[float(A[i][j]) for j in range(n)] + [float(b[i])] for i in range(m)]
    steps = [f"Constructed initial augmented matrix [A | b] of shape {m}x{total_cols}."]
    
    pivot_row = 0
    pivot_cols = []
    
    for col in range(n):
        if pivot_row >= m:
            break
            
        # 1. Partial Pivoting: find largest absolute value in current column at or below pivot_row
        max_val = abs(M[pivot_row][col])
        max_r = pivot_row
        for i in range(pivot_row + 1, m):
            if abs(M[i][col]) > max_val:
                max_val = abs(M[i][col])
                max_r = i
                
        if max_val < tolerance:
            if len(steps) < 25:
                steps.append(f"Column {col+1}: Pivot is zero (max |val| < {tolerance}). Column corresponds to free variable.")
            continue
            
        # Swap rows if necessary
        if max_r != pivot_row:
            M[pivot_row], M[max_r] = M[max_r], M[pivot_row]
            if len(steps) < 25:
                steps.append(f"Partial pivot swap: R{pivot_row+1} <-> R{max_r+1} (selected pivot = {M[pivot_row][col]:.4g})")
                
        pivot = M[pivot_row][col]
        pivot_cols.append(col)
        
        # 2. Normalize pivot row to make leading entry 1
        for j in range(col, total_cols):
            M[pivot_row][j] /= pivot
        if len(steps) < 25:
            steps.append(f"Normalize R{pivot_row+1}: R{pivot_row+1} = R{pivot_row+1} / ({pivot:.4g})")
            
        # 3. Eliminate all other entries in column (both above and below)
        for i in range(m):
            if i != pivot_row and abs(M[i][col]) > tolerance:
                factor = M[i][col]
                for j in range(col, total_cols):
                    M[i][j] -= factor * M[pivot_row][j]
                if len(steps) < 25:
                    steps.append(f"Eliminate R{i+1}: R{i+1} = R{i+1} - ({factor:.4g}) * R{pivot_row+1}")
                    
        pivot_row += 1
        
    # Clean up small numerical noise
    for i in range(m):
        for j in range(total_cols):
            if abs(M[i][j]) < tolerance:
                M[i][j] = 0.0
            else:
                M[i][j] = round(M[i][j], 8)
                
    steps.append("Reduced Row Echelon Form (RREF) achieved.")
    
    execution_time_ms = (time.perf_counter() - start_time) * 1000.0
    
    if classification == "Inconsistent":
        return {
            'method': 'Gauss-Jordan Elimination',
            'status': 'Inconsistent',
            'classification': 'Inconsistent',
            'solution': None,
            'rref': M,
            'steps': steps,
            'execution_time_ms': execution_time_ms,
            'residual': None,
            'message': classification_info['explanation'],
            'contradiction': classification_info['contradiction'],
            'complexity': 'O(n^3)'
        }
        
    if classification == "Infinite":
        return {
            'method': 'Gauss-Jordan Elimination',
            'status': 'Infinite Solutions',
            'classification': 'Infinite',
            'solution': classification_info['parametric_solution']['particular_solution'],
            'parametric': classification_info['parametric_solution'],
            'rref': M,
            'steps': steps,
            'execution_time_ms': execution_time_ms,
            'residual': None,
            'message': classification_info['explanation'],
            'complexity': 'O(n^3)'
        }
        
    # Unique solution: extract values directly from RREF
    solution = [0.0] * n
    for row_idx, p_col in enumerate(pivot_cols):
        solution[p_col] = round(M[row_idx][n], 8)
        
    # Compute residual ||Ax - b||
    residual_data = compute_residual(A, solution, b)
    steps.append(f"Solution verified: Max residual ||Ax - b||_inf = {residual_data['norm_inf']:.2e}")
    
    return {
        'method': 'Gauss-Jordan Elimination',
        'status': 'Success',
        'classification': 'Unique',
        'solution': solution,
        'rref': M,
        'steps': steps,
        'execution_time_ms': execution_time_ms,
        'residual': residual_data,
        'message': 'Unique solution calculated via Gauss-Jordan RREF with partial pivoting.',
        'complexity': 'O(n^3)'
    }
