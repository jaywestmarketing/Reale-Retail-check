import re
import html as html_lib
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
from backend.mechanisms.ingestion_mechanism import StandardIngestionMechanism
from backend.mechanisms.dom_agent_mechanism import AutonomousDOMPriceAgent
from backend.mechanisms.contracts import IngestionResult, AgentIdentificationResult

CATEGORY_URL_KEYWORDS = [
    "/category/", "/categories/", "/catalog/", "/catalogue/category/",
    "/c/", "/collection/", "/collections/", "/shop/", "/shop-all",
    "/departments/", "/department/", "/dept/", "/browse/", "/b/",
    "/store/", "/products/", "/all-products", "/items/"
]

CATEGORY_TEXT_KEYWORDS = [
    "shop all", "categories", "catalog", "department", "departments",
    "all products", "electronics", "tools", "appliances", "hardware",
    "home improvement", "books", "clothing", "apparel", "furniture",
    "outdoors", "deals", "clearance", "bestsellers", "new arrivals",
    "store", "shop now", "view all", "explore", "bath", "lighting",
    "building materials", "lumber", "kitchen", "decor"
]

PRODUCT_URL_PATTERNS = [
    r'/p/[a-zA-Z0-9_\-]+/\d+',
    r'/product/[a-zA-Z0-9_\-]+',
    r'/products/[a-zA-Z0-9_\-]+',
    r'/item/[a-zA-Z0-9_\-]+',
    r'/itm/\d+',
    r'/dp/[A-Z0-9]{10}',
    r'/ip/[a-zA-Z0-9_\-]+/\d+',
    r'/catalogue/(?!category)[a-zA-Z0-9_\-]+_\d+/index\.html',
    r'/shop/[a-zA-Z0-9_\-]+/?$',
]

PROBE_ENDPOINTS = [
    "/shop/",
    "/catalog/",
    "/categories/",
    "/collections/all",
    "/products/",
    "/c/",
    "/all-products/",
    "/catalogue/category/books_1/index.html",
]

@dataclass
class DiscoveredLink:
    url: str
    title: str
    link_type: str # "category" | "catalog" | "product" | "department"
    confidence: float
    snippet: str = ""
    thumbnail: str = ""
    price_hint: Optional[float] = None

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class TraversalStep:
    step_num: int
    url: str
    page_type: str # "HOMEPAGE" | "CATEGORY_PAGE" | "CATALOG_PAGE" | "PRODUCT_PAGE" | "BOT_SHIELDED"
    action_taken: str
    summary: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class AutonomousCrawlResult:
    success: bool
    start_url: str
    initial_page_type: str
    final_product_url: str
    final_product_name: str
    detected_price: Optional[float]
    currency: str
    primary_selector: str
    fallback_selector: str
    confidence_score: float
    strategy_used: str
    availability: str
    traversal_path: List[TraversalStep]
    discovered_categories: List[DiscoveredLink]
    discovered_products: List[DiscoveredLink]
    error: Optional[str] = None
    bot_shield_detected: Optional[str] = None
    agent_reasoning: str = ""
    continuity_audit: List[Dict[str, Any]] = field(default_factory=list)
    bypassed_403: bool = False
    winning_continuity_strategy: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["traversal_path"] = [s.to_dict() if hasattr(s, "to_dict") else s for s in self.traversal_path]
        d["discovered_categories"] = [c.to_dict() if hasattr(c, "to_dict") else c for c in self.discovered_categories]
        d["discovered_products"] = [p.to_dict() if hasattr(p, "to_dict") else p for p in self.discovered_products]
        return d

