"""
safety_rules.py — red flag detection and safety helpers.
"""

from typing import List, Dict, Any

# Text-based phrase checks (for raw user text)
RED_FLAG_PHRASES = [
    "chest pain",
    "difficulty breathing",
    "shortness of breath",
    "cannot breathe",
    "blue lips",
    "drooling",
    "cannot swallow",
    "stiff neck",
    "confusion",
    "fainting",
    "passed out",
    "seizure",
    "blood in stool",
    "blood in vomit",
    "severe dehydration",
    "very drowsy",
    "unresponsive",
]

def check_red_flags_text(user_input: str) -> List[str]:
    text = user_input.lower()
    return [p for p in RED_FLAG_PHRASES if p in text]


# Structured red flag checks (from SymptomFrame)
def check_red_flags_struct(symptoms: Dict[str, Any]) -> List[str]:
    hits = []

    assoc = [s.lower() for s in symptoms.get("associated_symptoms", [])]
    sev = (symptoms.get("severity_self") or "").lower()
    age_band = (symptoms.get("age_band") or "").lower()

    # Examples of simple structured rules
    if "chest pain" in (symptoms.get("chief_complaint") or "").lower():
        hits.append("chest pain")

    if "difficulty breathing" in assoc or "shortness of breath" in assoc:
        hits.append("difficulty breathing")

    # infant fever rule (if you later parse age properly)
    if age_band in ["<3m", "3-12m"] and ("fever" in assoc or "high fever" in assoc):
        hits.append("fever in infant")

    if sev == "severe":
        hits.append("reported severe condition")

    # drooling / cannot swallow
    if "drooling" in assoc or "cannot swallow" in assoc:
        hits.append("airway/swallowing issue")

    return hits
