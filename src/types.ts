export interface PriceCandidate {
  selector: string;
  xpath: string;
  raw_text: string;
  parsed_price: number;
  currency: string;
  confidence: number;
  strategy: string;
  attributes?: Record<string, string>;
  rationale?: string;
}

export interface AgentIdentificationResult {
  detected_price: number | null;
  currency: string;
  primary_selector: string;
  fallback_selector: string;
  strategy_used: string;
  confidence_score: number;
  candidates: PriceCandidate[];
  title: string;
  availability: string;
  structured_data_found: boolean;
  agent_reasoning: string;
  inspection_timestamp?: number;
}

export interface IngestionInfo {
  status_code: number;
  latency_ms: number;
  timestamp: number;
  canonical_url: string;
  retailer_detected: string;
  error?: string | null;
}

export interface AgentInspectResponse {
  success: boolean;
  error?: string;
  ingestion: IngestionInfo;
  agent_identification: AgentIdentificationResult;
  crawl_result?: any;
  bypassed_403?: boolean;
  winning_continuity_strategy?: string;
}

export interface TrackedProduct {
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
  analytics?: {
    sma: number;
    ema: number;
    bollinger_upper: number;
    bollinger_lower: number;
    std_dev: number;
    z_score: number;
    is_significant_drop: boolean;
    is_anomaly: boolean;
  };
  alerts: any[];
  agentReasoning: string;
  active: boolean;
}

export interface MechanismParameter {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'string' | 'select';
  options?: string[];
  default: any;
  current: any;
}

export interface MechanismItem {
  id: string;
  name: string;
  type: string;
  unit: string;
  status: string;
  description: string;
  interchangeable_for: string;
  input_contract: string;
  output_contract: string;
  parameters: MechanismParameter[];
  metrics: Record<string, any>;
}

export interface ActionLedgerEntry {
  id: string;
  timestamp: number;
  iso_time: string;
  action_type: string;
  step_name: string;
  url: string;
  http_status: number;
  duration_ms: number;
  screenshot_preview: string;
  selector_targeted: string;
  extracted_summary: string;
  status: 'SUCCESS' | 'BYPASS_ENGAGED' | 'WARNED' | 'ERROR';
  agent_reasoning: string;
  cooldown_applied_seconds: number;
}

export interface PlatformCooldownConfig {
  platform_id: string;
  name: string;
  min_delay_sec: number;
  max_delay_sec: number;
  jitter_pct: number;
  backoff_multiplier: number;
  agent_capability_tier: string;
  anti_bot_profile: string;
  recommended_duration_hours?: number;
}

export interface ScannedCategoryItem {
  id: string;
  name: string;
  url: string; // product URL on retailer platform
  product_url?: string;
  category_url?: string; // category URL on retailer platform
  category_name?: string;
  retailer: string;
  category_path: string;
  price: number;
  original_price?: number;
  currency: string;
  discount_pct: number;
  availability: string;
  rating: number;
  reviews_count: number;
  sku: string;
  discovered_at: number;
  screenshot_ref?: string;
  url_verified?: boolean;
  url_check_status?: string;
  double_check_status?: string;
  double_checked_at?: number;
  store_resolver_url?: string;
  google_search_url?: string;
  double_check_latency_ms?: number;
  is_dead_link_prevented?: boolean;
}

export interface ProductDoubleCheckResult {
  product_url: string;
  store_resolver_url: string;
  sku: string;
  retailer: string;
  status: string;
  is_active: boolean;
  latency_ms: number;
  check_timestamp: string;
  verified_reason: string;
}

export interface AutomatedUrlCheckResult {
  url: string;
  is_valid: boolean;
  status: 'VERIFIED' | 'WARNING' | 'INVALID';
  http_status: number;
  retailer_key: string;
  retailer_name: string;
  url_type: 'CATEGORY' | 'DEPARTMENT' | 'PRODUCT' | 'SEARCH' | 'STORE_ROOT';
  detected_category: string;
  category_path: string[];
  canonical_url: string;
  anti_bot_gateway: string;
  bypass_protocol: string;
  requires_vpn: boolean;
  reachability_ms: number;
  has_product_catalog: boolean;
  estimated_catalog_depth: number;
  recommended_cooldown: {
    min_delay: number;
    max_delay: number;
    jitter_pct: number;
    tier: string;
  };
  check_timestamp: string;
  details: string;
}

export interface CategoryScanCheckpoint {
  scan_id: string;
  retailer: string;
  root_category_url: string;
  root_category_name: string;
  status: 'RUNNING' | 'PAUSED' | 'CHECKPOINTED' | 'INTERRUPTED' | 'COMPLETED';
  started_at: number;
  last_checkpoint_at: number;
  elapsed_seconds: number;
  planned_duration_seconds: number;
  cooldown_config: PlatformCooldownConfig;
  current_depth: number;
  max_depth: number;
  pending_queue: any[];
  completed_queue: any[];
  items_collected: ScannedCategoryItem[];
  action_ledger: ActionLedgerEntry[];
  total_actions_logged: number;
  stats: {
    categories_completed: number;
    categories_remaining: number;
    total_items_cataloged: number;
    avg_discount_pct: number;
    price_min: number;
    price_max: number;
    bypassed_403_count: number;
    cooldown_time_elapsed_sec: number;
  };
}

export interface GitHubPushRequest {
  token?: string;
  repo: string;
  branch?: string;
  commitMessage?: string;
  includeScans?: boolean;
}

export interface GitHubPushResponse {
  success: boolean;
  mode: 'DIRECT_GITHUB_API_PUSH' | 'STAGED_READY_FOR_PUSH';
  repository: string;
  branch: string;
  files_pushed_count?: number;
  files_prepared_count?: number;
  files_list?: string[];
  message: string;
  git_commands?: string[];
}

export interface AdvancedScanOptions {
  targetPrice?: string;
  dropThresholdPct?: string;
  sku?: string;
  customSelector?: string;
  productNameFilter?: string;
  forceTrack?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface BenchmarkMetric {
  strategy: string;
  dns_lookup_ms: number;
  tcp_connect_ms: number;
  tls_handshake_ms: number;
  ttfb_ms: number;
  total_latency_ms: number;
  http_code: number;
  status: 'SUCCESS' | 'BLOCKED_403' | 'CHALLENGE_BYPASS';
  anti_bot_status: string;
  bandwidth_kb: number;
  memory_overhead_mb: number;
}

export interface BenchmarkReport {
  target_url: string;
  retailer: string;
  timestamp: string;
  overall_grade: string;
  overall_score: number;
  speed_improvement_pct: number;
  metrics: BenchmarkMetric[];
  recommendation: string;
}
