"""
FastAPI Server for AI Agent
Exposes LangGraph workflow as REST API endpoints
"""
import os
import sys
from typing import Optional, Dict, Any
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Add parent directory to path to import graph
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from graph.care_flow import initialize_care_graph
from utils.json_store import load_case

app = FastAPI(
    title="MediBot AI Agent API",
    description="Medical triage and chat AI powered by LangGraph",
    version="1.0.0"
)

# CORS configuration for NestJS backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize LangGraph once at startup
care_graph = initialize_care_graph()
care_app = care_graph.compile()


# ==================== Request/Response Models ====================

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's message/symptoms")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID")
    user_id: Optional[str] = Field(None, description="User ID for tracking")
    include_history: bool = Field(True, description="Include conversation history")
    conversation_history: Optional[list] = Field(None, description="Previous conversation messages")


class SymptomFrame(BaseModel):
    chief_complaint: Optional[str] = None
    duration: Optional[str] = None
    severity_self: Optional[str] = None
    age_band: Optional[str] = None
    associated_symptoms: list[str] = []


class TriageResult(BaseModel):
    severity_level: str  # GREEN, AMBER, RED
    rationale: str
    recommended_action: str  # self-care, referral, emergency
    red_flags_triggered: list[str]
    care_instructions: list[str]
    confidence: Optional[float] = None


class ActionPlan(BaseModel):
    type: str  # self-care, book_appointment, emergency, referral
    specialization: Optional[str] = None
    urgency: str
    instructions: list[str]
    resources: list[str] = []


class SummaryResult(BaseModel):
    patient_summary: str
    clinician_summary: str


class ChatResponse(BaseModel):
    case_id: str
    symptoms: SymptomFrame
    triage: TriageResult
    action: ActionPlan
    summary: SummaryResult
    message: str  # Conversational response to user
    status: str = "success"


class HealthCheck(BaseModel):
    status: str
    version: str
    model: str


# ==================== Endpoints ====================

@app.get("/", response_model=HealthCheck)
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "model": os.getenv("OLLAMA_MODEL", "medllama2")
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test if Ollama is accessible
        import requests
        ollama_status = requests.get("http://localhost:11434/api/tags", timeout=2)
        ollama_healthy = ollama_status.status_code == 200
    except Exception:
        ollama_healthy = False
    
    return {
        "status": "healthy" if ollama_healthy else "degraded",
        "services": {
            "api": "healthy",
            "ollama": "healthy" if ollama_healthy else "unavailable",
            "langgraph": "healthy"
        }
    }


