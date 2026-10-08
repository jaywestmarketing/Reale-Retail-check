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

        elif cmd == "catalog_harvest":
            url = payload.get("url", "")
            options = payload.get("options", {})
            if not url:
                print(json.dumps({"error": "url parameter required"}))
                return
            harvest_res = hub.harvest_catalog_signals(url, options)
            print(json.dumps(harvest_res))

        elif cmd == "catalog_list":
            filter_type = payload.get("filter_type")
            search = payload.get("search")
            signals = hub.get_catalog_signals_list(filter_type, search)
            print(json.dumps({"status": "ok", "total": len(signals), "signals": signals}))

        elif cmd == "catalog_export_csv":
            csv_text = hub.export_catalog_signals_csv()
            print(csv_text)

        elif cmd == "catalog_export_json":
            json_text = hub.export_catalog_signals_json()
            print(json_text)

        elif cmd == "catalog_clear":
            hub.clear_catalog_signals_list()
            print(json.dumps({"status": "ok", "message": "Internal catalog signals list cleared"}))

        elif cmd == "experience_state":
            st = hub.get_experience_weights_state()
            print(json.dumps(st))

        elif cmd == "experience_set_env":
            env_id = payload.get("environment_id", "oracle-cloud-vpn-1")
            res = hub.set_experience_environment(env_id)
            print(json.dumps(res))

        elif cmd == "experience_update_coeffs":
            coeffs = payload.get("coefficients", {})
            res = hub.update_experience_coefficients(coeffs)
            print(json.dumps(res))

        elif cmd == "experience_record":
            res = hub.record_custom_experience(payload)
            print(json.dumps(res))

        elif cmd == "experience_reset":
            res = hub.reset_experience_weights()
            print(json.dumps(res))

        else:
            print(json.dumps({"error": f"Unknown command: {cmd}"}))

    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
