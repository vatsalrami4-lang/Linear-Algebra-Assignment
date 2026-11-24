import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Layers, 
  CheckSquare, 
  Square, 
  Settings2, 
  Activity, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import MatrixGrid from '../components/MatrixGrid';
import SolutionCard from '../components/SolutionCard';
import { api } from '../services/api';

export default function Solver({ loadedProblem, setLoadedProblem }) {
  const [size, setSize] = useState(3);
  const [matrixA, setMatrixA] = useState([
    [2, 1, -1],
    [-3, -1, 2],
    [-2, 1, 2]
  ]);
  const [vectorB, setVectorB] = useState([8, -11, -3]);

  // Selected methods
  const [selectedMethods, setSelectedMethods] = useState({
    gauss_jordan: true,
    inverse_method: true,
    cramer_rule: true,
    lu_decomposition: true
  });

  const [maxCramerSize, setMaxCramerSize] = useState(8);
  const [isSolving, setIsSolving] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // If a problem was loaded from Dashboard or History
  useEffect(() => {
    if (loadedProblem) {
      setSize(loadedProblem.matrix_size);
      setMatrixA(loadedProblem.matrix_a);
      setVectorB(loadedProblem.vector_b);
      // Run solve automatically
      handleSolve(loadedProblem.matrix_a, loadedProblem.vector_b, loadedProblem.matrix_size);
      // Clear problem state after loading
      if (setLoadedProblem) setLoadedProblem(null);
    }
  }, [loadedProblem]);

  const toggleMethod = (key) => {
    setSelectedMethods(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectAllMethods = () => {
    setSelectedMethods({
      gauss_jordan: true,
      inverse_method: true,
      cramer_rule: true,
      lu_decomposition: true
    });
  };

  const handleSolve = (currA = matrixA, currB = vectorB, currSize = size) => {
    setErrorMsg(null);
    const active = Object.keys(selectedMethods).filter(k => selectedMethods[k]);
    if (active.length === 0) {
      setErrorMsg("Please select at least one algorithm to run.");
      return;
    }

    setIsSolving(true);
    api.solveSystem(currA, currB, active, maxCramerSize, true)
      .then(res => {
        if (res.success) {
          setResultsData(res);
        } else {
          setErrorMsg(res.error || "Solver failed.");
        }
      })
      .catch(err => {
        setErrorMsg(err.message || "Network or calculation error.");
      })
      .finally(() => {
        setIsSolving(false);
      });
  };

  const handleSampleLoaded = (sample) => {
    setResultsData(null);
    setErrorMsg(null);
  };

  return (
    <div className="space-y-6">
      {/* Input Matrix Grid Card */}
      <MatrixGrid
        matrixA={matrixA}
        setMatrixA={setMatrixA}
        vectorB={vectorB}
        setVectorB={setVectorB}
        size={size}
        setSize={setSize}
        showVectorB={true}
        onLoadedSample={handleSampleLoaded}
      />

      {/* Control Panel & Method Selectors */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-sky-500" />
              Algorithm Selection & Configuration
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select which scratch algorithms to execute on Ax = b
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={selectAllMethods}
              className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-700 font-semibold transition-colors"
            >
              Select All
            </button>
            <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-navy-800 px-3 py-1 rounded-lg border border-slate-300 dark:border-navy-700">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Cramer Max Size:
              </span>
              <input
                type="number"
                min="2"
                max="12"
                value={maxCramerSize}
                onChange={(e) => setMaxCramerSize(parseInt(e.target.value) || 8)}
                className="w-12 text-center text-xs font-mono bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 rounded text-slate-900 dark:text-white"
                title="Cramer's Rule is capped to prevent O((n+1)!) factorial explosions"
              />
            </div>
          </div>
        </div>

        {/* Checkbox Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-4">
          {[
            { id: 'gauss_jordan', name: 'Gauss-Jordan Elimination', complexity: 'O(n³)', note: 'Row operations & RREF' },
            { id: 'inverse_method', name: 'Inverse Matrix Method', complexity: 'O(n³)', note: 'x = A⁻¹ · b' },
            { id: 'cramer_rule', name: "Cramer's Rule", complexity: 'O(n⁴) / O(n!)', note: `det(Aⱼ)/det(A) (≤ ${maxCramerSize}×${maxCramerSize})` },
            { id: 'lu_decomposition', name: 'LU Decomposition', complexity: 'O(n³)', note: 'PA = LU & substitution' }
          ].map((m) => {
            const isChecked = selectedMethods[m.id];
            return (
              <div
                key={m.id}
                onClick={() => toggleMethod(m.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  isChecked
                    ? 'bg-sky-500/10 border-sky-500/30 text-sky-900 dark:text-sky-300'
                    : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200 dark:border-navy-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-navy-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold leading-tight">
                      {m.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 font-semibold">
                    {m.complexity}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-sans mt-2">
                  {m.note}
                </span>
              </div>
            );
          })}
        </div>

        {/* Solve Action Button */}
        <div className="pt-2 flex items-center justify-between">
          <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-sky-500" />
            <span>High-precision timer enabled • Results saved to SQLite</span>
          </div>

          <button
            onClick={() => handleSolve()}
            disabled={isSolving}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-mono text-xs font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isSolving ? 'animate-spin' : ''}`} />
            <span>{isSolving ? 'Computing Algorithms...' : 'Solve Linear System'}</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results Section */}
      {resultsData && (
        <div className="space-y-6">
          {/* Classification Banner */}
          {resultsData.classification && (
            <div className="p-5 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                <div className="flex items-center space-x-3">
                  <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
                    System Classification (Rouché–Capelli):
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                    resultsData.classification.classification === 'Unique'
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                      : resultsData.classification.classification === 'Inconsistent'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                  }`}>
                    {resultsData.classification.classification} Solution
                  </span>
                </div>

                <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {resultsData.classification.condition_summary}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 font-mono whitespace-pre-line leading-relaxed">
                {resultsData.classification.explanation}
              </p>

              {/* Cross-method consistency banner */}
              {resultsData.comparison && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className={`w-4 h-4 ${resultsData.comparison.consistent ? 'text-emerald-500' : 'text-amber-500'}`} />
                    <span>Cross-Algorithm Check: {resultsData.comparison.status}</span>
                  </span>
                  <span>
                    Max discrepancy across methods: {resultsData.comparison.max_discrepancy.toExponential(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Results Grid for Selected Algorithms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {resultsData.results.gauss_jordan && (
              <SolutionCard
                title="Gauss-Jordan Elimination"
                data={resultsData.results.gauss_jordan}
                icon={Layers}
              />
            )}
            {resultsData.results.inverse_method && (
              <SolutionCard
                title="Inverse Matrix Method (x = A⁻¹ · b)"
                data={resultsData.results.inverse_method}
                icon={Layers}
              />
            )}
            {resultsData.results.cramer_rule && (
              <SolutionCard
                title="Cramer's Rule (det(Aⱼ)/det(A))"
                data={resultsData.results.cramer_rule}
                icon={Layers}
              />
            )}
            {resultsData.results.lu_decomposition && (
              <SolutionCard
                title="LU Decomposition (PA = LU)"
                data={resultsData.results.lu_decomposition}
                icon={Layers}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
