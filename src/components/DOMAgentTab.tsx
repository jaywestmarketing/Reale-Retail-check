import React, { useState } from 'react';
import {
  Bot,
  Play,
  Code,
  ShieldCheck,
  Target,
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
} from 'lucide-react';
import { inspectUrlWithAgent } from '../api';
import { AgentInspectResponse, PriceCandidate } from '../types';

interface DOMAgentTabProps {
  onOpenCodeModal: (mechanismId: string) => void;
}

export const DOMAgentTab: React.FC<DOMAgentTabProps> = ({ onOpenCodeModal }) => {
  const [testUrl, setTestUrl] = useState('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.45);
  const [prioritizeJsonLd, setPrioritizeJsonLd] = useState(true);
  const [penalizeStrike, setPenalizeStrike] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [agentResult, setAgentResult] = useState<AgentInspectResponse | null>(null);

  const handleRunDiscovery = async () => {
    setIsLoading(true);
    try {
      const res = await inspectUrlWithAgent(testUrl, {
        confidence_threshold: confidenceThreshold,
        prioritize_structured_data: prioritizeJsonLd,
        penalize_strikethrough: penalizeStrike,
      });
      setAgentResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Mechanism 2: Autonomous DOM Element Identification Agent
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Agentic Heuristic Core
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Discovers and binds to the target product price element on first visit, synthesizing resilient CSS & XPath selectors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCodeModal('mechanism-2-dom-agent')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Export Python Agent</span>
            </button>
          </div>
        </div>

        {/* Interchangeability Contract Description */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-600 space-y-1">
          <span className="font-semibold text-slate-800">Interchangeability Contract:</span>
          <p>
            Accepts raw HTML text and URL. Returns an <code className="text-slate-800 font-mono bg-white px-1 py-0.5 rounded border border-slate-200">AgentIdentificationResult</code> containing detected price, confidence rating, primary CSS selector, fallback XPath, and ranked candidate elements. Can be plugged into any scraper or browser extension.
          </p>
        </div>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tuning Heuristic Weights */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Agent Heuristic Hyperparameters
          </h3>

          <div className="space-y-4 text-xs">
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
                  onClick={() => setTestUrl('https://www.homedepot.com')}
                  className="text-amber-700 hover:underline cursor-pointer font-medium"
                >
                  The Home Depot
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setTestUrl('https://www.walmart.com')}
                  className="text-blue-700 hover:underline cursor-pointer font-medium"
                >
                  Walmart
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setTestUrl('https://www.example.com')}
                  className="text-emerald-700 hover:underline cursor-pointer font-medium"
                >
                  Example Store
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setTestUrl('https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html')}
                  className="text-amber-600 hover:underline cursor-pointer"
                >
                  Books Retailer
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setTestUrl('https://scrapeme.live/shop/Bulbasaur/')}
                  className="text-amber-600 hover:underline cursor-pointer"
                >
                  ScrapeMe Store
                </button>
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Confidence Threshold: {Math.round(confidenceThreshold * 100)}%
              </label>
              <input
                type="range"
                min="0.30"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full cursor-pointer"
              />
              <p className="text-[11px] text-slate-400 mt-0.5">
                Elements scoring below this score are discarded as noise.
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={prioritizeJsonLd}
                  onChange={(e) => setPrioritizeJsonLd(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span className="font-medium text-slate-700">Prioritize Schema.org JSON-LD Offer Price</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={penalizeStrike}
                  onChange={(e) => setPenalizeStrike(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span className="font-medium text-slate-700">Penalize Strikethrough & List Price Classes</span>
              </label>
            </div>

            <button
              onClick={handleRunDiscovery}
              disabled={isLoading}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isLoading ? (
                <span>Inspecting DOM Hierarchy...</span>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Execute Agent Discovery</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Agent Reasoning & Candidates Output */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-2">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Agent Autonomous Discovery Output
          </h3>

          {agentResult && agentResult.agent_identification ? (
            <div className="space-y-4">
              {/* Primary Discovery Card */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-amber-700 font-semibold block">
                      Primary Identified Element
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      {agentResult.agent_identification.title}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-slate-950">
                      {agentResult.agent_identification.currency}
                      {agentResult.agent_identification.detected_price?.toFixed(2)}
                    </span>
                    <div className="text-[11px] text-emerald-700 font-medium">
                      Confidence: {Math.round(agentResult.agent_identification.confidence_score * 100)}%
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200/60 font-mono text-xs text-slate-800 space-y-1">
                  <div className="flex gap-2">
                    <span className="text-slate-500 font-sans text-[11px] w-28 shrink-0">CSS Selector:</span>
                    <span className="text-slate-900 font-semibold break-all">
                      {agentResult.agent_identification.primary_selector}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 font-sans text-[11px] w-28 shrink-0">Fallback XPath:</span>
                    <span className="text-slate-600 break-all">
                      {agentResult.agent_identification.fallback_selector}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-amber-900 bg-white/70 p-2.5 rounded-lg border border-amber-200/50">
                  <span className="font-semibold">Agent Reasoning:</span> {agentResult.agent_identification.agent_reasoning}
                </p>
              </div>

              {/* Candidate Elements Breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">
                    Discovered Candidates Ranking ({agentResult.agent_identification.candidates.length})
                  </span>
                  <span className="text-slate-500 text-[11px]">Ranked by heuristic confidence weight</span>
                </div>

                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {agentResult.agent_identification.candidates.map((cand, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {cand.currency}{cand.parsed_price.toFixed(2)}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-200 text-slate-700">
                            {cand.strategy}
                          </span>
                        </div>
                        <span className="font-mono font-semibold text-emerald-700 text-xs">
                          {Math.round(cand.confidence * 100)}% Match
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-600 truncate">
                        {cand.selector}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {cand.rationale}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-lg">
              <Bot className="w-8 h-8 text-slate-300" />
              <p className="text-xs">Click "Execute Agent Discovery" to inspect the DOM and identify price elements</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
