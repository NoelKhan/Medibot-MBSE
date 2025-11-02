"""
summary_chain.py — Generates dynamic patient and clinician summaries
based entirely on the parsed LLM triage and action outputs.
"""

from typing import Dict, Any
from datetime import datetime
import os

try:
    from langchain_community.chat_models import ChatOllama
    from langchain_core.prompts import ChatPromptTemplate
    OLLAMA_AVAILABLE = True
except Exception:
    OLLAMA_AVAILABLE = False

def generate_summaries(user_input: str, symptoms: Dict[str, Any], triage_result: Dict[str, Any], action_plan: Dict[str, Any]) -> Dict[str, Any]:
    """
    Returns API-compatible summary format:
    {
      "patient_summary": str,
      "clinician_summary": str
    }
    """

    # Build patient summary (user-friendly)
    severity = triage_result.get("severity_level", "UNKNOWN")
    action_type = action_plan.get("type", "review")
    instructions = action_plan.get("instructions", [])
    
    patient_text = f"Based on your symptoms, you've been triaged as {severity}. "
    patient_text += f"Recommended action: {action_type}. "
    if instructions:
        patient_text += "Instructions: " + "; ".join(instructions[:3]) + ". "
    patient_text += "This is not a medical diagnosis. Seek professional help if symptoms worsen."

    # Build clinician summary (structured details)
    clinician_text = f"Chief complaint: {symptoms.get('chief_complaint', user_input)}. "
    clinician_text += f"Duration: {symptoms.get('duration', 'unknown')}. "
    clinician_text += f"Associated symptoms: {', '.join(symptoms.get('associated_symptoms', []))}. "
    clinician_text += f"Triage level: {severity}. "
    clinician_text += f"Rationale: {triage_result.get('rationale', 'N/A')}. "
    
    red_flags = triage_result.get("red_flags_triggered", [])
    if red_flags:
        clinician_text += f"Red flags: {', '.join(red_flags)}. "
    
    clinician_text += f"Recommended action: {triage_result.get('recommended_action', 'review')}."

    # Optional LLM enhancement (make patient summary more natural)
    if OLLAMA_AVAILABLE:
        try:
            model_name = os.getenv("OLLAMA_MODEL", "biomistral")
            chat = ChatOllama(model=model_name, temperature=0.7)
            prompt = ChatPromptTemplate.from_messages([
                ("system", "You are a medical triage assistant. Rewrite this triage summary in a clear, empathetic, patient-friendly way (2-3 sentences)."),
                ("user", patient_text)
            ])
            msg = prompt.format_messages()
            result = chat.invoke(msg)
            patient_text = result.content.strip()
        except Exception:
            pass  # Use fallback text

    return {
        "patient_summary": patient_text,
        "clinician_summary": clinician_text
    }
