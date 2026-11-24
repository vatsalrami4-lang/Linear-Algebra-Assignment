"""
LU Decomposition (Doolittle Algorithm with Partial Pivoting PA = LU) implemented strictly from scratch.
Solves Ax = b in three steps:
1. Decompose PA = LU
2. Forward substitution: Ly = Pb
3. Backward substitution: Ux = y
"""
import time
from algorithms.matrix_operations import matrix_shape, compute_residual

def lu_factorization(A, tolerance=1e-12):
    """
    Computes PA = LU decomposition where:
    - P is permutation matrix
    - L is unit lower triangular (L[i][i] = 1, L[i][j] = 0 for j > i)
    - U is upper triangular (U[i][j] = 0 for j < i)
    Returns: (P, L, U, piv_swaps, steps)
    """
    r, c = matrix_shape(A)
    if r != c:
        raise ValueError(f"LU decomposition requires a square matrix. Received shape ({r}x{c}).")
    n = r
    
    # Initialize P as identity matrix, L as zero with 1s on diagonal, U as copy of A
    P = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    L = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    U = [[float(A[i][j]) for j in range(n)] for i in range(n)]
    
    steps = [f"Initialized LU decomposition for {n}x{n} matrix with partial pivoting (PA = LU)."]
    piv_swaps = 0
    
    for k in range(n):
        # 1. Partial Pivoting: find row with largest pivot in column k, row >= k
        max_r = k
        max_val = abs(U[k][k])
        for i in range(k + 1, n):
            if abs(U[i][k]) > max_val:
                max_val = abs(U[i][k])
                max_r = i
                
        if max_val < tolerance:
            # Pivot is zero; matrix is singular
            return P, L, U, piv_swaps, steps, False
            
        # Swap rows in U, P, and subdiagonal elements of L
        if max_r != k:
            U[k], U[max_r] = U[max_r], U[k]
            P[k], P[max_r] = P[max_r], P[k]
            # Swap previously calculated L entries up to col k-1
            for j in range(k):
                L[k][j], L[max_r][j] = L[max_r][j], L[k][j]
            piv_swaps += 1
            if len(steps) < 15:
                steps.append(f"Partial pivot swap: Row {k+1} <-> Row {max_r+1} (pivot = {U[k][k]:.4g})")
                
        pivot = U[k][k]
        
        # 2. Compute multipliers and eliminate below pivot
        for i in range(k + 1, n):
            factor = U[i][k] / pivot
            L[i][k] = factor
            U[i][k] = 0.0 # Upper triangular zeros below diagonal
            for j in range(k + 1, n):
                U[i][j] -= factor * U[k][j]
            if len(steps) < 15:
                steps.append(f"L[{i+1},{k+1}] = {factor:.4g}; Row {i+1} = Row {i+1} - ({factor:.4g}) * Row {k+1}")
                
    steps.append("Successfully factored PA = LU.")
    return P, L, U, piv_swaps, steps, True

def forward_substitution(L, b, tolerance=1e-12):
    """
    Solves Ly = b where L is lower triangular with 1s on diagonal (unit lower triangular).
    y_i = b_i - sum_{j=0}^{i-1} L_{ij} y_j
    """
    n = len(L)
    y = [0.0] * n
    steps = ["Solving Ly = Pb via Forward Substitution:"]
    
    for i in range(n):
        s = float(b[i])
        for j in range(i):
            s -= L[i][j] * y[j]
        diag = L[i][i]
        if abs(diag) < tolerance:
            raise ValueError(f"Zero diagonal entry encountered in L at index {i}")
        y[i] = s / diag
        if len(steps) < 10:
            steps.append(f"  y_{i+1} = ({b[i]:.4g} - sum) / {diag:.4g} = {y[i]:.6g}")
            
    return y, steps

