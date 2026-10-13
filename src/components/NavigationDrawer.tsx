import React, { useState, useEffect } from 'react';
import {
  X,
  Compass,
  Activity,
  Gauge,
  Globe,
  ShieldCheck,
  Layers,
  Search,
  Github,
  ChevronRight,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  Cpu,
  Radio,
  FileCode2,
  Brain,
} from 'lucide-react';

export interface NavItem {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  count?: number;
  isAction?: boolean;
  action?: () => void;
}

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  onOpenNewTracker: () => void;
  onOpenGitHubPush: () => void;
  productCount: number;
  checkpointCount: number;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenNewTracker,
  onOpenGitHubPush,
  productCount,
  checkpointCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const categories = [
    {
      name: 'Autonomous Scanners & Data Engines',
      items: [
        {
          id: 'learning-engine',
          name: 'Cognitive Learning Engine',
          description: 'Doc-protocol discovery, user surface scanning, comparative delta & human-mimetic plans',
          icon: Brain,
          badge: 'Human-Mimetic',
        },
        {
          id: 'category-studio',
          name: 'Category Scan Studio',
          description: 'In-Depth 3-4h Tree Crawler, Checkpoint Resumption & Visual DOM Studio',
          icon: Compass,
          badge: '3-4h Engine',
        },
        {
          id: 'radar',
          name: 'Tracked Catalog Radar',
          description: 'Real-time catalog monitoring, price drop alerts & live SKU resolver',
          icon: Activity,
          count: productCount,
        },
      ],
    },
    {
      name: 'Browser & Network Laboratories',
      items: [
        {
          id: 'browser-benchmark',
          name: 'Browser Benchmarking Lab',
          description: 'Transport latency comparison, TLS TTFB & Anti-Bot evasion pass rates',
          icon: Gauge,
          badge: 'Active Probes',
        },
        {
          id: 'real-browser',
          name: 'Real Live In-App Browser',
          description: 'Interactive Chromium webview with Akamai 403 bypass & DOM reticle',
          icon: Globe,
          badge: '403 Bypass',
        },
      ],
    },
    {
      name: 'Resilience & Anti-Bot Ingress',
      items: [
        {
          id: 'continuity',
          name: '403 Ingress & Continuity',
          description: 'Execution Continuity Adapter, safe-transition checkpoints & failover',
          icon: ShieldCheck,
          badge: 'Protected',
        },
      ],
    },
    {
      name: 'Mechanism Architecture & Ecosystem',
      items: [
        {
          id: 'mechanisms',
          name: 'Mechanisms Architecture Hub',
          description: 'Reusable autonomous mechanisms catalog, schemas & export contracts',
          icon: Layers,
          badge: 'Manifest v1.2',
        },
      ],
    },
  ];

  const filteredCategories = categories.map((cat) => ({
    ...cat,
    items: cat.items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.items.length > 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 transition-transform animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-emerald-500 flex items-center justify-center text-white shadow-sm ring-2 ring-indigo-500/20">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900 text-sm tracking-tight">OmniPrice Studio</span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.2 rounded">
                  v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-500">Autonomous Mechanism Navigator</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/80 transition-colors cursor-pointer"
            title="Close navigation (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feature Search Filter */}
        <div className="p-4 border-b border-slate-100">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter features or mechanisms..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all placeholder:text-slate-400"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Categories & Feature List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {filteredCategories.map((cat) => (
            <div key={cat.name} className="space-y-2">
              <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {cat.name}
              </div>
              <div className="space-y-1">
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        onClose();
                      }}
                      className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-start gap-3 border ${
                        isActive
                          ? 'bg-indigo-50/80 border-indigo-200/80 text-indigo-950 shadow-xs'
                          : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-200/60 text-slate-700'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isActive
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-semibold truncate ${
                              isActive ? 'text-indigo-950 font-bold' : 'text-slate-800'
                            }`}
                          >
                            {item.name}
                          </span>
                          {item.badge && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                isActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                          {item.count !== undefined && (
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium shrink-0 ${
                                isActive
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {item.count} items
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                          {item.description}
                        </p>
                      </div>
                      <ChevronRight
                        className={`w-4 h-4 shrink-0 mt-2 transition-transform ${
                          isActive ? 'text-indigo-600 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Quick Action Tools */}
          <div className="pt-2 space-y-2 border-t border-slate-100">
            <div className="px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Quick Action Utilities
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenNewTracker();
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <Search className="w-4 h-4 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-800">Inspect URL</div>
                <div className="text-[10px] text-slate-500">Test product or catalog</div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenGitHubPush();
                }}
                className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition-colors cursor-pointer group"
              >
                <Github className="w-4 h-4 text-slate-800 mb-1 group-hover:scale-110 transition-transform" />
                <div className="text-xs font-semibold text-slate-800">Push to GitHub</div>
                <div className="text-[10px] text-slate-500">Sync code & datasets</div>
              </button>
            </div>
          </div>
        </div>

        {/* Drawer Footer Status */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 text-xs text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-slate-700">Continuity Ingress Operational</span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            Checkpoints: {checkpointCount}
          </span>
        </div>
      </div>
    </div>
  );
};
