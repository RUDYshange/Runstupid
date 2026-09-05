from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class RegisterClaimRequest(BaseModel):
    clientId: str
    insurer: str
    claimType: str
    incidentDate: date
    lodgedDate: Optional[date]=None
    description: Optional[str]=None
    policyNumber: Optional[str]=None

class SceneItemResponse(BaseModel):
    item: str
    label: str
    done: bool

class ClaimLogResponse(BaseModel):
    text: str
    recordedAt: datetime

class ClaimResponse(BaseModel):
    id: str
    reference: str
    clientId: str
    clientName: str
    insurer: str
    policyNumber: Optional[str]=None
    insurerClaimNumber: Optional[str]=None
    claimsHandler: Optional[str]=None
    claimType: str
    incidentDate: date
    lodgedDate: date
    description: Optional[str]=None
    stage: str
    stepNumber: int
    totalSteps: int
    closed: bool
    sceneChecklist: List[SceneItemResponse]=[]
    log: List[ClaimLogResponse]=[]