def backward_substitution(U, y, tolerance=1e-12):
    """
    Solves Ux = y where U is upper triangular.
    x_i = (y_i - sum_{j=i+1}^{n-1} U_{ij} x_j) / U_{ii}
    """
    n = len(U)
    x = [0.0] * n
    steps = ["Solving Ux = y via Backward Substitution:"]
    
    for i in range(n - 1, -1, -1):
        s = float(y[i])
        for j in range(i + 1, n):
            s -= U[i][j] * x[j]
        diag = U[i][i]
        if abs(diag) < tolerance:
            raise ValueError(f"Zero diagonal entry in U at index {i} (Singular system)")
        x[i] = s / diag
        if len(steps) < 10:
            steps.append(f"  x_{i+1} = ({y[i]:.4g} - sum) / {diag:.4g} = {x[i]:.6g}")
            
    return x, steps

def solve_lu_decomposition(A, b, tolerance=1e-10):
    """
    Solves Ax = b using LU decomposition with partial pivoting (PA = LU).
    Time Complexity: O(n^3)
    Space Complexity: O(n^2)
    """
    start_time = time.perf_counter()
    rA, cA = matrix_shape(A)
    if rA != cA:
        return {
            'method': 'LU Decomposition',
            'status': 'Not Applicable',
            'classification': 'Invalid Dimensions',
            'solution': None,
            'steps': [f"LU decomposition requires a square matrix. Given {rA}x{cA}."],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': 'LU decomposition requires a square matrix.',
            'complexity': 'O(n^3)'
        }
        
    n = rA
    P, L, U, swaps, steps, success = lu_factorization(A, tolerance)
    
    if not success:
        return {
            'method': 'LU Decomposition',
            'status': 'Singular Matrix',
            'classification': 'Singular',
            'solution': None,
            'P': P, 'L': L, 'U': U,
            'steps': steps + ["Matrix is singular or near-singular (zero pivot encountered in U). Cannot complete LU solve."],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': 'Encountered zero pivot during LU decomposition. System is singular.',
            'complexity': 'O(n^3)'
        }
        
    # Apply permutation P to vector b: Pb = P * b
    Pb = [0.0] * n
    for i in range(n):
        s = 0.0
        for j in range(n):
            s += P[i][j] * float(b[j])
        Pb[i] = s
    steps.append(f"Applied row permutations: vector b transformed to Pb.")
    
    try:
        # Step 2: Ly = Pb
        y, forward_steps = forward_substitution(L, Pb, tolerance)
        steps.extend(forward_steps)
        
        # Step 3: Ux = y
        x, backward_steps = backward_substitution(U, y, tolerance)
        steps.extend(backward_steps)
    except ValueError as e:
        return {
            'method': 'LU Decomposition',
            'status': 'Singular Matrix',
            'classification': 'Singular',
            'solution': None,
            'P': P, 'L': L, 'U': U,
            'steps': steps + [str(e)],
            'execution_time_ms': (time.perf_counter() - start_time) * 1000.0,
            'residual': None,
            'message': str(e),
            'complexity': 'O(n^3)'
        }
        
    solution = [round(val, 8) for val in x]
    residual = compute_residual(A, solution, b)
    steps.append(f"Verified solution: Max residual ||Ax - b||_inf = {residual['norm_inf']:.2e}")
    
    # Round matrices for clean display
    P_clean = [[round(v, 4) for v in row] for row in P]
    L_clean = [[round(v, 4) for v in row] for row in L]
    U_clean = [[round(v, 4) for v in row] for row in U]
    y_clean = [round(v, 6) for v in y]
    
    execution_time_ms = (time.perf_counter() - start_time) * 1000.0
    return {
        'method': 'LU Decomposition',
        'status': 'Success',
        'classification': 'Unique',
        'solution': solution,
        'P': P_clean,
        'L': L_clean,
        'U': U_clean,
        'intermediate_y': y_clean,
        'steps': steps,
        'execution_time_ms': execution_time_ms,
        'residual': residual,
        'message': 'Solved successfully using PA = LU decomposition, forward and backward substitution.',
        'complexity': 'O(n^3)'
    }
