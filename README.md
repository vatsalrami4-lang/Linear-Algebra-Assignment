# Linear System Solver Suite

A full-stack, scientific-computing web platform and mathematical laboratory designed to solve linear equation systems (\(Ax = b\)), compute general matrix operations, classify linear systems via the Rouché–Capelli theorem, and benchmark algorithm scaling behavior from \(2 \times 2\) up to \(200 \times 200\).

Every mathematical algorithm is **implemented strictly from scratch in Python** without reliance on external linear algebra solvers (such as NumPy's `linalg.solve` or SciPy).

---

## 🚀 Key Features

### 1. Four Scratch Linear Solvers
- **Gauss-Jordan Elimination**: Partial pivoting, elementary row operations, transformation to Reduced Row Echelon Form (RREF), calculation of solution vectors, and detection of Unique, Infinite, and Inconsistent systems.
- **Inverse Matrix Method**: Evaluates determinant, computes \(A^{-1}\) from scratch using \([A \mid I]\) Gauss-Jordan reduction with partial pivoting, calculates \(x = A^{-1} b\), and handles singular matrices.
- **Cramer's Rule**: Evaluates individual unknowns via \(x_j = \frac{\det(A_j)}{\det(A)}\). Supports both recursive Laplace cofactor expansion (\(O(n!)\)) and Gaussian elimination determinants (\(O(n^3)\)). Enforces configurable matrix size safeguards (\(\le 8 \times 8\)) to prevent exponential explosions.
- **LU Decomposition (Doolittle Algorithm with Partial Pivoting)**: Factors \(PA = LU\) where \(P\) is a permutation matrix, \(L\) is unit lower triangular, and \(U\) is upper triangular. Solves via forward substitution (\(Ly = Pb\)) and backward substitution (\(Ux = y\)).

### 2. General Matrix Operations
Implements 8 foundational matrix operations from scratch with step-by-step breakdown:
1. Matrix Addition (\(A + B\))
2. Matrix Subtraction (\(A - B\))
3. Matrix Multiplication (\(A \times B\))
4. Determinant Calculation (\(\det(A)\)) via Gaussian Elimination and Laplace Expansion
5. Matrix Inversion (\(A^{-1}\))
6. Matrix Transpose (\(A^T\))
7. Matrix Rank (\(\text{rank}(A)\)) via Row Echelon reduction
8. Identity Matrix Generation (\(I_n\))

### 3. Solution Classification (Rouché–Capelli Theorem)
Classifies linear systems using matrix rank computed from scratch:
- **Unique Solution**: \(\text{rank}(A) = \text{rank}([A \mid b]) = n\)
- **Infinitely Many Solutions**: \(\text{rank}(A) = \text{rank}([A \mid b]) < n\) (computes parametric solution vector \(x = x_p + t_1 v_1 + \dots\) and free variables)
- **Inconsistent System (No Solution)**: \(\text{rank}(A) \ne \text{rank}([A \mid b])\) (identifies the contradictory row \(0 = c\) and provides geometric/algebraic explanation)

### 4. Empirical Benchmarking Suite
- High-resolution timers (`time.perf_counter()`) for matrix dimensions from \(2 \times 2\) to \(200 \times 200\).
- Multi-iteration runs with median filtering.
- Interactive Chart.js charts with toggleable **Linear** and **Logarithmic (\(\log_{10}\))** scales.
- Visual demonstration of the **Cramer's Rule Factorial Wall** (\(O((n+1)!)\)).
- Persistent storage of benchmark iterations in SQLite.

### 5. Calculation History & Database Management
- SQLite database with three relational tables: `problems`, `solutions`, and `method_timings`.
- Search, filter by algorithm or classification, sort by date, size, or execution time.
- Modal inspection of matrices, vectors, and solutions.
- 1-click **"Load in Solver"** button to reload any historical problem.

---

## 🧠 Data Structures & Algorithms (DSA) Concepts

| DSA Concept | Project Implementation |
|---|---|
| **2D Arrays / Dynamic Vectors** | Contiguous memory matrix and vector representation |
| **Recursion** | Pure Laplace cofactor expansion for determinants with call tracking |
| **Matrix Row Operations** | In-place row swapping, normalization, and forward/backward elimination |
| **Numerical Decomposition** | \(PA = LU\) factorization, forward and backward substitutions |
| **Complexity Analysis** | Empirical runtime comparison of \(O(n^3)\) vs \(O(n^4)\) vs \(O(n!)\) |
| **Searching & Sorting** | SQLite indexed queries, median execution time selection |

### Theoretical Time Complexity Reference
- **Gauss-Jordan Elimination**: \(O(n^3)\)
- **Inverse Matrix Method**: \(O(n^3)\)
- **LU Decomposition**: \(O(\frac{2}{3}n^3) \approx O(n^3)\)
- **Cramer's Rule (Laplace Expansion)**: \((n+1) \cdot O(n!) = O((n+1)!)\)
- **Cramer's Rule (Elimination Det)**: \((n+1) \cdot O(n^3) = O(n^4)\)

---

## 🛠️ Technology Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS, Lucide Icons, Chart.js, React-ChartJS-2
- **Backend**: Python 3.14 / Flask, Flask-CORS
- **Database**: SQLite 3
- **Validation**: Independent NumPy verification test suite (`backend/test_algorithms.py`)

---

## 📁 Project Architecture

```
linear-system-solver-suite/
├── backend/
│   ├── algorithms/
│   │   ├── __init__.py
│   │   ├── matrix_operations.py   # Matrix add, sub, mul, transpose, identity, residual
│   │   ├── determinant.py         # Elimination O(n³) & Cofactor O(n!)
│   │   ├── matrix_rank.py         # Rank & augmented rank from scratch
│   │   ├── classifier.py          # Rouché-Capelli classification & parametric builder
│   │   ├── gauss_jordan.py        # Gauss-Jordan RREF solver with partial pivoting
│   │   ├── inverse_method.py      # Inverse matrix solver (x = A⁻¹ b)
│   │   ├── cramer_rule.py         # Cramer's rule with size safety guards
│   │   └── lu_decomposition.py    # Doolittle PA = LU decomposition solver
│   ├── database/
│   │   ├── __init__.py
│   │   ├── db.py                  # SQLite CRUD operations, indexes, cascades
│   │   └── solver_suite.db        # SQLite database
│   ├── routes/
│   │   ├── __init__.py
│   │   └── api.py                 # REST API routes
│   ├── test_algorithms.py         # Algorithm unit tests vs NumPy ground truth
│   ├── app.py                     # Flask backend & static SPA server
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx        # Navigation sidebar with responsive collapse
│   │   │   ├── Navbar.jsx         # Header with theme toggle & status badges
│   │   │   ├── MatrixGrid.jsx     # Dynamic matrix input (2–200, CSV/Text mode)
│   │   │   └── SolutionCard.jsx   # Solution display with residual & step logs
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx      # Telemetry, statistics & quick navigation
│   │   │   ├── Solver.jsx         # Main 4-algorithm linear solver
│   │   │   ├── MatrixOperations.jsx # 8 standalone matrix operations
│   │   │   ├── Classification.jsx # Rouché-Capelli rank analyzer
│   │   │   ├── Comparison.jsx     # Side-by-side consistency comparison
│   │   │   ├── Benchmarking.jsx   # 2–200 scaling charts (linear/log)
│   │   │   └── History.jsx        # Historical records search & reload
│   │   ├── services/
│   │   │   └── api.js             # API client
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── test_e2e.py                    # Full-stack E2E integration test suite
└── README.md
```

---

## ⚡ Installation & Execution

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Install Dependencies
```bash
# Backend dependencies
pip install -r backend/requirements.txt

# Frontend dependencies
cd frontend
npm install
cd ..
```

### 2. Run Algorithm Validation Tests
Verify all scratch algorithms against NumPy:
```bash
python backend/test_algorithms.py
python test_e2e.py
```

### 3. Run the Application

#### Option A: Single-Port Production Mode (Recommended)
Build the frontend and let Flask serve both the API and the React SPA:
```bash
# Build React frontend
cd frontend
npm run build
cd ..

# Start Flask Full-Stack Server
python backend/app.py
```
Open **`http://127.0.0.1:5000`** in your browser.

#### Option B: Dual Development Server Mode
```bash
# Terminal 1: Backend API Server
python backend/app.py

# Terminal 2: Frontend Vite Dev Server
cd frontend
npm run dev
```
Open **`http://127.0.0.1:5173`** in your browser. (API requests are automatically proxied to port 5000).

---

## 🧪 Database Schema

### Table: `problems`
- `problem_id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `matrix_a`: TEXT (JSON serialized 2D array)
- `vector_b`: TEXT (JSON serialized 1D array)
- `matrix_size`: INTEGER
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

### Table: `solutions`
- `solution_id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `problem_id`: INTEGER (FOREIGN KEY -> `problems(problem_id)` ON DELETE CASCADE)
- `method_name`: TEXT
- `solution`: TEXT (JSON serialized vector)
- `classification`: TEXT ('Unique', 'Infinite', 'Inconsistent', 'Singular')
- `execution_time`: REAL (in milliseconds)
- `residual`: REAL (\(\|Ax - b\|_\infty\))
- `status`: TEXT

### Table: `method_timings`
- `timing_id`: INTEGER PRIMARY KEY AUTOINCREMENT
- `problem_id`: INTEGER (FOREIGN KEY -> `problems(problem_id)` ON DELETE CASCADE, nullable)
- `method_name`: TEXT
- `matrix_size`: INTEGER
- `execution_time`: REAL (in milliseconds)
- `test_iteration`: INTEGER
- `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
