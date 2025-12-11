import React, { useState } from 'react';
import { LayoutDashboard, ClipboardList, Users, Building, Settings, ChevronLeft, ChevronRight, PaintBucket, Sparkles, Package, FileChartColumn, FolderOpen, Bug, Dog } from 'lucide-react';
import FeatureRequestModal from './FeatureRequestModal';
import DogeReportModal from './DogeReportModal';
import ReportIssueModal from './ReportIssueModal';

import type { View } from '../types/types';
import { APP_VERSION } from '../utils/constants'; // Vercel Force Update 2
import { useApp } from '../context/AppContext';

interface SidebarProps {
  currentView: View;
  onChangeView: (view: View) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, collapsed, onToggleCollapse }) => {
  const { settings, t } = useApp();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isDogeOpen, setIsDogeOpen] = useState(false);
  const [isReportIssueOpen, setIsReportIssueOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { id: 'jobs', label: t('jobs'), icon: ClipboardList },
    { id: 'employees', label: t('employees'), icon: Users },
    { id: 'properties', label: t('properties'), icon: Building },
    { id: 'documents', label: 'Documents', icon: FolderOpen },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'settings', label: t('settings'), icon: Settings },
  ];

  return (
    <>
      <div
        className={`relative z-20 flex h-full shrink-0 flex-col border-r border-white/5 bg-slate-900/90 backdrop-blur-md transition-all duration-300 ${collapsed ? 'w-20' : 'w-60'}`}
      >
        {/* Top Logo Area */}
        <div className="flex h-20 shrink-0 items-center justify-center gap-3 border-b border-white/5 px-4">
          <div className={`transition - all duration - 300 ${collapsed ? 'scale-90' : 'scale-100'} `}>
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="h-10 w-10 rounded-lg object-contain bg-white/5"
              />
            ) : (
              <div className="group relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-slate-900 shadow-2xl transition-all duration-500 hover:shadow-indigo-500/40">
                {/* Futuristic Light Leak (Rotating Gradient) */}
                <div className="absolute inset-[-150%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_340deg,white_360deg)] opacity-0 group-hover:opacity-100 animate-[spin_4s_linear_infinite] transition-opacity duration-700" />
                <div className="absolute inset-[-150%] bg-[conic-gradient(from_180deg,transparent_0deg,transparent_340deg,#6366f1_360deg)] opacity-20 animate-[spin_4s_linear_infinite]" />

                {/* Inner Content */}
                <div className="absolute inset-[1px] rounded-xl bg-slate-950 flex items-center justify-center">
                  <div className="relative">
                    <PaintBucket size={20} className="text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                    <Sparkles size={12} className="absolute -top-1 -right-2 text-emerald-400 animate-pulse drop-shadow-[0_0_5px_rgba(52,211,153,0.8)]" />
                  </div>
                </div>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-500 whitespace-nowrap pl-2">
              <h1 className="font-sans text-2xl font-black tracking-tight text-white leading-none drop-shadow-lg">
                <span className="text-blue-600">AROMA</span> OP-X
              </h1>
              <div
                className="group cursor-help relative"
                title="It is said that Winfield was born inside a supercomputer during a power surge. Half man, half metric. He builds High-Performance Operations Centers that run on pure charisma. Once, he optimized a workflow so fast it finished before it started. But his true origin story remains a mystery, cut off by a firewall just as he was about to say... 

...y recuerda se feliz comete un helado."
              >
                <p className="text-[9px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-white to-purple-400 mt-1 mb-0.5 animate-shimmer bg-[length:200%_auto] tracking-wide hover:opacity-80 transition-opacity">
                  Developed by.- Win Martinez A<span className="text-red-500">i</span>
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                <span className="text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none">Operations Command Center</span>
              </div>
            </div>
          )}
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 space-y-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id as View)}
                className={`group relative flex w-full items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-300 
                ${isActive
                    ? 'bg-indigo-500/10 text-indigo-400 shadow-[0_0_20px_-5px_rgba(99,102,241,0.3)] ring-1 ring-inset ring-indigo-500/20 before:absolute before:inset-0 before:bg-gradient-to-r before:from-indigo-500/10 before:to-transparent before:opacity-0 before:transition-opacity hover:translate-x-0'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200 hover:translate-x-1'
                  } 
                ${collapsed ? 'justify-center px-0' : ''} `}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                )}

                <Icon
                  size={22}
                  className={`transition-colors duration-300 ${isActive ? 'text-indigo-400 drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'text-slate-500 group-hover:text-slate-300'} `}
                />

                {!collapsed && (
                  <span className={`tracking-wide transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'} `}>
                    {item.label}
                  </span>
                )}

                {/* Tooltip for Collapsed Mode */}
                {collapsed && (
                  <div className="absolute left-full ml-4 hidden whitespace-nowrap rounded-md border border-white/10 bg-slate-900/90 px-3 py-2 text-xs font-semibold text-white shadow-xl backdrop-blur-md group-hover:block z-50 animate-in fade-in slide-in-from-left-2">
                    {item.label}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer / Credits Section */}
        <div className="shrink-0 border-t border-white/5 bg-slate-900/50 backdrop-blur-sm p-4 space-y-4">

          {/* D.O.G.E. Report Button */}
          <button
            onClick={() => setIsDogeOpen(true)}
            className={`group relative flex w-full items-center justify-center gap-2 rounded-lg border border-indigo-500/50 bg-indigo-600/20 py-3 text-xs font-black text-indigo-300 shadow-lg shadow-indigo-500/10 transition-all hover:bg-indigo-500 hover:text-white hover:shadow-indigo-500/30 ${collapsed ? 'px-0' : 'px-4'}`}
          >
            <Dog size={16} className="animate-pulse" />
            {!collapsed && <span>D.O.G.E. Report (Daily)</span>}
          </button>

          {/* Low Profile Suggestion */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/10 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-slate-500/50 hover:text-slate-400"
          >
            <Sparkles size={14} />
            {!collapsed && <span>Suggest Feature</span>}
          </button>

          {!collapsed && (
            <div className="flex justify-center animate-in fade-in slide-in-from-bottom-2 duration-700">
              <div className="flex items-center gap-2 bg-slate-950/50 border border-white/5 rounded-full px-3 py-1 shadow-inner">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider">
                  {APP_VERSION} <span className="text-slate-600">BETA</span>
                </span>
              </div>
            </div>
          )}

          {/* DEBUG / REPORT ISSUE BUTTON (Underground System) */}
          {settings.enableDebugConsole && (
            <button
              onClick={() => setIsReportIssueOpen(true)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} text-red-400 hover:bg-white/5 hover:text-red-300`}
              title="Report Issue"
            >
              <Bug size={18} />
              {!collapsed && <span>Report Issue</span>}
            </button>
          )}

          <button
            onClick={onToggleCollapse}
            className="flex h-8 w-full items-center justify-center rounded-lg border border-white/5 bg-white/5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

      </div>
      <FeatureRequestModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />
      {/* Doge Report Modal needs to be created, commenting out for now until created, or creating stub */}
      {isDogeOpen && <DogeReportModal isOpen={isDogeOpen} onClose={() => setIsDogeOpen(false)} />}

      <ReportIssueModal isOpen={isReportIssueOpen} onClose={() => setIsReportIssueOpen(false)} />
    </>
  );
};

export default Sidebar;
