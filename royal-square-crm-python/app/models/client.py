import uuid, datetime
from sqlalchemy import Column, String, Date, Numeric, Integer, DateTime
from sqlalchemy.orm import relationship
from app.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class Client(Base):
    __tablename__ = "clients"
    id = Column(String, primary_key=True, default=gen_uuid)
    reference = Column(String(12), unique=True, nullable=False)
    title = Column(String(10), nullable=False)
    first_name = Column(String(60), nullable=False)
    second_name = Column(String(60), nullable=True)
    surname = Column(String(60), nullable=False)
    id_number = Column(String(13), nullable=True)
    date_of_birth = Column(Date, nullable=True)
    licence_expiry = Column(Date, nullable=True)
    wedding_anniversary = Column(Date, nullable=True)
    next_review_date = Column(Date, nullable=True)
    valuation_certificate_issued = Column(Date, nullable=True)
    client_since = Column(Date, nullable=True)
    occupation = Column(String(80), nullable=True)
    employer = Column(String(80), nullable=True)
    annual_income = Column(Numeric(15,2), nullable=True)
    mobile_number = Column(String(20), nullable=True)
    email_address = Column(String(120), nullable=True)
    primary_address = Column(String(200), nullable=True)
    risk_profile = Column(String(20), default="NOT_ASSESSED")
    risk_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    ledger_entries = relationship("LedgerEntry", back_populates="client", cascade="all, delete-orphan")
    goals = relationship("Goal", back_populates="client", cascade="all, delete-orphan")
    policies = relationship("Policy", back_populates="client", cascade="all, delete-orphan")
    documents = relationship("ComplianceDocument", back_populates="client", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="client")

    @property
    def full_name(self):
        return f"{self.first_name} {self.surname}"
