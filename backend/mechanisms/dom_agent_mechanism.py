import re
import json
import html as html_lib
from html.parser import HTMLParser
from typing import List, Dict, Any, Optional, Tuple
from backend.mechanisms.contracts import (
    DOMAgentMechanismContract,
    AgentIdentificationResult,
    PriceCandidate,
)

PRICE_REGEX = re.compile(
    r'(?:([$€£¥₹]|USD|CAD|EUR|GBP|AUD|INR)\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\b|\b([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\s*([$€£¥₹]|USD|CAD|EUR|GBP|AUD|INR))'
)
PLAIN_NUM_REGEX = re.compile(r'\b([0-9]{1,4}\.[0-9]{2})\b')

# Structural elements that should be heavily penalized (NOT the main product price)
NOISE_CONTAINER_KEYWORDS = [
    "cart", "basket", "header", "nav", "menu", "footer", "mini-cart",
    "sidebar", "subtotal", "shipping", "tax", "breadcrumb", "recommendation",
    "carousel", "related", "banner", "modal"
]

class DOMNode:
    def __init__(self, tag: str, attrs: Dict[str, str], parent=None):
        self.tag = tag
        self.attrs = attrs
        self.parent = parent
        self.children: List['DOMNode'] = []
        self.text_parts: List[str] = []

    @property
    def inner_text(self) -> str:
        raw = " ".join(" ".join(self.text_parts).split())
        return html_lib.unescape(raw)

    def get_selector(self) -> str:
        """Derives a resilient CSS selector for this element."""
        # 1. Unique ID
        el_id = self.attrs.get("id") or ""
        if el_id and not re.search(r'\d{6,}', el_id):
            return f"#{el_id}"

        # 2. Data automation / test attributes
        for attr in ["data-automation-id", "data-testid", "data-test"]:
            if attr in self.attrs and self.attrs[attr]:
                return f"{self.tag}[{attr}='{self.attrs[attr]}']"

        # 3. Itemprop
        if self.attrs.get("itemprop"):
            return f"{self.tag}[itemprop='{self.attrs['itemprop']}']"

        # 4. Semantic classes
        classes = (self.attrs.get("class") or "").split()
        meaningful_classes = [
            c for c in classes
            if any(k in c.lower() for k in ["price", "cost", "hero", "current", "amount", "sale"])
            and not re.search(r'[\d_-]{8,}', c)
        ]
        if meaningful_classes:
            cls_str = "." + ".".join(meaningful_classes[:2])
            if self.parent and self.parent.tag != "body" and self.parent.tag != "document":
                parent_sel = self.parent.get_selector()
                return f"{parent_sel} > {self.tag}{cls_str}"
            return f"{self.tag}{cls_str}"

        # 5. Tag and nth-child fallback
        if self.parent:
            parent_sel = self.parent.get_selector()
            try:
                idx = self.parent.children.index(self) + 1
            except ValueError:
                idx = 1
            return f"{parent_sel} > {self.tag}:nth-child({idx})"

        return self.tag

    def get_xpath(self) -> str:
        """Derives an XPath expression."""
        if self.attrs.get("id"):
            return f"//*[@id='{self.attrs['id']}']"
        if self.attrs.get("itemprop"):
            return f"//{self.tag}[@itemprop='{self.attrs['itemprop']}']"
        if self.attrs.get("class"):
            cls_list = (self.attrs["class"] or "").split()
            if cls_list:
                return f"//{self.tag}[contains(@class, '{cls_list[0]}')]"
        return f"//{self.tag}"

class LightweightDOMParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.root = DOMNode("document", {})
        self.current = self.root
        self.all_nodes: List[DOMNode] = []
        self.json_ld_scripts: List[str] = []
        self.in_script = False
        self.script_type = ""
        self.title_text = ""
        self.in_title = False
        self.h1_text = ""
        self.in_h1 = False

    def handle_starttag(self, tag, attrs):
        # Guarantee all attribute keys and values are non-None strings
        attr_dict = {str(k).lower(): (str(v) if v is not None else "") for k, v in attrs}
        if tag == "script":
            self.in_script = True
            self.script_type = attr_dict.get("type", "")
        if tag == "title":
            self.in_title = True
        if tag == "h1":
            self.in_h1 = True

        node = DOMNode(tag, attr_dict, parent=self.current)
        self.current.children.append(node)
        self.current = node
        self.all_nodes.append(node)

    def handle_endtag(self, tag):
        if tag == "script":
            self.in_script = False
        if tag == "title":
            self.in_title = False
        if tag == "h1":
            self.in_h1 = False
        if self.current.parent:
            self.current = self.current.parent

    def handle_data(self, data):
        cleaned = data.strip()
        if not cleaned:
            return
        if self.in_title:
            self.title_text += (" " + cleaned)
        if self.in_h1:
            self.h1_text += (" " + cleaned)
        if self.in_script and "application/ld+json" in self.script_type:
            self.json_ld_scripts.append(data)
        elif not self.in_script:
            self.current.text_parts.append(cleaned)

