import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Zap,
  Bot,
  Globe,
  Layers,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ArrowRight,
  Terminal,
  Activity,
  Sliders,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { testContinuityResolution } from '../api';
import { ContinuityResolutionResult, AdaptiveApproachAudit } from '../types';

interface ExecutionContinuityTabProps {
  onOpenCodeModal: (mechanismId: string) => void;
}

export const ExecutionContinuityTab: React.FC<ExecutionContinuityTabProps> = ({ onOpenCodeModal }) => {
  const [testUrl, setTestUrl] = useState('https://scrapeme.live/shop/');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ContinuityResolutionResult | null>(null);
  const [error, setError] = useState('');
  const [showRawJson, setShowRawJson] = useState(false);

  const presets = [
    { label: 'The Home Depot', url: 'https://www.homedepot.com', desc: 'Akamai edge bot shield & Google Ingress test' },
    { label: 'Walmart', url: 'https://www.walmart.com', desc: 'PerimeterX challenge & retail catalog test' },
    { label: 'Target', url: 'https://www.target.com', desc: 'Department hierarchy & edge WAF test' },
    { label: 'Best Buy', url: 'https://www.bestbuy.com', desc: 'Cloudflare / Akamai electronics doorway test' },
    { label: 'Example Store', url: 'https://www.example.com', desc: 'Store root & Google Search Ingress doorway test' },
    { label: 'ScrapeMe Live Store', url: 'https://scrapeme.live/shop/', desc: 'Live WooCommerce Store (Tests cURL HTTP/2)' },
    { label: 'Books To Scrape', url: 'https://books.toscrape.com/catalogue/category/books/travel_2/index.html', desc: 'Category Catalog Hub' },
    { label: 'Simulated 403 Forbidden', url: 'https://httpbin.org/status/403', desc: 'Direct HTTP 403 status code test' },
  ];

  const handleRunCascade = async (targetUrl = testUrl) => {
    if (!targetUrl.trim()) return;
    setIsRunning(true);
    setError('');
    setResult(null);

    try {
      const res = await testContinuityResolution(targetUrl.trim());
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Continuity resolution cascade failed');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview & Architecture Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Execution Continuity & 403 Error Resolution Adapter
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                  EXECUTION_CONTINUITY_NETWORK_ADAPTER
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Maintains autonomous crawler continuity when encountering HTTP 403 Forbidden, bot-shield firewalls, or TLS fingerprint blocks.
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenCodeModal('EXECUTION_CONTINUITY_NETWORK_ADAPTER')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>View Python Contract & Adapters</span>
          </button>
        </div>

        {/* Reusable Mechanism Layer Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Layer A: Core</span>
            <span className="font-semibold text-slate-900">Checkpoint Engine</span>
            <span className="text-[10px] text-slate-500 block">Freeze & validate transitions</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Layer B: Contract</span>
            <span className="font-semibold text-slate-900">ConnectivityAdapterContract</span>
            <span className="text-[10px] text-slate-500 block">Standardized lifecycle semantics</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Layer C: Adapters</span>
            <span className="font-semibold text-slate-900">5 Cascading Transports</span>
            <span className="text-[10px] text-slate-500 block">cURL HTTP/2, Session, Safari, Mobile</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Layer D: Host</span>
            <span className="font-semibold text-slate-900">Crawler & Ingestion Pipeline</span>
            <span className="text-[10px] text-slate-500 block">Automatic seamless retry recovery</span>
          </div>
        </div>
      </div>

      {/* Interactive 403 Resolution Cascade Simulator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Live 403 Error Resolution Cascade Simulator</span>
          </h4>
          <p className="text-xs text-slate-500">
            Test how the autonomous agent systematically attempts different connectivity adapters and browser profiles until it figures a way around 403 Forbidden errors.
          </p>
        </div>

        {/* Target URL Input */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="Enter URL to test 403 error recovery (e.g. https://httpbin.org/status/403)..."
                className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 font-mono"
              />
            </div>
            <button
              onClick={() => handleRunCascade()}
              disabled={isRunning || !testUrl.trim()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Trying Strategies...' : 'Run 403 Resolution Cascade'}</span>
            </button>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-medium text-slate-500">Presets:</span>
            {presets.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setTestUrl(p.url);
                  handleRunCascade(p.url);
                }}
                className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer border border-slate-200"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
            {error}
          </div>
        )}

        {/* Resolution Cascade Output Display */}
        {result && (
          <div className="space-y-4 pt-4 border-t border-slate-100 animate-in fade-in duration-200">
            {/* Outcome Status Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                result.resolved
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {result.resolved ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <span className="font-bold text-sm">
                    {result.resolved
                      ? '403 Forbidden Resolved & Bypassed Successfully!'
                      : 'All 5 Cascading Strategies Attempted'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90 max-w-2xl">
                  {result.explanation}
                </p>
              </div>

              <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/50">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 shadow-2xs font-semibold">
                  Attempts: {result.total_attempts} | {result.total_latency_ms} ms
                </span>
                {result.winning_strategy && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                    Winner: {result.winning_strategy}
                  </span>
                )}
              </div>
            </div>

            {/* Audit Trail Cascade Steps (Detailed Breakdown of Each Way Attempted) */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Adaptive Strategy Execution Cascade ({result.audit_trail.length} Approaches Tried):
              </span>

              <div className="space-y-2">
                {result.audit_trail.map((audit: AdaptiveApproachAudit, idx: number) => {
                  const isSuccess = audit.outcome === 'SUCCESS_RESOLVED';
                  const isInitial = audit.attempt_number === 0;

                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isSuccess
                          ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                          : isInitial
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-mono font-bold shrink-0 ${
                              isSuccess
                                ? 'bg-emerald-600 text-white'
                                : isInitial
                                ? 'bg-rose-600 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            #{audit.attempt_number}
                          </span>
                          <div>
                            <span className="font-semibold text-xs text-slate-900">
                              {audit.strategy_name}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 ml-2">
                              [{audit.strategy_id}]
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                              audit.status_code === 200
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : audit.status_code === 403
                                ? 'bg-rose-100 text-rose-800 border-rose-300'
                                : 'bg-amber-100 text-amber-800 border-amber-300'
                            }`}
                          >
                            HTTP {audit.status_code}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {audit.latency_ms} ms
                          </span>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-slate-600 space-y-0.5 pl-8">
                        <p className="font-medium text-slate-700">{audit.reasoning}</p>
                        <p className="text-[11px] text-slate-500 font-mono">{audit.details}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Toggle Raw JSON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowRawJson(!showRawJson)}
                className="text-xs text-slate-500 hover:text-slate-800 font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{showRawJson ? 'Hide Raw Audit JSON' : 'Inspect Raw Audit JSON'}</span>
                {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showRawJson && (
                <pre className="mt-2 p-3 bg-slate-950 text-emerald-400 rounded-xl text-[11px] font-mono overflow-x-auto max-h-60">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Explanatory Cards: Why Retailers 403 & How The Mechanism Solves It */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          How the 5 Continuity Adapters Bypass HTTP 403 Edge Blocks:
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">1. OpenSSL cURL HTTP/2</span>
            <p className="text-slate-600 text-[11px]">
              Python's standard library uses a distinct TLS client-hello signature (JA3 hash) that Akamai and Cloudflare block with 403. Subprocess cURL uses system OpenSSL ciphers and true HTTP/2 multiplexing.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">2. Session Warmup Cookie Jar</span>
            <p className="text-slate-600 text-[11px]">
              Direct deep links to product pages trigger anti-hotlinking rules. Pre-flighting the domain root or favicon collects edge tokens (e.g. <code className="text-indigo-600">bm_s</code>, <code className="text-indigo-600">__cf_bm</code>) before requesting target catalog pages.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">3. Clean macOS Safari Profile</span>
            <p className="text-slate-600 text-[11px]">
              Chromium client hints (<code className="text-indigo-600">Sec-Ch-Ua</code>) can trigger anti-bot algorithms if inconsistent. Apple Safari uses a clean, authentic WebKit header layout that avoids client-hint checks.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">4. Mobile Device Viewport</span>
            <p className="text-slate-600 text-[11px]">
              Retailers often employ lighter bot-protection walls on mobile devices to preserve user battery and cellular bandwidth, allowing mobile-profile requests to pass through.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">5. URL Normalization</span>
            <p className="text-slate-600 text-[11px]">
              Removes tracking query tokens (e.g. <code className="text-indigo-600">?utm_*</code>, <code className="text-indigo-600">&ref=*</code>) and tests trailing slash canonical routes to avoid bot redirect traps.
            </p>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
            <span className="font-bold text-slate-900 block">Checkpoint-Before-Transition</span>
            <p className="text-slate-600 text-[11px]">
              Freezes task state, classifies transition safety (<code className="text-indigo-600">SAFE_TO_TRANSITION</code>), validates HTTP 200 payload authenticity, and restores state seamlessly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
