/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ProductRadarTab } from './components/ProductRadarTab';
import { MechanismsHubTab } from './components/MechanismsHubTab';
import { CloudPlannerTab } from './components/CloudPlannerTab';
import { AgentInspectModal } from './components/AgentInspectModal';
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
  const [activeTab, setActiveTab] = useState<string>('radar');
  const [products, setProducts] = useState<TrackedProduct[]>([]);
  const [mechanisms, setMechanisms] = useState<MechanismItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [exportMechanismId, setExportMechanismId] = useState<string | null>(null);

  // Initial load of real tracked products
  const loadData = async () => {
    try {
      const [prodRes, mechRes] = await Promise.all([
        fetchProducts(),
        fetchMechanisms(),
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

  // Direct scan from top input on app load
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

  // Re-check a tracked product live over HTTP
  const handleCheckProduct = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await checkProductNow(id);
      if (res.success && res.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? res.product : p))
        );
      }
    } catch (e) {
      console.error('Live re-check failed:', e);
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

  const totalAlerts = products.reduce((acc, p) => acc + (p.alerts?.length || 0), 0);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans antialiased flex flex-col">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewTracker={() => setIsAgentModalOpen(true)}
        productCount={products.length}
        alertCount={totalAlerts}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <div className="w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
            <span className="text-xs font-mono">Initializing Live Scraping Engine & C++ Core...</span>
          </div>
        ) : (
          <>
            {activeTab === 'radar' && (
              <ProductRadarTab
                products={products}
                onCheckProduct={handleCheckProduct}
                onDeleteProduct={handleDeleteProduct}
                onDirectScan={handleDirectScan}
                loadingId={loadingId}
              />
            )}

            {/* Single dedicated page for checking all mechanisms specifically */}
            {activeTab === 'mechanisms-hub' && (
              <MechanismsHubTab
                products={products}
                mechanisms={mechanisms}
                onOpenCodeModal={(id) => setExportMechanismId(id)}
              />
            )}

            {/* 24/7 Cloud Architecture & Cost Planner */}
            {activeTab === 'cloud-plan' && (
              <CloudPlannerTab />
            )}
          </>
        )}
      </main>

      {/* Live Agent Inspection Modal */}
      <AgentInspectModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onConfirmAdd={handleConfirmAddProduct}
      />

      {/* Mechanism Code Export Modal */}
      <CodeModal
        mechanismId={exportMechanismId}
        onClose={() => setExportMechanismId(null)}
      />
    </div>
  );
}
