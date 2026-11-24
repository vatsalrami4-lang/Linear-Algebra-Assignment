import React, { useState, useEffect } from 'react';
import { Shuffle, FileText, Trash2, Sliders, Eye } from 'lucide-react';
import { api } from '../services/api';

export default function MatrixGrid({
  matrixA,
  setMatrixA,
  vectorB,
  setVectorB,
  size,
  setSize,
  showVectorB = true,
  onLoadedSample,
  allowNonSquare = false,
  cols = size,
  setCols = null
}) {
  const [samples, setSamples] = useState([]);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'text'
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [randomModal, setRandomModal] = useState(false);
  const [randomMode, setRandomMode] = useState('well_conditioned');
  const [integerOnly, setIntegerOnly] = useState(true);

  // Load sample systems on mount
  useEffect(() => {
    api.getSamples()
      .then(res => {
        if (res.samples) setSamples(res.samples);
      })
      .catch(err => console.error("Could not load samples:", err));
  }, []);

  // Update text representation when matrixA / vectorB changes
  useEffect(() => {
    if (matrixA && matrixA.length > 0) {
      const formattedA = matrixA.map(row => row.join(', ')).join('\n');
      setTextA(formattedA);
    }
    if (vectorB && vectorB.length > 0) {
      setTextB(vectorB.join(', '));
    }
  }, [matrixA, vectorB]);

  const handleSizeChange = (newSize) => {
    const s = Math.max(2, Math.min(200, parseInt(newSize) || 2));
    setSize(s);
    if (setCols) setCols(s);

    // Resize matrix A preserving existing values
    const newA = Array(s).fill(0).map((_, r) => {
      return Array(s).fill(0).map((_, c) => {
        if (matrixA && matrixA[r] && matrixA[r][c] !== undefined) {
          return matrixA[r][c];
        }
        return r === c ? 1 : 0;
      });
    });
    setMatrixA(newA);

    // Resize vector b
    if (showVectorB) {
      const newB = Array(s).fill(0).map((_, i) => {
        if (vectorB && vectorB[i] !== undefined) {
          return vectorB[i];
        }
        return 1;
      });
      setVectorB(newB);
    }
  };

  const handleCellChangeA = (r, c, val) => {
    const num = val === '' ? '' : (isNaN(Number(val)) ? val : Number(val));
    const nextA = matrixA.map((row, rowIdx) => {
      if (rowIdx === r) {
        const nextRow = [...row];
        nextRow[c] = num;
        return nextRow;
      }
      return row;
    });
    setMatrixA(nextA);
  };

  const handleCellChangeB = (i, val) => {
    const num = val === '' ? '' : (isNaN(Number(val)) ? val : Number(val));
    const nextB = [...vectorB];
    nextB[i] = num;
    setVectorB(nextB);
  };

  const handleApplyText = () => {
    try {
      // Parse text A
      const rows = textA.trim().split('\n').filter(line => line.trim().length > 0);
      const parsedA = rows.map(line => {
        return line.trim().split(/[\s,]+/).map(v => {
          const num = parseFloat(v);
          if (isNaN(num)) throw new Error(`Invalid numeric entry: "${v}"`);
          return num;
        });
      });

      if (parsedA.length === 0) throw new Error("Matrix A cannot be empty.");
      const r = parsedA.length;
      const c = parsedA[0].length;
      for (let i = 1; i < r; i++) {
        if (parsedA[i].length !== c) {
          throw new Error(`Inconsistent row lengths in row ${i + 1}: expected ${c} elements, got ${parsedA[i].length}`);
        }
      }

      setSize(r);
      if (setCols) setCols(c);
      setMatrixA(parsedA);

      if (showVectorB) {
        const parsedB = textB.trim().split(/[\s,]+/).map(v => {
          const num = parseFloat(v);
          if (isNaN(num)) throw new Error(`Invalid vector entry: "${v}"`);
          return num;
        });
        if (parsedB.length !== r) {
          throw new Error(`Vector b length (${parsedB.length}) must match Matrix A row count (${r}).`);
        }
        setVectorB(parsedB);
      }
      setActiveTab('grid');
    } catch (err) {
      alert(`Format Error: ${err.message}`);
    }
  };

  const handleRandomGenerate = () => {
    api.generateRandom(size, randomMode, -10, 10, integerOnly)
      .then(res => {
        if (res.success) {
          setMatrixA(res.matrix_a);
          if (showVectorB && res.vector_b) {
            setVectorB(res.vector_b);
          }
          setRandomModal(false);
        }
      })
      .catch(err => alert("Generation error: " + err.message));
  };

  const handleLoadSample = (sample) => {
    setSize(sample.size);
    if (setCols) setCols(sample.size);
    setMatrixA(sample.matrix_a);
    if (showVectorB && sample.vector_b) {
      setVectorB(sample.vector_b);
    }
    if (onLoadedSample) onLoadedSample(sample);
  };

  const handleClear = () => {
    const s = size;
    const zerosA = Array(s).fill(0).map(() => Array(s).fill(0));
    setMatrixA(zerosA);
    if (showVectorB) {
      setVectorB(Array(s).fill(0));
    }
  };

  const isLarge = size > 10;

  return (
    <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
              Dimension:
            </span>
            <input
              type="number"
              min="2"
              max="200"
              value={size}
              onChange={(e) => handleSizeChange(e.target.value)}
              className="w-16 px-2 py-1 text-center font-mono text-sm font-semibold rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <span className="text-xs font-mono text-slate-400">
              × {allowNonSquare && cols ? cols : size}
            </span>
          </div>

          {/* Quick preset pills */}
          <div className="hidden sm:flex items-center space-x-1">
            {[2, 3, 4, 5, 8, 10, 20, 50].map((s) => (
              <button
                key={s}
                onClick={() => handleSizeChange(s)}
                className={`px-2 py-0.5 text-xs font-mono rounded ${
                  size === s
                    ? 'bg-sky-500 text-white font-bold'
                    : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700'
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Sample loader */}
          {samples.length > 0 && (
            <div className="relative inline-block">
              <select
                onChange={(e) => {
                  const s = samples.find(item => item.id === e.target.value);
                  if (s) handleLoadSample(s);
                  e.target.value = '';
                }}
                defaultValue=""
                className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-navy-800 border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
              >
                <option value="" disabled>Load Sample Equation...</option>
                {samples.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.size}×{s.size})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Random generator */}
          <button
            onClick={() => setRandomModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Random</span>
          </button>

          {/* Tab switcher: Grid vs Text */}
          <div className="flex items-center rounded-lg bg-slate-100 dark:bg-navy-800 p-0.5 border border-slate-300 dark:border-navy-700 text-xs font-mono">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'grid'
                  ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Interactive Grid
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                activeTab === 'text'
                  ? 'bg-white dark:bg-navy-700 text-slate-900 dark:text-white shadow-sm font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              CSV / Raw Text
            </button>
          </div>

          {/* Clear */}
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
            title="Reset Matrix with 0s"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="mt-4">
        {activeTab === 'grid' ? (
          <div>
            {isLarge ? (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 text-xs font-mono text-amber-700 dark:text-amber-300 flex items-center justify-between">
                <span>
                  Large Matrix Mode: {size}×{size}. Showing preview of top-left 6×6 block. Use "CSV / Raw Text" tab or Random generator to edit entire matrix.
                </span>
                <button
                  onClick={() => setActiveTab('text')}
                  className="underline hover:text-amber-900 dark:hover:text-white font-bold ml-2"
                >
                  Edit Full Matrix Text
                </button>
              </div>
            ) : null}

            <div className="overflow-x-auto pb-2">
              <div className="inline-flex items-start gap-4">
                {/* Matrix A Grid */}
                <div className="flex flex-col">
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                    <span>Coefficient Matrix A ({size}×{matrixA?.[0]?.length || size})</span>
                    <span className="text-[10px] text-slate-400 font-mono">Row × Col</span>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
                    <div 
                      className="grid gap-1.5"
                      style={{
                        gridTemplateColumns: `repeat(${Math.min(matrixA?.[0]?.length || size, isLarge ? 6 : size)}, minmax(48px, 1fr))`
                      }}
                    >
                      {(matrixA || []).slice(0, isLarge ? 6 : size).map((row, r) =>
                        row.slice(0, isLarge ? 6 : row.length).map((val, c) => (
                          <input
                            key={`a-${r}-${c}`}
                            type="text"
                            value={val}
                            onChange={(e) => handleCellChangeA(r, c, e.target.value)}
                            className="w-12 h-9 text-center font-mono text-xs rounded bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500 hover:border-sky-400/50 transition-colors"
                            title={`A[${r+1},${c+1}]`}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Operator symbol: = or * x = */}
                {showVectorB && (
                  <div className="flex flex-col items-center justify-center pt-8">
                    <span className="font-mono text-xs text-slate-400 uppercase font-semibold">
                      [x] =
                    </span>
                  </div>
                )}

                {/* Vector b */}
                {showVectorB && (
                  <div className="flex flex-col">
                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                      Vector b ({size}×1)
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
                      <div className="grid gap-1.5">
                        {(vectorB || []).slice(0, isLarge ? 6 : size).map((val, i) => (
                          <input
                            key={`b-${i}`}
                            type="text"
                            value={val}
                            onChange={(e) => handleCellChangeB(i, e.target.value)}
                            className="w-14 h-9 text-center font-mono text-xs rounded bg-white dark:bg-navy-900 border border-sky-300/60 dark:border-sky-500/30 text-sky-600 dark:text-sky-300 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
                            title={`b[${i+1}]`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Text / CSV Raw Editor */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                Matrix A (Rows separated by newlines, columns separated by comma or space):
              </label>
              <textarea
                value={textA}
                onChange={(e) => setTextA(e.target.value)}
                rows={Math.min(Math.max(size, 4), 12)}
                className="w-full p-3 font-mono text-xs rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                placeholder="2, 1, -1&#10;-3, -1, 2&#10;-2, 1, 2"
              />
            </div>

            {showVectorB && (
              <div>
                <label className="block text-xs font-mono text-slate-500 dark:text-slate-400 mb-1">
                  Vector b (Values separated by comma or space):
                </label>
                <input
                  type="text"
                  value={textB}
                  onChange={(e) => setTextB(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs rounded-lg bg-slate-50 dark:bg-navy-950 border border-slate-300 dark:border-navy-700 text-sky-600 dark:text-sky-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  placeholder="8, -11, -3"
                />
              </div>
            )}

            <button
              onClick={handleApplyText}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-mono font-semibold transition-colors"
            >
              Parse & Apply Dimensions
            </button>
          </div>
        )}
      </div>

      {/* Random Generator Modal */}
      {randomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono mb-4 flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-sky-500" />
              Generate Random System
            </h3>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 mb-1 font-semibold">
                  Matrix Generation Mode:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rmode"
                      value="well_conditioned"
                      checked={randomMode === 'well_conditioned'}
                      onChange={(e) => setRandomMode(e.target.value)}
                      className="text-sky-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Diagonally Dominant (Guaranteed Unique Solution)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rmode"
                      value="random"
                      checked={randomMode === 'random'}
                      onChange={(e) => setRandomMode(e.target.value)}
                      className="text-sky-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Standard Random Distribution (-10 to 10)
                    </span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="rmode"
                      value="singular"
                      checked={randomMode === 'singular'}
                      onChange={(e) => setRandomMode(e.target.value)}
                      className="text-sky-500"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      Singular / Dependent Rows (det = 0)
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-600 dark:text-slate-400">Values:</span>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={integerOnly}
                    onChange={(e) => setIntegerOnly(e.target.checked)}
                    className="rounded text-sky-500"
                  />
                  <span className="text-slate-700 dark:text-slate-300">Integers only</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setRandomModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRandomGenerate}
                className="px-4 py-2 rounded-lg text-xs font-mono font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-sm"
              >
                Generate {size}×{size} System
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
