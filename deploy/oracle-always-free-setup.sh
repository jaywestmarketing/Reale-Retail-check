#!/usr/bin/env bash
# ==============================================================================
# Oracle Cloud Infrastructure (OCI) Always Free Tier 24/7 Setup
# Specs: 4 OCPUs (ARM Ampere A1), 24 GB RAM, 200 GB Storage - 100% Free Forever
# ==============================================================================

set -e

echo "=== Oracle Cloud Always Free 24/7 Host Setup ==="

# 1. Update OS and install runtime tools
sudo apt-get update
sudo apt-get install -y \
    python3 \
    python3-pip \
    g++ \
    make \
    curl \
    git \
    nodejs \
    npm \
    ufw

# 2. Open HTTP and HTTPS ports in firewall
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT
sudo netfilter-persistent save || true

# 3. Clone / setup application
APP_DIR="/opt/omniprice"
sudo mkdir -p "${APP_DIR}"
sudo chown -R $USER:$USER "${APP_DIR}"

# (Assuming repository is cloned into ${APP_DIR})
cd "${APP_DIR}"
npm install

# 4. Compile C++ Engine with ARM Neon / -O3 SIMD optimization
g++ -O3 -fPIC -Wall -std=c++17 -shared -o backend/mechanisms/cpp_engine/libprice_analytics.so backend/mechanisms/cpp_engine/price_analytics.cpp
g++ -O3 -Wall -std=c++17 -DCOMPILE_STANDALONE_CLI -o backend/mechanisms/cpp_engine/price_analytics_bin backend/mechanisms/cpp_engine/price_analytics.cpp

# 5. Build Vite frontend bundle
npm run build

# 6. Configure systemd service for 24/7 unattended operation
sudo tee /etc/systemd/system/omniprice.service > /dev/null <<EOF
[Unit]
Description=OmniPrice Mechanism Studio 24/7 Daemon
After=network.target

[Service]
Type=simple
User=${USER}
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/npx tsx server.ts
Restart=always
RestartSec=5
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# 7. Enable and start systemd daemon
sudo systemctl daemon-reload
sudo systemctl enable omniprice
sudo systemctl restart omniprice

echo "OmniPrice is now running 24/7 on Oracle Cloud Always Free instance!"
echo "Check status: sudo systemctl status omniprice"
