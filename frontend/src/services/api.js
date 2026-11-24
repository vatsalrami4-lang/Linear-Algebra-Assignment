/**
 * Linear System Solver Suite - Frontend API Client
 */
const BASE_URL = '/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API request failed for ${url}:`, err);
    throw err;
  }
}

export const api = {
  // Dashboard
  getStats: () => request('/dashboard/stats'),
  
  // Samples & Generators
  getSamples: () => request('/samples'),
  generateRandom: (size, mode = 'well_conditioned', min_val = -10, max_val = 10, integer_only = true) =>
    request('/random', {
      method: 'POST',
      body: JSON.stringify({ size, mode, min_val, max_val, integer_only }),
    }),

  // Solvers & Classification
  classifySystem: (matrix_a, vector_b) =>
    request('/classify', {
      method: 'POST',
      body: JSON.stringify({ matrix_a, vector_b }),
    }),

  solveSystem: (matrix_a, vector_b, methods = 'all', max_cramer_size = 8, save_to_history = true) =>
    request('/solve', {
      method: 'POST',
      body: JSON.stringify({
        matrix_a,
        vector_b,
        methods,
        max_cramer_size,
        save_to_history,
      }),
    }),

  // Matrix Operations
  matrixOperation: (payload) =>
    request('/matrix-operations', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Benchmarking
  runBenchmark: (sizes, methods, repetitions = 3, max_cramer_size = 8) =>
    request('/benchmark/run', {
      method: 'POST',
      body: JSON.stringify({ sizes, methods, repetitions, max_cramer_size }),
    }),

  getBenchmarkHistory: () => request('/benchmark/history'),

  // History CRUD
  getHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/history?${query}`);
  },

  getHistoryDetail: (id) => request(`/history/${id}`),

  deleteHistoryItem: (id) =>
    request(`/history/${id}`, {
      method: 'DELETE',
    }),

  clearAllHistory: () =>
    request('/history/clear', {
      method: 'POST',
    }),
};
