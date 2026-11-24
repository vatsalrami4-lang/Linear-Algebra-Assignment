import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Play, 
  Activity, 
  Clock, 
  Settings2, 
  AlertTriangle, 
  CheckCircle2, 
  Filter, 
  TrendingUp,
  Cpu,
  HelpCircle,
  Database
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { api } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Benchmarking() {
  const [selectedSizes, setSelectedSizes] = useState([2, 4, 8, 16, 32, 64, 100, 150, 200]);
  const [repetitions, setRepetitions] = useState(3);
  const [maxCramerSize, setMaxCramerSize] = useState(8);
  const [useLogScale, setUseLogScale] = useState(false);

  // Filter algorithms shown on chart
  const [visibleAlgs, setVisibleAlgs] = useState({
    gauss_jordan: true,
    inverse_method: true,
    cramer_rule: true,
    lu_decomposition: true,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);

  useEffect(() => {
    loadBenchmarkHistory();
  }, []);

  const loadBenchmarkHistory = () => {
    api.getBenchmarkHistory()
      .then(res => {
        if (res.success && res.data) {
          setHistoricalData(res.data);
        }
      })
      .catch(err => console.error("Could not load benchmark history:", err));
  };

  const handleRunBenchmark = () => {
    setErrorMsg(null);
    setIsRunning(true);

    const activeMethods = Object.keys(visibleAlgs).filter(k => visibleAlgs[k]);
    if (activeMethods.length === 0) {
      setErrorMsg("Please select at least one algorithm to benchmark.");
      setIsRunning(false);
      return;
    }

    api.runBenchmark(selectedSizes, activeMethods, repetitions, maxCramerSize)
      .then(res => {
        if (res.success) {
          setBenchmarkData(res);
          loadBenchmarkHistory();
        } else {
          setErrorMsg(res.error || "Benchmark failed.");
        }
      })
      .catch(err => {
        setErrorMsg(err.message || "Benchmark failed to run.");
      })
      .finally(() => {
        setIsRunning(false);
      });
  };

  const handleToggleSize = (s) => {
    if (selectedSizes.includes(s)) {
      if (selectedSizes.length > 2) {
        setSelectedSizes(selectedSizes.filter(item => item !== s));
      }
    } else {
      setSelectedSizes([...selectedSizes, s].sort((a, b) => a - b));
    }
  };

  // Build Chart.js datasets
  const getChartData = () => {
    const raw = benchmarkData?.results;
    if (!raw) return null;

    const sizes = benchmarkData.sizes;
    const datasets = [];

    const colors = {
      gauss_jordan: { border: '#0284c7', bg: 'rgba(2, 132, 199, 0.1)', label: 'Gauss-Jordan (O(n³))' },
      inverse_method: { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', label: 'Inverse Method (O(n³))' },
      cramer_rule: { border: '#e11d48', bg: 'rgba(225, 29, 72, 0.1)', label: "Cramer's Rule (O(n⁴) / O(n!))" },
      lu_decomposition: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', label: 'LU Decomposition (O(n³))' },
    };

    Object.keys(colors).forEach((method) => {
      if (!visibleAlgs[method] || !raw[method]) return;

      const series = raw[method];
      const dataPoints = sizes.map(s => {
        const pt = series.find(item => item.size === s);
        if (!pt || pt.skipped || pt.median_ms === null) return null;
        return pt.median_ms;
      });

      datasets.push({
        label: colors[method].label,
        data: dataPoints,
        borderColor: colors[method].border,
        backgroundColor: colors[method].bg,
        borderWidth: 2.5,
        pointBackgroundColor: colors[method].border,
        pointBorderColor: '#ffffff',
        pointRadius: 4,
        pointHoverRadius: 7,
        spanGaps: false,
        tension: 0.2,
      });
    });

    return {
      labels: sizes.map(s => `${s}×${s}`),
      datasets,
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'JetBrains Mono', size: 11 },
          usePointStyle: true,
          boxWidth: 8,
        },
      },
      tooltip: {
        backgroundColor: '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#1e293b',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y;
            return ` ${context.dataset.label}: ${val !== null ? `${val.toFixed(4)} ms` : 'Skipped'}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
        title: { display: true, text: 'Matrix Size (n × n)', color: '#64748b', font: { family: 'JetBrains Mono', size: 11 } },
      },
      y: {
        type: useLogScale ? 'logarithmic' : 'linear',
        grid: { color: 'rgba(148, 163, 184, 0.08)' },
        ticks: { color: '#94a3b8', font: { family: 'JetBrains Mono', size: 10 } },
        title: { display: true, text: `Median Execution Time (ms) [${useLogScale ? 'Log Scale' : 'Linear Scale'}]`, color: '#64748b', font: { family: 'JetBrains Mono', size: 11 } },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Benchmark Setup Card */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-sky-500" />
              Automated Empirical Algorithm Benchmarking
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Profiles matrix solving speeds from 2×2 up to 200×200 with median filtering over multiple repetitions.
            </p>
          </div>

          <div className="flex items-center space-x-3 text-xs font-mono">
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-navy-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700">
              <span className="text-slate-500">Repetitions:</span>
              <input
                type="number"
                min="1"
                max="5"
                value={repetitions}
                onChange={(e) => setRepetitions(Math.max(1, Math.min(5, parseInt(e.target.value) || 1)))}
                className="w-10 text-center bg-white dark:bg-navy-900 rounded border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-white"
                title="Repetitions for median filtering"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-navy-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700">
              <span className="text-slate-500">Cramer Limit:</span>
              <input
                type="number"
                min="2"
                max="12"
                value={maxCramerSize}
                onChange={(e) => setMaxCramerSize(parseInt(e.target.value) || 8)}
                className="w-10 text-center bg-white dark:bg-navy-900 rounded border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-white"
                title="Max dimension for Cramer's Rule"
              />
            </div>
          </div>
        </div>

        {/* Matrix Sizes Selector */}
        <div className="my-4">
          <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-2 font-semibold">
            Select Matrix Sizes to Benchmark (n = 2 to 200):
          </label>
          <div className="flex flex-wrap gap-2">
            {[2, 4, 8, 16, 32, 64, 100, 150, 200].map((s) => {
              const isSelected = selectedSizes.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => handleToggleSize(s)}
                  className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-sky-500 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                  }`}
                >
                  {s}×{s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Algorithm Filters & Action */}
        <div className="pt-4 border-t border-slate-100 dark:border-navy-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <span className="text-slate-400 font-semibold">Algorithms:</span>
            {[
              { id: 'gauss_jordan', label: 'Gauss-Jordan' },
              { id: 'inverse_method', label: 'Inverse' },
              { id: 'cramer_rule', label: "Cramer's Rule" },
              { id: 'lu_decomposition', label: 'LU Decomp' }
            ].map((alg) => (
              <label key={alg.id} className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visibleAlgs[alg.id]}
                  onChange={() => setVisibleAlgs(prev => ({ ...prev, [alg.id]: !prev[alg.id] }))}
                  className="rounded text-sky-500"
                />
                <span className="text-slate-700 dark:text-slate-300">{alg.label}</span>
              </label>
            ))}
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-mono text-xs font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
            <span>{isRunning ? 'Benchmarking Test Iterations...' : 'Execute Benchmark Suite'}</span>
          </button>
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Chart Section */}
      {benchmarkData && (
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-sky-500" />
              <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                Execution Time Scaling Curves (Median of {benchmarkData.repetitions} runs)
              </h4>
            </div>

            {/* Linear vs Logarithmic scale toggle */}
            <div className="flex items-center rounded-lg bg-slate-100 dark:bg-navy-800 p-0.5 border border-slate-300 dark:border-navy-700 text-xs font-mono">
              <button
                onClick={() => setUseLogScale(false)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  !useLogScale
                    ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Linear Scale
              </button>
              <button
                onClick={() => setUseLogScale(true)}
                className={`px-3 py-1 rounded-md transition-colors ${
                  useLogScale
                    ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                Logarithmic (log₁₀)
              </button>
            </div>
          </div>

          {/* Canvas Chart */}
          <div className="h-80 sm:h-96 w-full pt-2">
            <Line data={getChartData()} options={chartOptions} />
          </div>

          {/* Results Summary Table */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-navy-800">
            <h5 className="font-mono font-bold text-xs uppercase text-slate-400 mb-3">
              Numerical Benchmark Output (Median Execution Time in ms):
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400">
                    <th className="pb-2">Size</th>
                    <th className="pb-2">Gauss-Jordan</th>
                    <th className="pb-2">Inverse Method</th>
                    <th className="pb-2">LU Decomposition</th>
                    <th className="pb-2">Cramer's Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60">
                  {benchmarkData.sizes.map((s) => {
                    const gj = benchmarkData.results.gauss_jordan?.find(i => i.size === s);
                    const inv = benchmarkData.results.inverse_method?.find(i => i.size === s);
                    const lu = benchmarkData.results.lu_decomposition?.find(i => i.size === s);
                    const cr = benchmarkData.results.cramer_rule?.find(i => i.size === s);

                    return (
                      <tr key={s} className="hover:bg-slate-50 dark:hover:bg-navy-800/40">
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">{s}×{s}</td>
                        <td className="py-2.5 text-sky-600 dark:text-sky-400">
                          {gj ? `${gj.median_ms.toFixed(3)} ms` : 'N/A'}
                        </td>
                        <td className="py-2.5 text-indigo-600 dark:text-indigo-400">
                          {inv ? `${inv.median_ms.toFixed(3)} ms` : 'N/A'}
                        </td>
                        <td className="py-2.5 text-emerald-600 dark:text-emerald-400">
                          {lu ? `${lu.median_ms.toFixed(3)} ms` : 'N/A'}
                        </td>
                        <td className="py-2.5">
                          {cr?.skipped ? (
                            <span className="text-slate-400 italic text-[11px]">
                              Skipped (&gt;{maxCramerSize}×{maxCramerSize})
                            </span>
                          ) : cr ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              {cr.median_ms.toFixed(3)} ms
                            </span>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Computational Complexity & Cramer Factorial Wall Explanation */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
        <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-sky-500" />
          The Computational Complexity Wall: Why Cramer's Rule is Impractical for n &gt; 8
        </h4>
        <div className="space-y-3 text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
          <p>
            1. <strong>Naive Recursive Expansion \(O((n+1)!)\):</strong> If Cramer's Rule computes determinants via Laplace cofactor expansion, each \(n \times n\) determinant takes \(O(n!)\) floating-point operations. Solving for all \(n\) variables requires \(n + 1\) such determinants:
            \[
            \text{Operations} = (n + 1) \cdot n! = (n + 1)!
            \]
            For \(n = 5\): \(6! = 720\) operations (instantaneous).<br />
            For \(n = 10\): \(11! = 39,916,800\) operations.<br />
            For \(n = 20\): \(21! \approx 5.1 \times 10^{19}\) operations — at 1 billion operations per second, this would take over 1,600 years!
          </p>
          <p>
            2. <strong>Elimination-Based Cramer's Rule \(O(n^4)\):</strong> Even if every determinant is computed efficiently in \(O(n^3)\) via Gaussian elimination, evaluating \(n + 1\) separate matrices requires \((n + 1) \cdot O(n^3) = O(n^4)\) total operations.
          </p>
          <p>
            3. <strong>Gauss-Jordan & LU Superiority \(O(n^3)\):</strong> Both Gauss-Jordan and LU decomposition solve the system directly in \(O(n^3)\) without calculating multiple determinants. For \(n = 100\), \(O(n^3) \approx 10^6\) operations, whereas \(O(n^4) \approx 10^8\) — two full orders of magnitude faster!
          </p>
        </div>
      </div>
    </div>
  );
}
