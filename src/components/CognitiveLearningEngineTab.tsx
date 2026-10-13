import React, { useState, useEffect, useRef } from 'react';
import {
  Brain,
  Search,
  BookOpen,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Download,
  ExternalLink,
  ChevronRight,
  Clock,
  MousePointer,
  Compass,
  FileCode,
  Eye,
  Sliders,
  Activity,
  Cpu,
  Globe,
  HelpCircle,
  Zap,
} from 'lucide-react';
import {
  discoverPlatformDocs,
  scanUserEngagementSurfaces,
  runCognitiveComparison,
  synthesizeHumanMimeticPlan,
  simulateExecutionStep,
  resetPlanExecution,
  PlatformDocModel,
  EngagementSurfaceModel,
  ComparativeAnalysisReport,
  HumanMimeticPlan,
  HumanBehaviorStep,
} from '../api';

interface CognitiveLearningEngineTabProps {
  onOpenRealBrowser?: (url: string) => void;
  onOpenCategoryStudio?: () => void;
}

const PLATFORM_PRESETS = [
  { id: 'homedepot', name: 'The Home Depot', url: 'https://www.homedepot.com/b/Tools/N-5yc1vZc1xy', tier: 'Tier 3: Akamai Premier' },
  { id: 'walmart', name: 'Walmart', url: 'https://www.walmart.com/browse/home-improvement/power-tools/1072864', tier: 'Tier 3: PerimeterX' },
  { id: 'target', name: 'Target', url: 'https://www.target.com/c/power-tools-home-improvement/-/N-56a8v', tier: 'Tier 3: Akamai RedSky' },
  { id: 'bestbuy', name: 'Best Buy', url: 'https://www.bestbuy.com/site/power-tools/all-power-tools/pcmcat1588698188289.c', tier: 'Tier 2: Imperva Shield' },
  { id: 'amazon', name: 'Amazon', url: 'https://www.amazon.com/s?k=dewalt+drill+kit', tier: 'Tier 4: Amazon Bot Guard' },
];

const PERSONA_PRESETS = [
  {
    id: 'deliberate_shopper',
    name: 'Deliberate Shopper',
    desc: 'High dwell times (3.5–12s), reviews specs, inspects secondary images, verifies local store pickup.',
    curvature: '0.82',
    icon: '🛒',
  },
  {
    id: 'fast_buyer',
    name: 'Goal-Directed Fast Buyer',
    desc: 'Direct search query, glances at price/stock (1.2–2.5s), efficient mouse paths, quick add to cart.',
    curvature: '0.55',
    icon: '⚡',
  },
  {
    id: 'casual_browser',
    name: 'Casual Explorer',
    desc: 'Explores categories, applies brand facets, scrolls recommendations, hovers multiple thumbnails.',
    curvature: '0.90',
    icon: '🔍',
  },
];

