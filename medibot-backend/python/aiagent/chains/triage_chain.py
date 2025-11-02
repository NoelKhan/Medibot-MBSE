"""
triage_chain.py — Fully LLM-driven triage reasoning with resilient JSON extraction.
"""

from typing import Dict, Any
import os
import json
import re
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate


def _extract_json(text: str) -> dict:
    """
    Attempts to extract and parse JSON from an LLM response robustly.
    Works even if model wraps text in explanations or code fences.
    """
    # Clean common wrappers
    cleaned = text.strip()
    cleaned = re.sub(r"```json|```", "", cleaned, flags=re.IGNORECASE)
    # Extract the first valid {...} block if present
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass
    # If still fails, wrap content into minimal JSON
    return {
        "severity_level": "UNKNOWN",
        "rationale": "Could not parse LLM JSON response.",
        "recommended_action": "manual review",
        "red_flags_triggered": [],
        "care_instructions": [text.strip()]
    }


def classify_severity(symptoms: Dict[str, Any], user_input: str) -> Dict[str, Any]:
    """
    Ask the LLM (MedLlama2) to decide triage severity, reasoning, and care plan.
    No heuristic logic; everything is model-driven.
    """
    model_name = os.getenv("OLLAMA_MODEL", "medllama2")
    chat = ChatOllama(model=model_name, temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """
You are an AI healthcare triage assistant.
Classify patient cases into one of: GREEN, AMBER, RED.

Definitions:
- GREEN: Mild, self-limiting, suitable for self-care.
- AMBER: Moderate, should see a GP/telehealth provider soon.
- RED: Emergency, needs immediate hospital/EMS intervention.

Respond ONLY in valid JSON. No markdown, no explanations outside JSON.
Follow this schema strictly:
{{
  "severity_level": "GREEN" | "AMBER" | "RED",
  "rationale": "Brief reasoning (2-3 sentences)",
  "recommended_action": "self-care" | "referral" | "emergency",
  "red_flags_triggered": ["list of red flags"],
  "care_instructions": ["specific, actionable patient instructions"]
}}
"""),
        ("user", "Patient says: {user_input}\n\nStructured symptoms: {symptoms}")
    ])

    msg = prompt.format_messages(user_input=user_input, symptoms=symptoms)
    out = chat.invoke(msg)
    raw_text = out.content.strip()

    # Try to extract and parse JSON
    data = _extract_json(raw_text)

    # Safety fallback — ensure all required keys exist
    for key in ["severity_level", "rationale", "recommended_action", "red_flags_triggered", "care_instructions"]:
        if key not in data:
            data[key] = "UNKNOWN" if key != "red_flags_triggered" and key != "care_instructions" else []

    return data
