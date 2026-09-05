import uuid, datetime
from sqlalchemy import Column, String, DateTime
from app.database import Base
def gen_uuid(): return str(uuid.uuid4())
class ReminderDismissal(Base):
    __tablename__ = "reminder_dismissals"
    id = Column(String, primary_key=True, default=gen_uuid)
    reminder_key = Column(String(200), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
