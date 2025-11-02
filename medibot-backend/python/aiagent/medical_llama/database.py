"""
Database models for patient profiles and conversation history
"""
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Text, Boolean, Float, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from config import DATABASE_URL

Base = declarative_base()

class Patient(Base):
    """Patient profile"""
    __tablename__ = "patients"
    
    patient_id = Column(String(50), primary_key=True, index=True)
    name = Column(String(100))
    age = Column(Integer)
    medical_history = Column(Text)  # JSON string of medical conditions
    allergies = Column(Text)  # JSON string
    current_medications = Column(Text)  # JSON string
    preferred_language = Column(String(20), default="en")
    notification_preferences = Column(Text)  # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class Interaction(Base):
    """Conversation/interaction history"""
    __tablename__ = "interactions"
    
    interaction_id = Column(String(50), primary_key=True, index=True)
    patient_id = Column(String(50), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    user_message = Column(Text)
    assistant_response = Column(Text)
    severity = Column(String(50))  # self_care, referral, urgent, emergency
    confidence = Column(Float)  # 0.0 - 1.0
    care_pathway = Column(String(100))
    action_taken = Column(String(200))
    escalated = Column(Boolean, default=False)
    escalation_reason = Column(Text)

class MedicalEvent(Base):
    """Track medical events/escalations"""
    __tablename__ = "medical_events"
    
    event_id = Column(String(50), primary_key=True, index=True)
    patient_id = Column(String(50), index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(50))  # emergency, escalation, referral, etc.
    description = Column(Text)
    severity = Column(String(50))
    action_taken = Column(Text)
    resolved = Column(Boolean, default=False)

# Database setup
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency for FastAPI"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
