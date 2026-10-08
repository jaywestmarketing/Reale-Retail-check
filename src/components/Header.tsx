import React from 'react';
import {
  Activity,
  Bot,
  Cpu,
  Globe,
  Bell,
  Layers,
  Plus,
  Zap,
  Cloud,
  Compass,
  TrendingUp,
  Search,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewTracker: () => void;
  productCount: number;
  alertCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewTracker,
  productCount,
  alertCount,
}) => {
  const tabs = [
    { id: 'weighted-resolver', label: 'Experience-Weighted Resolver', icon: TrendingUp, badge: 'Dynamic Weights' },
    { id: 'catalog-signals', label: 'Catalog Signals & Downloads', icon: Compass, badge: 'Internal List' },
    { id: 'mechanisms-hub', label: 'Mechanism Health & Diagnostics', icon: Layers },
    { id: 'cloud-plan', label: '24/7 Cloud Planner', icon: Cloud },
    { id: 'radar', label: 'Catalog Ingestion Workbench', icon: Activity },
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-sm">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-900 tracking-tight">
                  Autonomous Mechanism Studio & Continuity Network
                </h1>
                <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Weighted Learning Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Interchangeable autonomous mechanisms, environment matrix (Runtime + Transport + Egress), and dynamic weight learning
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenNewTracker}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-emerald-400" />
              <span>Inspect Web Target</span>
            </button>
          </div>
        </div>

        {/* Mechanism Management Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 -mb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-slate-800 text-emerald-300' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
