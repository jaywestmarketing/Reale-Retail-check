import React, { useState } from 'react';
import {
  Menu,
  Compass,
  Activity,
  Layers,
  ShieldCheck,
  Search,
  Github,
  Gauge,
  Globe,
  Sparkles,
  Brain,
} from 'lucide-react';
import { NavigationDrawer } from './NavigationDrawer';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTracker: () => void;
  onOpenGitHubPush: () => void;
  checkpointCount: number;
  productCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTracker,
  onOpenGitHubPush,
  checkpointCount,
  productCount,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const tabs = [
    { id: 'learning-engine', label: 'Learning Engine', icon: Brain, badge: 'Human-Mimetic' },
    { id: 'category-studio', label: 'Category Studio', icon: Compass, badge: '3-4h Engine' },
    { id: 'browser-benchmark', label: 'Browser Benchmark', icon: Gauge, badge: 'Active' },
    { id: 'real-browser', label: 'Real Browser', icon: Globe, badge: '403 Bypass' },
    { id: 'radar', label: 'Tracked Radar', icon: Activity, count: productCount },
    { id: 'continuity', label: '403 & Continuity', icon: ShieldCheck },
    { id: 'mechanisms', label: 'Mechanisms Hub', icon: Layers },
  ];

  return (
    <>
      <header className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Hamburger Button & Brand */}
            <div className="flex items-center gap-3">
              {/* Hamburger Nav Button */}
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-all border border-slate-200/80 cursor-pointer shadow-2xs group"
                aria-label="Open feature categories menu"
                title="Open feature categories drawer (Esc to close)"
              >
                <Menu className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
                <span className="hidden md:inline font-bold">Categories</span>
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
              </button>

              {/* Brand Logo & Title */}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-500/20 shrink-0">
                  <Compass className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                      OmniPrice Studio
                    </h1>
                    <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50/90 border border-indigo-200/60 px-2 py-0.5 rounded-md hidden sm:inline">
                      Autonomous Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden lg:block leading-none mt-0.5">
                    Interchangeable mechanisms · Resumable checkpoints · Anti-bot egress
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenGitHubPush}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer border border-slate-200/60"
                title="Push mechanisms and scan datasets to GitHub"
              >
                <Github className="w-3.5 h-3.5 text-slate-800" />
                <span className="hidden sm:inline">Push to GitHub</span>
              </button>

              <button
                onClick={onOpenNewTracker}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-indigo-200" />
                <span>Inspect Target</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar Strip - Scrollable with all tabs & clean indicators */}
          <div className="flex items-center gap-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                      isActive ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.badge}
                    </span>
                  )}
                  {tab.count !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                      isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Slide-out Hamburger Categories Navigation Drawer */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTracker={onOpenNewTracker}
        onOpenGitHubPush={onOpenGitHubPush}
        productCount={productCount}
        checkpointCount={checkpointCount}
      />
    </>
  );
};
