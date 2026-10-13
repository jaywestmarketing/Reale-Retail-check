import React, { useState } from 'react';
import {
  Search,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { inspectUrl } from '../api';
import { AgentInspectResponse } from '../types';

interface AgentInspectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAdd: (productData: any) => void;
}

export const AgentInspectModal: React.FC<AgentInspectModalProps> = ({
  isOpen,
  onClose,
  onConfirmAdd,
}) => {
  const [inspectUrlInput, setInspectUrlInput] = useState('https://www.homedepot.com/b/Tools/N-5yc1vZc1xy');
  const [isLoading, setIsLoading] = useState(false);
  const [inspectResult, setInspectResult] = useState<AgentInspectResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const presets = [
    { label: 'The Home Depot (403 Bypass)', url: 'https://www.homedepot.com/b/Tools/N-5yc1vZc1xy' },
    { label: 'Walmart (PerimeterX Shield)', url: 'https://www.walmart.com/cp/electronics/3944' },
    { label: 'Target (Store Catalog)', url: 'https://www.target.com/c/home/-/N-5xtur' },
    { label: 'Best Buy (Tech Catalog)', url: 'https://www.bestbuy.com/site/electronics/computers-pcs/abcat0500000.c' },
  ];

  const handleInspect = async () => {
    if (!inspectUrlInput.trim()) return;
    setIsLoading(true);
    setErrorMsg('');
    setInspectResult(null);
    try {
      const res = await inspectUrl(inspectUrlInput.trim());
      setInspectResult(res);
    } catch (e: any) {
      setErrorMsg(e.message || 'Inspection failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackDiscovered = () => {
    if (!inspectResult) return;
    const price = inspectResult.agent_identification?.detected_price || 49.99;
    const title = inspectResult.agent_identification?.title || 'Inspected Store Item';
    onConfirmAdd({
      name: title,
      url: inspectUrlInput,
      retailer: inspectResult.ingestion?.retailer_detected || 'Store Target',
      primarySelector: inspectResult.agent_identification?.primary_selector || '.price',
      currentPrice: price,
      initialPrice: price,
      agentReasoning: inspectResult.agent_identification?.agent_reasoning || 'Inspected live via agent.',
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Inspect Store Target DOM &amp; 403 Status
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">403 Retailer Presets:</span>
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => setInspectUrlInput(p.url)}
              className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={inspectUrlInput}
            onChange={(e) => setInspectUrlInput(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
          />
          <button
            onClick={handleInspect}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? 'Inspecting...' : 'Inspect'}
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {inspectResult && (
          <div className="space-y-3 pt-2">
            {/* 403 Bypass status */}
            {(inspectResult.bypassed_403 || inspectResult.crawl_result?.bypassed_403) && (
              <div className="p-3 bg-emerald-50 text-emerald-900 text-xs rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold">403 Block Bypassed Successfully</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-mono">
                  Strategy: {inspectResult.winning_continuity_strategy || 'Google Search Ingress Gateway'}
                </span>
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">
                  {inspectResult.agent_identification?.title || 'Store Item Detected'}
                </span>
                <span className="text-lg font-bold text-emerald-600">
                  ${(inspectResult.agent_identification?.detected_price || 49.99).toFixed(2)}
                </span>
              </div>

              <p className="text-xs text-slate-600">
                <strong>Reasoning:</strong> {inspectResult.agent_identification?.agent_reasoning}
              </p>

              <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                <span>Selector: <code>{inspectResult.agent_identification?.primary_selector}</code></span>
                <span>·</span>
                <span>Latency: {inspectResult.ingestion?.latency_ms}ms</span>
              </div>
            </div>

            {/* Discovered Categories */}
            {inspectResult.crawl_result?.discovered_categories && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700">Discovered Category Tree:</span>
                <div className="flex flex-wrap gap-1.5">
                  {inspectResult.crawl_result.discovered_categories.slice(0, 8).map((cat: any, idx: number) => (
                    <span key={idx} className="text-[11px] bg-slate-100 border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md">
                      {cat.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={handleTrackDiscovered}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Track This Discovered Item
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
