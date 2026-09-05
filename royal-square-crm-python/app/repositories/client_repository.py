from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.client import Client
from app.models.ledger import LedgerEntry
from app.models.goal import Goal
from app.models.policy import Policy
from app.models.compliance import ComplianceDocument
import random

class ClientRepository:
    @staticmethod
    def get_all(db: Session, search: Optional[str] = None) -> List[Client]:
        query = db.query(Client)
        if search:
            s = f"%{search}%"
            query = query.filter(
                or_(
                    Client.first_name.ilike(s),
                    Client.surname.ilike(s),
                    Client.reference.ilike(s),
                    Client.id_number.ilike(s),
                    Client.email_address.ilike(s)
                )
            )
        return query.order_by(Client.surname.asc()).all()

    @staticmethod
    def get_by_id(db: Session, client_id: str) -> Optional[Client]:
        return db.query(Client).filter(Client.id == client_id).first()

    @staticmethod
    def get_by_reference(db: Session, ref: str) -> Optional[Client]:
        return db.query(Client).filter(Client.reference == ref).first()

    @staticmethod
    def generate_reference(db: Session) -> str:
        while True:
            ref = f"CLI-{random.randint(1000, 9999)}"
            if not db.query(Client).filter(Client.reference == ref).first():
                return ref

    @staticmethod
    def create(db: Session, data: dict) -> Client:
        if "reference" not in data or not data["reference"]:
            data["reference"] = ClientRepository.generate_reference(db)
        client = Client(**data)
        db.add(client)
        db.commit()
        db.refresh(client)
        return client

    @staticmethod
    def update(db: Session, client: Client, data: dict) -> Client:
        for k, v in data.items():
            if hasattr(client, k) and v is not None:
                setattr(client, k, v)
        db.commit()
        db.refresh(client)
        return client

    @staticmethod
    def add_ledger_entry(db: Session, client_id: str, data: dict) -> LedgerEntry:
        entry = LedgerEntry(client_id=client_id, **data)
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry

    @staticmethod
    def add_goal(db: Session, client_id: str, data: dict) -> Goal:
        goal = Goal(client_id=client_id, **data)
        db.add(goal)
        db.commit()
        db.refresh(goal)
        return goal

    @staticmethod
    def add_policy(db: Session, client_id: str, data: dict) -> Policy:
        policy = Policy(client_id=client_id, **data)
        db.add(policy)
        db.commit()
        db.refresh(policy)
        return policy

    @staticmethod
    def add_document(db: Session, client_id: str, data: dict) -> ComplianceDocument:
        doc = ComplianceDocument(client_id=client_id, **data)
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc
