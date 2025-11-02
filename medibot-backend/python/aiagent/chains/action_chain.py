"""
action_chain.py — Executes care pathway actions using LLM-provided recommendations.
"""

from typing import Dict, Any
from datetime import datetime, timedelta


def execute_action_plan(triage_result: Dict[str, Any]) -> Dict[str, Any]:
    """
    Use LLM-provided care_instructions to build the plan dynamically.
    If the model did not supply them, fall back to minimal safety instructions.
    """
    level = triage_result.get("severity_level", "UNKNOWN")
    action = triage_result.get("recommended_action", "manual review")
    llm_instructions = triage_result.get("care_instructions", [])

    # If the LLM didn't include usable instructions, create a minimal fallback.
    if not llm_instructions or not isinstance(llm_instructions, list):
        llm_instructions = [
            "Rest and hydrate.",
            "If symptoms worsen, seek medical help promptly."
        ]

    # Decide follow-up timing
    follow_up_due = None
    if action == "self-care":
        follow_up_due = (datetime.utcnow() + timedelta(hours=24)).isoformat()
    elif action == "referral":
        follow_up_due = (datetime.utcnow() + timedelta(hours=36)).isoformat()
    elif action == "emergency":
        follow_up_due = None  # no follow-up; immediate handover
    else:
        follow_up_due = (datetime.utcnow() + timedelta(hours=12)).isoformat()

    # Build structured plan aligned with API schema
    # API expects: type, urgency, instructions, specialization, resources
    urgency_map = {
        "self-care": "routine",
        "referral": "soon",
        "emergency": "immediate"
    }
    
    plan = {
        "type": action,  # Changed from action_type to match API schema
        "urgency": urgency_map.get(action, "routine"),
        "instructions": llm_instructions,  # Changed from tasks to match API schema
        "specialization": "general" if action == "referral" else None,
        "resources": [],
        "follow_up_due": follow_up_due
    }

    # For safety, always add a universal disclaimer
    if "This information is not medical advice." not in " ".join(llm_instructions):
        plan["instructions"].append(
            "This information is not medical advice. Seek professional help if uncertain."
        )

    return plan
