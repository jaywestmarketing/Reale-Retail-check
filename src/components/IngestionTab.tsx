import React, { useState } from 'react';
import {
  Globe,
  Zap,
  Play,
  Copy,
  Check,
  Code,
  Shield,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { inspectUrlWithAgent } from '../api';
import { IngestionInfo } from '../types';

interface IngestionTabProps {
  onOpenCodeModal: (mechanismId: string) => void;
}

export const IngestionTab: React.FC<IngestionTabProps> = ({ onOpenCodeModal }) => {
  const [testUrl, setTestUrl] = useState('https://scrapeme.live/shop/Bulbasaur/');
  const [uaPreset, setUaPreset] = useState('desktop_chrome');
  const [timeoutSec, setTimeoutSec] = useState(15);
  const [rateLimitSec, setRateLimitSec] = useState(0.5);
  const [isLoading, setIsLoading] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  const handleTestIngest = async () => {
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await inspectUrlWithAgent(testUrl, {
        user_agent_preset: uaPreset,
        timeout: timeoutSec,
      });
      if (res.ingestion) {
        setIngestionResult(res.ingestion);
      }
      if (res.error && !res.success) {
        setErrorMsg(res.error);
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to inspect website');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyHtml = () => {
    if (!ingestionResult?.html_preview) return;
    navigator.clipboard.writeText(ingestionResult.html_preview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Overview */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Mechanism 1: Web Ingestion & Transport Engine
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Python 3.10 Standard Lib
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Resilient HTTP/HTTPS transport, compression decoding (gzip/deflate), User-Agent header rotation, and rate-limiting.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCodeModal('mechanism-1-ingestion')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Export Python Module</span>
            </button>
          </div>
        </div>

        {/* Interchangeability Contract Description */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-600 space-y-1">
          <span className="font-semibold text-slate-800">Interchangeability Contract:</span>
          <p>
            Accepts <code className="text-slate-800 font-mono bg-white px-1 py-0.5 rounded border border-slate-200">IngestionOptions</code> (URL, timeout, headers, proxy) and returns standardized <code className="text-slate-800 font-mono bg-white px-1 py-0.5 rounded border border-slate-200">IngestionResult</code> (HTML text, status code, latency, retailer detection). Can be swapped with Playwright headless or proxy rotators with zero caller modifications.
          </p>
        </div>
      </div>

      {/* Control & Test Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Configuration & Test Trigger */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-1">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Transport Configuration
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Real Retailer or Product Web URL
              </label>
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="https://retailer.com/product/xyz"
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-slate-900"
              />
              <div className="flex flex-wrap gap-1.5 mt-1 text-[11px]">
                <span className="text-slate-400">Live test URLs:</span>
                <button
                  type="button"
                  onClick={() => setTestUrl('https://scrapeme.live/shop/Bulbasaur/')}
                  className="text-sky-600 hover:underline cursor-pointer"
                >
                  ScrapeMe Live Store
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setTestUrl('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')}
                  className="text-sky-600 hover:underline cursor-pointer"
                >
                  Books Retailer
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                User-Agent Profile
              </label>
              <select
                value={uaPreset}
                onChange={(e) => setUaPreset(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-slate-900"
              >
                <option value="desktop_chrome">Desktop Chrome (Windows 10 / Chrome 124)</option>
                <option value="desktop_safari">Desktop Safari (macOS / Safari 17.4)</option>
                <option value="desktop_firefox">Desktop Firefox (Windows / Firefox 125)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Timeout: {timeoutSec} seconds
              </label>
              <input
                type="range"
                min="3"
                max="30"
                value={timeoutSec}
                onChange={(e) => setTimeoutSec(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Per-Host Rate Limit Delay: {rateLimitSec}s
              </label>
              <input
                type="range"
                min="0.1"
                max="3.0"
                step="0.1"
                value={rateLimitSec}
                onChange={(e) => setRateLimitSec(parseFloat(e.target.value))}
                className="w-full cursor-pointer"
              />
            </div>

            <button
              onClick={handleTestIngest}
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isLoading ? (
                <span>Fetching Network Payload...</span>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Execute Test Ingestion</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Ingestion Live Output */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Network Payload & Ingestion Diagnostics
            </h3>
            {ingestionResult && (
              <button
                onClick={handleCopyHtml}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied HTML' : 'Copy HTML Snippet'}</span>
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 space-y-1">
              <span className="font-semibold block">{errorMsg}</span>
              {errorMsg.includes('403') && (
                <p className="text-[11px] text-rose-600">
                  Target retailer returned HTTP 403 Forbidden. The Execution Continuity Network Adapter has automatically engaged fallback resilience.
                </p>
              )}
            </div>
          )}

          {ingestionResult ? (
            <div className="space-y-4">
              {/* Telemetry chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Status</span>
                  <span className={`font-mono font-bold ${ingestionResult.status_code >= 400 ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {ingestionResult.status_code} {ingestionResult.status_code === 200 ? 'OK' : (ingestionResult.status_code === 403 ? 'Forbidden' : 'HTTP')}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Latency</span>
                  <span className="font-mono font-bold text-slate-800">
                    {ingestionResult.latency_ms} ms
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Retailer Detected</span>
                  <span className="font-medium text-slate-800">
                    {ingestionResult.retailer_detected}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Canonical URL</span>
                  <span className="font-mono text-slate-700 truncate block">
                    {ingestionResult.canonical_url}
                  </span>
                </div>
              </div>

              {/* Response Headers */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-700">Key Response Headers</span>
                <div className="bg-slate-900 rounded-lg p-3 font-mono text-[11px] text-slate-300 space-y-1 overflow-x-auto">
                  {Object.entries(ingestionResult.headers).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <span className="text-amber-400">{k}:</span>
                      <span className="text-slate-300 truncate">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* HTML Preview */}
              <div className="space-y-1">
                <span className="text-[11px] font-semibold text-slate-700">Raw HTML Stream Output</span>
                <pre className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs overflow-x-auto max-h-56 leading-relaxed">
                  {ingestionResult.html_preview}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-lg">
              <Globe className="w-8 h-8 text-slate-300" />
              <p className="text-xs">Click "Execute Test Ingestion" to fetch real or mock retailer HTML payloads</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
