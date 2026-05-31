# backend/models.py
from pydantic import BaseModel

class InvestorPurchaseSummary(BaseModel):
    inv_name: str
    pan: str
    scheme: str
    total_amount: float
    total_units: float

class FundPurchaseSummary(BaseModel):
    scheme: str
    inv_name: str
    pan: str
    total_amount: float
    total_units: float

class InvestorSummary(BaseModel):
    inv_name: str
    pan: str
    total_amount: float

class FundSummary(BaseModel):
    scheme: str
    total_amount: float
    total_units: float
    avg_nav: float







