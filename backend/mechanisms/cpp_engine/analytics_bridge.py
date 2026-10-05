import ctypes
import os
import math
import time
from typing import List, Dict, Any

class CPriceAnalyticsResult(ctypes.Structure):
    _fields_ = [
        ("current_price", ctypes.c_double),
        ("previous_price", ctypes.c_double),
        ("min_price", ctypes.c_double),
        ("max_price", ctypes.c_double),
        ("mean_price", ctypes.c_double),
        ("median_price", ctypes.c_double),
        ("std_dev", ctypes.c_double),
        ("variance", ctypes.c_double),
        ("z_score", ctypes.c_double),
        ("sma", ctypes.c_double),
        ("ema", ctypes.c_double),
        ("bollinger_upper", ctypes.c_double),
        ("bollinger_lower", ctypes.c_double),
        ("bollinger_bandwidth", ctypes.c_double),
        ("absolute_change", ctypes.c_double),
        ("percent_change", ctypes.c_double),
        ("max_drawdown_percent", ctypes.c_double),
        ("is_all_time_low", ctypes.c_bool),
        ("is_significant_drop", ctypes.c_bool),
        ("is_anomaly", ctypes.c_bool),
        ("anomaly_confidence", ctypes.c_double),
        ("execution_time_ns", ctypes.c_longlong),
    ]

_current_dir = os.path.dirname(os.path.abspath(__file__))
_so_path = os.path.join(_current_dir, "libprice_analytics.so")
_cpp_lib = None

try:
    if os.path.exists(_so_path):
        _cpp_lib = ctypes.CDLL(_so_path)
        _cpp_lib.compute_price_analytics.argtypes = [
            ctypes.POINTER(ctypes.c_double),
            ctypes.c_size_t,
            ctypes.c_int,
            ctypes.c_double,
            ctypes.c_double,
        ]
        _cpp_lib.compute_price_analytics.restype = CPriceAnalyticsResult
        _cpp_lib.benchmark_throughput.argtypes = [ctypes.c_size_t]
        _cpp_lib.benchmark_throughput.restype = ctypes.c_double
except Exception as e:
    _cpp_lib = None

