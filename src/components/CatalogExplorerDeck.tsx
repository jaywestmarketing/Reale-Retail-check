import React from 'react';
import {
  FolderTree,
  ShoppingBag,
  ExternalLink,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Bot,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { AutonomousCrawlResult, DiscoveredLink, TraversalStep } from '../types';

interface CatalogExplorerDeckProps {
  crawlResult: AutonomousCrawlResult;
  onSelectCategory: (categoryUrl: string) => void;
  onSelectProduct: (productUrl: string) => void;
  isCrawlLoading?: boolean;
}

export const CatalogExplorerDeck: React.FC<CatalogExplorerDeckProps> = ({
  crawlResult,
  onSelectCategory,
  onSelectProduct,
  isCrawlLoading = false,
}) => {
  const {
    start_url,
    initial_page_type,
    final_product_name,
    final_product_url,
    detected_price,
    currency,
    traversal_path,
    discovered_categories,
    discovered_products,
    bot_shield_detected,
    error,
    agent_reasoning,
    continuity_audit,
    bypassed_403,
    winning_continuity_strategy,
  } = crawlResult;

  const [showContinuityAudit, setShowContinuityAudit] = React.useState(false);
  const hasCategories = discovered_categories && discovered_categories.length > 0;
  const hasProducts = discovered_products && discovered_products.length > 0;
  const hasAudit = continuity_audit && continuity_audit.length > 0;


  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Autonomous Catalog & Category Traversal Trace
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                Initial: {initial_page_type}
              </span>
              {crawlResult.success && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Product Reached
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-mono truncate max-w-xl">
              Target Host: {start_url}
            </p>
          </div>
        </div>
      </div>

      {/* 403 Bypassed Success Banner if resolved via Execution Continuity */}
      {bypassed_403 && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl space-y-2 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>HTTP 403 Forbidden Resolved via Execution Continuity Network Adapter!</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-600 text-white font-bold">
              Bypassed
            </span>
          </div>
          <p className="text-[11px] leading-relaxed text-emerald-800">
            Target retailer returned initial anti-bot resistance. The autonomous agent systematically tried alternative connectivity adapters and successfully bypassed the barrier using <strong>{winning_continuity_strategy || 'Native Subprocess cURL HTTP/2 & OpenSSL Ciphers'}</strong>.
          </p>
        </div>
      )}

      {/* Continuity Adaptive Audit Trail Accordion (Shows each way attempted) */}
      {hasAudit && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900">
                403 Adaptive Recovery Audit ({continuity_audit.length} Approaches Tried)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowContinuityAudit(!showContinuityAudit)}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              {showContinuityAudit ? 'Hide Audit Trail' : 'View All Strategies Tried'}
            </button>
          </div>

          {showContinuityAudit && (
            <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
              {continuity_audit.map((audit, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                    audit.outcome === 'SUCCESS_RESOLVED'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                      : 'bg-white border-slate-200 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono font-bold flex items-center justify-center shrink-0">
                      #{audit.attempt_number}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900">{audit.strategy_name}</span>
                      <p className="text-[10px] text-slate-500 font-mono">{audit.details}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                        audit.status_code === 200
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      HTTP {audit.status_code}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {audit.latency_ms} ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bot Shield Warning Card if Detected & Not Bypassed */}
      {bot_shield_detected && !bypassed_403 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs text-amber-900">
          <div className="flex items-center gap-2 font-bold text-amber-950">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Anti-Bot Shield Detected: {bot_shield_detected}</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            This retailer presented a bot protection checkpoint on sub-page requests.
            The autonomous crawler successfully mapped store navigation and categories below.
            To monitor this store, you can select one of the discovered categories or paste a direct product item URL.
          </p>
        </div>
      )}

      {/* Traversal Step Breadcrumb Trail */}
      {traversal_path && traversal_path.length > 0 && (
        <div className="space-y-2.5">
          <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
            Autonomous Traversal Path ({traversal_path.length} steps):
          </span>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {traversal_path.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex-1 min-w-[200px] space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="font-bold text-slate-500">STEP #{step.step_num}</span>
                    <span className="px-1.5 py-0.2 bg-white rounded border border-slate-200 text-slate-700 font-semibold">
                      {step.page_type}
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-900 truncate">
                    {step.action_taken}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {step.summary}
                  </div>
                </div>
                {idx < traversal_path.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 hidden sm:block" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Products in Catalog */}
      {hasProducts && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>Products Discovered in Catalog ({discovered_products.length})</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Click any item to crawl & track
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {discovered_products.slice(0, 9).map((prod, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2 transition-all"
              >
                <div className="flex items-start gap-2.5">
                  {prod.thumbnail ? (
                    <img
                      src={prod.thumbnail}
                      alt={prod.title}
                      className="w-12 h-12 object-contain rounded bg-white border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h5 className="text-xs font-semibold text-slate-900 line-clamp-2 leading-tight">
                      {prod.title}
                    </h5>
                    {prod.price_hint !== null && prod.price_hint !== undefined && (
                      <span className="text-xs font-bold font-mono text-emerald-700 block">
                        {currency}{prod.price_hint.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-xs">
                  <a
                    href={prod.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <span>View</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={() => onSelectProduct(prod.url)}
                    disabled={isCrawlLoading}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    Track Product
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discovered Categories & Departments */}
      {hasCategories && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-sky-600" />
              <span>Categories & Departments Discovered ({discovered_categories.length})</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Click any category to autonomously crawl its catalog
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {discovered_categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => onSelectCategory(cat.url)}
                disabled={isCrawlLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-medium transition-colors cursor-pointer border border-slate-200/80"
              >
                <span>{cat.title}</span>
                <ArrowRight className="w-3 h-3 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
