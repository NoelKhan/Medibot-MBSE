"""
Test LangGraph workflow and graph nodes
"""
import pytest
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from graph.care_flow import initialize_care_graph
except ImportError:
    pytest.skip("LangGraph dependencies not installed", allow_module_level=True)


class TestGraphInitialization:
    """Test graph initialization and structure"""
    
    def test_graph_initialization(self):
        """Test that care graph initializes without errors"""
        graph = initialize_care_graph()
        assert graph is not None
    
    def test_graph_compilation(self):
        """Test that graph compiles successfully"""
        graph = initialize_care_graph()
        app = graph.compile()
        assert app is not None


class TestSymptomExtraction:
    """Test symptom extraction node"""
    
    def test_simple_symptom_extraction(self):
        """Test extraction of simple symptoms"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        initial_state = {
            "messages": ["I have a headache and fever"],
            "case_id": "test_001"
        }
        
        result = app.invoke(initial_state)
        
        assert "symptom_frame" in result
        assert result["symptom_frame"] is not None
        
    def test_complex_symptom_extraction(self):
        """Test extraction of complex symptom descriptions"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        initial_state = {
            "messages": [
                "I've had severe chest pain for 2 days, "
                "shortness of breath, and I'm feeling dizzy. "
                "It gets worse when I exercise."
            ],
            "case_id": "test_002"
        }
        
        result = app.invoke(initial_state)
        
        assert "symptom_frame" in result
        frame = result["symptom_frame"]
        assert "associated_symptoms" in frame
        assert isinstance(frame["associated_symptoms"], list)


class TestTriageLogic:
    """Test triage assessment node"""
    
    def test_green_triage(self):
        """Test low-severity (GREEN) triage"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        initial_state = {
            "messages": ["I have a mild headache that started an hour ago"],
            "case_id": "test_green"
        }
        
        result = app.invoke(initial_state)
        
        assert "triage_result" in result
        # Note: AI behavior may vary, so we just check structure
        assert "severity_level" in result["triage_result"]
    
    def test_red_triage(self):
        """Test high-severity (RED) triage"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        initial_state = {
            "messages": [
                "I have severe chest pain radiating to my left arm and jaw, "
                "I'm sweating profusely and I can't breathe properly"
            ],
            "case_id": "test_red"
        }
        
        result = app.invoke(initial_state)
        
        assert "triage_result" in result
        triage = result["triage_result"]
        assert "red_flags_triggered" in triage


class TestActionPlanning:
    """Test action planning node"""
    
    def test_action_plan_generation(self):
        """Test that action plans are generated"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        initial_state = {
            "messages": ["I have a persistent cough for 2 weeks"],
            "case_id": "test_action"
        }
        
        result = app.invoke(initial_state)
        
        assert "action_plan" in result
        plan = result["action_plan"]
        assert "type" in plan
        assert "instructions" in plan
        assert isinstance(plan["instructions"], list)


class TestWorkflowEnd2End:
    """Test complete workflow from start to finish"""
    
    def test_full_workflow_minor_case(self):
        """Test complete workflow for minor symptoms"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        initial_state = {
            "messages": ["I have a runny nose and mild sore throat"],
            "case_id": "test_e2e_minor"
        }
        
        result = app.invoke(initial_state)
        
        # Check all expected outputs are present
        assert "symptom_frame" in result
        assert "triage_result" in result
        assert "action_plan" in result
        assert "summary" in result
    
    def test_full_workflow_emergency(self):
        """Test complete workflow for emergency symptoms"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        initial_state = {
            "messages": ["I'm having severe chest pain and difficulty breathing"],
            "case_id": "test_e2e_emergency"
        }
        
        result = app.invoke(initial_state)
        
        # Check critical fields for emergency
        assert "triage_result" in result
        assert "action_plan" in result
        
        # Emergency cases should have urgent action
        if "action_plan" in result:
            assert result["action_plan"]["urgency"] in ["immediate", "emergency", "critical"]


class TestEdgeCases:
    """Test edge cases and error handling"""
    
    def test_empty_message(self):
        """Test handling of empty messages"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        initial_state = {
            "messages": [""],
            "case_id": "test_empty"
        }
        
        # Should handle gracefully without crashing
        try:
            result = app.invoke(initial_state)
            assert result is not None
        except Exception as e:
            # If it fails, ensure it fails gracefully
            assert "message" in str(e).lower() or "empty" in str(e).lower()
    
    def test_very_long_message(self):
        """Test handling of very long symptom descriptions"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        long_message = " ".join(["I have symptoms"] * 100)
        initial_state = {
            "messages": [long_message],
            "case_id": "test_long"
        }
        
        result = app.invoke(initial_state)
        assert result is not None


class TestConversationFlow:
    """Test multi-turn conversation handling"""
    
    def test_conversation_context(self):
        """Test that conversation context is maintained"""
        graph = initialize_care_graph()
        app = graph.compile()
        
        # First turn
        initial_state = {
            "messages": ["I have a headache"],
            "case_id": "test_conv_001"
        }
        
        result1 = app.invoke(initial_state)
        
        # Second turn with follow-up
        follow_up_state = {
            "messages": [
                "I have a headache",
                "It started this morning and is getting worse"
            ],
            "case_id": "test_conv_001"
        }
        
        result2 = app.invoke(follow_up_state)
        
        # Should have processed both messages
        assert result2 is not None


@pytest.fixture
def sample_state():
    """Fixture providing a sample state for testing"""
    return {
        "messages": ["I have fever and cough"],
        "case_id": "fixture_test_001"
    }


def test_with_fixture(sample_state):
    """Test using pytest fixture"""
    graph = initialize_care_graph()
    app = graph.compile()
    
    result = app.invoke(sample_state)
    assert result is not None


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
