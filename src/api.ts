import {
  TrackedProduct,
  AgentInspectResponse,
  MechanismItem,
  CppAnalytics,
  BenchmarkResult,
  AutonomousCrawlResult,
  DiscoveredLink,
  ContinuityResolutionResult,
  CatalogSignal,
  CatalogHarvestResult,
} from './types';

export async function fetchMechanisms(): Promise<{ mechanisms: MechanismItem[] }> {
  const res = await fetch('/api/mechanisms');
  if (!res.ok) throw new Error('Failed to fetch mechanisms');
  return res.json();
}

export async function fetchProducts(): Promise<{ products: TrackedProduct[] }> {
  const res = await fetch('/api/products');
  if (!res.ok) throw new Error('Failed to fetch tracked products');
  return res.json();
}

export async function addProduct(productData: Partial<TrackedProduct>): Promise<{ success: boolean; product: TrackedProduct }> {
  const res = await fetch('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productData),
  });
  if (!res.ok) throw new Error('Failed to add product');
  return res.json();
}

export async function checkProductNow(id: string): Promise<{ success: boolean; product: TrackedProduct }> {
  const res = await fetch(`/api/products/${id}/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to check product');
  return res.json();
}

export async function simulatePriceTick(id: string, mode: string, customPrice?: number): Promise<{ success: boolean; product: TrackedProduct }> {
  const res = await fetch(`/api/products/${id}/simulate-tick`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, new_price: customPrice }),
  });
  if (!res.ok) throw new Error('Failed to simulate price tick');
  return res.json();
}

export async function deleteProduct(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/products/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete product');
  return res.json();
}

export async function scanAndTrackUrl(url: string, targetPrice?: number, dropThresholdPct?: number, advanced?: any): Promise<{ success: boolean; product?: TrackedProduct; crawlResult?: AutonomousCrawlResult; categories?: DiscoveredLink[]; products?: DiscoveredLink[]; botShield?: string; error?: string }> {
  const res = await fetch('/api/agent/scan-and-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, targetPrice, dropThresholdPct, ...advanced }),
  });
  const data = await res.json();
  return data;
}

export async function autonomousCrawl(url: string, options?: any): Promise<AutonomousCrawlResult> {
  const res = await fetch('/api/agent/autonomous-crawl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, options }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Autonomous crawl failed');
  }
  return data;
}

export async function batchScanUrls(urls: string[], advanced?: any): Promise<{ success: boolean; count: number; products: TrackedProduct[]; errors: string[] }> {
  const res = await fetch('/api/agent/batch-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls, advanced }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to batch scan URLs');
  }
  return data;
}

export async function matchProductPlatforms(query: string, sku?: string, platforms?: string[], advanced?: any): Promise<any> {
  const res = await fetch('/api/agent/platform-match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, sku, platforms, advanced }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to match across platforms');
  }
  return data;
}

export async function inspectUrlWithAgent(url: string, options?: any): Promise<AgentInspectResponse> {
  const res = await fetch('/api/agent/inspect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, options }),
  });
  if (!res.ok) throw new Error('Failed to inspect URL');
  return res.json();
}

export async function calculateAnalytics(prices: number[], sma_period = 14, ema_alpha = 0.2, drop_threshold_pct = 5.0): Promise<CppAnalytics> {
  const res = await fetch('/api/analytics/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prices, sma_period, ema_alpha, drop_threshold_pct }),
  });
  if (!res.ok) throw new Error('Failed to compute C++ analytics');
  return res.json();
}

export async function runBenchmark(iterations = 50000): Promise<BenchmarkResult> {
  const res = await fetch('/api/analytics/benchmark', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ iterations }),
  });
  if (!res.ok) throw new Error('Failed to run benchmark');
  return res.json();
}

export async function exportMechanismFiles(id: string): Promise<{ mechanism_id: string; files: { filename: string; content: string; language: string }[] }> {
  const res = await fetch(`/api/export/mechanism/${id}`);
  if (!res.ok) throw new Error('Failed to export mechanism files');
  return res.json();
}

export async function testContinuityResolution(url: string, options?: any): Promise<ContinuityResolutionResult> {
  const res = await fetch('/api/mechanisms/continuity/test-resolution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, options }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Failed to test continuity resolution' }));
    throw new Error(err.error || 'Failed to test continuity resolution');
  }
  return res.json();
}

export async function harvestCatalogSignals(url: string, options?: any): Promise<CatalogHarvestResult> {
  const res = await fetch('/api/catalog/harvest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, options }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to harvest catalog signals');
  }
  return data;
}

export async function fetchCatalogSignals(filter_type?: string, search?: string): Promise<{ status: string; total: number; signals: CatalogSignal[] }> {
  const params = new URLSearchParams();
  if (filter_type) params.set('filter_type', filter_type);
  if (search) params.set('search', search);

  const res = await fetch(`/api/catalog/signals?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to fetch catalog signals');
  }
  return data;
}

export async function clearCatalogSignals(): Promise<void> {
  const res = await fetch('/api/catalog/clear', { method: 'POST' });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to clear catalog signals');
  }
}

export function getCatalogDownloadUrl(format: 'csv' | 'json' = 'csv'): string {
  return `/api/catalog/download?format=${format}`;
}

export async function fetchExperienceState(): Promise<import('./types').ExperienceStateResponse> {
  const res = await fetch('/api/experience/state');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to fetch experience state');
  return data;
}

export async function setExperienceEnvironment(environment_id: string): Promise<any> {
  const res = await fetch('/api/experience/set-environment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ environment_id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to set environment');
  return data;
}

export async function updateExperienceCoefficients(coefficients: any): Promise<any> {
  const res = await fetch('/api/experience/update-coefficients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coefficients }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update coefficients');
  return data;
}

export async function recordExperience(experience: any): Promise<any> {
  const res = await fetch('/api/experience/record', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(experience),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to record experience');
  return data;
}

export async function resetExperienceWeights(): Promise<any> {
  const res = await fetch('/api/experience/reset', { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reset weights');
  return data;
}

