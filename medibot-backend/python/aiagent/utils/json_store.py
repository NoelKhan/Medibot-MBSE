"""
json_store.py — utility to save and load JSON case files
"""

import json
import os
from datetime import datetime
import uuid

# Use absolute path to ensure it works from any working directory
BASE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")

def create_case(user_input: str) -> str:
    """Create new case JSON file."""
    case_id = str(uuid.uuid4())
    case_data = {
        "case_id": case_id,
        "created_at": datetime.utcnow().isoformat(),
        "status": "active",
        "conversation": [user_input]
    }
    path = os.path.join(BASE_PATH, "cases", f"{case_id}.json")
    with open(path, "w") as f:
        json.dump(case_data, f, indent=4)
    return case_id

def update_case(case_id: str, new_data: dict, folder: str = "cases"):
    """Update JSON file under data/{folder}/"""
    path = os.path.join(BASE_PATH, folder, f"{case_id}.json")
    with open(path, "w") as f:
        json.dump(new_data, f, indent=4)

def load_case(case_id: str, folder: str = "cases") -> dict:
    """Read existing JSON file."""
    path = os.path.join(BASE_PATH, folder, f"{case_id}.json")
    with open(path, "r") as f:
        return json.load(f)
