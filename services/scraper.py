import requests
from bs4 import BeautifulSoup

def scrape_website_text(url: str) -> str:
    """
    Fetches a webpage and returns only the visible text, 
    stripping away HTML tags, scripts, and styling.
    """
    try:
        # We use a User-Agent header so websites think we are a standard Chrome browser
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove all script and style tags (we don't need code, just text)
        for element in soup(["script", "style", "nav", "footer"]):
            element.extract()
            
        # Get the remaining text and clean up extra whitespace
        text = soup.get_text(separator=' ', strip=True)
        
        # Limit the text to avoid overloading the AI context window unnecessarily 
        return text[:15000] 
        
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")
        return ""