export const CognitiveLearningEngineTab: React.FC<CognitiveLearningEngineTabProps> = ({
  onOpenRealBrowser,
  onOpenCategoryStudio,
}) => {
  // State
  const [selectedPlatform, setSelectedPlatform] = useState('homedepot');
  const [customUrl, setCustomUrl] = useState('');
  const [selectedPersona, setSelectedPersona] = useState('deliberate_shopper');
  const [activeSurfaceTab, setActiveSurfaceTab] = useState<'homepage' | 'search_grid' | 'pdp' | 'cart_drawer'>('pdp');
  const [activeAnalysisView, setActiveAnalysisView] = useState<'overview' | 'docs' | 'surfaces' | 'comparison' | 'mimetic_stepper'>('overview');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');

  // Data
  const [docModel, setDocModel] = useState<PlatformDocModel | null>(null);
  const [surfaces, setSurfaces] = useState<EngagementSurfaceModel[]>([]);
  const [comparativeReport, setComparativeReport] = useState<ComparativeAnalysisReport | null>(null);
  const [humanPlan, setHumanPlan] = useState<HumanMimeticPlan | null>(null);

  // Stepper / Execution State
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlayingAuto, setIsPlayingAuto] = useState(false);
  const [stepDwellCountdown, setStepDwellCountdown] = useState<number | null>(null);
  const [lastStepResult, setLastStepResult] = useState<any | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 100, y: 100 });

  // Initial load
  useEffect(() => {
    handleRunCompleteLearningCycle('homedepot', 'deliberate_shopper');
  }, []);

  const handleRunCompleteLearningCycle = async (platformId: string, persona: string) => {
    try {
      setIsLoading(true);
      setLoadingStage('Step 1/4: Discovering developer documentation & API protocols...');
      const targetQuery = customUrl.trim() || platformId;

      // 1. Discover Docs
      const docRes = await discoverPlatformDocs(targetQuery);
      setDocModel(docRes.doc_model);

      // 2. Scan Surfaces
      setLoadingStage('Step 2/4: Scanning user engagement & interaction surfaces...');
      const surfRes = await scanUserEngagementSurfaces(targetQuery);
      setSurfaces(surfRes.surfaces);

      // 3. Compare & Synthesize
      setLoadingStage('Step 3/4: Executing dual-analysis cognitive comparison...');
      const synthRes = await synthesizeHumanMimeticPlan(targetQuery, persona);
      setDocModel(synthRes.doc_model);
      setSurfaces(synthRes.surfaces);
      setComparativeReport(synthRes.comparative_report);
      setHumanPlan(synthRes.human_plan);

      // Reset stepper
      setCurrentStepIndex(0);
      setIsPlayingAuto(false);
      setStepDwellCountdown(null);
      if (synthRes.human_plan.steps.length > 0) {
        const firstTraj = synthRes.human_plan.steps[0].mouse_trajectory;
        setCursorPos({ x: firstTraj.start_x, y: firstTraj.start_y });
      }

      setLoadingStage('');
    } catch (err: any) {
      console.error('Error running learning cycle:', err);
    } finally {
      setIsLoading(false);
      setLoadingStage('');
    }
  };

  const handleStepNext = async () => {
    if (!humanPlan || currentStepIndex >= humanPlan.steps.length) return;
    try {
      const step = humanPlan.steps[currentStepIndex];
      // Animate cursor to target
      setCursorPos({ x: step.mouse_trajectory.end_x, y: step.mouse_trajectory.end_y });

      const res = await simulateExecutionStep(humanPlan.plan_id, currentStepIndex);
      setLastStepResult(res);

      // Update local step status
      setHumanPlan((prev) => {
        if (!prev) return prev;
        const newSteps = [...prev.steps];
        newSteps[currentStepIndex] = { ...newSteps[currentStepIndex], status: 'COMPLETED' };
        return { ...prev, steps: newSteps };
      });

      if (currentStepIndex + 1 < humanPlan.steps.length) {
        setCurrentStepIndex(currentStepIndex + 1);
      }
    } catch (err) {
      console.error('Step simulation error:', err);
    }
  };

  const handleAutoPlay = async () => {
    if (!humanPlan) return;
    setIsPlayingAuto(true);
    for (let i = currentStepIndex; i < humanPlan.steps.length; i++) {
      const step = humanPlan.steps[i];
      // Move cursor
      setCursorPos({ x: step.mouse_trajectory.end_x, y: step.mouse_trajectory.end_y });
      setStepDwellCountdown(Math.round(step.dwell_pause_ms / 1000));

      const res = await simulateExecutionStep(humanPlan.plan_id, i);
      setLastStepResult(res);

      setHumanPlan((prev) => {
        if (!prev) return prev;
        const newSteps = [...prev.steps];
        newSteps[i] = { ...newSteps[i], status: 'COMPLETED' };
        return { ...prev, steps: newSteps };
      });
      setCurrentStepIndex(i);

      // Realistic dwell delay
      await new Promise((r) => setTimeout(r, Math.min(step.dwell_pause_ms, 2500)));
      setStepDwellCountdown(null);
    }
    setIsPlayingAuto(false);
  };

  const handleResetStepper = async () => {
    if (!humanPlan) return;
    try {
      await resetPlanExecution(humanPlan.plan_id);
      setCurrentStepIndex(0);
      setIsPlayingAuto(false);
      setStepDwellCountdown(null);
      setHumanPlan((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          steps: prev.steps.map((s) => ({ ...s, status: 'PENDING' })),
        };
      });
      if (humanPlan.steps.length > 0) {
        setCursorPos({ x: humanPlan.steps[0].mouse_trajectory.start_x, y: humanPlan.steps[0].mouse_trajectory.start_y });
      }
    } catch (err) {
      console.error('Reset error:', err);
    }
  };

  const handleExportPackage = () => {
    window.open(`/api/learning-engine/export-package?platform=${selectedPlatform}&persona=${selectedPersona}`, '_blank');
  };

  const currentSurface = surfaces.find((s) => s.page_type === activeSurfaceTab) || surfaces[0];
  const activeStep = humanPlan?.steps[currentStepIndex];

  return (
    <div className="space-y-6">
      {/* Hero / Introduction Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Brain className="w-3.5 h-3.5 text-indigo-400" />
                Interchangeable Autonomous Mechanism
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: COGNITIVE_PLATFORM_LEARNING_ENGINE</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
              Cognitive Platform Learning Engine & Human-Mimetic Synthesizer
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Discovers platform documentation, scans real user interaction surfaces, compares formal protocols vs live DOM realities, and synthesizes Fitts's Law compliant human-mimetic plans (Bezier mouse curves, Poisson reading dwell pauses, typing jitter, kinetic scroll inertia).
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleRunCompleteLearningCycle(selectedPlatform, selectedPersona)}
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Learning in progress...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>Run Full Learning Cycle</span>
                </>
              )}
            </button>

            <button
              onClick={handleExportPackage}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Download interchangeable mechanism package conforming to architecture rules"
            >
              <Download className="w-3.5 h-3.5 text-slate-300" />
              <span>Export Package</span>
            </button>

            {onOpenRealBrowser && (
              <button
                onClick={() => {
                  const preset = PLATFORM_PRESETS.find((p) => p.id === selectedPlatform);
                  onOpenRealBrowser(preset?.url || 'https://www.homedepot.com/b/Tools/N-5yc1vZc1xy');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-xl shadow-xs transition-colors cursor-pointer"
                title="Launch this platform in the Real Live In-App Browser"
              >
                <Globe className="w-3.5 h-3.5 text-emerald-200" />
                <span>Open in Real Browser</span>
              </button>
            )}
          </div>
        </div>

        {/* Platform & Persona Selection Controls */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Platform Preset Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Target Platform / Retailer</span>
              <span className="text-[10px] text-slate-400 font-normal">Select ecosystem</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PLATFORM_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedPlatform(p.id);
                    setCustomUrl('');
                    handleRunCompleteLearningCycle(p.id, selectedPersona);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    selectedPlatform === p.id && !customUrl
                      ? 'bg-indigo-600 text-white font-semibold ring-1 ring-indigo-400'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Persona Picker */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Human Behavioral Persona</span>
              <span className="text-[10px] text-indigo-300 font-normal">Simulates authentic cadence</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {PERSONA_PRESETS.map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    setSelectedPersona(persona.id);
                    handleRunCompleteLearningCycle(selectedPlatform, persona.id);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-left text-xs transition-all cursor-pointer ${
                    selectedPersona === persona.id
                      ? 'bg-indigo-600 text-white font-semibold ring-1 ring-indigo-400'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1 font-semibold truncate">
                    <span>{persona.icon}</span>
                    <span className="truncate">{persona.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom URL Input */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Universal Custom Target URL</span>
              <span className="text-[10px] text-slate-400 font-normal">Any website or store</span>
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                placeholder="https://retailer.com/category..."
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                className="flex-1 bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 font-mono"
              />
              <button
                onClick={() => {
                  if (customUrl.trim()) {
                    handleRunCompleteLearningCycle('generic', selectedPersona);
                  }
                }}
                disabled={!customUrl.trim() || isLoading}
                className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer disabled:opacity-40"
              >
                Scan
              </button>
            </div>
          </div>
        </div>

        {/* Loading Overlay Notice */}
        {isLoading && loadingStage && (
          <div className="mt-4 p-3 rounded-xl bg-indigo-900/50 border border-indigo-700/50 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-indigo-300 border-t-white rounded-full animate-spin shrink-0" />
            <span className="text-xs font-medium text-indigo-100">{loadingStage}</span>
          </div>
        )}
      </div>

      {/* Main Tab Bar for Views */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveAnalysisView('overview')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeAnalysisView === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Cognitive Overview</span>
        </button>

        <button
          onClick={() => setActiveAnalysisView('docs')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeAnalysisView === 'docs'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>1. Platform Docs Protocol</span>
          {docModel && <span className="text-[10px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded font-mono">Discovered</span>}
        </button>

        <button
          onClick={() => setActiveAnalysisView('surfaces')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeAnalysisView === 'surfaces'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>2. User Engagement Surfaces</span>
          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">{surfaces.length} Pages</span>
        </button>

        <button
          onClick={() => setActiveAnalysisView('comparison')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeAnalysisView === 'comparison'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>3. Dual-Analysis Comparison</span>
          {comparativeReport && (
            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono">
              {comparativeReport.discrepancies.length} Discrepancies
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAnalysisView('mimetic_stepper')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
            activeAnalysisView === 'mimetic_stepper'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 font-bold'
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
          <span>4. Human-Mimetic Simulator</span>
          {humanPlan && (
            <span className="text-[10px] bg-indigo-500/30 text-indigo-100 px-1.5 py-0.2 rounded font-mono">
              {humanPlan.steps.length} Steps
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* VIEW: COGNITIVE OVERVIEW                                                 */}
      {/* ========================================================================= */}
      {activeAnalysisView === 'overview' && comparativeReport && docModel && (
        <div className="space-y-6">
          {/* High-Level Score Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Humanity Feasibility Score
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-600 font-mono">
                  {comparativeReport.humanity_feasibility_score}%
                </span>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  High Mimetic Viability
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Evaluates ability to pass behavioral biometric filters and Fitts's Law kinetic scrutiny.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Anti-Bot Barrier Tier
              </span>
              <div className="text-base font-bold text-slate-900 flex items-center gap-1.5 mt-1">
                <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="truncate">{comparativeReport.anti_bot_barrier_tier}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Requires organic Ingress Gateway and Bezier sensor jitter emission.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Protocol Discrepancies
              </span>
              <div className="text-3xl font-extrabold text-amber-600 font-mono">
                {comparativeReport.discrepancies.length} Identified
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Undocumented BFF APIs, sensor beacons, and hydration requirements.
              </p>
            </div>

            <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Synthesized Journey Steps
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-mono">
                {humanPlan?.steps.length || 8} Stages
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Sequential human journey from homepage dwell to mini-cart verification.
              </p>
            </div>
          </div>

          {/* Core Synthesis Summary Banner */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                  Engine Diagnosis & Synthesis
                </span>
              </div>
              <p className="text-sm text-slate-200">
                {comparativeReport.recommendation_summary}
              </p>
            </div>
            <button
              onClick={() => setActiveAnalysisView('mimetic_stepper')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
            >
              <span>Launch Mimetic Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Dual Cards: What Docs Say vs How Real Humans Act */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: What the Docs Say */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Official Protocol Assumptions</span>
                </h3>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">Formal Specs</span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Declared Endpoints:</strong> Uses static REST endpoints like <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800">/api/v2/products/&#123;itemId&#125;</code></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Rate Limit Model:</strong> States 60 requests/minute, implying direct sequential HTTP calls are valid.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>Zero Behavioral Context:</strong> Makes no mention of mouse coordinates, orientation sensors, or viewport dwell.</span>
                </li>
              </ul>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveAnalysisView('docs')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Inspect Discovered Docs & Endpoints</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: How the Agent Will Act as a Human */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <MousePointer className="w-4 h-4 text-emerald-600" />
                  <span>Synthesized Human-Mimetic Behavior</span>
                </h3>
                <span className="text-xs bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded font-mono">
                  Autonomous Plan
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Bezier Mouse Trajectories:</strong> Generates cubic curves with micro-tremor and Fitts's Law deceleration approaching targets.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Poisson Reading Dwell:</strong> Enforces natural pauses (2.4s–6.7s) to read specifications, specs accordion, and images.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span><strong>Typo & Cadence Dynamics:</strong> Simulates human typing latency (165ms) with natural typo ('DEWLAT') and backspace correction.</span>
                </li>
              </ul>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => setActiveAnalysisView('mimetic_stepper')}
                  className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                >
                  <span>Simulate Step-by-Step Execution</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: 1. PLATFORM DOCUMENTATION DISCOVERY                                */}
      {/* ========================================================================= */}
      {activeAnalysisView === 'docs' && docModel && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{docModel.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Discovered via {docModel.docs_url}</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2.5 py-1 rounded-md font-semibold self-start sm:self-auto">
                {docModel.developer_portal}
              </span>
            </div>

            {/* Quick Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Rate Limit Policy</span>
                <span className="text-xs font-medium text-slate-800 mt-1 block">{docModel.rate_limits}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Pagination Schema</span>
                <span className="text-xs font-medium text-slate-800 mt-1 block font-mono">{docModel.pagination_conventions}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">SKU & Item Identification</span>
                <span className="text-xs font-medium text-slate-800 mt-1 block font-mono">{docModel.sku_format}</span>
              </div>
            </div>

            {/* Endpoints Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Discovered Official Endpoints</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                    <tr>
                      <th className="p-2.5">Method</th>
                      <th className="p-2.5">Endpoint Path</th>
                      <th className="p-2.5">Description</th>
                      <th className="p-2.5">Rate Limit</th>
                      <th className="p-2.5">Auth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {docModel.endpoints.map((ep, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ep.method === 'GET' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {ep.method}
                          </span>
                        </td>
                        <td className="p-2.5 font-mono text-slate-900 font-semibold">{ep.path}</td>
                        <td className="p-2.5 text-slate-600">{ep.description}</td>
                        <td className="p-2.5 text-slate-500 font-mono">{ep.rate_limit}</td>
                        <td className="p-2.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            ep.auth_required ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ep.auth_required ? 'Required' : 'Public'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Robots.txt Directive Details */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-xs space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Robots.txt & Sitemap Directive Inspection
              </span>
              <p>User-Agent: {docModel.robots_rules.user_agent}</p>
              <p>Crawl-Delay: {docModel.robots_rules.crawl_delay_sec} seconds</p>
              <p>Disallow: {docModel.robots_rules.disallow_paths.join(', ')}</p>
              <p className="text-slate-400 truncate">Sitemaps: {docModel.robots_rules.sitemaps.join(', ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: 2. USER ENGAGEMENT SURFACES SCANNER                               */}
      {/* ========================================================================= */}
      {activeAnalysisView === 'surfaces' && surfaces.length > 0 && (
        <div className="space-y-6">
          {/* Surface Category Picker */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            {[
              { id: 'homepage', label: '1. Home Orientation & Store Selector', count: 3 },
              { id: 'search_grid', label: '2. Search Grid & Facet Exploration', count: 3 },
              { id: 'pdp', label: '3. Product Detail Page (PDP) & CTAs', count: 6 },
              { id: 'cart_drawer', label: '4. Mini-Cart Flyout & Verification', count: 2 },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveSurfaceTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeSurfaceTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {currentSurface && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 capitalize">
                    {currentSurface.page_type.replace('_', ' ')} Engagement Surface
                  </h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{currentSurface.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-mono">
                    Expected Human Dwell: ~{currentSurface.dwell_expectation_seconds}s
                  </span>
                  <span className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-md font-medium">
                    {currentSurface.hydration_framework}
                  </span>
                </div>
              </div>

              {/* Interactive DOM Elements */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Interactive DOM Elements & Human Interaction Prerequisites</span>
                  <span className="text-slate-500 font-normal">{currentSurface.interactive_elements.length} elements</span>
                </h4>
                <div className="space-y-2">
                  {currentSurface.interactive_elements.map((el, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{el.label}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-mono">{el.role}</span>
                          {el.triggers_telemetry && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                              Triggers Telemetry
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-slate-500 text-[11px] truncate max-w-xl">
                          Selector: {el.selector}
                        </div>
                        <div className="text-indigo-700 text-[11px]">
                          <strong>Prerequisite:</strong> {el.required_preceding_action}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-slate-500 text-[11px]">
                          Coords: ({el.coordinates.x}, {el.coordinates.y})
                        </div>
                        <div className="text-slate-400 text-[10px] mt-0.5">
                          Listeners: {el.event_listeners.join(', ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Telemetry Sensors & Bot Traps */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Telemetry Beacons */}
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Telemetry Beacons & Sensor Handshakes</span>
                  </h5>
                  {currentSurface.telemetry_beacons.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No direct telemetry sensors on this surface.</p>
                  ) : (
                    currentSurface.telemetry_beacons.map((beacon, idx) => (
                      <div key={idx} className="bg-slate-50 p-2.5 rounded border border-slate-100 text-xs space-y-1">
                        <div className="font-semibold text-slate-900">{beacon.name} ({beacon.vendor})</div>
                        <p className="text-slate-500 text-[11px]"><strong>Trigger:</strong> {beacon.trigger_event}</p>
                        <p className="text-rose-700 text-[11px]"><strong>Missing Impact:</strong> {beacon.impact_if_missing}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Bot Traps & Honeypots */}
                <div className="border border-slate-200 rounded-lg p-3.5 space-y-2">
                  <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Bot Traps & Honeypot Tripwires</span>
                  </h5>
                  {currentSurface.bot_traps.length === 0 ? (
                    <p className="text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Zero honeypots detected on this surface.</span>
                    </p>
                  ) : (
                    currentSurface.bot_traps.map((trap, idx) => (
                      <div key={idx} className="bg-rose-50 p-2.5 rounded border border-rose-100 text-xs space-y-1">
                        <div className="font-semibold text-rose-900">{trap.trap_type}: {trap.description}</div>
                        <p className="text-slate-600 font-mono text-[11px]">Selector: {trap.selector}</p>
                        <p className="text-emerald-800 text-[11px]"><strong>Avoidance Rule:</strong> {trap.avoidance_rule}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: 3. DUAL-ANALYSIS COMPARISON                                        */}
      {/* ========================================================================= */}
      {activeAnalysisView === 'comparison' && comparativeReport && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Comparative Protocol Discrepancies: Official Documentation vs Real Interactive DOM
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed comparison showing why naive API callers and headless crawlers get blocked, and what human-mimetic compensations are enforced.
              </p>
            </div>

            <div className="space-y-3">
              {comparativeReport.discrepancies.map((d, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{d.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">[{d.category}]</span>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                      d.severity === 'CRITICAL' || d.severity === 'BLOCKING'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {d.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase block tracking-wider">
                        Official Documentation Claim
                      </span>
                      <p className="text-slate-600 leading-relaxed">{d.doc_claim}</p>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block tracking-wider">
                        Real Interactive Page Reality
                      </span>
                      <p className="text-slate-600 leading-relaxed">{d.real_page_reality}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-200/80 rounded-lg p-2.5 text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Autonomous Human Mitigation:</strong> {d.mitigation_strategy}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: 4. HUMAN-MIMETIC BEHAVIORAL SIMULATOR                             */}
      {/* ========================================================================= */}
      {activeAnalysisView === 'mimetic_stepper' && humanPlan && (
        <div className="space-y-6">
          {/* Stepper Toolbar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{humanPlan.platform_name}</span>
                <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded font-mono">
                  Persona: {humanPlan.persona}
                </span>
                <span className="text-xs text-slate-500">
                  Stage {currentStepIndex + 1} of {humanPlan.steps.length}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {humanPlan.audit_summary}
              </p>
            </div>

            {/* Execution Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleStepNext}
                disabled={isPlayingAuto || currentStepIndex >= humanPlan.steps.length}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Execute Step {currentStepIndex + 1}</span>
              </button>

              <button
                onClick={handleAutoPlay}
                disabled={isPlayingAuto || currentStepIndex >= humanPlan.steps.length}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-40"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isPlayingAuto ? 'Playing Auto...' : 'Auto-Play Full Journey'}</span>
              </button>

              <button
                onClick={handleResetStepper}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Reset steps"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Real-time Trajectory & Live DOM Reticle Visualizer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Interactive Viewport with Bezier Mouse Path */}
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white shadow-md space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-slate-400 font-mono ml-2">Live Mimetic Canvas · Fitts's Law Viewport</span>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {stepDwellCountdown !== null && (
                    <span className="text-amber-400 font-mono animate-pulse flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Reading Dwell: {stepDwellCountdown}s</span>
                    </span>
                  )}
                  <span className="font-mono text-indigo-400">
                    Cursor: ({Math.round(cursorPos.x)}, {Math.round(cursorPos.y)})
                  </span>
                </div>
              </div>

              {/* SVG Canvas for Curve & Target Elements */}
              <div className="w-full h-80 bg-slate-950 rounded-xl relative border border-slate-800/80 overflow-hidden">
                <svg className="w-full h-full" viewBox="0 0 1200 600" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />

                  {/* Draw Trajectory Curve for Active Step */}
                  {activeStep && (
                    <>
                      {/* Control Points Tangents */}
                      <line
                        x1={activeStep.mouse_trajectory.start_x}
                        y1={activeStep.mouse_trajectory.start_y}
                        x2={activeStep.mouse_trajectory.cp1.x}
                        y2={activeStep.mouse_trajectory.cp1.y}
                        stroke="rgba(99, 102, 241, 0.3)"
                        strokeDasharray="4 4"
                      />
                      <line
                        x1={activeStep.mouse_trajectory.end_x}
                        y1={activeStep.mouse_trajectory.end_y}
                        x2={activeStep.mouse_trajectory.cp2.x}
                        y2={activeStep.mouse_trajectory.cp2.y}
                        stroke="rgba(99, 102, 241, 0.3)"
                        strokeDasharray="4 4"
                      />

                      {/* Main Bezier Curve */}
                      <path
                        d={activeStep.mouse_trajectory.svg_path}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                      {/* Micro-tremor sampled points */}
                      {activeStep.mouse_trajectory.points.map((pt, i) => (
                        <circle
                          key={i}
                          cx={pt.x}
                          cy={pt.y}
                          r="2.5"
                          fill={i === 0 ? '#10b981' : i === 10 ? '#ef4444' : '#818cf8'}
                        />
                      ))}

                      {/* Target Click Target Reticle */}
                      <circle
                        cx={activeStep.mouse_trajectory.end_x}
                        cy={activeStep.mouse_trajectory.end_y}
                        r="18"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                        className="animate-ping"
                      />
                      <circle
                        cx={activeStep.mouse_trajectory.end_x}
                        cy={activeStep.mouse_trajectory.end_y}
                        r="8"
                        fill="#10b981"
                      />
                    </>
                  )}
                </svg>

                {/* Animated Mouse Pointer */}
                <div
                  className="absolute pointer-events-none transition-all duration-500 ease-out flex items-center gap-1.5"
                  style={{
                    left: `${(cursorPos.x / 1200) * 100}%`,
                    top: `${(cursorPos.y / 600) * 100}%`,
                    transform: 'translate(-4px, -4px)',
                  }}
                >
                  <MousePointer className="w-5 h-5 text-emerald-400 drop-shadow-[0_2px_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] bg-slate-900/90 border border-slate-700 px-1.5 py-0.5 rounded text-slate-300 font-mono whitespace-nowrap">
                    Human Agent
                  </span>
                </div>

                {/* Overlay Step Description Pill */}
                {activeStep && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-xl px-3 py-2 text-xs flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                    <div>
                      <div className="font-bold text-white">
                        Stage {activeStep.step_number}: {activeStep.target_label}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Dwell: {activeStep.dwell_pause_ms}ms · Kinetic scroll: {activeStep.simulated_scroll_px}px
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bot Biometric Security Telemetry Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Bot Suspicion Risk</span>
                  <span className="text-emerald-400 font-mono font-bold">0.02 (98% Human Authenticity)</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Fitts's Law Curvature</span>
                  <span className="text-indigo-400 font-mono font-bold">Cubic Bezier ({humanPlan.mouse_curvature_factor})</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Typo Simulation</span>
                  <span className="text-slate-300 font-mono">
                    {activeStep?.simulated_typo_correction ? 'Active ("DEWLAT" ➔ Corrected)' : 'Standard Cadence'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Step Ledger */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs space-y-3 flex flex-col h-[520px]">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Behavioral Steps Ledger
                </h4>
                <span className="text-[11px] font-mono text-slate-500">
                  {humanPlan.steps.filter((s) => s.status === 'COMPLETED').length}/{humanPlan.steps.length} Done
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {humanPlan.steps.map((step, idx) => {
                  const isCurrent = idx === currentStepIndex;
                  const isCompleted = step.status === 'COMPLETED';

                  return (
                    <div
                      key={step.step_number}
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setCursorPos({ x: step.mouse_trajectory.end_x, y: step.mouse_trajectory.end_y });
                      }}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isCurrent
                          ? 'border-indigo-500 bg-indigo-50/70 shadow-2xs'
                          : isCompleted
                          ? 'border-emerald-200 bg-emerald-50/40 text-slate-700'
                          : 'border-slate-200 bg-slate-50/60 text-slate-500 hover:bg-slate-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-900">
                          {step.step_number}. {step.target_label}
                        </span>
                        {isCompleted ? (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                            Done
                          </span>
                        ) : isCurrent ? (
                          <span className="text-[10px] bg-indigo-600 text-white font-bold px-1.5 py-0.2 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.2 rounded">
                            Pending
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-tight">
                        {step.human_rationale}
                      </p>
                      <div className="mt-1.5 pt-1.5 border-t border-slate-200/50 text-[10px] text-slate-500 font-mono truncate">
                        Telemetry: {step.telemetry_emitted}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
