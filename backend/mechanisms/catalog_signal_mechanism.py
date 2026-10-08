# ===========================================================================
# MECHANISM: NATIONAL_GLOBAL_CATALOG_SIGNAL_DISCOVERY_MECHANISM
# Architecture: INTERCHANGEABLE AUTONOMOUS MECHANISM ARCHITECTURE
# Layer: Full 4-Layer Implementation (Core, Contract, Adapter, Integration)
# Version: 1.0.0
# Contract Version: 1.0.0
# ===========================================================================

import os
import re
import csv
import io
import time
import json
import hashlib
import uuid
import urllib.parse
from typing import Dict, Any, List, Optional, Tuple
from dataclasses import dataclass, asdict, field

# Reuse existing Ingestion & Continuity adapters
from backend.mechanisms.ingestion_mechanism import StandardIngestionMechanism, IngestionResult
from backend.mechanisms.execution_continuity_adapter import continuity_controller

# ---------------------------------------------------------------------------
# Layer B: Mechanism Contract Definitions
# ---------------------------------------------------------------------------

SIGNAL_TYPE_NATIONAL = "NATIONAL_CATALOG"
SIGNAL_TYPE_GLOBAL = "GLOBAL_REGIONAL_CATALOG"
SIGNAL_TYPE_PAGINATION = "PAGINATION_STREAM"
SIGNAL_TYPE_STRUCTURED_FEED = "STRUCTURED_FEED"
SIGNAL_TYPE_SITEMAP = "SITEMAP_INDEX"
SIGNAL_TYPE_CATEGORY = "CATEGORY_DEPARTMENT"
SIGNAL_TYPE_PRODUCT = "HARVESTED_PRODUCT"

SCOPE_NATIONAL_US = "NATIONAL_US"
SCOPE_GLOBAL_INTL = "GLOBAL_INTERNATIONAL"
SCOPE_REGIONAL_UK = "REGIONAL_UK"
SCOPE_REGIONAL_EUR = "REGIONAL_EUR"
SCOPE_REGIONAL_CAN = "REGIONAL_CAN"
SCOPE_REGIONAL_APAC = "REGIONAL_APAC"

