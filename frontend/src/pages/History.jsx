import React, { useState, useEffect } from 'react';
import { 
  History as HistoryIcon, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Trash2, 
  Eye, 
  RotateCcw, 
  Download, 
  AlertTriangle, 
  CheckCircle2, 
  Layers, 
  Clock,
  X
} from 'lucide-react';
import { api } from '../services/api';

export default function HistoryPage({ setActivePage, setLoadedProblem }) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('DESC');

  // Detail Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [page, filterMethod, filterClass, sortBy, sortOrder]);

  const fetchHistory = () => {
    setLoading(true);
    api.getHistory({
      search,
      method: filterMethod,
      classification: filterClass,
      sort_by: sortBy,
      sort_order: sortOrder,
      page,
      per_page: 12
    })
      .then(res => {
        if (res.success && res.data) {
          setRecords(res.data.records);
          setTotal(res.data.total);
          setTotalPages(res.data.total_pages);
        }
      })
      .catch(err => console.error("History fetch error:", err))
      .finally(() => setLoading(false));
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = (id) => {
    if (window.confirm(`Delete problem #${id} and all associated solutions from SQLite?`)) {
      api.deleteHistoryItem(id)
        .then(() => {
          fetchHistory();
          if (selectedItem?.problem_id === id) setSelectedItem(null);
        })
        .catch(err => alert("Error deleting problem: " + err.message));
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL saved problems and benchmark timings?")) {
      api.clearAllHistory()
        .then(() => {
          fetchHistory();
          setSelectedItem(null);
        })
        .catch(err => alert("Error clearing history: " + err.message));
    }
  };

  const handleViewDetails = (problemId) => {
    setDetailLoading(true);
    api.getHistoryDetail(problemId)
      .then(res => {
        if (res.success && res.data) {
          setSelectedItem(res.data);
        }
      })
      .catch(err => alert("Could not fetch problem details: " + err.message))
      .finally(() => setDetailLoading(false));
  };

  const handleLoadInSolver = (problem) => {
    if (setLoadedProblem) {
      setLoadedProblem(problem);
      setActivePage('solver');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Search Bar */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <HistoryIcon className="w-4 h-4 text-sky-500" />
              SQLite Problem & Solution History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Persistent storage of solved systems, method timings, and classifications ({total} total records).
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleClearAll}
              disabled={records.length === 0}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/10 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All History</span>
            </button>
          </div>
        </div>

        {/* Search, Filter, Sort Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problem ID, method or classification..."
              className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </form>

          {/* Filter by Method */}
          <div className="relative">
            <select
              value={filterMethod}
              onChange={(e) => { setFilterMethod(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Algorithms</option>
              <option value="Gauss-Jordan Elimination">Gauss-Jordan</option>
              <option value="Inverse Matrix Method">Inverse Method</option>
              <option value="Cramer's Rule">Cramer's Rule</option>
              <option value="LU Decomposition">LU Decomposition</option>
            </select>
          </div>

          {/* Filter by Classification */}
          <div className="relative">
            <select
              value={filterClass}
              onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="">All Classifications</option>
              <option value="Unique">Unique Solution</option>
              <option value="Infinite">Infinite Solutions</option>
              <option value="Inconsistent">Inconsistent System</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="created_at-DESC">Newest First</option>
              <option value="created_at-ASC">Oldest First</option>
              <option value="matrix_size-DESC">Size (Largest)</option>
              <option value="matrix_size-ASC">Size (Smallest)</option>
              <option value="execution_time-ASC">Fastest Execution</option>
              <option value="execution_time-DESC">Slowest Execution</option>
            </select>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="text-center py-12 text-xs font-mono text-slate-400">
            Querying SQLite database...
          </div>
        ) : records.length > 0 ? (
          <div>
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-800 text-slate-400">
                  <th className="pb-3">Problem ID</th>
                  <th className="pb-3">Matrix Size</th>
                  <th className="pb-3">Algorithm</th>
                  <th className="pb-3">Classification</th>
                  <th className="pb-3">Execution Time</th>
                  <th className="pb-3">Residual ||Ax-b||∞</th>
                  <th className="pb-3">Created At</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-800/60">
                {records.map((r) => (
                  <tr key={`${r.problem_id}-${r.solution_id}`} className="hover:bg-slate-50 dark:hover:bg-navy-800/40 transition-colors">
                    <td className="py-3 font-bold text-sky-600 dark:text-sky-400">
                      #{r.problem_id}
                    </td>

                    <td className="py-3 text-slate-700 dark:text-slate-300 font-semibold">
                      {r.matrix_size}×{r.matrix_size}
                    </td>

                    <td className="py-3 text-slate-900 dark:text-slate-100 font-medium">
                      {r.method_name}
                    </td>

                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.classification === 'Unique'
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                          : r.classification === 'Inconsistent'
                          ? 'bg-rose-500/10 text-rose-500 border border-rose-500/30'
                          : 'bg-purple-500/10 text-purple-500 border border-purple-500/30'
                      }`}>
                        {r.classification}
                      </span>
                    </td>

                    <td className="py-3 text-slate-800 dark:text-slate-200">
                      {r.execution_time.toFixed(3)} ms
                    </td>

                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {r.residual !== null ? r.residual.toExponential(2) : 'N/A'}
                    </td>

                    <td className="py-3 text-slate-400 text-[11px]">
                      {r.created_at}
                    </td>

                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleViewDetails(r.problem_id)}
                          className="p-1 rounded text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleLoadInSolver({
                            matrix_size: r.matrix_size,
                            matrix_a: r.matrix_a,
                            vector_b: r.vector_b
                          })}
                          className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                          title="Load in Solver"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(r.problem_id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-navy-800"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">
                Page {page} of {totalPages} ({total} items)
              </span>

              <div className="flex items-center space-x-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 font-semibold"
                >
                  Previous
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 rounded bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-300 disabled:opacity-40 font-semibold"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-xs font-mono text-slate-400">
            No history records match the current filters.
          </div>
        )}
      </div>

      {/* Problem Details Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
              <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-sky-500" />
                Problem #{selectedItem.problem_id} Details ({selectedItem.matrix_size}×{selectedItem.matrix_size})
              </h3>
              <button
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Matrix A & Vector b */}
            <div>
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold block mb-2">
                Input Matrix A & Vector b:
              </span>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-mono text-xs max-h-48 overflow-y-auto">
                {selectedItem.matrix_a.map((row, rIdx) => (
                  <div key={rIdx} className="flex gap-2 py-0.5">
                    <span className="text-slate-400">[</span>
                    {row.map((val, cIdx) => (
                      <span key={cIdx} className="w-10 text-right text-slate-700 dark:text-slate-300">
                        {val}
                      </span>
                    ))}
                    <span className="text-slate-400">] [x] =</span>
                    <span className="font-bold text-sky-500">
                      {selectedItem.vector_b[rIdx]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Solutions Evaluated */}
            <div>
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold block mb-2">
                Evaluated Solutions:
              </span>
              <div className="space-y-2">
                {selectedItem.solutions.map((s, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-mono text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 dark:text-white">{s.method_name}</span>
                      <span className="text-slate-400">{s.execution_time.toFixed(3)} ms</span>
                    </div>
                    {s.solution ? (
                      <div className="text-sky-600 dark:text-sky-400 mt-1">
                        Solution: [{s.solution.map(v => typeof v === 'number' ? v.toFixed(4) : v).join(', ')}]
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">No solution vector ({s.classification})</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-navy-800">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleLoadInSolver(selectedItem);
                  setSelectedItem(null);
                }}
                className="px-4 py-2 rounded-lg text-xs font-mono font-bold bg-sky-500 hover:bg-sky-600 text-white shadow-sm flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Load Problem into Solver</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
