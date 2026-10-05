#!/usr/bin/env python3
import sys
import json
import os

# Ensure backend package can be imported
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.mechanisms.registry import hub, MECHANISMS_MANIFEST
from backend.mechanisms.scheduler_mechanism import FluctuationAlertScheduler

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1]

    # Read payload from argv[2] or non-blocking stdin
    payload = {}
    if len(sys.argv) >= 3:
        try:
            payload = json.loads(sys.argv[2])
        except Exception:
            payload = {}
    else:
        import select
        if select.select([sys.stdin], [], [], 0.05)[0]:
            try:
                stdin_data = sys.stdin.read().strip()
                if stdin_data:
                    payload = json.loads(stdin_data)
            except Exception as e:
                payload = {"_stdin_parse_error": str(e)}

    try:
        if cmd == "manifest":
            print(json.dumps({"status": "ok", "mechanisms": MECHANISMS_MANIFEST}))

        elif cmd == "inspect_url":
            url = payload.get("url", "")
            options = payload.get("options", {})
            if not url:
                print(json.dumps({"error": "url parameter required"}))
                return
            result = hub.inspect_url(url, options)
            print(json.dumps(result))

        elif cmd == "autonomous_crawl":
            from backend.mechanisms.crawler_mechanism import AutonomousCatalogCrawler
            crawler = AutonomousCatalogCrawler()
            url = payload.get("url", "")
            options = payload.get("options", {})
            if not url:
                print(json.dumps({"error": "url parameter required"}))
                return
            crawl_res = crawler.deep_crawl_to_product(url, options=options)
            print(json.dumps(crawl_res.to_dict()))

        elif cmd == "test_continuity":
            url = payload.get("url", "")
            options = payload.get("options", {})
            if not url:
                print(json.dumps({"error": "url parameter required"}))
                return
            result = hub.test_continuity_resolution(url, options)
            print(json.dumps(result))

        elif cmd == "analytics":
            prices = payload.get("prices", [])
            sma_period = int(payload.get("sma_period", 14))
            ema_alpha = float(payload.get("ema_alpha", 0.2))
            drop_threshold_pct = float(payload.get("drop_threshold_pct", 5.0))
            res = hub.compute_analytics_for_prices(prices, sma_period, ema_alpha, drop_threshold_pct)
            print(json.dumps(res))

        elif cmd == "benchmark":
            iterations = int(payload.get("iterations", 50000))
            bench = hub.run_benchmark(iterations)
            print(json.dumps(bench))

        elif cmd == "evaluate_fluctuation":
            scheduler = FluctuationAlertScheduler()
            product_id = payload.get("product_id", "prod-1")
            new_price = float(payload.get("new_price", 0.0))
            history = payload.get("history", [])
            target_price = payload.get("target_price")
            if target_price is not None:
                target_price = float(target_price)
            drop_pct = float(payload.get("drop_pct_threshold", 5.0))
            eval_res = scheduler.evaluate_fluctuation(product_id, new_price, history, target_price, drop_pct)
            print(json.dumps(eval_res))

        else:
            print(json.dumps({"error": f"Unknown command: {cmd}"}))

    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
