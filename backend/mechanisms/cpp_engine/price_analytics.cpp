#include "price_analytics.hpp"
#include <vector>
#include <cmath>
#include <algorithm>
#include <chrono>
#include <iostream>

extern "C" {

PriceAnalyticsResult compute_price_analytics(
    const double* prices,
    size_t count,
    int sma_period,
    double ema_alpha,
    double drop_threshold_pct
) {
    auto start_time = std::chrono::high_resolution_clock::now();

    PriceAnalyticsResult result = {0};

    if (prices == nullptr || count == 0) {
        return result;
    }

    // Current price is the latest entry
    result.current_price = prices[count - 1];
    result.previous_price = (count >= 2) ? prices[count - 2] : result.current_price;

    double sum = 0.0;
    double min_val = prices[0];
    double max_val = prices[0];
    std::vector<double> sorted_prices;
    sorted_prices.reserve(count);

    for (size_t i = 0; i < count; ++i) {
        double p = prices[i];
        sum += p;
        if (p < min_val) min_val = p;
        if (p > max_val) max_val = p;
        sorted_prices.push_back(p);
    }

    result.min_price = min_val;
    result.max_price = max_val;
    result.mean_price = sum / static_cast<double>(count);

    // Median
    std::sort(sorted_prices.begin(), sorted_prices.end());
    if (count % 2 == 0) {
        result.median_price = (sorted_prices[count / 2 - 1] + sorted_prices[count / 2]) / 2.0;
    } else {
        result.median_price = sorted_prices[count / 2];
    }

    // Variance and Standard Deviation
    double var_sum = 0.0;
    for (size_t i = 0; i < count; ++i) {
        double diff = prices[i] - result.mean_price;
        var_sum += diff * diff;
    }
    result.variance = var_sum / static_cast<double>(count);
    result.std_dev = std::sqrt(result.variance);

    // Z-Score for latest price
    if (result.std_dev > 1e-9) {
        result.z_score = (result.current_price - result.mean_price) / result.std_dev;
    } else {
        result.z_score = 0.0;
    }

    // Simple Moving Average (SMA)
    size_t k = (sma_period > 0 && static_cast<size_t>(sma_period) <= count)
                   ? static_cast<size_t>(sma_period)
                   : count;
    double sma_sum = 0.0;
    for (size_t i = count - k; i < count; ++i) {
        sma_sum += prices[i];
    }
    result.sma = sma_sum / static_cast<double>(k);

    // Exponential Moving Average (EMA)
    double alpha = ema_alpha;
    if (alpha <= 0.0 || alpha > 1.0) {
        alpha = 2.0 / (static_cast<double>(k) + 1.0);
    }
    double current_ema = prices[0];
    for (size_t i = 1; i < count; ++i) {
        current_ema = (alpha * prices[i]) + ((1.0 - alpha) * current_ema);
    }
    result.ema = current_ema;

    // Bollinger Bands: Middle = SMA, Upper = SMA + 2*sigma, Lower = SMA - 2*sigma
    result.bollinger_upper = result.sma + (2.0 * result.std_dev);
    result.bollinger_lower = std::max(0.0, result.sma - (2.0 * result.std_dev));
    if (result.sma > 1e-9) {
        result.bollinger_bandwidth = ((result.bollinger_upper - result.bollinger_lower) / result.sma) * 100.0;
    } else {
        result.bollinger_bandwidth = 0.0;
    }

    // Absolute and Percentage Price Change from previous check
    result.absolute_change = result.current_price - result.previous_price;
    if (result.previous_price > 1e-9) {
        result.percent_change = (result.absolute_change / result.previous_price) * 100.0;
    } else {
        result.percent_change = 0.0;
    }

    // Max Drawdown (peak-to-trough)
    double peak = prices[0];
    double max_dd = 0.0;
    for (size_t i = 0; i < count; ++i) {
        if (prices[i] > peak) {
            peak = prices[i];
        }
        if (peak > 1e-9) {
            double dd = (peak - prices[i]) / peak * 100.0;
            if (dd > max_dd) max_dd = dd;
        }
    }
    result.max_drawdown_percent = max_dd;

    // Flags & Thresholds
    result.is_all_time_low = (result.current_price <= result.min_price + 1e-4);
    result.is_significant_drop = (result.percent_change <= -std::abs(drop_threshold_pct));

    // Anomaly detection: if price suddenly drops > 75% or has |z| > 3.5 while history count >= 5
    // could be an agent scrape issue (e.g. scraped accessory/shipping price)
    if (count >= 5 && (result.percent_change <= -75.0 || std::abs(result.z_score) >= 3.5)) {
        result.is_anomaly = true;
        result.anomaly_confidence = 0.85;
    } else {
        result.is_anomaly = false;
        result.anomaly_confidence = 0.05;
    }

    auto end_time = std::chrono::high_resolution_clock::now();
    result.execution_time_ns = std::chrono::duration_cast<std::chrono::nanoseconds>(end_time - start_time).count();

    return result;
}

double benchmark_throughput(size_t iterations) {
    std::vector<double> dummy_prices;
    dummy_prices.reserve(256);
    double base = 100.0;
    for (size_t i = 0; i < 256; ++i) {
        base += std::sin(static_cast<double>(i) * 0.1) * 2.0;
        dummy_prices.push_back(std::max(10.0, base));
    }

    auto start = std::chrono::high_resolution_clock::now();
    volatile double dummy_accumulator = 0.0;

    for (size_t iter = 0; iter < iterations; ++iter) {
        PriceAnalyticsResult res = compute_price_analytics(dummy_prices.data(), dummy_prices.size(), 14, 0.2, 5.0);
        dummy_accumulator += res.sma;
    }

    auto finish = std::chrono::high_resolution_clock::now();
    double total_ms = std::chrono::duration<double, std::milli>(finish - start).count();
    return total_ms;
}

} // extern "C"

#ifdef COMPILE_STANDALONE_CLI
int main(int argc, char* argv[]) {
    std::vector<double> test_series = {199.99, 195.50, 199.99, 189.99, 179.99, 169.99, 149.99};
    PriceAnalyticsResult r = compute_price_analytics(test_series.data(), test_series.size(), 5, 0.3, 5.0);

    std::cout << "--- C++ Price Analytics Computation Test ---" << std::endl;
    std::cout << "Current Price: $" << r.current_price << std::endl;
    std::cout << "Mean Price:    $" << r.mean_price << std::endl;
    std::cout << "Std Dev:       $" << r.std_dev << std::endl;
    std::cout << "SMA (5):       $" << r.sma << std::endl;
    std::cout << "Bollinger Upper: $" << r.bollinger_upper << std::endl;
    std::cout << "Bollinger Lower: $" << r.bollinger_lower << std::endl;
    std::cout << "Change %:      " << r.percent_change << "%" << std::endl;
    std::cout << "Execution time: " << r.execution_time_ns << " ns" << std::endl;

    double bench_ms = benchmark_throughput(100000);
    std::cout << "100,000 analytics iterations benchmark: " << bench_ms << " ms" << std::endl;
    return 0;
}
#endif
