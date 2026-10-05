#ifndef PRICE_ANALYTICS_HPP
#define PRICE_ANALYTICS_HPP

#include <cstddef>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

// Analytics Result Structure returned to Python / FFI caller
typedef struct {
    double current_price;
    double previous_price;
    double min_price;
    double max_price;
    double mean_price;
    double median_price;
    double std_dev;
    double variance;
    double z_score;
    double sma;
    double ema;
    double bollinger_upper;
    double bollinger_lower;
    double bollinger_bandwidth;
    double absolute_change;
    double percent_change;
    double max_drawdown_percent;
    bool is_all_time_low;
    bool is_significant_drop; // Drop > threshold (e.g. 5%)
    bool is_anomaly;          // Flash drop / possible scrape glitch (|z| > 3.0)
    double anomaly_confidence; // 0.0 to 1.0 confidence that fluctuation is real vs glitch
    long long execution_time_ns; // Nanoseconds taken by C++ computation
} PriceAnalyticsResult;

// Core C++ analytical function
PriceAnalyticsResult compute_price_analytics(
    const double* prices,
    size_t count,
    int sma_period,
    double ema_alpha,
    double drop_threshold_pct
);

// High-throughput benchmark test (generates n points and processes in C++)
double benchmark_throughput(size_t iterations);

#ifdef __cplusplus
}
#endif

#endif // PRICE_ANALYTICS_HPP
