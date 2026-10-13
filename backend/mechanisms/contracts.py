from abc import ABC, abstractmethod
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional
import time

@dataclass
class IngestionResult:
    status_code: int
    html: str
    headers: Dict[str, str]
    latency_ms: float
    timestamp: float
    canonical_url: str
    retailer_detected: str
    error: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class PriceCandidate:
    selector: str
    xpath: str
    raw_text: str
    parsed_price: float
    currency: str
    confidence: float
    strategy: str
    attributes: Dict[str, str] = field(default_factory=dict)
    rationale: str = ""

@dataclass
class AgentIdentificationResult:
    detected_price: Optional[float]
    currency: str
    primary_selector: str
    fallback_selector: str
    strategy_used: str
    confidence_score: float
    candidates: List[PriceCandidate]
    title: str
    availability: str
    structured_data_found: bool
    agent_reasoning: str
    inspection_timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class IngestionMechanismContract(ABC):
    @abstractmethod
    def fetch(self, url: str, options: Optional[Dict[str, Any]] = None) -> IngestionResult:
        pass

class DOMAgentMechanismContract(ABC):
    @abstractmethod
    def identify_price_element(self, html: str, url: str, options: Optional[Dict[str, Any]] = None) -> AgentIdentificationResult:
        pass

class CalculationMechanismContract(ABC):
    @abstractmethod
    def calculate(self, prices: List[float], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        pass

class ConnectivityAdapterContract(ABC):
    @abstractmethod
    def describeCapabilities(self) -> Dict[str, Any]:
        pass

    @abstractmethod
    def validate(self, configuration: Dict[str, Any]) -> bool:
        pass

    @abstractmethod
    def establish(self, requirement: Any, executionContext: Dict[str, Any]) -> Any:
        pass

    @abstractmethod
    def maintain(self, connectivityContext: Any) -> bool:
        pass

    @abstractmethod
    def suspend(self, connectivityContext: Any) -> bool:
        pass

    @abstractmethod
    def resume(self, connectivityContext: Any) -> bool:
        pass

    @abstractmethod
    def transition(self, connectivityContext: Any, requirement: Any) -> Any:
        pass

    @abstractmethod
    def terminate(self, connectivityContext: Any) -> bool:
        pass

    @abstractmethod
    def getState(self, connectivityContext: Any) -> Dict[str, Any]:
        pass

@dataclass
class ActionLedgerEntry:
    id: str
    timestamp: float
    iso_time: str
    action_type: str
    step_name: str
    url: str
    http_status: int
    duration_ms: float
    screenshot_preview: str
    selector_targeted: str
    extracted_summary: str
    status: str
    agent_reasoning: str
    cooldown_applied_seconds: float = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class PlatformCooldownConfig:
    platform_id: str
    name: str
    min_delay_sec: float
    max_delay_sec: float
    jitter_pct: float
    backoff_multiplier: float
    agent_capability_tier: str
    anti_bot_profile: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class ScannedCategoryItem:
    id: str
    name: str
    url: str
    retailer: str
    category_path: str
    price: float
    original_price: Optional[float]
    currency: str
    discount_pct: float
    availability: str
    rating: float
    reviews_count: int
    sku: str
    discovered_at: float
    screenshot_ref: str
    product_url: str = ""
    category_url: str = ""
    category_name: str = ""
    url_verified: bool = True
    url_check_status: str = "200 OK - Direct Egress Reachable"
    double_check_status: str = "DOUBLE_CHECKED_ACTIVE"
    double_checked_at: float = 0.0
    store_resolver_url: str = ""
    double_check_latency_ms: float = 85.0
    is_dead_link_prevented: bool = True

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        if not d.get("product_url"):
            d["product_url"] = d.get("url", "")
        if not d.get("store_resolver_url"):
            d["store_resolver_url"] = d.get("product_url", "")
        return d

@dataclass
class ProductDoubleCheckResult:
    product_url: str
    store_resolver_url: str
    sku: str
    retailer: str
    status: str
    is_active: bool
    latency_ms: float
    check_timestamp: str
    verified_reason: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class AutomatedUrlCheckResult:
    url: str
    is_valid: bool
    status: str
    http_status: int
    retailer_key: str
    retailer_name: str
    url_type: str
    detected_category: str
    category_path: List[str]
    canonical_url: str
    anti_bot_gateway: str
    bypass_protocol: str
    requires_vpn: bool
    reachability_ms: float
    has_product_catalog: bool
    estimated_catalog_depth: int
    recommended_cooldown: Dict[str, Any]
    check_timestamp: str
    details: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class CategoryScanCheckpoint:
    scan_id: str
    retailer: str
    root_category_url: str
    root_category_name: str
    status: str
    started_at: float
    last_checkpoint_at: float
    elapsed_seconds: float
    planned_duration_seconds: float
    cooldown_config: Dict[str, Any]
    current_depth: int
    max_depth: int
    pending_queue: List[Dict[str, Any]]
    completed_queue: List[Dict[str, Any]]
    items_collected: List[Dict[str, Any]]
    action_ledger: List[Dict[str, Any]]
    total_actions_logged: int
    stats: Dict[str, Any]

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

# =====================================================================
# COGNITIVE PLATFORM LEARNING ENGINE CONTRACTS
# Mechanism ID: COGNITIVE_PLATFORM_LEARNING_ENGINE
# =====================================================================

@dataclass
class DocEndpointDef:
    path: str
    method: str
    description: str
    params: List[str]
    rate_limit: str
    auth_required: bool
    is_public: bool

@dataclass
class PlatformDocModel:
    platform_id: str
    name: str
    docs_url: str
    developer_portal: str
    robots_rules: Dict[str, Any]
    endpoints: List[Dict[str, Any]]
    rate_limits: str
    declared_headers: List[str]
    pagination_conventions: str
    sku_format: str
    discovered_at: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class InteractiveElementDef:
    element_id: str
    role: str
    label: str
    selector: str
    event_listeners: List[str]
    required_preceding_action: str
    triggers_telemetry: bool
    coordinates: Dict[str, int]

@dataclass
class TelemetryBeaconDef:
    name: str
    endpoint_pattern: str
    vendor: str
    trigger_event: str
    payload_requirements: str
    impact_if_missing: str

@dataclass
class BotTrapDef:
    trap_id: str
    trap_type: str
    selector: str
    description: str
    avoidance_rule: str

@dataclass
class EngagementSurfaceModel:
    platform_id: str
    page_type: str
    url: str
    screenshot_preview: str
    interactive_elements: List[Dict[str, Any]]
    telemetry_beacons: List[Dict[str, Any]]
    bot_traps: List[Dict[str, Any]]
    hydration_framework: str
    dwell_expectation_seconds: float
    scanned_at: float

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class DiscrepancyItem:
    category: str
    title: str
    doc_claim: str
    real_page_reality: str
    severity: str
    mitigation_strategy: str

@dataclass
class ComparativeAnalysisReport:
    platform_id: str
    platform_name: str
    analyzed_at: float
    humanity_feasibility_score: int
    anti_bot_barrier_tier: str
    discrepancies: List[Dict[str, Any]]
    undocumented_internal_apis: List[str]
    required_telemetry_beacons: List[str]
    human_interaction_prerequisites: List[str]
    recommendation_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class HumanBehaviorStep:
    step_number: int
    phase: str
    action_type: str
    target_element: str
    target_label: str
    dwell_pause_ms: int
    mouse_trajectory: Dict[str, Any]
    typing_cadence_ms: Optional[int]
    simulated_scroll_px: Optional[int]
    simulated_typo_correction: bool
    telemetry_emitted: str
    human_rationale: str
    status: str = "PENDING"

@dataclass
class HumanMimeticPlan:
    plan_id: str
    platform_id: str
    platform_name: str
    persona: str
    description: str
    created_at: float
    estimated_duration_sec: float
    mouse_curvature_factor: float
    poisson_dwell_mean_sec: float
    kinetic_scroll_steps: int
    steps: List[Dict[str, Any]]
    audit_summary: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class CognitiveLearningEngineContract(ABC):
    @abstractmethod
    def discover_platform_docs(self, platform_id_or_url: str) -> PlatformDocModel:
        pass

    @abstractmethod
    def scan_user_pages(self, platform_id_or_url: str, page_types: Optional[List[str]] = None) -> List[EngagementSurfaceModel]:
        pass

    @abstractmethod
    def compare_analyses(self, doc_model: PlatformDocModel, surfaces: List[EngagementSurfaceModel]) -> ComparativeAnalysisReport:
        pass

    @abstractmethod
    def synthesize_human_mimetic_plan(self, report: ComparativeAnalysisReport, persona: str) -> HumanMimeticPlan:
        pass

    @abstractmethod
    def simulate_execution_step(self, plan_id: str, step_index: int) -> Dict[str, Any]:
        pass