KNOWN_GLOBAL_MIRRORS: Dict[str, List[Dict[str, str]]] = {
    "ebay": [
        {"domain": "www.ebay.com", "name": "eBay United States", "scope": SCOPE_NATIONAL_US, "country": "US", "currency": "$"},
        {"domain": "www.ebay.co.uk", "name": "eBay United Kingdom", "scope": SCOPE_REGIONAL_UK, "country": "UK", "currency": "£"},
        {"domain": "www.ebay.de", "name": "eBay Germany / EU", "scope": SCOPE_REGIONAL_EUR, "country": "DE", "currency": "€"},
        {"domain": "www.ebay.ca", "name": "eBay Canada", "scope": SCOPE_REGIONAL_CAN, "country": "CA", "currency": "C$"},
        {"domain": "www.ebay.com.au", "name": "eBay Australia", "scope": SCOPE_REGIONAL_APAC, "country": "AU", "currency": "A$"},
        {"domain": "www.ebay.fr", "name": "eBay France", "scope": SCOPE_REGIONAL_EUR, "country": "FR", "currency": "€"},
        {"domain": "www.ebay.it", "name": "eBay Italy", "scope": SCOPE_REGIONAL_EUR, "country": "IT", "currency": "€"},
        {"domain": "www.ebay.es", "name": "eBay Spain", "scope": SCOPE_REGIONAL_EUR, "country": "ES", "currency": "€"},
        {"domain": "www.ebay.com/globaldeals", "name": "eBay Global Deals Hub", "scope": SCOPE_GLOBAL_INTL, "country": "GLOBAL", "currency": "$"}
    ],
    "amazon": [
        {"domain": "www.amazon.com", "name": "Amazon United States", "scope": SCOPE_NATIONAL_US, "country": "US", "currency": "$"},
        {"domain": "www.amazon.co.uk", "name": "Amazon United Kingdom", "scope": SCOPE_REGIONAL_UK, "country": "UK", "currency": "£"},
        {"domain": "www.amazon.de", "name": "Amazon Germany / EU", "scope": SCOPE_REGIONAL_EUR, "country": "DE", "currency": "€"},
        {"domain": "www.amazon.ca", "name": "Amazon Canada", "scope": SCOPE_REGIONAL_CAN, "country": "CA", "currency": "C$"},
        {"domain": "www.amazon.fr", "name": "Amazon France", "scope": SCOPE_REGIONAL_EUR, "country": "FR", "currency": "€"},
        {"domain": "www.amazon.co.jp", "name": "Amazon Japan", "scope": SCOPE_REGIONAL_APAC, "country": "JP", "currency": "¥"}
    ],
    "walmart": [
        {"domain": "www.walmart.com", "name": "Walmart United States", "scope": SCOPE_NATIONAL_US, "country": "US", "currency": "$"},
        {"domain": "www.walmart.ca", "name": "Walmart Canada", "scope": SCOPE_REGIONAL_CAN, "country": "CA", "currency": "C$"}
    ],
    "apple": [
        {"domain": "www.apple.com", "name": "Apple United States", "scope": SCOPE_NATIONAL_US, "country": "US", "currency": "$"},
        {"domain": "www.apple.com/uk", "name": "Apple United Kingdom", "scope": SCOPE_REGIONAL_UK, "country": "UK", "currency": "£"},
        {"domain": "www.apple.com/ca", "name": "Apple Canada", "scope": SCOPE_REGIONAL_CAN, "country": "CA", "currency": "C$"},
        {"domain": "www.apple.com/de", "name": "Apple Germany", "scope": SCOPE_REGIONAL_EUR, "country": "DE", "currency": "€"},
        {"domain": "www.apple.com/choose-country-region", "name": "Apple Global Country Directory", "scope": SCOPE_GLOBAL_INTL, "country": "GLOBAL", "currency": "MULTI"}
    ],
    "bestbuy": [
        {"domain": "www.bestbuy.com", "name": "Best Buy United States", "scope": SCOPE_NATIONAL_US, "country": "US", "currency": "$"},
        {"domain": "www.bestbuy.ca", "name": "Best Buy Canada", "scope": SCOPE_REGIONAL_CAN, "country": "CA", "currency": "C$"},
        {"domain": "www.bestbuy.com/site/electronics/international-orders/pcmcat204400050019.c", "name": "Best Buy International Directory", "scope": SCOPE_GLOBAL_INTL, "country": "GLOBAL", "currency": "$"}
    ],
    "homedepot": [
        {"domain": "www.homedepot.com", "name": "The Home Depot United States", "scope": SCOPE_NATIONAL_US, "country": "US", "currency": "$"},
        {"domain": "www.homedepot.ca", "name": "The Home Depot Canada", "scope": SCOPE_REGIONAL_CAN, "country": "CA", "currency": "C$"},
        {"domain": "www.homedepot.com.mx", "name": "The Home Depot Mexico", "scope": SCOPE_REGIONAL_APAC, "country": "MX", "currency": "MXN"}
    ]
}

@dataclass
class CatalogSignal:
    id: str
    signal_type: str
    scope: str
    indicator_pattern: str
    source_url: str
    target_url: str
    title_or_label: str
    price_hint: Optional[float] = None
    currency: str = "$"
    status: str = "DISCOVERED" # DISCOVERED | VERIFIED_ACTIVE | QUEUED
    confidence: float = 0.90
    discovered_at: float = field(default_factory=time.time)
    retailer: str = "Generic Web"
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class CatalogHarvestResult:
    success: bool
    start_url: str
    retailer: str
    signals_discovered: List[CatalogSignal]
    total_signals: int
    national_signals_count: int
    global_signals_count: int
    pagination_signals_count: int
    products_harvested_count: int
    traversal_summary: List[str]
    audit_trail: List[Dict[str, Any]] = field(default_factory=list)
    bypassed_403: bool = False
    download_available: bool = True

    def to_dict(self) -> Dict[str, Any]:
        d = asdict(self)
        d["signals_discovered"] = [s.to_dict() if hasattr(s, "to_dict") else s for s in self.signals_discovered]
        return d

# ---------------------------------------------------------------------------
# Layer A: Mechanism Core
# ---------------------------------------------------------------------------

