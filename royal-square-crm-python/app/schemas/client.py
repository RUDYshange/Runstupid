from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
from decimal import Decimal

class CreateClientRequest(BaseModel):
    title: str = Field(max_length=10)
    firstName: str = Field(max_length=60)
    secondName: Optional[str] = Field(default=None, max_length=60)
    surname: str = Field(max_length=60)
    idNumber: Optional[str] = Field(default=None, pattern=r"^\d{13}$")
    dateOfBirth: Optional[date] = None
    occupation: Optional[str] = None
    employer: Optional[str] = None
    annualIncome: Optional[Decimal] = None
    mobileNumber: Optional[str] = None
    emailAddress: Optional[str] = None
    primaryAddress: Optional[str] = None
    referredBy: Optional[str] = None

class ClientSummary(BaseModel):
    id: str
    reference: str
    fullName: str
    initials: str
    occupation: Optional[str] = None
    employer: Optional[str] = None
    mobileNumber: Optional[str] = None
    netWorth: Decimal
    riskProfile: str
    riskScore: Optional[int] = None
    complianceGapCount: int
    nextReviewDate: Optional[date] = None
    daysUntilReview: Optional[int] = None

class LedgerGroupResponse(BaseModel):
    category: str
    label: str
    total: Decimal
    lines: List[dict] = []

class BalanceSheetResponse(BaseModel):
    assets: List[dict] = []
    liabilities: List[dict] = []
    income: List[dict] = []
    expenses: List[dict] = []
    totalAssets: Decimal
    totalLiabilities: Decimal
    netWorth: Decimal
    monthlyIncome: Decimal
    monthlyExpenses: Decimal
    monthlySurplus: Decimal
    debtToAssetsPercent: float
    monthsOfExpensesCovered: float

class ClientDetail(BaseModel):
    id: str
    reference: str
    title: str
    fullName: str
    maskedIdNumber: Optional[str] = None
    dateOfBirth: Optional[date] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    employer: Optional[str] = None
    annualIncome: Optional[Decimal] = None
    mobileNumber: Optional[str] = None
    emailAddress: Optional[str] = None
    primaryAddress: Optional[str] = None
    licenceExpiry: Optional[date] = None
    clientSince: Optional[date] = None
    nextReviewDate: Optional[date] = None
    riskProfile: str
    riskScore: Optional[int] = None
    netWorth: Decimal
    balanceSheet: BalanceSheetResponse
    goals: List[dict] = []
    policies: List[dict] = []
    documents: List[dict] = []
