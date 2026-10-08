import React, { useState } from 'react';
import {
  Globe,
  Bot,
  Cpu,
  Bell,
  Layers,
  CheckCircle2,
  FileCode,
  Zap,
} from 'lucide-react';
import { IngestionTab } from './IngestionTab';
import { DOMAgentTab } from './DOMAgentTab';
import { CppAnalyticsTab } from './CppAnalyticsTab';
import { SchedulerAlertsTab } from './SchedulerAlertsTab';
import { RegistryCenterTab } from './RegistryCenterTab';
import { ExecutionContinuityTab } from './ExecutionContinuityTab';
import { CatalogSignalsTab } from './CatalogSignalsTab';
import { TrackedProduct, MechanismItem } from '../types';
import { Compass } from 'lucide-react';

interface MechanismsHubTabProps {
  products: TrackedProduct[];
  mechanisms: MechanismItem[];
  onOpenCodeModal: (mechanismId: string) => void;
  onTrackProduct?: (url: string) => void;
}

export const MechanismsHubTab: React.FC<MechanismsHubTabProps> = ({
  products,
  mechanisms,
  onOpenCodeModal,
  onTrackProduct,
}) => {
  const [selectedSubTab, setSelectedSubTab] = useState<string>('m7-catalog-signals');

  const subTabs = [
    { id: 'm7-catalog-signals', label: 'Mechanism 7: Catalog Signals & Downloads', icon: Compass, badge: 'Multi-Page' },
    { id: 'm3-continuity', label: 'Mechanism 3: 403 Error Continuity', icon: Zap, badge: 'Adaptive' },
    { id: 'm1-ingestion', label: 'Mechanism 1: Web Ingestion', icon: Globe, badge: 'Python' },
    { id: 'm2-agent', label: 'Mechanism 2: DOM Price Agent', icon: Bot, badge: 'Heuristic' },
    { id: 'm4-cpp', label: 'Mechanism 4: C++ Analytical Core', icon: Cpu, badge: 'C++17 -O3' },
    { id: 'm5-scheduler', label: 'Mechanism 5: Fluctuation Alerts', icon: Bell, badge: 'Scheduler' },
    { id: 'm6-registry', label: 'Mechanism 6: Registry & Export', icon: Layers, badge: 'Contracts' },
  ];


  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Mechanism Health & Diagnostics Center
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  All 5 Mechanisms Live
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Single unified inspection center to test, benchmark, configure, and export each decoupled mechanism.
              </p>
            </div>
          </div>
        </div>

        {/* Mechanism Selector Sub-tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2 border-t border-slate-100">
          {subTabs.map((st) => {
            const Icon = st.icon;
            const isSelected = selectedSubTab === st.id;
            return (
              <button
                key={st.id}
                onClick={() => setSelectedSubTab(st.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-300' : 'text-slate-500'}`} />
                <span>{st.label}</span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-slate-800 text-amber-300' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {st.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Render Selected Mechanism Component */}
      <div className="space-y-6">
        {selectedSubTab === 'm7-catalog-signals' && (
          <CatalogSignalsTab onTrackProduct={onTrackProduct} />
        )}
        {selectedSubTab === 'm1-ingestion' && (
          <IngestionTab onOpenCodeModal={onOpenCodeModal} />
        )}
        {selectedSubTab === 'm2-agent' && (
          <DOMAgentTab onOpenCodeModal={onOpenCodeModal} />
        )}
        {selectedSubTab === 'm3-continuity' && (
          <ExecutionContinuityTab onOpenCodeModal={onOpenCodeModal} />
        )}
        {selectedSubTab === 'm4-cpp' && (
          <CppAnalyticsTab onOpenCodeModal={onOpenCodeModal} />
        )}
        {selectedSubTab === 'm5-scheduler' && (
          <SchedulerAlertsTab
            products={products}
            onOpenCodeModal={onOpenCodeModal}
          />
        )}
        {selectedSubTab === 'm6-registry' && (
          <RegistryCenterTab
            mechanisms={mechanisms}
            onOpenCodeModal={onOpenCodeModal}
          />
        )}
      </div>
    </div>
  );
};
