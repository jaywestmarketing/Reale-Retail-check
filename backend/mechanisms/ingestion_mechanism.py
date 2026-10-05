import urllib.request
import urllib.parse
import http.cookiejar
import ssl
import gzip
import io
import time
import re
from typing import Dict, Any, Optional
from backend.mechanisms.contracts import IngestionMechanismContract, IngestionResult

USER_AGENTS = {
    "desktop_chrome": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "desktop_safari": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
    "desktop_firefox": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:129.0) Gecko/20100101 Firefox/129.0",
}

RETAILER_PATTERNS = {
    "Amazon": r"amazon\.[a-z\.]+",
    "Walmart": r"walmart\.com",
    "Best Buy": r"bestbuy\.com",
    "Target": r"target\.com",
    "eBay": r"ebay\.[a-z\.]+",
    "Newegg": r"newegg\.com",
    "B&H Photo": r"bhphotovideo\.com",
    "Apple": r"apple\.com",
    "Shopify Store": r"myshopify\.com|shop\.",
    "WooCommerce Store": r"wp-content|woocommerce",
}

class StandardIngestionMechanism(IngestionMechanismContract):
    """
    Mechanism 1: Web Ingestion & Transport Engine.
    Handles real HTTP/HTTPS requests with browser header profiling,
    cookie persistence, gzip/deflate decoding, rate-limiting, and error handling.
    No mock data - all requests execute against live web URLs.
    """
    def __init__(self, default_timeout: int = 15, rate_limit_delay: float = 0.5):
        self.default_timeout = default_timeout
        self.rate_limit_delay = rate_limit_delay
        self.last_fetch_time: Dict[str, float] = {}
        self.cookie_jar = http.cookiejar.CookieJar()

    def detect_retailer(self, url: str) -> str:
        parsed = urllib.parse.urlparse(url)
        domain = parsed.netloc.lower()
        for name, pattern in RETAILER_PATTERNS.items():
            if re.search(pattern, domain):
                return name
        return domain or "E-Commerce Website"

    def fetch(self, url: str, options: Optional[Dict[str, Any]] = None) -> IngestionResult:
        options = options or {}
        ua_key = options.get("user_agent_preset", "desktop_chrome")
        ua_string = USER_AGENTS.get(ua_key, USER_AGENTS["desktop_chrome"])
        custom_headers = options.get("headers", {})
        timeout = options.get("timeout", self.default_timeout)

        # Ensure valid URL format
        if not url.startswith("http://") and not url.startswith("https://"):
            url = "https://" + url

        retailer = self.detect_retailer(url)
        start_time = time.time()
        host = urllib.parse.urlparse(url).netloc

        # Rate limiting check per host
        if host in self.last_fetch_time:
            elapsed = time.time() - self.last_fetch_time[host]
            if elapsed < self.rate_limit_delay:
                time.sleep(self.rate_limit_delay - elapsed)

        req_headers = {
            "User-Agent": ua_string,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Sec-Ch-Ua": '"Chromium";v="128", "Not;A=Brand";v="24", "Google Chrome";v="128"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
            "Cache-Control": "max-age=0",
        }
        req_headers.update(custom_headers)

        # Setup modern TLS SSL context
        ssl_ctx = ssl.create_default_context()
        ssl_ctx.check_hostname = False
        ssl_ctx.verify_mode = ssl.CERT_NONE

        try:
            opener = urllib.request.build_opener(
                urllib.request.HTTPCookieProcessor(self.cookie_jar),
                urllib.request.HTTPSHandler(context=ssl_ctx)
            )

            req = urllib.request.Request(url, headers=req_headers)
            with opener.open(req, timeout=timeout) as response:
                self.last_fetch_time[host] = time.time()
                status_code = response.status
                resp_headers = dict(response.info())
                raw_bytes = response.read()

                # Handle gzip / deflate decoding
                content_encoding = resp_headers.get("Content-Encoding", "").lower()
                if "gzip" in content_encoding:
                    try:
                        raw_bytes = gzip.GzipFile(fileobj=io.BytesIO(raw_bytes)).read()
                    except Exception:
                        pass
                elif "deflate" in content_encoding:
                    try:
                        import zlib
                        raw_bytes = zlib.decompress(raw_bytes, -zlib.MAX_WBITS)
                    except Exception:
                        pass

                # Decode HTML with fallback encodings
                charset = response.info().get_content_charset() or "utf-8"
                html_text = raw_bytes.decode(charset, errors="replace")

                latency = (time.time() - start_time) * 1000.0
                return IngestionResult(
                    status_code=status_code,
                    html=html_text,
                    headers=resp_headers,
                    latency_ms=round(latency, 2),
                    timestamp=time.time(),
                    canonical_url=response.geturl(),
                    retailer_detected=retailer,
                    error=None
                )
        except urllib.error.HTTPError as he:
            latency = (time.time() - start_time) * 1000.0
            error_body = ""
            try:
                raw_err = he.read()
                error_body = raw_err.decode("utf-8", errors="replace")[:1000]
            except Exception:
                pass
            init_res = IngestionResult(
                status_code=he.code,
                html=error_body,
                headers=dict(he.headers) if he.headers else {},
                latency_ms=round(latency, 2),
                timestamp=time.time(),
                canonical_url=url,
                retailer_detected=retailer,
                error=f"HTTP {he.code}: {he.reason}"
            )
            # If 403 Forbidden or 429 or 503 challenge, attempt autonomous resolution
            if options.get("enable_continuity_resolution", True) and he.code in [403, 429, 503]:
                try:
                    from backend.mechanisms.execution_continuity_adapter import continuity_controller
                    resolution = continuity_controller.resolve_with_continuity(url, init_res, options)
                    if resolution.resolved and resolution.final_ingestion_result:
                        res = resolution.final_ingestion_result
                        res.headers["x-continuity-resolved"] = "true"
                        res.headers["x-winning-strategy"] = resolution.winning_strategy or "unknown"
                        return res
                except Exception as ex:
                    print(f"Continuity resolution error: {ex}")
            return init_res
        except Exception as e:
            latency = (time.time() - start_time) * 1000.0
            err_res = IngestionResult(
                status_code=0,
                html="",
                headers={},
                latency_ms=round(latency, 2),
                timestamp=time.time(),
                canonical_url=url,
                retailer_detected=retailer,
                error=f"Network Error: {str(e)}"
            )
            if options.get("enable_continuity_resolution", True):
                try:
                    from backend.mechanisms.execution_continuity_adapter import continuity_controller
                    resolution = continuity_controller.resolve_with_continuity(url, err_res, options)
                    if resolution.resolved and resolution.final_ingestion_result:
                        res = resolution.final_ingestion_result
                        res.headers["x-continuity-resolved"] = "true"
                        res.headers["x-winning-strategy"] = resolution.winning_strategy or "unknown"
                        return res
                except Exception:
                    pass
            return err_res

