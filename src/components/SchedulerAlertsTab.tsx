import React, { useState } from 'react';
import {
  Bell,
  Code,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  TrendingDown,
  ArrowRight,
  Send,
} from 'lucide-react';
import { TrackedProduct, AlertEvent } from '../types';

interface SchedulerAlertsTabProps {
  products: TrackedProduct[];
  onOpenCodeModal: (mechanismId: string) => void;
}

export const SchedulerAlertsTab: React.FC<SchedulerAlertsTabProps> = ({
  products,
  onOpenCodeModal,
}) => {
  const [defaultInterval, setDefaultInterval] = useState(15);
  const [notifyAllTimeLow, setNotifyAllTimeLow] = useState(true);
  const [strictTarget, setStrictTarget] = useState(true);
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.slack.com/services/T00/B00/XXXXX');
  const [testSent, setTestSent] = useState(false);

  // Flatten all alerts from products
  const allAlerts: { product: TrackedProduct; alert: AlertEvent }[] = [];
  products.forEach((p) => {
    p.alerts?.forEach((al) => {
      allAlerts.push({ product: p, alert: al });
    });
  });

  allAlerts.sort((a, b) => (b.alert.timestamp || 0) - (a.alert.timestamp || 0));

  const handleSendTestWebhook = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  Mechanism 4: Tracking & Fluctuation Alert Orchestrator
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Pipeline Dispatcher
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Schedules periodic scraping intervals, tracks price timeseries, evaluates C++ volatility rules, and triggers webhook alerts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenCodeModal('mechanism-4-scheduler-alerts')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <Code className="w-3.5 h-3.5" />
              <span>Export Python Scheduler</span>
            </button>
          </div>
        </div>

        {/* Interchangeability Contract Description */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 text-xs text-slate-600 space-y-1">
          <span className="font-semibold text-slate-800">Interchangeability Contract:</span>
          <p>
            Takes product historical observations and new scraped prices. Executes C++ analytics, checks user price targets and statistical volatility bands, and emits standardized <code className="text-slate-800 font-mono bg-white px-1 py-0.5 rounded border border-slate-200">AlertEvent</code> payloads for Slack, Discord, email, or webhook receivers.
          </p>
        </div>
      </div>

      {/* Grid: Alert Rule Configuration & Live Event Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Scheduler Parameters */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Alert Rules & Dispatch Settings
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Polling Interval: Every {defaultInterval} minutes
              </label>
              <input
                type="range"
                min="1"
                max="60"
                step="5"
                value={defaultInterval}
                onChange={(e) => setDefaultInterval(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notifyAllTimeLow}
                  onChange={(e) => setNotifyAllTimeLow(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span className="font-medium text-slate-700">Trigger on New All-Time Low</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={strictTarget}
                  onChange={(e) => setStrictTarget(e.target.checked)}
                  className="rounded text-slate-900 focus:ring-slate-900"
                />
                <span className="font-medium text-slate-700">Strict Target Price Threshold Trigger</span>
              </label>
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="block font-medium text-slate-700">
                Outbound Webhook URL (Slack / Discord / Custom)
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-mono text-xs focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="button"
                onClick={handleSendTestWebhook}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                {testSent ? (
                  <span className="text-emerald-700 font-semibold">Test Webhook Dispatched!</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Test Webhook Payload</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Fluctuation Timeline Log */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              Triggered Fluctuation Events Timeline ({allAlerts.length})
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Live Evaluator Stream</span>
          </div>

          {allAlerts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-slate-400 space-y-2 border border-dashed border-slate-200 rounded-lg">
              <Bell className="w-8 h-8 text-slate-300" />
              <p className="text-xs">No fluctuation alerts have fired yet. Test simulations from the Price Radar tab.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {allAlerts.map(({ product, alert }, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{product.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {product.retailer}
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        {alert.type}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{alert.message}</p>
                    <p className="font-mono text-[11px] text-slate-400">
                      Product ID: {product.id} · Current: {product.currency}{product.currentPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono shrink-0">
                    {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Just now'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
