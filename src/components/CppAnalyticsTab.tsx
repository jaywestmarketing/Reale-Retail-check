import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  Play,
  Code,
  Activity,
  CheckCircle2,
  TrendingDown,
  AlertTriangle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { calculateAnalytics, runBenchmark } from '../api';
import { CppAnalytics, BenchmarkResult } from '../types';

interface CppAnalyticsTabProps {
  onOpenCodeModal: (mechanismId: string) => void;
}

export const CppAnalyticsTab: React.FC<CppAnalyticsTabProps> = ({ onOpenCodeModal }) => {
  const [priceInput, setPriceInput] = useState('249.99, 245.00, 249.99, 239.99, 219.99, 199.99, 179.99');
  const [smaPeriod, setSmaPeriod] = useState(5);
  const [emaAlpha, setEmaAlpha] = useState(0.25);
  const [dropThreshold, setDropThreshold] = useState(5.0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [analyticsResult, setAnalyticsResult] = useState<CppAnalytics | null>(null);

  // Benchmark state
  const [benchIterations, setBenchIterations] = useState(50000);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchResult, setBenchResult] = useState<BenchmarkResult | null>(null);

  const handleRunCalculation = async () => {
    setIsCalculating(true);
    try {
      const parsedPrices = priceInput
        .split(',')
        .map((s) => parseFloat(s.trim()))
        .filter((n) => !isNaN(n));
      const res = await calculateAnalytics(parsedPrices, smaPeriod, emaAlpha, dropThreshold);
      setAnalyticsResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await runBenchmark(benchIterations);
      setBenchResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const setPresetPrices = (type: string) => {
    if (type === 'flash_drop') {
      setPriceInput('399.99, 399.99, 389.00, 379.50, 359.00, 199.99');
    } else if (type === 'glitch_anomaly') {
      setPriceInput('499.00, 499.00, 495.00, 489.00, 499.00, 4.99'); // Scraped shipping fee instead of product!
    } else if (type === 'steady_trend') {
      setPriceInput('150.00, 148.50, 147.00, 145.20, 143.00, 141.50, 139.99');
    } else if (type === 'volatile') {
      setPriceInput('100.00, 120.00, 95.00, 135.00, 89.00, 145.00, 80.00');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Engine Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Mechanism 3: C++ High-Performance Analytical Engine
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  g++ -O3 SIMD / C99 FFI
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Sub-microsecond moving averages, Bollinger bands, volatility standard deviation, and anomaly glitch suppression.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCodeModal('mechanism-3-cpp-analytics')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Inspect C++ Source & Makefile</span>
            </button>
          </div>
        </div>

        {/* Compiler & Native Status Bar */}
        <div className="p-3 bg-slate-900 text-white rounded-lg font-mono text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Native Binary:</span>
            <span className="text-emerald-400 font-semibold">backend/mechanisms/cpp_engine/libprice_analytics.so</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span>Compiler: g++ 12.3.0</span>
            <span>·</span>
            <span>Flags: -O3 -fPIC -std=c++17</span>
            <span>·</span>
            <span>Target: x86_64</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Calculation Sandbox & High-Load Benchmark */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Box: Price Calculation Sandbox */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Mathematical Price Fluctuation Sandbox
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">Real-time C++ FFI</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Comma-Separated Price History Series ($)
              </label>
              <textarea
                rows={2}
                value={priceInput}
                onChange={(e) => setPriceInput(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-slate-900"
              />
              <div className="flex flex-wrap gap-1.5 mt-1.5 text-[11px]">
                <span className="text-slate-400">Presets:</span>
                <button
                  type="button"
                  onClick={() => setPresetPrices('flash_drop')}
                  className="text-indigo-600 hover:underline cursor-pointer"
                >
                  -50% Flash Sale
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setPresetPrices('glitch_anomaly')}
                  className="text-rose-600 hover:underline cursor-pointer"
                >
                  Scrape Anomaly ($4.99)
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setPresetPrices('steady_trend')}
                  className="text-emerald-600 hover:underline cursor-pointer"
                >
                  Steady Markdown
                </button>
                <span className="text-slate-300">·</span>
                <button
                  type="button"
                  onClick={() => setPresetPrices('volatile')}
                  className="text-amber-600 hover:underline cursor-pointer"
                >
                  High Volatility
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  SMA Window
                </label>
                <input
                  type="number"
                  value={smaPeriod}
                  onChange={(e) => setSmaPeriod(parseInt(e.target.value, 10))}
                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  EMA Alpha (α)
                </label>
                <input
                  type="number"
                  step="0.05"
                  value={emaAlpha}
                  onChange={(e) => setEmaAlpha(parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Drop Threshold %
                </label>
                <input
                  type="number"
                  step="1"
                  value={dropThreshold}
                  onChange={(e) => setDropThreshold(parseFloat(e.target.value))}
                  className="w-full px-2 py-1 border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>

            <button
              onClick={handleRunCalculation}
              disabled={isCalculating}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isCalculating ? (
                <span>Executing C++ Kernel...</span>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>Execute C++ Analytics</span>
                </>
              )}
            </button>
          </div>

          {/* Results Box */}
          {analyticsResult && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 font-mono">
                  Engine: {analyticsResult.engine}
                </span>
                <span className="font-mono text-[11px] text-emerald-700 font-medium">
                  {analyticsResult.execution_time_ns} nanoseconds
                </span>
              </div>

              {analyticsResult.is_anomaly && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Scraping Glitch Anomaly Flagged!</strong> |Z| = {analyticsResult.z_score} (Confidence: {Math.round(analyticsResult.anomaly_confidence * 100)}%).
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Current Price</span>
                  <span className="font-bold text-slate-900">${analyticsResult.current_price.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Delta from Prev</span>
                  <span className={`font-bold ${analyticsResult.percent_change < 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {analyticsResult.percent_change.toFixed(2)}% (${analyticsResult.absolute_change.toFixed(2)})
                  </span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">SMA ({smaPeriod})</span>
                  <span className="font-bold text-slate-900">${analyticsResult.sma.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">EMA Smoothing</span>
                  <span className="font-bold text-slate-900">${analyticsResult.ema.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Bollinger Upper</span>
                  <span className="font-bold text-slate-900">${analyticsResult.bollinger_upper.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Bollinger Lower</span>
                  <span className="font-bold text-slate-900">${analyticsResult.bollinger_lower.toFixed(2)}</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Std Dev (σ)</span>
                  <span className="font-bold text-slate-900">${analyticsResult.std_dev.toFixed(3)}</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Z-Score</span>
                  <span className="font-bold text-slate-900">{analyticsResult.z_score.toFixed(3)}</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">Max Drawdown</span>
                  <span className="font-bold text-rose-600">{analyticsResult.max_drawdown_percent.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Box: Live C++ vs Python Benchmark Runner */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Native Throughput & Speed Benchmark
            </h3>
            <span className="text-[11px] text-slate-500 font-mono">SIMD Cache Locality</span>
          </div>

          <p className="text-xs text-slate-600">
            Executes high-iteration analytical batch processing to measure the computational performance gain of compiled C++ (-O3) over interpreted runtime.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Benchmark Iterations: {benchIterations.toLocaleString()} iterations
              </label>
              <div className="flex gap-2">
                {[10000, 25000, 50000, 100000].map((iter) => (
                  <button
                    key={iter}
                    type="button"
                    onClick={() => setBenchIterations(iter)}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs cursor-pointer ${
                      benchIterations === iter
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {iter.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              {isBenchmarking ? (
                <span>Executing High-Throughput Batch...</span>
              ) : (
                <>
                  <Activity className="w-3.5 h-3.5" />
                  <span>Run Live C++ Benchmark</span>
                </>
              )}
            </button>
          </div>

          {benchResult && (
            <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-indigo-900">
                  Benchmark Run Complete ({benchResult.iterations.toLocaleString()} Ops)
                </span>
                <span className="text-lg font-bold font-mono text-indigo-950">
                  {benchResult.cpp_speedup_factor}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-400 uppercase block">C++ Native Time</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {benchResult.cpp_time_ms} ms
                  </span>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-indigo-100">
                  <span className="text-[10px] text-slate-400 uppercase block">Python Projected Time</span>
                  <span className="text-sm font-bold text-slate-600">
                    {benchResult.python_projected_ms} ms
                  </span>
                </div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-indigo-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">Throughput:</span>
                <span className="font-bold text-slate-900">
                  {benchResult.throughput_ops_per_sec.toLocaleString()} operations / sec
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
