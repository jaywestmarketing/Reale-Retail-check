import React, { useState } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  X,
  Layers,
  CheckCircle2,
  HardDrive,
  Info,
} from 'lucide-react';
import { TrackedProduct } from '../types';
import { exportProductData } from '../utils/exportUtils';

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: TrackedProduct[];
}

export const ExportDataModal: React.FC<ExportDataModalProps> = ({
  isOpen,
  onClose,
  products,
}) => {
  const [format, setFormat] = useState<'csv' | 'txt'>('csv');
  const [platform, setPlatform] = useState<string>('all');
  const [customName, setCustomName] = useState<string>('');
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  // Extract distinct platforms from products
  const detectedPlatforms = Array.from(new Set(products.map(p => p.retailer).filter(Boolean)));

  const filteredCount = platform === 'all'
    ? products.length
    : products.filter(p => p.retailer.toLowerCase().includes(platform.toLowerCase())).length;

  const handleDownload = () => {
    exportProductData(products, {
      format,
      platform,
      customFilename: customName,
      includeAnalytics: true,
    });
    setDownloadSuccess(true);
    setTimeout(() => {
      setDownloadSuccess(false);
      onClose();
    }, 1200);
  };

  const getPlatformStructureDescription = (plat: string) => {
    const p = plat.toLowerCase();
    if (p.includes('amazon')) {
      return 'Amazon Structure: ASIN/SKU, Item Title, Price, Currency, Target Price, Stock, 14-Period SMA, Volatility (StdDev), Bollinger Bandwidth, Z-Score, URL, Timestamp.';
    }
    if (p.includes('walmart')) {
      return 'Walmart Structure: Item ID / SKU, Item Description, Price, Drop %, Availability, Primary CSS Selector, Strategy Used, Web URL, Timestamp.';
    }
    if (p.includes('best buy') || p.includes('bestbuy') || p.includes('electronics')) {
      return 'Best Buy Structure: SKU, Product Name, Price, All-Time Low Flag, Max Drawdown %, Availability, URL, Timestamp.';
    }
    return 'All Platforms Master Structure: ID, SKU, Product Name, Platform, Current Price, Initial Price, Currency, Target Price, Price Change (%), Stock, 14-Tick SMA, EMA, Volatility, Bollinger Envelope, Z-Score, URL, Timestamp.';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden transition-all">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Download className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Export & Download Data
              </h2>
              <p className="text-xs text-slate-500">
                Customizable CSV / TXT data downloads with platform-specific file structures
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Format Selection (CSV vs TXT) */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700">
              Export File Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  format === 'csv'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <FileSpreadsheet className={`w-5 h-5 ${format === 'csv' ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div>
                  <div className="font-semibold text-xs">CSV Spreadsheet</div>
                  <div className={`text-[10px] ${format === 'csv' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Comma-separated values (.csv)
                  </div>
                </div>
              </div>

              <div
                onClick={() => setFormat('txt')}
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  format === 'txt'
                    ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 hover:bg-white text-slate-700'
                }`}
              >
                <FileText className={`w-5 h-5 ${format === 'txt' ? 'text-amber-400' : 'text-slate-400'}`} />
                <div>
                  <div className="font-semibold text-xs">Plain Text Audit</div>
                  <div className={`text-[10px] ${format === 'txt' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Formatted text report (.txt)
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Scope Selection */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700">
              Platform Scope (Select All or Platform-Specific)
            </label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 font-medium"
            >
              <option value="all">All Platforms ({products.length} items)</option>
              {detectedPlatforms.map((plat) => (
                <option key={plat} value={plat}>
                  {plat} Platform
                </option>
              ))}
              <option value="Amazon">Amazon Specific File Structure</option>
              <option value="Walmart">Walmart Specific File Structure</option>
              <option value="Best Buy">Best Buy Specific File Structure</option>
            </select>
          </div>

          {/* Platform File Structure Info Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1 text-slate-600">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 text-[11px]">
              <Info className="w-3.5 h-3.5 text-sky-600" />
              <span>Platform File Structure Format:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {getPlatformStructureDescription(platform)}
            </p>
          </div>

          {/* Custom Nameable File Name */}
          <div className="space-y-1.5">
            <label className="block font-medium text-slate-700">
              Custom File Name (Nameable)
            </label>
            <div className="relative">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={`omniprice_${platform.toLowerCase()}_${new Date().toISOString().slice(0, 10)}`}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-2 focus:ring-slate-900"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-slate-400 text-xs">
                .{format}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Leave blank to use the automated timestamped name.
            </p>
          </div>

          {/* Persistence status */}
          <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
            <HardDrive className="w-3.5 h-3.5" />
            <span>Disk persistence active: All tracked records are automatically preserved on the server.</span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded-lg font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleDownload}
              disabled={filteredCount === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-lg font-medium shadow-xs transition-colors cursor-pointer"
            >
              {downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download {filteredCount} Records</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
