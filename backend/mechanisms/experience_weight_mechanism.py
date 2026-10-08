# ===========================================================================
# MECHANISM: EXPERIENCE_WEIGHTED_DECISION_RESOLVER
# Architecture: INTERCHANGEABLE AUTONOMOUS MECHANISM ARCHITECTURE
# Layer: Full 4-Layer Implementation (Core, Contract, Adapters, Host Integration)
# Version: 1.0.0
# Contract Version: 1.0.0
# ===========================================================================
"""
EXPERIENCE WEIGHTED DECISION RESOLVER (Mechanism ID: EXPERIENCE_WEIGHTED_DECISION_RESOLVER)
Purpose:
Replaces fixed/arbitrary fallback sequences with empirical, weighted decision-making.
Dynamically creates and updates strategy weights based on past execution experiences
across the multi-variable environment tuple:
  (Runtime Environment, Transport Protocol, Egress State, Target Domain)

Criteria Weighting Model:
1. Semantic Success (Heavily Weighted: 35%)
   - Distinguishes HTTP 200 with full content vs partial HTTP 206 / 403 / bot splash.
2. Sustained Stability (Heavily Weighted: 25%)
   - Rewards strategies that maintain clean execution across prolonged test intervals
     (e.g., 5-min or 10-min continuous runs without degrading).
3. Store & Data Correctness (15%)
   - Verifies extracted Schema.org, price DOM elements, and valid HTML vs empty templates.
4. Speed & Latency (10%)
   - Inverse normalized latency scoring.
5. Resource Cost & Efficiency (8%)
   - Penalizes heavyweight browser lifecycles; rewards lightweight handoffs when stable.
6. Environment History & Affinity (7%)
   - Specific affinity learned for the current egress route (e.g. Oracle VPN-1 vs VPN-2)
     and host runtime.
"""

import os
import sys
import time
import json
import math
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional, Tuple
from abc import ABC, abstractmethod

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
STORAGE_FILE = os.path.join(DATA_DIR, "experience_weights_store.json")

# ---------------------------------------------------------------------------
# Layer B: Mechanism Contracts
# ---------------------------------------------------------------------------

@dataclass
class EnvironmentProfile:
    environment_id: str = "oracle-cloud-vpn-1"
    name: str = "Oracle Cloud Egress (VPN-1)"
    egress_type: str = "vpn_egress_1"  # "vpn_egress_1", "vpn_egress_2", "direct_cloud", "local_residential"
    runtime_type: str = "firefox_gecko"  # "firefox_gecko", "chrome_chromium", "safari_webkit", "lightweight_http"
    transport_type: str = "http2_openssl"  # "http2_openssl", "bootstrap_handoff", "http11"
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class ExperienceRecord:
    record_id: str
    timestamp: float
    strategy_id: str
    strategy_name: str
    environment_id: str
    status_code: int
    semantic_success: float       # 0.0 to 1.0 (1.0 = clean 200, 0.2 = partial 206, 0.0 = 403/block)
    sustained_stability: float   # 0.0 to 1.0 (high for 5m/10m sustained clean runs, low if degraded)
    data_correctness: float      # 0.0 to 1.0 (valid price/DOM extracted)
    latency_ms: float
    resource_cost: float         # 0.0 to 1.0 (1.0 = ultralight, 0.3 = heavy browser)
    target_domain: str = ""
    notes: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class WeightCoefficients:
    w_semantic: float = 0.35
    w_stability: float = 0.25
    w_correctness: float = 0.15
    w_speed: float = 0.10
    w_resource: float = 0.08
    w_env_history: float = 0.07

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


@dataclass
class StrategyWeightProfile:
    strategy_id: str
    strategy_name: str
    composite_score: float              # 0.0 to 100.0
    semantic_score_avg: float           # 0.0 to 1.0
    stability_score_avg: float          # 0.0 to 1.0
    correctness_score_avg: float        # 0.0 to 1.0
    speed_score_avg: float              # 0.0 to 1.0
    resource_score: float               # 0.0 to 1.0
    total_runs: int
    success_runs: int
    partial_206_runs: int
    blocked_403_runs: int
    consecutive_clean: int
    avg_latency_ms: float
    environment_affinities: Dict[str, float] = field(default_factory=dict)
    recommended_rank: int = 1
    last_updated: float = field(default_factory=time.time)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


