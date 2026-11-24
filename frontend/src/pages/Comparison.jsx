import React, { useState } from 'react';
import { 
  Scale, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Activity,
  Layers,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';
import MatrixGrid from '../components/MatrixGrid';
import { api } from '../services/api';

export default function Comparison() {
  const [size, setSize] = useState(3);
  const [matrixA, setMatrixA] = useState([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2]
  ]);
  const [vectorB, setVectorB] = useState([8, -11, -3]);

  const [maxCramerSize, setMaxCramerSize] = useState(8);
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [copiedMethod, setCopiedMethod] = useState(null);

  const handleCompare = () => {
    setErrorMsg(null);
    setIsComparing(true);
    api.solveSystem(matrixA, vectorB, 'all', maxCramerSize, true)
      .then(res => {
        if (res.success) {
          setComparisonData(res);
        } else {
          setErrorMsg(res.error || "Comparison failed.");
        }
      })
      .catch(err => setErrorMsg(err.message || "Failed to compare algorithms."))
      .finally(() => setIsComparing(false));
  };

  const copySolution = (methodKey, sol) => {
    if (sol) {
      navigator.clipboard.writeText(JSON.stringify(sol));
      setCopiedMethod(methodKey);
      setTimeout(() => setCopiedMethod(null), 2000);
    }
  };

  const algorithmsMeta = [
    { key: 'gauss_jordan', name: 'Gauss-Jordan Elimination', complexity: 'O(n³)', category: 'Direct Row Elimination' },
    { key: 'inverse_method', name: 'Inverse Matrix Method', complexity: 'O(n³)', category: 'Matrix Inversion (x = A⁻¹ · b)' },
    { key: 'cramer_rule', name: "Cramer's Rule", complexity: 'O((n+1)!) / O(n⁴)', category: 'Determinant Ratio det(Aⱼ)/det(A)' },
    { key: 'lu_decomposition', name: 'LU Decomposition (PA = LU)', complexity: 'O(n³)', category: 'Triangular Factorization & Substitution' }
  ];

  // Calculate fastest time among successful runs
  const getFastestTime = () => {
    if (!comparisonData?.results) return null;
    let minT = Infinity;
    Object.values(comparisonData.results).forEach(r => {
      if (r.status === 'Success' && typeof r.execution_time_ms === 'number') {
        if (r.execution_time_ms < minT) minT = r.execution_time_ms;
      }
    });
    return minT === Infinity ? null : minT;
  };

  const fastestTime = getFastestTime();

  return (
    <div className="space-y-6">
      {/* Matrix Input */}
      <MatrixGrid
        matrixA={matrixA}
        setMatrixA={setMatrixA}
        vectorB={vectorB}
        setVectorB={setVectorB}
        size={size}
        setSize={setSize}
        showVectorB={true}
      />

      {/* Action Banner */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-sky-500" />
            Parallel Algorithm Benchmarking & Cross-Validation
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Executes all four algorithms concurrently, evaluates numerical residuals, and verifies solution consistency.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-navy-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700 text-xs font-mono">
            <span className="text-slate-500">Cramer Limit:</span>
            <input
              type="number"
              min="2"
              max="12"
              value={maxCramerSize}
              onChange={(e) => setMaxCramerSize(parseInt(e.target.value) || 8)}
              className="w-12 text-center bg-white dark:bg-navy-900 rounded border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-white"
            />
          </div>

          <button
            onClick={handleCompare}
            disabled={isComparing}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-mono text-xs font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isComparing ? 'animate-spin' : ''}`} />
            <span>{isComparing ? 'Executing Solvers...' : 'Run Algorithm Comparison'}</span>
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

      {/* Comparison Results Table */}
      {comparisonData && (
        <div className="space-y-6">
          {/* Consistency Badge Banner */}
          <div className="p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <CheckCircle2 className={`w-6 h-6 ${comparisonData.comparison?.consistent ? 'text-emerald-500' : 'text-amber-500'}`} />
              <div>
                <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                  Cross-Algorithm Solution Validation: {comparisonData.comparison?.status}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Max difference between algorithms: {comparisonData.comparison?.max_discrepancy?.toExponential(2) || '0.00e+00'}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-navy-700">
              {comparisonData.comparison?.methods_succeeded} / {comparisonData.comparison?.methods_evaluated} Methods Succeeded
            </div>
          </div>

          {/* Detailed Side-by-Side Table */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400">
                  <th className="pb-3">Algorithm</th>
                  <th className="pb-3">Theoretical Complexity</th>
                  <th className="pb-3">Execution Time</th>
                  <th className="pb-3">Residual ||Ax - b||∞</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Calculated Solution Vector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60">
                {algorithmsMeta.map((meta) => {
                  const res = comparisonData.results[meta.key];
                  if (!res) return null;

                  const isSuccess = res.status === 'Success';
                  const isFastest = isSuccess && fastestTime && res.execution_time_ms === fastestTime;

                  return (
                    <tr key={meta.key} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                      <td className="py-4 pr-3">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {meta.name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                          {meta.category}
                        </div>
                      </td>

                      <td className="py-4 pr-3">
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 font-bold">
                          {meta.complexity}
                        </span>
                      </td>

                      <td className="py-4 pr-3">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Clock className="w-3.5 h-3.5 text-sky-500" />
                          <span>{typeof res.execution_time_ms === 'number' ? `${res.execution_time_ms.toFixed(3)} ms` : 'N/A'}</span>
                          {isFastest && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Fastest
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 pr-3">
                        <span className="font-mono text-slate-700 dark:text-slate-300">
                          {res.residual && typeof res.residual.norm_inf === 'number'
                            ? res.residual.norm_inf.toExponential(2)
                            : 'N/A'}
                        </span>
                      </td>

                      <td className="py-4 pr-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          isSuccess
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : res.status?.includes('Skipped')
                            ? 'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                        }`}>
                          {res.status}
                        </span>
                      </td>

                      <td className="py-4">
                        {res.solution ? (
                          <div className="flex items-center gap-2">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {res.solution.slice(0, 6).map((x, i) => (
                                <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-950 text-sky-600 dark:text-sky-400 font-bold text-[11px]">
                                  {typeof x === 'number' ? (Number.isInteger(x) ? x : x.toFixed(4)) : x}
                                </span>
                              ))}
                              {res.solution.length > 6 && (
                                <span className="text-slate-400 text-[10px]">
                                  +{res.solution.length - 6} more
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => copySolution(meta.key, res.solution)}
                              className="text-slate-400 hover:text-sky-500 p-1"
                              title="Copy vector"
                            >
                              {copiedMethod === meta.key ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">
                            {res.message || 'Not available'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Explanation of Inapplicable or Skipped Methods */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
            <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-sky-500" />
              Theoretical Analysis & Applicability Notes
            </h4>
            <div className="space-y-2 text-xs font-mono text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                • <strong>Gauss-Jordan Elimination</strong> operates via elementary row reduction to Reduced Row Echelon Form (RREF). It always determines whether a system is unique, inconsistent, or infinite in \(O(n^3)\) operations.
              </p>
              <p>
                • <strong>Inverse Matrix Method</strong> requires calculating \(A^{-1}\). If \(\det(A) = 0\), \(A\) is singular, meaning no inverse exists and the system cannot be solved via \(x = A^{-1}b\).
              </p>
              <p>
                • <strong>Cramer's Rule</strong> evaluates \(n + 1\) separate determinants. For \(n\) &gt; {maxCramerSize}, it is skipped to avoid catastrophic \(O((n+1)!)\) exponential growth. Even with Gaussian elimination determinants, it requires \((n+1) \cdot O(n^3) = O(n^4)\) steps, strictly inferior to LU and Gauss-Jordan.
              </p>
              <p>
                • <strong>LU Decomposition with Partial Pivoting (\(PA = LU\))</strong> factors the coefficient matrix once in \(O(\frac{2}{3}n^3)\), followed by fast forward substitution (\(Ly = Pb\)) and backward substitution (\(Ux = y\)) in \(O(n^2)\).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
