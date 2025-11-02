"""
FastAPI backend for Medical Llama system
"""
import uuid
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db, init_db, Patient, Interaction, MedicalEvent
from workflow import MedicalWorkflow
from config import SeverityLevel, CarePathway
import json

# Initialize
init_db()
app = FastAPI(
    title="Medical Llama API",
    description="Patient-facing medical triage and care recommendation chatbot",
    version="1.0.0"
)

# Add CORS middleware to allow browser requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for local development)
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

workflow = MedicalWorkflow()

# ============================================================================
# Request/Response Models
# ============================================================================

class PatientProfile(BaseModel):
    patient_id: str
    name: str
    age: int
    medical_history: Optional[List[str]] = None
    allergies: Optional[List[str]] = None
    current_medications: Optional[List[str]] = None
    notification_preferences: Optional[dict] = None

    model_config = {"from_attributes": True}

class ChatMessage(BaseModel):
    patient_id: str
    message: str
    include_history: bool = True

class TriageResponse(BaseModel):
    severity: str
    confidence: float
    recommendation: str
    suggested_actions: List[str]
    disclaimer: str
    needs_escalation: bool
    care_pathway: Optional[dict] = None
    action_plan: Optional[dict] = None

class ConversationHistory(BaseModel):
    patient_id: str
    user: str
    assistant: str
    timestamp: datetime
    severity: Optional[str] = None

# ============================================================================
# Patient Management Endpoints
# ============================================================================

