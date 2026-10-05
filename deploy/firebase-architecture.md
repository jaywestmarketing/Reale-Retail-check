# Firebase 24/7 Architecture & Freemium Integration Plan

## 1. Free Tier Quotas & Suitability
- **Firebase Spark Plan (Free)**:
  - **Hosting**: 10 GB storage, 360 MB/day transfer (100% adequate for the React frontend).
  - **Firestore**: 1 GiB data, 50,000 document reads/day, 20,000 document writes/day.
  - *Key Constraint*: Outbound networking to external domains (Amazon, Walmart, Best Buy) is blocked on Spark plan.
- **Firebase Blaze Plan (Pay-as-you-go with Same Free Tier)**:
  - Unblocks outbound HTTP/HTTPS requests to external retailers.
  - Retains the exact same free quotas (2M Cloud Function invocations/month, 50k Firestore reads/day free).
  - *Total Cost with OmniPrice default polling*: **$0.00/month**.

## 2. Decoupled Mechanism Architecture
```
[React SPA Frontend] (Firebase Hosting - $0)
        │
        ├── Auth & Storage ──> [Cloud Firestore] (Watches, Alerts, History - $0)
        │
        └── Scheduled Cron ──> [Cloud Function v2 / Cloud Run] (Blaze Free Tier - $0)
                                    │
                                    ├── Mechanism 1: Python Scraper
                                    ├── Mechanism 2: DOM Agent Heuristics
                                    └── Mechanism 3: C++ Analytics Engine (-O3)
```

## 3. Cost-Optimization Rules
1. **Batch Writes**: Write price updates as sub-collections or array appends to minimize Firestore write ops.
2. **Read Caching**: The frontend maintains local state and only listens to active changes.
3. **Execution Limits**: Cloud Function timeout set to 60s with 512MB RAM fits 100% inside the 400,000 GB-sec monthly free compute bucket.