def compute_analytics(
    prices: List[float],
    sma_period: int = 14,
    ema_alpha: float = 0.2,
    drop_threshold_pct: float = 5.0
) -> Dict[str, Any]:
    """
    Computes statistical volatility and moving averages.
    Calls native C++ library if available, otherwise executes high-precision Python math.
    """
    if not prices:
        return {
            "engine": "none",
            "current_price": 0.0,
            "previous_price": 0.0,
            "min_price": 0.0,
            "max_price": 0.0,
            "mean_price": 0.0,
            "median_price": 0.0,
            "std_dev": 0.0,
            "variance": 0.0,
            "z_score": 0.0,
            "sma": 0.0,
            "ema": 0.0,
            "bollinger_upper": 0.0,
            "bollinger_lower": 0.0,
            "bollinger_bandwidth": 0.0,
            "absolute_change": 0.0,
            "percent_change": 0.0,
            "max_drawdown_percent": 0.0,
            "is_all_time_low": False,
            "is_significant_drop": False,
            "is_anomaly": False,
            "anomaly_confidence": 0.0,
            "execution_time_ns": 0,
        }

    if _cpp_lib is not None:
        try:
            arr_type = ctypes.c_double * len(prices)
            c_prices = arr_type(*prices)
            c_res = _cpp_lib.compute_price_analytics(
                c_prices,
                len(prices),
                int(sma_period),
                float(ema_alpha),
                float(drop_threshold_pct)
            )
            return {
                "engine": "C++ Native (g++ -O3)",
                "current_price": round(c_res.current_price, 2),
                "previous_price": round(c_res.previous_price, 2),
                "min_price": round(c_res.min_price, 2),
                "max_price": round(c_res.max_price, 2),
                "mean_price": round(c_res.mean_price, 2),
                "median_price": round(c_res.median_price, 2),
                "std_dev": round(c_res.std_dev, 4),
                "variance": round(c_res.variance, 4),
                "z_score": round(c_res.z_score, 3),
                "sma": round(c_res.sma, 2),
                "ema": round(c_res.ema, 2),
                "bollinger_upper": round(c_res.bollinger_upper, 2),
                "bollinger_lower": round(c_res.bollinger_lower, 2),
                "bollinger_bandwidth": round(c_res.bollinger_bandwidth, 2),
                "absolute_change": round(c_res.absolute_change, 2),
                "percent_change": round(c_res.percent_change, 2),
                "max_drawdown_percent": round(c_res.max_drawdown_percent, 2),
                "is_all_time_low": bool(c_res.is_all_time_low),
                "is_significant_drop": bool(c_res.is_significant_drop),
                "is_anomaly": bool(c_res.is_anomaly),
                "anomaly_confidence": round(c_res.anomaly_confidence, 2),
                "execution_time_ns": c_res.execution_time_ns,
            }
        except Exception:
            pass

    # Pure Python Fallback implementation
    start_ns = time.time_ns()
    n = len(prices)
    curr = prices[-1]
    prev = prices[-2] if n >= 2 else curr
    mean_val = sum(prices) / n
    sorted_p = sorted(prices)
    median_val = (sorted_p[n//2 - 1] + sorted_p[n//2]) / 2.0 if n % 2 == 0 else sorted_p[n//2]
    variance_val = sum((p - mean_val) ** 2 for p in prices) / n
    std_dev_val = math.sqrt(variance_val)
    z_score_val = ((curr - mean_val) / std_dev_val) if std_dev_val > 1e-9 else 0.0

    k = min(n, sma_period if sma_period > 0 else n)
    sma_val = sum(prices[-k:]) / k

    alpha = ema_alpha if (0.0 < ema_alpha <= 1.0) else (2.0 / (k + 1.0))
    ema_val = prices[0]
    for p in prices[1:]:
        ema_val = (alpha * p) + ((1.0 - alpha) * ema_val)

    boll_upper = sma_val + (2.0 * std_dev_val)
    boll_lower = max(0.0, sma_val - (2.0 * std_dev_val))
    bandwidth = ((boll_upper - boll_lower) / sma_val * 100.0) if sma_val > 1e-9 else 0.0

    abs_change = curr - prev
    pct_change = (abs_change / prev * 100.0) if prev > 1e-9 else 0.0

    peak = prices[0]
    max_dd = 0.0
    for p in prices:
        if p > peak:
            peak = p
        if peak > 1e-9:
            dd = (peak - p) / peak * 100.0
            if dd > max_dd:
                max_dd = dd

    exec_ns = time.time_ns() - start_ns

    return {
        "engine": "Python Fallback",
        "current_price": round(curr, 2),
        "previous_price": round(prev, 2),
        "min_price": round(min(prices), 2),
        "max_price": round(max(prices), 2),
        "mean_price": round(mean_val, 2),
        "median_price": round(median_val, 2),
        "std_dev": round(std_dev_val, 4),
        "variance": round(variance_val, 4),
        "z_score": round(z_score_val, 3),
        "sma": round(sma_val, 2),
        "ema": round(ema_val, 2),
        "bollinger_upper": round(boll_upper, 2),
        "bollinger_lower": round(boll_lower, 2),
        "bollinger_bandwidth": round(bandwidth, 2),
        "absolute_change": round(abs_change, 2),
        "percent_change": round(pct_change, 2),
        "max_drawdown_percent": round(max_dd, 2),
        "is_all_time_low": bool(curr <= min(prices) + 1e-4),
        "is_significant_drop": bool(pct_change <= -abs(drop_threshold_pct)),
        "is_anomaly": bool(n >= 5 and (pct_change <= -75.0 or abs(z_score_val) >= 3.5)),
        "anomaly_confidence": 0.85 if (n >= 5 and (pct_change <= -75.0 or abs(z_score_val) >= 3.5)) else 0.05,
        "execution_time_ns": exec_ns,
    }

def run_performance_benchmark(iterations: int = 50000) -> Dict[str, Any]:
    """Runs high-load benchmark comparing C++ vs Python speed."""
    c_time_ms = 0.0
    if _cpp_lib is not None:
        try:
            c_time_ms = float(_cpp_lib.benchmark_throughput(iterations))
        except Exception:
            c_time_ms = -1.0

    # Measure Python for a subset (e.g. 10,000 iterations to avoid excessive latency)
    py_sample_count = min(iterations, 10000)
    sample_prices = [100.0 + (i % 25) for i in range(120)]
    t0 = time.time()
    for _ in range(py_sample_count):
        compute_analytics(sample_prices, sma_period=14, ema_alpha=0.2, drop_threshold_pct=5.0)
    py_total_time = (time.time() - t0) * 1000.0
    # Project to full iterations
    projected_py_ms = (py_total_time / py_sample_count) * iterations

    speedup = round(projected_py_ms / c_time_ms, 1) if c_time_ms > 0 else 1.0

    return {
        "iterations": iterations,
        "cpp_available": _cpp_lib is not None,
        "cpp_time_ms": round(c_time_ms, 2),
        "python_projected_ms": round(projected_py_ms, 2),
        "cpp_speedup_factor": f"{speedup}x faster",
        "throughput_ops_per_sec": round(iterations / (c_time_ms / 1000.0)) if c_time_ms > 0 else 0
    }
