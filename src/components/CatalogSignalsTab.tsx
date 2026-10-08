import React, { useState, useEffect } from 'react';
import {
  Globe,
  Download,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Compass,
  Layers,
  Flag,
  FileSpreadsheet,
  FileCode2,
  Trash2,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  harvestCatalogSignals,
  fetchCatalogSignals,
  clearCatalogSignals,
  getCatalogDownloadUrl,
} from '../api';
import { CatalogSignal, CatalogHarvestResult } from '../types';

interface CatalogSignalsTabProps {
  onTrackProduct?: (url: string) => void;
}

export const CatalogSignalsTab: React.FC<CatalogSignalsTabProps> = ({ onTrackProduct }) => {
  const [targetUrl, setTargetUrl] = useState('https://www.ebay.com/sch/i.html?_nkw=Headphones');
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [harvestResult, setHarvestResult] = useState<CatalogHarvestResult | null>(null);
  const [signals, setSignals] = useState<CatalogSignal[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const presets = [
    { label: 'eBay Headphones (Search & Pagination)', url: 'https://www.ebay.com/sch/i.html?_nkw=Headphones' },
    { label: 'Books To Scrape (Catalog & Multi-Page)', url: 'https://books.toscrape.com/catalogue/category/books_1/index.html' },
    { label: 'Walmart (US National vs Canada)', url: 'https://www.walmart.com' },
    { label: 'Home Depot (US vs Global/CA)', url: 'https://www.homedepot.com' },
  ];

  const loadSignals = async () => {
    setIsLoadingList(true);
    try {
      const res = await fetchCatalogSignals(
        selectedFilter !== 'ALL' ? selectedFilter : undefined,
        searchQuery || undefined
      );
      setSignals(res.signals || []);
    } catch (e: any) {
      console.error('Failed to load catalog signals:', e);
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    loadSignals();
  }, [selectedFilter, searchQuery]);

  const handleRunHarvest = async () => {
    if (!targetUrl.trim()) return;
    setIsHarvesting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const res = await harvestCatalogSignals(targetUrl.trim());
      setHarvestResult(res);
      setSuccessMsg(`Discovered ${res.total_signals} catalog signals and indicators (${res.national_signals_count} National, ${res.global_signals_count} Global, ${res.pagination_signals_count} Multi-Page).`);
      await loadSignals();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to harvest catalog signals');
    } finally {
      setIsHarvesting(false);
    }
  };

  const handleClearList = async () => {
    if (!window.confirm('Are you sure you want to clear the internal catalog signals inventory list?')) return;
    try {
      await clearCatalogSignals();
      setSignals([]);
      setHarvestResult(null);
      setSuccessMsg('Internal catalog list cleared.');
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to clear list');
    }
  };

  const nationalCount = signals.filter((s) => s.scope === 'NATIONAL_US').length;
  const globalCount = signals.filter((s) => s.scope !== 'NATIONAL_US').length;
  const paginationCount = signals.filter((s) => s.signal_type === 'PAGINATION_STREAM').length;
  const productCount = signals.filter((s) => s.signal_type === 'HARVESTED_PRODUCT').length;

  return (
    <div className="space-y-6">
      {/* Harvester Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-900 flex items-center justify-center text-white shadow-xs">
              <Compass className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-slate-900">
                  National & Global Catalog Signal Harvester
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Autonomous Multi-Page Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Identifies catalog indicators, national & global regional mirrors (US, UK, EU, CA, APAC), pagination streams (Page 2+), and builds a persistent internal list with direct CSV & JSON download access.
              </p>
            </div>
          </div>

          {/* Download Action Buttons */}
          <div className="flex items-center gap-2">
            <a
              href={getCatalogDownloadUrl('csv')}
              download="catalog-signals-inventory.csv"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Download full internal list as RFC 4180 CSV spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download CSV</span>
            </a>

            <a
              href={getCatalogDownloadUrl('json')}
              download="catalog-signals-inventory.json"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Download structured schema JSON"
            >
              <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Download JSON</span>
            </a>

            <button
              onClick={handleClearList}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Clear internal list"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* URL Input Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="Enter retailer search URL, catalog root, or category hub..."
                className="w-full pl-3 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleRunHarvest}
              disabled={isHarvesting}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isHarvesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Harvesting Signals...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Harvest Catalog Signals</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-medium text-slate-400">Presets:</span>
            {presets.map((p) => (
              <button
                key={p.label}
                onClick={() => setTargetUrl(p.url)}
                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notification alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 animate-in fade-in">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 flex items-center justify-between animate-in fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {successMsg}
            </span>
            <a
              href={getCatalogDownloadUrl('csv')}
              className="font-medium underline hover:text-emerald-800"
            >
              Download CSV now
            </a>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Internal Signals</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">
            {signals.length}
          </div>
          <div className="text-[11px] text-slate-400">Stored in persistent catalog list</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>National Catalogs (US)</span>
            <Flag className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">
            {nationalCount}
          </div>
          <div className="text-[11px] text-emerald-600">Primary US storefronts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Global & Regional Mirrors</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">
            {globalCount}
          </div>
          <div className="text-[11px] text-blue-600">UK, EU, Canada, APAC</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Multi-Page & Products</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-semibold text-slate-900 font-mono">
            {paginationCount + productCount}
          </div>
          <div className="text-[11px] text-purple-600">{paginationCount} paginations, {productCount} items</div>
        </div>
      </div>

      {/* Traversal Summary from Last Harvest */}
      {harvestResult && (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Harvest Execution & Traversal Trail
            </h4>
            <span className="text-[11px] font-mono text-slate-500">
              Retailer: {harvestResult.retailer}
            </span>
          </div>

          <div className="space-y-1.5 max-h-48 overflow-y-auto font-mono text-[11px] bg-slate-50 p-3 rounded-lg border border-slate-100 text-slate-700">
            {harvestResult.traversal_summary.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-indigo-600 font-semibold select-none">›</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Internal Signals List & Filter Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1">
            {[
              { id: 'ALL', label: 'All Signals' },
              { id: 'NATIONAL_US', label: 'National (US)' },
              { id: 'GLOBAL_INTERNATIONAL', label: 'Global Mirrors' },
              { id: 'PAGINATION_STREAM', label: 'Pagination (Page 2+)' },
              { id: 'STRUCTURED_FEED', label: 'Feeds & Sitemaps' },
              { id: 'HARVESTED_PRODUCT', label: 'Harvested Products' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFilter(f.id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  selectedFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search signals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={loadSignals}
              disabled={isLoadingList}
              className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
              title="Refresh list"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Signals Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2.5 px-4">Signal Type</th>
                <th className="py-2.5 px-3">Scope / Region</th>
                <th className="py-2.5 px-4">Title / Catalog Target</th>
                <th className="py-2.5 px-3">Signal Pattern</th>
                <th className="py-2.5 px-3">Price Hint</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {signals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Compass className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="text-xs font-medium">No catalog signals recorded yet.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Enter a URL above and click "Harvest Catalog Signals" to build the downloadable internal list.
                    </p>
                  </td>
                </tr>
              ) : (
                signals.map((sig, idx) => {
                  const isNational = sig.scope === 'NATIONAL_US';
                  const isPagination = sig.signal_type === 'PAGINATION_STREAM';
                  const isProduct = sig.signal_type === 'HARVESTED_PRODUCT';

                  return (
                    <tr key={`${sig.id || 'sig'}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                      {/* Signal Type */}
                      <td className="py-2.5 px-4 font-mono text-[11px]">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${
                            isProduct
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : isPagination
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : isNational
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {sig.signal_type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Scope / Region */}
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        <span className="flex items-center gap-1.5">
                          {isNational ? (
                            <Flag className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{sig.scope.replace('SCOPE_', '')}</span>
                        </span>
                      </td>

                      {/* Title & Target URL */}
                      <td className="py-2.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-900 truncate">
                          {sig.title_or_label}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          {sig.target_url}
                        </div>
                      </td>

                      {/* Indicator Pattern */}
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 max-w-[200px] truncate">
                        {sig.indicator_pattern}
                      </td>

                      {/* Price Hint */}
                      <td className="py-2.5 px-3 font-mono text-slate-800 font-medium">
                        {sig.price_hint !== undefined && sig.price_hint !== null ? (
                          <span>{sig.currency}{sig.price_hint.toFixed(2)}</span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={sig.target_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                            title="Visit destination URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          {onTrackProduct && isProduct && (
                            <button
                              onClick={() => onTrackProduct(sig.target_url)}
                              className="text-[11px] px-2 py-0.5 bg-slate-900 hover:bg-slate-800 text-white rounded font-medium transition-colors cursor-pointer"
                              title="Add to price radar tracking"
                            >
                              Track
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with CSV/JSON links */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {signals.length} internal catalog indicators & harvest records
          </span>
          <div className="flex items-center gap-3">
            <a
              href={getCatalogDownloadUrl('csv')}
              className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export CSV</span>
            </a>
            <span className="text-slate-300">|</span>
            <a
              href={getCatalogDownloadUrl('json')}
              className="text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Export JSON</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
