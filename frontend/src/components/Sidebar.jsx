import React from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  Grid3X3, 
  GitFork, 
  Scale, 
  BarChart3, 
  History, 
  Cpu,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ activePage, setActivePage, collapsed, setCollapsed }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'solver', label: 'Linear Solver', icon: Calculator, badge: '4 Methods' },
    { id: 'operations', label: 'Matrix Operations', icon: Grid3X3, badge: '8 Ops' },
    { id: 'classification', label: 'Classification', icon: GitFork },
    { id: 'comparison', label: 'Algorithm Comparison', icon: Scale },
    { id: 'benchmarking', label: 'Benchmarking', icon: BarChart3 },
    { id: 'history', label: 'History & Logs', icon: History },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-full z-30 transition-all duration-300 flex flex-col border-r 
      bg-white dark:bg-navy-900 border-slate-200 dark:border-navy-800
      ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-200 dark:border-navy-800 justify-between">
        <div className="flex items-center space-x-3 overflow-hidden">
          <div className="w-10 h-10 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/30">
            <Cpu className="w-5 h-5" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white uppercase font-mono">
                Solver Suite
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-sans truncate">
                Linear Algebra DSA
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative
                ${isActive
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 dark:border-sky-500/30 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-navy-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${
                isActive ? 'text-sky-600 dark:text-sky-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'
              }`} />
              
              {!collapsed && (
                <span className="ml-3 truncate">{item.label}</span>
              )}

              {!collapsed && item.badge && (
                <span className="ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-navy-700">
                  {item.badge}
                </span>
              )}

              {/* Tooltip on collapsed */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom info */}
      <div className="p-4 border-t border-slate-200 dark:border-navy-800">
        <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          {!collapsed && (
            <span className="font-mono truncate">Python Engine • SQLite</span>
          )}
        </div>
      </div>
    </aside>
  );
}
