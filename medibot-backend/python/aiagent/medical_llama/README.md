# Medical Llama 🦙💊

A patient-facing medical triage and care recommendation chatbot built with LangChain, Langraph, and BioMistral 7B.

## Features

✅ **Multi-turn conversational triage** - Patients describe symptoms naturally  
✅ **Severity classification** - Auto-classify: Self-Care, Referral, Urgent, Emergency  
✅ **Care pathway recommendations** - Suggest next steps: GP, specialist, telehealth, OTC, or emergency  
✅ **Action execution** - Provide concrete, step-by-step guidance  
✅ **Safety guardrails** - Emergency keyword detection, confidence-based escalation, disclaimers  
✅ **Patient profiles & history** - Persistent storage with SQLite  
✅ **Medical-grade LLM** - MedLLaMA2 (fine-tuned on medical literature)  
✅ **Local inference** - Runs entirely on your machine (privacy-first)  

## Architecture

```
Patient Input (Text)
    ↓
[LangChain Memory Manager] ← retrieves conversation history
    ↓
[Langraph State Machine]
  ├─ Triage Node: LLM analyzes symptoms → severity
  ├─ Emergency Check: Hard rules + confidence thresholds
  ├─ Care Pathway: Recommend next steps (GP, specialist, OTC, etc.)
  └─ Action Node: Generate step-by-step guidance
    ↓
[FastAPI Backend] → JSON response
    ↓
[SQLite Database] ← stores patient profile, history, events
    ↓
Patient sees: Recommendation + Disclaimer + Action Buttons
```

## Requirements

- **Hardware:** NVIDIA GTX 1650 (4GB VRAM) or better, 16GB+ system RAM
- **OS:** Windows, Linux, macOS
- **Python:** 3.10+
- **Ollama:** v0.1.0+

## Installation

### 1. Install Ollama (Model Runtime)

Download and install from https://ollama.ai

```powershell
# Windows (via winget)
winget install ollama

# Or download manually: https://ollama.ai/download
```

### 2. Pull MedLLaMA2 Model

```powershell
ollama pull medllama2:latest
# Already installed! ~3.8GB
```

### 3. Verify Ollama is Running

```powershell
# Ollama runs as a background service after installation
# Verify it's listening on http://localhost:11434

ollama list
# Should see medllama2:latest in the output
```

### 4. Set Up Python Environment

```powershell
cd "path\to\medical_llama"

# Create virtual environment
python -m venv venv

# Activate (Windows)
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 5. Initialize Database

```powershell
python -c "from database import init_db; init_db(); print('Database initialized')"
```

### 6. Start the API Server

```powershell
python main.py
# Server starts on http://localhost:8000
```

### 7. Test the API

Open http://localhost:8000/docs (Swagger UI) or use curl:

```bash
# Register a patient
curl -X POST "http://localhost:8000/patients/register" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "patient_001",
    "name": "John Doe",
    "age": 35,
    "medical_history": ["hypertension"],
    "allergies": ["penicillin"],
    "current_medications": []
  }'

# Run triage
curl -X POST "http://localhost:8000/chat/triage" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "patient_001",
    "message": "I have had a sore throat and cough for two days, feeling tired"
  }'
```

## API Endpoints

### Patient Management

- `POST /patients/register` - Register new patient
- `GET /patients/{patient_id}` - Get patient profile
- `PUT /patients/{patient_id}` - Update patient profile

### Conversation

- `POST /chat/triage` - Run medical triage
- `GET /chat/history/{patient_id}` - Get conversation history

### Info

- `GET /health` - Health check
- `GET /info` - Service information
- `GET /docs` - Interactive API documentation (Swagger UI)

## Configuration

Edit `config.py` to customize:

```python
# LLM Settings
LLM_MODEL = "biomistral:latest"  # Change model here
LLM_TEMPERATURE = 0.3  # Lower = more conservative (0.0-1.0)

# Safety
CONFIDENCE_THRESHOLD = 0.6  # Escalate if confidence < this
EMERGENCY_KEYWORDS = ["chest pain", "difficulty breathing", ...]  # Add/remove keywords

# Severity levels
class SeverityLevel(str, Enum):
    SELF_CARE = "self_care"
    REFERRAL = "referral"
    URGENT = "urgent"
    EMERGENCY = "emergency"
