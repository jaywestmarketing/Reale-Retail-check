import time
from typing import List, Dict, Any, Optional
from backend.mechanisms.contracts import SchedulerMechanismContract
from backend.mechanisms.cpp_engine.analytics_bridge import compute_analytics

class FluctuationAlertScheduler(SchedulerMechanismContract):
    """
    Mechanism 4: Tracking & Fluctuation Alert Orchestrator.
    Evaluates new price observations, triggers C++ analytics, checks user alert criteria,
    and dispatches notification events.
    """
    def __init__(self, default_drop_pct: float = 5.0):
        self.default_drop_pct = default_drop_pct

    def evaluate_fluctuation(
        self,
        product_id: str,
        new_price: float,
        history: List[float],
        target_price: Optional[float] = None,
        drop_pct_threshold: Optional[float] = None,
    ) -> Dict[str, Any]:
        threshold = drop_pct_threshold if drop_pct_threshold is not None else self.default_drop_pct
        updated_history = list(history) + [new_price]

        # Call Mechanism 3: High-Performance C++ Analytical Unit
        analytics = compute_analytics(
            updated_history,
            sma_period=14,
            ema_alpha=0.2,
            drop_threshold_pct=threshold
        )

        prev_price = history[-1] if history else new_price
        pct_change = analytics["percent_change"]
        abs_change = analytics["absolute_change"]

        alerts_triggered: List[Dict[str, Any]] = []

        # 1. Target Price Reached
        if target_price is not None and new_price <= target_price:
            alerts_triggered.append({
                "type": "TARGET_REACHED",
                "severity": "high",
                "message": f"Target price reached! Now ${new_price:.2f} (Target: ${target_price:.2f})",
                "savings": round(target_price - new_price, 2)
            })

        # 2. Significant Drop Trigger
        if pct_change <= -abs(threshold):
            alerts_triggered.append({
                "type": "PRICE_DROP",
                "severity": "medium",
                "message": f"Price dropped by {abs(pct_change):.1f}% (-${abs(abs_change):.2f})",
                "delta": abs_change,
                "pct": pct_change
            })

        # 3. All-Time Low
        if analytics["is_all_time_low"] and len(updated_history) >= 3:
            alerts_triggered.append({
                "type": "ALL_TIME_LOW",
                "severity": "high",
                "message": f"New all-time lowest price recorded: ${new_price:.2f}",
                "min_price": analytics["min_price"]
            })

        # 4. Outlier / Scraping Anomaly Warning
        if analytics["is_anomaly"]:
            alerts_triggered.append({
                "type": "ANOMALY_WARNING",
                "severity": "warning",
                "message": f"Unusual price drop detected ({pct_change:.1f}%). Possible agent DOM parsing drift.",
                "confidence": analytics["anomaly_confidence"]
            })

        return {
            "product_id": product_id,
            "timestamp": time.time(),
            "new_price": new_price,
            "previous_price": prev_price,
            "history": updated_history,
            "analytics": analytics,
            "alerts": alerts_triggered,
            "has_alerts": len(alerts_triggered) > 0
        }
