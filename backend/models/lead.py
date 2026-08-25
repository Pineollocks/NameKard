from pydantic import BaseModel, Field
from typing import Optional

class Lead(BaseModel):
    company_name: str = Field(description="The name of the business")
    email: Optional[str] = Field(default=None, description="Contact email address if explicitly found on the page (from a mailto: link or visible text), otherwise null. Do NOT invent.")
    industry: str = Field(description="The primary industry or niche")
    decision_maker: Optional[str] = Field(default="Unknown", description="Name of the key contact or CEO")
    website: str = Field(description="URL of the business website")
    phone: Optional[str] = Field(default=None, description="Contact phone number if explicitly found on the page (from a tel: link or visible text), otherwise null.")
    location: Optional[str] = Field(default=None, description="City and province/state of the business if found, otherwise null.")