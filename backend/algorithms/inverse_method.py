"""
Matrix Inverse Method solver implemented strictly from scratch.
Solves Ax = b by calculating x = A^(-1) * b.
"""
import time
from algorithms.matrix_operations import matrix_shape, matrix_vector_multiply, compute_residual
from algorithms.determinant import determinant_elimination

def invert_matrix(A, tolerance=1e-12):
    """
    Computes inverse of matrix A using Gauss-Jordan elimination on [A | I_n].
    Returns (inv_A, steps) or raises ValueError if singular.
    """
    r, c = matrix_shape(A)
    if r != c:
        raise ValueError(f"Matrix must be square to invert, got {r}x{c}")
    n = r
    
    # Augmented matrix [A | I]
    aug = []
    for i in range(n):
        identity_row = [1.0 if i == j else 0.0 for j in range(n)]
        aug.append([float(val) for val in A[i]] + identity_row)
        
    steps = [f"Constructed [A | I_{n}] matrix of dimension {n}x{2*n}."]
    
    for i in range(n):
        # Partial pivoting: select row with max absolute value in col i
        max_r = i
        max_val = abs(aug[i][i])
        for k in range(i + 1, n):
            if abs(aug[k][i]) > max_val:
                max_val = abs(aug[k][i])
                max_r = k
                
        if max_val < tolerance:
            raise ValueError(f"Matrix is singular (pivot in column {i+1} is 0). Inverse does not exist.")
            
        if max_r != i:
            aug[i], aug[max_r] = aug[max_r], aug[i]
            if len(steps) < 15:
                steps.append(f"Pivot swap: R{i+1} <-> R{max_r+1}")
                
        pivot = aug[i][i]
        # Normalize pivot row
        for j in range(2 * n):
            aug[i][j] /= pivot
        if len(steps) < 15:
            steps.append(f"Normalize row: R{i+1} = R{i+1} / {pivot:.4g}")
            
        # Eliminate all other rows
        for k in range(n):
            if k != i and abs(aug[k][i]) > tolerance:
                factor = aug[k][i]
                for j in range(2 * n):
                    aug[k][j] -= factor * aug[i][j]
                if len(steps) < 15:
                    steps.append(f"R{k+1} = R{k+1} - ({factor:.4g}) * R{i+1}")
                    
    # Extract right side [I | A^-1]
    inv_A = []
    for i in range(n):
        row = [round(aug[i][n + j], 8) for j in range(n)]
        inv_A.append(row)
        
    steps.append(f"Successfully transformed [A | I_{n}] into [I_{n} | A^(-1)]. Extracted {n}x{n} inverse matrix.")
    return inv_A, steps

def solve_inverse_method(A, b, tolerance=1e-10):
    """
    Solves Ax = b via matrix inversion: x = A^(-1) * b.
    Time Complexity: O(n^3)
    Space Complexity: O(n^2)
    """
    start_time = time.perf_counter()
    rA, cA = matrix_shape(A)
    if rA != cA:
        return {
            'method': 'Inverse Matrix Method',
            'status': 'Not Applicable',
            'classification': 'Invalid Dimensions',
            'solution': None,
            'inverse_matrix': None,
            'determinant': None,
            'steps': [f"Matrix must be square to use Inverse Method. Provided matrix is {rA}x{cA}."],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': 'Inverse method requires a square coefficient matrix.',
            'complexity': 'O(n^3)'
        }
        
    n = rA
    steps = [f"Step 1: Check determinant of {n}x{n} matrix to ensure non-singularity."]
    
    # Check determinant
    det_res = determinant_elimination(A, tolerance)
    det = det_res['determinant']
    steps.extend(det_res['steps'][:5])
    steps.append(f"Determinant det(A) = {det:.6g}")
    
    if abs(det) < tolerance:
        return {
            'method': 'Inverse Matrix Method',
            'status': 'Singular Matrix',
            'classification': 'Singular',
            'solution': None,
            'inverse_matrix': None,
            'determinant': det,
            'steps': steps + [f"Matrix is singular (det(A) = {det:.4g} ≈ 0). An inverse matrix does not exist."],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': f"Matrix is singular (det(A) = {det:.4g}). Cannot invert matrix to solve Ax = b.",
            'complexity': 'O(n^3)'
        }
        
    # Invert matrix
    steps.append("Step 2: Invert matrix A using Gauss-Jordan row reduction on [A | I].")
    try:
        inv_A, inv_steps = invert_matrix(A, tolerance)
        steps.extend(inv_steps[:8])
    except ValueError as e:
        return {
            'method': 'Inverse Matrix Method',
            'status': 'Singular Matrix',
            'classification': 'Singular',
            'solution': None,
            'inverse_matrix': None,
            'determinant': det,
            'steps': steps + [str(e)],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': str(e),
            'complexity': 'O(n^3)'
        }
        
    # Multiply A^(-1) * b
    steps.append("Step 3: Compute x = A^(-1) * b via matrix-vector multiplication.")
    solution = matrix_vector_multiply(inv_A, b)
    solution = [round(val, 8) for val in solution]
    
    # Residual
    residual = compute_residual(A, solution, b)
    steps.append(f"Step 4: Verified solution with residual ||Ax - b||_inf = {residual['norm_inf']:.2e}")
    
    execution_time_ms = (time.perf_counter() - start_time) * 1000.0
    return {
        'method': 'Inverse Matrix Method',
        'status': 'Success',
        'classification': 'Unique',
        'solution': solution,
        'inverse_matrix': inv_A,
        'determinant': det,
        'steps': steps,
        'execution_time_ms': execution_time_ms,
        'residual': residual,
        'message': 'Solved successfully using A^(-1) * b.',
        'complexity': 'O(n^3)'
    }
