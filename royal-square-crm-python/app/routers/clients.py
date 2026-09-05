from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.client import ClientSummary, ClientDetail, CreateClientRequest
from app.services.client_service import ClientService

router = APIRouter(prefix="/api/clients", tags=["Clients"])

@router.get("", response_model=List[ClientSummary])
def list_clients(q: Optional[str] = Query(None, description="Search query"), db: Session = Depends(get_db)):
    return ClientService.list_clients(db, search=q)

@router.get("/{client_id}", response_model=ClientDetail)
def get_client(client_id: str, db: Session = Depends(get_db)):
    detail = ClientService.get_client_detail(db, client_id)
    if not detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    return detail

@router.post("", response_model=ClientDetail, status_code=status.HTTP_201_CREATED)
def create_client(req: CreateClientRequest, db: Session = Depends(get_db)):
    try:
        return ClientService.create_client(db, req.model_dump())
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
