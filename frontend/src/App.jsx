import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Solver from './pages/Solver';
import MatrixOperations from './pages/MatrixOperations';
import Classification from './pages/Classification';
import Comparison from './pages/Comparison';
import Benchmarking from './pages/Benchmarking';
import HistoryPage from './pages/History';

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [collapsed, setCollapsed] = useState(false);
  const [loadedProblem, setLoadedProblem] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Theme Management (default: dark)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('solver_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('solver_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simple state trigger
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'pl-20' : 'pl-64'}`}>
        {/* Navbar */}
        <Navbar
          activePage={activePage}
          theme={theme}
          toggleTheme={toggleTheme}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {/* Page Content */}
        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activePage === 'dashboard' && (
            <Dashboard
              setActivePage={setActivePage}
              setLoadedProblem={setLoadedProblem}
            />
          )}

          {activePage === 'solver' && (
            <Solver
              loadedProblem={loadedProblem}
              setLoadedProblem={setLoadedProblem}
            />
          )}

          {activePage === 'operations' && (
            <MatrixOperations />
          )}

          {activePage === 'classification' && (
            <Classification />
          )}

          {activePage === 'comparison' && (
            <Comparison />
          )}

          {activePage === 'benchmarking' && (
            <Benchmarking />
          )}

          {activePage === 'history' && (
            <HistoryPage
              setActivePage={setActivePage}
              setLoadedProblem={setLoadedProblem}
            />
          )}
        </main>

        {/* Footer */}
        <footer className="py-4 px-6 border-t border-slate-200 dark:border-navy-800 text-center text-xs font-mono text-slate-400">
          Linear System Solver Suite • Implemented with Python Flask & React • SQLite DB
        </footer>
      </div>
    </div>
  );
}
