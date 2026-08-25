import os
from typing import List, Optional
from google import genai
from dotenv import load_dotenv
from pydantic import BaseModel
from models.lead import Lead

load_dotenv()

# Initialize the GenAI Client
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Container model for structured list output
class LeadContainer(BaseModel):
    leads: List[Lead]


def extract_leads_from_text(
    raw_text: str,
    source_url: str = "",
    user_query: str = "",
) -> List[Lead]:
    """
    Sends raw web text to Gemini and extracts structured Lead objects.

    Args:
        raw_text:    Visible text plus pre-extracted contact hints from a webpage.
        source_url:  The URL the text was scraped from (for context).
        user_query:  The original user search query (for relevance filtering).
    """
    if not raw_text or not raw_text.strip():
        return []

    relevance_instruction = (
        f'The user is searching for: "{user_query}". '
        "Only extract leads that are genuinely relevant to this search. "
        "Ignore unrelated companies or mentions. "
    ) if user_query else ""

    prompt = (
        f"You are a business lead extraction assistant. {relevance_instruction}"
        "Analyze the following raw text scraped from a business website "
        f"(source URL: {source_url or 'unknown'}). "
        "Extract all company contact details and key decision makers into structured leads. "
        "For the email field: only use email addresses that are explicitly present in the text — "
        "especially look for lines starting with 'MAILTO:' which are confirmed email links from the page. "
        "Do NOT invent or guess email addresses. If no email is found, leave the field null. "
        "For phone, look for 'TEL:' prefixed lines which are confirmed phone links. "
        "If a field is not found, leave it as null.\n\n"
        f"Raw Website Text:\n{raw_text}"
    )

    try:
        response = client.models.generate_content(
            model='gemini-3.6-flash',
            contents=prompt,
            config={
                'response_mime_type': 'application/json',
                'response_schema': LeadContainer,
            },
        )
        result: LeadContainer = response.parsed
        return result.leads if result and result.leads else []
    except Exception as e:
        print(f"Gemini extraction failed for URL '{source_url}': {e}")
        return []