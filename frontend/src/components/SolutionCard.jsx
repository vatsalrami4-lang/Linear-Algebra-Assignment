import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, ChevronDown, ChevronUp, Copy, Check, Eye } from 'lucide-react';

export default function SolutionCard({ title, data, icon: Icon }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const isSuccess = data.status === 'Success';
  const isSingular = data.status === 'Singular Matrix' || data.status === 'Singular';
  const isInconsistent = data.status === 'Inconsistent';
  const isInfinite = data.status === 'Infinite Solutions' || data.status === 'Infinite';
  const isSkipped = data.status?.includes('Skipped');

  const handleCopy = () => {
    if (data.solution) {
      navigator.clipboard.writeText(JSON.stringify(data.solution));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm transition-all hover:border-slate-300 dark:hover:border-navy-700">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-navy-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/30">
            {Icon ? <Icon className="w-5 h-5" /> : null}
          </div>
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
              {title}
            </h3>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
              Complexity: {data.complexity || 'O(n³)'}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-2">
          {isSuccess && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Solved
            </span>
          )}
          {isInconsistent && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <XCircle className="w-3.5 h-3.5" />
              Inconsistent
            </span>
          )}
          {isInfinite && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              Infinite Solutions
            </span>
          )}
          {isSingular && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <AlertTriangle className="w-3.5 h-3.5" />
              Singular Matrix
            </span>
          )}
          {isSkipped && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
              Skipped
            </span>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-3 text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Execution Time</span>
          <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-sky-500" />
            <span>{typeof data.execution_time_ms === 'number' ? `${data.execution_time_ms.toFixed(3)} ms` : 'N/A'}</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Residual ||Ax - b||∞</span>
          <span className="font-bold text-slate-800 dark:text-slate-200">
            {data.residual && typeof data.residual.norm_inf === 'number' 
              ? data.residual.norm_inf.toExponential(2)
              : 'N/A'}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 p-2.5 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
          <span className="text-[10px] uppercase text-slate-400 block mb-0.5">Classification</span>
          <span className="font-bold text-sky-600 dark:text-sky-400">
            {data.classification || 'N/A'}
          </span>
        </div>
      </div>

      {/* Solution Vector or Message */}
      <div className="my-3">
        {data.solution && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">
                Solution Vector x:
              </span>
              <button
                onClick={handleCopy}
                className="text-[10px] font-mono flex items-center gap-1 text-slate-400 hover:text-sky-500 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto font-mono text-xs">
              {data.solution.map((val, idx) => (
                <div key={idx} className="px-2 py-1 rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-800 text-slate-900 dark:text-slate-100">
                  <span className="text-slate-400 text-[10px] mr-1">x_{idx + 1} =</span>
                  <span className="font-semibold text-sky-600 dark:text-sky-400">
                    {typeof val === 'number' ? (Number.isInteger(val) ? val : val.toFixed(5)) : val}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.message && !data.solution && (
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-mono text-slate-600 dark:text-slate-400">
            {data.message}
          </div>
        )}
      </div>

      {/* Collapsible Steps */}
      {data.steps && data.steps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-navy-800/80">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-xs font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <span>Detailed Calculation Steps ({data.steps.length})</span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 text-xs font-mono text-slate-700 dark:text-slate-300 space-y-1.5 max-h-60 overflow-y-auto">
              {data.steps.map((step, idx) => (
                <div key={idx} className="leading-relaxed border-b border-slate-200/40 dark:border-navy-800/40 pb-1 last:border-0">
                  <span className="text-slate-400 mr-2">[{idx + 1}]</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
