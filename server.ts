import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = parseInt(process.env.PORT || '3000', 10);

interface TrackedProduct {
  id: string;
  name: string;
  url: string;
  retailer: string;
  sku?: string;
  primarySelector: string;
  fallbackSelector: string;
  strategyUsed: string;
  confidenceScore: number;
  currency: string;
  currentPrice: number;
  initialPrice: number;
  targetPrice?: number;
  dropThresholdPct: number;
  availability: string;
  priceHistory: { timestamp: number; price: number }[];
  lastChecked: number;
  analytics?: any;
  alerts: any[];
  agentReasoning: string;
  active: boolean;
}

const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'tracked_products.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadPersistedProducts(): TrackedProduct[] {
  try {
    ensureDataDir();
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error loading persisted products:', err);
  }
  return [];
}

function savePersistedProducts(products: TrackedProduct[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(products, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving persisted products:', err);
  }
}

// Persistent database for products - loaded from disk or starts empty
let trackedProducts: TrackedProduct[] = loadPersistedProducts();

function runPythonCli(command: string, payload: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(__dirname, 'backend', 'cli_runner.py');
    const jsonStr = JSON.stringify(payload);
    execFile('python3', [scriptPath, command, jsonStr], { maxBuffer: 10 * 1024 * 1024, timeout: 60000 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running CLI ${command}:`, stderr || error.message);
        return reject(new Error(stderr || error.message));
      }
      try {
        const parsed = JSON.parse(stdout.trim());
        resolve(parsed);
      } catch (err: any) {
        console.error('Failed to parse CLI output:', stdout);
        reject(new Error(`Invalid JSON from python CLI: ${stdout}`));
      }
    });
  });
}

// Recalculate C++ analytics for initial items
async function initializeAnalytics() {
  for (const item of trackedProducts) {
    try {
      const prices = item.priceHistory.map(p => p.price);
      const res = await runPythonCli('analytics', {
        prices,
        sma_period: 14,
        ema_alpha: 0.2,
        drop_threshold_pct: item.dropThresholdPct,
      });
      item.analytics = res;
    } catch (e) {
      console.warn('Initial analytics calculation warning:', e);
    }
  }
}

async function startServer() {
  await initializeAnalytics();

  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // --- API Endpoints ---

  // 1. Get Mechanisms Manifest & State
  app.get('/api/mechanisms', async (req: Request, res: Response) => {
    try {
      const result = await runPythonCli('manifest', {});
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Agent Inspect URL (Mechanism 1 Ingestion + Mechanism 2 DOM Agent)
  app.post('/api/agent/inspect', async (req: Request, res: Response) => {
    const { url, options } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    try {
      const result = await runPythonCli('inspect_url', { url, options });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2b-0. Test Execution Continuity & 403 Error Resolution Cascade (Mechanism 5)
  app.post('/api/mechanisms/continuity/test-resolution', async (req: Request, res: Response) => {
    const { url, options } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    try {
      const result = await runPythonCli('test_continuity', { url, options });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });


  // 2b. Direct Scan & Track on URL Entry with Autonomous Catalog & Product Crawling
  app.post('/api/agent/scan-and-track', async (req: Request, res: Response) => {
    const { url, targetPrice, dropThresholdPct, sku, customSelector, productNameFilter, forceTrack } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    try {
      // Run Autonomous Deep Crawler with options passed
      const crawlRes = await runPythonCli('autonomous_crawl', { url, options: req.body });

      if ((crawlRes.success && crawlRes.detected_price !== null) || forceTrack) {
        const detectedPrice = crawlRes.detected_price !== null && crawlRes.detected_price !== undefined 
          ? crawlRes.detected_price 
          : (targetPrice ? parseFloat(targetPrice) : 49.99);
        const parsedTarget = targetPrice ? parseFloat(targetPrice) : undefined;
        const threshold = dropThresholdPct ? parseFloat(dropThresholdPct) : 5.0;

        let title = crawlRes.final_product_name || 'Tracked Retailer Product';
        if (productNameFilter) {
          title = `${productNameFilter} (${title})`;
        }

        let hostname = 'Live Retailer';
        try {
          hostname = new URL(crawlRes.final_product_url || url).hostname.replace(/^www\./, '');
        } catch (e) {}

        const newProduct: TrackedProduct = {
          id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: title,
          url: crawlRes.final_product_url || url,
          retailer: hostname,
          sku: sku,
          primarySelector: customSelector || crawlRes.primary_selector || '.product-price',
          fallbackSelector: crawlRes.fallback_selector || '',
          strategyUsed: customSelector ? 'custom_selector_override' : (crawlRes.strategy_used || 'edge_continuity_resolved'),
          confidenceScore: crawlRes.confidence_score || 0.95,
          currency: crawlRes.currency || '$',
          currentPrice: detectedPrice,
          initialPrice: detectedPrice,
          targetPrice: parsedTarget,
          dropThresholdPct: threshold,
          availability: crawlRes.availability || 'In Stock',
          priceHistory: [{ timestamp: Date.now(), price: detectedPrice }],
          lastChecked: Date.now(),
          alerts: [],
          agentReasoning: crawlRes.agent_reasoning || 'Autonomously resolved via Execution Continuity Network Adapter.',
          active: true,
        };

        // Compute initial C++ analytics
        try {
          const analyticsRes = await runPythonCli('analytics', {
            prices: [detectedPrice],
            sma_period: 14,
            ema_alpha: 0.2,
            drop_threshold_pct: threshold,
          });
          newProduct.analytics = analyticsRes;
        } catch (e) {
          console.warn('Analytics compute error:', e);
        }

        const existingIdx = trackedProducts.findIndex(p => p.url === newProduct.url);
        if (existingIdx >= 0) {
          trackedProducts[existingIdx] = newProduct;
        } else {
          trackedProducts.unshift(newProduct);
        }

        savePersistedProducts(trackedProducts);

        return res.status(201).json({
          success: true,
          product: newProduct,
          crawlResult: crawlRes,
        });
      } else {
        // Deep crawl did not find a direct product or encountered bot shield / catalog hub
        return res.status(200).json({
          success: false,
          error: crawlRes.error || 'Could not resolve a product price on this page.',
          crawlResult: crawlRes,
          categories: crawlRes.discovered_categories || [],
          products: crawlRes.discovered_products || [],
          botShield: crawlRes.bot_shield_detected,
        });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2b-2. Autonomous Crawl Explorer Endpoint
  app.post('/api/agent/autonomous-crawl', async (req: Request, res: Response) => {
    const { url, options } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    try {
      const crawlRes = await runPythonCli('autonomous_crawl', { url, options });
      res.json(crawlRes);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2c. Batch Scan URL List
  app.post('/api/agent/batch-scan', async (req: Request, res: Response) => {
    const { urls, advanced } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'Array of URLs is required' });
    }

    const addedProducts: TrackedProduct[] = [];
    const errors: string[] = [];

    for (const rawUrl of urls) {
      const trimmed = (rawUrl || '').trim();
      if (!trimmed) continue;
      try {
        const inspectRes = await runPythonCli('inspect_url', { url: trimmed });
        if (inspectRes.success && inspectRes.agent_identification?.detected_price !== null) {
          const agentData = inspectRes.agent_identification;
          const detectedPrice = agentData.detected_price;

          // Price filter checks
          if (advanced?.minPrice && detectedPrice < advanced.minPrice) continue;
          if (advanced?.maxPrice && detectedPrice > advanced.maxPrice) continue;

          let title = agentData.title || 'Tracked Product';
          if (advanced?.productNameFilter) {
            title = `${advanced.productNameFilter} (${title})`;
          }

          const newProduct: TrackedProduct = {
            id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: title,
            url: inspectRes.ingestion.canonical_url || trimmed,
            retailer: inspectRes.ingestion.retailer_detected || 'Live Retailer',
            sku: advanced?.sku,
            primarySelector: advanced?.customSelector || agentData.primary_selector,
            fallbackSelector: agentData.fallback_selector,
            strategyUsed: advanced?.customSelector ? 'custom_selector_override' : agentData.strategy_used,
            confidenceScore: agentData.confidence_score,
            currency: agentData.currency || '$',
            currentPrice: detectedPrice,
            initialPrice: detectedPrice,
            targetPrice: advanced?.targetPrice ? parseFloat(advanced.targetPrice) : undefined,
            dropThresholdPct: advanced?.dropThresholdPct ? parseFloat(advanced.dropThresholdPct) : 5.0,
            availability: agentData.availability || 'In Stock',
            priceHistory: [{ timestamp: Date.now(), price: detectedPrice }],
            lastChecked: Date.now(),
            alerts: [],
            agentReasoning: agentData.agent_reasoning,
            active: true,
          };

          try {
            const analyticsRes = await runPythonCli('analytics', {
              prices: [detectedPrice],
              sma_period: 14,
              ema_alpha: 0.2,
              drop_threshold_pct: newProduct.dropThresholdPct,
            });
            newProduct.analytics = analyticsRes;
          } catch (e) {}

          const existingIdx = trackedProducts.findIndex(p => p.url === newProduct.url);
          if (existingIdx >= 0) {
            trackedProducts[existingIdx] = newProduct;
          } else {
            trackedProducts.unshift(newProduct);
          }
          addedProducts.push(newProduct);
        } else {
          errors.push(`Could not identify price element on: ${trimmed}`);
        }
      } catch (err: any) {
        errors.push(`Error on ${trimmed}: ${err.message}`);
      }
    }

    savePersistedProducts(trackedProducts);
    res.json({
      success: true,
      count: addedProducts.length,
      products: addedProducts,
      errors,
    });
  });

  // 2d. Product Platform Matcher (Search & Compare across Amazon, Walmart, Best Buy, eBay, etc.)
  app.post('/api/agent/platform-match', async (req: Request, res: Response) => {
    const { query, sku, platforms, advanced } = req.body;
    const searchTerm = (query || sku || '').trim();
    if (!searchTerm) {
      return res.status(400).json({ error: 'Product name or SKU query is required' });
    }

    const targetPlatforms: string[] = (Array.isArray(platforms) && platforms.length > 0)
      ? platforms
      : ['Amazon', 'Walmart', 'Best Buy', 'Target', 'eBay'];

    const matchedPlatforms: any[] = [];
    const encoded = encodeURIComponent(searchTerm);

    // Platform search definitions
    const platformSearchUrls: Record<string, string> = {
      'Amazon': `https://www.amazon.com/s?k=${encoded}`,
      'Walmart': `https://www.walmart.com/search?q=${encoded}`,
      'Best Buy': `https://www.bestbuy.com/site/searchpage.jsp?st=${encoded}`,
      'Target': `https://www.target.com/s?searchTerm=${encoded}`,
      'eBay': `https://www.ebay.com/sch/i.html?_nkw=${encoded}`,
    };

    for (const plat of targetPlatforms) {
      const url = platformSearchUrls[plat];
      if (!url) continue;
      try {
        const inspectRes = await runPythonCli('inspect_url', { url });
        if (inspectRes.success && inspectRes.agent_identification?.detected_price) {
          const agent = inspectRes.agent_identification;
          const detectedP = agent.detected_price;

          // Apply min/max price bounds if in advanced
          if (advanced?.minPrice && detectedP < advanced.minPrice) continue;
          if (advanced?.maxPrice && detectedP > advanced.maxPrice) continue;

          matchedPlatforms.push({
            platform: plat,
            productName: agent.title || searchTerm,
            price: detectedP,
            currency: agent.currency || '$',
            url: inspectRes.ingestion.canonical_url || url,
            inStock: agent.availability !== 'Out of Stock',
            confidence: agent.confidence_score,
            selector: agent.primary_selector,
          });
        }
      } catch (e) {
        // Continue scanning other platforms
      }
    }

    matchedPlatforms.sort((a, b) => a.price - b.price);
    const bestPrice = matchedPlatforms.length > 0 ? matchedPlatforms[0] : null;

    res.json({
      success: true,
      query: searchTerm,
      sku: sku || advanced?.sku,
      matchedCount: matchedPlatforms.length,
      platforms: matchedPlatforms,
      bestPrice,
    });
  });

  // 3. Tracked Products List
  app.get('/api/products', (req: Request, res: Response) => {
    res.json({ products: trackedProducts });
  });

  // 4. Add New Tracked Product
  app.post('/api/products', async (req: Request, res: Response) => {
    try {
      const {
        name,
        url,
        retailer,
        primarySelector,
        fallbackSelector,
        strategyUsed,
        confidenceScore,
        currency,
        currentPrice,
        targetPrice,
        dropThresholdPct,
        availability,
        agentReasoning
      } = req.body;

      const initialP = currentPrice || 0.0;
      const newProduct: TrackedProduct = {
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name || 'Tracked Product',
        url: url || '',
        retailer: retailer || 'Custom Retailer',
        primarySelector: primarySelector || '.product-price',
        fallbackSelector: fallbackSelector || '',
        strategyUsed: strategyUsed || 'manual',
        confidenceScore: confidenceScore ?? 1.0,
        currency: currency || '$',
        currentPrice: initialP,
        initialPrice: initialP,
        targetPrice: targetPrice ? parseFloat(targetPrice) : undefined,
        dropThresholdPct: dropThresholdPct ? parseFloat(dropThresholdPct) : 5.0,
        availability: availability || 'In Stock',
        priceHistory: [{ timestamp: Date.now(), price: initialP }],
        lastChecked: Date.now(),
        alerts: [],
        agentReasoning: agentReasoning || 'Manually added or agent verified.',
        active: true,
      };

      // Compute initial C++ analytics
      try {
        const analyticsRes = await runPythonCli('analytics', {
          prices: [initialP],
          sma_period: 14,
          ema_alpha: 0.2,
          drop_threshold_pct: newProduct.dropThresholdPct,
        });
        newProduct.analytics = analyticsRes;
      } catch (e) {
        // non-blocking
      }

      trackedProducts.unshift(newProduct);
      savePersistedProducts(trackedProducts);
      res.status(201).json({ success: true, product: newProduct });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 5. Trigger Immediate Check / Re-scrape
  app.post('/api/products/:id/check', async (req: Request, res: Response) => {
    const { id } = req.params;
    const product = trackedProducts.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    try {
      // Re-inspect via agent
      const inspectRes = await runPythonCli('inspect_url', { url: product.url });
      let newPrice = product.currentPrice;
      if (inspectRes.success && inspectRes.agent_identification?.detected_price) {
        newPrice = inspectRes.agent_identification.detected_price;
      }

      // Evaluate fluctuation via Mechanism 4 + Mechanism 3 (C++)
      const historyPrices = product.priceHistory.map(p => p.price);
      const evalRes = await runPythonCli('evaluate_fluctuation', {
        product_id: product.id,
        new_price: newPrice,
        history: historyPrices,
        target_price: product.targetPrice,
        drop_pct_threshold: product.dropThresholdPct,
      });

      product.currentPrice = newPrice;
      product.lastChecked = Date.now();
      product.priceHistory.push({ timestamp: Date.now(), price: newPrice });
      product.analytics = evalRes.analytics;
      if (evalRes.alerts && evalRes.alerts.length > 0) {
        for (const al of evalRes.alerts) {
          product.alerts.unshift({ ...al, timestamp: Date.now() });
        }
      }

      savePersistedProducts(trackedProducts);

      res.json({
        success: true,
        product,
        evaluation: evalRes,
        inspection: inspectRes,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Simulate Price Fluctuation (for demonstration & live C++ testing)
  app.post('/api/products/:id/simulate-tick', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { new_price, mode } = req.body;
    const product = trackedProducts.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    try {
      let simulatedPrice = product.currentPrice;
      if (new_price !== undefined) {
        simulatedPrice = parseFloat(new_price);
      } else if (mode === 'drop_10') {
        simulatedPrice = roundToTwo(product.currentPrice * 0.90);
      } else if (mode === 'drop_25') {
        simulatedPrice = roundToTwo(product.currentPrice * 0.75);
      } else if (mode === 'spike_15') {
        simulatedPrice = roundToTwo(product.currentPrice * 1.15);
      } else if (mode === 'hit_target' && product.targetPrice) {
        simulatedPrice = roundToTwo(product.targetPrice - 1.0);
      } else if (mode === 'random_fluctuation') {
        const deltaPct = (Math.random() * 0.16) - 0.08; // -8% to +8%
        simulatedPrice = roundToTwo(product.currentPrice * (1 + deltaPct));
      }

      const historyPrices = product.priceHistory.map(p => p.price);
      const evalRes = await runPythonCli('evaluate_fluctuation', {
        product_id: product.id,
        new_price: simulatedPrice,
        history: historyPrices,
        target_price: product.targetPrice,
        drop_pct_threshold: product.dropThresholdPct,
      });

      product.currentPrice = simulatedPrice;
      product.lastChecked = Date.now();
      product.priceHistory.push({ timestamp: Date.now(), price: simulatedPrice });
      product.analytics = evalRes.analytics;
      if (evalRes.alerts && evalRes.alerts.length > 0) {
        for (const al of evalRes.alerts) {
          product.alerts.unshift({ ...al, timestamp: Date.now() });
        }
      }

      res.json({
        success: true,
        product,
        evaluation: evalRes,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Delete Product
  app.delete('/api/products/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    trackedProducts = trackedProducts.filter(p => p.id !== id);
    savePersistedProducts(trackedProducts);
    res.json({ success: true, remaining: trackedProducts.length });
  });

  // 8. Run C++ Analytics directly on arbitrary array
  app.post('/api/analytics/calculate', async (req: Request, res: Response) => {
    try {
      const { prices, sma_period, ema_alpha, drop_threshold_pct } = req.body;
      const result = await runPythonCli('analytics', {
        prices: prices || [100, 95, 90, 85],
        sma_period: sma_period || 14,
        ema_alpha: ema_alpha || 0.2,
        drop_threshold_pct: drop_threshold_pct || 5.0,
      });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 9. Run Performance Benchmark
  app.post('/api/analytics/benchmark', async (req: Request, res: Response) => {
    try {
      const { iterations } = req.body;
      const bench = await runPythonCli('benchmark', { iterations: iterations || 50000 });
      res.json(bench);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 10. Export Mechanism Source Files for Other Projects
  app.get('/api/export/mechanism/:id', (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      let files: { filename: string; content: string; language: string }[] = [];

      if (id === 'mechanism-1-ingestion') {
        const content = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'ingestion_mechanism.py'), 'utf-8');
        const contract = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'contracts.py'), 'utf-8');
        files = [
          { filename: 'ingestion_mechanism.py', content, language: 'python' },
          { filename: 'contracts.py', content: contract, language: 'python' },
        ];
      } else if (id === 'mechanism-2-dom-agent') {
        const content = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'dom_agent_mechanism.py'), 'utf-8');
        files = [
          { filename: 'dom_agent_mechanism.py', content, language: 'python' },
        ];
      } else if (id === 'mechanism-3-cpp-analytics') {
        const cpp = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'cpp_engine', 'price_analytics.cpp'), 'utf-8');
        const hpp = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'cpp_engine', 'price_analytics.hpp'), 'utf-8');
        const bridge = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'cpp_engine', 'analytics_bridge.py'), 'utf-8');
        const makefile = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'cpp_engine', 'Makefile'), 'utf-8');
        files = [
          { filename: 'price_analytics.cpp', content: cpp, language: 'cpp' },
          { filename: 'price_analytics.hpp', content: hpp, language: 'cpp' },
          { filename: 'analytics_bridge.py', content: bridge, language: 'python' },
          { filename: 'Makefile', content: makefile, language: 'makefile' },
        ];
      } else if (id === 'mechanism-4-scheduler-alerts') {
        const content = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'scheduler_mechanism.py'), 'utf-8');
        files = [
          { filename: 'scheduler_mechanism.py', content, language: 'python' },
        ];
      } else if (id === 'EXECUTION_CONTINUITY_NETWORK_ADAPTER' || id.toLowerCase().includes('continuity')) {
        const content = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'execution_continuity_adapter.py'), 'utf-8');
        const contract = fs.readFileSync(path.resolve(__dirname, 'backend', 'mechanisms', 'contracts.py'), 'utf-8');
        files = [
          { filename: 'execution_continuity_adapter.py', content, language: 'python' },
          { filename: 'contracts.py', content: contract, language: 'python' },
        ];
      } else {
        return res.status(404).json({ error: 'Mechanism not found' });
      }

      res.json({ mechanism_id: id, files });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // --- Vite Dev Server Middleware or Static Production Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[OmniPrice Mechanism Studio] Server listening on http://0.0.0.0:${PORT}`);
  });
}

function roundToTwo(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
