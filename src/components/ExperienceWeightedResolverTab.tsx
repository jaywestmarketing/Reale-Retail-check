import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  Layers,
  Cpu,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ArrowRight,
  TrendingUp,
  Server,
  Terminal,
  Database,
  RotateCcw,
  PlusCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  fetchExperienceState,
  setExperienceEnvironment,
  updateExperienceCoefficients,
  recordExperience,
  resetExperienceWeights,
  testContinuityResolution,
} from '../api';
import {
  ExperienceStateResponse,
  StrategyWeightProfile,
  EnvironmentProfile,
  ContinuityResolutionResult,
  WeightCoefficients,
} from '../types';

interface Props {
  onOpenCodeModal: (mechanismId: string) => void;
}

export const ExperienceWeightedResolverTab: React.FC<Props> = ({ onOpenCodeModal }) => {
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState<ExperienceStateResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [actionNotice, setActionNotice] = useState<string>('');

  // Cascade Live Run
  const [testUrl, setTestUrl] = useState('https://httpbin.org/status/403');
  const [isRunningCascade, setIsRunningCascade] = useState(false);
  const [cascadeResult, setCascadeResult] = useState<ContinuityResolutionResult | null>(null);

  // Coefficients Editor Modal/Drawer
  const [showCoeffEditor, setShowCoeffEditor] = useState(false);
  const [coeffs, setCoeffs] = useState<WeightCoefficients>({
    w_semantic: 0.35,
    w_stability: 0.25,
    w_correctness: 0.15,
    w_speed: 0.10,
    w_resource: 0.08,
    w_env_history: 0.07,
  });

  // Custom Experience Logger
  const [showLogForm, setShowLogForm] = useState(false);
  const [customStrat, setCustomStrat] = useState('FIREFOX_BOOTSTRAP_PERSISTENT');
  const [customStatus, setCustomStatus] = useState(200);
  const [customLatency, setCustomLatency] = useState(420);
  const [customSemantic, setCustomSemantic] = useState(1.0);
  const [customStability, setCustomStability] = useState(0.95);
  const [customCorrectness, setCustomCorrectness] = useState(0.95);
  const [customNotes, setCustomNotes] = useState('Empirical environment test on Oracle Cloud');

  const loadState = async () => {
    try {
      setLoading(true);
      const data = await fetchExperienceState();
      setState(data);
      if (data.coefficients) {
        setCoeffs(data.coefficients);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load experience state');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadState();
  }, []);

  const handleSelectEnvironment = async (envId: string) => {
    try {
      setActionNotice(`Switching active environment profile to ${envId}...`);
      await setExperienceEnvironment(envId);
      await loadState();
      setActionNotice(`Active environment switched to ${envId}. Strategy weights recalculated!`);
      setTimeout(() => setActionNotice(''), 3500);
    } catch (err: any) {
      setError(err.message || 'Failed to switch environment');
    }
  };

  const handleResetToBaseline = async () => {
    if (!window.confirm('Reset all learned weights back to the empirical Oracle Cloud baseline?')) return;
    try {
      setActionNotice('Resetting weights to empirical baseline...');
      await resetExperienceWeights();
      await loadState();
      setActionNotice('Weights reset to empirical Oracle Cloud baseline!');
      setTimeout(() => setActionNotice(''), 3500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSaveCoeffs = async () => {
    try {
      await updateExperienceCoefficients(coeffs);
      await loadState();
      setShowCoeffEditor(false);
      setActionNotice('Weight criteria coefficients updated!');
      setTimeout(() => setActionNotice(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRecordExperience = async () => {
    try {
      setActionNotice('Logging new experience & recalculating strategy weights...');
      await recordExperience({
        strategy_id: customStrat,
        status_code: customStatus,
        latency_ms: customLatency,
        semantic_success: customSemantic,
        sustained_stability: customStability,
        data_correctness: customCorrectness,
        notes: customNotes,
      });
      await loadState();
      setShowLogForm(false);
      setActionNotice(`Experience recorded! Weights updated for ${customStrat}`);
      setTimeout(() => setActionNotice(''), 3500);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleQuickScenario = async (
    stratId: string,
    statusCode: number,
    latencyMs: number,
    sem: number,
    stab: number,
    corr: number,
    scenarioName: string
  ) => {
    try {
      setActionNotice(`Executing test scenario: "${scenarioName}"...`);
      await recordExperience({
        strategy_id: stratId,
        status_code: statusCode,
        latency_ms: latencyMs,
        semantic_success: sem,
        sustained_stability: stab,
        data_correctness: corr,
        notes: `Simulated environment run: ${scenarioName}`,
      });
      await loadState();
      setActionNotice(`Learned from experience: "${scenarioName}". Dynamic weights updated!`);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRunWeightedCascade = async (targetUrl = testUrl) => {
    if (!targetUrl.trim()) return;
    setIsRunningCascade(true);
    setCascadeResult(null);
    setError('');

    try {
      const res = await testContinuityResolution(targetUrl.trim());
      setCascadeResult(res);
      // Refresh weights state since the cascade logs experiences
      await loadState();
    } catch (err: any) {
      setError(err.message || 'Continuity cascade failed');
    } finally {
      setIsRunningCascade(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Mechanism Architecture & Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Dynamic Experience-Weighted Decision Resolver & Environment Matrix
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  EXPERIENCE_WEIGHTED_DECISION_RESOLVER
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Replaces fixed fallback sequences with weighted decision-making based on past experiences across Runtime, Transport, and Egress combinations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => onOpenCodeModal('EXPERIENCE_WEIGHTED_DECISION_RESOLVER')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              <FileCode className="w-4 h-4 text-indigo-600" />
              <span>View Reusable Mechanism Code</span>
            </button>
            <button
              onClick={handleResetToBaseline}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors cursor-pointer"
              title="Reset weights back to Oracle Cloud VPN empirical tests"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Baseline</span>
            </button>
          </div>
        </div>

        {/* Action Notice Banner */}
        {actionNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-medium text-emerald-900 flex items-center gap-2 animate-in fade-in duration-200">
            <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        {/* Layer Breakdown Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Layer A: Core</span>
            <span className="font-semibold text-slate-900">Multi-Objective Bayesian Weight Engine</span>
            <span className="text-[10px] text-slate-500 block">Recency decay & continuous updating</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Layer B: Contract</span>
            <span className="font-semibold text-slate-900">ExperienceRecord & WeightVector</span>
            <span className="text-[10px] text-slate-500 block">Standardized interoperability schema</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Layer C: Adapters</span>
            <span className="font-semibold text-slate-900">File Storage & Environment Profiler</span>
            <span className="text-[10px] text-slate-500 block">Persists historical experience state</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase block">Layer D: Host</span>
            <span className="font-semibold text-slate-900">Execution Continuity Controller</span>
            <span className="text-[10px] text-slate-500 block">Prioritizes top-weighted strategy first</span>
          </div>
        </div>
      </div>

      {/* Environment Profiler & Multi-Variable Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Server className="w-4 h-4 text-indigo-600" />
              <span>Multi-Variable Environment Matrix (Runtime + Transport + Egress)</span>
            </h4>
            <p className="text-xs text-slate-500">
              The resolver evaluates behavior as a combination of runtime, transport, and egress rather than a single universal anti-bot block.
            </p>
          </div>

          <button
            onClick={() => setShowCoeffEditor(!showCoeffEditor)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>{showCoeffEditor ? 'Close Criteria Weights' : 'Adjust Weight Criteria (35% / 25% / 15%)'}</span>
          </button>
        </div>

        {/* Environment Selection Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {state?.available_environments.map((env) => {
            const isActive = state.active_environment.environment_id === env.environment_id;
            return (
              <button
                key={env.environment_id}
                onClick={() => handleSelectEnvironment(env.environment_id)}
                className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-50/60 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{env.name}</span>
                  {isActive && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-indigo-600 text-white font-semibold">
                      Active
                    </span>
                  )}
                </div>
                <div className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Egress:</span>
                    <span className="font-mono text-slate-800">{env.egress_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Runtime:</span>
                    <span className="font-mono text-slate-800">{env.runtime_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transport:</span>
                    <span className="font-mono text-slate-800">{env.transport_type}</span>
                  </div>
                </div>
                {env.notes && (
                  <p className="mt-2 text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5 line-clamp-2">
                    {env.notes}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* Criteria Weight Tuning Drawer */}
        {showCoeffEditor && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900">
                Decision Weighting Criteria Configuration
              </span>
              <span className="text-[11px] text-slate-500">
                Heavily weights semantic success & sustained stability over speed alone
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block text-[11px]">
                  Semantic Success ({(coeffs.w_semantic * 100).toFixed(0)}%)
                </label>
                <span className="text-[10px] text-slate-500 block">HTTP 200 vs 206/403</span>
                <input
                  type="range"
                  min="0.10"
                  max="0.60"
                  step="0.05"
                  value={coeffs.w_semantic}
                  onChange={(e) => setCoeffs({ ...coeffs, w_semantic: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block text-[11px]">
                  Sustained Stability ({(coeffs.w_stability * 100).toFixed(0)}%)
                </label>
                <span className="text-[10px] text-slate-500 block">5m/10m duration</span>
                <input
                  type="range"
                  min="0.10"
                  max="0.50"
                  step="0.05"
                  value={coeffs.w_stability}
                  onChange={(e) => setCoeffs({ ...coeffs, w_stability: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block text-[11px]">
                  Store Correctness ({(coeffs.w_correctness * 100).toFixed(0)}%)
                </label>
                <span className="text-[10px] text-slate-500 block">Valid price/DOM</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.30"
                  step="0.05"
                  value={coeffs.w_correctness}
                  onChange={(e) => setCoeffs({ ...coeffs, w_correctness: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block text-[11px]">
                  Speed & Latency ({(coeffs.w_speed * 100).toFixed(0)}%)
                </label>
                <span className="text-[10px] text-slate-500 block">Sub-second timing</span>
                <input
                  type="range"
                  min="0.05"
                  max="0.25"
                  step="0.05"
                  value={coeffs.w_speed}
                  onChange={(e) => setCoeffs({ ...coeffs, w_speed: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block text-[11px]">
                  Resource Cost ({(coeffs.w_resource * 100).toFixed(0)}%)
                </label>
                <span className="text-[10px] text-slate-500 block">Lightweight vs heavy</span>
                <input
                  type="range"
                  min="0.02"
                  max="0.20"
                  step="0.02"
                  value={coeffs.w_resource}
                  onChange={(e) => setCoeffs({ ...coeffs, w_resource: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-800 block text-[11px]">
                  Environment History ({(coeffs.w_env_history * 100).toFixed(0)}%)
                </label>
                <span className="text-[10px] text-slate-500 block">Egress affinity</span>
                <input
                  type="range"
                  min="0.02"
                  max="0.20"
                  step="0.02"
                  value={coeffs.w_env_history}
                  onChange={(e) => setCoeffs({ ...coeffs, w_env_history: parseFloat(e.target.value) })}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setShowCoeffEditor(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCoeffs}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                Save & Recalculate Weights
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Strategy Weights Leaderboard */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Learned Strategy Ranking for Active Environment</span>
            </h4>
            <p className="text-xs text-slate-500">
              The resolver tries strategies in descending order of composite score instead of a fixed fallback sequence.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLogForm(!showLogForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Log Experience Manually</span>
            </button>
          </div>
        </div>

        {/* Quick Empirical Experience Simulation Buttons */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Test Real-World Scenarios to Observe Dynamic Weight Updates:
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleQuickScenario('FIREFOX_BOOTSTRAP_PERSISTENT', 200, 1150, 1.0, 0.98, 0.95, 'Firefox 5-min clean run')}
              className="text-[11px] px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs font-medium"
            >
              + Firefox 5m Clean Run (HTTP 200)
            </button>
            <button
              onClick={() => handleQuickScenario('FIREFOX_LIGHTWEIGHT_HANDOFF', 200, 390, 1.0, 0.95, 0.93, 'Firefox handoff 10-min clean run')}
              className="text-[11px] px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-900 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors cursor-pointer shadow-2xs font-medium"
            >
              + Lightweight Handoff 10m Clean (390ms)
            </button>
            <button
              onClick={() => handleQuickScenario('FIREFOX_LIGHTWEIGHT_HANDOFF', 206, 410, 0.2, 0.20, 0.40, 'VPN-2 Handoff gave 206 partial')}
              className="text-[11px] px-2.5 py-1.5 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-900 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs font-medium"
            >
              ! Egress VPN-2 Handoff Trap (HTTP 206)
            </button>
            <button
              onClick={() => handleQuickScenario('CHROME_DESKTOP_PROFILE', 206, 890, 0.2, 0.25, 0.45, 'Chrome returned 206 quickly')}
              className="text-[11px] px-2.5 py-1.5 bg-white hover:bg-amber-50 text-slate-800 hover:text-amber-900 rounded-lg border border-slate-200 hover:border-amber-300 transition-colors cursor-pointer shadow-2xs font-medium"
            >
              ! Chrome Returned 206 Quickly
            </button>
            <button
              onClick={() => handleQuickScenario('NATIVE_CURL_HTTP2', 403, 190, 0.0, 0.10, 0.10, 'Naive HTTP/2 alone gave 403')}
              className="text-[11px] px-2.5 py-1.5 bg-white hover:bg-rose-50 text-slate-800 hover:text-rose-900 rounded-lg border border-slate-200 hover:border-rose-300 transition-colors cursor-pointer shadow-2xs font-medium"
            >
              x Naive HTTP/2 Blocked (HTTP 403)
            </button>
          </div>
        </div>

        {/* Custom Experience Logger Form */}
        {showLogForm && (
          <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 space-y-3 animate-in fade-in duration-200">
            <span className="text-xs font-bold text-indigo-950 block">Log Custom Environment Experience</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block text-[11px]">Strategy Target</label>
                <select
                  value={customStrat}
                  onChange={(e) => setCustomStrat(e.target.value)}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  {state?.strategy_weights.map((w) => (
                    <option key={w.strategy_id} value={w.strategy_id}>
                      {w.strategy_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block text-[11px]">HTTP Status Code</label>
                <select
                  value={customStatus}
                  onChange={(e) => setCustomStatus(parseInt(e.target.value, 10))}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value={200}>200 OK (Clean Content)</option>
                  <option value={206}>206 Partial Content (Anti-bot Flag)</option>
                  <option value={403}>403 Forbidden (Edge Shield)</option>
                  <option value={429}>429 Rate Limited</option>
                  <option value={503}>503 Cloudflare Splash</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block text-[11px]">Latency (ms)</label>
                <input
                  type="number"
                  value={customLatency}
                  onChange={(e) => setCustomLatency(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block text-[11px]">Sustained Stability (0.0 - 1.0)</label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1"
                  value={customStability}
                  onChange={(e) => setCustomStability(parseFloat(e.target.value) || 0)}
                  className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block text-[11px]">Observation Notes</label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Notes describing environment and behavior..."
                className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-indigo-200/60">
              <button
                onClick={() => setShowLogForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordExperience}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
              >
                Log & Update Weights
              </button>
            </div>
          </div>
        )}

        {/* Strategy Weights Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-mono text-[11px]">
                <th className="py-2.5 px-3">Rank</th>
                <th className="py-2.5 px-3">Strategy / Runtime Engine</th>
                <th className="py-2.5 px-3">Composite Weight</th>
                <th className="py-2.5 px-3">Semantic Success (35%)</th>
                <th className="py-2.5 px-3">Sustained Stability (25%)</th>
                <th className="py-2.5 px-3">Correctness (15%)</th>
                <th className="py-2.5 px-3">Speed (10%)</th>
                <th className="py-2.5 px-3">Resource (8%)</th>
                <th className="py-2.5 px-3">History / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state?.strategy_weights.map((strat: StrategyWeightProfile) => {
                const isTop = strat.recommended_rank === 1;
                const isClean = strat.composite_score >= 70;
                const isTrap = strat.partial_206_runs > 0;
                const isBlocked = strat.blocked_403_runs > 0 && strat.success_runs === 0;

                return (
                  <tr
                    key={strat.strategy_id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isTop ? 'bg-emerald-50/30' : ''
                    }`}
                  >
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono font-bold text-[11px] ${
                          isTop
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : strat.recommended_rank <= 3
                            ? 'bg-indigo-100 text-indigo-800 font-semibold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{strat.recommended_rank}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{strat.strategy_name}</div>
                      <div className="text-[10px] font-mono text-slate-500">{strat.strategy_id}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold font-mono text-xs text-slate-900">
                          {strat.composite_score.toFixed(1)}
                        </span>
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isClean ? 'bg-emerald-500' : isTrap ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, strat.composite_score))}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {(strat.semantic_score_avg * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          strat.stability_score_avg >= 0.8
                            ? 'bg-emerald-100 text-emerald-800'
                            : strat.stability_score_avg >= 0.4
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {(strat.stability_score_avg * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {(strat.correctness_score_avg * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {strat.avg_latency_ms.toFixed(0)} ms
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {(strat.resource_score * 100).toFixed(0)}%
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[11px] space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-600 font-semibold">{strat.success_runs} clean</span>
                          {strat.partial_206_runs > 0 && (
                            <span className="text-amber-600 font-semibold">{strat.partial_206_runs} 206s</span>
                          )}
                          {strat.blocked_403_runs > 0 && (
                            <span className="text-rose-600 font-semibold">{strat.blocked_403_runs} 403s</span>
                          )}
                        </div>
                        {strat.consecutive_clean > 0 && (
                          <span className="text-[10px] text-emerald-700 block font-mono">
                            {strat.consecutive_clean} streak
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Weighted 403 Resolution Simulator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Live Weighted Resolution Execution (Runs Top-Weighted Strategy First)</span>
          </h4>
          <p className="text-xs text-slate-500">
            Executes the candidate strategies in weighted priority order. When resolved or blocked, the experience is immediately recorded to update the weights!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              placeholder="Enter URL to test 403 resolution..."
              className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl bg-white text-slate-900 focus:ring-2 focus:ring-indigo-600 font-mono"
            />
          </div>

          <button
            onClick={() => handleRunWeightedCascade()}
            disabled={isRunningCascade || !testUrl.trim()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-xl transition-colors cursor-pointer shadow-xs shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningCascade ? 'animate-spin' : ''}`} />
            <span>{isRunningCascade ? 'Testing Weighted Cascade...' : 'Execute Weighted Cascade'}</span>
          </button>
        </div>

        {/* Cascade Output Display */}
        {cascadeResult && (
          <div className="space-y-4 pt-3 border-t border-slate-100 animate-in fade-in duration-200">
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                cascadeResult.resolved
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/80 border-amber-200 text-amber-950'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {cascadeResult.resolved ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <span className="font-bold text-sm">
                    {cascadeResult.resolved
                      ? '403 Resolved Successfully via Top Weighted Pick!'
                      : 'All Strategies Tested & Experiences Recorded'}
                  </span>
                </div>
                <p className="text-xs leading-relaxed opacity-90 max-w-2xl">
                  {cascadeResult.explanation}
                </p>
              </div>

              <div className="flex flex-row sm:flex-col items-end justify-between sm:justify-center gap-1.5 shrink-0">
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold">
                  Attempts: {cascadeResult.total_attempts} | {cascadeResult.total_latency_ms} ms
                </span>
                {cascadeResult.winning_strategy && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
                    Winner: {cascadeResult.winning_strategy}
                  </span>
                )}
              </div>
            </div>

            {/* Audit Steps */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Weighted Cascade Audit Trail:
              </span>
              <div className="space-y-2">
                {cascadeResult.audit_trail.map((audit, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs ${
                      audit.outcome === 'SUCCESS_RESOLVED'
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : audit.attempt_number === 0
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[11px] text-slate-500">
                          #{audit.attempt_number}
                        </span>
                        <span className="font-semibold text-slate-900">{audit.strategy_name}</span>
                        {audit.weight_score !== undefined && audit.weight_score > 0 && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold">
                            Score: {audit.weight_score.toFixed(1)} (Rank #{audit.weight_rank})
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-[11px]">{audit.latency_ms} ms</span>
                    </div>
                    <div className="mt-1 text-slate-600 text-[11px]">{audit.reasoning}</div>
                    <div className="mt-0.5 text-slate-500 text-[10px]">{audit.details}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Historical Experience Log Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <span>Past Experience History ({state?.total_experiences || 0} Records)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Audit log of past trials across environments that continuously shape strategy weights.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 bg-white border-b border-slate-200 text-slate-500 font-mono text-[11px]">
              <tr>
                <th className="py-2 px-3">Strategy</th>
                <th className="py-2 px-3">Environment</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Semantic</th>
                <th className="py-2 px-3">Stability</th>
                <th className="py-2 px-3">Latency</th>
                <th className="py-2 px-3">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {state?.recent_experiences.map((exp, idx) => (
                <tr key={`${exp.record_id}-${idx}`} className="hover:bg-slate-50/80">
                  <td className="py-2 px-3 font-semibold text-slate-800">
                    {exp.strategy_name}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600 text-[11px]">
                    {exp.environment_id}
                  </td>
                  <td className="py-2 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                        exp.status_code === 200
                          ? 'bg-emerald-100 text-emerald-800'
                          : exp.status_code === 206
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {exp.status_code}
                    </span>
                  </td>
                  <td className="py-2 px-3 font-mono">
                    {(exp.semantic_success * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-3 font-mono">
                    {(exp.sustained_stability * 100).toFixed(0)}%
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-500">
                    {exp.latency_ms.toFixed(0)} ms
                  </td>
                  <td className="py-2 px-3 text-slate-500 text-[11px] max-w-xs truncate">
                    {exp.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