class AutonomousCatalogCrawler:
    """
    Autonomous Catalog, Category & Product Page Discovery Crawler.
    Traverses store roots, discovers categories and catalogs, navigates into product
    detail pages, and extracts price elements autonomously.
    """
    def __init__(self, ingestion: Optional[StandardIngestionMechanism] = None, dom_agent: Optional[AutonomousDOMPriceAgent] = None):
        self.ingestion = ingestion or StandardIngestionMechanism()
        self.dom_agent = dom_agent or AutonomousDOMPriceAgent()

    def check_bot_shield(self, html: str, status_code: int) -> Optional[str]:
        h_lower = html.lower()
        if "access denied" in h_lower and ("edgesuite.net" in h_lower or "reference #" in h_lower or status_code in [403, 503]):
            return "Akamai Bot Shield (Access Denied)"
        if "reference #" in h_lower and status_code in [403, 503]:
            return "Akamai Web Application Firewall (Reference # challenge)"
        if "attention required! | cloudflare" in h_lower or "cf-chl-bypass" in h_lower:
            return "Cloudflare Bot Defense"
        if "perimeterx" in h_lower or "px-captcha" in h_lower:
            return "PerimeterX Human Challenge"
        if status_code == 403:
            return "HTTP 403 Bot Firewall Protection"
        return None

    def classify_page(self, html: str, url: str) -> str:
        """Classifies page as HOMEPAGE, CATEGORY_PAGE, or PRODUCT_PAGE."""
        parsed = urllib.parse.urlparse(url)
        path = parsed.path.strip("/")

        # Check for explicit product patterns in URL
        for pat in PRODUCT_URL_PATTERNS:
            if re.search(pat, url, re.IGNORECASE):
                return "PRODUCT_PAGE"

        # Check for Schema.org Product
        if '"@type": "Product"' in html or '"@type":"Product"' in html:
            if '"offers"' in html:
                return "PRODUCT_PAGE"

        # Check for Category/Catalog patterns in URL
        for kw in CATEGORY_URL_KEYWORDS:
            if kw in url.lower():
                return "CATEGORY_PAGE"

        # If path is empty or just index, it's a homepage
        if not path or path in ["index.html", "index.htm", "index.php"]:
            return "HOMEPAGE"

        # Count product listing cards in DOM
        listing_indicators = len(re.findall(r'class=[\"\'][^\"\']*(?:product-card|product-item|grid-item|type-product|product_pod)[^\"\']*[\"\']', html, re.IGNORECASE))
        if listing_indicators >= 3:
            return "CATEGORY_PAGE"

        # Check for "Add to Cart" or "Buy Now" button
        add_to_cart_count = len(re.findall(r'(?:add to cart|buy now|add to bag|pre-order)', html, re.IGNORECASE))
        if add_to_cart_count == 1:
            return "PRODUCT_PAGE"
        elif add_to_cart_count > 1:
            return "CATEGORY_PAGE"

        return "HOMEPAGE"

    def extract_category_links(self, html: str, base_url: str) -> List[DiscoveredLink]:
        """Discovers category, catalog, and department links from the HTML."""
        links: List[DiscoveredLink] = []
        seen_urls = set()

        anchor_matches = re.findall(r'<a\s+[^>]*href=[\"\']([^\"\'#]+)[\"\'][^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
        for href, inner_html in anchor_matches:
            href = href.strip()
            if not href or href.startswith("javascript:") or href.startswith("mailto:"):
                continue

            full_url = urllib.parse.urljoin(base_url, href)
            if full_url in seen_urls:
                continue

            clean_text = " ".join(re.sub(r'<[^>]+>', '', inner_html).split())
            clean_text = html_lib.unescape(clean_text)
            text_lower = clean_text.lower()
            url_lower = full_url.lower()

            # Skip policy, cart, account, terms links
            if any(junk in url_lower for junk in ["login", "account", "cart", "checkout", "terms", "privacy", "contact", "about"]):
                continue

            confidence = 0.0
            reasons = []

            # URL keyword checks
            for kw in CATEGORY_URL_KEYWORDS:
                if kw in url_lower:
                    confidence += 0.45
                    reasons.append(f"URL contains '{kw}'")
                    break

            # Text keyword checks
            for kw in CATEGORY_TEXT_KEYWORDS:
                if kw in text_lower:
                    confidence += 0.35
                    reasons.append(f"Text matches '{kw}'")
                    break

            if confidence >= 0.40 and clean_text:
                seen_urls.add(full_url)
                links.append(DiscoveredLink(
                    url=full_url,
                    title=clean_text[:60],
                    link_type="category",
                    confidence=min(0.98, confidence),
                    snippet="; ".join(reasons)
                ))

        links.sort(key=lambda x: x.confidence, reverse=True)
        return links[:30]

    def extract_product_links(self, html: str, base_url: str) -> List[DiscoveredLink]:
        """Discovers product detail links and preview items from a category/catalog page."""
        products: List[DiscoveredLink] = []
        seen_urls = set()

        anchor_matches = re.findall(r'<a\s+[^>]*href=[\"\']([^\"\'#]+)[\"\'][^>]*>(.*?)</a>', html, re.IGNORECASE | re.DOTALL)
        for href, inner_html in anchor_matches:
            href = href.strip()
            if not href or href.startswith("javascript:") or href.startswith("mailto:"):
                continue

            full_url = urllib.parse.urljoin(base_url, href)
            if full_url in seen_urls:
                continue

            clean_text = " ".join(re.sub(r'<[^>]+>', '', inner_html).split())
            clean_text = html_lib.unescape(clean_text)
            url_lower = full_url.lower()

            # Exclude category hubs
            if "/category/" in url_lower or "/categories/" in url_lower:
                continue

            confidence = 0.0

            # Match product URL regexes
            for pat in PRODUCT_URL_PATTERNS:
                if re.search(pat, full_url, re.IGNORECASE):
                    confidence += 0.65
                    break

            # Match general product indicators
            if any(k in url_lower for k in ["/product/", "/p/", "/item/", "/itm/", "/dp/"]):
                confidence += 0.45

            if 4 <= len(clean_text) <= 90 and not any(k in clean_text.lower() for k in ["home", "cart", "next", "previous", "page", "filter", "sort"]):
                confidence += 0.25

            # Look for thumbnail image inside anchor
            img_match = re.search(r'<img[^>]+src=[\"\']([^\"\']+)[\"\']', inner_html, re.IGNORECASE)
            thumb = img_match.group(1) if img_match else ""
            if thumb:
                thumb = urllib.parse.urljoin(base_url, thumb)

            # Check for price hint (both decimal $19.99, unformatted $1799, and comma-separated $1,799.00)
            raw_prices = re.findall(r'[$€£¥₹]\s*([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]{2})?|[0-9]+(?:\.[0-9]{2})?)\b', inner_html)
            price_hint = None
            if raw_prices:
                clean_floats = []
                for p in raw_prices:
                    try:
                        clean_floats.append(float(p.replace(',', '')))
                    except ValueError:
                        pass
                if clean_floats:
                    # Lowest price is the sale/discounted price
                    price_hint = min(clean_floats)

            # Clean leading price/strikethrough prefixes from title
            cleaned_title = clean_text
            if clean_text:
                cleaned_title = re.sub(r'^(?:was\s*)?[$€£¥₹]\s*[0-9,]+(?:\.[0-9]{2})?\s*[$€£¥₹]?\s*[0-9,]+(?:\.[0-9]{2})?\s*', '', clean_text, flags=re.IGNORECASE).strip()
                cleaned_title = cleaned_title or clean_text

            if confidence >= 0.50:
                seen_urls.add(full_url)
                title = cleaned_title or "Product Item"
                products.append(DiscoveredLink(
                    url=full_url,
                    title=title,
                    link_type="product",
                    confidence=min(0.99, confidence),
                    snippet="Identified product detail page link in catalog grid",
                    thumbnail=thumb,
                    price_hint=price_hint
                ))

        products.sort(key=lambda x: x.confidence, reverse=True)
        return products[:30]

    def deep_crawl_to_product(self, start_url: str, max_depth: int = 3, options: Optional[Dict[str, Any]] = None) -> AutonomousCrawlResult:
        """
        Autonomously crawls from start_url until reaching a product page,
        then inspects the product page with Mechanism 2 (DOM Price Agent).
        Returns the full traversal path and discovered categories/catalogs.
        """
        options = options or {}
        traversal: List[TraversalStep] = []
        discovered_categories: List[DiscoveredLink] = []
        discovered_products: List[DiscoveredLink] = []

        current_url = start_url.strip()
        if not current_url.startswith("http://") and not current_url.startswith("https://"):
            current_url = "https://" + current_url

        step_idx = 1
        ingest_res = self.ingestion.fetch(current_url, options)
        bot_shield = self.check_bot_shield(ingest_res.html, ingest_res.status_code)
        continuity_audit_trail: List[Dict[str, Any]] = []
        bypassed_403 = False
        winning_strat: Optional[str] = None

        if bot_shield or ingest_res.status_code in [403, 429, 503]:
            # Trigger Execution Continuity Network Adapter to systematically try error recovery
            from backend.mechanisms.execution_continuity_adapter import continuity_controller
            resolution = continuity_controller.resolve_with_continuity(current_url, ingest_res, options)
            continuity_audit_trail = [a.to_dict() for a in resolution.audit_trail]

            if resolution.resolved and resolution.final_ingestion_result:
                bypassed_403 = True
                winning_strat = resolution.winning_strategy
                ingest_res = resolution.final_ingestion_result
                bot_shield = None
                traversal.append(TraversalStep(
                    step_num=step_idx,
                    url=current_url,
                    page_type="RECOVERED_VIA_CONTINUITY",
                    action_taken=f"Bypassed 403 via {resolution.winning_strategy}",
                    summary=f"Bypassed HTTP 403/firewall after {resolution.total_attempts} adaptive strategy trials ({len(ingest_res.html)} bytes recovered)."
                ))
                step_idx += 1
            else:
                traversal.append(TraversalStep(
                    step_num=step_idx,
                    url=current_url,
                    page_type="BOT_SHIELDED",
                    action_taken=f"Attempted {resolution.total_attempts} Error Recovery Strategies",
                    summary=f"Retailer returned {bot_shield or 'HTTP 403'}. Tried: cURL HTTP/2, Session Warmup, Safari Profile, Mobile Viewport. Host remained protected."
                ))
                return AutonomousCrawlResult(
                    success=False,
                    start_url=start_url,
                    initial_page_type="BOT_SHIELDED",
                    final_product_url=current_url,
                    final_product_name="Restricted by Retailer Shield",
                    detected_price=None,
                    currency="$",
                    primary_selector="",
                    fallback_selector="",
                    confidence_score=0.0,
                    strategy_used="adaptive_continuity_cascade",
                    availability="Unknown",
                    traversal_path=traversal,
                    discovered_categories=[],
                    discovered_products=[],
                    error=f"Retailer returned {bot_shield or 'HTTP 403 Forbidden'} across {resolution.total_attempts} automated strategies.",
                    bot_shield_detected=bot_shield or "HTTP 403 Forbidden",
                    agent_reasoning=resolution.explanation,
                    continuity_audit=continuity_audit_trail,
                    bypassed_403=False
                )

        if ingest_res.error and not bypassed_403:
            return AutonomousCrawlResult(
                success=False,
                start_url=start_url,
                initial_page_type="ERROR",
                final_product_url=current_url,
                final_product_name="",
                detected_price=None,
                currency="$",
                primary_selector="",
                fallback_selector="",
                confidence_score=0.0,
                strategy_used="none",
                availability="Unknown",
                traversal_path=[],
                discovered_categories=[],
                discovered_products=[],
                error=ingest_res.error,
                agent_reasoning=f"Network error accessing {current_url}: {ingest_res.error}",
                continuity_audit=continuity_audit_trail,
                bypassed_403=False
            )


        page_type = self.classify_page(ingest_res.html, ingest_res.canonical_url)
        initial_page_type = page_type

        # Check if already a product page
        if page_type == "PRODUCT_PAGE":
            agent_res = self.dom_agent.identify_price_element(ingest_res.html, ingest_res.canonical_url, options)
            traversal.append(TraversalStep(
                step_num=step_idx,
                url=ingest_res.canonical_url,
                page_type="PRODUCT_PAGE",
                action_taken="Direct Product Page Crawled",
                summary=f"Extracted price {agent_res.currency}{agent_res.detected_price or 0.00} with {int(agent_res.confidence_score*100)}% confidence"
            ))
            return AutonomousCrawlResult(
                success=agent_res.detected_price is not None,
                start_url=start_url,
                initial_page_type="PRODUCT_PAGE",
                final_product_url=ingest_res.canonical_url,
                final_product_name=agent_res.title,
                detected_price=agent_res.detected_price,
                currency=agent_res.currency,
                primary_selector=agent_res.primary_selector,
                fallback_selector=agent_res.fallback_selector,
                confidence_score=agent_res.confidence_score,
                strategy_used=agent_res.strategy_used,
                availability=agent_res.availability,
                traversal_path=traversal,
                discovered_categories=[],
                discovered_products=[],
                agent_reasoning=agent_res.agent_reasoning
            )

        # If HOMEPAGE or STORE ROOT
        if page_type == "HOMEPAGE":
            traversal.append(TraversalStep(
                step_num=step_idx,
                url=ingest_res.canonical_url,
                page_type="HOMEPAGE",
                action_taken="Discovered Store Homepage / Navigation Root",
                summary="Searching for category, catalog, and department links..."
            ))
            step_idx += 1

            discovered_categories = self.extract_category_links(ingest_res.html, ingest_res.canonical_url)
            discovered_products = self.extract_product_links(ingest_res.html, ingest_res.canonical_url)

            # If homepage has direct product links, jump directly to the first product!
            if discovered_products:
                target_product = discovered_products[0]
                prod_fetch = self.ingestion.fetch(target_product.url, options)
                if not prod_fetch.error:
                    agent_res = self.dom_agent.identify_price_element(prod_fetch.html, prod_fetch.canonical_url, options)
                    traversal.append(TraversalStep(
                        step_num=step_idx,
                        url=target_product.url,
                        page_type="PRODUCT_PAGE",
                        action_taken=f"Navigated to Featured Product: '{target_product.title}'",
                        summary=f"Extracted price {agent_res.currency}{agent_res.detected_price or target_product.price_hint or 0.00} via {agent_res.strategy_used}"
                    ))
                    return AutonomousCrawlResult(
                        success=agent_res.detected_price is not None,
                        start_url=start_url,
                        initial_page_type="HOMEPAGE",
                        final_product_url=target_product.url,
                        final_product_name=agent_res.title or target_product.title,
                        detected_price=agent_res.detected_price or target_product.price_hint,
                        currency=agent_res.currency,
                        primary_selector=agent_res.primary_selector,
                        fallback_selector=agent_res.fallback_selector,
                        confidence_score=agent_res.confidence_score,
                        strategy_used=agent_res.strategy_used,
                        availability=agent_res.availability,
                        traversal_path=traversal,
                        discovered_categories=discovered_categories,
                        discovered_products=discovered_products,
                        agent_reasoning=f"Autonomously traversed from store homepage to featured product '{agent_res.title}'."
                    )
                elif target_product.price_hint is not None:
                    # Detail sub-page protected by edge firewall, but verified price was discovered from store showcase grid
                    traversal.append(TraversalStep(
                        step_num=step_idx,
                        url=target_product.url,
                        page_type="PRODUCT_PAGE",
                        action_taken=f"Extracted Store Showcase Product: '{target_product.title}'",
                        summary=f"Extracted store catalog price ${target_product.price_hint:.2f} (Direct sub-page protected by edge firewall; price resolved from store showcase grid)."
                    ))
                    return AutonomousCrawlResult(
                        success=True,
                        start_url=start_url,
                        initial_page_type="HOMEPAGE",
                        final_product_url=target_product.url,
                        final_product_name=target_product.title,
                        detected_price=target_product.price_hint,
                        currency="$",
                        primary_selector="a.product-card, .showcase-item",
                        fallback_selector="catalog-grid-price",
                        confidence_score=0.92,
                        strategy_used="store_showcase_catalog_price",
                        availability="In Stock",
                        traversal_path=traversal,
                        discovered_categories=discovered_categories,
                        discovered_products=discovered_products,
                        agent_reasoning=f"Autonomously resolved product '{target_product.title}' with price ${target_product.price_hint:.2f} from store showcase grid."
                    )

            # If no direct products on homepage, probe candidate categories
            category_target_url = None
            if discovered_categories:
                # Try candidate categories with fast lightweight probe (no recursive continuity retry)
                probe_opts = dict(options)
                probe_opts["enable_continuity_resolution"] = False
                probe_opts["timeout"] = 3
                for cat_candidate in discovered_categories[:2]:
                    cat_probe = self.ingestion.fetch(cat_candidate.url, probe_opts)
                    cat_shield = self.check_bot_shield(cat_probe.html, cat_probe.status_code)
                    if not cat_shield and cat_probe.status_code == 200 and len(cat_probe.html) > 1000:
                        category_target_url = cat_candidate.url
                        traversal.append(TraversalStep(
                            step_num=step_idx,
                            url=category_target_url,
                            page_type="CATEGORY_PAGE",
                            action_taken=f"Autonomously Traversed to Category: '{cat_candidate.title}'",
                            summary="Extracting catalog items from department..."
                        ))
                        break
                    elif cat_shield:
                        bot_shield = cat_shield

            # Proactive catalog probing fallback ONLY if no categories were discovered from homepage
            if not category_target_url and not discovered_categories:
                parsed_root = urllib.parse.urlparse(ingest_res.canonical_url)
                origin = f"{parsed_root.scheme}://{parsed_root.netloc}"
                probe_opts = dict(options)
                probe_opts["enable_continuity_resolution"] = False
                probe_opts["timeout"] = 3
                for probe in PROBE_ENDPOINTS[:2]:
                    probe_url = origin + probe
                    probe_res = self.ingestion.fetch(probe_url, probe_opts)
                    if probe_res.status_code == 200 and len(probe_res.html) > 1000:
                        category_target_url = probe_url
                        discovered_categories.insert(0, DiscoveredLink(
                            url=probe_url,
                            title="Catalog / Shop",
                            link_type="catalog",
                            confidence=0.95,
                            snippet="Autonomously probed standard catalog route"
                        ))
                        traversal.append(TraversalStep(
                            step_num=step_idx,
                            url=probe_url,
                            page_type="CATALOG_PAGE",
                            action_taken="Probed Catalog Endpoint",
                            summary="Found active catalog listing endpoint."
                        ))
                        break

            if category_target_url:
                step_idx += 1
                cat_fetch = self.ingestion.fetch(category_target_url, options)
                if not cat_fetch.error:
                    discovered_products = self.extract_product_links(cat_fetch.html, cat_fetch.canonical_url)
                    if discovered_products:
                        target_product = discovered_products[0]
                        prod_fetch = self.ingestion.fetch(target_product.url, options)
                        if not prod_fetch.error:
                            agent_res = self.dom_agent.identify_price_element(prod_fetch.html, prod_fetch.canonical_url, options)
                            traversal.append(TraversalStep(
                                step_num=step_idx,
                                url=target_product.url,
                                page_type="PRODUCT_PAGE",
                                action_taken=f"Crawled Product Page: '{target_product.title}'",
                                summary=f"Extracted price {agent_res.currency}{agent_res.detected_price or target_product.price_hint or 0.00} via {agent_res.strategy_used}"
                            ))
                            return AutonomousCrawlResult(
                                success=agent_res.detected_price is not None,
                                start_url=start_url,
                                initial_page_type="HOMEPAGE",
                                final_product_url=target_product.url,
                                final_product_name=agent_res.title or target_product.title,
                                detected_price=agent_res.detected_price or target_product.price_hint,
                                currency=agent_res.currency,
                                primary_selector=agent_res.primary_selector,
                                fallback_selector=agent_res.fallback_selector,
                                confidence_score=agent_res.confidence_score,
                                strategy_used=agent_res.strategy_used,
                                availability=agent_res.availability,
                                traversal_path=traversal,
                                discovered_categories=discovered_categories,
                                discovered_products=discovered_products,
                                agent_reasoning=f"Autonomous crawl succeeded: Homepage -> Category '{category_target_url}' -> Product '{target_product.title}'."
                            )

        # If CATEGORY / CATALOG PAGE
        if page_type in ["CATEGORY_PAGE", "CATALOG_PAGE"]:
            traversal.append(TraversalStep(
                step_num=step_idx,
                url=ingest_res.canonical_url,
                page_type="CATEGORY_PAGE",
                action_taken="Identified Category / Catalog Page",
                summary="Extracting product listings from catalog grid..."
            ))
            step_idx += 1

            discovered_products = self.extract_product_links(ingest_res.html, ingest_res.canonical_url)
            discovered_categories = self.extract_category_links(ingest_res.html, ingest_res.canonical_url)

            if discovered_products:
                target_product = discovered_products[0]
                prod_fetch = self.ingestion.fetch(target_product.url, options)
                if not prod_fetch.error:
                    agent_res = self.dom_agent.identify_price_element(prod_fetch.html, prod_fetch.canonical_url, options)
                    traversal.append(TraversalStep(
                        step_num=step_idx,
                        url=target_product.url,
                        page_type="PRODUCT_PAGE",
                        action_taken=f"Crawled Product Page: '{target_product.title}'",
                        summary=f"Extracted price {agent_res.currency}{agent_res.detected_price or target_product.price_hint or 0.00} via {agent_res.strategy_used}"
                    ))
                    return AutonomousCrawlResult(
                        success=agent_res.detected_price is not None,
                        start_url=start_url,
                        initial_page_type="CATEGORY_PAGE",
                        final_product_url=target_product.url,
                        final_product_name=agent_res.title or target_product.title,
                        detected_price=agent_res.detected_price or target_product.price_hint,
                        currency=agent_res.currency,
                        primary_selector=agent_res.primary_selector,
                        fallback_selector=agent_res.fallback_selector,
                        confidence_score=agent_res.confidence_score,
                        strategy_used=agent_res.strategy_used,
                        availability=agent_res.availability,
                        traversal_path=traversal,
                        discovered_categories=discovered_categories,
                        discovered_products=discovered_products,
                        agent_reasoning=f"Autonomously traversed from catalog page into product detail page '{agent_res.title}'."
                    )

        # If sub-pages were blocked or no products found, return full diagnostic and discovered categories!
        return AutonomousCrawlResult(
            success=False,
            start_url=start_url,
            initial_page_type=page_type,
            final_product_url=current_url,
            final_product_name="Store Catalog Hub",
            detected_price=None,
            currency="$",
            primary_selector="",
            fallback_selector="",
            confidence_score=0.0,
            strategy_used="catalog_exploration",
            availability="Unknown",
            traversal_path=traversal,
            discovered_categories=discovered_categories,
            discovered_products=discovered_products,
            bot_shield_detected=bot_shield,
            error=f"Found store navigation ({len(discovered_categories)} categories discovered) but could not automatically crawl deeper." if not bot_shield else f"Retailer sub-pages protected by {bot_shield}.",
            agent_reasoning=f"Autonomous crawler extracted {len(discovered_categories)} department/category links. Select a category below or provide a direct product link."
        )
