
import React, { useEffect, useRef } from 'react';
import { Terminal, ChevronUp, ChevronDown, XCircle, AlertTriangle, CheckCircle, Activity, Power, Sparkles } from 'lucide-react';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'magic';
  message: string;
  detail?: string; // For technical details like specific apt numbers
}

interface StatusBoardProps {
  logs: LogEntry[];
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isProcessing?: boolean;
  autoOpen: boolean;
  setAutoOpen: (auto: boolean) => void;
  totalJobs?: number;        // Total jobs in database/memory
  visibleJobs?: number;      // Jobs currently visible after filters
  hasActiveFilters?: boolean; // Whether any filters are active
}

const StatusBoard: React.FC<StatusBoardProps> = ({
  logs,
  isOpen,
  setIsOpen,
  isProcessing,
  autoOpen,
  setAutoOpen,
  totalJobs = 0,
  visibleJobs = 0,
  hasActiveFilters = false
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (scrollRef.current && isOpen) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  // Get last log for the summary bar
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle size={14} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={14} className="text-yellow-500" />;
      case 'success': return <CheckCircle size={14} className="text-emerald-500" />;
      case 'magic': return <Sparkles size={14} className="text-purple-400 animate-pulse" />;
      default: return <Activity size={14} className="text-blue-400" />;
    }
  };

  const getTime = (isoDate: string) => {
    return isoDate.split('T')[1].split('.')[0]; // HH:MM:SS
  };

  const handleToggleAutoOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAutoOpen(!autoOpen);
  };

  const hiddenJobs = totalJobs - visibleJobs;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] ${isOpen ? 'h-64' : 'h-10'}`}>

      {/* Header / Summary Bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 bg-slate-900 border-t border-slate-700 flex items-center justify-between px-4 cursor-pointer hover:bg-slate-800 transition-colors"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`flex items-center gap-2 px-2 py-0.5 rounded text-xs font-bold font-mono ${isProcessing ? 'bg-blue-900/50 text-blue-400 animate-pulse' : 'bg-slate-800 text-slate-400'}`}>
            <Terminal size={12} />
            {isProcessing ? 'SYSTEM BUSY' : 'SYSTEM READY'}
          </div>

          {lastLog && !isOpen && (
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 truncate opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-forwards" style={{ animationDelay: '100ms', opacity: 1 }}>
              {getIcon(lastLog.type)}
              <span className="opacity-50">[{getTime(lastLog.timestamp)}]</span>
              <span className={lastLog.type === 'error' ? 'text-red-400' : lastLog.type === 'warning' ? 'text-yellow-400' : 'text-slate-300'}>
                {lastLog.message}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-500">
          {/* Auto Open Switch */}
          <div
            className="flex items-center gap-2 hover:text-slate-300 transition-colors"
            onClick={handleToggleAutoOpen}
            title={autoOpen ? "Console will open automatically on activity" : "Console stays closed (Click to open)"}
          >
            <div className={`w-8 h-4 rounded-full relative transition-colors ${autoOpen ? 'bg-emerald-600' : 'bg-slate-700'}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${autoOpen ? 'left-4.5' : 'left-0.5'}`} style={{ left: autoOpen ? '18px' : '2px' }}></div>
            </div>
            <span className="text-[10px] font-mono uppercase font-bold hidden sm:inline">Auto-Open</span>
          </div>

          <div className="h-4 w-px bg-slate-700"></div>

          {logs.length > 0 && <span className="text-[10px] font-mono bg-slate-800 px-1.5 py-0.5 rounded">{logs.length} events</span>}
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* Expanded Log Area */}
      {isOpen && (
        <div className="h-[calc(100%-2.5rem)] bg-slate-950/95 backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar font-mono text-xs space-y-1.5" ref={scrollRef}>
            {logs.length === 0 && (
              <div className="text-slate-600 italic px-2">No activity recorded yet.</div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 hover:bg-slate-900/50 p-1 rounded group">
                <span className="text-slate-600 shrink-0 select-none w-16 text-right">{getTime(log.timestamp)}</span>
                <div className="shrink-0 mt-0.5">{getIcon(log.type)}</div>
                <div className="flex-1 break-words">
                  <span className={`font-medium ${log.type === 'error' ? 'text-red-400' :
                    log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'success' ? 'text-emerald-400' : 'text-blue-300'
                    }`}>
                    {log.message}
                  </span>
                  {log.detail && (
                    <div className="text-slate-500 mt-0.5 pl-0 border-l-2 border-slate-800 ml-0.5 block whitespace-pre-wrap">
                      {log.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="h-8 bg-slate-900 border-t border-slate-800 flex items-center justify-between px-4">
            <div className="text-[10px] text-slate-500 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Power size={10} className={autoOpen ? 'text-emerald-500' : 'text-slate-600'} />
                {autoOpen ? 'Auto-Open Active' : 'Manual Mode'}
              </div>

              {/* Job Count Info */}
              {totalJobs > 0 && (
                <>
                  <div className="h-3 w-px bg-slate-700"></div>
                  <div className="flex items-center gap-2">
                    <span className="text-blue-400 font-bold">{totalJobs}</span>
                    <span>jobs in memory</span>
                    {hasActiveFilters && hiddenJobs > 0 && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span className="text-amber-400 font-bold">{visibleJobs}</span>
                        <span>visible</span>
                        <span className="text-slate-600">|</span>
                        <span className="text-red-400 font-bold">{hiddenJobs}</span>
                        <span>hidden by filters</span>
                        <span className="text-emerald-400 ml-2">→ Use "Show All Jobs" to see all</span>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">Aroma Op-x Debug Console</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusBoard;
