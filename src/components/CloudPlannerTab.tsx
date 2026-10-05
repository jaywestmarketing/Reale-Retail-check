import React, { useState } from 'react';
import {
  Cloud,
  Server,
  DollarSign,
  Cpu,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Terminal,
  FileCode,
  ShieldCheck,
  Zap,
  Globe,
  ArrowRight,
} from 'lucide-react';

export const CloudPlannerTab: React.FC = () => {
  const [selectedMode, setSelectedMode] = useState<'free' | 'low_cost' | 'pro' | 'hybrid'>('free');
  const [trackedItemsCount, setTrackedItemsCount] = useState(25);
  const [pollingMinutes, setPollingMinutes] = useState(15);
  const [proxyTier, setProxyTier] = useState<'none' | 'datacenter' | 'residential'>('none');
  const [activeRecipe, setActiveRecipe] = useState<'docker' | 'gcp' | 'oracle' | 'firebase'>('oracle');
  const [copied, setCopied] = useState(false);

  // Compute monthly figures
  const scrapesPerDayPerItem = (24 * 60) / pollingMinutes;
  const totalScrapesPerMonth = trackedItemsCount * scrapesPerDayPerItem * 30;
  const totalBandwidthGB = (totalScrapesPerMonth * 0.15) / 1024; // approx 150KB per HTML payload

  // Calculate costs based on mode & inputs
  let computeCost = 0;
  let dbCost = 0;
  let bandwidthCost = 0;
  let proxyCost = 0;

  if (selectedMode === 'free') {
    computeCost = 0;
    dbCost = 0;
    bandwidthCost = 0;
    proxyCost = 0;
  } else if (selectedMode === 'low_cost') {
    computeCost = 3.50; // Small Cloud Run instance or tiny VM
    dbCost = 0.50;
    bandwidthCost = Math.max(0, (totalBandwidthGB - 10) * 0.08);
    proxyCost = proxyTier === 'datacenter' ? 2.50 : (proxyTier === 'residential' ? 8.00 : 0);
  } else if (selectedMode === 'pro') {
    computeCost = 14.00; // Multi-core or dedicated VM for 1-minute scraping
    dbCost = 2.50;
    bandwidthCost = Math.max(0, (totalBandwidthGB - 50) * 0.08);
    proxyCost = proxyTier === 'residential' ? 18.00 : 6.00;
  } else if (selectedMode === 'hybrid') {
    computeCost = 0.00; // Oracle Always Free 4 OCPU ARM
    dbCost = 0.00; // Firebase Firestore free tier
    bandwidthCost = 0.00; // Oracle 10 TB free bandwidth
    proxyCost = proxyTier === 'residential' ? 10.00 : 3.00;
  }

  const totalMonthlyCost = computeCost + dbCost + bandwidthCost + proxyCost;

  const recipes = {
    oracle: {
      title: 'Oracle Cloud Infrastructure (OCI) Always Free 24/7 Daemon',
      language: 'bash',
      filename: 'deploy/oracle-always-free-setup.sh',
      content: `#!/usr/bin/env bash
# Oracle Cloud Always Free 24/7 Host Setup
# Specs: 4 OCPUs (ARM Ampere A1), 24 GB RAM, 200 GB NVMe - 100% Free Forever

sudo apt-get update && sudo apt-get install -y python3 g++ make curl git nodejs npm

# Setup application directory
sudo mkdir -p /opt/omniprice && sudo chown -R $USER:$USER /opt/omniprice
cd /opt/omniprice

# Compile C++ Engine with -O3 SIMD & build frontend
g++ -O3 -fPIC -Wall -std=c++17 -shared -o backend/mechanisms/cpp_engine/libprice_analytics.so backend/mechanisms/cpp_engine/price_analytics.cpp
npm install && npm run build

# Configure systemd daemon for 24/7 unattended execution
sudo tee /etc/systemd/system/omniprice.service > /dev/null <<EOF
[Unit]
Description=OmniPrice Mechanism Studio 24/7 Service
After=network.target

[Service]
Type=simple
User=\${USER}
WorkingDirectory=/opt/omniprice
ExecStart=/usr/bin/npx tsx server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload && sudo systemctl enable --now omniprice
echo "OmniPrice is running 24/7 on Oracle Always Free Tier!"`,
    },
    gcp: {
      title: 'Google Cloud Platform: Cloud Run + Cloud Scheduler',
      language: 'bash',
      filename: 'deploy/gcp-cloud-run-deploy.sh',
      content: `#!/usr/bin/env bash
# GCP Always Free Tier 24/7 Serverless Deployment
# Free Quota: 2M requests/month, 360k vCPU-sec, 180k GiB-sec

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="omniprice-studio"

# 1. Enable services
gcloud services enable run.googleapis.com cloudbuild.googleapis.com cloudscheduler.googleapis.com

# 2. Build & deploy to Cloud Run (scale-to-zero for $0.00/mo)
gcloud builds submit --tag "gcr.io/\${PROJECT_ID}/\${SERVICE_NAME}:latest" -f deploy/Dockerfile .

gcloud run deploy "\${SERVICE_NAME}" \\
    --image "gcr.io/\${PROJECT_ID}/\${SERVICE_NAME}:latest" \\
    --platform managed \\
    --region "\${REGION}" \\
    --allow-unauthenticated \\
    --memory 512Mi \\
    --cpu 1 \\
    --min-instances 0 \\
    --max-instances 2 \\
    --port 3000

SERVICE_URL=$(gcloud run services describe "\${SERVICE_NAME}" --platform managed --region "\${REGION}" --format 'value(status.url)')

# 3. Schedule 24/7 periodic scraping triggers (Free Cloud Scheduler)
gcloud scheduler jobs create http "\${SERVICE_NAME}-cron-15m" \\
    --schedule "*/15 * * * *" \\
    --uri "\${SERVICE_URL}/api/products" \\
    --http-method GET \\
    --location "\${REGION}"`,
    },
    docker: {
      title: 'Multi-Stage Production Dockerfile (Self-Hosted / Any Cloud)',
      language: 'dockerfile',
      filename: 'deploy/Dockerfile',
      content: `FROM node:20-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \\
    python3 g++ make curl ca-certificates \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .

# Compile C++ SIMD Engine and build Vite frontend
RUN g++ -O3 -fPIC -Wall -std=c++17 -shared -o backend/mechanisms/cpp_engine/libprice_analytics.so backend/mechanisms/cpp_engine/price_analytics.cpp
RUN npm run build && chmod +x backend/cli_runner.py

ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \\
  CMD curl -f http://localhost:3000/api/mechanisms || exit 1

CMD ["node", "node_modules/.bin/tsx", "server.ts"]`,
    },
    firebase: {
      title: 'Firebase Hosting + Firestore & Cloud Functions Architecture',
      language: 'markdown',
      filename: 'deploy/firebase-architecture.md',
      content: `# Firebase 24/7 Freemium Setup
- Frontend: Firebase Hosting (10 GB storage, 360 MB/day free)
- Database: Cloud Firestore (50k reads/day, 20k writes/day, 1GB data free)
- Backend Runner: Firebase Cloud Functions v2 (Blaze free tier - 2M calls/mo)
  * Note: Blaze pay-as-you-go unblocks outbound HTTP to Amazon/Walmart/Best Buy
  * Stays completely at $0.00/mo when under 2,000,000 invocations!`,
    },
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(recipes[activeRecipe].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-slate-900">
                  24/7 Cloud Architecture & Cost Mode Planner
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Freemium to At-Cost Matrix
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Detailed blueprints to host the Python scraper, C++ analytics engine, and React dashboard 24/7 on Google Cloud, Oracle, or Firebase.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Segmented Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Select Operational Deployment Mode
          </h3>
          <span className="text-xs font-mono text-slate-500">
            Current Tier: <strong className="text-slate-900">{selectedMode.toUpperCase()}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Mode 1: Free */}
          <div
            onClick={() => {
              setSelectedMode('free');
              setProxyTier('none');
              setPollingMinutes(15);
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedMode === 'free'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                selectedMode === 'free' ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-100 text-emerald-800'
              }`}>
                $0.00 / MONTH
              </span>
              <ShieldCheck className={`w-4 h-4 ${selectedMode === 'free' ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>
            <h4 className="text-sm font-bold">Always Free Mode</h4>
            <p className={`text-xs mt-1 leading-relaxed ${selectedMode === 'free' ? 'text-slate-300' : 'text-slate-500'}`}>
              Runs 100% within Oracle Cloud Always Free ARM (4 cores, 24GB RAM) or GCP Cloud Run scale-to-zero.
            </p>
          </div>

          {/* Mode 2: Low-Cost */}
          <div
            onClick={() => {
              setSelectedMode('low_cost');
              setProxyTier('datacenter');
              setPollingMinutes(10);
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedMode === 'low_cost'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                selectedMode === 'low_cost' ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-800'
              }`}>
                $3 - $6 / MONTH
              </span>
              <Zap className={`w-4 h-4 ${selectedMode === 'low_cost' ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>
            <h4 className="text-sm font-bold">Micro Budget Mode</h4>
            <p className={`text-xs mt-1 leading-relaxed ${selectedMode === 'low_cost' ? 'text-slate-300' : 'text-slate-500'}`}>
              Continuous 10-minute scraping with light proxy pool and persistent Cloud Run / small VM instances.
            </p>
          </div>

          {/* Mode 3: Pro Scaled */}
          <div
            onClick={() => {
              setSelectedMode('pro');
              setProxyTier('residential');
              setPollingMinutes(3);
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedMode === 'pro'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                selectedMode === 'pro' ? 'bg-indigo-400 text-slate-950' : 'bg-indigo-100 text-indigo-800'
              }`}>
                $18 - $32 / MONTH
              </span>
              <Server className={`w-4 h-4 ${selectedMode === 'pro' ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>
            <h4 className="text-sm font-bold">High-Frequency Pro</h4>
            <p className={`text-xs mt-1 leading-relaxed ${selectedMode === 'pro' ? 'text-slate-300' : 'text-slate-500'}`}>
              Rapid 1–3 min loops, residential proxy rotation, multi-worker parallel C++ batch calculation.
            </p>
          </div>

          {/* Mode 4: Hybrid */}
          <div
            onClick={() => {
              setSelectedMode('hybrid');
              setProxyTier('datacenter');
              setPollingMinutes(5);
            }}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              selectedMode === 'hybrid'
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-slate-50 hover:bg-white border-slate-200 text-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                selectedMode === 'hybrid' ? 'bg-teal-400 text-slate-950' : 'bg-teal-100 text-teal-800'
              }`}>
                RECOMMENDED ($10)
              </span>
              <Layers className={`w-4 h-4 ${selectedMode === 'hybrid' ? 'text-amber-400' : 'text-slate-400'}`} />
            </div>
            <h4 className="text-sm font-bold">Hybrid Multi-Cloud</h4>
            <p className={`text-xs mt-1 leading-relaxed ${selectedMode === 'hybrid' ? 'text-slate-300' : 'text-slate-500'}`}>
              Oracle Always Free for 24/7 worker compute + Firebase/GCP for Web UI + budget proxy bandwidth.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Bill Calculator & Cloud Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Sliders */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Operational Parameters
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Monitored Products</span>
                <span className="font-mono text-slate-900 font-bold">{trackedItemsCount} items</span>
              </div>
              <input
                type="range"
                min="5"
                max="250"
                step="5"
                value={trackedItemsCount}
                onChange={(e) => setTrackedItemsCount(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between font-medium text-slate-700 mb-1">
                <span>Scrape Frequency</span>
                <span className="font-mono text-slate-900 font-bold">Every {pollingMinutes} mins</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                step="1"
                value={pollingMinutes}
                onChange={(e) => setPollingMinutes(parseInt(e.target.value, 10))}
                className="w-full cursor-pointer"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Anti-Bot Proxy Rotation Tier
              </label>
              <select
                value={proxyTier}
                onChange={(e) => setProxyTier(e.target.value as any)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              >
                <option value="none">Direct Fetch + Rotating User-Agents (Free $0)</option>
                <option value="datacenter">Shared Datacenter Proxies (Budget ~$2-$3/mo)</option>
                <option value="residential">Rotating Residential IP Pool (Pro ~$8-$18/mo)</option>
              </select>
            </div>

            {/* Monthly Calculations Breakdown */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Monthly Scrapes:</span>
                <span className="font-mono font-semibold text-slate-800">{totalScrapesPerMonth.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Bandwidth:</span>
                <span className="font-mono font-semibold text-slate-800">{totalBandwidthGB.toFixed(2)} GB</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-slate-900">Estimated Monthly Cost:</span>
                <span className="text-lg font-bold font-mono text-emerald-700">
                  ${totalMonthlyCost.toFixed(2)}/mo
                </span>
              </div>
              {totalMonthlyCost === 0 && (
                <div className="text-[11px] text-emerald-700 font-medium text-center bg-emerald-50 py-1 rounded border border-emerald-200">
                  100% Eligible for Free Tier ($0.00 Forever)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cloud Provider Comparison Matrix */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4 lg:col-span-2">
          <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
            Cloud Provider Free Tier & Cost Comparison
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Oracle Cloud */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Oracle Cloud (OCI)</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                    Rank #1 Free
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Always Free Tier</p>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  <li>• <strong>4 OCPU ARM Ampere</strong> (24GB RAM) free forever</li>
                  <li>• <strong>200 GB Storage</strong> included</li>
                  <li>• <strong>10 TB/month</strong> outbound bandwidth free</li>
                  <li>• Static public IPv4 address free</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-medium text-slate-800">
                Best for: Uninterrupted 24/7 memory resident daemon.
              </div>
            </div>

            {/* Google Cloud Platform */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Google Cloud (GCP)</span>
                  <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded">
                    Serverless
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Cloud Run + Scheduler</p>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  <li>• <strong>2 Million requests</strong>/mo free</li>
                  <li>• <strong>360,000 vCPU-sec</strong>/mo free</li>
                  <li>• <strong>3 Cloud Scheduler</strong> cron jobs free</li>
                  <li>• Scale-to-zero ($0 when idle)</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-medium text-slate-800">
                Best for: Periodic 15m cron checks with zero maintenance.
              </div>
            </div>

            {/* Firebase */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900">Firebase</span>
                  <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded">
                    Full-Stack
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">Blaze Free Tier</p>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  <li>• <strong>Firebase Hosting</strong> (10GB storage free)</li>
                  <li>• <strong>Firestore</strong> (50k reads, 20k writes/day free)</li>
                  <li>• <strong>2M Cloud Functions</strong>/mo free</li>
                  <li>• Outbound networking to retailers enabled</li>
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200 text-[11px] font-medium text-slate-800">
                Best for: Multi-user sync, realtime watchlists & Web UI.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deployment Recipes & Copyable Commands */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
              24/7 Setup Recipes & Deployment Scripts
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setActiveRecipe('oracle')}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeRecipe === 'oracle' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Oracle (OCI Free)
            </button>
            <button
              onClick={() => setActiveRecipe('gcp')}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeRecipe === 'gcp' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              GCP Cloud Run
            </button>
            <button
              onClick={() => setActiveRecipe('docker')}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeRecipe === 'docker' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dockerfile
            </button>
            <button
              onClick={() => setActiveRecipe('firebase')}
              className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeRecipe === 'firebase' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Firebase Guide
            </button>
          </div>
        </div>

        {/* Script Viewer */}
        <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 font-mono text-xs text-slate-200">
          <div className="px-4 py-2 border-b border-slate-800 bg-slate-900 flex items-center justify-between text-[11px] text-slate-400">
            <span>{recipes[activeRecipe].filename}</span>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Script'}</span>
            </button>
          </div>

          <pre className="p-4 overflow-x-auto max-h-72 leading-relaxed">
            {recipes[activeRecipe].content}
          </pre>
        </div>
      </div>
    </div>
  );
};
