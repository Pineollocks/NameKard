from pydantic import BaseModel, Field
from typing import Optional

class Lead(BaseModel):
    company_name: str = Field(description="The name of the business")
    email: str = Field(description="Verified contact email address")
    industry: str = Field(description="The primary industry or niche")
    decision_maker: Optional[str] = Field(default="Unknown", description="Name of the key contact or CEO")
    website: str = Field(description="URL of the business website")
    