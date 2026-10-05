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
        d = asdict(self)
        # Omit massive raw html in summary if needed or truncate
        return d

@dataclass
class PriceCandidate:
    selector: str
    xpath: str
    raw_text: str
    parsed_price: float
    currency: str
    confidence: float  # 0.0 to 1.0
    strategy: str      # e.g. "json_ld", "microdata", "semantic_class", "regex_heuristic", "visual_prominence"
    attributes: Dict[str, str] = field(default_factory=dict)
    rationale: str = ""

@dataclass
class AgentIdentificationResult:
    detected_price: Optional[float]
    currency: str
    primary_selector: str
    fallback_selector: str
    strategy_used: str
    confidence_score: float # 0.0 to 1.0
    candidates: List[PriceCandidate]
    title: str
    availability: str # "In Stock", "Out of Stock", "Pre-Order", "Unknown"
    structured_data_found: bool
    agent_reasoning: str
    inspection_timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

class IngestionMechanismContract(ABC):
    @abstractmethod
    def fetch(self, url: str, options: Optional[Dict[str, Any]] = None) -> IngestionResult:
        """Fetch raw HTML and metadata from retailer website."""
        pass

class DOMAgentMechanismContract(ABC):
    @abstractmethod
    def identify_price_element(self, html: str, url: str, options: Optional[Dict[str, Any]] = None) -> AgentIdentificationResult:
        """Inspect HTML/DOM on first visit to discover the product price element and selector."""
        pass

class CalculationMechanismContract(ABC):
    @abstractmethod
    def calculate(self, prices: List[float], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Perform high-performance price fluctuation and volatility calculations."""
        pass

class SchedulerMechanismContract(ABC):
    @abstractmethod
    def evaluate_fluctuation(self, product_id: str, new_price: float, history: List[float], target_price: Optional[float], drop_pct_threshold: float) -> Dict[str, Any]:
        """Evaluate price movement against alert rules and determine notification triggers."""
        pass

class ConnectivityAdapterContract(ABC):
    """
    Standardized contract for connectivity adapters (Layer B: Mechanism Contract).
    Permits hot-swapping between direct HTTP, curl HTTP/2, session warmup, mobile,
    clean Safari, and proxy transports without breaking host continuity.
    """
    @abstractmethod
    def describeCapabilities(self) -> Dict[str, Any]:
        """Describes supported protocols, TLS capabilities, proxy support, and platform profiles."""
        pass

    @abstractmethod
    def validate(self, configuration: Dict[str, Any]) -> bool:
        """Validates configuration parameters prior to establishing connection."""
        pass

    @abstractmethod
    def establish(self, requirement: Any, executionContext: Dict[str, Any]) -> Any:
        """Establishes active connectivity context under the specified requirements."""
        pass

    @abstractmethod
    def maintain(self, connectivityContext: Any) -> bool:
        """Maintains health, keeps session active, and verifies socket readiness."""
        pass

    @abstractmethod
    def suspend(self, connectivityContext: Any) -> bool:
        """Temporarily suspends transmission without tearing down underlying state."""
        pass

    @abstractmethod
    def resume(self, connectivityContext: Any) -> bool:
        """Resumes active transmission for suspended context."""
        pass

    @abstractmethod
    def transition(self, connectivityContext: Any, requirement: Any) -> Any:
        """Executes a checkpointed transition to a new connectivity requirement."""
        pass

    @abstractmethod
    def terminate(self, connectivityContext: Any) -> bool:
        """Gracefully terminates socket and cleans up resources."""
        pass

    @abstractmethod
    def getState(self, connectivityContext: Any) -> Dict[str, Any]:
        """Returns current operational telemetry and health metrics."""
        pass

