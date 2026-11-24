"""
Solution Classification based on Rouché-Capelli Theorem using Matrix Rank.
Implemented strictly from scratch.
"""
from algorithms.matrix_operations import matrix_shape, compute_residual
from algorithms.matrix_rank import compute_augmented_rank

def classify_system(A, b, tolerance=1e-9):
    """
    Classifies a linear system Ax = b using the Rouché-Capelli Theorem:
    1. Unique Solution: rank(A) == rank([A|b]) == n
    2. Infinite Solutions: rank(A) == rank([A|b]) < n
    3. Inconsistent System: rank(A) != rank([A|b])
    
    Returns: {
        'classification': 'Unique' | 'Infinite' | 'Inconsistent',
        'rank_A': int,
        'rank_augmented': int,
        'num_variables': int,
        'degrees_of_freedom': int,
        'explanation': str,
        'steps': list of str,
        'parametric_solution': dict | None,
        'contradiction': str | None,
        'condition_summary': str
    }
    """
    rA, cA = matrix_shape(A)
    aug_res = compute_augmented_rank(A, b, tolerance)
    rank_A = aug_res['rank_A']
    rank_Aug = aug_res['rank_augmented']
    n = cA
    steps = list(aug_res['steps'])
    
    classification = None
    explanation = None
    parametric = None
    contradiction = None
    degrees_of_freedom = 0
    condition_summary = ""
    
    if rank_A != rank_Aug:
        classification = "Inconsistent"
        condition_summary = f"rank(A) = {rank_A} ≠ rank([A|b]) = {rank_Aug}"
        
        # Locate contradictory row in augmented echelon
        echelon = aug_res['augmented_echelon']
        contradictory_row_idx = None
        for i, row in enumerate(echelon):
            all_a_zero = all(abs(val) < tolerance for val in row[:n])
            b_nonzero = abs(row[n]) > tolerance
            if all_a_zero and b_nonzero:
                contradictory_row_idx = i
                contradiction = f"Row {i+1} reduces to: 0 = {row[n]:.4g}, which is mathematically impossible."
                break
        
        if not contradiction:
            contradiction = "Augmented matrix rank exceeds coefficient matrix rank, indicating conflicting constraints."
            
        explanation = (
            f"The system has NO SOLUTION (Inconsistent System).\n"
            f"According to the Rouché-Capelli theorem, when rank(A) ({rank_A}) < rank([A|b]) ({rank_Aug}), "
            f"the equations represent non-intersecting or conflicting hyperplanes.\n"
            f"{contradiction}"
        )
        steps.append(explanation)
        
    elif rank_A == rank_Aug and rank_A == n:
        classification = "Unique"
        degrees_of_freedom = 0
        condition_summary = f"rank(A) = rank([A|b]) = {rank_A} = n ({n})"
        explanation = (
            f"The system has a UNIQUE SOLUTION.\n"
            f"rank(A) = rank([A|b]) = {rank_A} equals the number of unknowns (n = {n}).\n"
            f"The coefficient matrix columns are linearly independent, intersecting at exactly one point in R^{n}."
        )
        steps.append(explanation)
        
    else: # rank_A == rank_Aug < n
        classification = "Infinite"
        degrees_of_freedom = n - rank_A
        condition_summary = f"rank(A) = rank([A|b]) = {rank_A} < n ({n})"
        
        # Construct parametric representation
        parametric = _compute_parametric_form(A, b, rank_A, tolerance)
        
        explanation = (
            f"The system has INFINITELY MANY SOLUTIONS.\n"
            f"rank(A) = rank([A|b]) = {rank_A} < n ({n}), giving {degrees_of_freedom} degree(s) of freedom "
            f"(free variable{'s' if degrees_of_freedom > 1 else ''}).\n"
            f"The solution forms an affine subspace (flat/hyperplane) in R^{n}."
        )
        steps.append(explanation)
        if parametric and 'parametric_expression' in parametric:
            steps.append(f"Parametric Form:\n{parametric['parametric_expression']}")

    return {
        'classification': classification,
        'rank_A': rank_A,
        'rank_augmented': rank_Aug,
        'num_variables': n,
        'num_equations': rA,
        'degrees_of_freedom': degrees_of_freedom,
        'explanation': explanation,
        'steps': steps,
        'parametric_solution': parametric,
        'contradiction': contradiction,
        'condition_summary': condition_summary,
        'augmented_echelon': aug_res['augmented_echelon']
    }

