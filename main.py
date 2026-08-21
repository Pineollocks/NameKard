
from typing import List
from fastapi import FastAPI, HTTPException
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

@app.get("/")
async def root():
    return {"message": "AI Lead Searcher API is running!"}

@app.post("/api/leads/extract", response_model=List[Lead])
async def extract_leads(url: str):
    """
    Scrapes a URL and uses Gemini to extract structured business lead data.
    """
    raw_text = scrape_website_text(url)
    if not raw_text:
        raise HTTPException(status_code=400, detail="Unable to scrape text from the provided URL.")

    leads = extract_leads_from_text(raw_text)
    return leads


# We need a new Pydantic model for the incoming JSON request body
class SearchRequest(BaseModel):
    description: str
    num_leads: int = 3 #default num of leads if user doesn't specify

@app.post("/api/leads/search", response_model=List[Lead])
async def search_and_extract_leads(request: SearchRequest):
    """
    Takes a description and a desired number of leads, searches the web, 
    scrapes sites, and stops once the requested number is reached.
    """
    # Search for double the requested URLs to account for websites with no contact info
    urls = search_company_urls(request.description, max_results=request.num_leads * 2)
    
    if not urls:
        raise HTTPException(status_code=404, detail="No websites found for that description.")

    all_leads = []
    
    for url in urls:
        raw_text = scrape_website_text(url)
        
        if raw_text:
            leads = extract_leads_from_text(raw_text)
            all_leads.extend(leads)
            
            # Stop scraping immediately if we hit our target number!
            if len(all_leads) >= request.num_leads:
                break
                
    # Return exactly the requested amount, or whatever maximum we managed to find
    return all_leads[:request.num_leads]
