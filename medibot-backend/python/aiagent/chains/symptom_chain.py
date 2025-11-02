"""
symptom_chain.py — Symptom extraction via local LLM (Ollama/medllama2 only).
"""

from typing import Dict, Any, Optional, List
import os
import re
from pydantic import BaseModel, Field, ValidationError

# LLM imports
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate


class SymptomFrame(BaseModel):
    chief_complaint: str = Field(default="")
    duration_days: Optional[float] = Field(default=None)
    severity_self: Optional[str] = Field(default=None)
    associated_symptoms: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)
    age_band: Optional[str] = Field(default=None)
    medications: List[str] = Field(default_factory=list)
    allergies: List[str] = Field(default_factory=list)


def extract_symptoms(user_input: str) -> Dict[str, Any]:
    """
    Fully LLM-driven extraction — no heuristics or external data.
    """
    model_name = os.getenv("OLLAMA_MODEL", "biomistral")
    chat = ChatOllama(model=model_name, temperature=0)

    prompt = ChatPromptTemplate.from_messages([
        ("system", """
        You are an experienced triage assistant.
        Your job is to read the user's description of symptoms
        and extract structured information as JSON.

        Rules:
        - Infer what the user most likely means.
        - If something is not mentioned, set it to null or [].
        - Do NOT add explanations — output ONLY JSON.
        Keys:
          chief_complaint, duration_days, severity_self,
          associated_symptoms, risk_factors, age_band,
          medications, allergies.
        """),
        ("user", "{user_input}")
    ])

    msg = prompt.format_messages(user_input=user_input)
    out = chat.invoke(msg)
    text = out.content.strip()
    text = re.sub(r"^```json|```$", "", text, flags=re.MULTILINE).strip()

    try:
        return SymptomFrame.model_validate_json(text).model_dump()
    except ValidationError:
        # If the LLM returns invalid JSON, just wrap raw text
        return {"chief_complaint": user_input, "raw_output": text}
