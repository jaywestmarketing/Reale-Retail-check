import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CategoryScannerStudioTab } from './components/CategoryScannerStudioTab';
import { ProductRadarTab } from './components/ProductRadarTab';
import { ExecutionContinuityTab } from './components/ExecutionContinuityTab';
import { MechanismsHubTab } from './components/MechanismsHubTab';
import { BrowserBenchmarkingTab } from './components/BrowserBenchmarkingTab';
import { RealBrowserTab } from './components/RealBrowserTab';
import { CognitiveLearningEngineTab } from './components/CognitiveLearningEngineTab';
import { AgentInspectModal } from './components/AgentInspectModal';
import { GitHubPushModal } from './components/GitHubPushModal';
import { CodeModal } from './components/CodeModal';
import {
  fetchProducts,
  fetchMechanisms,
  addProduct,
  checkProductNow,
  deleteProduct,
  scanAndTrackUrl,
} from './api';
import { TrackedProduct, MechanismItem, AdvancedScanOptions } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('category-studio');
  const [realBrowserUrl, setRealBrowserUrl] = useState<string>('https://www.homedepot.com/b/Tools/N-5yc1vZc1xy');
  const [products, setProducts] = useState<TrackedProduct[]>([]);
  const [mechanisms, setMechanisms] = useState<MechanismItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Modals
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState(false);
  const [exportMechanismId, setExportMechanismId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [prodRes, mechRes] = await Promise.all([
        fetchProducts().catch(() => ({ products: [] })),
        fetchMechanisms().catch(() => ({ mechanisms: [] })),
      ]);
      setProducts(prodRes.products || []);
      setMechanisms(mechRes.mechanisms || []);
    } catch (e) {
      console.error('Failed to load initial data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDirectScan = async (url: string, advanced?: AdvancedScanOptions) => {
    const res = await scanAndTrackUrl(url, advanced?.targetPrice, advanced?.dropThresholdPct, advanced);
    if (res.success && res.product) {
      setProducts((prev) => {
        const existingIdx = prev.findIndex((p) => p.url === res.product!.url);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = res.product!;
          return updated;
        }
        return [res.product!, ...prev];
      });
    }
    return res;
  };

  const handleCheckProduct = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await checkProductNow(id);
      if (res.success && res.product) {
        setProducts((prev) => prev.map((p) => (p.id === id ? res.product : p)));
      }
    } catch (e) {
      console.error('Product re-check failed:', e);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleConfirmAddProduct = async (productData: any) => {
    const res = await addProduct(productData);
    if (res.success && res.product) {
      setProducts((prev) => [res.product, ...prev]);
      setActiveTab('radar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTracker={() => setIsAgentModalOpen(true)}
        onOpenGitHubPush={() => setIsGitHubModalOpen(true)}
        checkpointCount={1}
        productCount={products.length}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-slate-300 border-t-indigo-600 rounded-full animate-spin" />
            <span className="text-xs font-mono">Initializing Autonomous Mechanisms...</span>
          </div>
        ) : (
          <>
            {/* Cognitive Platform Learning Engine & Human-Mimetic Synthesizer */}
            {activeTab === 'learning-engine' && (
              <CognitiveLearningEngineTab
                onOpenRealBrowser={(url) => {
                  setRealBrowserUrl(url);
                  setActiveTab('real-browser');
                }}
                onOpenCategoryStudio={() => setActiveTab('category-studio')}
              />
            )}

            {/* Primary View: Long-Running Category Scanner & Visual Studio */}
            {activeTab === 'category-studio' && (
              <CategoryScannerStudioTab
                onOpenGitHubPush={() => setIsGitHubModalOpen(true)}
                onTrackProduct={(url) => handleDirectScan(url)}
              />
            )}

            {/* Browser Benchmarking & Egress Performance Lab */}
            {activeTab === 'browser-benchmark' && (
              <BrowserBenchmarkingTab
                onOpenRealBrowser={(url) => {
                  setRealBrowserUrl(url);
                  setActiveTab('real-browser');
                }}
                onOpenCategoryStudio={() => setActiveTab('category-studio')}
              />
            )}

            {/* Real Live In-App Browser (Interactive Webview with Akamai 403 Ingress Gateway) */}
            {activeTab === 'real-browser' && (
              <RealBrowserTab
                initialUrl={realBrowserUrl}
                onOpenBenchmark={() => setActiveTab('browser-benchmark')}
                onOpenCategoryStudio={() => setActiveTab('category-studio')}
              />
            )}

            {/* Tracked Catalog Radar Tab */}
            {activeTab === 'radar' && (
              <ProductRadarTab
                products={products}
                onCheckProduct={handleCheckProduct}
                onDeleteProduct={handleDeleteProduct}
                onDirectScan={handleDirectScan}
                loadingId={loadingId}
              />
            )}

            {/* Execution Continuity & 403 Bypass Ingress */}
            {activeTab === 'continuity' && (
              <ExecutionContinuityTab />
            )}

            {/* Architecture & Interchangeable Mechanisms Manifest */}
            {activeTab === 'mechanisms' && (
              <MechanismsHubTab
                mechanisms={mechanisms}
                onOpenCodeModal={(id) => setExportMechanismId(id)}
              />
            )}
          </>
        )}
      </main>

      {/* Agent Inspect Modal */}
      <AgentInspectModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onConfirmAdd={handleConfirmAddProduct}
      />

      {/* GitHub Push Modal */}
      <GitHubPushModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      {/* Mechanism Code Export Modal */}
      <CodeModal
        mechanismId={exportMechanismId}
        onClose={() => setExportMechanismId(null)}
      />
    </div>
  );
}
