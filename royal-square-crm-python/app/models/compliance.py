import uuid
from sqlalchemy import Column, String, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
def gen_uuid(): return str(uuid.uuid4())
class ComplianceDocument(Base):
    __tablename__ = "compliance_documents"
    __table_args__ = (UniqueConstraint("client_id","type", name="uq_client_doc"),)
    id = Column(String, primary_key=True, default=gen_uuid)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    type = Column(String(40), nullable=False)
    signed_on = Column(Date, nullable=False)
    storage_key = Column(String(300), nullable=True)
    client = relationship("Client", back_populates="documents")
