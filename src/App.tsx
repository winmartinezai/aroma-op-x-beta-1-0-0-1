import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import StatusBoard from './components/StatusBoard';
import DateChooserDial from './components/DateChooserDial'; // Imported
import Dashboard from './pages/Dashboard';
import JobsMaster from './pages/JobsMaster';
import PropertiesPage from './pages/Properties';
import EmployeesPage from './pages/Employees';
import SettingsPage from './pages/Settings';
import InventoryView from './components/InventoryView';
import DocumentsView from './components/DocumentsView';
import EmployeePortal from './components/EmployeePortal';
import type { View } from './types/types'; // Check types path
import { Menu } from 'lucide-react';
import { APP_VERSION } from './utils/constants';

// Layout Component
const Layout: React.FC = () => {
  const { systemLogs, isImporting, settings, t, focusDateRange, setFocusDateRange, setJobsViewMode, jobs } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isStatusBoardOpen, setIsStatusBoardOpen] = useState(false);
  const [autoOpenLogs, setAutoOpenLogs] = useState(true);

  // Map location to View ID for Sidebar highlighting
  const getCurrentView = (): View => {
    const path = location.pathname;
    if (path === '/' || path.includes('dashboard')) return 'dashboard';
    if (path.includes('jobs')) return 'jobs';
    if (path.includes('employees')) return 'employees';
    if (path.includes('properties')) return 'properties';
    if (path.includes('settings')) return 'settings';
    if (path.includes('daily-report')) return 'daily-report';
    return 'dashboard';
  };

  const currentView = getCurrentView();

  const handleViewChange = (view: View) => {
    if (view === 'dashboard') navigate('/');
    else navigate('/' + view);
  };

  // Auto-open logs
  useEffect(() => {
    const savedPref = localStorage.getItem('aroma_auto_open_logs');
    if (savedPref !== null) setAutoOpenLogs(savedPref === 'true');
  }, []);

  const handleSetAutoOpenLogs = (val: boolean) => {
    setAutoOpenLogs(val);
    localStorage.setItem('aroma_auto_open_logs', String(val));
  };

  useEffect(() => {
    if (autoOpenLogs && systemLogs.length > 0) {
      const lastLog = systemLogs[systemLogs.length - 1];
      if (lastLog.type === 'error' || lastLog.type === 'magic') {
        setIsStatusBoardOpen(true);
      }
    }
  }, [systemLogs, autoOpenLogs]);

  return (
    <div
      className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 font-sans transition-all duration-300 ease-in-out selection:bg-indigo-500/30"
      style={{ zoom: settings.uiScale || 1 }}
    >
      <Sidebar
        currentView={currentView}
        onChangeView={handleViewChange}
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area - The "Light Core" */}
      <div className="relative flex min-w-0 flex-1 flex-col h-full overflow-hidden bg-slate-50/95 shadow-[0_0_40px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 md:rounded-l-3xl md:my-2 md:mr-2 border border-white/20">

        {/* Top Header */}
        <header className="relative z-10 flex shrink-0 flex-col border-b border-slate-200/60 bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 md:hidden transition-colors"
              >
                <Menu size={20} />
              </button>
              <h1 className="text-xl font-black uppercase tracking-tight text-slate-800 drop-shadow-sm">{t(currentView)}</h1>
            </div>

            {/* Central Badge (Visible on all screens) */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="flex items-center gap-2 rounded-full border border-slate-200/50 bg-slate-50/50 px-4 py-1.5 backdrop-blur-sm">
                <span className="text-[10px] font-bold tracking-widest text-indigo-500 uppercase">Operations</span>
                <span className="h-3 w-px bg-slate-300"></span>
                <span className="text-[10px] font-medium text-slate-400">v{APP_VERSION}</span>
              </div>
              {/* TIMESTAMP - Updates on each build/refresh to verify deployment */}
              <div className="mt-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full shadow-md">
                <span className="text-[10px] font-bold text-white tracking-wide">
                  🕐 {new Date().toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              </div>
            </div>

            <div className="w-20"></div>
          </div>

          {/* GLOBAL DATE DIAL - Persistent across all views */}
          <div className="px-4 pb-3">
            <DateChooserDial
              currentRange={focusDateRange || null}
              onRangeChange={(range) => {
                setFocusDateRange(range || undefined);
                setJobsViewMode('DATE_FILTERED');
              }}
              onClear={() => {
                setFocusDateRange(undefined);
                setJobsViewMode('VIEW_ALL');
              }}
              hasActiveFilter={!!focusDateRange}
            />
          </div>
        </header>

        <main className="relative flex-1 overflow-hidden bg-slate-50">
          <Outlet />
        </main>

        {
          settings.enableDebugConsole && (
            <StatusBoard
              logs={systemLogs}
              isOpen={isStatusBoardOpen}
              setIsOpen={setIsStatusBoardOpen}
              isProcessing={isImporting}
              autoOpen={autoOpenLogs}
              setAutoOpen={handleSetAutoOpenLogs}
              totalJobs={jobs.length}
              visibleJobs={jobs.length}
              hasActiveFilters={!!focusDateRange}
            />
          )
        }
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="jobs" element={<JobsMaster />} />
            <Route path="employees" element={<EmployeesPage />} />
            <Route path="properties" element={<PropertiesPage />} />
            <Route path="inventory" element={<InventoryView />} />
            <Route path="documents" element={<DocumentsView />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          {/* Employee Portal - Standalone Route (No Layout) */}
          <Route path="/employee-portal/:employeeId/:pin" element={<EmployeePortal />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
};

export default App;
