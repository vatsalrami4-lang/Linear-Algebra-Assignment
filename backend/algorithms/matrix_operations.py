"""
Matrix Operations implemented strictly from scratch without NumPy / SciPy.
"""
import random
import math

def matrix_shape(M):
    """Returns (rows, cols) of a 2D matrix M."""
    if not isinstance(M, list) or len(M) == 0:
        return (0, 0)
    if not isinstance(M[0], list):
        return (len(M), 1)
    return (len(M), len(M[0]))

def deep_copy_matrix(M):
    """Returns a deep copy of a 2D matrix M."""
    return [row[:] for row in M]

def deep_copy_vector(v):
    """Returns a copy of a 1D vector v."""
    return list(v)

def matrix_add(A, B):
    """
    Computes A + B for matrices of equal dimensions.
    Returns (result_matrix, steps_explanation)
    """
    rA, cA = matrix_shape(A)
    rB, cB = matrix_shape(B)
    if rA != rB or cA != cB:
        raise ValueError(f"Matrix dimensions must match for addition: ({rA}x{cA}) vs ({rB}x{cB})")
    
    C = [[0.0] * cA for _ in range(rA)]
    sample_steps = []
    for i in range(rA):
        for j in range(cA):
            val = float(A[i][j]) + float(B[i][j])
            C[i][j] = val
            if len(sample_steps) < 5:
                sample_steps.append(f"C[{i+1},{j+1}] = {A[i][j]} + {B[i][j]} = {val:.4g}")
    
    steps = f"Performed element-wise addition over {rA}x{cA} matrix.\n" + "\n".join(sample_steps)
    if rA * cA > 5:
        steps += f"\n... and {rA * cA - 5} more elements."
    return C, steps

def matrix_subtract(A, B):
    """
    Computes A - B for matrices of equal dimensions.
    Returns (result_matrix, steps_explanation)
    """
    rA, cA = matrix_shape(A)
    rB, cB = matrix_shape(B)
    if rA != rB or cA != cB:
        raise ValueError(f"Matrix dimensions must match for subtraction: ({rA}x{cA}) vs ({rB}x{cB})")
    
    C = [[0.0] * cA for _ in range(rA)]
    sample_steps = []
    for i in range(rA):
        for j in range(cA):
            val = float(A[i][j]) - float(B[i][j])
            C[i][j] = val
            if len(sample_steps) < 5:
                sample_steps.append(f"C[{i+1},{j+1}] = {A[i][j]} - {B[i][j]} = {val:.4g}")
    
    steps = f"Performed element-wise subtraction over {rA}x{cA} matrix.\n" + "\n".join(sample_steps)
    if rA * cA > 5:
        steps += f"\n... and {rA * cA - 5} more elements."
    return C, steps

def matrix_multiply(A, B):
    """
    Computes A * B for matrices where cols(A) == rows(B).
    Returns (result_matrix, steps_explanation)
    """
    rA, cA = matrix_shape(A)
    rB, cB = matrix_shape(B)
    if cA != rB:
        raise ValueError(f"Inner dimensions must match for multiplication: columns of A ({cA}) != rows of B ({rB})")
    
    C = [[0.0] * cB for _ in range(rA)]
    sample_steps = []
    for i in range(rA):
        for j in range(cB):
            dot_terms = []
            s = 0.0
            for k in range(cA):
                term = float(A[i][k]) * float(B[k][j])
                s += term
                if len(dot_terms) < 4:
                    dot_terms.append(f"({A[i][k]} * {B[k][j]})")
            C[i][j] = s
            if len(sample_steps) < 4:
                terms_str = " + ".join(dot_terms)
                if cA > 4:
                    terms_str += " + ..."
                sample_steps.append(f"C[{i+1},{j+1}] = {terms_str} = {s:.4g}")
    
    steps = f"Multiplied ({rA}x{cA}) by ({rB}x{cB}) -> resulting in ({rA}x{cB}).\n" + "\n".join(sample_steps)
    if rA * cB > 4:
        steps += f"\n... total {rA * cB} entries computed via inner dot products."
    return C, steps

def matrix_transpose(A):
    """
    Computes transpose A^T of matrix A.
    Returns (result_matrix, steps_explanation)
    """
    rA, cA = matrix_shape(A)
    if rA == 0 or cA == 0:
        return [], "Empty matrix."
    
    AT = [[A[i][j] for i in range(rA)] for j in range(cA)]
    steps = f"Transposed ({rA}x{cA}) matrix to ({cA}x{rA}) matrix: entry (i,j) mapped to (j,i)."
    return AT, steps

def matrix_identity(n):
    """
    Generates n x n identity matrix I_n.
    Returns (result_matrix, steps_explanation)
    """
    if n < 1:
        raise ValueError("Identity matrix dimension n must be >= 1")
    I = [[1.0 if i == j else 0.0 for j in range(n)] for i in range(n)]
    steps = f"Generated {n}x{n} Identity matrix with 1s along the main diagonal and 0s elsewhere."
    return I, steps

def matrix_vector_multiply(A, v):
    """
    Multiplies matrix A (m x n) by vector v (n).
    Returns vector of length m.
    """
    rA, cA = matrix_shape(A)
    if cA != len(v):
        raise ValueError(f"Matrix columns ({cA}) does not match vector length ({len(v)})")
    
    res = [0.0] * rA
    for i in range(rA):
        s = 0.0
        for j in range(cA):
            s += float(A[i][j]) * float(v[j])
        res[i] = s
    return res

def vector_norm_inf(v):
    """Computes infinity norm: max |v_i|."""
    if not v:
        return 0.0
    return max(abs(float(x)) for x in v)

def vector_norm_2(v):
    """Computes Euclidean L2 norm: sqrt(sum(v_i^2))."""
    if not v:
        return 0.0
    return math.sqrt(sum(float(x) ** 2 for x in v))

def compute_residual(A, x, b):
    """
    Computes residual vector r = Ax - b and returns:
    {
        'residual_vector': r,
        'norm_inf': ||r||_inf,
        'norm_2': ||r||_2,
        'max_error': max |(Ax)_i - b_i|
    }
    """
    Ax = matrix_vector_multiply(A, x)
    r = [Ax[i] - float(b[i]) for i in range(len(b))]
    norm_inf = vector_norm_inf(r)
    norm_2 = vector_norm_2(r)
    return {
        'residual_vector': r,
        'norm_inf': norm_inf,
        'norm_2': norm_2,
        'max_error': norm_inf
    }

def random_matrix(rows, cols, min_val=-10, max_val=10, integer_only=True):
    """Generates a random rows x cols matrix."""
    M = []
    for _ in range(rows):
        if integer_only:
            row = [random.randint(int(min_val), int(max_val)) for _ in range(cols)]
        else:
            row = [round(random.uniform(min_val, max_val), 2) for _ in range(cols)]
        M.append(row)
    return M

def random_vector(n, min_val=-10, max_val=10, integer_only=True):
    """Generates a random vector of length n."""
    if integer_only:
        return [random.randint(int(min_val), int(max_val)) for _ in range(n)]
    return [round(random.uniform(min_val, max_val), 2) for _ in range(n)]
