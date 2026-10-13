import urllib.request
import urllib.parse
import urllib.error
import time
import gzip
import zlib
from typing import Dict, Any, Optional
from backend.mechanisms.contracts import IngestionMechanismContract, IngestionResult

USER_AGENTS = {
    "desktop_chrome": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "desktop_safari": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "desktop_firefox": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0"
}

class StandardIngestionMechanism(IngestionMechanismContract):
    def __init__(self, default_timeout: int = 15, rate_limit_delay: float = 0.5):
        self.default_timeout = default_timeout
        self.rate_limit_delay = rate_limit_delay
        self._last_request_time = 0.0

    def detect_retailer(self, url: str) -> str:
        domain = urllib.parse.urlparse(url).netloc.lower()
        if "amazon" in domain:
            return "Amazon"
        elif "walmart" in domain:
            return "Walmart"
        elif "bestbuy" in domain:
            return "Best Buy"
        elif "target" in domain:
            return "Target"
        elif "homedepot" in domain:
            return "The Home Depot"
        elif "ebay" in domain:
            return "eBay"
        elif "newegg" in domain:
            return "Newegg"
        elif "bhphotovideo" in domain:
            return "B&H Photo"
        elif "apple" in domain:
            return "Apple"
        return "Generic Web"

    def fetch(self, url: str, options: Optional[Dict[str, Any]] = None) -> IngestionResult:
        opts = options or {}
        ua_preset = opts.get("user_agent_preset", "desktop_chrome")
        ua_string = USER_AGENTS.get(ua_preset, USER_AGENTS["desktop_chrome"])
        timeout = opts.get("timeout", self.default_timeout)
        custom_headers = opts.get("headers", {})

        elapsed = time.time() - self._last_request_time
        if elapsed < self.rate_limit_delay:
            time.sleep(self.rate_limit_delay - elapsed)

        headers = {
            "User-Agent": ua_string,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
        }
        headers.update(custom_headers)

        if not (url.startswith("http://") or url.startswith("https://")):
            url = "https://" + url

        req = urllib.request.Request(url, headers=headers)
        start_time = time.time()
        retailer = self.detect_retailer(url)

        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                latency = (time.time() - start_time) * 1000
                status_code = response.getcode()
                resp_headers = dict(response.info())
                raw_data = response.read()

                content_encoding = resp_headers.get("Content-Encoding", "").lower()
                if "gzip" in content_encoding:
                    try:
                        raw_data = gzip.decompress(raw_data)
                    except Exception:
                        pass
                elif "deflate" in content_encoding:
                    try:
                        raw_data = zlib.decompress(raw_data)
                    except Exception:
                        pass

                try:
                    html_text = raw_data.decode("utf-8")
                except UnicodeDecodeError:
                    html_text = raw_data.decode("latin-1", errors="replace")

                self._last_request_time = time.time()
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
        except urllib.error.HTTPError as e:
            latency = (time.time() - start_time) * 1000
            try:
                body = e.read().decode("utf-8", errors="replace")
            except Exception:
                body = ""
            return IngestionResult(
                status_code=e.code,
                html=body,
                headers=dict(e.headers) if hasattr(e, "headers") else {},
                latency_ms=round(latency, 2),
                timestamp=time.time(),
                canonical_url=url,
                retailer_detected=retailer,
                error=f"HTTP Error {e.code}: {e.reason}"
            )
        except Exception as e:
            latency = (time.time() - start_time) * 1000
            return IngestionResult(
                status_code=0,
                html="",
                headers={},
                latency_ms=round(latency, 2),
                timestamp=time.time(),
                canonical_url=url,
                retailer_detected=retailer,
                error=str(e)
            )
