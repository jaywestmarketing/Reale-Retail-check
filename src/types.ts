export interface PriceCandidate {
  selector: string;
  xpath: string;
  raw_text: string;
  parsed_price: number;
  currency: string;
  confidence: number;
  strategy: string;
  attributes: Record<string, string>;
  rationale: string;
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
  inspection_timestamp: number;
}

export interface IngestionInfo {
  status_code: number;
  latency_ms: number;
  retailer_detected: string;
  canonical_url: string;
  headers: Record<string, string>;
  html_preview: string;
}

export interface AgentInspectResponse {
  success: boolean;
  error?: string;
  ingestion: IngestionInfo;
  agent_identification: AgentIdentificationResult;
}

export interface CppAnalytics {
  engine: string;
  current_price: number;
  previous_price: number;
  min_price: number;
  max_price: number;
  mean_price: number;
  median_price: number;
  std_dev: number;
  variance: number;
  z_score: number;
  sma: number;
  ema: number;
  bollinger_upper: number;
  bollinger_lower: number;
  bollinger_bandwidth: number;
  absolute_change: number;
  percent_change: number;
  max_drawdown_percent: number;
  is_all_time_low: boolean;
  is_significant_drop: boolean;
  is_anomaly: boolean;
  anomaly_confidence: number;
  execution_time_ns: number;
}

export interface AlertEvent {
  type: 'TARGET_REACHED' | 'PRICE_DROP' | 'ALL_TIME_LOW' | 'ANOMALY_WARNING';
  severity: 'high' | 'medium' | 'warning' | 'info';
  message: string;
  timestamp?: number;
  savings?: number;
  delta?: number;
  pct?: number;
  confidence?: number;
}

export type ScanMode = 'url' | 'url_list' | 'product' | 'platform_match';

export interface AdvancedScanOptions {
  sku?: string;
  productNameFilter?: string;
  minPrice?: number;
  maxPrice?: number;
  targetPrice?: number;
  dropThresholdPct?: number;
  customSelector?: string;
  crawlScope?: 'single_item' | 'entire_website';
  forceTrack?: boolean;
  proxy_url?: string;
}

export interface DiscoveredLink {
  url: string;
  title: string;
  link_type: 'category' | 'catalog' | 'product' | 'department';
  confidence: number;
  snippet?: string;
  thumbnail?: string;
  price_hint?: number | null;
}

export interface TraversalStep {
  step_num: number;
  url: string;
  page_type: string;
  action_taken: string;
  summary: string;
}

export interface AutonomousCrawlResult {
  success: boolean;
  start_url: string;
  initial_page_type: string;
  final_product_url: string;
  final_product_name: string;
  detected_price: number | null;
  currency: string;
  primary_selector: string;
  fallback_selector: string;
  confidence_score: number;
  strategy_used: string;
  availability: string;
  traversal_path: TraversalStep[];
  discovered_categories: DiscoveredLink[];
  discovered_products: DiscoveredLink[];
  error?: string;
  bot_shield_detected?: string;
  agent_reasoning: string;
  continuity_audit?: AdaptiveApproachAudit[];
  bypassed_403?: boolean;
  winning_continuity_strategy?: string;
}

export interface AdaptiveApproachAudit {
  attempt_number: number;
  strategy_id: string;
  strategy_name: string;
  classification: string;
  status_code: number;
  latency_ms: number;
  outcome: string;
  reasoning: string;
  details: string;
}

export interface ContinuityResolutionResult {
  resolved: boolean;
  winning_strategy?: string;
  final_status_code: number;
  original_status_code: number;
  total_attempts: number;
  total_latency_ms: number;
  audit_trail: AdaptiveApproachAudit[];
  final_ingestion_result?: any;
  explanation: string;
}


export interface PlatformMatchResult {
  query: string;
  sku?: string;
  platforms: {
    platform: string;
    productName: string;
    price: number;
    currency: string;
    url: string;
    inStock: boolean;
    confidence: number;
  }[];
  bestPrice: {
    platform: string;
    price: number;
    currency: string;
    url: string;
  };
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
  analytics?: CppAnalytics;
  alerts: AlertEvent[];
  agentReasoning: string;
  active: boolean;
}

export interface MechanismParameter {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'select';
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

export interface BenchmarkResult {
  iterations: number;
  cpp_available: boolean;
  cpp_time_ms: number;
  python_projected_ms: number;
  cpp_speedup_factor: string;
  throughput_ops_per_sec: number;
}
