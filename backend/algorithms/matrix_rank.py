"""
Matrix Rank calculation implemented strictly from scratch using Gaussian Elimination.
"""
from algorithms.matrix_operations import matrix_shape, deep_copy_matrix

def compute_rank(A, tolerance=1e-10):
    """
    Computes the rank of an m x n matrix A by converting to Row Echelon Form (REF)
    using Gaussian elimination with partial pivoting.
    Time Complexity: O(m * n * min(m, n))
    Returns: {
        'rank': int,
        'row_echelon_form': list of list,
        'steps': list of str,
        'rows': int,
        'cols': int
    }
    """
    r, c = matrix_shape(A)
    if r == 0 or c == 0:
        return {'rank': 0, 'row_echelon_form': [], 'steps': ["Empty matrix has rank 0."], 'rows': r, 'cols': c}
    
    M = [[float(val) for val in row] for row in A]
    steps = [f"Initial {r}x{c} matrix. Transforming to Row Echelon Form (REF) using Gaussian elimination."]
    
    pivot_row = 0
    pivot_cols = []
    
    for col in range(c):
        if pivot_row >= r:
            break
        
        # Find pivot in this column at or below pivot_row
        max_val = abs(M[pivot_row][col])
        max_r = pivot_row
        for i in range(pivot_row + 1, r):
            if abs(M[i][col]) > max_val:
                max_val = abs(M[i][col])
                max_r = i
        
        # If column elements below pivot_row are zero, move to next column
        if max_val < tolerance:
            continue
        
        # Swap rows if necessary
        if max_r != pivot_row:
            M[pivot_row], M[max_r] = M[max_r], M[pivot_row]
            if len(steps) < 20:
                steps.append(f"Swap R{pivot_row+1} <-> R{max_r+1} (pivot={M[pivot_row][col]:.4g} in col {col+1})")
        
        pivot_val = M[pivot_row][col]
        pivot_cols.append(col)
        
        # Eliminate below pivot
        for i in range(pivot_row + 1, r):
            factor = M[i][col] / pivot_val
            if abs(factor) > tolerance:
                for j in range(col, c):
                    M[i][j] -= factor * M[pivot_row][j]
                if len(steps) < 20:
                    steps.append(f"R{i+1} = R{i+1} - ({factor:.4g}) * R{pivot_row+1}")
        
        pivot_row += 1
    
    # Count non-zero rows in REF
    rank = 0
    for i in range(r):
        is_nonzero = any(abs(M[i][j]) > tolerance for j in range(c))
        if is_nonzero:
            rank += 1
            
    # Round tiny numbers for clean display
    for i in range(r):
        for j in range(c):
            if abs(M[i][j]) < tolerance:
                M[i][j] = 0.0
            else:
                M[i][j] = round(M[i][j], 6)
                
    steps.append(f"Identified {rank} non-zero row(s) in Row Echelon Form. Rank = {rank}.")
    return {
        'rank': rank,
        'row_echelon_form': M,
        'steps': steps,
        'pivot_cols': pivot_cols,
        'rows': r,
        'cols': c
    }

def compute_augmented_rank(A, b, tolerance=1e-10):
    """
    Constructs augmented matrix [A | b] and computes rank(A) and rank([A | b]).
    Returns: {
        'rank_A': int,
        'rank_augmented': int,
        'num_variables': int,
        'num_equations': int,
        'augmented_echelon': list of list,
        'steps': list of str
    }
    """
    r, c = matrix_shape(A)
    if r != len(b):
        raise ValueError(f"Matrix rows ({r}) must match vector b length ({len(b)})")
    
    # Construct [A | b]
    Aug = [[float(A[i][j]) for j in range(c)] + [float(b[i])] for i in range(r)]
    total_cols = c + 1
    steps = [f"Constructed augmented matrix [A | b] of dimension {r}x{total_cols}."]
    
    pivot_row = 0
    for col in range(c):
        if pivot_row >= r:
            break
        
        max_val = abs(Aug[pivot_row][col])
        max_r = pivot_row
        for i in range(pivot_row + 1, r):
            if abs(Aug[i][col]) > max_val:
                max_val = abs(Aug[i][col])
                max_r = i
        
        if max_val < tolerance:
            continue
        
        if max_r != pivot_row:
            Aug[pivot_row], Aug[max_r] = Aug[max_r], Aug[pivot_row]
            if len(steps) < 20:
                steps.append(f"Swap R{pivot_row+1} <-> R{max_r+1}")
        
        pivot_val = Aug[pivot_row][col]
        for i in range(pivot_row + 1, r):
            factor = Aug[i][col] / pivot_val
            if abs(factor) > tolerance:
                for j in range(col, total_cols):
                    Aug[i][j] -= factor * Aug[pivot_row][j]
                if len(steps) < 20:
                    steps.append(f"R{i+1} = R{i+1} - ({factor:.4g}) * R{pivot_row+1}")
        
        pivot_row += 1
    
    # Compute rank of A (first c columns) and rank of [A | b] (all total_cols columns)
    rank_A = 0
    rank_Aug = 0
    for i in range(r):
        row_A_nonzero = any(abs(Aug[i][j]) > tolerance for j in range(c))
        row_Aug_nonzero = row_A_nonzero or (abs(Aug[i][c]) > tolerance)
        if row_A_nonzero:
            rank_A += 1
        if row_Aug_nonzero:
            rank_Aug += 1
            
    # Clean up small values
    for i in range(r):
        for j in range(total_cols):
            if abs(Aug[i][j]) < tolerance:
                Aug[i][j] = 0.0
            else:
                Aug[i][j] = round(Aug[i][j], 6)
                
    steps.append(f"Rank of coefficient matrix rank(A) = {rank_A}")
    steps.append(f"Rank of augmented matrix rank([A|b]) = {rank_Aug}")
    steps.append(f"Number of unknowns/variables n = {c}")
    
    return {
        'rank_A': rank_A,
        'rank_augmented': rank_Aug,
        'num_variables': c,
        'num_equations': r,
        'augmented_echelon': Aug,
        'steps': steps
    }