```

## Safety & Disclaimers

⚠️ **Important:**

- This tool is **NOT** a substitute for professional medical advice
- Always consult a qualified healthcare provider for diagnosis and treatment
- In case of emergency, call 999 (UK) or your local emergency number
- Patient data should be encrypted and comply with HIPAA/GDPR if handling real patients

The system includes:
- ✅ Emergency keyword detection (auto-escalates)
- ✅ Confidence-based escalation (uncertain cases go to clinician)
- ✅ Medical disclaimers on all responses
- ✅ Audit logging of all interactions
- ✅ Hard rules for high-risk outputs

## Usage Examples

### Example 1: Self-Care Case

**Patient:** "I have a mild headache and slight fever."

**System Response:**
```json
{
  "severity": "self_care",
  "confidence": 0.85,
  "recommendation": "This sounds like a mild viral illness. Rest, hydrate, and take over-the-counter pain relievers.",
  "suggested_actions": ["rest", "drink_fluids", "monitor_symptoms"],
  "care_pathway": "self_care_advice",
  "disclaimer": "Not a substitute for medical advice. Consult a doctor if symptoms worsen."
}
```

### Example 2: Emergency Case

**Patient:** "I have severe chest pain and difficulty breathing."

**System Response:**
```json
{
  "severity": "emergency",
  "confidence": 1.0,
  "recommendation": "IMMEDIATE MEDICAL ATTENTION REQUIRED. Call 999 or go to nearest emergency room.",
  "suggested_actions": ["call_emergency_services", "go_to_nearest_hospital"],
  "care_pathway": "emergency_escalation",
  "needs_escalation": true
}
```

### Example 3: Referral Case

**Patient:** "I've had a persistent cough for 3 weeks."

**System Response:**
```json
{
  "severity": "referral",
  "confidence": 0.72,
  "recommendation": "A persistent cough lasting 3 weeks warrants evaluation by a GP.",
  "suggested_actions": ["book_gp_appointment", "monitor_symptoms"],
  "care_pathway": "schedule_follow_up",
  "action_plan": {
    "action": "book_appointment",
    "steps": ["Contact your GP", "Describe your symptoms", "Get appointment date"],
    "disclaimer": "Not a diagnosis. A GP will determine the cause and treatment."
  }
}
```

## Development

### Project Structure

```
medical_llama/
├── config.py              # Configuration & prompts
├── database.py            # SQLAlchemy models
├── llm_wrapper.py         # LLM interface (Ollama + BioMistral)
├── workflow.py            # Langraph state machine
├── main.py                # FastAPI server
├── requirements.txt       # Python dependencies
└── README.md              # This file
```

### Adding Custom Prompts

Edit system prompts in `config.py`:

```python
TRIAGE_SYSTEM_PROMPT = """You are a medical triage assistant..."""
CARE_PATHWAY_SYSTEM_PROMPT = """You are a care pathway recommender..."""
ACTION_EXECUTION_SYSTEM_PROMPT = """You are an action execution assistant..."""
```

### Testing Workflows

```python
from workflow import MedicalWorkflow

workflow = MedicalWorkflow()
result = workflow.run(
    patient_id="test_001",
    user_input="I have a fever and cough",
    conversation_history=[]
)

print(result)
```

## Performance Tuning

### For Faster Inference

```python
# config.py
LLM_TEMPERATURE = 0.2  # Lower temperature = faster, more deterministic
LLM_MAX_TOKENS = 512   # Shorter outputs = faster
```

### For Better Quality

```python
LLM_TEMPERATURE = 0.5  # Higher temperature = more creative, slower
LLM_MAX_TOKENS = 1024  # Longer outputs = higher quality, slower
```

## Troubleshooting

### "Connection refused to localhost:11434"

Ollama is not running.

```powershell
# Start Ollama
ollama serve

# Or restart the Ollama service
Get-Service -Name "ollama" | Restart-Service
```

### "Model not found: biomistral:latest"

Pull the model:

```powershell
ollama pull biomistral:latest
```

### "CUDA out of memory"

Your GPU VRAM is too low. Options:

1. Reduce batch size (not applicable for single-user)
2. Use quantized model (already doing 4-bit)
3. Use smaller model (Phi-3 instead of BioMistral)

### Slow inference

If responses take >10 seconds:

1. Check GPU utilization (`nvidia-smi`)
2. Reduce `LLM_MAX_TOKENS` in config
3. Lower `LLM_TEMPERATURE` for faster inference
4. Ensure no other GPU processes are running

## Future Enhancements

- [ ] Voice input support (Whisper STT)
- [ ] Multi-language support
- [ ] Image upload for rash/wound analysis
- [ ] Integration with EHR systems
- [ ] SMS/WhatsApp interface
- [ ] Fine-tuning on proprietary medical data
- [ ] Advanced drug interaction checker
- [ ] Wearable integration (heart rate, SpO2, etc.)

## License

MIT

## Support

For issues or questions:
1. Check troubleshooting above
2. Review API docs at `http://localhost:8000/docs`
3. Open an issue with error logs

---

**Made with ❤️ for patient empowerment and accessible healthcare.**
