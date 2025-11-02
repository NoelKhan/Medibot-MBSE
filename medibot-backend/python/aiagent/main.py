"""
main.py — Entry point: runs the LangGraph workflow with a single user input.
"""
import json
from graph.care_flow import initialize_care_graph

if __name__ == "__main__":
    print("🚀 Starting Healthcare AI Assistant (Prototype)...")

    graph = initialize_care_graph()
    app = graph.compile()  # build runnable app

    # Ask for a quick input (or replace with your own test string)
    try:
        user_text = input("Describe your symptoms (e.g., 'I’ve had a sore throat and mild fever for 2 days'): ").strip()
        if not user_text:
            user_text = "I've had a sore throat and mild fever for 2 days."
    except Exception:
        user_text = "I've had a sore throat and mild fever for 2 days."

    # Run the workflow
    result_state = app.invoke({"user_input": user_text})

    print("✅ Workflow complete.\n")

    # Pretty-print outputs
    symptoms = result_state.get("symptoms", {})
    triage = result_state.get("triage", {})
    action = result_state.get("action", {})
    summary = result_state.get("summary", {})

    # print("---- Parsed Symptoms ----")
    # print(symptoms)
    # print("\n---- Triage ----")
    # print(triage)
    # print("\n---- Action Plan ----")
    # print(action)
    # print("\n---- Summaries ----")
    # print(summary.get("patient_summary", ""))
    # print("\n--- Clinician ---")
    # print(summary.get("clinician_summary", ""))

    # print("\n✅ LangGraph run finished.")
    print(json.dumps(result_state, indent=2, ensure_ascii=False))
