import re
import json
import time
from typing import List, Dict, Any, Optional
from backend.mechanisms.contracts import DOMAgentMechanismContract, AgentIdentificationResult, PriceCandidate

PRICE_REGEX = re.compile(r'([$€£¥])\s*(\d{1,4}(?:,\d{3})*(?:\.\d{2})?)', re.IGNORECASE)

class AutonomousDOMPriceAgent(DOMAgentMechanismContract):
    def __init__(self, confidence_threshold: float = 0.55):
        self.confidence_threshold = confidence_threshold

    def identify_price_element(self, html: str, url: str, options: Optional[Dict[str, Any]] = None) -> AgentIdentificationResult:
        candidates: List[PriceCandidate] = []
        opts = options or {}
        thresh = opts.get("confidence_threshold", self.confidence_threshold)

        # 1. Search for JSON-LD structured data
        script_matches = re.findall(r'<script[^>]*type=[\'"]application/ld\+json[\'"][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
        for s in script_matches:
            try:
                data = json.loads(s.strip())
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if isinstance(item, dict):
                        offers = item.get("offers")
                        if offers:
                            offer_list = offers if isinstance(offers, list) else [offers]
                            for off in offer_list:
                                if isinstance(off, dict) and "price" in off:
                                    try:
                                        p_val = float(str(off["price"]).replace(",", ""))
                                        curr = str(off.get("priceCurrency", "$"))
                                        candidates.append(PriceCandidate(
                                            selector="script[type='application/ld+json'] (offers.price)",
                                            xpath="//script[@type='application/ld+json']",
                                            raw_text=str(off["price"]),
                                            parsed_price=p_val,
                                            currency=curr,
                                            confidence=0.98,
                                            strategy="json_ld_schema",
                                            rationale="Direct Schema.org structured data price"
                                        ))
                                    except Exception:
                                        pass
            except Exception:
                pass

        # 2. Search HTML meta tags
        meta_matches = re.findall(r'<meta[^>]+(?:property|name)=[\'"](?:og:price:amount|product:price:amount|price)[\'"][^>]+content=[\'"]([^\'"]+)[\'"]', html, re.IGNORECASE)
        for m in meta_matches:
            try:
                p_val = float(m.strip().replace("$", "").replace(",", ""))
                candidates.append(PriceCandidate(
                    selector="meta[property='product:price:amount']",
                    xpath="//meta[@property='product:price:amount']",
                    raw_text=m,
                    parsed_price=p_val,
                    currency="$",
                    confidence=0.92,
                    strategy="meta_tag",
                    rationale="OpenGraph / Semantic meta price specification"
                ))
            except Exception:
                pass

        # 3. DOM Regex heuristic
        matches = PRICE_REGEX.findall(html)
        if matches and len(candidates) == 0:
            for curr, val in matches[:5]:
                try:
                    p_val = float(val.replace(",", ""))
                    if p_val > 0.5:
                        candidates.append(PriceCandidate(
                            selector=".product-price, .price-current, [data-price]",
                            xpath="//*[contains(@class, 'price')]",
                            raw_text=f"{curr}{val}",
                            parsed_price=p_val,
                            currency=curr,
                            confidence=0.75,
                            strategy="regex_dom_heuristic",
                            rationale="Heuristic price match within rendered DOM tree"
                        ))
                except Exception:
                    pass

        # Extract page title
        title_match = re.search(r'<title[^>]*>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
        title = title_match.group(1).strip() if title_match else "Live Retailer Item"
        title = re.sub(r'\s+', ' ', title)

        candidates.sort(key=lambda c: c.confidence, reverse=True)
        best = candidates[0] if candidates else None

        return AgentIdentificationResult(
            detected_price=best.parsed_price if best else None,
            currency=best.currency if best else "$",
            primary_selector=best.selector if best else ".product-price",
            fallback_selector="[itemprop='price'], .price-current",
            strategy_used=best.strategy if best else "none",
            confidence_score=best.confidence if best else 0.0,
            candidates=candidates,
            title=title,
            availability="In Stock",
            structured_data_found=len(candidates) > 0 and candidates[0].strategy == "json_ld_schema",
            agent_reasoning=f"Identified {len(candidates)} candidate price elements using autonomous DOM inspection heuristic."
        )
