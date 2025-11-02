"""
care_flow.py — LangGraph workflow wired to LangChain chains.
"""

from typing import TypedDict, Optional, Dict, Any
from langgraph.graph import StateGraph, END

# from asyncio import graph
from chains.symptom_chain import extract_symptoms
from chains.triage_chain import classify_severity
from chains.action_chain import execute_action_plan
# from chains.summary_chain import generate_summary
from chains.summary_chain import generate_summaries

from utils.json_store import create_case, load_case, update_case

# from retriever.retriever_chain import retrieve_snippets


class CareState(TypedDict, total=False):
    case_id: Optional[str]
    user_input: Optional[str]
    symptoms: Optional[Dict[str, Any]]
    triage: Optional[Dict[str, Any]]
    action: Optional[Dict[str, Any]]
    summary: Optional[Dict[str, str]]


def initialize_care_graph():
    graph = StateGraph(CareState)

    # ------------------- Nodes -------------------
    def collect_symptoms(state: CareState):
        user_input = state.get("user_input", "") or ""
        case_id = state.get("case_id")

        # Create case if needed
        if not case_id:
            case_id = create_case(user_input)
        else:
            case_data = load_case(case_id)
            case_data["conversation"].append(user_input)
            update_case(case_id, case_data)

        # Extract structured symptoms
        symptoms = extract_symptoms(user_input)

        # Save to /data/triage as well
        triage_stub = {"note": "symptoms extracted"}
        update_case(case_id, {**load_case(case_id), "last_symptoms": symptoms})

        return {"case_id": case_id, "symptoms": symptoms}

    # def retrieve_knowledge(state: CareState):
    #     user_input = state.get("user_input", "") or ""
    #     print("📚 [Node] Retrieving medical knowledge...")

    #     try:
    #         snippets = retrieve_snippets(user_input, k=3)
    #         references = [{"text": s[0], "source": s[1]} for s in snippets]
    #         print(f"   ↳ Retrieved {len(references)} relevant snippets.")
    #     except Exception as e:
    #         print(f"⚠️ Knowledge retrieval failed: {e}")
    #         references = []

    #     return {**state, "references": references}

    def classify_node(state: CareState):
        user_input = state.get("user_input", "") or ""
        symptoms = state.get("symptoms", {}) or {}
        refs = state.get("references", [])

        # concatenate retrieved text
        context_text = "\n\n".join([r["text"] for r in refs])
        user_combined = f"{user_input}\n\nRelevant context:\n{context_text}"

        triage = classify_severity(symptoms, user_combined)
        #triage = classify_severity(symptoms, user_input)

        # Persist triage
        case_id = state.get("case_id")
        if case_id:
            case = load_case(case_id)
            case["triage"] = triage
            update_case(case_id, case)

        # Emergency fast path stays inside graph via edges
        return {"triage": triage}

    def execute_node(state: CareState):
        triage = state.get("triage", {}) or {}
        action = execute_action_plan(triage)

        # Persist
        case_id = state.get("case_id")
        if case_id:
            case = load_case(case_id)
            case["action"] = action
            update_case(case_id, case)

        return {"action": action}

    def follow_up(state: CareState):
        # For MVP, nothing dynamic; just pass along
        return state

    def generate_node(state: CareState):
        user_input = state.get("user_input", "")
        symptoms = state.get("symptoms", {})
        triage = state.get("triage", {})
        action = state.get("action", {})

        from chains.summary_chain import generate_summaries

        summary = generate_summaries(
            user_input=user_input,
            symptoms=symptoms,
            triage_result=triage,
            action_plan=action
        )

        # Persist for continuity
        case_id = state.get("case_id")
        if case_id:
            from utils.json_store import load_case, update_case
            case = load_case(case_id)
            case["summary"] = summary
            update_case(case_id, case)

        # Return structured output for frontend integration
        return {
            "summary": summary,
            "symptoms": symptoms,
            "triage": triage,
            "action": action,
        }

    def emergency_exit(state: CareState):
        # In this MVP, emergency path is represented by RED triage + action plan in the next node.
        return state

    # ------------------- Add nodes -------------------
    graph.add_node("collect_symptoms", collect_symptoms)
    # graph.add_node("retrieve_knowledge", retrieve_knowledge)
    graph.add_node("classify_severity", classify_node)
    graph.add_node("execute_action", execute_node)
    graph.add_node("follow_up", follow_up)
    graph.add_node("generate_summaries", generate_node)
    graph.add_node("emergency_exit", emergency_exit)

    # ------------------- Edges -------------------
    # graph.add_edge("collect_symptoms", "retrieve_knowledge")
    # graph.add_edge("retrieve_knowledge", "classify_severity")
    graph.add_edge("collect_symptoms", "classify_severity")
    graph.add_edge("classify_severity", "execute_action")
    graph.add_edge("execute_action", "follow_up")
    graph.add_edge("follow_up", "generate_summaries")
    graph.add_edge("classify_severity", "emergency_exit")  # kept for future branching

    # ------------------- Start/Finish -------------------
    graph.set_entry_point("collect_symptoms")
    graph.set_finish_point("generate_summaries")

    return graph
