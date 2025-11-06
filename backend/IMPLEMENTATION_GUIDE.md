# LangGraph Agent Implementation Guide - MVP

## Overview

This is a simplified, learning-focused guide to build a functional MVP LangGraph agent with:
- **LangGraph**: For agent workflows and state management
- **LangSmith**: For tracing and observability
- **Opik**: For additional AI capabilities (optional)
- **Qdrant Cloud**: For vector storage (documents, invoices, memory)
- **FastAPI**: For API endpoints to connect with frontend
- **Jupyter Notebooks**: Primary development environment (most code in .ipynb)

## Approach

- **MVP-focused**: Only essential features for functionality
- **Notebook-first**: Most code in Jupyter notebooks, minimal .py files
- **Learning-friendly**: Simple structure, clear steps
- **Doppler**: All secrets managed via Doppler (no .env files)
- **Qdrant Cloud**: Using cloud service (no local Docker)
- **Streaming**: Chat responses support streaming for real-time interaction
- **File Storage**: Files processed in-memory for MVP (S3/S3-compatible storage post-MVP)
- **Authentication**: Deferred post-MVP to keep MVP simple

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Setup and Configuration](#step-1-setup-and-configuration)
3. [Step 2: Qdrant Cloud Setup](#step-2-qdrant-cloud-setup)
4. [Step 3: Embedding Service](#step-3-embedding-service)
5. [Step 4: TFL Invoice Processing](#step-4-tfl-invoice-processing)
6. [Step 5: LangGraph Nodes](#step-5-langgraph-nodes)
7. [Step 6: LangGraph Flow](#step-6-langgraph-flow)
8. [Step 7: FastAPI Endpoints](#step-7-fastapi-endpoints)
9. [Step 8: Integration Testing](#step-8-integration-testing)

---

## Prerequisites

### Required Software
- Python 3.13+
- uv (Python package manager)
- Doppler CLI (for secrets management)
- Jupyter Lab or Jupyter Notebook

### Required Accounts/API Keys
- **LangSmith**: Get API key from [LangSmith](https://smith.langchain.com/)
- **OpenAI/Anthropic**: For LLM API
- **Qdrant Cloud**: Create account at [Qdrant Cloud](https://cloud.qdrant.io/)
- **Opik**: (Optional) Get API key if using Opik

---

## Project Structure

Keep it simple - mostly notebooks:

```
backend/
├── notebooks/                    # All development in notebooks
│   ├── 01_setup.ipynb           # Setup and config
│   ├── 02_qdrant_setup.ipynb    # Qdrant Cloud setup
│   ├── 03_embeddings.ipynb      # Embedding service
│   ├── 04_invoice_parser.ipynb  # TFL invoice parsing
│   ├── 05_nodes.ipynb           # LangGraph nodes
│   ├── 06_graph.ipynb           # LangGraph flow assembly
│   └── 07_test.ipynb            # Integration testing
├── api.py                        # FastAPI app (only .py file needed)
├── pyproject.toml
└── README.md
```

---

## Step 1: Setup and Configuration

### 1.1 Update Dependencies

Update `pyproject.toml`:

```toml
[project]
name = "backend"
version = "0.1.0"
description = "rag-commute-agent"
readme = "README.md"
requires-python = ">=3.13"
dependencies = [
    "langchain>=1.0.3",
    "langchain-openai>=0.1.0",
    "langgraph>=1.0.2",
    "langsmith>=0.4.41",
    "opik>=1.8.101",
    "qdrant-client>=1.7.0",
    "fastapi>=0.109.0",
    "uvicorn[standard]>=0.27.0",
    "python-multipart>=0.0.6",
    "pydantic>=2.5.0",
    "sse-starlette>=1.8.0",
    "pandas>=2.1.0",
    "pypdf>=4.0.0",
    "ipykernel>=7.1.0",
    "ipywidgets>=8.0.0",
    "jupyter>=1.0.0",
    "slowapi>=0.1.9",
]
```

### 1.2 Install Dependencies

```bash
cd backend
uv venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
uv pip install -e .
```

### 1.3 Configure Doppler

Set up all secrets in Doppler:

```bash
doppler secrets set LANGSMITH_API_KEY=your_key
doppler secrets set LANGSMITH_TRACING=true
doppler secrets set LANGSMITH_PROJECT=rag-commute-agent
doppler secrets set OPENAI_API_KEY=your_key
doppler secrets set QDRANT_URL=https://your-cluster.qdrant.io
doppler secrets set QDRANT_API_KEY=your_key
doppler secrets set FRONTEND_URL=http://localhost:5173  # For local dev, use Vercel URL in production
# Optional
doppler secrets set OPIK_API_KEY=your_key
# Future (Post-MVP):
# doppler secrets set AWS_ACCESS_KEY_ID=your_key
# doppler secrets set AWS_SECRET_ACCESS_KEY=your_key
# doppler secrets set AWS_S3_BUCKET=your_bucket
```

### 1.4 Create Notebook: `notebooks/01_setup.ipynb`

This notebook will:
- Load secrets from Doppler
- Test API connections
- Set up LangSmith tracing
- Verify all imports work

```python
# Cell 1: Load Doppler secrets
import os, json, subprocess

secrets = subprocess.check_output([
    "doppler", "secrets", "download", "--no-file", "--format", "json"
])
os.environ.update(json.loads(secrets))

# Cell 2: Test imports
import langchain
import langgraph
import langsmith
from qdrant_client import QdrantClient
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# Cell 3: Test LangSmith
from langsmith import Client
client = Client(api_key=os.getenv("LANGSMITH_API_KEY"))
print("LangSmith connected:", client is not None)

# Cell 4: Test Qdrant Cloud
qdrant = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)
print("Qdrant connected:", qdrant is not None)

# Cell 5: Test OpenAI
llm = ChatOpenAI(model="gpt-4-turbo-preview")
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
print("OpenAI configured")
```

---

## Step 2: Qdrant Cloud Setup

### 2.1 Create Notebook: `notebooks/02_qdrant_setup.ipynb`

This notebook will:
- Connect to Qdrant Cloud
- Create three collections: `documents`, `tfl_invoices`, `conversation_memory`
- Set up basic indexes
- Test operations

```python
# Cell 1: Setup
import os, json, subprocess
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

secrets = subprocess.check_output([
    "doppler", "secrets", "download", "--no-file", "--format", "json"
])
os.environ.update(json.loads(secrets))

client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# Cell 2: Create collections
from langchain_openai import OpenAIEmbeddings
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")

# Get embedding dimension
test_embedding = embeddings.embed_query("test")
vector_size = len(test_embedding)

# Create documents collection
client.create_collection(
    collection_name="documents",
    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
)

# Create tfl_invoices collection
client.create_collection(
    collection_name="tfl_invoices",
    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
)

# Create conversation_memory collection
client.create_collection(
    collection_name="conversation_memory",
    vectors_config=VectorParams(size=vector_size, distance=Distance.COSINE)
)

print("Collections created successfully!")

# Cell 3: Test operations
# Test insert
test_point = {
    "id": "test_1",
    "vector": test_embedding,
    "payload": {"text": "test", "type": "test"}
}
client.upsert(collection_name="documents", points=[test_point])

# Test search
results = client.search(
    collection_name="documents",
    query_vector=test_embedding,
    limit=1
)
print("Test successful:", results[0].payload["text"] == "test")
```

---

## Step 3: Embedding Service

### 3.1 Create Notebook: `notebooks/03_embeddings.ipynb`

This notebook will:
- Test embedding generation
- Test similarity search
- Create reusable embedding functions

```python
# Cell 1: Setup
import os, json, subprocess
from langchain_openai import OpenAIEmbeddings
from qdrant_client import QdrantClient

secrets = subprocess.check_output([
    "doppler", "secrets", "download", "--no-file", "--format", "json"
])
os.environ.update(json.loads(secrets))

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# Cell 2: Embedding functions
def embed_text(text: str):
    """Embed a single text"""
    return embeddings.embed_query(text)

def embed_documents(texts: list):
    """Embed multiple texts"""
    return embeddings.embed_documents(texts)

def search_similar(collection: str, query: str, top_k: int = 5):
    """Search for similar documents"""
    query_vector = embed_text(query)
    results = client.search(
        collection_name=collection,
        query_vector=query_vector,
        limit=top_k
    )
    return results

# Cell 3: Test
test_queries = ["What is AI?", "Tell me about machine learning"]
for query in test_queries:
    embedding = embed_text(query)
    print(f"Query: {query}")
    print(f"Embedding dimension: {len(embedding)}")
```

---

## Step 4: TFL Invoice Processing

### 4.1 Create Notebook: `notebooks/04_invoice_parser.ipynb`

This notebook will:
- Parse CSV invoice files
- Parse PDF invoice files (basic)
- Extract transaction data
- Store in Qdrant
- Calculate costs for selected dates

```python
# Cell 1: Setup
import os, json, subprocess
import pandas as pd
from pypdf import PdfReader
from qdrant_client import QdrantClient
from langchain_openai import OpenAIEmbeddings
from datetime import datetime

secrets = subprocess.check_output([
    "doppler", "secrets", "download", "--no-file", "--format", "json"
])
os.environ.update(json.loads(secrets))

embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# Cell 2: Parse CSV invoice
def parse_csv_invoice(file_path: str):
    """Parse CSV invoice file"""
    df = pd.read_csv(file_path)
    # Assuming CSV has columns: date, amount, journey_type, zones, etc.
    transactions = []
    for _, row in df.iterrows():
        transaction = {
            "date": row["date"],
            "amount": float(row["amount"]),
            "journey_type": row.get("journey_type", "unknown"),
            "zones": row.get("zones", ""),
            "timestamp": row.get("timestamp", datetime.now().isoformat())
        }
        transactions.append(transaction)
    return transactions

# Cell 3: Parse PDF invoice (basic)
def parse_pdf_invoice(file_path: str):
    """Parse PDF invoice file - basic extraction"""
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    
    # Basic parsing - you may need to customize based on TFL PDF format
    # This is a simplified example
    transactions = []
    # Parse text to extract transactions
    # This would need custom logic based on TFL PDF structure
    return transactions

# Cell 4: Store invoice in Qdrant
def store_invoice(transactions: list, invoice_id: str, user_id: str = "default"):
    """Store invoice transactions in Qdrant"""
    points = []
    for i, transaction in enumerate(transactions):
        # Create text representation for embedding
        text = f"{transaction['date']} {transaction['journey_type']} {transaction['amount']}"
        vector = embeddings.embed_query(text)
        
        point = {
            "id": f"{invoice_id}_{i}",
            "vector": vector,
            "payload": {
                "invoice_id": invoice_id,
                "user_id": user_id,
                "transaction_id": f"{invoice_id}_{i}",
                **transaction
            }
        }
        points.append(point)
    
    client.upsert(collection_name="tfl_invoices", points=points)
    print(f"Stored {len(points)} transactions for invoice {invoice_id}")

# Cell 5: Calculate cost for selected dates
def calculate_cost(invoice_id: str, selected_dates: list, user_id: str = "default"):
    """Calculate commute cost for selected dates"""
    # Get all transactions for invoice
    results = client.scroll(
        collection_name="tfl_invoices",
        scroll_filter={
            "must": [
                {"key": "invoice_id", "match": {"value": invoice_id}},
                {"key": "user_id", "match": {"value": user_id}}
            ]
        },
        limit=1000
    )
    
    transactions = [point.payload for point in results[0]]
    
    # Filter by selected dates
    selected_date_strs = [d if isinstance(d, str) else d.strftime("%Y-%m-%d") for d in selected_dates]
    filtered = [t for t in transactions if t["date"] in selected_date_strs]
    
    # Calculate total
    total = sum(t["amount"] for t in filtered)
    
    # Per-day breakdown
    per_day = {}
    for t in filtered:
        date = t["date"]
        if date not in per_day:
            per_day[date] = 0
        per_day[date] += t["amount"]
    
    return {
        "total_amount": round(total, 2),
        "selected_dates": selected_date_strs,
        "per_day_breakdown": per_day,
        "transactions_count": len(filtered)
    }

# Cell 6: Test
# Test with sample CSV
# transactions = parse_csv_invoice("sample_invoice.csv")
# store_invoice(transactions, "invoice_001")
# result = calculate_cost("invoice_001", ["2024-01-15", "2024-01-16"])
# print(result)
```

---

## Step 5: LangGraph Nodes

### 5.1 Create Notebook: `notebooks/05_nodes.ipynb`

This notebook will:
- Define LangGraph state schema
- Create all nodes
- Test each node individually

```python
# Cell 1: Setup
import os, json, subprocess
from typing import TypedDict, List, Dict, Any, Optional
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from qdrant_client import QdrantClient

secrets = subprocess.check_output([
    "doppler", "secrets", "download", "--no-file", "--format", "json"
])
os.environ.update(json.loads(secrets))

llm = ChatOpenAI(model="gpt-4-turbo-preview")
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# Cell 2: Define State
class AgentState(TypedDict):
    messages: List[BaseMessage]
    query: str
    request_type: str  # general_rag, tfl_invoice, tfl_calculation, tfl_chat
    route_path: Optional[str]
    
    # RAG
    retrieved_docs: List[Dict]
    context: str
    
    # Memory
    memory: Dict
    
    # TFL
    invoice_id: Optional[str]
    selected_dates: List[str]
    calculated_amount: Optional[float]
    cost_breakdown: Optional[Dict]
    
    # Response
    response: str

# Cell 3: Entry Node
def receive_query(state: AgentState) -> AgentState:
    """Extract query and determine request type"""
    if not state.get("messages"):
        return state
    
    last_message = state["messages"][-1]
    query = last_message.content if hasattr(last_message, "content") else str(last_message)
    
    # Determine request type
    request_type = "general_rag"  # Default
    if "invoice" in query.lower() or state.get("invoice_id"):
        request_type = "tfl_chat"
    if state.get("selected_dates"):
        request_type = "tfl_calculation"
    
    state["query"] = query
    state["request_type"] = request_type
    return state

# Cell 4: Route Decision Node
def route_request(state: AgentState) -> AgentState:
    """Route to appropriate path"""
    request_type = state.get("request_type", "general_rag")
    
    if request_type == "tfl_invoice":
        state["route_path"] = "process_tfl_invoice"
    elif request_type == "tfl_calculation":
        state["route_path"] = "calculate_cost"
    elif request_type == "tfl_chat":
        state["route_path"] = "tfl_chat"
    else:
        state["route_path"] = "rag_flow"
    
    return state

# Cell 5: RAG Retrieval Node
def retrieve_documents(state: AgentState) -> AgentState:
    """Retrieve relevant documents from Qdrant"""
    query = state["query"]
    query_vector = embeddings.embed_query(query)
    
    results = client.search(
        collection_name="documents",
        query_vector=query_vector,
        limit=5
    )
    
    state["retrieved_docs"] = [
        {"content": r.payload.get("text", ""), "score": r.score}
        for r in results
    ]
    return state

# Cell 6: Format Context Node
def format_context(state: AgentState) -> AgentState:
    """Format retrieved documents into context"""
    docs = state.get("retrieved_docs", [])
    context = "\n\n".join([
        f"Document {i+1} (relevance: {doc['score']:.2f}):\n{doc['content']}"
        for i, doc in enumerate(docs)
    ])
    state["context"] = context
    return state

# Cell 7: LLM Generation Node
def generate_response(state: AgentState) -> AgentState:
    """Generate response using LLM"""
    query = state["query"]
    context = state.get("context", "")
    messages = state.get("messages", [])
    
    # Build prompt
    system_prompt = "You are a helpful assistant. Use the provided context to answer questions."
    
    prompt = f"{system_prompt}\n\nContext:\n{context}\n\nQuestion: {query}\n\nAnswer:"
    
    # Get response
    response = llm.invoke(prompt)
    response_text = response.content if hasattr(response, "content") else str(response)
    
    state["response"] = response_text
    state["messages"].append(AIMessage(content=response_text))
    return state

# Cell 8: TFL Cost Calculation Node
def calculate_cost(state: AgentState) -> AgentState:
    """Calculate commute cost for selected dates"""
    invoice_id = state.get("invoice_id")
    selected_dates = state.get("selected_dates", [])
    
    if not invoice_id or not selected_dates:
        state["response"] = "Error: Missing invoice_id or selected_dates"
        return state
    
    # Get transactions from Qdrant
    results = client.scroll(
        collection_name="tfl_invoices",
        scroll_filter={
            "must": [{"key": "invoice_id", "match": {"value": invoice_id}}]
        },
        limit=1000
    )
    
    transactions = [point.payload for point in results[0]]
    selected_date_strs = [d if isinstance(d, str) else d.strftime("%Y-%m-%d") for d in selected_dates]
    filtered = [t for t in transactions if t.get("date") in selected_date_strs]
    
    total = sum(float(t.get("amount", 0)) for t in filtered)
    per_day = {}
    for t in filtered:
        date = t.get("date")
        if date not in per_day:
            per_day[date] = 0
        per_day[date] += float(t.get("amount", 0))
    
    state["calculated_amount"] = round(total, 2)
    state["cost_breakdown"] = {
        "total_amount": round(total, 2),
        "per_day_breakdown": per_day,
        "transactions_count": len(filtered)
    }
    state["response"] = f"Total cost for selected dates: £{round(total, 2)}"
    return state

# Cell 9: Test nodes individually
test_state = AgentState(
    messages=[HumanMessage(content="What is AI?")],
    query="",
    request_type="general_rag",
    route_path=None,
    retrieved_docs=[],
    context="",
    memory={},
    invoice_id=None,
    selected_dates=[],
    calculated_amount=None,
    cost_breakdown=None,
    response=""
)

# Test entry node
state = receive_query(test_state)
print("Query:", state["query"])
print("Request type:", state["request_type"])
```

---

## Step 6: LangGraph Flow

### 6.1 Create Notebook: `notebooks/06_graph.ipynb`

This notebook will:
- Assemble the complete LangGraph
- Add all nodes and edges
- Test the complete flow

```python
# Cell 1: Import nodes from previous notebook
# (You can copy the node functions from 05_nodes.ipynb or import them)
# For simplicity, we'll define them here again or use %run magic

# Cell 2: Build Graph
from langgraph.graph import StateGraph, END

# Create graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("receive_query", receive_query)
workflow.add_node("route_request", route_request)
workflow.add_node("retrieve_documents", retrieve_documents)
workflow.add_node("format_context", format_context)
workflow.add_node("generate_response", generate_response)
workflow.add_node("calculate_cost", calculate_cost)

# Set entry point
workflow.set_entry_point("receive_query")

# Add edges
workflow.add_edge("receive_query", "route_request")

# Conditional routing
def route_decision(state: AgentState) -> str:
    route = state.get("route_path", "rag_flow")
    if route == "calculate_cost":
        return "calculate_cost"
    elif route == "rag_flow":
        return "retrieve_documents"
    else:
        return "generate_response"  # For tfl_chat or other paths

workflow.add_conditional_edges(
    "route_request",
    route_decision,
    {
        "retrieve_documents": "retrieve_documents",
        "calculate_cost": "calculate_cost",
        "generate_response": "generate_response"
    }
)

workflow.add_edge("retrieve_documents", "format_context")
workflow.add_edge("format_context", "generate_response")
workflow.add_edge("generate_response", END)
workflow.add_edge("calculate_cost", END)

# Compile graph
app = workflow.compile()

# Cell 3: Test RAG flow
test_input = {
    "messages": [HumanMessage(content="What is machine learning?")],
    "query": "",
    "request_type": "general_rag",
    "route_path": None,
    "retrieved_docs": [],
    "context": "",
    "memory": {},
    "invoice_id": None,
    "selected_dates": [],
    "calculated_amount": None,
    "cost_breakdown": None,
    "response": ""
}

# Note: You'll need to add documents to Qdrant first for this to work
# result = app.invoke(test_input)
# print(result["response"])

# Cell 4: Test TFL calculation flow
test_calculation_input = {
    "messages": [HumanMessage(content="Calculate cost")],
    "query": "Calculate cost",
    "request_type": "tfl_calculation",
    "route_path": None,
    "retrieved_docs": [],
    "context": "",
    "memory": {},
    "invoice_id": "invoice_001",
    "selected_dates": ["2024-01-15", "2024-01-16"],
    "calculated_amount": None,
    "cost_breakdown": None,
    "response": ""
}

# result = app.invoke(test_calculation_input)
# print(result["calculated_amount"])
# print(result["cost_breakdown"])
```

---

## Step 7: FastAPI Endpoints

### 7.1 Create `api.py`

This is the only Python file needed - minimal FastAPI server:

```python
import os, json, subprocess
from fastapi import FastAPI, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from sse_starlette.sse import EventSourceResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import Optional, List
import uvicorn

# Load Doppler secrets
secrets = subprocess.check_output([
    "doppler", "secrets", "download", "--no-file", "--format", "json"
])
os.environ.update(json.loads(secrets))

# Import graph from notebook (you'll need to export it)
# For now, we'll create a simple version here
from langgraph.graph import StateGraph
from langchain_core.messages import HumanMessage
import pandas as pd
from qdrant_client import QdrantClient
from langchain_openai import ChatOpenAI, OpenAIEmbeddings

# Initialize services
llm = ChatOpenAI(model="gpt-4-turbo-preview")
embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
client = QdrantClient(
    url=os.getenv("QDRANT_URL"),
    api_key=os.getenv("QDRANT_API_KEY")
)

# Simple graph (you can import from notebook if you export it)
# For MVP, we'll use a simplified version here

app = FastAPI(title="RAG Commute Agent API")

# Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS - Use FRONTEND_URL from environment
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],  # Frontend URL from Doppler
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
@limiter.limit("100/minute")  # 100 requests per minute
async def health(request: Request):
    return {"status": "healthy"}

@app.post("/api/transport/upload")
@limiter.limit("10/minute")  # 10 uploads per minute per IP
async def upload_invoice(
    request: Request,
    file: UploadFile = File(...),
    user_id: Optional[str] = Form(None)
):
    """Upload and process TFL invoice"""
    import io
    import time
    
    # Save file temporarily
    contents = await file.read()
    
    # Parse based on file type
    if file.filename.endswith('.csv'):
        df = pd.read_csv(io.BytesIO(contents))
        transactions = []
        for _, row in df.iterrows():
            transactions.append({
                "date": str(row.get("date", "")),
                "amount": float(row.get("amount", 0)),
                "journey_type": str(row.get("journey_type", "unknown"))
            })
    else:
        return {"error": "Only CSV supported for MVP"}
    
    # Store in Qdrant
    invoice_id = f"invoice_{user_id or 'default'}_{int(time.time())}"
    points = []
    for i, t in enumerate(transactions):
        text = f"{t['date']} {t['journey_type']} {t['amount']}"
        vector = embeddings.embed_query(text)
        points.append({
            "id": f"{invoice_id}_{i}",
            "vector": vector,
            "payload": {"invoice_id": invoice_id, "user_id": user_id or "default", **t}
        })
    client.upsert(collection_name="tfl_invoices", points=points)
    
    return {"invoice_id": invoice_id, "transactions_count": len(transactions)}

@app.post("/api/transport/calculate")
@limiter.limit("20/minute")  # 20 calculations per minute per IP
async def calculate_cost(
    request: Request,
    file: UploadFile = File(...),
    dates: str = Form(...),  # JSON array of dates
    user_id: Optional[str] = Form(None)
):
    """Calculate commute cost for selected dates"""
    import json
    import io
    
    selected_dates = json.loads(dates)
    
    # For MVP: Upload and calculate in one step
    # In production, you'd use invoice_id instead
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))
    
    # Filter by dates
    selected_date_strs = [d if isinstance(d, str) else d for d in selected_dates]
    filtered = df[df["date"].isin(selected_date_strs)]
    
    total = filtered["amount"].sum()
    per_day = filtered.groupby("date")["amount"].sum().to_dict()
    
    return {
        "total_cost": round(float(total), 2),
        "breakdown": {str(k): round(float(v), 2) for k, v in per_day.items()},
        "selected_dates": selected_date_strs
    }

@app.post("/api/chat")
@limiter.limit("30/minute")  # 30 chat messages per minute per IP
async def chat(
    request: Request,
    file: UploadFile = File(...),
    message: str = Form(...),
    session_id: Optional[str] = Form(None)
):
    """Chat endpoint with document"""
    import time
    import json
    
    # For MVP: Simple RAG implementation
    contents = await file.read()
    
    # Store document in Qdrant
    doc_id = f"doc_{session_id or 'default'}_{int(time.time())}"
    text = contents.decode('utf-8') if isinstance(contents, bytes) else str(contents)
    vector = embeddings.embed_query(text)
    
    client.upsert(
        collection_name="documents",
        points=[{
            "id": doc_id,
            "vector": vector,
            "payload": {"text": text, "doc_id": doc_id, "session_id": session_id}
        }]
    )
    
    # Retrieve similar docs
    query_vector = embeddings.embed_query(message)
    results = client.search(
        collection_name="documents",
        query_vector=query_vector,
        limit=3
    )
    
    context = "\n".join([r.payload.get("text", "") for r in results])
    
    # Generate response
    prompt = f"Context:\n{context}\n\nQuestion: {message}\n\nAnswer:"
    response = llm.invoke(prompt)
    response_text = response.content if hasattr(response, "content") else str(response)
    
    async def generate():
        # Simple streaming - send response character by character
        for char in response_text:
            yield {"data": json.dumps({"chunk": char})}
    
    return EventSourceResponse(generate())

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 7.2 Rate Limiting Configuration

The rate limiting is implemented using `slowapi`:

- **Limits are per IP address**: Uses `get_remote_address` to identify clients
- **In-memory storage**: For MVP, limits are stored in memory (resets on server restart)
- **For production**: Consider using Redis for distributed rate limiting

**Adjusting Rate Limits:**

Edit the `@limiter.limit()` decorator on each endpoint:
```python
@limiter.limit("10/minute")  # 10 requests per minute
@limiter.limit("100/hour")   # 100 requests per hour
@limiter.limit("5/second")  # 5 requests per second
```

**Rate Limit Headers:**

Responses include rate limit information:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset timestamp

**Error Response:**

When rate limit is exceeded, returns `429 Too Many Requests`:
```json
{
  "error": "Rate limit exceeded: 10 per 1 minute"
}
```

---

## Step 8: Integration Testing

### 8.1 Create Notebook: `notebooks/07_test.ipynb`

This notebook will:
- Test all API endpoints
- Test complete flows
- Validate frontend integration

```python
# Cell 1: Setup
import requests
import json

BASE_URL = "http://localhost:8000"

# Cell 2: Test health check
response = requests.get(f"{BASE_URL}/api/health")
print(response.json())

# Cell 3: Test invoice upload
files = {"file": open("sample_invoice.csv", "rb")}
response = requests.post(
    f"{BASE_URL}/api/transport/upload",
    files=files,
    data={"user_id": "test_user"}
)
print(response.json())

# Cell 4: Test cost calculation
files = {"file": open("sample_invoice.csv", "rb")}
data = {
    "dates": json.dumps(["2024-01-15", "2024-01-16"]),
    "user_id": "test_user"
}
response = requests.post(
    f"{BASE_URL}/api/transport/calculate",
    files=files,
    data=data
)
print(response.json())

# Cell 5: Test chat
files = {"file": open("sample_document.txt", "rb")}
data = {
    "message": "What is this document about?",
    "session_id": "test_session"
}
response = requests.post(
    f"{BASE_URL}/api/chat",
    files=files,
    data=data
)
# Handle streaming response
for line in response.iter_lines():
    if line:
        print(line.decode())
```

---

## Running the Application

### Start FastAPI Server

```bash
cd backend
source .venv/bin/activate
doppler run -- python api.py
```

Or with uvicorn:

```bash
doppler run -- uvicorn api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Integration

**Frontend (Vercel)** should be configured with:
- Environment variable: `VITE_API_BASE_URL` pointing to your backend URL
  - Local: `http://localhost:8000`
  - Production: Your AWS/Digital Ocean backend URL

The frontend calls:
- `POST /api/transport/upload` - Upload invoice
- `POST /api/transport/calculate` - Calculate cost
- `POST /api/chat` - Chat with documents (streaming response)

### Deployment Notes

**Backend (AWS/Digital Ocean)**:
- Set `FRONTEND_URL` in Doppler to your Vercel frontend URL
- Ensure CORS is configured correctly
- Files are processed in-memory for MVP (no S3 needed yet)

**Frontend (Vercel)**:
- Set `VITE_API_BASE_URL` environment variable to backend URL
- Frontend will use this base URL for all API calls

**File Storage (Future)**:
- S3 (AWS) or Digital Ocean Spaces (S3-compatible) will be added post-MVP
- For MVP, files are processed in-memory and stored in Qdrant as vectors

---

## Next Steps

1. **Work through notebooks sequentially**: Each notebook builds on the previous
2. **Test incrementally**: Test each component before moving to the next
3. **Refine as needed**: Add features as you learn and understand the system better
4. **Export from notebooks**: When ready, you can export tested code from notebooks to reusable functions

---

## Tips for Learning

- **Start simple**: Get basic functionality working first
- **Test in notebooks**: Easy to experiment and debug
- **Iterate**: Add complexity gradually
- **Keep it MVP**: Focus on core features only
- **Document as you go**: Add comments and notes in notebooks

---

This MVP approach keeps it simple, learning-focused, and functional. You can always add more complexity later as you understand the system better!
