# Multi-stage Dockerfile for 24/7 OmniPrice Mechanism Studio
# Supports x86_64 and ARM64 (Oracle Ampere A1 & Google Cloud Run)

FROM node:20-bookworm-slim AS base

# Install Python 3, g++ compiler, and essential build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    g++ \
    make \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package descriptors and install Node dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and backend mechanisms
COPY . .

# Compile C++ High-Performance Analytical Engine with -O3 SIMD optimization
RUN g++ -O3 -fPIC -Wall -std=c++17 -shared -o backend/mechanisms/cpp_engine/libprice_analytics.so backend/mechanisms/cpp_engine/price_analytics.cpp \
    && g++ -O3 -Wall -std=c++17 -DCOMPILE_STANDALONE_CLI -o backend/mechanisms/cpp_engine/price_analytics_bin backend/mechanisms/cpp_engine/price_analytics.cpp

# Build frontend production bundle with Vite
RUN npm run build

# Make CLI runner executable
RUN chmod +x backend/cli_runner.py

# Expose server port (default 3000, customizable via PORT env var for Cloud Run)
ENV PORT=3000
ENV NODE_ENV=production
EXPOSE 3000

# Healthcheck for 24/7 uptime monitoring
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:${PORT}/api/mechanisms || exit 1

# Start full-stack server
CMD ["node", "node_modules/.bin/tsx", "server.ts"]
