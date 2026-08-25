import random
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from typing import Optional

# Pool of real browser User-Agents to rotate through
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
]

# Sub-paths to try when the homepage has no contact info
_CONTACT_SUBPATHS = ["/contact", "/contact-us", "/about", "/about-us", "/reach-us", "/get-in-touch"]


def _get_headers() -> dict:
    return {"User-Agent": random.choice(_USER_AGENTS)}


def _extract_contact_hints(soup: BeautifulSoup) -> str:
    """
    Explicitly pulls mailto: and tel: href values from all anchor tags
    and surfaces them in a clearly labelled block so Gemini can find
    them without guessing.

    Returns a formatted string of confirmed contact signals.
    """
    hints = []

    for tag in soup.find_all("a", href=True):
        href = tag["href"].strip()
        if href.lower().startswith("mailto:"):
            email = href[7:].split("?")[0].strip()  # strip query params like ?subject=
            if email:
                hints.append(f"MAILTO: {email}")
        elif href.lower().startswith("tel:"):
            phone = href[4:].strip()
            if phone:
                hints.append(f"TEL: {phone}")

    # Also scan for common contact-info text patterns in schema/microdata
    for tag in soup.find_all(attrs={"itemprop": ["email", "telephone"]}):
        content = tag.get("content") or tag.get_text(strip=True)
        if content:
            prop = tag.get("itemprop", "")
            if prop == "email":
                hints.append(f"MAILTO: {content}")
            elif prop == "telephone":
                hints.append(f"TEL: {content}")

    return "\n".join(dict.fromkeys(hints))  # deduplicate while preserving order


def _fetch_and_parse(url: str, timeout: int = 15) -> Optional[BeautifulSoup]:
    """
    Fetches a URL and returns a BeautifulSoup object, or None on failure.
    Detects bot-blocks (403, Cloudflare) and skips them gracefully.
    """
    try:
        response = requests.get(url, headers=_get_headers(), timeout=timeout)

        # Detect hard blocks
        if response.status_code == 403:
            print(f"Access denied (403) for {url} — skipping.")
            return None
        if response.status_code == 404:
            return None

        response.raise_for_status()

        # Detect soft blocks (Cloudflare / CAPTCHA pages)
        lower_text = response.text.lower()
        if any(kw in lower_text for kw in ["access denied", "captcha", "cloudflare", "please enable javascript"]):
            print(f"Bot block detected on {url} — skipping.")
            return None

        return BeautifulSoup(response.text, "html.parser")

    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return None


def scrape_website_text(url: str) -> str:
    """
    Fetches a webpage and returns visible text enriched with explicitly
    extracted contact signals (mailto:, tel: links and schema.org data).

    Strategy:
    1. Try the homepage.
    2. If no contact hints found, try common sub-pages (/contact, /about, etc.).

    Returns an empty string if all attempts fail.
    """
    base_url = f"{urlparse(url).scheme}://{urlparse(url).netloc}"
    urls_to_try = [url] + [urljoin(base_url, path) for path in _CONTACT_SUBPATHS]

    best_text = ""
    best_hints = ""

    for attempt_url in urls_to_try:
        soup = _fetch_and_parse(attempt_url)
        if soup is None:
            continue

        # Extract confirmed contact signals BEFORE stripping the HTML
        contact_hints = _extract_contact_hints(soup)

        # Strip non-content elements
        for element in soup(["script", "style", "nav", "footer", "head"]):
            element.extract()

        visible_text = soup.get_text(separator=" ", strip=True)[:12000]

        # Combine contact hints at the top so Gemini sees them first
        combined = ""
        if contact_hints:
            combined = f"=== CONFIRMED CONTACT INFO ===\n{contact_hints}\n\n=== PAGE TEXT ===\n{visible_text}"
        else:
            combined = visible_text

        # If this page has contact hints, it's the best source — use it and stop
        if contact_hints:
            return combined

        # Otherwise keep this as a fallback if we find nothing better
        if not best_text:
            best_text = combined

    return best_text