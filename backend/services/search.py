from ddgs import DDGS
from typing import List

def search_company_urls(query: str, max_results: int = 3) -> List[str]:
    """
    Uses DuckDuckGo to search for a query and returns a list of website URLs.
    We limit this to 3 results by default to keep processing time reasonable.
    """
    urls = []
    try:
        # We initialize the search client
        with DDGS() as ddgs:
            # Perform a text search and limit the maximum number of results
            results = list(ddgs.text(query, max_results=max_results))
            for result in results:
                # DuckDuckGo returns a dictionary with search result data; we extract the 'href' for the URL
                if "href" in result:
                    urls.append(result["href"])
    except Exception as e:
        print(f"Search failed: {e}")
        
    return urls
