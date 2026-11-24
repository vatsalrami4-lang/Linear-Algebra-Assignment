import React, { useState } from 'react';
import { 
  Plus, 
  Minus, 
  X, 
  FlipHorizontal, 
  Binary, 
  Sparkles, 
  Activity, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Hash
} from 'lucide-react';
import { api } from '../services/api';

export default function MatrixOperations() {
  const [operation, setOperation] = useState('add'); // 'add', 'subtract', 'multiply', 'determinant', 'inverse', 'transpose', 'rank', 'identity'
  
  // Dimensions
  const [rowsA, setRowsA] = useState(3);
  const [colsA, setColsA] = useState(3);
  const [rowsB, setRowsB] = useState(3);
  const [colsB, setColsB] = useState(3);
  const [identityN, setIdentityN] = useState(4);

  // Matrices
  const [matrixA, setMatrixA] = useState([
    [1, 2, 3],
    [0, 1, 4],
    [5, 6, 0]
  ]);

  const [matrixB, setMatrixB] = useState([
    [2, 0, -1],
    [1, 3, 2],
    [0, -2, 1]
  ]);

  const [detMethod, setDetMethod] = useState('auto'); // 'auto', 'elimination', 'cofactor'
  const [isComputing, setIsComputing] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const operationsList = [
    { id: 'add', name: 'Addition (A + B)', binary: true, icon: Plus, desc: 'Element-wise addition: dimensions must be identical' },
    { id: 'subtract', name: 'Subtraction (A - B)', binary: true, icon: Minus, desc: 'Element-wise subtraction: dimensions must be identical' },
    { id: 'multiply', name: 'Multiplication (A × B)', binary: true, icon: X, desc: 'Matrix dot product: columns of A must match rows of B' },
    { id: 'determinant', name: 'Determinant det(A)', binary: false, squareOnly: true, icon: Sparkles, desc: 'Computed via Gaussian elimination O(n³) and recursive cofactor O(n!)' },
    { id: 'inverse', name: 'Matrix Inverse (A⁻¹)', binary: false, squareOnly: true, icon: Binary, desc: 'Computed via [A | I] Gauss-Jordan elimination with partial pivoting' },
    { id: 'transpose', name: 'Transpose (Aᵀ)', binary: false, icon: FlipHorizontal, desc: 'Row and column index swapping: maps (i, j) to (j, i)' },
    { id: 'rank', name: 'Matrix Rank (rank(A))', binary: false, icon: Hash, desc: 'Dimension of row space computed via row echelon form' },
    { id: 'identity', name: 'Identity Matrix (Iₙ)', binary: false, isGenerator: true, icon: Binary, desc: 'Generates n × n identity matrix with 1s on main diagonal' },
  ];

  const currentOp = operationsList.find(o => o.id === operation) || operationsList[0];

  const handleResizeA = (newR, newC) => {
    const r = Math.max(1, Math.min(20, parseInt(newR) || 1));
    const c = Math.max(1, Math.min(20, parseInt(newC) || 1));
    setRowsA(r);
    setColsA(c);
    const newA = Array(r).fill(0).map((_, i) =>
      Array(c).fill(0).map((_, j) => (matrixA[i] && matrixA[i][j] !== undefined ? matrixA[i][j] : (i === j ? 1 : 0)))
    );
    setMatrixA(newA);

    // If addition/subtraction, sync B's dimensions
    if (operation === 'add' || operation === 'subtract') {
      setRowsB(r);
      setColsB(c);
      const newB = Array(r).fill(0).map((_, i) =>
        Array(c).fill(0).map((_, j) => (matrixB[i] && matrixB[i][j] !== undefined ? matrixB[i][j] : 0))
      );
      setMatrixB(newB);
    } else if (operation === 'multiply') {
      // For multiplication, rows of B must match cols of A
      setRowsB(c);
      const newB = Array(c).fill(0).map((_, i) =>
        Array(colsB).fill(0).map((_, j) => (matrixB[i] && matrixB[i][j] !== undefined ? matrixB[i][j] : 0))
      );
      setMatrixB(newB);
    }
  };

  const handleResizeB = (newR, newC) => {
    const r = Math.max(1, Math.min(20, parseInt(newR) || 1));
    const c = Math.max(1, Math.min(20, parseInt(newC) || 1));
    setRowsB(r);
    setColsB(c);
    const newB = Array(r).fill(0).map((_, i) =>
      Array(c).fill(0).map((_, j) => (matrixB[i] && matrixB[i][j] !== undefined ? matrixB[i][j] : 0))
    );
    setMatrixB(newB);
  };

  const handleCellChangeA = (i, j, val) => {
    const num = val === '' ? '' : (isNaN(Number(val)) ? val : Number(val));
    const nextA = matrixA.map((row, rIdx) => {
      if (rIdx === i) {
        const nextRow = [...row];
        nextRow[j] = num;
        return nextRow;
      }
      return row;
    });
    setMatrixA(nextA);
  };

  const handleCellChangeB = (i, j, val) => {
    const num = val === '' ? '' : (isNaN(Number(val)) ? val : Number(val));
    const nextB = matrixB.map((row, rIdx) => {
      if (rIdx === i) {
        const nextRow = [...row];
        nextRow[j] = num;
        return nextRow;
      }
      return row;
    });
    setMatrixB(nextB);
  };

  const handleExecute = () => {
    setErrorMsg(null);
    setResult(null);

    // Dimension validations
    if (operation === 'add' || operation === 'subtract') {
      if (rowsA !== rowsB || colsA !== colsB) {
        setErrorMsg(`Dimension mismatch: Matrix A is ${rowsA}×${colsA} while Matrix B is ${rowsB}×${colsB}. They must be identical.`);
        return;
      }
    } else if (operation === 'multiply') {
      if (colsA !== rowsB) {
        setErrorMsg(`Dimension mismatch: Matrix A has ${colsA} columns while Matrix B has ${rowsB} rows. Inner dimensions must match.`);
        return;
      }
    } else if (currentOp.squareOnly) {
      if (rowsA !== colsA) {
        setErrorMsg(`Matrix must be square for ${currentOp.name}. Received ${rowsA}×${colsA}.`);
        return;
      }
    }

    setIsComputing(true);
    const payload = {
      operation,
      matrix_a: matrixA,
      matrix_b: currentOp.binary ? matrixB : undefined,
      det_method: detMethod,
      dimension: identityN
    };

    api.matrixOperation(payload)
      .then(res => {
        if (res.success) {
          setResult(res);
        } else {
          setErrorMsg(res.error || "Operation failed.");
        }
      })
      .catch(err => {
        setErrorMsg(err.message || "Failed to execute matrix operation.");
      })
      .finally(() => {
        setIsComputing(false);
      });
  };

  return (
    <div className="space-y-6">
      {/* Operation Selection Pills */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm">
        <h3 className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold mb-3">
          Select Matrix Operation:
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {operationsList.map((op) => {
            const Icon = op.icon;
            const isSelected = operation === op.id;
            return (
              <button
                key={op.id}
                onClick={() => {
                  setOperation(op.id);
                  setResult(null);
                  setErrorMsg(null);
                  if (op.squareOnly && rowsA !== colsA) {
                    handleResizeA(colsA, colsA);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500/40 text-sky-900 dark:text-sky-300 font-bold shadow-sm'
                    : 'bg-slate-50 dark:bg-navy-950/60 border-slate-200 dark:border-navy-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-navy-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-sky-500' : 'text-slate-400'}`} />
                  <span className="font-mono text-xs">{op.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans truncate">
                  {op.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Dimensions & Matrices Area */}
      <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-800">
          <div>
            <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <currentOp.icon className="w-4 h-4 text-sky-500" />
              <span>{currentOp.name}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentOp.desc}
            </p>
          </div>

          {operation === 'determinant' && (
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-navy-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700 text-xs font-mono">
              <span className="text-slate-500">Method:</span>
              <select
                value={detMethod}
                onChange={(e) => setDetMethod(e.target.value)}
                className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="auto">Auto (Both / Best)</option>
                <option value="elimination">Gaussian Elimination O(n³)</option>
                <option value="cofactor">Recursive Laplace Cofactor O(n!)</option>
              </select>
            </div>
          )}

          {operation === 'identity' && (
            <div className="flex items-center space-x-2 bg-slate-100 dark:bg-navy-800 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-navy-700 text-xs font-mono">
              <span className="text-slate-500">Dimension n:</span>
              <input
                type="number"
                min="1"
                max="50"
                value={identityN}
                onChange={(e) => setIdentityN(parseInt(e.target.value) || 1)}
                className="w-14 text-center bg-white dark:bg-navy-900 rounded border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>

        {/* Matrices Grids */}
        {operation !== 'identity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-5">
            {/* Matrix A */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
                  Matrix A ({rowsA} × {colsA})
                </span>
                <div className="flex items-center space-x-1.5 text-xs font-mono">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={rowsA}
                    onChange={(e) => handleResizeA(e.target.value, colsA)}
                    className="w-10 text-center rounded bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 py-0.5"
                    title="Rows of A"
                  />
                  <span>×</span>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={colsA}
                    disabled={currentOp.squareOnly}
                    onChange={(e) => handleResizeA(rowsA, e.target.value)}
                    className={`w-10 text-center rounded bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 py-0.5 ${
                      currentOp.squareOnly ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    title={currentOp.squareOnly ? "Must be square" : "Cols of A"}
                  />
                </div>
              </div>

              <div className="overflow-x-auto pb-2">
                <div 
                  className="grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${colsA}, minmax(44px, 1fr))` }}
                >
                  {matrixA.map((row, i) =>
                    row.map((val, j) => (
                      <input
                        key={`ma-${i}-${j}`}
                        type="text"
                        value={val}
                        onChange={(e) => handleCellChangeA(i, j, e.target.value)}
                        className="w-11 h-9 text-center font-mono text-xs rounded bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        title={`A[${i+1},${j+1}]`}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Matrix B (only for binary operations) */}
            {currentOp.binary && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold">
                    Matrix B ({rowsB} × {colsB})
                  </span>
                  <div className="flex items-center space-x-1.5 text-xs font-mono">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={rowsB}
                      disabled={operation === 'add' || operation === 'subtract' || operation === 'multiply'}
                      onChange={(e) => handleResizeB(e.target.value, colsB)}
                      className="w-10 text-center rounded bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 py-0.5 disabled:opacity-50"
                      title="Rows of B"
                    />
                    <span>×</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={colsB}
                      disabled={operation === 'add' || operation === 'subtract'}
                      onChange={(e) => handleResizeB(rowsB, e.target.value)}
                      className="w-10 text-center rounded bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 py-0.5 disabled:opacity-50"
                      title="Cols of B"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto pb-2">
                  <div 
                    className="grid gap-1.5"
                    style={{ gridTemplateColumns: `repeat(${colsB}, minmax(44px, 1fr))` }}
                  >
                    {matrixB.map((row, i) =>
                      row.map((val, j) => (
                        <input
                          key={`mb-${i}-${j}`}
                          type="text"
                          value={val}
                          onChange={(e) => handleCellChangeB(i, j, e.target.value)}
                          className="w-11 h-9 text-center font-mono text-xs rounded bg-white dark:bg-navy-900 border border-slate-300 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          title={`B[${i+1},${j+1}]`}
                        />
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compute Action */}
        <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-navy-800/80">
          <button
            onClick={handleExecute}
            disabled={isComputing}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-mono text-xs font-bold transition-all shadow-md shadow-sky-500/20 disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${isComputing ? 'animate-spin' : ''}`} />
            <span>{isComputing ? 'Calculating...' : `Compute ${currentOp.name}`}</span>
          </button>
        </div>
      </div>

      {/* Error notification */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="bg-white dark:bg-navy-900 rounded-xl border border-slate-200 dark:border-navy-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h4 className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                {result.operation} Output
              </h4>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Computed in {result.execution_time_ms.toFixed(3)} ms
            </span>
          </div>

          {/* If Result is a Matrix */}
          {(result.result_matrix || result.inverse_matrix || result.row_echelon_form) && (
            <div>
              <span className="text-xs font-mono uppercase text-slate-500 dark:text-slate-400 font-semibold block mb-2">
                Result Matrix:
              </span>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 overflow-x-auto inline-block">
                <div className="grid gap-2">
                  {(result.result_matrix || result.inverse_matrix || result.row_echelon_form).map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-2">
                      {row.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          className="w-14 h-9 flex items-center justify-center font-mono text-xs rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-sky-600 dark:text-sky-400 font-semibold"
                        >
                          {typeof cell === 'number' ? (Number.isInteger(cell) ? cell : cell.toFixed(4)) : cell}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* If Result is a Scalar (Determinant, Rank) */}
          {result.determinant !== undefined && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-mono">
              <div className="text-xs text-slate-500 mb-1">Calculated Determinant:</div>
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                det(A) = {typeof result.determinant === 'number' ? (Number.isInteger(result.determinant) ? result.determinant : result.determinant.toFixed(6)) : result.determinant}
              </div>

              {result.method_cofactor && (
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-navy-800 text-xs text-slate-500 space-y-1">
                  <div>Cofactor Expansion: {result.method_cofactor.determinant} ({result.method_cofactor.recursive_calls} recursive calls)</div>
                  <div>Gaussian Elimination: {result.method_elimination.determinant}</div>
                </div>
              )}
            </div>
          )}

          {result.rank !== undefined && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-mono">
              <div className="text-xs text-slate-500 mb-1">Matrix Rank:</div>
              <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                rank(A) = {result.rank}
              </div>
            </div>
          )}

          {/* Steps Explanation */}
          {result.steps && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-navy-950 border border-slate-200 dark:border-navy-800 font-mono text-xs text-slate-600 dark:text-slate-300">
              <span className="text-[10px] uppercase text-slate-400 block mb-2 font-semibold">
                Calculation Breakdown & Steps:
              </span>
              <div className="whitespace-pre-line leading-relaxed">
                {result.steps}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
