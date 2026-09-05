import uuid
from sqlalchemy import Column, String, Numeric, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base
def gen_uuid(): return str(uuid.uuid4())
class Policy(Base):
    __tablename__ = "policies"
    id = Column(String, primary_key=True, default=gen_uuid)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    provider = Column(String(80), nullable=False)
    product_type = Column(String(40), nullable=False)
    policy_number = Column(String(40), nullable=False)
    sum_assured = Column(Numeric(15,2), nullable=True)
    monthly_premium = Column(Numeric(15,2), nullable=True)
    renewal_date = Column(Date, nullable=True)
    client = relationship("Client", back_populates="policies")
