import uuid, datetime
from sqlalchemy import Column, String, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base
def gen_uuid(): return str(uuid.uuid4())

STAGES = ["REGISTERED","DOCS_REQUESTED","DOCS_RECEIVED","ASSESSOR_APPOINTED","ASSESSMENT","DECISION","OFFER","ACCEPTED","PAID","CLOSED"]
SCENE_ITEMS = ["PHOTOS","POLICE_REPORT","WITNESS_DETAILS","DAMAGE_ESTIMATE","INVOICES"]

class Claim(Base):
    __tablename__ = "claims"
    id = Column(String, primary_key=True, default=gen_uuid)
    client_id = Column(String, ForeignKey("clients.id"), nullable=False)
    reference = Column(String(30), unique=True, nullable=False)
    insurer = Column(String(80), nullable=False)
    policy_number = Column(String(40), nullable=True)
    insurer_claim_number = Column(String(40), nullable=True)
    claims_handler = Column(String(120), nullable=True)
    claim_type = Column(String(60), nullable=False)
    incident_date = Column(Date, nullable=False)
    lodged_date = Column(Date, nullable=False)
    description = Column(Text, nullable=True)
    stage = Column(String(30), default="REGISTERED")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    client = relationship("Client", back_populates="claims")
    scene_items = relationship("ClaimSceneItem", cascade="all, delete-orphan", back_populates="claim")
    logs = relationship("ClaimLogEntry", cascade="all, delete-orphan", back_populates="claim", order_by="ClaimLogEntry.recorded_at")

    def step_number(self): return STAGES.index(self.stage)+1 if self.stage in STAGES else 1
    def total_steps(self): return len(STAGES)
    def is_closed(self): return self.stage=="CLOSED"
    def advance(self):
        if self.stage in STAGES and STAGES.index(self.stage) < len(STAGES)-1:
            self.stage = STAGES[STAGES.index(self.stage)+1]
            self.logs.append(ClaimLogEntry(text=f"Advanced to {self.stage}"))
    def has_gathered(self, item): return any(s.item==item for s in self.scene_items)
    def gather(self, item):
        if not self.has_gathered(item): self.scene_items.append(ClaimSceneItem(item=item))
    def ungather(self, item):
        self.scene_items = [s for s in self.scene_items if s.item!=item]

class ClaimSceneItem(Base):
    __tablename__ = "claim_scene_items"
    claim_id = Column(String, ForeignKey("claims.id"), primary_key=True)
    item = Column(String(40), primary_key=True)
    claim = relationship("Claim", back_populates="scene_items")

class ClaimLogEntry(Base):
    __tablename__ = "claim_log_entries"
    id = Column(String, primary_key=True, default=gen_uuid)
    claim_id = Column(String, ForeignKey("claims.id"), nullable=False)
    text = Column(String(500), nullable=False)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)
    claim = relationship("Claim", back_populates="logs")
