import os
from typing import List
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

def extract_leads_from_text(raw_text: str) -> List[Lead]:
    """
    Sends raw web text to Gemini and extracts structured Lead objects.
    """
    prompt = (
        "Analyze the following raw text scraped from a business website. "
        "Extract all company contact details and key decision makers into structured leads.\n\n"
        f"Raw Website Text:\n{raw_text}"
    )

    response = client.models.generate_content(
        model='gemini-3.6-flash',
        contents=prompt,
        config={
            'response_mime_type': 'application/json',
            'response_schema': LeadContainer,
        },
    )

    # Parse and extract the list from our container
    result: LeadContainer = response.parsed
    return result.leads if result and result.leads else []