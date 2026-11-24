import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  BarChart3, 
  Layers, 
  Activity, 
  CheckCircle2, 
  ArrowRight, 
  Code2, 
  Cpu, 
  Database,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function Dashboard({ setActivePage, setLoadedProblem }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = () => {
    setLoading(true);
    api.getStats()
      .then(res => {
        if (res.success) setStats(res.data);
      })
      .catch(err => console.error("Stats fetch error:", err))
      .finally(() => setLoading(false));
  };

  const handleOpenProblem = (item) => {
    api.getHistoryDetail(item.problem_id)
      .then(res => {
        if (res.success && res.data) {
          if (setLoadedProblem) setLoadedProblem(res.data);
          setActivePage('solver');
        }
      })
      .catch(err => alert("Error opening problem: " + err.message));
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-850 to-navy-950 border border-navy-800 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Linear Algebra & Data Structures Suite • Version 1.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white mb-3">
            High-Performance Linear System Solver Suite
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 font-sans">
            A scientific computing platform for solving systems of linear equations (\(Ax = b\)), 
            evaluating matrix operations, analyzing matrix ranks via the Rouché–Capelli theorem, and empirical algorithm benchmarking from scratch.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActivePage('solver')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-mono text-xs font-bold transition-all shadow-lg shadow-sky-500/20"
            >
              <Calculator className="w-4 h-4" />
              <span>Launch Solver</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setActivePage('benchmarking')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 font-mono text-xs font-medium transition-all"
            >
              <BarChart3 className="w-4 h-4" />
              <span>View Benchmarks (2–200)</span>
            </button>
            <button
              onClick={() => setActivePage('operations')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 border border-navy-700 font-mono text-xs font-medium transition-all"
            >
              <Layers className="w-4 h-4" />
              <span>Matrix Operations</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
              Total Solved
            </span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.total_problems ?? 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block font-mono">
            Recorded in SQLite DB
          </span>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
              Benchmark Timings
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {loading ? '...' : (stats?.total_benchmark_tests ?? 0)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block font-mono">
            High-res timer samples
          </span>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
              Scratch Solvers
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            4 Algorithms
          </div>
          <span className="text-xs text-slate-400 mt-1 block font-mono">
            GJ, Inverse, Cramer, LU
          </span>
        </div>

        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
              Matrix Engine
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
            8 Operations
          </div>
          <span className="text-xs text-slate-400 mt-1 block font-mono">
            Add, Mul, Det, Rank, Inv...
          </span>
        </div>
      </div>

      {/* Available Algorithms Grid */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
        <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-500" />
          Implemented Mathematical Solvers (From Scratch)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(stats?.available_algorithms || [
            { name: 'Gauss-Jordan Elimination', complexity: 'O(n³)', features: 'Partial pivoting, RREF, unique/infinite/inconsistent detection' },
            { name: 'Inverse Matrix Method', complexity: 'O(n³)', features: 'A⁻¹ · b calculation, determinant verification, [A|I] reduction' },
            { name: "Cramer's Rule", complexity: 'O((n+1)!) / O(n⁴)', features: 'Column replacement with b, det(Aⱼ)/det(A), capped for n ≤ 8' },
            { name: 'LU Decomposition', complexity: 'O(n³)', features: 'PA = LU factorization, forward and backward substitution' }
          ]).map((alg, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/70 border border-slate-200 dark:border-navy-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                    {alg.name}
                  </h4>
                  <span className="px-2 py-0.5 rounded font-mono text-xs bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
                    {alg.complexity}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                  {alg.features}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-navy-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                <span className="flex items-center gap-1 text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  No external math libraries
                </span>
                <button
                  onClick={() => setActivePage('solver')}
                  className="text-sky-500 hover:text-sky-600 flex items-center gap-1 font-semibold"
                >
                  <span>Solve</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column: Recent Calculations & DSA Concepts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Calculations */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              Recent Solved Problems
            </h2>
            <button
              onClick={() => setActivePage('history')}
              className="text-xs font-mono text-sky-500 hover:text-sky-600 flex items-center gap-1 font-semibold"
            >
              <span>View All History</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {stats?.recent_calculations && stats.recent_calculations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400">
                    <th className="pb-2">ID</th>
                    <th className="pb-2">Dimension</th>
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Best Time</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60">
                  {stats.recent_calculations.map((item) => (
                    <tr key={item.problem_id} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                      <td className="py-2.5 font-bold text-sky-600 dark:text-sky-400">
                        #{item.problem_id}
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">
                        {item.matrix_size}×{item.matrix_size}
                      </td>
                      <td className="py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.classification === 'Unique'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : item.classification === 'Inconsistent'
                            ? 'bg-rose-500/10 text-rose-500'
                            : 'bg-purple-500/10 text-purple-500'
                        }`}>
                          {item.classification}
                        </span>
                      </td>
                      <td className="py-2.5 text-slate-600 dark:text-slate-300">
                        {item.min_time} ms
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          onClick={() => handleOpenProblem(item)}
                          className="px-2.5 py-1 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 font-bold transition-colors"
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-xs font-mono text-slate-400">
              No problems solved yet. Launch the solver to run calculations.
            </div>
          )}
        </div>

        {/* DSA Concepts & Academic Matrix */}
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
          <h2 className="text-base font-bold font-mono text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-sky-500" />
            DSA Concepts Demonstrated
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400">
                  <th className="pb-2">DSA Concept</th>
                  <th className="pb-2">Implementation in Project</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="py-2.5 font-bold text-sky-600 dark:text-sky-400">2D Arrays</td>
                  <td className="py-2.5">Matrix and vector storage, continuous memory layouts</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-sky-600 dark:text-sky-400">Recursion</td>
                  <td className="py-2.5">Laplace cofactor expansion for determinants with call tracking</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-sky-600 dark:text-sky-400">Matrix Operations</td>
                  <td className="py-2.5">Elementary row reduction, partial pivoting, RREF formation</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-sky-600 dark:text-sky-400">Numerical Algorithms</td>
                  <td className="py-2.5">PA = LU decomposition, forward and backward substitutions</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-sky-600 dark:text-sky-400">Complexity Analysis</td>
                  <td className="py-2.5">Empirical O(n³) scaling vs Cramer's O(n!) factorial wall</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-sky-600 dark:text-sky-400">Searching & Sorting</td>
                  <td className="py-2.5">SQLite indexed queries, median timing filtering</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
