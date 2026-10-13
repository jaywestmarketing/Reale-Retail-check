#!/usr/bin/env python3
import sys
import json
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.mechanisms.registry import hub, MECHANISMS_MANIFEST
from backend.mechanisms.crawler_mechanism import AutonomousCatalogCrawler
from backend.mechanisms.long_running_scanner_mechanism import category_scanner_engine
from backend.mechanisms.cognitive_learning_engine import cognitive_learning_engine

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1]
    payload = {}
    if len(sys.argv) >= 3:
        try:
            payload = json.loads(sys.argv[2])
        except Exception:
            payload = {}

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
            crawler = AutonomousCatalogCrawler()
            url = payload.get("url", "")
            options = payload.get("options", {})
            crawl_res = crawler.deep_crawl_to_product(url, options=options)
            print(json.dumps(crawl_res))

        elif cmd == "test_continuity":
            url = payload.get("url", "")
            options = payload.get("options", {})
            result = hub.test_continuity_resolution(url, options)
            print(json.dumps(result))

        elif cmd == "analytics":
            prices = payload.get("prices", [])
            sma_period = int(payload.get("sma_period", 14))
            ema_alpha = float(payload.get("ema_alpha", 0.2))
            drop_threshold_pct = float(payload.get("drop_threshold_pct", 5.0))
            res = hub.compute_analytics_for_prices(prices, sma_period, ema_alpha, drop_threshold_pct)
            print(json.dumps(res))

        elif cmd == "category_scan_start":
            url = payload.get("url", "https://www.homedepot.com")
            duration_hours = float(payload.get("duration_hours", 3.5))
            custom_cooldown = payload.get("custom_cooldown")
            scan_id = payload.get("scan_id")
            cp = category_scanner_engine.create_or_resume_scan(url, duration_hours, custom_cooldown, scan_id)
            print(json.dumps({"status": "ok", "checkpoint": cp.to_dict()}))

        elif cmd == "category_scan_step":
            scan_id = payload.get("scan_id", "")
            if not scan_id:
                print(json.dumps({"error": "scan_id required"}))
                return
            step_res = category_scanner_engine.execute_next_step(scan_id)
            print(json.dumps(step_res))

        elif cmd == "category_scan_pause":
            scan_id = payload.get("scan_id", "")
            res = category_scanner_engine.pause_scan(scan_id)
            print(json.dumps(res))

        elif cmd == "category_scan_resume":
            scan_id = payload.get("scan_id", "")
            res = category_scanner_engine.resume_scan(scan_id)
            print(json.dumps(res))

        elif cmd == "category_scan_status":
            scan_id = payload.get("scan_id", "")
            cp = category_scanner_engine.load_checkpoint(scan_id)
            if not cp:
                print(json.dumps({"error": f"Scan {scan_id} not found"}))
            else:
                print(json.dumps({"status": "ok", "checkpoint": cp.to_dict()}))

        elif cmd == "category_scan_list":
            checkpoints = category_scanner_engine.list_checkpoints()
            print(json.dumps({"status": "ok", "checkpoints": checkpoints}))

        elif cmd == "category_scan_export_csv":
            scan_id = payload.get("scan_id", "")
            csv_data = category_scanner_engine.export_items_csv(scan_id)
            print(csv_data)

        elif cmd == "category_scan_export_actions":
            scan_id = payload.get("scan_id", "")
            actions_json = category_scanner_engine.export_action_ledger_json(scan_id)
            print(actions_json)

        elif cmd == "category_scan_export_bundle":
            scan_id = payload.get("scan_id", "")
            bundle = category_scanner_engine.export_full_session_bundle(scan_id)
            print(json.dumps(bundle))

        elif cmd == "category_scan_check_url":
            url = payload.get("url", "")
            res = category_scanner_engine.automated_url_check(url)
            print(json.dumps(res))

        elif cmd == "category_scan_render_browser_view":
            url = payload.get("url", "")
            item_name = payload.get("item_name")
            sku = payload.get("sku")
            price = payload.get("price")
            retailer = payload.get("retailer")
            show_overlay = payload.get("show_overlay", True)
            res = category_scanner_engine.render_browser_view(
                url=url,
                item_name=item_name,
                sku=sku,
                price=price,
                retailer=retailer,
                show_overlay=show_overlay
            )
            print(json.dumps(res))

        elif cmd == "category_scan_double_check_items":
            scan_id = payload.get("scan_id", "")
            if not scan_id:
                print(json.dumps({"error": "scan_id parameter required"}))
                return
            res = category_scanner_engine.double_check_all_items(scan_id)
            print(json.dumps(res))

        elif cmd == "category_scan_double_check_single_item":
            scan_id = payload.get("scan_id", "")
            item_id = payload.get("item_id", "")
            if not scan_id or not item_id:
                print(json.dumps({"error": "scan_id and item_id parameters required"}))
                return
            res = category_scanner_engine.double_check_single_item(scan_id, item_id)
            print(json.dumps(res))

        elif cmd == "category_scan_update_item_price":
            scan_id = payload.get("scan_id", "")
            item_id = payload.get("item_id", "")
            new_price = payload.get("new_price")
            original_price = payload.get("original_price")
            name = payload.get("name")
            availability = payload.get("availability")
            if not scan_id or not item_id or new_price is None:
                print(json.dumps({"error": "scan_id, item_id, and new_price required"}))
                return
            res = category_scanner_engine.update_item_price(
                scan_id=scan_id,
                item_id=item_id,
                new_price=new_price,
                original_price=original_price,
                name=name,
                availability=availability
            )
            print(json.dumps(res))

        elif cmd == "category_scan_calibrate_all_prices":
            scan_id = payload.get("scan_id", "")
            if not scan_id:
                print(json.dumps({"error": "scan_id parameter required"}))
                return
            res = category_scanner_engine.calibrate_all_prices(scan_id)
            print(json.dumps(res))

        elif cmd == "learning_engine_discover_docs":
            platform_id_or_url = payload.get("platform_id_or_url", "homedepot")
            doc_model = cognitive_learning_engine.discover_platform_docs(platform_id_or_url)
            print(json.dumps({"status": "ok", "doc_model": doc_model.to_dict()}))

        elif cmd == "learning_engine_scan_surfaces":
            platform_id_or_url = payload.get("platform_id_or_url", "homedepot")
            page_types = payload.get("page_types")
            surfaces = cognitive_learning_engine.scan_user_pages(platform_id_or_url, page_types)
            print(json.dumps({"status": "ok", "surfaces": [s.to_dict() for s in surfaces]}))

        elif cmd == "learning_engine_compare":
            platform_id_or_url = payload.get("platform_id_or_url", "homedepot")
            doc_model = cognitive_learning_engine.discover_platform_docs(platform_id_or_url)
            surfaces = cognitive_learning_engine.scan_user_pages(platform_id_or_url)
            report = cognitive_learning_engine.compare_analyses(doc_model, surfaces)
            print(json.dumps({
                "status": "ok",
                "doc_model": doc_model.to_dict(),
                "surfaces": [s.to_dict() for s in surfaces],
                "comparative_report": report.to_dict()
            }))

        elif cmd == "learning_engine_synthesize_plan":
            platform_id_or_url = payload.get("platform_id_or_url", "homedepot")
            persona = payload.get("persona", "deliberate_shopper")
            doc_model = cognitive_learning_engine.discover_platform_docs(platform_id_or_url)
            surfaces = cognitive_learning_engine.scan_user_pages(platform_id_or_url)
            report = cognitive_learning_engine.compare_analyses(doc_model, surfaces)
            plan = cognitive_learning_engine.synthesize_human_mimetic_plan(report, persona)
            print(json.dumps({
                "status": "ok",
                "doc_model": doc_model.to_dict(),
                "surfaces": [s.to_dict() for s in surfaces],
                "comparative_report": report.to_dict(),
                "human_plan": plan.to_dict()
            }))

        elif cmd == "learning_engine_simulate_step":
            plan_id = payload.get("plan_id", "")
            step_index = payload.get("step_index", 0)
            res = cognitive_learning_engine.simulate_execution_step(plan_id, int(step_index))
            print(json.dumps(res))

        elif cmd == "learning_engine_reset_plan":
            plan_id = payload.get("plan_id", "")
            res = cognitive_learning_engine.reset_plan_steps(plan_id)
            print(json.dumps(res))

        elif cmd == "learning_engine_list_plans":
            plans = cognitive_learning_engine.list_plans()
            print(json.dumps({"status": "ok", "plans": plans}))

        else:
            print(json.dumps({"error": f"Unknown command: {cmd}"}))

    except Exception as exc:
        print(json.dumps({"error": str(exc)}))
        sys.exit(1)

if __name__ == "__main__":
    main()
