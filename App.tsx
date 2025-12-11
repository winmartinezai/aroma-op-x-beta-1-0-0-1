import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import JobsTable from './components/JobsTable';
import Dashboard from './components/Dashboard';
import PropertiesView from './components/PropertiesView';
import SettingsView from './components/SettingsView';
import StatusBoard from './components/StatusBoard';
import { View } from './types';
import { Menu } from 'lucide-react';
import EmployeesView from './components/EmployeesView';
import DailyReportView from './components/DailyReportView';
import { APP_VERSION } from './constants';

const MainLayout: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const { systemLogs, isImporting, settings, t } = useApp();

    // Sidebar State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Status Board State (Visibility)
    const [isStatusBoardOpen, setIsStatusBoardOpen] = useState(false);
    const [autoOpenLogs, setAutoOpenLogs] = useState(true);

    // Load Preference
    useEffect(() => {
        const savedPref = localStorage.getItem('aroma_auto_open_logs');
        if (savedPref !== null) {
            setAutoOpenLogs(savedPref === 'true');
        }
    }, []);

    const handleSetAutoOpenLogs = (val: boolean) => {
        setAutoOpenLogs(val);
        localStorage.setItem('aroma_auto_open_logs', String(val));
    };

    // Auto-open logs on new error/magic if enabled
    useEffect(() => {
        if (autoOpenLogs && systemLogs.length > 0) {
            const lastLog = systemLogs[systemLogs.length - 1];
            if (lastLog.type === 'error' || lastLog.type === 'magic') {
                setIsStatusBoardOpen(true);
            }
        }
    }, [systemLogs, autoOpenLogs]);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard': return <Dashboard />;
            case 'jobs': return <JobsTable />;
            case 'properties': return <PropertiesView />;
            case 'settings': return <SettingsView />;
            default: return <Dashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
            <Sidebar
                currentView={currentView}
                onChangeView={setCurrentView}
                collapsed={isSidebarCollapsed}
                onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Top Header */}
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 relative">
                    {/* Left: View Title */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={20} />
                        </button>
                        <h1 className="text-xl font-bold text-slate-800 uppercase tracking-tight">{t(currentView)}</h1>
                    </div>

                    {/* Center: Branding (Absolute Center) */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">Aroma Op-x</h2>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">OPERATIONS {APP_VERSION}</span>
                            <span className="text-[8px] text-slate-400 font-medium">Developed by Win Martinez Ai</span>
                            <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1 rounded">UPDATED: {new Date().toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Right: Actions (Empty for now, Import is in JobsTable) */}
                    <div className="w-20"></div>
                </header>

                <main className="flex-1 overflow-hidden relative">
                    {currentView === 'dashboard' && <Dashboard />}
                    {currentView === 'jobs' && <JobsTable />}
                    {currentView === 'employees' && <EmployeesView />}
                    {currentView === 'properties' && <PropertiesView />}
                    {currentView === 'settings' && <SettingsView />}
                    {currentView === 'daily-report' && <DailyReportView />}
                </main>

                {settings.enableDebugConsole && (
                    <StatusBoard
                        logs={systemLogs}
                        isOpen={isStatusBoardOpen}
                        setIsOpen={setIsStatusBoardOpen}
                        isProcessing={isImporting}
                        autoOpen={autoOpenLogs}
                        setAutoOpen={handleSetAutoOpenLogs}
                    />
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
    return (
        <AppProvider>
            <MainLayout />
        </AppProvider>
    );
};

export default App;