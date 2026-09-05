import uuid
from sqlalchemy import Column, String, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id = Column(String, primary_key=True, default=gen_uuid)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    category = Column(String(30), nullable=False)  # ASSET, LIABILITY, INCOME, EXPENSE...
    label = Column(String(120), nullable=False)
    amount = Column(Numeric(15,2), nullable=False)
    creditor = Column(String(80), nullable=True)
    interest_rate = Column(Numeric(5,2), nullable=True)

    client = relationship("Client", back_populates="ledger_entries")
