import React from 'react';
import { Sun, Moon, Database, Activity, RefreshCw } from 'lucide-react';

export default function Navbar({ activePage, theme, toggleTheme, onRefresh, isRefreshing }) {
  const pageTitles = {
    dashboard: { title: 'Dashboard', desc: 'System metrics, database statistics & algorithm overview' },
    solver: { title: 'Linear System Solver', desc: 'Solve Ax = b using four scratch algorithms with full telemetry' },
    operations: { title: 'Matrix Operations', desc: 'Add, subtract, multiply, transpose, rank, determinant & invert' },
    classification: { title: 'Solution Classification', desc: 'Rouché–Capelli theorem analysis via matrix rank & parametric forms' },
    comparison: { title: 'Algorithm Comparison', desc: 'Side-by-side performance, accuracy, and residual benchmarks' },
    benchmarking: { title: 'Empirical Benchmarking', desc: 'Execution time scaling (2–200) with linear & logarithmic charts' },
    history: { title: 'Historical Calculations', desc: 'Search, filter, inspect and reload previously solved systems' },
  };

  const current = pageTitles[activePage] || { title: 'Solver Suite', desc: '' };

  return (
    <header className="h-16 border-b border-slate-200 dark:border-navy-800 bg-white/80 dark:bg-navy-900/80 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-6">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-slate-900 dark:text-white font-mono tracking-tight flex items-center gap-2">
          {current.title}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
          {current.desc}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-sky-500' : ''}`} />
          </button>
        )}

        <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-navy-800 border border-slate-200 dark:border-navy-700 text-xs font-mono text-slate-600 dark:text-slate-300">
          <Database className="w-3.5 h-3.5 text-sky-500" />
          <span>SQLite Connected</span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}
