"""
Cramer's Rule solver implemented strictly from scratch.
Solves Ax = b by evaluating x_j = det(A_j) / det(A).
"""
import time
import math
from algorithms.matrix_operations import matrix_shape, compute_residual
from algorithms.determinant import determinant_elimination, determinant_cofactor

def solve_cramer_rule(A, b, max_size=8, det_method='auto', tolerance=1e-10):
    """
    Solves Ax = b using Cramer's Rule.
    
    det_method:
      - 'auto': uses recursive cofactor for n <= 4, Gaussian elimination for 5 <= n <= max_size
      - 'cofactor': uses recursive Laplace expansion (restricted to n <= 7)
      - 'elimination': uses Gaussian elimination for determinants
      
    Complexity Analysis:
      - With recursive cofactor: (n+1) * O(n!) = O((n+1)!)
      - With elimination: (n+1) * O(n^3) = O(n^4)
    """
    start_time = time.perf_counter()
    rA, cA = matrix_shape(A)
    
    if rA != cA:
        return {
            'method': "Cramer's Rule",
            'status': 'Not Applicable',
            'classification': 'Invalid Dimensions',
            'solution': None,
            'determinants': {},
            'steps': [f"Cramer's Rule requires a square system. Given {rA} equations with {cA} unknowns."],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': "Cramer's Rule is only applicable to square systems (n x n).",
            'complexity': 'O((n+1)!) or O(n^4)'
        }
        
    n = rA
    
    # Check max size limit
    if n > max_size:
        explanation = (
            f"Cramer's Rule is restricted to matrices of size ≤ {max_size}×{max_size} (received {n}×{n}).\n"
            f"Theoretical Impracticality Analysis:\n"
            f"1. Naive Cramer's Rule via Cofactor Expansion requires (n + 1) determinants of size n×n.\n"
            f"   Total operations: (n + 1) * n! = (n + 1)!.\n"
            f"   For n={n}: ({n}+1)! = {math.factorial(n+1):,} floating-point operations. "
            f"This would take days or years to compute!\n"
            f"2. Even using Gaussian elimination for each determinant, Cramer's Rule requires (n + 1) * O(n^3) = O(n^4) operations, "
            f"whereas Gauss-Jordan and LU decomposition require only O(n^3) operations.\n"
            f"For matrices > {max_size}×{max_size}, please use Gauss-Jordan or LU Decomposition."
        )
        return {
            'method': "Cramer's Rule",
            'status': 'Skipped (Impractical)',
            'classification': 'Exceeds Dimension Limit',
            'solution': None,
            'determinants': {},
            'steps': [explanation],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': f"Matrix dimension {n} exceeds Cramer's rule threshold ({max_size}).",
            'complexity': f"O((n+1)!) = {math.factorial(n+1):,} ops" if n <= 15 else "O((n+1)!) >> 10^15 ops",
            'impracticality_reason': explanation
        }
        
    steps = [
        f"Initiating Cramer's Rule for {n}x{n} system.",
        f"Theoretical complexity: (n+1) determinant calculations = {n+1} * O(n^3) = O(n^4)."
    ]
    
    # Choose determinant computation function
    use_cofactor = (det_method == 'cofactor') or (det_method == 'auto' and n <= 4)
    det_fn = determinant_cofactor if use_cofactor else determinant_elimination
    det_method_name = "Recursive Cofactor O(n!)" if use_cofactor else "Gaussian Elimination O(n^3)"
    steps.append(f"Using {det_method_name} for calculating determinants.")
    
    # 1. Main determinant D = det(A)
    try:
        det_A_res = det_fn(A)
        D = det_A_res['determinant']
    except Exception as e:
        det_A_res = determinant_elimination(A)
        D = det_A_res['determinant']
        
    steps.append(f"Main coefficient determinant D = det(A) = {D:.6g}")
    
    if abs(D) < tolerance:
        return {
            'method': "Cramer's Rule",
            'status': 'Singular Matrix',
            'classification': 'Singular',
            'solution': None,
            'determinants': {'D': D},
            'steps': steps + [
                f"det(A) = {D:.4g} ≈ 0 (Singular System).",
                "Cramer's Rule cannot solve singular systems (division by D=0 is undefined).",
                "The system either has Infinitely Many Solutions or is Inconsistent. Use Gauss-Jordan Elimination to classify."
            ],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': f"det(A) is zero ({D:.4g}). Cramer's Rule cannot divide by zero.",
            'complexity': 'O(n^4)'
        }
        
    # 2. For each variable x_j, construct A_j by replacing column j with b, then D_j = det(A_j)
    solution = [0.0] * n
    det_dict = {'D': round(D, 6)}
    
    for j in range(n):
        # Build A_j
        A_j = []
        for i in range(n):
            row_copy = list(A[i])
            row_copy[j] = float(b[i])
            A_j.append(row_copy)
            
        res_j = det_fn(A_j)
        D_j = res_j['determinant']
        det_dict[f"D_{j+1}"] = round(D_j, 6)
        
        x_j = D_j / D
        solution[j] = round(x_j, 8)
        steps.append(f"Replace column {j+1} with b -> det(A_{j+1}) = D_{j+1} = {D_j:.6g} -> x_{j+1} = D_{j+1}/D = {x_j:.6g}")
        
    # Residual verification
    residual = compute_residual(A, solution, b)
    steps.append(f"Verified solution: Max residual ||Ax - b||_inf = {residual['norm_inf']:.2e}")
    
    execution_time_ms = (time.perf_counter() - start_time) * 1000.0
    return {
        'method': "Cramer's Rule",
        'status': 'Success',
        'classification': 'Unique',
        'solution': solution,
        'determinants': det_dict,
        'steps': steps,
        'execution_time_ms': execution_time_ms,
        'residual': residual,
        'message': f"Calculated {n} variables using {n+1} determinants.",
        'complexity': f"{n+1} * O(n^3) = O(n^4)"
    }
