import React from 'react';
import {
  Layers,
  Code2,
  Cpu,
  CheckCircle,
  ExternalLink,
  Shield,
  Compass,
} from 'lucide-react';
import { MechanismItem } from '../types';

interface MechanismsHubTabProps {
  mechanisms: MechanismItem[];
  onOpenCodeModal: (id: string) => void;
}

export const MechanismsHubTab: React.FC<MechanismsHubTabProps> = ({
  mechanisms,
  onOpenCodeModal,
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2.5">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            Interchangeable Autonomous Mechanism Architecture
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1 max-w-3xl">
          Each mechanism operates as an independent, portable capability conforming to the 4-layer
          contract separation (Core, Contract, Adapter, Integration). Mechanisms can be exported,
          inspected, or pushed directly to GitHub.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mechanisms.map((m) => (
          <div
            key={m.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-sm transition-all"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span className="font-semibold text-indigo-700">{m.type}</span>
                <span className="font-medium text-emerald-700">{m.status}</span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 mb-1.5">
                {m.name}
              </h4>

              <p className="text-xs text-slate-600 line-clamp-3 mb-3">
                {m.description}
              </p>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1 mb-3">
                <p><strong>Unit:</strong> {m.unit}</p>
                <p className="line-clamp-1 font-mono text-[10px]"><strong>Input:</strong> {m.input_contract}</p>
                <p className="line-clamp-1 font-mono text-[10px]"><strong>Output:</strong> {m.output_contract}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">ID: {m.id}</span>
              <button
                onClick={() => onOpenCodeModal(m.id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Export Source</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