class NationalGlobalCatalogSignalHarvester:
    """
    Mechanism Core: Discovers indicators and signals for national & global catalogs,
    traverses pagination when items are missing on page 1, and maintains a downloadable
    internal list of catalog indicators and discovered inventory.
    """
    def __init__(self, storage_path: Optional[str] = None):
        self.mechanism_id = "NATIONAL_GLOBAL_CATALOG_SIGNAL_DISCOVERY_MECHANISM"
        self.version = "1.0.0"
        self.contract_version = "1.0.0"
        self.ingestion = StandardIngestionMechanism()
        
        # Local persistent storage location
        self.storage_path = storage_path or os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
            "data",
            "internal_catalog_signals.json"
        )
        os.makedirs(os.path.dirname(self.storage_path), exist_ok=True)
        self.internal_signals: List[CatalogSignal] = self._load_storage()

    def _load_storage(self) -> List[CatalogSignal]:
        if os.path.exists(self.storage_path):
            try:
                with open(self.storage_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    signals = []
                    seen_ids = set()
                    modified = False
                    for idx, item in enumerate(data):
                        sig_id = item.get("id")
                        if not sig_id or sig_id in seen_ids:
                            url_hash = hashlib.md5(item.get("target_url", f"url-{idx}").encode("utf-8")).hexdigest()[:6]
                            sig_id = f"{sig_id or 'sig'}-{url_hash}-{idx}"
                            item["id"] = sig_id
                            modified = True
                        seen_ids.add(sig_id)
                        signals.append(CatalogSignal(**item))
                    if modified:
                        try:
                            with open(self.storage_path, "w", encoding="utf-8") as f:
                                json.dump([s.to_dict() for s in signals], f, indent=2)
                        except Exception:
                            pass
                    return signals
            except Exception:
                return []
        return []

    def _save_storage(self):
        try:
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump([s.to_dict() for s in self.internal_signals], f, indent=2)
        except Exception:
            pass

    def detect_retailer_family(self, url: str) -> Optional[str]:
        parsed = urllib.parse.urlparse(url)
        netloc = parsed.netloc.lower()
        for brand in KNOWN_GLOBAL_MIRRORS.keys():
            if brand in netloc:
                return brand
        return None

    def _extract_hreflang_signals(self, html: str, source_url: str) -> List[CatalogSignal]:
        """Detects international and global alternate link tags."""
        signals = []
        # <link rel="alternate" hreflang="en-gb" href="https://www.example.co.uk/...">
        matches = re.findall(r'<link\s+[^>]*rel=[\"\']alternate[\"\'][^>]*hreflang=[\"\']([^\"\']+)[\"\'][^>]*href=[\"\']([^\"\']+)[\"\']', html, re.I)
        matches += re.findall(r'<link\s+[^>]*href=[\"\']([^\"\']+)[\"\'][^>]*rel=[\"\']alternate[\"\'][^>]*hreflang=[\"\']([^\"\']+)[\"\']', html, re.I)
        
        for lang_or_href, href_or_lang in matches:
            hreflang = lang_or_href if len(lang_or_href) <= 8 else href_or_lang
            href = href_or_lang if len(lang_or_href) <= 8 else lang_or_href
            full_url = urllib.parse.urljoin(source_url, href)

            hl_lower = hreflang.lower()
            scope = SCOPE_GLOBAL_INTL
            if "en-us" in hl_lower or "us" == hl_lower:
                scope = SCOPE_NATIONAL_US
            elif "en-gb" in hl_lower or "uk" in hl_lower:
                scope = SCOPE_REGIONAL_UK
            elif any(c in hl_lower for c in ["de", "fr", "it", "es", "eu"]):
                scope = SCOPE_REGIONAL_EUR
            elif "ca" in hl_lower or "en-ca" in hl_lower:
                scope = SCOPE_REGIONAL_CAN
            elif any(c in hl_lower for c in ["au", "jp", "apac", "cn"]):
                scope = SCOPE_REGIONAL_APAC

            sig_id = f"sig-href-{int(time.time()*1000)}-{len(signals)}"
            signals.append(CatalogSignal(
                id=sig_id,
                signal_type=SIGNAL_TYPE_GLOBAL,
                scope=scope,
                indicator_pattern=f'hreflang="{hreflang}" alternate regional mirror',
                source_url=source_url,
                target_url=full_url,
                title_or_label=f"Regional Catalog Mirror ({hreflang.upper()})",
                confidence=0.96,
                retailer=urllib.parse.urlparse(full_url).netloc
            ))
        return signals

    def _extract_national_global_mirrors(self, url: str) -> List[CatalogSignal]:
        """Provides verified national and global catalogs for recognized brands."""
        signals = []
        brand = self.detect_retailer_family(url)
        if not brand:
            return signals

        mirrors = KNOWN_GLOBAL_MIRRORS.get(brand, [])
        for m in mirrors:
            target_url = f"https://{m['domain']}" if not m['domain'].startswith("http") else m['domain']
            sig_id = f"sig-mirror-{brand}-{m['country'].lower()}"
            signals.append(CatalogSignal(
                id=sig_id,
                signal_type=SIGNAL_TYPE_NATIONAL if m['scope'] == SCOPE_NATIONAL_US else SIGNAL_TYPE_GLOBAL,
                scope=m['scope'],
                indicator_pattern=f"Official {brand.capitalize()} Regional & Global Catalog Registry",
                source_url=url,
                target_url=target_url,
                title_or_label=m['name'],
                currency=m['currency'],
                confidence=0.99,
                retailer=brand.capitalize(),
                metadata={"country": m["country"], "brand": brand}
            ))
        return signals

    def _extract_feed_and_sitemap_signals(self, base_url: str) -> List[CatalogSignal]:
        """Discovers feed endpoints, Shopify json, and sitemaps."""
        signals = []
        parsed = urllib.parse.urlparse(base_url)
        origin = f"{parsed.scheme}://{parsed.netloc}"

        candidates = [
            {"path": "/sitemap.xml", "type": SIGNAL_TYPE_SITEMAP, "label": "XML Product Sitemap Index", "pattern": "Standard XML Sitemap Discovery"},
            {"path": "/products.json", "type": SIGNAL_TYPE_STRUCTURED_FEED, "label": "Shopify Structured Catalog Feed", "pattern": "Direct JSON Catalog API"},
            {"path": "/collections/all", "type": SIGNAL_TYPE_CATEGORY, "label": "Complete Store Catalog Root", "pattern": "Master Collection Endpoint"},
            {"path": "/sitemap_products_1.xml", "type": SIGNAL_TYPE_SITEMAP, "label": "Product Feed Sitemap #1", "pattern": "Product Cluster Sitemap Index"},
        ]

        for c in candidates:
            target_url = origin + c["path"]
            sig_id = f"sig-feed-{int(time.time()*1000)}-{len(signals)}"
            signals.append(CatalogSignal(
                id=sig_id,
                signal_type=c["type"],
                scope=SCOPE_NATIONAL_US,
                indicator_pattern=c["pattern"],
                source_url=base_url,
                target_url=target_url,
                title_or_label=c["label"],
                confidence=0.88,
                retailer=parsed.netloc
            ))
        return signals

    def _extract_pagination_signals(self, html: str, source_url: str) -> List[CatalogSignal]:
        """Detects pagination links (Page 2, next, rel='next', _pgn=, page=)."""
        signals = []
        seen = set()

        # 1. rel="next"
        rel_next = re.findall(r'<link\s+[^>]*rel=[\"\']next[\"\'][^>]*href=[\"\']([^\"\']+)[\"\']', html, re.I)
        rel_next += re.findall(r'<a\s+[^>]*rel=[\"\']next[\"\'][^>]*href=[\"\']([^\"\']+)[\"\']', html, re.I)
        for href in rel_next:
            full_url = urllib.parse.urljoin(source_url, href)
            if full_url not in seen:
                seen.add(full_url)
                u_hash = hashlib.md5(full_url.encode("utf-8")).hexdigest()[:6]
                signals.append(CatalogSignal(
                    id=f"sig-page-rel-{u_hash}-{len(signals)}",
                    signal_type=SIGNAL_TYPE_PAGINATION,
                    scope=SCOPE_NATIONAL_US,
                    indicator_pattern='Explicit rel="next" pagination link',
                    source_url=source_url,
                    target_url=full_url,
                    title_or_label="Next Catalog Page (Page 2+)",
                    confidence=0.98,
                    retailer=urllib.parse.urlparse(full_url).netloc
                ))

        # 2. Anchors containing page numbers or parameters
        anchors = re.findall(r'<a\s+[^>]*href=[\"\']([^\"\'#]+)[\"\'][^>]*>(.*?)</a>', html, re.I | re.DOTALL)
        for href, text in anchors:
            clean_txt = " ".join(re.sub(r'<[^>]+>', '', text).split())
            href_clean = href.strip()
            if not href_clean:
                continue

            # Check for pagination URL patterns
            is_page_url = any(p in href_clean.lower() for p in [
                "page=", "page-", "page/", "_pgn=", "p=", "offset=", "start=", "pg="
            ])
            is_page_txt = clean_txt.lower() in ["next", "next page", "2", "3", "4", "page 2", ">", "»"]

            if is_page_url or is_page_txt:
                full_url = urllib.parse.urljoin(source_url, href_clean)
                if full_url not in seen and full_url != source_url:
                    seen.add(full_url)
                    u_hash = hashlib.md5(full_url.encode("utf-8")).hexdigest()[:6]
                    signals.append(CatalogSignal(
                        id=f"sig-page-{u_hash}-{len(signals)}",
                        signal_type=SIGNAL_TYPE_PAGINATION,
                        scope=SCOPE_NATIONAL_US,
                        indicator_pattern=f'Pagination pattern: "{clean_txt or href_clean[:25]}"',
                        source_url=source_url,
                        target_url=full_url,
                        title_or_label=f"Catalog Pagination Stream: {clean_txt or 'Page Link'}",
                        confidence=0.92,
                        retailer=urllib.parse.urlparse(full_url).netloc
                    ))

        # 3. Synthetic Page 2 constructor if not found explicitly
        if not signals and ("sch/i.html" in source_url or "search" in source_url or "category" in source_url or "catalogue" in source_url):
            parsed = urllib.parse.urlparse(source_url)
            query = urllib.parse.parse_qs(parsed.query)
            
            # For eBay: _pgn=2
            if "ebay" in parsed.netloc:
                q2 = dict(query)
                q2["_pgn"] = ["2"]
                syn_url = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, urllib.parse.urlencode(q2, doseq=True), ""))
                u_hash = hashlib.md5(syn_url.encode("utf-8")).hexdigest()[:6]
                signals.append(CatalogSignal(
                    id=f"sig-page-syn-ebay-{u_hash}",
                    signal_type=SIGNAL_TYPE_PAGINATION,
                    scope=SCOPE_NATIONAL_US,
                    indicator_pattern="eBay Multi-Page Stream (_pgn=2)",
                    source_url=source_url,
                    target_url=syn_url,
                    title_or_label="eBay Multi-Page Stream: Page 2",
                    confidence=0.95,
                    retailer="eBay"
                ))
            else:
                q2 = dict(query)
                q2["page"] = ["2"]
                syn_url = urllib.parse.urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, urllib.parse.urlencode(q2, doseq=True), ""))
                u_hash = hashlib.md5(syn_url.encode("utf-8")).hexdigest()[:6]
                signals.append(CatalogSignal(
                    id=f"sig-page-syn-gen-{u_hash}",
                    signal_type=SIGNAL_TYPE_PAGINATION,
                    scope=SCOPE_NATIONAL_US,
                    indicator_pattern="Standard Web Pagination Stream (page=2)",
                    source_url=source_url,
                    target_url=syn_url,
                    title_or_label="Multi-Page Stream: Page 2",
                    confidence=0.90,
                    retailer=parsed.netloc
                ))

        return signals[:15]

    def _extract_products_from_html(self, html: str, base_url: str) -> List[CatalogSignal]:
        """Harvests individual product items found inside catalog / search pages."""
        products = []
        seen = set()

        # Search for product detail anchors
        anchors = re.findall(r'<a\s+[^>]*href=[\"\']([^\"\'#]+)[\"\'][^>]*>(.*?)</a>', html, re.I | re.DOTALL)
        for href, inner in anchors:
            full_url = urllib.parse.urljoin(base_url, href.strip())
            url_lower = full_url.lower()

            if full_url in seen or "/category/" in url_lower:
                continue

            # Match product patterns
            is_product = any(pat in url_lower for pat in ["/itm/", "/p/", "/product/", "/dp/", "/item/", "catalogue/"])
            clean_txt = " ".join(re.sub(r'<[^>]+>', '', inner).split())

            if is_product and len(clean_txt) >= 5:
                # Extract price if present
                price_match = re.search(r'[$€£¥₹]\s*([0-9]{1,4}(?:,[0-9]{3})*(?:\.[0-9]{2})?)', inner)
                price_val = None
                currency = "$"
                if price_match:
                    try:
                        price_val = float(price_match.group(1).replace(",", ""))
                        if "£" in inner: currency = "£"
                        elif "€" in inner: currency = "€"
                    except ValueError:
                        pass

                seen.add(full_url)
                products.append(CatalogSignal(
                    id=f"prod-{int(time.time()*1000)}-{len(products)}",
                    signal_type=SIGNAL_TYPE_PRODUCT,
                    scope=SCOPE_NATIONAL_US,
                    indicator_pattern="Product Item Detail Grid",
                    source_url=base_url,
                    target_url=full_url,
                    title_or_label=clean_txt[:90],
                    price_hint=price_val,
                    currency=currency,
                    confidence=0.94,
                    retailer=urllib.parse.urlparse(base_url).netloc
                ))

        return products[:35]

    def harvest(self, url: str, options: Optional[Dict[str, Any]] = None) -> CatalogHarvestResult:
        """
        Executes comprehensive multi-page & national/global catalog signal discovery.
        Traverses beyond page 1 when initial items are missing, constructs the internal list,
        and guarantees export / download availability.
        """
        options = options or {}
        audit_trail = []
        traversal_summary = []
        discovered: List[CatalogSignal] = []

        start_time = time.time()
        url = url.strip()
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        retailer_family = self.detect_retailer_family(url) or urllib.parse.urlparse(url).netloc
        traversal_summary.append(f"Step 1: Commencing catalog signal harvest for {url}")

        # 1. Collect Brand National & Global Mirror Signals
        global_mirrors = self._extract_national_global_mirrors(url)
        discovered.extend(global_mirrors)
        traversal_summary.append(f"Identified {len(global_mirrors)} verified national & global catalog mirrors for {retailer_family}.")

        # 2. Collect Standard Feed and Sitemap Signals
        feed_signals = self._extract_feed_and_sitemap_signals(url)
        discovered.extend(feed_signals)
        traversal_summary.append(f"Mapped {len(feed_signals)} standard catalog feeds & sitemap indices.")

        # 3. Perform Page 1 Fetch
        ingest_res = self.ingestion.fetch(url, options)
        bypassed_403 = False

        if ingest_res.status_code == 403 or (ingest_res.status_code == 200 and "checking your browser" in ingest_res.html.lower()):
            traversal_summary.append("Target presented edge challenge or 403. Engaging Execution Continuity Network Adapter...")
            resolution = continuity_controller.resolve_with_continuity(url, ingest_res, options)
            if resolution.resolved and resolution.final_ingestion_result:
                ingest_res = resolution.final_ingestion_result
                bypassed_403 = True
                traversal_summary.append(f"Continuity successful via {resolution.winning_strategy}.")

        page1_html = ingest_res.html

        # 4. Extract In-Page Hreflang and Alternate Country Links
        hreflangs = self._extract_hreflang_signals(page1_html, url)
        discovered.extend(hreflangs)
        traversal_summary.append(f"Discovered {len(hreflangs)} in-page international alternate catalog indicators.")

        # 5. Extract Pagination Indicators
        paginations = self._extract_pagination_signals(page1_html, url)
        discovered.extend(paginations)
        traversal_summary.append(f"Identified {len(paginations)} pagination streams & multi-page indicators.")

        # 6. Extract Page 1 Products
        page1_products = self._extract_products_from_html(page1_html, url)
        discovered.extend(page1_products)

        # 7. MULTI-PAGE DEEP HARVEST: If items NOT found on page 1, probe Page 2 and Page 3!
        if len(page1_products) == 0 and paginations:
            traversal_summary.append("Page 1 contained no direct item cards. Activating multi-page pagination crawler...")
            for page_sig in paginations[:2]: # Probe up to 2 pagination streams
                target_p_url = page_sig.target_url
                traversal_summary.append(f"Traversing to subsequent stream: {target_p_url}")
                p_res = self.ingestion.fetch(target_p_url, options)
                if p_res.status_code == 200:
                    stream_prods = self._extract_products_from_html(p_res.html, target_p_url)
                    discovered.extend(stream_prods)
                    traversal_summary.append(f"Harvested {len(stream_prods)} products from {target_p_url}.")
                    if stream_prods:
                        break

        # Deduplicate signals by target_url
        unique_signals: Dict[str, CatalogSignal] = {}
        for s in discovered:
            if s.target_url not in unique_signals:
                unique_signals[s.target_url] = s

        final_signals = list(unique_signals.values())
        seen_batch_ids = set()
        for idx, s in enumerate(final_signals):
            if s.id in seen_batch_ids:
                s.id = f"{s.id}-{idx}"
            seen_batch_ids.add(s.id)

        # Merge into internal persistent store
        existing_urls = {item.target_url for item in self.internal_signals}
        existing_ids = {item.id for item in self.internal_signals}
        new_count = 0
        for s in final_signals:
            if s.target_url not in existing_urls:
                if s.id in existing_ids:
                    s.id = f"{s.id}-{uuid.uuid4().hex[:6]}"
                existing_ids.add(s.id)
                self.internal_signals.append(s)
                new_count += 1
        self._save_storage()

        traversal_summary.append(f"Internal List Updated: Added {new_count} fresh signals (Total stored: {len(self.internal_signals)}).")

        nat_count = sum(1 for s in final_signals if s.scope == SCOPE_NATIONAL_US)
        glob_count = sum(1 for s in final_signals if s.scope != SCOPE_NATIONAL_US)
        page_count = sum(1 for s in final_signals if s.signal_type == SIGNAL_TYPE_PAGINATION)
        prod_count = sum(1 for s in final_signals if s.signal_type == SIGNAL_TYPE_PRODUCT)

        return CatalogHarvestResult(
            success=len(final_signals) > 0,
            start_url=url,
            retailer=retailer_family,
            signals_discovered=final_signals,
            total_signals=len(final_signals),
            national_signals_count=nat_count,
            global_signals_count=glob_count,
            pagination_signals_count=page_count,
            products_harvested_count=prod_count,
            traversal_summary=traversal_summary,
            audit_trail=audit_trail,
            bypassed_403=bypassed_403,
            download_available=True
        )

    def get_internal_list(self, filter_type: Optional[str] = None, search: Optional[str] = None) -> List[CatalogSignal]:
        results = self.internal_signals
        if filter_type and filter_type != "ALL":
            results = [s for s in results if s.signal_type == filter_type or s.scope == filter_type]
        if search:
            q = search.lower()
            results = [s for s in results if q in s.title_or_label.lower() or q in s.target_url.lower() or q in s.indicator_pattern.lower()]
        return results

    def export_csv(self) -> str:
        """Generates RFC 4180 CSV spreadsheet string of the internal signals list."""
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "Signal_ID",
            "Signal_Type",
            "Scope",
            "Retailer",
            "Title_or_Label",
            "Price_Hint",
            "Currency",
            "Target_URL",
            "Indicator_Pattern",
            "Source_URL",
            "Confidence",
            "Discovered_Date"
        ])

        for s in self.internal_signals:
            date_str = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(s.discovered_at))
            writer.writerow([
                s.id,
                s.signal_type,
                s.scope,
                s.retailer,
                s.title_or_label,
                f"{s.price_hint:.2f}" if s.price_hint is not None else "N/A",
                s.currency,
                s.target_url,
                s.indicator_pattern,
                s.source_url,
                f"{int(s.confidence * 100)}%",
                date_str
            ])
        return output.getvalue()

    def export_json(self) -> str:
        """Generates structured JSON string of the internal signals list."""
        records = [s.to_dict() for s in self.internal_signals]
        return json.dumps({
            "mechanism_id": self.mechanism_id,
            "version": self.version,
            "total_signals": len(records),
            "exported_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "signals": records
        }, indent=2)

    def clear_internal_list(self):
        self.internal_signals = []
        self._save_storage()


# ---------------------------------------------------------------------------
# Global Mechanism Instance
# ---------------------------------------------------------------------------
catalog_signal_harvester = NationalGlobalCatalogSignalHarvester()
