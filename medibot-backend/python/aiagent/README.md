# MediBot AI Agent - LangGraph Medical Triage System

## 🤖 Overview

Advanced medical AI agent built with LangGraph and LangChain, providing intelligent symptom analysis, medical triage, and action plan generation. Integrates with the MediBot platform to deliver sophisticated medical consultations powered by local LLMs.

## 🎯 Key Features

- **LangGraph Workflow**: State-based medical consultation flow
- **Symptom Extraction**: NLP-powered symptom identification
- **Medical Triage**: Severity assessment (1-10 scale) with risk categorization
- **Action Planning**: Automated recommendation generation (emergency, doctor, self-care)
- **Case Management**: Persistent conversation and case tracking
- **Vector Search**: FAISS-powered medical knowledge retrieval
- **Local LLM**: Ollama integration for privacy-preserving AI
- **FastAPI REST**: Production-ready API endpoints
- **Structured Outputs**: Consistent JSON responses for easy integration

## 📦 Architecture

```
AIAgent/
├── api/                    # FastAPI REST API server
│   ├── main.py            # API endpoints and server config
│   └── requirements.txt   # API-specific dependencies
├── graph/                  # LangGraph workflow definitions
│   └── care_flow.py       # Main medical consultation graph
├── chains/                 # LangChain components
│   ├── symptom_chain.py   # Symptom extraction chain
│   ├── triage_chain.py    # Severity assessment chain
│   ├── action_chain.py    # Action plan generation chain
│   └── summary_chain.py   # Summary generation chain
├── knowledge/              # Medical knowledge base
│   └── medical_data.json  # Conditions, symptoms, treatments
├── data/                   # Case storage (JSON files)
├── utils/                  # Utility modules
│   └── json_store.py      # Case persistence
├── main.py                 # Standalone CLI interface
├── requirements.txt        # Python dependencies
└── .env.example           # Environment configuration template
```

