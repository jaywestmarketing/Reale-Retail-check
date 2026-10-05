#!/usr/bin/env bash
# ==============================================================================
# Google Cloud Platform (GCP) 24/7 Deployment Recipe
# Fits within GCP Always Free Tier (Cloud Run: 2M reqs/mo, 360k vCPU-sec/mo)
# ==============================================================================

set -e

PROJECT_ID=$(gcloud config get-value project)
REGION="us-central1"
SERVICE_NAME="omniprice-studio"

echo "Deploying OmniPrice Mechanism Studio to Google Cloud Platform..."
echo "Project: $PROJECT_ID | Region: $REGION"

# 1. Enable required GCP services
gcloud services enable run.googleapis.com \
                       cloudbuild.googleapis.com \
                       cloudscheduler.googleapis.com

# 2. Build container image via Google Cloud Build
gcloud builds submit --tag "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" -f deploy/Dockerfile .

# 3. Deploy to Cloud Run (Scale-to-zero for $0.00/mo Freemium Mode)
gcloud run deploy "${SERVICE_NAME}" \
    --image "gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest" \
    --platform managed \
    --region "${REGION}" \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 2 \
    --port 3000

# 4. Retrieve Service URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --platform managed --region "${REGION}" --format 'value(status.url)')
echo "Service live at: ${SERVICE_URL}"

# 5. Set up Cloud Scheduler for 24/7 autonomous monitoring (every 15 minutes)
# Fits well within the 3 free Cloud Scheduler jobs and Cloud Run free compute limits
gcloud scheduler jobs create http "${SERVICE_NAME}-cron-15m" \
    --schedule "*/15 * * * *" \
    --uri "${SERVICE_URL}/api/products" \
    --http-method GET \
    --location "${REGION}" \
    --description "Automated 24/7 price scraper ping for OmniPrice" || true

echo "24/7 GCP Free-Tier Deployment Complete!"
