from typing import List, Optional
from urllib.parse import urlparse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models.lead import Lead
from services.scraper import scrape_website_text
from services.ai import extract_leads_from_text
from services.search import search_company_urls

app = FastAPI(
    title="NameKard Lead Generation API",
    description="AI-powered lead generation and outreach tool",
    version="1.0.0"
)

# Allow frontend to communicate with this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "AI Lead Searcher API is running!"}

@app.post("/api/leads/extract", response_model=List[Lead])
async def extract_leads(url: str):
    """
    scrapes a URL and uses Gemini to extract data
    """
    raw_text = scrape_website_text(url)
    if not raw_text:
        raise HTTPException(status_code=400, detail="Unable to scrape text from the provided URL.")

    leads = extract_leads_from_text(raw_text, source_url=url)
    return leads


def _get_domain(url: str) -> str:
    """Returns the bare domain from a URL for deduplication."""
    try:
        return urlparse(url).netloc.lower().lstrip("www.")
    except Exception:
        return url


class SearchRequest(BaseModel):
    description: str
    num_leads: int = 3
    excluded_websites: List[str] = []


@app.post("/api/leads/search", response_model=List[Lead])
async def search_and_extract_leads(request: SearchRequest):
    """
    Takes a description and a desired number of leads, searches the web,
    scrapes sites, and stops once the requested number is reached.
    """
    # excluded domains from the saved leads list
    excluded_domains = {_get_domain(w) for w in request.excluded_websites if w}

    # Use a larger pool: 4x the requested leads (minimum 20) to account for
    search_pool_size = max(request.num_leads * 4, 20)
    urls = search_company_urls(request.description, max_results=search_pool_size)

    if not urls:
        raise HTTPException(status_code=404, detail="No websites found for that description.")

    all_leads: List[Lead] = []
    seen_domains: set = set()

    for url in urls:
        if len(all_leads) >= request.num_leads:
            break

        # Skip URLs from excluded or already-processed domains
        domain = _get_domain(url)
        if domain in excluded_domains or domain in seen_domains:
            continue
        seen_domains.add(domain)

        raw_text = scrape_website_text(url)
        if not raw_text:
            continue

        leads = extract_leads_from_text(
            raw_text,
            source_url=url,
            user_query=request.description,
        )

        for lead in leads:
            # Deduplicate leads by their website domain
            lead_domain = _get_domain(lead.website) if lead.website else None
            if lead_domain and lead_domain in excluded_domains:
                continue
            if lead_domain and lead_domain in seen_domains:
                continue
            if lead_domain:
                seen_domains.add(lead_domain)
            all_leads.append(lead)

            if len(all_leads) >= request.num_leads:
                break

    return all_leads[:request.num_leads]
