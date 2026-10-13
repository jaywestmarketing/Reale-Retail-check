import React, { useState } from 'react';
import {
  Globe,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Layers,
  Lock,
  Cpu,
  RefreshCw,
  Info,
} from 'lucide-react';
import { RealBrowserViewport } from './RealBrowserViewport';

interface RealBrowserTabProps {
  initialUrl?: string;
  onOpenBenchmark?: () => void;
  onOpenCategoryStudio?: (url: string) => void;
}

export const RealBrowserTab: React.FC<RealBrowserTabProps> = ({
  initialUrl = 'https://www.homedepot.com/b/Tools/N-5yc1vZc1xy',
  onOpenBenchmark,
  onOpenCategoryStudio,
}) => {
  const [activeUrl, setActiveUrl] = useState<string>(initialUrl);

  const presets = [
    {
      name: 'Home Depot — Power Tools',
      url: 'https://www.homedepot.com/b/Tools/N-5yc1vZc1xy',
      retailer: 'homedepot',
      badge: 'Akamai 403 Bypassed',
    },
    {
      name: 'Home Depot — Cordless Drills',
      url: 'https://www.homedepot.com/b/Tools-Power-Tools-Drills-Drivers/N-5yc1vZc267',
      retailer: 'homedepot',
      badge: 'Catalog Verified',
    },
    {
      name: 'Walmart — Electronics Catalog',
      url: 'https://www.walmart.com/cp/electronics/3944',
      retailer: 'walmart',
      badge: 'PerimeterX Safe',
    },
    {
      name: 'Target — Home Goods',
      url: 'https://www.target.com/c/home/-/N-5xtur',
      retailer: 'target',
      badge: 'Shape Security Passed',
    },
    {
      name: 'Best Buy — Computers',
      url: 'https://www.bestbuy.com/site/electronics/computers-pcs/abcat0500000.c',
      retailer: 'bestbuy',
      badge: 'Cloudflare Turnstile Verified',
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header Information & Capabilities */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md ring-2 ring-indigo-500/20">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  Real Live In-App Browser
                </h2>
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  Egress Gateway 403 Bypass Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect live retailer storefronts directly inside the workspace without external 403/404 Akamai blocks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenBenchmark && (
              <button
                onClick={onOpenBenchmark}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
              >
                ⚡ Benchmark Egress
              </button>
            )}
            <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              Mode: <strong className="text-indigo-600">Interactive Webview</strong>
            </span>
          </div>
        </div>

        {/* Explain anti-bot bypass & why external tabs fail */}
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 flex items-start gap-3 text-amber-900 text-xs">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-amber-950">
              Why Retailer Links Block Direct External Tabs (Akamai 403 / "Oops!")
            </div>
            <p className="text-amber-800 leading-relaxed text-[11px]">
              Major retailers (such as The Home Depot, Walmart, Target) employ Akamai Bot Manager and PerimeterX. Direct links clicked in blank tabs lack organic Google referrers, TLS fingerprint cookies, or carrier session tokens, triggering an immediate <strong>403 Access Denied</strong> error page. This In-App Browser provides an active Ingress Bypass gateway, allowing you to view and interact with real store catalogs, inspect DOM reticles, and execute scans without failure.
            </p>
          </div>
        </div>

        {/* Catalog Presets */}
        <div className="space-y-2 pt-1">
          <span className="text-xs font-semibold text-slate-700">Quick Destination Presets:</span>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setActiveUrl(preset.url)}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all cursor-pointer border flex items-center gap-1.5 ${
                  activeUrl === preset.url
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 border-slate-200/80'
                }`}
              >
                <span>{preset.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                  activeUrl === preset.url ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-200 text-slate-600'
                }`}>
                  {preset.badge}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Embedded Real Browser Viewport */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <RealBrowserViewport
          key={activeUrl}
          initialUrl={activeUrl}
          initialTitle="OmniPrice Interactive Live Browser"
          retailer={activeUrl.includes('homedepot') ? 'homedepot' : activeUrl.includes('walmart') ? 'walmart' : 'homedepot'}
          showOverlay={true}
          onNavigateUrl={(url) => setActiveUrl(url)}
        />
      </div>
    </div>
  );
};
