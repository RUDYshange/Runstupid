import uuid
from sqlalchemy import Column, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Goal(Base):
    __tablename__ = "goals"
    id = Column(String, primary_key=True, default=gen_uuid)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    name = Column(String(120), nullable=False)
    kind = Column(String(20), nullable=False)
    target_amount = Column(Numeric(15,2), nullable=False)
    current_amount = Column(Numeric(15,2), default=0)
    monthly_contribution = Column(Numeric(15,2), nullable=True)
    start_date = Column(Date, nullable=False)
    target_date = Column(Date, nullable=False)
    vehicle = Column(String(120), nullable=True)

    client = relationship("Client", back_populates="goals")
