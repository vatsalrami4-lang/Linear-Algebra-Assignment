import React, { useState } from 'react';
import { 
  GitFork, 
  Layers, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  HelpCircle,
  Hash,
  Eye,
  Sparkles
} from 'lucide-react';
import MatrixGrid from '../components/MatrixGrid';
import { api } from '../services/api';

export default function Classification() {
  const [size, setSize] = useState(3);
  const [matrixA, setMatrixA] = useState([
    [1, 1, 1],
    [1, 1, 1],
    [2, 3, 1]
  ]);
  const [vectorB, setVectorB] = useState([2, 5, 8]);

  const [isClassifying, setIsClassifying] = useState(false);
  const [classificationResult, setClassificationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleClassify = () => {
    setErrorMsg(null);
    setIsClassifying(true);
    api.classifySystem(matrixA, vectorB)
      .then(res => {
        if (res.success) {
          setClassificationResult(res.data);
        } else {
          setErrorMsg(res.error || "Classification failed.");
        }
      })
      .catch(err => setErrorMsg(err.message || "Failed to classify linear system."))
      .finally(() => setIsClassifying(false));
  };

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
            <GitFork className="w-4 h-4 text-sky-500" />
            Rouché–Capelli Theorem System Classifier
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluates coefficient matrix rank rank(A) and augmented matrix rank rank([A|b]) to strictly classify the system.
          </p>
        </div>

        <button
          onClick={handleClassify}
          disabled={isClassifying}
          className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white font-mono text-xs font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
        >
          <Play className={`w-4 h-4 ${isClassifying ? 'animate-spin' : ''}`} />
          <span>{isClassifying ? 'Computing Matrix Ranks...' : 'Classify Linear System'}</span>
        </button>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Classification Results */}
      {classificationResult && (
        <div className="space-y-6">
          {/* Main Classification Summary Card */}
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-navy-800">
              <div className="flex items-center space-x-3">
                {classificationResult.classification === 'Unique' && (
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                )}
                {classificationResult.classification === 'Inconsistent' && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/30">
                    <XCircle className="w-6 h-6" />
                  </div>
                )}
                {classificationResult.classification === 'Infinite' && (
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/30">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}

                <div>
                  <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white">
                    {classificationResult.classification === 'Unique' && 'Unique Solution'}
                    {classificationResult.classification === 'Inconsistent' && 'Inconsistent System (No Solution)'}
                    {classificationResult.classification === 'Infinite' && 'Infinitely Many Solutions'}
                  </h3>
                  <span className="text-xs font-mono text-sky-600 dark:text-sky-400 font-semibold">
                    Condition: {classificationResult.condition_summary}
                  </span>
                </div>
              </div>

              {/* Degrees of freedom */}
              {classificationResult.classification === 'Infinite' && (
                <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 font-mono text-xs font-bold">
                  {classificationResult.degrees_of_freedom} Free Variable(s)
                </div>
              )}
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-5 text-xs font-mono">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Coefficient Matrix Rank
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  rank(A) = {classificationResult.rank_A}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Augmented Matrix Rank
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  rank([A | b]) = {classificationResult.rank_augmented}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
                <span className="text-[10px] uppercase text-slate-400 block mb-1">
                  Number of Unknowns
                </span>
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  n = {classificationResult.num_variables}
                </span>
              </div>
            </div>

            {/* Mathematical Rationale */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-mono text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {classificationResult.explanation}
            </div>

            {/* Inconsistency Contradiction Box */}
            {classificationResult.contradiction && (
              <div className="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 font-mono text-xs text-rose-700 dark:text-rose-300">
                <span className="font-bold block mb-1">Identified Contradiction:</span>
                <span>{classificationResult.contradiction}</span>
              </div>
            )}

            {/* Parametric Solution Box for Infinitely Many Solutions */}
            {classificationResult.parametric_solution && (
              <div className="mt-5 p-5 rounded-xl bg-purple-500/10 border border-purple-500/20 font-mono text-xs">
                <span className="text-purple-700 dark:text-purple-300 font-bold block mb-2 uppercase text-[11px]">
                  Parametric Solution Representation (Affine Subspace in R^{classificationResult.num_variables}):
                </span>
                
                <div className="p-3 rounded-lg bg-white dark:bg-navy-900 border border-purple-500/30 text-purple-900 dark:text-purple-200 space-y-1">
                  {classificationResult.parametric_solution.variable_expressions.map((expr, idx) => (
                    <div key={idx} className="font-bold">
                      {expr}
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">
                  Free parameter(s): {classificationResult.parametric_solution.free_variables.join(', ')} ∈ ℝ
                </div>
              </div>
            )}
          </div>

          {/* Augmented Row Echelon Form Display */}
          {classificationResult.augmented_echelon && (
            <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
              <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-500" />
                Row Echelon Form of Augmented Matrix [A | b]
              </h4>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 overflow-x-auto inline-block">
                <div className="grid gap-2">
                  {classificationResult.augmented_echelon.map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-2">
                      {row.map((val, cIdx) => {
                        const isLast = cIdx === row.length - 1;
                        return (
                          <div
                            key={cIdx}
                            className={`w-14 h-9 flex items-center justify-center font-mono text-xs rounded border font-semibold ${
                              isLast
                                ? 'bg-sky-500/10 dark:bg-sky-500/20 border-sky-500/40 text-sky-600 dark:text-sky-400'
                                : 'bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-700 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(3)) : val}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step-by-Step Echelon Reduction Steps */}
          {classificationResult.steps && (
            <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm">
              <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white mb-3">
                Elementary Row Reduction Steps
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-mono text-xs text-slate-700 dark:text-slate-300 space-y-1.5 max-h-72 overflow-y-auto">
                {classificationResult.steps.map((step, idx) => (
                  <div key={idx} className="leading-relaxed border-b border-slate-200/40 dark:border-navy-800/40 pb-1 last:border-0">
                    <span className="text-slate-400 mr-2">[{idx + 1}]</span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