def _compute_parametric_form(A, b, rank, tolerance=1e-9):
    """
    Computes particular solution x_p and null-space basis vectors for parametric form:
    x = x_p + t_1 * v_1 + t_2 * v_2 + ...
    """
    r, c = matrix_shape(A)
    # Perform Gauss-Jordan elimination on [A | b] to obtain RREF
    M = [[float(A[i][j]) for j in range(c)] + [float(b[i])] for i in range(r)]
    
    pivot_row = 0
    pivot_cols = []
    
    for col in range(c):
        if pivot_row >= r:
            break
        max_val = abs(M[pivot_row][col])
        max_r = pivot_row
        for i in range(pivot_row + 1, r):
            if abs(M[i][col]) > max_val:
                max_val = abs(M[i][col])
                max_r = i
        
        if max_val < tolerance:
            continue
            
        M[pivot_row], M[max_r] = M[max_r], M[pivot_row]
        pivot = M[pivot_row][col]
        # Normalize pivot row
        for j in range(col, c + 1):
            M[pivot_row][j] /= pivot
            
        # Eliminate all other rows (above and below)
        for i in range(r):
            if i != pivot_row and abs(M[i][col]) > tolerance:
                factor = M[i][col]
                for j in range(col, c + 1):
                    M[i][j] -= factor * M[pivot_row][j]
                    
        pivot_cols.append(col)
        pivot_row += 1
        
    free_cols = [j for j in range(c) if j not in pivot_cols]
    
    # Particular solution: set all free variables to 0
    x_particular = [0.0] * c
    for row_idx, p_col in enumerate(pivot_cols):
        x_particular[p_col] = round(M[row_idx][c], 6)
        
    # Basis vectors for null space (one per free variable)
    null_basis = []
    for free_idx, free_col in enumerate(free_cols):
        v = [0.0] * c
        v[free_col] = 1.0 # Free variable set to 1
        for row_idx, p_col in enumerate(pivot_cols):
            # In RREF: x_{p_col} + M[row_idx][free_col] * x_{free_col} = 0 -> x_{p_col} = -M[row_idx][free_col]
            v[p_col] = round(-M[row_idx][free_col], 6)
        null_basis.append({
            'parameter': f"t_{free_idx + 1}",
            'free_variable': f"x_{free_col + 1}",
            'vector': v
        })
        
    # Generate human-readable parametric formula
    lines = []
    for j in range(c):
        parts = []
        if abs(x_particular[j]) > tolerance or not null_basis:
            parts.append(f"{x_particular[j]:.4g}")
        for nb in null_basis:
            coeff = nb['vector'][j]
            if abs(coeff) > tolerance:
                if coeff == 1.0:
                    parts.append(f"+ {nb['parameter']}")
                elif coeff == -1.0:
                    parts.append(f"- {nb['parameter']}")
                elif coeff > 0:
                    parts.append(f"+ {coeff:.4g}*{nb['parameter']}")
                else:
                    parts.append(f"- {abs(coeff):.4g}*{nb['parameter']}")
        line_str = " ".join(parts).lstrip("+ ").strip()
        if not line_str:
            line_str = "0"
        lines.append(f"x_{j+1} = {line_str}")
        
    return {
        'particular_solution': x_particular,
        'free_variables': [f"x_{fc + 1}" for fc in free_cols],
        'pivot_variables': [f"x_{pc + 1}" for pc in pivot_cols],
        'null_basis': null_basis,
        'parametric_expression': "\n".join(lines),
        'variable_expressions': lines
    }