@app.post("/patients/register", response_model=PatientProfile)
def register_patient(profile: PatientProfile, db: Session = Depends(get_db)):
    """Register a new patient"""
    # Check if patient already exists
    existing = db.query(Patient).filter(Patient.patient_id == profile.patient_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient already registered")
    
    patient = Patient(
        patient_id=profile.patient_id,
        name=profile.name,
        age=profile.age,
        medical_history=json.dumps(profile.medical_history or []),
        allergies=json.dumps(profile.allergies or []),
        current_medications=json.dumps(profile.current_medications or []),
        notification_preferences=json.dumps(profile.notification_preferences or {}),
    )
    
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    # Return with parsed JSON
    return PatientProfile(
        patient_id=patient.patient_id,
        name=patient.name,
        age=patient.age,
        medical_history=profile.medical_history or [],
        allergies=profile.allergies or [],
        current_medications=profile.current_medications or [],
        notification_preferences=profile.notification_preferences or {}
    )

@app.get("/patients/{patient_id}", response_model=PatientProfile)
def get_patient(patient_id: str, db: Session = Depends(get_db)):
    """Get patient profile"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Parse JSON fields
    return PatientProfile(
        patient_id=patient.patient_id,
        name=patient.name,
        age=patient.age,
        medical_history=json.loads(patient.medical_history) if patient.medical_history else [],
        allergies=json.loads(patient.allergies) if patient.allergies else [],
        current_medications=json.loads(patient.current_medications) if patient.current_medications else [],
        notification_preferences=json.loads(patient.notification_preferences) if patient.notification_preferences else {}
    )

@app.put("/patients/{patient_id}", response_model=PatientProfile)
def update_patient(patient_id: str, profile: PatientProfile, db: Session = Depends(get_db)):
    """Update patient profile"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient.name = profile.name
    patient.age = profile.age
    patient.medical_history = json.dumps(profile.medical_history or [])
    patient.allergies = json.dumps(profile.allergies or [])
    patient.current_medications = json.dumps(profile.current_medications or [])
    patient.notification_preferences = json.dumps(profile.notification_preferences or {})
    patient.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(patient)
    
    # Return with parsed JSON
    return PatientProfile(
        patient_id=patient.patient_id,
        name=patient.name,
        age=patient.age,
        medical_history=profile.medical_history or [],
        allergies=profile.allergies or [],
        current_medications=profile.current_medications or [],
        notification_preferences=profile.notification_preferences or {}
    )

# ============================================================================
# Conversation/Triage Endpoints
# ============================================================================

@app.post("/chat/triage", response_model=TriageResponse)
def triage_patient(
    chat: ChatMessage,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = None
):
    """
    Run medical triage on patient input
    """
    try:
        # Get patient profile
        patient = db.query(Patient).filter(Patient.patient_id == chat.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Get conversation history if requested
        conversation_history = []
        if chat.include_history:
            interactions = db.query(Interaction).filter(
                Interaction.patient_id == chat.patient_id
            ).order_by(Interaction.timestamp.desc()).limit(5).all()
            
            conversation_history = [
                {
                    "user": i.user_message,
                    "assistant": i.assistant_response
                }
                for i in reversed(interactions)
            ]
        
        # Run workflow
        result = workflow.run(
            patient_id=chat.patient_id,
            user_input=chat.message,
            conversation_history=conversation_history
        )
        
        # Debug: Check if result is None
        if result is None:
            print(f"\n=== WARNING: Workflow returned None ===")
            raise HTTPException(status_code=500, detail="Workflow returned no result")
        
        print(f"\n=== WORKFLOW RESULT ===")
        print(f"Result keys: {result.keys() if isinstance(result, dict) else 'Not a dict'}")
        print(f"Triage result: {result.get('triage_result', 'Missing') if isinstance(result, dict) else 'N/A'}")
        print(f"======================\n")
        
        # Store interaction in database (background task)
        def store_interaction():
            try:
                interaction = Interaction(
                    interaction_id=str(uuid.uuid4()),
                    patient_id=chat.patient_id,
                    user_message=chat.message,
                    assistant_response=str(result.get("action_plan", {})),
                    severity=result.get("severity"),
                    confidence=result.get("confidence", 0.5),
                    care_pathway=result.get("recommended_pathway"),
                    escalated=result.get("needs_escalation", False),
                    escalation_reason=result.get("error"),
                )
                db.add(interaction)
                
                # If escalated, also create medical event
                if result.get("needs_escalation"):
                    event = MedicalEvent(
                        event_id=str(uuid.uuid4()),
                        patient_id=chat.patient_id,
                        event_type="escalation" if not result.get("is_emergency") else "emergency",
                        description=chat.message,
                        severity=result.get("severity"),
                        action_taken=str(result.get("action_plan", {})),
                    )
                    db.add(event)
                
                db.commit()
            except Exception as e:
                print(f"Error storing interaction: {e}")
                db.rollback()
        
        if background_tasks:
            background_tasks.add_task(store_interaction)
        else:
            store_interaction()
        
        # Format response - handle conversational flow
        triage_result = result.get("triage_result", {})
        
        # For conversational responses (needs_more_info), use appropriate defaults
        if triage_result.get("needs_more_info", False):
            return TriageResponse(
                severity="unknown",  # Not yet determined
                confidence=1.0,  # High confidence in asking the question
                recommendation=triage_result.get("recommendation", "Please provide more details"),
                suggested_actions=triage_result.get("suggested_actions") or [],  # Handle None
                disclaimer=triage_result.get("disclaimer", "This is not medical advice. Always consult a healthcare provider."),
                needs_escalation=False,  # Don't escalate during information gathering
                care_pathway=None,
                action_plan=None,
            )
        
        # For complete triage responses
        return TriageResponse(
            severity=result.get("severity", triage_result.get("severity", "referral")),
            confidence=result.get("confidence", triage_result.get("confidence", 0.5)),
            recommendation=triage_result.get("recommendation", "Please consult a healthcare provider"),
            suggested_actions=triage_result.get("suggested_actions") or [],  # Handle None
            disclaimer=triage_result.get("disclaimer", "This is not medical advice. Always consult a healthcare provider."),
            needs_escalation=result.get("needs_escalation", False),
            care_pathway=result.get("care_pathway"),
            action_plan=result.get("action_plan"),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_details = traceback.format_exc()
        print(f"\n=== TRIAGE ERROR ===")
        print(error_details)
        print(f"===================\n")
        raise HTTPException(status_code=500, detail=f"Triage failed: {str(e)}")

@app.get("/chat/history/{patient_id}", response_model=List[ConversationHistory])
def get_conversation_history(patient_id: str, limit: int = 20, db: Session = Depends(get_db)):
    """Get conversation history for a patient"""
    patient = db.query(Patient).filter(Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    interactions = db.query(Interaction).filter(
        Interaction.patient_id == patient_id
    ).order_by(Interaction.timestamp.desc()).limit(limit).all()
    
    return [
        ConversationHistory(
            patient_id=i.patient_id,
            user=i.user_message,
            assistant=i.assistant_response,
            timestamp=i.timestamp,
            severity=i.severity,
        )
        for i in reversed(interactions)
    ]

# ============================================================================
# Health and Info Endpoints
# ============================================================================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "medical-llama"}

@app.get("/info")
def service_info():
    """Service information"""
    return {
        "name": "Medical Llama",
        "version": "1.0.0",
        "model": "BioMistral 7B",
        "description": "Patient-facing medical triage and care recommendation chatbot",
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