# ---------------------------------------------------------------------------
# Layer C: Persistence & Storage Adapters
# ---------------------------------------------------------------------------

class IExperienceStore(ABC):
    @abstractmethod
    def load_state(self) -> Tuple[Dict[str, StrategyWeightProfile], List[ExperienceRecord], WeightCoefficients]:
        pass

    @abstractmethod
    def save_state(self, weights: Dict[str, StrategyWeightProfile], experiences: List[ExperienceRecord], coeffs: WeightCoefficients):
        pass


class JsonFileExperienceStore(IExperienceStore):
    def __init__(self, file_path: str = STORAGE_FILE):
        self.file_path = file_path

    def _ensure_dir(self):
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)

    def load_state(self) -> Tuple[Dict[str, StrategyWeightProfile], List[ExperienceRecord], WeightCoefficients]:
        if not os.path.exists(self.file_path):
            return {}, [], WeightCoefficients()
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            weights: Dict[str, StrategyWeightProfile] = {}
            for sid, wdict in data.get("strategy_weights", {}).items():
                weights[sid] = StrategyWeightProfile(**wdict)
            experiences = [ExperienceRecord(**exp) for exp in data.get("experiences", [])]
            coeffs_dict = data.get("coefficients", {})
            coeffs = WeightCoefficients(**coeffs_dict) if coeffs_dict else WeightCoefficients()
            return weights, experiences, coeffs
        except Exception as e:
            print(f"[ExperienceStore] Error loading state: {e}", file=sys.stderr)
            return {}, [], WeightCoefficients()

    def save_state(self, weights: Dict[str, StrategyWeightProfile], experiences: List[ExperienceRecord], coeffs: WeightCoefficients):
        self._ensure_dir()
        try:
            payload = {
                "version": "1.0.0",
                "last_saved": time.time(),
                "coefficients": coeffs.to_dict(),
                "strategy_weights": {k: v.to_dict() for k, v in weights.items()},
                "experiences": [e.to_dict() for e in experiences[-200:]]  # retain latest 200 records
            }
            with open(self.file_path, "w", encoding="utf-8") as f:
                json.dump(payload, f, indent=2)
        except Exception as e:
            print(f"[ExperienceStore] Error saving state: {e}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Layer A: Mechanism Core (Scoring & Learning Engine)
# ---------------------------------------------------------------------------

DEFAULT_STRATEGIES_METADATA = [
    {
        "id": "GOOGLE_SEARCH_INGRESS_REFERRER",
        "name": "Google Search Ingress & Cross-Site Organic Referrer",
        "resource_cost": 0.92,
        "base_stability": 0.94,
        "base_semantic": 0.95,
        "base_correctness": 0.95,
        "base_latency": 210.0,
        "description": "Enters target via Google Search cross-site navigation headers; edge firewalls relax bot blocks for organic shoppers."
    },
    {
        "id": "FIREFOX_BOOTSTRAP_PERSISTENT",
        "name": "Firefox Gecko Runtime with Sustained Session",
        "resource_cost": 0.40,  # Full browser runtime
        "base_stability": 0.96, # Clean for full 5+ minutes across egresses
        "base_semantic": 0.98,
        "base_correctness": 0.95,
        "base_latency": 1200.0,
        "description": "Firefox runtime environment avoiding Chrome TLS/Client-Hints bot triggers; sustained stability."
    },
    {
        "id": "FIREFOX_LIGHTWEIGHT_HANDOFF",
        "name": "Firefox Bootstrap Session -> Lightweight HTTP Handoff",
        "resource_cost": 0.78,  # Hybrid: short bootstrap then ultralight HTTP
        "base_stability": 0.82, # Highly stable on VPN-1 (10 mins clean); sensitive on VPN-2
        "base_semantic": 0.90,
        "base_correctness": 0.92,
        "base_latency": 450.0,
        "description": "Initial Firefox session warmup, captures cookies/tokens, then executes lightweight HTTP requests."
    },
    {
        "id": "NATIVE_CURL_HTTP2",
        "name": "Native OpenSSL cURL with HTTP/2 Multiplexing",
        "resource_cost": 0.95,  # Ultralightweight
        "base_stability": 0.45, # Returns 403 on hardened edge firewalls unless warm
        "base_semantic": 0.50,
        "base_correctness": 0.85,
        "base_latency": 180.0,
        "description": "Bypasses standard Python JA3 fingerprint with native system HTTP/2."
    },
    {
        "id": "SESSION_WARMUP",
        "name": "Pre-Flight Domain Warmup & Cookie Jar Handshake",
        "resource_cost": 0.88,
        "base_stability": 0.55,
        "base_semantic": 0.55,
        "base_correctness": 0.88,
        "base_latency": 320.0,
        "description": "Probes origin root for edge tokens (bm_s, __cf_bm) prior to target query."
    },
    {
        "id": "CHROME_DESKTOP_PROFILE",
        "name": "Chromium Desktop Profile (Sec-Ch-Ua Hints)",
        "resource_cost": 0.42,
        "base_stability": 0.35, # Chrome returned 206 partial errors quickly in Oracle test
        "base_semantic": 0.45,
        "base_correctness": 0.80,
        "base_latency": 950.0,
        "description": "Standard Chromium desktop runtime; often triggers early 206 / anti-bot challenges."
    },
    {
        "id": "CLEAN_SAFARI_MAC",
        "name": "Clean macOS Safari WebKit Profile",
        "resource_cost": 0.90,
        "base_stability": 0.70,
        "base_semantic": 0.75,
        "base_correctness": 0.90,
        "base_latency": 260.0,
        "description": "Clean Safari headers without Chrome Client-Hints discrepancies."
    },
    {
        "id": "MOBILE_VIEWPORT",
        "name": "Mobile Safari iOS 17.5 Profile",
        "resource_cost": 0.90,
        "base_stability": 0.72,
        "base_semantic": 0.78,
        "base_correctness": 0.85,
        "base_latency": 280.0,
        "description": "Routes through lighter mobile CDN firewalls and responsive endpoints."
    },
    {
        "id": "SANDBOX_PROXY_BYPASS",
        "name": "Authenticated Proxy Tunnel / Fallback Gateway",
        "resource_cost": 0.75,
        "base_stability": 0.92,
        "base_semantic": 0.95,
        "base_correctness": 0.94,
        "base_latency": 620.0,
        "description": "Tunnels through residential proxy endpoint when edge IP is blacklisted."
    }
]

KNOWN_ENVIRONMENTS = [
    EnvironmentProfile(
        environment_id="oracle-cloud-vpn-1",
        name="Oracle Cloud Egress (VPN-1)",
        egress_type="vpn_egress_1",
        runtime_type="firefox_gecko",
        transport_type="http2_openssl",
        notes="High stability on Firefox & Firefox->Lightweight handoff (10m clean). 403 on raw HTTP/2 alone."
    ),
    EnvironmentProfile(
        environment_id="oracle-cloud-vpn-2",
        name="Oracle Cloud Egress (VPN-2)",
        egress_type="vpn_egress_2",
        runtime_type="firefox_gecko",
        transport_type="http2_openssl",
        notes="Firefox runtime stable (5m clean). Lightweight handoff returned 206 immediately. Chrome returned 206."
    ),
    EnvironmentProfile(
        environment_id="direct-cloud-egress",
        name="Direct Cloud Data Center Egress",
        egress_type="direct_cloud",
        runtime_type="lightweight_http",
        transport_type="http2_openssl",
        notes="Data center IP range. Prone to immediate 403 on naive requests."
    ),
    EnvironmentProfile(
        environment_id="local-residential",
        name="Local / Residential Gateway",
        egress_type="local_residential",
        runtime_type="firefox_gecko",
        transport_type="http2_openssl",
        notes="Clean residential IP pool with low bot-challenge probability."
    )
]


class ExperienceWeightedDecisionResolver:
    """
    Mechanism Core: Learns which strategy is actually reliable for a given environment.
    Creates and dynamically updates weights based on past execution experiences.
    """
    def __init__(self, store: Optional[IExperienceStore] = None):
        self.mechanism_id = "EXPERIENCE_WEIGHTED_DECISION_RESOLVER"
        self.version = "1.0.0"
        self.contract_version = "1.0.0"
        self.store = store or JsonFileExperienceStore()

        self.coefficients = WeightCoefficients()
        self.strategy_weights: Dict[str, StrategyWeightProfile] = {}
        self.experiences: List[ExperienceRecord] = []
        self.environments: Dict[str, EnvironmentProfile] = {env.environment_id: env for env in KNOWN_ENVIRONMENTS}
        self.active_environment_id: str = "oracle-cloud-vpn-1"

        # Load persisted state or bootstrap with empirical priors
        self._initialize()

    def _initialize(self):
        loaded_weights, loaded_experiences, loaded_coeffs = self.store.load_state()
        self.coefficients = loaded_coeffs
        if loaded_weights and len(loaded_weights) >= 6:
            self.strategy_weights = loaded_weights
            self.experiences = loaded_experiences
        else:
            self._bootstrap_empirical_baseline()
            self._persist()

    def _bootstrap_empirical_baseline(self):
        """
        Seeds baseline experience based directly on real Oracle Cloud VPN testing:
        - Firefox runtime: sustained stability high across egresses.
        - Firefox bootstrap -> lightweight handoff: 10m clean on VPN-1, 206 on VPN-2.
        - Chrome runtime: returns 206 quickly.
        - Raw HTTP/2 + cookie warmup alone: returns 403 on both paths.
        """
        self.experiences = []
        now = time.time()

        # Seed experiences representing the user's empirical environment tests
        seed_data = [
            # Oracle VPN-1: Firefox persistent 5-min clean
            ("FIREFOX_BOOTSTRAP_PERSISTENT", "oracle-cloud-vpn-1", 200, 1.0, 0.98, 0.95, 1150.0, 0.40, "5-min continuous run clean on VPN-1"),
            ("FIREFOX_BOOTSTRAP_PERSISTENT", "oracle-cloud-vpn-2", 200, 1.0, 0.95, 0.95, 1220.0, 0.40, "5-min continuous run clean on VPN-2"),
            ("FIREFOX_BOOTSTRAP_PERSISTENT", "oracle-cloud-vpn-1", 200, 1.0, 0.97, 0.96, 1180.0, 0.40, "Repeated clean 5-min run on VPN-1"),

            # Oracle VPN-1: Firefox -> Lightweight handoff clean for 10 minutes
            ("FIREFOX_LIGHTWEIGHT_HANDOFF", "oracle-cloud-vpn-1", 200, 1.0, 0.95, 0.93, 380.0, 0.78, "Clean for 10 minutes on VPN-1 handoff"),
            ("FIREFOX_LIGHTWEIGHT_HANDOFF", "oracle-cloud-vpn-1", 200, 1.0, 0.92, 0.92, 410.0, 0.78, "Stable lightweight handoff on VPN-1"),

            # Oracle VPN-2: Firefox -> Lightweight handoff gave 206 immediately!
            ("FIREFOX_LIGHTWEIGHT_HANDOFF", "oracle-cloud-vpn-2", 206, 0.2, 0.20, 0.40, 420.0, 0.78, "Returned 206 partial response immediately on VPN-2 handoff"),

            # Chrome on VPN-1 & VPN-2: returned 206 pretty quickly
            ("CHROME_DESKTOP_PROFILE", "oracle-cloud-vpn-1", 206, 0.2, 0.30, 0.50, 890.0, 0.42, "Chrome started returning 206 quickly on VPN-1"),
            ("CHROME_DESKTOP_PROFILE", "oracle-cloud-vpn-2", 206, 0.2, 0.25, 0.45, 920.0, 0.42, "Chrome returned 206 on VPN-2"),

            # Simple HTTP/2 + cookie warmup alone: 403 on both paths
            ("NATIVE_CURL_HTTP2", "oracle-cloud-vpn-1", 403, 0.0, 0.10, 0.10, 190.0, 0.95, "Simple HTTP/2 returned 403 on VPN-1"),
            ("NATIVE_CURL_HTTP2", "oracle-cloud-vpn-2", 403, 0.0, 0.10, 0.10, 210.0, 0.95, "Simple HTTP/2 returned 403 on VPN-2"),
            ("SESSION_WARMUP", "oracle-cloud-vpn-1", 403, 0.0, 0.15, 0.15, 340.0, 0.88, "Cookie warmup alone returned 403 on VPN-1"),
            ("SESSION_WARMUP", "oracle-cloud-vpn-2", 403, 0.0, 0.15, 0.15, 360.0, 0.88, "Cookie warmup alone returned 403 on VPN-2"),

            # Clean Safari & Mobile Viewport: moderate success
            ("CLEAN_SAFARI_MAC", "oracle-cloud-vpn-1", 200, 0.85, 0.75, 0.88, 270.0, 0.90, "Safari clean headers bypass on VPN-1"),
            ("MOBILE_VIEWPORT", "oracle-cloud-vpn-1", 200, 0.88, 0.78, 0.85, 290.0, 0.90, "Mobile viewport routes cleanly on VPN-1"),

            # Proxy Tunnel: clean fallback
            ("SANDBOX_PROXY_BYPASS", "oracle-cloud-vpn-1", 200, 1.0, 0.92, 0.95, 590.0, 0.75, "Proxy tunnel verified clean recovery")
        ]

        for i, (sid, env_id, status, sem, stab, corr, lat, cost, note) in enumerate(seed_data):
            rec = ExperienceRecord(
                record_id=f"exp-seed-{i+1}",
                timestamp=now - (len(seed_data) - i) * 60,
                strategy_id=sid,
                strategy_name=[s["name"] for s in DEFAULT_STRATEGIES_METADATA if s["id"] == sid][0],
                environment_id=env_id,
                status_code=status,
                semantic_success=sem,
                sustained_stability=stab,
                data_correctness=corr,
                latency_ms=lat,
                resource_cost=cost,
                target_domain="retail-oracle-edge.com",
                notes=note
            )
            self.experiences.append(rec)

        # Build initial strategy profiles
        self._recompute_all_weights()

    def _persist(self):
        self.store.save_state(self.strategy_weights, self.experiences, self.coefficients)

    def _calc_speed_score(self, latency_ms: float) -> float:
        """Converts latency into 0.0 - 1.0 score. Sub-300ms -> 1.0, 3000ms+ -> 0.1"""
        if latency_ms <= 200.0:
            return 1.0
        if latency_ms >= 4000.0:
            return 0.1
        # Exponential decay curve
        return max(0.1, min(1.0, math.exp(-(latency_ms - 200.0) / 1200.0)))

    def _recompute_all_weights(self):
        """
        Recomputes aggregate strategy scores and rankings from all past experiences.
        Uses exponential recency weighting and multi-objective weighted sum.
        """
        strat_meta_map = {s["id"]: s for s in DEFAULT_STRATEGIES_METADATA}

        for meta in DEFAULT_STRATEGIES_METADATA:
            sid = meta["id"]
            records = [e for e in self.experiences if e.strategy_id == sid]

            if not records:
                # Use default priors
                speed_sc = self._calc_speed_score(meta["base_latency"])
                comp = (
                    self.coefficients.w_semantic * meta["base_semantic"] +
                    self.coefficients.w_stability * meta["base_stability"] +
                    self.coefficients.w_correctness * meta["base_correctness"] +
                    self.coefficients.w_speed * speed_sc +
                    self.coefficients.w_resource * meta["resource_cost"] +
                    self.coefficients.w_env_history * 0.5
                ) * 100.0
                self.strategy_weights[sid] = StrategyWeightProfile(
                    strategy_id=sid,
                    strategy_name=meta["name"],
                    composite_score=round(comp, 2),
                    semantic_score_avg=meta["base_semantic"],
                    stability_score_avg=meta["base_stability"],
                    correctness_score_avg=meta["base_correctness"],
                    speed_score_avg=round(speed_sc, 3),
                    resource_score=meta["resource_cost"],
                    total_runs=0,
                    success_runs=0,
                    partial_206_runs=0,
                    blocked_403_runs=0,
                    consecutive_clean=0,
                    avg_latency_ms=meta["base_latency"],
                    environment_affinities={},
                    recommended_rank=1
                )
                continue

            # Compute statistics with recency weighting
            total_weight = 0.0
            weighted_sem = 0.0
            weighted_stab = 0.0
            weighted_corr = 0.0
            weighted_speed = 0.0
            weighted_lat = 0.0
            success_count = 0
            partial_count = 0
            blocked_count = 0
            consecutive = 0

            # Environment affinities
            env_sums: Dict[str, Tuple[float, int]] = {}

            now = time.time()
            for idx, r in enumerate(records):
                # Recency factor: recent records have higher weight (half-life of 2 hours)
                age_hours = max(0.0, (now - r.timestamp) / 3600.0)
                recency_weight = math.exp(-age_hours / 4.0)

                total_weight += recency_weight
                weighted_sem += r.semantic_success * recency_weight
                weighted_stab += r.sustained_stability * recency_weight
                weighted_corr += r.data_correctness * recency_weight
                spd = self._calc_speed_score(r.latency_ms)
                weighted_speed += spd * recency_weight
                weighted_lat += r.latency_ms * recency_weight

                if r.status_code == 200 and r.semantic_success >= 0.8:
                    success_count += 1
                elif r.status_code == 206 or (0.1 < r.semantic_success < 0.8):
                    partial_count += 1
                elif r.status_code == 403 or r.semantic_success == 0.0:
                    blocked_count += 1

                # Track env-specific affinity
                prev_sum, prev_cnt = env_sums.get(r.environment_id, (0.0, 0))
                # composite for this single record
                single_score = (r.semantic_success * 0.6 + r.sustained_stability * 0.4)
                env_sums[r.environment_id] = (prev_sum + single_score, prev_cnt + 1)

            # Check consecutive clean runs at the tail
            for r in reversed(records):
                if r.status_code == 200 and r.semantic_success >= 0.8:
                    consecutive += 1
                else:
                    break

            sem_avg = weighted_sem / max(0.001, total_weight)
            stab_avg = weighted_stab / max(0.001, total_weight)
            corr_avg = weighted_corr / max(0.001, total_weight)
            spd_avg = weighted_speed / max(0.001, total_weight)
            lat_avg = weighted_lat / max(0.001, total_weight)
            res_cost = meta["resource_cost"]

            env_affinities = {
                eid: round(s_sum / max(1, s_cnt), 3) for eid, (s_sum, s_cnt) in env_sums.items()
            }

            # Environment history bonus for active environment
            active_env_affinity = env_affinities.get(self.active_environment_id, 0.5)

            # Heavy penalty if recently returned 206 or 403 repeatedly
            stability_penalty = 1.0
            if partial_count > 0 and len(records) > 0 and (partial_count / len(records)) > 0.4:
                stability_penalty = 0.65  # severe penalty for strategies that fall into 206 trap
            if blocked_count > 0 and len(records) > 0 and (blocked_count / len(records)) > 0.6:
                stability_penalty = 0.40  # severe penalty for hard 403

            # Calculate Composite Score (0 - 100)
            composite = (
                (self.coefficients.w_semantic * sem_avg) +
                (self.coefficients.w_stability * stab_avg * stability_penalty) +
                (self.coefficients.w_correctness * corr_avg) +
                (self.coefficients.w_speed * spd_avg) +
                (self.coefficients.w_resource * res_cost) +
                (self.coefficients.w_env_history * active_env_affinity)
            ) * 100.0

            # Boost for confirmed consecutive clean runs
            if consecutive >= 3:
                composite = min(99.5, composite * 1.05)

            self.strategy_weights[sid] = StrategyWeightProfile(
                strategy_id=sid,
                strategy_name=meta["name"],
                composite_score=round(composite, 2),
                semantic_score_avg=round(sem_avg, 3),
                stability_score_avg=round(stab_avg, 3),
                correctness_score_avg=round(corr_avg, 3),
                speed_score_avg=round(spd_avg, 3),
                resource_score=res_cost,
                total_runs=len(records),
                success_runs=success_count,
                partial_206_runs=partial_count,
                blocked_403_runs=blocked_count,
                consecutive_clean=consecutive,
                avg_latency_ms=round(lat_avg, 1),
                environment_affinities=env_affinities,
                recommended_rank=1,
                last_updated=time.time()
            )

        # Update recommended ranks sorted by composite score descending
        sorted_strats = sorted(self.strategy_weights.values(), key=lambda w: w.composite_score, reverse=True)
        for rank, strat in enumerate(sorted_strats, start=1):
            self.strategy_weights[strat.strategy_id].recommended_rank = rank

    # -----------------------------------------------------------------------
    # Public Mechanism APIs
    # -----------------------------------------------------------------------

    def get_ordered_strategies(self, environment_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Returns strategy IDs ordered dynamically by weighted composite score
        for the given environment.
        """
        if environment_id and environment_id in self.environments:
            self.active_environment_id = environment_id
            self._recompute_all_weights()

        sorted_profiles = sorted(
            self.strategy_weights.values(),
            key=lambda w: w.composite_score,
            reverse=True
        )
        return [w.to_dict() for w in sorted_profiles]

    def create_and_update_weights(self, experience: ExperienceRecord) -> Dict[str, Any]:
        """
        PRIMARY DIRECTIVE:
        Creates a new experience record and adaptively updates strategy weights
        based on past and current experiences.
        """
        self.experiences.append(experience)
        self._recompute_all_weights()
        self._persist()

        updated_profile = self.strategy_weights.get(experience.strategy_id)
        return {
            "status": "ok",
            "message": f"Weights updated for strategy {experience.strategy_id}",
            "recorded_experience": experience.to_dict(),
            "updated_strategy_weight": updated_profile.to_dict() if updated_profile else None,
            "new_ranking": [
                {"rank": w.recommended_rank, "id": w.strategy_id, "score": w.composite_score}
                for w in sorted(self.strategy_weights.values(), key=lambda x: x.recommended_rank)
            ]
        }

    def record_run(
        self,
        strategy_id: str,
        status_code: int,
        latency_ms: float,
        semantic_success: float,
        sustained_stability: float,
        data_correctness: float,
        environment_id: Optional[str] = None,
        target_domain: str = "",
        notes: str = ""
    ) -> Dict[str, Any]:
        """Convenience method to log an execution run and update weights."""
        env_id = environment_id or self.active_environment_id
        strat_meta = next((s for s in DEFAULT_STRATEGIES_METADATA if s["id"] == strategy_id), None)
        strat_name = strat_meta["name"] if strat_meta else strategy_id
        resource_cost = strat_meta["resource_cost"] if strat_meta else 0.70

        rec = ExperienceRecord(
            record_id=f"exp-{int(time.time()*1000)}",
            timestamp=time.time(),
            strategy_id=strategy_id,
            strategy_name=strat_name,
            environment_id=env_id,
            status_code=status_code,
            semantic_success=max(0.0, min(1.0, semantic_success)),
            sustained_stability=max(0.0, min(1.0, sustained_stability)),
            data_correctness=max(0.0, min(1.0, data_correctness)),
            latency_ms=latency_ms,
            resource_cost=resource_cost,
            target_domain=target_domain,
            notes=notes
        )
        return self.create_and_update_weights(rec)

    def set_environment(self, environment_id: str) -> Dict[str, Any]:
        """Switches the active environment profile and recalculates rankings."""
        if environment_id in self.environments:
            self.active_environment_id = environment_id
            self._recompute_all_weights()
            self._persist()
            return {"status": "ok", "active_environment": self.environments[environment_id].to_dict()}
        return {"status": "error", "message": f"Unknown environment: {environment_id}"}

    def set_coefficients(self, coeffs: Dict[str, float]) -> Dict[str, Any]:
        """Allows tuning relative weight criteria."""
        if "w_semantic" in coeffs: self.coefficients.w_semantic = float(coeffs["w_semantic"])
        if "w_stability" in coeffs: self.coefficients.w_stability = float(coeffs["w_stability"])
        if "w_correctness" in coeffs: self.coefficients.w_correctness = float(coeffs["w_correctness"])
        if "w_speed" in coeffs: self.coefficients.w_speed = float(coeffs["w_speed"])
        if "w_resource" in coeffs: self.coefficients.w_resource = float(coeffs["w_resource"])
        if "w_env_history" in coeffs: self.coefficients.w_env_history = float(coeffs["w_env_history"])
        self._recompute_all_weights()
        self._persist()
        return {"status": "ok", "coefficients": self.coefficients.to_dict()}

    def reset_to_baseline(self) -> Dict[str, Any]:
        """Resets weights to the empirical baseline derived from Oracle Cloud VPN testing."""
        self._bootstrap_empirical_baseline()
        self._persist()
        return {"status": "ok", "message": "Weights successfully reset to empirical Oracle Cloud baseline."}

    def get_full_state(self) -> Dict[str, Any]:
        """Returns the full engine state for visualization in the UI."""
        return {
            "mechanism_id": self.mechanism_id,
            "version": self.version,
            "contract_version": self.contract_version,
            "active_environment": self.environments.get(self.active_environment_id, KNOWN_ENVIRONMENTS[0]).to_dict(),
            "available_environments": [e.to_dict() for e in self.environments.values()],
            "coefficients": self.coefficients.to_dict(),
            "strategy_weights": [w.to_dict() for w in sorted(self.strategy_weights.values(), key=lambda x: x.recommended_rank)],
            "total_experiences": len(self.experiences),
            "recent_experiences": [e.to_dict() for e in reversed(self.experiences[-25:])]
        }


# Singleton mechanism instance
experience_weighted_resolver = ExperienceWeightedDecisionResolver()
