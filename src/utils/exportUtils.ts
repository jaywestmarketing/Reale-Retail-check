import { TrackedProduct } from '../types';

export interface ExportOptions {
  format: 'csv' | 'txt';
  platform: 'all' | string;
  customFilename?: string;
  includeAnalytics?: boolean;
}

export function exportProductData(products: TrackedProduct[], options: ExportOptions) {
  const { format, platform, customFilename, includeAnalytics = true } = options;

  // Filter products by platform if specific platform selected
  const filteredProducts = platform === 'all'
    ? products
    : products.filter(p => p.retailer.toLowerCase().includes(platform.toLowerCase()));

  const nowStr = new Date().toISOString().slice(0, 10);
  const defaultName = `omniprice_${platform.toLowerCase()}_${nowStr}.${format}`;
  const filename = (customFilename?.trim() ? customFilename.trim() : defaultName).replace(/\.[^/.]+$/, "") + `.${format}`;

  let fileContent = '';
  let mimeType = 'text/plain;charset=utf-8';

  if (format === 'csv') {
    mimeType = 'text/csv;charset=utf-8';
    fileContent = generatePlatformCsv(filteredProducts, platform, includeAnalytics);
  } else {
    mimeType = 'text/plain;charset=utf-8';
    fileContent = generatePlatformTxt(filteredProducts, platform, includeAnalytics);
  }

  // Trigger browser download
  const blob = new Blob([fileContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function generatePlatformCsv(products: TrackedProduct[], platform: string, includeAnalytics: boolean): string {
  const plat = platform.toLowerCase();

  // 1. Amazon Specific Structure
  if (plat.includes('amazon')) {
    const headers = [
      'ASIN / SKU',
      'Amazon Item Title',
      'Current Price',
      'Currency',
      'Initial Price',
      'Target Price',
      'Stock Status',
      '14-Period SMA',
      'Volatility (StdDev)',
      'Bollinger Bandwidth (%)',
      'Z-Score',
      'Selector Used',
      'Confidence Score',
      'Product URL',
      'Last Checked'
    ];
    const rows = products.map(p => [
      escapeCsv(p.sku || p.id),
      escapeCsv(p.name),
      p.currentPrice.toFixed(2),
      escapeCsv(p.currency),
      p.initialPrice.toFixed(2),
      p.targetPrice !== undefined ? p.targetPrice.toFixed(2) : '',
      escapeCsv(p.availability),
      p.analytics?.sma ? p.analytics.sma.toFixed(2) : '',
      p.analytics?.std_dev ? p.analytics.std_dev.toFixed(2) : '',
      p.analytics?.bollinger_bandwidth ? p.analytics.bollinger_bandwidth.toFixed(2) : '',
      p.analytics?.z_score ? p.analytics.z_score.toFixed(2) : '',
      escapeCsv(p.primarySelector),
      p.confidenceScore.toFixed(2),
      escapeCsv(p.url),
      new Date(p.lastChecked).toISOString(),
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // 2. Walmart Specific Structure
  if (plat.includes('walmart')) {
    const headers = [
      'Walmart Item ID / SKU',
      'Item Description',
      'Current Price',
      'Currency',
      'Initial Price',
      'Target Price',
      'Price Drop (%)',
      'In Stock',
      'Primary CSS Selector',
      'Strategy Used',
      'Product Web URL',
      'Last Scraped Timestamp'
    ];
    const rows = products.map(p => {
      const dropPct = p.initialPrice > 0 ? ((p.initialPrice - p.currentPrice) / p.initialPrice) * 100 : 0;
      return [
        escapeCsv(p.sku || p.id),
        escapeCsv(p.name),
        p.currentPrice.toFixed(2),
        escapeCsv(p.currency),
        p.initialPrice.toFixed(2),
        p.targetPrice !== undefined ? p.targetPrice.toFixed(2) : '',
        dropPct.toFixed(1),
        escapeCsv(p.availability),
        escapeCsv(p.primarySelector),
        escapeCsv(p.strategyUsed),
        escapeCsv(p.url),
        new Date(p.lastChecked).toISOString(),
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  // 3. Best Buy / Electronics Structure
  if (plat.includes('best buy') || plat.includes('bestbuy') || plat.includes('electronics')) {
    const headers = [
      'BestBuy SKU',
      'Product Name',
      'Current Price',
      'Currency',
      'Initial Price',
      'Target Price',
      'All-Time Low',
      'Max Drawdown (%)',
      'Availability',
      'Product URL',
      'Last Checked'
    ];
    const rows = products.map(p => [
      escapeCsv(p.sku || p.id),
      escapeCsv(p.name),
      p.currentPrice.toFixed(2),
      escapeCsv(p.currency),
      p.initialPrice.toFixed(2),
      p.targetPrice !== undefined ? p.targetPrice.toFixed(2) : '',
      p.analytics?.is_all_time_low ? 'YES' : 'NO',
      p.analytics?.max_drawdown_percent ? p.analytics.max_drawdown_percent.toFixed(1) : '0.0',
      escapeCsv(p.availability),
      escapeCsv(p.url),
      new Date(p.lastChecked).toISOString(),
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
  }

  // 4. Default / All Platforms Master Structure
  const headers = [
    'ID',
    'SKU',
    'Product Name',
    'Platform / Retailer',
    'Current Price',
    'Initial Price',
    'Currency',
    'Target Price',
    'Price Change (%)',
    'Stock Availability',
    '14-Tick SMA',
    'EMA (α=0.2)',
    'Volatility (Std Dev)',
    'Z-Score',
    'Bollinger Lower',
    'Bollinger Upper',
    'All-Time Low Flag',
    'Primary Selector',
    'Confidence Score',
    'Live URL',
    'Last Scraped'
  ];

  const rows = products.map(p => {
    const diffPct = p.initialPrice > 0 ? ((p.currentPrice - p.initialPrice) / p.initialPrice) * 100 : 0;
    return [
      escapeCsv(p.id),
      escapeCsv(p.sku || 'N/A'),
      escapeCsv(p.name),
      escapeCsv(p.retailer),
      p.currentPrice.toFixed(2),
      p.initialPrice.toFixed(2),
      escapeCsv(p.currency),
      p.targetPrice !== undefined ? p.targetPrice.toFixed(2) : '',
      diffPct.toFixed(1),
      escapeCsv(p.availability),
      p.analytics?.sma ? p.analytics.sma.toFixed(2) : '',
      p.analytics?.ema ? p.analytics.ema.toFixed(2) : '',
      p.analytics?.std_dev ? p.analytics.std_dev.toFixed(2) : '',
      p.analytics?.z_score ? p.analytics.z_score.toFixed(2) : '',
      p.analytics?.bollinger_lower ? p.analytics.bollinger_lower.toFixed(2) : '',
      p.analytics?.bollinger_upper ? p.analytics.bollinger_upper.toFixed(2) : '',
      p.analytics?.is_all_time_low ? 'TRUE' : 'FALSE',
      escapeCsv(p.primarySelector),
      p.confidenceScore.toFixed(2),
      escapeCsv(p.url),
      new Date(p.lastChecked).toISOString(),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

function generatePlatformTxt(products: TrackedProduct[], platform: string, includeAnalytics: boolean): string {
  const line = '='.repeat(80);
  const subline = '-'.repeat(80);
  const now = new Date().toLocaleString();

  let out = `${line}\n`;
  out += `OMNIPRICE LIVE DATA EXPORT REPORT\n`;
  out += `Platform Scope : ${platform.toUpperCase()}\n`;
  out += `Generated At   : ${now}\n`;
  out += `Total Products : ${products.length}\n`;
  out += `${line}\n\n`;

  if (products.length === 0) {
    out += `No products found for the selected platform scope.\n`;
    return out;
  }

  products.forEach((p, idx) => {
    out += `[ITEM #${idx + 1}] ${p.name.toUpperCase()}\n`;
    out += `${subline}\n`;
    out += `  Retailer Platform : ${p.retailer}\n`;
    if (p.sku) out += `  SKU / Item ID     : ${p.sku}\n`;
    out += `  Current Live Price: ${p.currency}${p.currentPrice.toFixed(2)}\n`;
    out += `  Initial Base Price: ${p.currency}${p.initialPrice.toFixed(2)}\n`;
    if (p.targetPrice) out += `  Target Alert Price: ${p.currency}${p.targetPrice.toFixed(2)}\n`;
    out += `  Stock Status      : ${p.availability}\n`;
    out += `  Selector Bound    : ${p.primarySelector} (${Math.round(p.confidenceScore * 100)}% conf)\n`;
    out += `  Live Web URL      : ${p.url}\n`;
    out += `  Last Scanned      : ${new Date(p.lastChecked).toLocaleString()}\n`;

    if (includeAnalytics && p.analytics) {
      out += `  C++ Analytical Metrics:\n`;
      out += `    - 14-Period SMA   : ${p.currency}${p.analytics.sma.toFixed(2)}\n`;
      out += `    - Volatility (σ)  : ${p.currency}${p.analytics.std_dev.toFixed(2)}\n`;
      out += `    - Z-Score         : ${p.analytics.z_score.toFixed(2)}\n`;
      out += `    - Bollinger Range : [${p.currency}${p.analytics.bollinger_lower.toFixed(2)} - ${p.currency}${p.analytics.bollinger_upper.toFixed(2)}]\n`;
      out += `    - All-Time Low    : ${p.analytics.is_all_time_low ? 'YES' : 'NO'}\n`;
      out += `    - C++ Calc Latency: ${p.analytics.execution_time_ns} ns\n`;
    }

    if (p.alerts && p.alerts.length > 0) {
      out += `  Recent Alerts:\n`;
      p.alerts.slice(0, 3).forEach(al => {
        out += `    * [${al.type}] ${al.message}\n`;
      });
    }

    out += `\n`;
  });

  out += `${line}\n`;
  out += `END OF REPORT - OMNIPRICE MECHANISM STUDIO\n`;
  return out;
}