@app.post("/api/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Main endpoint: Process user message through LangGraph workflow
    Returns structured triage, symptoms, action plan, and summary
    """
    try:
        # Prepare state for LangGraph
        initial_state = {
            "user_input": request.message,
            "case_id": request.conversation_id
        }
        
        # Run LangGraph workflow
        result_state = care_app.invoke(initial_state)
        
        # Extract results
        case_id = result_state.get("case_id")
        symptoms = result_state.get("symptoms", {})
        triage = result_state.get("triage", {})
        action = result_state.get("action", {})
        summary = result_state.get("summary", {})
        
        # Generate conversational response based on triage
        message = generate_user_message(triage, action)
        
        # Format response
        response = ChatResponse(
            case_id=case_id,
            symptoms=SymptomFrame(**symptoms),
            triage=TriageResult(**triage),
            action=ActionPlan(**action),
            summary=SummaryResult(**summary),
            message=message,
            status="success"
        )
        
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")


@app.post("/api/triage")
async def quick_triage(request: ChatRequest):
    """
    Quick triage endpoint - returns only severity assessment
    Faster than full chat processing
    """
    try:
        initial_state = {
            "user_input": request.message,
            "case_id": request.conversation_id
        }
        
        result_state = care_app.invoke(initial_state)
        triage = result_state.get("triage", {})
        
        return {
            "severity": triage.get("severity_level"),
            "rationale": triage.get("rationale"),
            "red_flags": triage.get("red_flags_triggered", []),
            "action": triage.get("recommended_action")
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Triage failed: {str(e)}")


@app.post("/api/chat/triage")
async def chat_triage(request: ChatRequest):
    """
    Conversational triage endpoint for NestJS backend
    Returns triage assessment with conversational context
    """
    try:
        # Use user_id or generate new case_id
        case_id = request.conversation_id or request.user_id
        
        initial_state = {
            "user_input": request.message,
            "case_id": case_id  # Can be None for new cases
        }
        
        result_state = care_app.invoke(initial_state)
        triage = result_state.get("triage", {})
        action = result_state.get("action", {})
        symptoms = result_state.get("symptoms", {})
        
        # Map severity levels
        severity_map = {
            "RED": "emergency",
            "AMBER": "urgent", 
            "YELLOW": "referral",
            "GREEN": "self_care"
        }
        
        severity_level = triage.get("severity_level", "UNKNOWN")
        mapped_severity = severity_map.get(severity_level, "unknown")
        
        # Generate response
        recommendation = generate_user_message(triage, action)
        
        return {
            "severity": mapped_severity,
            "confidence": triage.get("confidence", 0.8),
            "recommendation": recommendation,
            "suggestedActions": triage.get("care_instructions", []),
            "disclaimer": "This is AI-generated advice and not a substitute for professional medical consultation.",
            "needsEscalation": severity_level == "RED",
            "carePathway": action,
            "actionPlan": action,
            "needsMoreInfo": len(symptoms.get("associated_symptoms", [])) < 2,
            "possibleConditions": triage.get("red_flags_triggered", [])
        }
        
    except Exception as e:
        import traceback
        print(f"Chat triage error: {str(e)}")
        print(traceback.format_exc())
        # Return a fallback response instead of error
        return {
            "severity": "referral",
            "confidence": 0.5,
            "recommendation": "I recommend speaking with a healthcare provider about your symptoms. Would you like me to help you book an appointment?",
            "suggestedActions": ["Monitor your symptoms", "Contact your healthcare provider", "Seek care if symptoms worsen"],
            "disclaimer": "This is AI-generated advice and not a substitute for professional medical consultation.",
            "needsEscalation": False,
            "carePathway": {"type": "referral", "urgency": "routine"},
            "actionPlan": {"type": "referral", "urgency": "routine"},
            "needsMoreInfo": True,
            "possibleConditions": []
        }


@app.get("/api/case/{case_id}")
async def get_case(case_id: str):
    """Retrieve case data from JSON store"""
    try:
        case_data = load_case(case_id)
        if not case_data:
            raise HTTPException(status_code=404, detail="Case not found")
        return case_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==================== Helper Functions ====================

def generate_user_message(triage: Dict[str, Any], action: Dict[str, Any]) -> str:
    """Generate conversational response for user based on triage"""
    severity = triage.get("severity_level", "UNKNOWN")
    
    if severity == "RED":
        return (
            "⚠️ Based on your symptoms, this requires immediate medical attention. "
            "Please call emergency services or go to the nearest emergency room right away. "
            "Your safety is our priority."
        )
    elif severity == "AMBER":
        return (
            "I recommend speaking with a healthcare provider soon about your symptoms. "
            "I can help you book an appointment with a doctor or nurse practitioner. "
            "In the meantime, here's what you can do..."
        )
    else:  # GREEN
        return (
            "Based on what you've told me, this appears manageable with self-care. "
            "I'll provide some recommendations, but please monitor your symptoms. "
            "If things worsen, don't hesitate to seek medical advice."
        )


# ==================== Startup/Shutdown ====================

@app.on_event("startup")
async def startup_event():
    print("🚀 AI Agent API Server starting...")
    print(f"📊 Using model: {os.getenv('OLLAMA_MODEL', 'medllama2')}")
    print("✅ LangGraph workflow initialized")


@app.on_event("shutdown")
async def shutdown_event():
    print("👋 AI Agent API Server shutting down...")


if __name__ == "__main__":
    port = int(os.getenv("AI_AGENT_PORT", "8000"))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
