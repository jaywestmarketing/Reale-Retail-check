import React, { useState } from 'react';
import {
  ShieldCheck,
  Globe,
  ArrowRight,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';
import { testContinuityResolution } from '../api';

export const ExecutionContinuityTab: React.FC = () => {
  const [testUrl, setTestUrl] = useState('https://www.homedepot.com/b/Tools/N-5yc1vZc1xy');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const presets = [
    { name: 'The Home Depot (Akamai 403)', url: 'https://www.homedepot.com/b/Tools/N-5yc1vZc1xy' },
    { name: 'Walmart (PerimeterX Shield)', url: 'https://www.walmart.com/cp/electronics/3944' },
    { name: 'Target (Shape Security)', url: 'https://www.target.com/c/home/-/N-5xtur' },
    { name: 'Example Store (Direct 200)', url: 'https://www.example.com' },
  ];

  const handleRunTest = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await testContinuityResolution(testUrl);
      setResult(res);
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Execution Continuity Network Adapter &amp; 403 Bypass Cascade
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Simulates and tests how autonomous ingress maintains task continuity across anti-bot barriers
            without requiring commercial VPNs. Demonstrates Google Search Organic Doorway ingress.
          </p>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Target Presets:</span>
          {presets.map((p) => (
            <button
              key={p.name}
              onClick={() => setTestUrl(p.url)}
              className="px-2.5 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer"
            >
              {p.name}
            </button>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
          />
          <button
            onClick={handleRunTest}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
            <span>{isLoading ? 'Resolving Continuity...' : 'Test 403 Ingress Cascade'}</span>
          </button>
        </div>
      </div>

      {/* Audit Trail Results */}
      {result && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Resolution Execution Audit Trail
              </h4>
              <p className="text-xs text-slate-500">
                Cascade order: Direct HTTP &rarr; TLS Session Mimic &rarr; Google Search Ingress Gateway
              </p>
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
              result.bypassed_403 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
            }`}>
              {result.bypassed_403 ? '403 Bypassed via Gateway' : 'Direct Egress 200 OK'}
            </span>
          </div>

          <div className="space-y-3">
            {result.audit_trail?.map((trail: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/70 flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Step {trail.attempt}: {trail.strategy}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                      trail.result_code === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      HTTP {trail.result_code}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{trail.rationale}</p>
                </div>
                <span className="text-xs font-mono text-slate-500">{trail.latency_ms}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
