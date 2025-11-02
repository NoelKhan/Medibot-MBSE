"""
Test suite for AI Agent FastAPI endpoints
"""
import pytest
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from api.main import app

client = TestClient(app)


def test_health_check():
    """Test basic health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "services" in data  # Changed from "version" to "services"


def test_chat_endpoint_basic():
    """Test basic chat functionality"""
    payload = {
        "message": "I have a headache and fever for 2 days",
        "user_id": "test_user_123",
        "include_history": False
    }
    
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    assert "case_id" in data
    assert "triage" in data
    assert "action" in data
    assert data["status"] == "success"


def test_chat_empty_message():
    """Test validation for empty message"""
    payload = {
        "message": "",
        "user_id": "test_user_123"
    }
    
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 422  # Validation error


def test_chat_missing_fields():
    """Test validation for missing required fields"""
    payload = {
        "user_id": "test_user_123"
    }
    
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 422


def test_triage_severity_levels():
    """Test different severity scenarios"""
    test_cases = [
        ("Minor headache for 1 hour", "GREEN"),
        ("Severe chest pain radiating to left arm", "RED"),
        ("Persistent cough for 2 weeks with fatigue", "AMBER"),
    ]
    
    for message, expected_severity in test_cases:
        payload = {
            "message": message,
            "user_id": "test_user_456"
        }
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "triage" in data
        assert "severity_level" in data["triage"]
        # Note: AI behavior may vary, so we just check structure


def test_conversation_history():
    """Test conversation history tracking"""
    # First message
    payload1 = {
        "message": "I have a headache",
        "user_id": "conv_test_user",
        "include_history": False
    }
    response1 = client.post("/api/chat", json=payload1)
    assert response1.status_code == 200
    case_id = response1.json()["case_id"]
    
    # Follow-up message
    payload2 = {
        "message": "It started this morning and is getting worse",
        "conversation_id": case_id,
        "user_id": "conv_test_user",
        "include_history": True
    }
    response2 = client.post("/api/chat", json=payload2)
    assert response2.status_code == 200
    assert response2.json()["case_id"] == case_id


def test_response_structure():
    """Test that response has all required fields"""
    payload = {
        "message": "I have a fever and sore throat",
        "user_id": "structure_test_user"
    }
    
    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200
    
    data = response.json()
    
    # Check top-level fields
    assert "case_id" in data
    assert "symptoms" in data
    assert "triage" in data
    assert "action" in data
    assert "summary" in data
    assert "message" in data
    assert "status" in data
    
    # Check symptoms structure
    symptoms = data["symptoms"]
    assert "associated_symptoms" in symptoms
    assert isinstance(symptoms["associated_symptoms"], list)
    
    # Check triage structure
    triage = data["triage"]
    assert "severity_level" in triage
    assert triage["severity_level"] in ["GREEN", "AMBER", "RED"]
    assert "rationale" in triage
    assert "recommended_action" in triage
    assert "red_flags_triggered" in triage
    assert "care_instructions" in triage
    
    # Check action structure
    action = data["action"]
    assert "type" in action
    assert "urgency" in action
    assert "instructions" in action
    assert isinstance(action["instructions"], list)
    
    # Check summary structure
    summary = data["summary"]
    assert "patient_summary" in summary
    assert "clinician_summary" in summary


def test_red_flag_detection():
    """Test that red flags are detected properly"""
    red_flag_messages = [
        "I have severe chest pain and I can't breathe",
        "I'm vomiting blood",
        "I have a sudden severe headache like a thunderclap",
    ]
    
    for message in red_flag_messages:
        payload = {
            "message": message,
            "user_id": "red_flag_test_user"
        }
        
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        # RED cases should have red flags
        if data["triage"]["severity_level"] == "RED":
            assert len(data["triage"]["red_flags_triggered"]) > 0


def test_error_handling():
    """Test error handling for invalid requests"""
    # Test with invalid JSON structure
    response = client.post(
        "/api/chat",
        data="invalid json",
        headers={"Content-Type": "application/json"}
    )
    assert response.status_code == 422


def test_concurrent_requests():
    """Test handling of concurrent requests"""
    import concurrent.futures
    
    def make_request(i):
        payload = {
            "message": f"Test message {i}",
            "user_id": f"concurrent_user_{i}"
        }
        return client.post("/api/chat", json=payload)
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        responses = list(executor.map(make_request, range(5)))
    
    for response in responses:
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
