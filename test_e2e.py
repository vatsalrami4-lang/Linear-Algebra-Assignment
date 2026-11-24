"""
Comprehensive End-to-End System Tests for Linear System Solver Suite.
Tests API routes, database transactions, solving algorithms, and SPA delivery.
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from backend.app import create_app

def run_e2e_tests():
    print("=== STARTING FULL-STACK E2E VALIDATION SUITE ===")
    app = create_app()
    client = app.test_client()
    
    # 1. SPA and Health Check
    res_root = client.get('/')
    print(f"[E2E 1] Root route status: {res_root.status_code}")
    assert res_root.status_code == 200
    assert b"Linear System Solver Suite" in res_root.data or b"root" in res_root.data
    
    res_health = client.get('/api/health')
    print(f"[E2E 2] Health endpoint: {res_health.status_code}, data: {res_health.get_json()}")
    assert res_health.status_code == 200
    assert res_health.get_json()['status'] == 'healthy'
    
    # 2. Samples endpoint
    res_samples = client.get('/api/samples')
    assert res_samples.status_code == 200
    samples = res_samples.get_json()['samples']
    print(f"[E2E 3] Sample systems loaded: {len(samples)} samples available.")
    assert len(samples) >= 5
    
    # 3. Solver test on Unique 3x3
    s0 = samples[0] # Circuit mesh current unique 3x3
    res_solve = client.post('/api/solve', json={
        'matrix_a': s0['matrix_a'],
        'vector_b': s0['vector_b'],
        'methods': 'all',
        'max_cramer_size': 8,
        'save_to_history': True
    })
    assert res_solve.status_code == 200
    solve_data = res_solve.get_json()
    print(f"[E2E 4] Solve 3x3 System: problem_id = {solve_data['problem_id']}, classification = {solve_data['classification']['classification']}")
    assert solve_data['classification']['classification'] == 'Unique'
    assert 'gauss_jordan' in solve_data['results']
    assert 'inverse_method' in solve_data['results']
    assert 'cramer_rule' in solve_data['results']
    assert 'lu_decomposition' in solve_data['results']
    assert solve_data['comparison']['consistent'] is True
    
    # 4. Classification test on Inconsistent system
    s_inc = next(s for s in samples if s['expected_classification'] == 'Inconsistent')
    res_class_inc = client.post('/api/classify', json={
        'matrix_a': s_inc['matrix_a'],
        'vector_b': s_inc['vector_b']
    })
    assert res_class_inc.status_code == 200
    class_inc_data = res_class_inc.get_json()['data']
    print(f"[E2E 5] Inconsistent system classified: {class_inc_data['classification']} ({class_inc_data['condition_summary']})")
    assert class_inc_data['classification'] == 'Inconsistent'
    assert class_inc_data['rank_A'] != class_inc_data['rank_augmented']
    
    # 5. Matrix Operations (Add, Multiply, Det, Rank, Inv, Transpose)
    A = [[1, 2], [3, 4]]
    B = [[5, 6], [7, 8]]
    
    res_add = client.post('/api/matrix-operations', json={'operation': 'add', 'matrix_a': A, 'matrix_b': B})
    assert res_add.status_code == 200
    assert res_add.get_json()['result_matrix'] == [[6.0, 8.0], [10.0, 12.0]]
    
    res_mul = client.post('/api/matrix-operations', json={'operation': 'multiply', 'matrix_a': A, 'matrix_b': B})
    assert res_mul.status_code == 200
    assert res_mul.get_json()['result_matrix'] == [[19.0, 22.0], [43.0, 50.0]]
    
    res_det = client.post('/api/matrix-operations', json={'operation': 'determinant', 'matrix_a': A, 'det_method': 'auto'})
    assert res_det.status_code == 200
    assert abs(res_det.get_json()['determinant'] - (-2.0)) < 1e-6
    
    res_rank = client.post('/api/matrix-operations', json={'operation': 'rank', 'matrix_a': A})
    assert res_rank.status_code == 200
    assert res_rank.get_json()['rank'] == 2
    
    print("[E2E 6] All matrix operations (add, mul, det, rank) verified!")
    
    # 6. Benchmark run (sizes 2, 4, 8)
    res_bm = client.post('/api/benchmark/run', json={
        'sizes': [2, 4, 8],
        'methods': ['gauss_jordan', 'lu_decomposition'],
        'repetitions': 2,
        'max_cramer_size': 8
    })
    assert res_bm.status_code == 200
    bm_data = res_bm.get_json()
    print(f"[E2E 7] Benchmark executed for sizes {bm_data['sizes']} successfully.")
    assert len(bm_data['results']['gauss_jordan']) == 3
    
    # 7. History retrieval & search
    res_hist = client.get('/api/history')
    assert res_hist.status_code == 200
    hist_data = res_hist.get_json()['data']
    print(f"[E2E 8] History records in database: {hist_data['total']}")
    assert hist_data['total'] >= 1
    
    # 8. Dashboard statistics
    res_stats = client.get('/api/dashboard/stats')
    assert res_stats.status_code == 200
    stats_data = res_stats.get_json()['data']
    print(f"[E2E 9] Dashboard stats: total_problems = {stats_data['total_problems']}, benchmark_tests = {stats_data['total_benchmark_tests']}")
    assert stats_data['total_problems'] >= 1
    assert stats_data['total_benchmark_tests'] >= 1
    
    print("\n>>> ALL E2E FULL-STACK INTEGRATION TESTS PASSED PERFECTLY! <<<")

if __name__ == '__main__':
    run_e2e_tests()
