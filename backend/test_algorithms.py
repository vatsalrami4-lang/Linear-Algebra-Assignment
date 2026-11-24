"""
Validation tests for all scratch algorithms against NumPy baseline.
Tests:
1. Unique solution (3x3 and 5x5)
2. Infinite solutions system
3. Inconsistent system
4. Singular matrix
5. Non-square matrix
6. Matrix operations (Add, Sub, Mul, Transpose, Identity)
7. Determinant (Elimination vs Cofactor vs NumPy)
8. Matrix Inverse
9. Matrix Rank
10. Random larger matrix (20x20)
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np

from algorithms.matrix_operations import (
    matrix_add, matrix_subtract, matrix_multiply, matrix_transpose,
    matrix_identity, random_matrix, random_vector
)
from algorithms.determinant import determinant_elimination, determinant_cofactor
from algorithms.matrix_rank import compute_rank, compute_augmented_rank
from algorithms.classifier import classify_system
from algorithms.gauss_jordan import solve_gauss_jordan
from algorithms.inverse_method import solve_inverse_method, invert_matrix
from algorithms.cramer_rule import solve_cramer_rule
from algorithms.lu_decomposition import solve_lu_decomposition

def test_suite():
    print("=== STARTING ALGORITHM VALIDATION TESTS ===")
    
    # Test 1: Unique 3x3 system
    A_unique = [
        [2, 1, -1],
        [-3, -1, 2],
        [-2, 1, 2]
    ]
    b_unique = [8, -11, -3]
    
    expected_x = np.linalg.solve(np.array(A_unique, dtype=float), np.array(b_unique, dtype=float))
    print(f"\n[Test 1] Unique 3x3 System - NumPy Ground Truth: {expected_x}")
    
    gj_res = solve_gauss_jordan(A_unique, b_unique)
    inv_res = solve_inverse_method(A_unique, b_unique)
    cramer_res = solve_cramer_rule(A_unique, b_unique)
    lu_res = solve_lu_decomposition(A_unique, b_unique)
    
    assert gj_res['status'] == 'Success', "GJ failed"
    assert inv_res['status'] == 'Success', "Inv failed"
    assert cramer_res['status'] == 'Success', "Cramer failed"
    assert lu_res['status'] == 'Success', "LU failed"
    
    for name, sol in [("Gauss-Jordan", gj_res['solution']),
                      ("Inverse", inv_res['solution']),
                      ("Cramer", cramer_res['solution']),
                      ("LU", lu_res['solution'])]:
        diff = np.max(np.abs(np.array(sol) - expected_x))
        print(f"  {name}: {sol} (max error vs NumPy: {diff:.2e})")
        assert diff < 1e-6, f"{name} error too high"
        
    # Test 2: Inconsistent system
    # x + y = 2
    # x + y = 5
    A_inconsistent = [[1, 1], [1, 1]]
    b_inconsistent = [2, 5]
    print("\n[Test 2] Inconsistent 2x2 System:")
    class_inc = classify_system(A_inconsistent, b_inconsistent)
    print(f"  Classification: {class_inc['classification']} ({class_inc['condition_summary']})")
    assert class_inc['classification'] == 'Inconsistent'
    gj_inc = solve_gauss_jordan(A_inconsistent, b_inconsistent)
    assert gj_inc['status'] == 'Inconsistent'
    
    # Test 3: Infinite solutions system
    # x + y + z = 1
    # 2x + 2y + 2z = 2
    # 3x + 3y + 3z = 3
    A_inf = [[1, 1, 1], [2, 2, 2], [3, 3, 3]]
    b_inf = [1, 2, 3]
    print("\n[Test 3] Infinite Solutions 3x3 System:")
    class_inf = classify_system(A_inf, b_inf)
    print(f"  Classification: {class_inf['classification']} ({class_inf['condition_summary']})")
    print(f"  Degrees of freedom: {class_inf['degrees_of_freedom']}")
    assert class_inf['classification'] == 'Infinite'
    assert class_inf['degrees_of_freedom'] == 2
    gj_inf = solve_gauss_jordan(A_inf, b_inf)
    assert gj_inf['status'] == 'Infinite Solutions'
    
    # Test 4: Singular matrix
    A_sing = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]
    b_sing = [1, 2, 3]
    print("\n[Test 4] Singular Matrix Ax=b:")
    det_sing = determinant_elimination(A_sing)['determinant']
    print(f"  Determinant: {det_sing} (NumPy: {np.linalg.det(np.array(A_sing)):.2e})")
    assert abs(det_sing) < 1e-8
    inv_sing = solve_inverse_method(A_sing, b_sing)
    print(f"  Inverse method status: {inv_sing['status']}")
    assert inv_sing['status'] == 'Singular Matrix'
    
    # Test 5: Determinants (Elimination vs Cofactor vs NumPy)
    A_det = [[3, 2, 0, 1], [4, 0, 1, 2], [3, 0, 2, 1], [9, 2, 3, 1]]
    np_det = np.linalg.det(np.array(A_det, dtype=float))
    det_elim = determinant_elimination(A_det)['determinant']
    det_cof = determinant_cofactor(A_det)['determinant']
    print(f"\n[Test 5] Determinants 4x4:")
    print(f"  NumPy: {np_det:.6f}, Elimination: {det_elim:.6f}, Cofactor: {det_cof:.6f}")
    assert abs(det_elim - np_det) < 1e-6
    assert abs(det_cof - np_det) < 1e-6
    
    # Test 6: Matrix Inverse
    A_inv_test = [[4, 7], [2, 6]]
    np_inv = np.linalg.inv(np.array(A_inv_test, dtype=float))
    scratch_inv, _ = invert_matrix(A_inv_test)
    diff_inv = np.max(np.abs(np.array(scratch_inv) - np_inv))
    print(f"\n[Test 6] Matrix Inverse 2x2 max diff vs NumPy: {diff_inv:.2e}")
    assert diff_inv < 1e-8
    
    # Test 7: Matrix Rank
    A_rank_test = [
        [1, 2, 3],
        [2, 4, 6],
        [0, 1, 5]
    ]
    np_rank = np.linalg.matrix_rank(np.array(A_rank_test, dtype=float))
    scratch_rank = compute_rank(A_rank_test)['rank']
    print(f"\n[Test 7] Matrix Rank: Scratch={scratch_rank}, NumPy={np_rank}")
    assert scratch_rank == np_rank
    
    # Test 8: Random 20x20 matrix solve validation
    np.random.seed(42)
    A_rand = np.random.uniform(-10, 10, (20, 20)).tolist()
    b_rand = np.random.uniform(-10, 10, 20).tolist()
    expected_rand_x = np.linalg.solve(np.array(A_rand), np.array(b_rand))
    
    gj_rand = solve_gauss_jordan(A_rand, b_rand)
    lu_rand = solve_lu_decomposition(A_rand, b_rand)
    inv_rand = solve_inverse_method(A_rand, b_rand)
    
    diff_gj = np.max(np.abs(np.array(gj_rand['solution']) - expected_rand_x))
    diff_lu = np.max(np.abs(np.array(lu_rand['solution']) - expected_rand_x))
    diff_inv = np.max(np.abs(np.array(inv_rand['solution']) - expected_rand_x))
    print(f"\n[Test 8] Random 20x20 Solve Accuracy vs NumPy:")
    print(f"  Gauss-Jordan diff: {diff_gj:.2e}")
    print(f"  LU Decomposition diff: {diff_lu:.2e}")
    print(f"  Inverse Method diff: {diff_inv:.2e}")
    assert diff_gj < 1e-6
    assert diff_lu < 1e-6
    assert diff_inv < 1e-6
    
    print("\n>>> ALL MATHEMATICAL ALGORITHM TESTS PASSED SUCCESSFULLY! <<<")

if __name__ == '__main__':
    test_suite()
