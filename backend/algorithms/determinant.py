"""
Determinant calculation algorithms implemented strictly from scratch.
1. Gaussian Elimination method O(n^3)
2. Recursive Laplace Cofactor Expansion O(n!)
"""
import math
from algorithms.matrix_operations import matrix_shape, deep_copy_matrix

def determinant_elimination(A, tolerance=1e-12):
    """
    Computes determinant using Gaussian elimination with partial pivoting.
    Time Complexity: O(n^3)
    Space Complexity: O(n^2)
    Returns: {
        'determinant': float,
        'steps': list of str,
        'upper_triangular': 2D list,
        'swaps': int,
        'method': 'Gaussian Elimination'
    }
    """
    r, c = matrix_shape(A)
    if r != c:
        raise ValueError(f"Determinant requires a square matrix. Received shape ({r}x{c}).")
    n = r
    if n == 0:
        return {'determinant': 0.0, 'steps': ["Empty matrix determinant is 0."], 'upper_triangular': [], 'swaps': 0}
    if n == 1:
        return {'determinant': float(A[0][0]), 'steps': [f"1x1 matrix determinant is single element: {A[0][0]}"], 'upper_triangular': [[float(A[0][0])]], 'swaps': 0}
    
    U = [[float(val) for val in row] for row in A]
    sign = 1.0
    swaps = 0
    steps = [f"Initial {n}x{n} matrix. Using partial pivoting to eliminate sub-diagonal elements."]
    
    for i in range(n):
        # Partial pivoting: find maximum element in column i from row i down to n-1
        pivot_row = i
        max_val = abs(U[i][i])
        for k in range(i + 1, n):
            if abs(U[k][i]) > max_val:
                max_val = abs(U[k][i])
                pivot_row = k
        
        if max_val < tolerance:
            steps.append(f"Column {i+1} has all zero pivots (max value < {tolerance}). Determinant is 0 (singular matrix).")
            return {
                'determinant': 0.0,
                'steps': steps,
                'upper_triangular': U,
                'swaps': swaps,
                'method': 'Gaussian Elimination'
            }
        
        # Swap rows if necessary
        if pivot_row != i:
            U[i], U[pivot_row] = U[pivot_row], U[i]
            sign *= -1.0
            swaps += 1
            steps.append(f"Row swap: R{i+1} <-> R{pivot_row+1}. Swapping rows changes determinant sign (multiplier now {sign:+g}).")
        
        # Eliminate rows below pivot
        pivot = U[i][i]
        for k in range(i + 1, n):
            factor = U[k][i] / pivot
            if abs(factor) > tolerance:
                for j in range(i, n):
                    U[k][j] -= factor * U[i][j]
                if len(steps) < 15:
                    steps.append(f"R{k+1} = R{k+1} - ({factor:.4g}) * R{i+1}")
    
    # Determinant is sign * product of diagonal elements
    det = sign
    diag_terms = []
    for i in range(n):
        diag_val = U[i][i]
        det *= diag_val
        if len(diag_terms) < 6:
            diag_terms.append(f"{diag_val:.4g}")
    
    diag_str = " * ".join(diag_terms)
    if n > 6:
        diag_str += " * ..."
    steps.append(f"Determinant = sign({sign:+g}) * product(diagonals) = {sign:+g} * ({diag_str}) = {det:.6g}")
    
    # Handle floating point precision edge case (e.g. -0.0)
    if abs(det) < tolerance:
        det = 0.0
    else:
        det = round(det, 10)
        
    return {
        'determinant': det,
        'steps': steps,
        'upper_triangular': U,
        'swaps': swaps,
        'method': 'Gaussian Elimination'
    }

def get_minor_matrix(A, row_to_remove, col_to_remove):
    """Returns submatrix excluding given row and column."""
    return [
        [row[c] for c in range(len(row)) if c != col_to_remove]
        for r, row in enumerate(A) if r != row_to_remove
    ]

class CofactorCounter:
    def __init__(self):
        self.recursive_calls = 0

def _cofactor_recursive(A, counter, depth=0, collect_steps=False, step_list=None):
    counter.recursive_calls += 1
    n = len(A)
    if n == 1:
        return float(A[0][0])
    if n == 2:
        val = float(A[0][0]) * float(A[1][1]) - float(A[0][1]) * float(A[1][0])
        if collect_steps and step_list is not None and len(step_list) < 25:
            step_list.append(f"  {'  '*depth}2x2 det: ({A[0][0]}*{A[1][1]}) - ({A[0][1]}*{A[1][0]}) = {val:.4g}")
        return val
    
    det = 0.0
    for j in range(n):
        sign = 1.0 if (j % 2 == 0) else -1.0
        element = float(A[0][j])
        if abs(element) < 1e-15:
            continue
        submatrix = get_minor_matrix(A, 0, j)
        sub_det = _cofactor_recursive(submatrix, counter, depth + 1, collect_steps, step_list)
        term = sign * element * sub_det
        det += term
        if collect_steps and step_list is not None and depth <= 1 and len(step_list) < 25:
            step_list.append(f"{'  '*depth}Expanding along col {j+1}: sign({sign:+g}) * A[1,{j+1}]({element:.4g}) * M_1,{j+1}({sub_det:.4g}) = {term:.4g}")
    return det

def determinant_cofactor(A, max_dimension=8):
    """
    Computes determinant using recursive Laplace cofactor expansion along row 0.
    Time Complexity: O(n!)
    Space Complexity: O(n^2) recursion stack
    Returns: {
        'determinant': float,
        'steps': list of str,
        'recursive_calls': int,
        'method': 'Recursive Cofactor Expansion',
        'complexity': 'O(n!)'
    }
    """
    r, c = matrix_shape(A)
    if r != c:
        raise ValueError(f"Determinant requires a square matrix. Received shape ({r}x{c}).")
    n = r
    if n > max_dimension:
        raise ValueError(f"Recursive Cofactor expansion is restricted to <= {max_dimension}x{max_dimension} (given {n}x{n}) because its time complexity is O(n!) ({math.factorial(n):,} operations). Use Gaussian elimination O(n^3) instead.")
    
    counter = CofactorCounter()
    steps = [f"Computing determinant of {n}x{n} matrix using recursive Laplace cofactor expansion along Row 1."]
    collect_steps = (n <= 4)
    
    det = _cofactor_recursive(A, counter, depth=0, collect_steps=collect_steps, step_list=steps)
    if abs(det) < 1e-12:
        det = 0.0
    else:
        det = round(det, 10)
        
    steps.append(f"Completed recursive expansion with {counter.recursive_calls:,} total recursive calls. Result = {det:.6g}")
    return {
        'determinant': det,
        'steps': steps,
        'recursive_calls': counter.recursive_calls,
        'method': 'Recursive Cofactor Expansion',
        'complexity': f"O(n!) ~ {math.factorial(n):,} operations for n={n}"
    }