class AutonomousDOMPriceAgent(DOMAgentMechanismContract):
    """
    Mechanism 2: Autonomous Agentic Element Identification & Discovery.
    Inspects live HTML upon first visit, discovers price elements via Schema.org JSON-LD,
    Microdata, currency regexes, visual hierarchy, and synthesizes resilient selectors.
    """
    def __init__(self, confidence_threshold: float = 0.40):
        self.confidence_threshold = confidence_threshold

    def _parse_price_value(self, text: str) -> Tuple[Optional[float], str]:
        clean = html_lib.unescape(text)
        match = PRICE_REGEX.search(clean)
        if match:
            # Group 1 & 2: prefix currency, number
            if match.group(1) and match.group(2):
                curr = match.group(1)
                num_str = match.group(2).replace(",", "")
                try:
                    return float(num_str), curr
                except ValueError:
                    pass
            # Group 3 & 4: number, suffix currency
            elif match.group(3) and match.group(4):
                num_str = match.group(3).replace(",", "")
                curr = match.group(4)
                try:
                    return float(num_str), curr
                except ValueError:
                    pass

        # Plain number fallback
        p_match = PLAIN_NUM_REGEX.search(clean)
        if p_match:
            try:
                return float(p_match.group(1)), "$"
            except ValueError:
                pass
        return None, "$"

    def _extract_json_ld(self, json_ld_scripts: List[str]) -> List[PriceCandidate]:
        candidates = []
        for raw in json_ld_scripts:
            try:
                data = json.loads(raw)
                items = data if isinstance(data, list) else [data]
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    # Check graph structure if present
                    sub_items = item.get("@graph", [item])
                    for sub in sub_items:
                        if not isinstance(sub, dict):
                            continue
                        if sub.get("@type") in ["Product", "IndividualProduct"] or "offers" in sub:
                            offers = sub.get("offers")
                            if isinstance(offers, list):
                                offers = offers[0] if offers else {}
                            if isinstance(offers, dict):
                                raw_p = offers.get("price")
                                if raw_p is not None:
                                    try:
                                        p_val = float(str(raw_p).replace(",", ""))
                                        if p_val > 0.0:
                                            curr = offers.get("priceCurrency", "USD")
                                            curr_sym = "$" if curr == "USD" else ("€" if curr == "EUR" else ("£" if curr == "GBP" else curr))
                                            candidates.append(PriceCandidate(
                                                selector='script[type="application/ld+json"] -> offers.price',
                                                xpath='//script[@type="application/ld+json"]',
                                                raw_text=f"{curr_sym}{p_val:.2f}",
                                                parsed_price=p_val,
                                                currency=curr_sym,
                                                confidence=0.98,
                                                strategy="json_ld_structured_data",
                                                attributes=offers,
                                                rationale="Direct Schema.org/Product structured data embedded by retailer with canonical offer price."
                                            ))
                                    except ValueError:
                                        pass
            except Exception:
                continue
        return candidates

    def identify_price_element(self, html: str, url: str, options: Optional[Dict[str, Any]] = None) -> AgentIdentificationResult:
        options = options or {}
        parser = LightweightDOMParser()
        try:
            parser.feed(html)
        except Exception:
            pass

        candidates: List[PriceCandidate] = []

        # 1. Check JSON-LD
        json_candidates = self._extract_json_ld(parser.json_ld_scripts)
        candidates.extend(json_candidates)

        # 2. Check meta tags for prices
        for node in parser.all_nodes:
            if node.tag == "meta":
                prop = (node.attrs.get("property", "") or node.attrs.get("name", "") or node.attrs.get("itemprop", "")).lower()
                content = node.attrs.get("content", "")
                if ("price" in prop or "amount" in prop) and content:
                    val, curr = self._parse_price_value(content)
                    if val is not None and val > 0.0:
                        candidates.append(PriceCandidate(
                            selector=f"meta[{'property' if 'property' in node.attrs else 'name'}='{prop}']",
                            xpath=f"//meta[@{ 'property' if 'property' in node.attrs else 'name' }='{prop}']",
                            raw_text=content,
                            parsed_price=val,
                            currency=curr,
                            confidence=0.88,
                            strategy="meta_property_tag",
                            attributes=node.attrs,
                            rationale=f"Found explicit OpenGraph/schema meta price tag: {prop}"
                        ))

        # 3. Analyze DOM visual nodes
        for node in parser.all_nodes:
            if node.tag in ["script", "style", "head", "noscript", "svg", "path", "meta", "link"]:
                continue

            txt = node.inner_text
            if not txt:
                continue

            val, curr = self._parse_price_value(txt)
            if val is None or val <= 0.0:
                continue

            # Heuristic Scoring
            score = 0.50
            reasons = []

            # Check ancestor lineage for noise (cart, nav, footer, header)
            ancestor_str = ""
            curr_ancestor = node
            while curr_ancestor:
                c_val = curr_ancestor.attrs.get("class") or ""
                id_val = curr_ancestor.attrs.get("id") or ""
                c_str = f"{c_val} {id_val}".strip()
                if c_str:
                    ancestor_str += (" " + c_str.lower())
                curr_ancestor = curr_ancestor.parent

            # Noise Penalty
            if any(noise in ancestor_str for noise in NOISE_CONTAINER_KEYWORDS):
                score -= 0.45
                reasons.append("Element located inside header/cart/footer/navigation (-45%)")

            # Strike-through / list price penalty
            node_cls = node.attrs.get("class") or ""
            node_id = node.attrs.get("id") or ""
            classes_str = f"{node_cls} {node_id}".lower()
            if any(term in classes_str for term in ["strike", "was", "original", "list-price", "basisprice", "regular", "old-price"]):
                score -= 0.35
                reasons.append("Element flagged as strikethrough/original price (-35%)")

            # Positive indicators
            if "itemprop" in node.attrs and node.attrs["itemprop"] == "price":
                score += 0.35
                reasons.append("Explicit schema itemprop='price' (+35%)")

            if any(term in classes_str for term in ["pricetopay", "priceview-hero", "current-price", "saleprice", "price_color", "woocommerce-price"]):
                score += 0.30
                reasons.append("High-intent current price class match (+30%)")

            if any(attr in node.attrs for attr in ["data-automation-id", "data-testid", "data-test"]):
                score += 0.20
                reasons.append("Dedicated test/automation price attribute (+20%)")

            # Currency symbol match
            if any(s in txt for s in ["$", "€", "£", "¥", "₹"]):
                score += 0.15
                reasons.append("Direct currency symbol match (+15%)")

            # Length penalty: If node is too long, it's not a clean price element
            if len(txt) > 30:
                score -= 0.25
                reasons.append("Lengthy text block rather than clean price tag (-25%)")

            # Sanity bound
            final_conf = max(0.05, min(0.99, score))

            if final_conf >= self.confidence_threshold:
                candidates.append(PriceCandidate(
                    selector=node.get_selector(),
                    xpath=node.get_xpath(),
                    raw_text=txt,
                    parsed_price=val,
                    currency=curr,
                    confidence=round(final_conf, 2),
                    strategy="dom_element_heuristic",
                    attributes=node.attrs,
                    rationale="; ".join(reasons) or "Visual price node identified on page."
                ))

        # Sort candidates by confidence descending
        candidates.sort(key=lambda c: c.confidence, reverse=True)

        # Detect availability
        availability = "In Stock"
        html_lower = html.lower()
        if "out of stock" in html_lower or "currently unavailable" in html_lower or "sold out" in html_lower:
            availability = "Out of Stock"
        elif "pre-order" in html_lower:
            availability = "Pre-Order"

        # Determine product title
        title = parser.h1_text.strip() or parser.title_text.strip() or "Tracked Product"
        title = html_lib.unescape(title)
        # Clean title suffixes
        title = re.sub(r'\s*[-|]\s*(Amazon\.com|Walmart|Best Buy|Target|eBay).*$', '', title, flags=re.IGNORECASE).strip()

        primary = candidates[0] if candidates else None
        fallback = candidates[1] if len(candidates) > 1 else primary

        if primary:
            return AgentIdentificationResult(
                detected_price=primary.parsed_price,
                currency=primary.currency,
                primary_selector=primary.selector,
                fallback_selector=fallback.selector if fallback else primary.selector,
                strategy_used=primary.strategy,
                confidence_score=primary.confidence,
                candidates=candidates[:6],
                title=title,
                availability=availability,
                structured_data_found=len(json_candidates) > 0,
                agent_reasoning=f"Identified primary price {primary.currency}{primary.parsed_price:.2f} with {int(primary.confidence*100)}% confidence using {primary.strategy}. {primary.rationale}"
            )
        else:
            return AgentIdentificationResult(
                detected_price=None,
                currency="$",
                primary_selector=".product-price",
                fallback_selector="//span[contains(@class, 'price')]",
                strategy_used="none",
                confidence_score=0.0,
                candidates=[],
                title=title,
                availability=availability,
                structured_data_found=False,
                agent_reasoning="No unambiguous price element was detected on the page. You may specify a custom selector."
            )
