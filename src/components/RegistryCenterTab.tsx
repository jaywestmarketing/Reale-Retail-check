import React from 'react';
import {
  Layers,
  Code,
  Globe,
  Bot,
  Cpu,
  Bell,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  FileCode,
  Download,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import { MechanismItem } from '../types';

interface RegistryCenterTabProps {
  mechanisms: MechanismItem[];
  onOpenCodeModal: (mechanismId: string) => void;
}

export const RegistryCenterTab: React.FC<RegistryCenterTabProps> = ({
  mechanisms,
  onOpenCodeModal,
}) => {
  const getIcon = (id: string) => {
    if (id.includes('ingestion')) return Globe;
    if (id.includes('agent')) return Bot;
    if (id.includes('continuity') || id.includes('CONTINUITY')) return ShieldCheck;
    if (id.includes('cpp')) return Cpu;
    if (id.includes('scheduler')) return Bell;
    return Layers;
  };


  return (
    <div className="space-y-6">
      {/* Top Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Layers className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Mechanism Architecture & Interoperability Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Plug & Play Mechanisms
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Formal decoupling of scraping ingestion, agentic DOM element identification, and C++ SIMD mathematical analytics.
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Every mechanism in this system follows strict abstract contracts. Any mechanism can be isolated, swapped, or embedded into another programming environment (FastAPI, Scrapy, Rust, Electron, or Go) with zero modifications to the other mechanisms.
        </p>
      </div>

      {/* Mechanism Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {mechanisms.map((mech) => {
          const Icon = getIcon(mech.id);
          return (
            <div
              key={mech.id}
              className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{mech.name}</h3>
                      <span className="text-[11px] font-mono text-slate-500">{mech.unit}</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {mech.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {mech.description}
                </p>

                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5 text-[11px]">
                  <div className="flex items-start gap-1.5">
                    <span className="font-semibold text-slate-700 shrink-0">Interchangeable For:</span>
                    <span className="text-slate-600">{mech.interchangeable_for}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Input Contract:</span>
                    <code className="text-slate-800 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 block truncate">
                      {mech.input_contract}
                    </code>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 block mb-0.5">Output Contract:</span>
                    <code className="text-slate-800 font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 block truncate">
                      {mech.output_contract}
                    </code>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 font-mono">
                  ID: {mech.id}
                </div>
                <button
                  onClick={() => onOpenCodeModal(mech.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>Export Source Code</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Integration Guide for Other Projects */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
          How to Embed These Mechanisms into Other Coding Projects
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">1. Python Scraper Pipelines</span>
            <p>
              Drop <code className="text-slate-800 font-mono bg-white px-1 rounded border border-slate-200">ingestion_mechanism.py</code> and <code className="text-slate-800 font-mono bg-white px-1 rounded border border-slate-200">dom_agent_mechanism.py</code> into any Scrapy spider, Celery task, or FastAPI backend. They require zero external pip dependencies.
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">2. High-Performance C++ Core</span>
            <p>
              Compile <code className="text-slate-800 font-mono bg-white px-1 rounded border border-slate-200">price_analytics.cpp</code> with <code className="text-slate-800 font-mono bg-white px-1 rounded border border-slate-200">g++ -O3 -shared</code> to get native sub-microsecond price volatility analytics in Python (via ctypes), Rust (FFI), or Go (cgo).
            </p>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">3. Autonomous Element Agent</span>
            <p>
              Use <code className="text-slate-800 font-mono bg-white px-1 rounded border border-slate-200">AutonomousDOMPriceAgent.identify_price_element(html, url)</code> to automatically discover price selectors on unknown e-commerce layouts without hardcoded XPath lists.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
