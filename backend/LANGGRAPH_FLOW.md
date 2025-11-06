# LangGraph Flow Architecture: RAG with Qdrant DB and Memory

## Overview

This document describes a LangGraph flow designed for a RAG (Retrieval-Augmented Generation) system with chat capabilities, using Qdrant as the vector database and implementing persistent memory for conversational context. The system supports two main features:

1. **General Document RAG**: Users can upload documents and have conversations with them
2. **TFL Invoice Processing**: Users can upload TFL (Transport for London) invoices, select work days on a calendar, and calculate commute costs with optional chat functionality

Both features share the same memory system and vector database infrastructure, with specialized processing paths for each use case.

## Architecture Components

### 1. Vector Database: Qdrant
- **Purpose**: Store and retrieve document embeddings for RAG operations and TFL invoice data
- **Collections**: 
  - `documents`: Main collection for general document embeddings
  - `tfl_invoices`: Collection for TFL invoice embeddings and structured data
  - `conversation_memory`: Collection for conversation history and context
- **Embedding Model**: Used for converting documents, invoices, and queries into vector representations
- **Similarity Search**: Performs cosine similarity search for relevant document chunks and invoice data

### 2. Memory System
- **Conversation Memory**: Stores chat history and context
- **Memory Types**:
  - **Short-term Memory**: Current conversation session (in-memory buffer)
  - **Long-term Memory**: Persistent conversation history (stored in Qdrant or external DB)
  - **Context Memory**: Relevant document context retrieved during RAG operations
- **Memory Storage**:
  - Session-based: Temporary storage for active conversations
  - Persistent: Qdrant collection or external database for historical conversations

### 3. LangGraph State
- **State Schema**: Defines the data structure passed between nodes
- **State Fields**:
  - `messages`: List of conversation messages
  - `query`: Current user query
  - `retrieved_docs`: Documents retrieved from Qdrant
  - `context`: Formatted context for LLM
  - `memory`: Conversation history and context
  - `response`: Final LLM response
  - `metadata`: Additional metadata (user_id, session_id, etc.)
  - `request_type`: Type of request (`general_rag`, `tfl_invoice`, `tfl_calculation`, `tfl_chat`)
  - `tfl_invoice_data`: TFL invoice structured data (transactions, dates, amounts)
  - `selected_dates`: List of selected work dates (JSON/list format from calendar)
  - `calculated_amount`: Calculated commute cost amount
  - `invoice_id`: Reference to uploaded invoice document

## Flow Graph Structure

### Nodes

#### 1. **Entry Node: `receive_query`**
- **Purpose**: Entry point for incoming user queries and requests
- **Input**: User message, metadata, and optional payload (dates, invoice data)
- **Actions**:
  - Extract user query from input
  - Parse request payload (dates, invoice references)
  - Determine request type (general RAG, TFL invoice, TFL calculation, TFL chat)
  - Initialize or retrieve conversation state
  - Load conversation history from memory
- **Output**: State with query, request type, and initial messages

#### 2. **Route Decision Node: `route_request`**
- **Purpose**: Route requests to appropriate processing path
- **Input**: State with request type and metadata
- **Actions**:
  - Analyze request type from state
  - Route to:
    - `process_tfl_invoice`: For TFL invoice upload and processing
    - `tfl_calculation_flow`: For date-based cost calculation
    - `general_rag_flow`: For general document RAG
    - `tfl_chat_flow`: For chatting with TFL invoice
- **Output**: State with routing decision

#### 3. **TFL Invoice Processing Node: `process_tfl_invoice`**
- **Purpose**: Process uploaded TFL invoice files
- **Input**: Invoice file (CSV, PDF, or JSON), user_id
- **Actions**:
  1. Parse invoice file (CSV, PDF, or structured JSON)
  2. Extract invoice data:
     - Transaction dates
     - Transaction amounts
     - Journey types (bus, tube, train, etc.)
     - Zone information
     - Time of day (peak/off-peak)
  3. Structure invoice data for storage
  4. Generate embeddings for invoice content
  5. Store in Qdrant `tfl_invoices` collection:
     - Vector: Invoice content embedding
     - Payload: Structured invoice data
  6. Extract metadata (invoice period, total amount, etc.)
- **Output**: State with structured invoice data and invoice_id

#### 4. **TFL Date Selection Node: `process_selected_dates`**
- **Purpose**: Process selected work dates from calendar component
- **Input**: JSON payload or list of selected dates, invoice_id
- **Actions**:
  1. Parse date selection payload (JSON array or list format)
  2. Validate date format and range
  3. Filter invoice transactions for selected dates
  4. Extract relevant transactions matching selected dates
  5. Prepare transaction data for cost calculation
- **Output**: State with filtered invoice transactions for selected dates

#### 5. **TFL Cost Calculation Node: `calculate_commute_cost`**
- **Purpose**: Calculate exact commute cost based on selected dates
- **Input**: Filtered invoice transactions, selected dates, invoice metadata
- **Actions**:
  1. Match selected dates with invoice transactions
  2. Calculate costs for each selected date:
     - Sum transaction amounts for each date
     - Handle multiple transactions per date
     - Apply any applicable rules (daily caps, zone restrictions)
  3. Aggregate total cost across all selected dates
  4. Generate cost breakdown:
     - Total amount
     - Per-day breakdown
     - Transaction type summary
     - Date range summary
  5. Format calculation results
- **Output**: State with calculated amount and cost breakdown

#### 6. **TFL Invoice Retrieval Node: `retrieve_tfl_invoice`**
- **Purpose**: Retrieve TFL invoice data from Qdrant for chat
- **Input**: Query text, invoice_id (optional), user_id
- **Actions**:
  1. Generate query embedding
  2. Search in Qdrant `tfl_invoices` collection:
     - Filter by invoice_id if provided
     - Filter by user_id
     - Perform vector similarity search
  3. Retrieve relevant invoice transactions and data
  4. Extract structured invoice information
  5. Combine with query context
- **Output**: State with retrieved invoice data and context

#### 7. **TFL Context Formatter Node: `format_tfl_context`**
- **Purpose**: Format TFL invoice data for LLM context
- **Actions**:
  1. Format invoice transactions:
     - Date, amount, journey type
     - Zone and time information
  2. Include cost calculation results if available
  3. Format with clear structure for LLM
  4. Add metadata (invoice period, total amounts)
- **Output**: State with formatted TFL context

#### 8. **Memory Retrieval Node: `load_memory`**
- **Purpose**: Retrieve conversation history and context
- **Actions**:
  - Load conversation history from persistent memory
  - Retrieve relevant previous context
  - Format historical messages for LLM context
  - Include invoice-specific context if applicable
- **Output**: State with enriched memory context

#### 9. **RAG Retrieval Node: `retrieve_documents`**
- **Purpose**: Retrieve relevant documents from Qdrant
- **Actions**:
  - Generate embedding for user query
  - Perform similarity search in Qdrant collection
  - Filter and rank retrieved documents
  - Extract relevant chunks with metadata
- **Output**: State with retrieved documents

#### 10. **Context Formatter Node: `format_context`**
- **Purpose**: Format retrieved documents into LLM-ready context
- **Actions**:
  - Combine retrieved document chunks
  - Format with source citations
  - Truncate to fit context window
  - Add document metadata
- **Output**: State with formatted context

#### 11. **LLM Generation Node: `generate_response`**
- **Purpose**: Generate response using LLM with context
- **Actions**:
  - Construct prompt with:
    - User query
    - Conversation history
    - Retrieved document context
    - System instructions
  - Call LLM API
  - Stream or receive response
- **Output**: State with LLM response

#### 12. **Memory Update Node: `update_memory`**
- **Purpose**: Save conversation to memory
- **Actions**:
  - Store user query in memory
  - Store assistant response in memory
  - Update conversation history
  - Persist to long-term memory if needed
- **Output**: State with updated memory

#### 13. **TFL Response Formatter Node: `format_tfl_response`**
- **Purpose**: Format TFL-specific response (cost calculation or invoice chat)
- **Input**: Calculated amount, cost breakdown, or chat response
- **Actions**:
  1. Format cost calculation response:
     - Total amount
     - Date range
     - Per-day breakdown
     - Transaction summary
  2. Format invoice chat response:
     - Include invoice context
     - Reference specific transactions
     - Provide date-specific information
  3. Include metadata (invoice_id, calculation timestamp)
- **Output**: State with formatted TFL response

#### 14. **Exit Node: `return_response`**
- **Purpose**: Format and return final response
- **Actions**:
  - Format response with metadata
  - Include source citations
  - Prepare response structure
- **Output**: Final response to user

### Edges

#### 1. **Main Flow Edges**
- `START` → `receive_query`
- `receive_query` → `route_request`

#### 2. **Routing Edges (from `route_request`)**
- **TFL Invoice Upload**: `route_request` → `process_tfl_invoice` → `update_memory` → `return_response`
- **TFL Cost Calculation**: `route_request` → `process_selected_dates` → `calculate_commute_cost` → `format_tfl_response` → `return_response`
- **TFL Chat**: `route_request` → `load_memory` → `retrieve_tfl_invoice` → `format_tfl_context` → `generate_response` → `update_memory` → `return_response`
- **General RAG**: `route_request` → `load_memory` → `retrieve_documents` → `format_context` → `generate_response` → `update_memory` → `return_response`

#### 3. **Conditional Edges**
- **Memory Skip**: If no conversation history exists, skip `load_memory`
- **RAG Skip**: If query doesn't require document retrieval, skip RAG nodes
- **Direct Path**: For simple queries, go directly from memory to generation
- **TFL Calculation Only**: If user only wants cost calculation (no chat), skip LLM generation
- **TFL Chat Mode**: If user wants to chat with invoice, include LLM generation with invoice context

## Detailed Node Descriptions

### Entry Node: `receive_query`

**Input State**:
- Raw user message
- Session ID (optional)
- User ID (optional)
- Metadata (timestamp, source, etc.)

**Processing**:
1. Parse incoming message
2. Extract query text
3. Initialize state structure
4. Check for session continuity

**Output State**:
- `query`: Extracted query text
- `messages`: Initial message list with user query
- `metadata`: Session and user metadata

---

### Memory Retrieval Node: `load_memory`

**Input State**:
- Query
- Session ID
- User ID

**Processing**:
1. Query persistent memory for conversation history
2. Retrieve last N messages (configurable window)
3. Load relevant context from previous conversations
4. Format history for LLM context

**Output State**:
- `memory.conversation_history`: Previous messages
- `memory.context`: Relevant previous context
- `messages`: Enriched with history

**Memory Sources**:
- Qdrant collection: `conversation_memory`
- External database: For long-term storage
- In-memory buffer: For active session

---

### RAG Retrieval Node: `retrieve_documents`

**Input State**:
- Query text
- Metadata (user preferences, filters)

**Processing**:
1. Generate query embedding using embedding model
2. Connect to Qdrant collection
3. Perform vector similarity search:
   - Search in `documents` collection
   - Use cosine similarity or dot product
   - Apply filters (user_id, date range, document type)
4. Retrieve top K documents (configurable)
5. Extract document chunks and metadata
6. Calculate relevance scores

**Output State**:
- `retrieved_docs`: List of document chunks with:
  - Content text
  - Source document ID
  - Relevance score
  - Metadata (source, date, type, etc.)

**Qdrant Configuration**:
- Collection: `documents`
- Distance metric: Cosine similarity
- Vector size: Based on embedding model
- Payload: Document metadata (source, user_id, timestamp, etc.)

---

### Context Formatter Node: `format_context`

**Input State**:
- Retrieved documents
- Query
- Memory context

**Processing**:
1. Combine retrieved document chunks
2. Format with source citations:
   - Document ID or name
   - Chunk index
   - Relevance score
3. Truncate to fit context window:
   - Prioritize higher relevance chunks
   - Maintain document boundaries
4. Create context string for LLM
5. Add metadata summary

**Output State**:
- `context`: Formatted context string
- `context_sources`: List of source citations
- `context_metadata`: Summary of retrieved documents

---

### LLM Generation Node: `generate_response`

**Input State**:
- Query
- Formatted context
- Conversation history
- System instructions

**Processing**:
1. Construct prompt with sections:
   - System instructions (RAG guidelines, memory usage)
   - Conversation history (from memory)
   - Retrieved document context
   - Current user query
2. Call LLM API:
   - Model selection (configurable)
   - Temperature and other parameters
   - Streaming or non-streaming
3. Generate response
4. Extract and validate response

**Output State**:
- `response`: LLM-generated response text
- `response_metadata`: Generation metadata (tokens, model, etc.)

**Prompt Structure**:
```
System Instructions:
- You are a helpful assistant with access to document knowledge
- Use provided context to answer questions
- Reference sources when using retrieved documents
- Maintain conversation context

Conversation History:
[Previous messages from memory]

Document Context:
[Formatted retrieved documents with citations]

User Query:
[Current query]
```

---

### Memory Update Node: `update_memory`

**Input State**:
- User query
- Assistant response
- Retrieved documents (for context)
- Session ID
- User ID

**Processing**:
1. Create memory entry:
   - User query
   - Assistant response
   - Retrieved document IDs (for reference)
   - Timestamp
   - Session metadata
2. Update short-term memory (in-memory buffer)
3. Persist to long-term memory:
   - Store in Qdrant `conversation_memory` collection
   - Or external database
4. Update conversation history in state

**Output State**:
- `memory`: Updated memory structure
- `messages`: Updated with assistant response

**Memory Storage Structure**:
- Qdrant collection: `conversation_memory`
  - Vector: Query embedding (for semantic search of past conversations)
  - Payload:
    - `user_query`: Original query
    - `assistant_response`: Generated response
    - `session_id`: Session identifier
    - `user_id`: User identifier
    - `timestamp`: Conversation timestamp
    - `document_ids`: Referenced document IDs
    - `metadata`: Additional context

---

### Route Decision Node: `route_request`

**Input State**:
- Request type
- Query text
- Metadata (file type, invoice_id, etc.)

**Processing**:
1. Analyze request type from state:
   - Check for invoice file upload
   - Check for selected dates payload
   - Check for invoice chat query
   - Check for general document query
2. Determine routing path:
   - `tfl_invoice`: If invoice file is present
   - `tfl_calculation`: If selected dates are present
   - `tfl_chat`: If query references invoice or invoice_id exists
   - `general_rag`: Default for document queries
3. Set routing decision in state

**Output State**:
- `route_path`: Determined routing path
- `request_type`: Confirmed request type

---

### TFL Invoice Processing Node: `process_tfl_invoice`

**Input State**:
- Invoice file (CSV, PDF, or JSON)
- User ID
- Session ID

**Processing**:
1. Parse invoice file based on format:
   - **CSV**: Parse CSV structure (date, amount, journey type, zones)
   - **PDF**: Extract text using OCR/PDF parsing, then parse structured data
   - **JSON**: Parse structured JSON format
2. Extract invoice data:
   - Transaction dates (ISO format)
   - Transaction amounts (decimal values)
   - Journey types (bus, tube, train, tram, DLR, etc.)
   - Zone information (zones 1-9, etc.)
   - Time of day (peak/off-peak)
   - Journey start/end locations (if available)
3. Structure invoice data:
   - Create transaction records
   - Group by date
   - Calculate daily totals
   - Extract invoice metadata (period start/end, total amount)
4. Generate embeddings:
   - Embed each transaction as a vector
   - Embed invoice summary as a vector
   - Use same embedding model as documents
5. Store in Qdrant `tfl_invoices` collection:
   - **Vector**: Invoice content embedding (transaction text or summary)
   - **Payload**: 
     - Structured transaction data
     - Invoice metadata
     - User ID and session ID
6. Create invoice summary:
   - Total transactions
   - Date range
   - Total amount
   - Journey type breakdown

**Output State**:
- `invoice_id`: Unique invoice identifier
- `tfl_invoice_data`: Structured invoice data
- `invoice_metadata`: Invoice summary and metadata

**Qdrant Storage Structure**:
- Each transaction stored as a separate point with:
  - Vector: Transaction embedding
  - Payload: Full transaction details
- Invoice summary stored as a single point with:
  - Vector: Invoice summary embedding
  - Payload: Complete invoice metadata

---

### TFL Date Selection Node: `process_selected_dates`

**Input State**:
- Selected dates (JSON array or list format)
- Invoice ID
- User ID

**Processing**:
1. Parse date selection payload:
   - Accept formats: `["2024-01-15", "2024-01-16", ...]`
   - Handle both date strings and ISO timestamps
   - Validate date format
2. Validate dates:
   - Check date format consistency
   - Validate date range (not too far in past/future)
   - Remove duplicates
   - Sort chronologically
3. Retrieve invoice data from Qdrant:
   - Filter by invoice_id
   - Filter by user_id
   - Retrieve all transactions for the invoice
4. Filter transactions for selected dates:
   - Match transaction dates with selected dates
   - Handle timezone considerations
   - Include transactions that fall on selected dates
5. Prepare transaction data:
   - Group transactions by selected date
   - Calculate per-date totals
   - Extract transaction details
   - Prepare for cost calculation

**Output State**:
- `selected_dates`: Validated and parsed date list
- `filtered_transactions`: Transactions matching selected dates
- `transaction_summary`: Per-date transaction summary

**Date Selection Payload Format**:
```json
{
  "selected_dates": ["2024-01-15", "2024-01-16", "2024-01-17"],
  "invoice_id": "invoice_123",
  "user_id": "user_456"
}
```

---

### TFL Cost Calculation Node: `calculate_commute_cost`

**Input State**:
- Filtered transactions for selected dates
- Selected dates list
- Invoice metadata

**Processing**:
1. Match selected dates with transactions:
   - For each selected date, find all matching transactions
   - Handle multiple transactions per date
   - Group transactions by date
2. Calculate costs for each selected date:
   - Sum transaction amounts for each date
   - Apply daily caps if applicable (TFL daily price caps)
   - Handle zone restrictions
   - Calculate peak/off-peak totals separately
3. Aggregate total cost:
   - Sum all daily costs
   - Calculate subtotals by journey type
   - Calculate subtotals by zone
   - Generate total amount
4. Generate cost breakdown:
   - **Total Amount**: Sum of all selected dates
   - **Per-Day Breakdown**: 
     - Date
     - Number of transactions
     - Daily total
     - Transaction details
   - **Transaction Type Summary**:
     - Bus, Tube, Train, etc. totals
   - **Zone Summary**:
     - Zone 1-2, Zone 1-3, etc. totals
   - **Date Range Summary**:
     - Start date, end date
     - Number of days selected
     - Average daily cost
5. Format calculation results:
   - Create structured response
   - Include currency formatting
   - Add metadata (calculation timestamp, invoice period)

**Output State**:
- `calculated_amount`: Total calculated cost
- `cost_breakdown`: Detailed cost breakdown structure
- `calculation_metadata`: Calculation details and metadata


---

### TFL Invoice Retrieval Node: `retrieve_tfl_invoice`

**Input State**:
- Query text
- Invoice ID (optional)
- User ID

**Processing**:
1. Generate query embedding:
   - Use same embedding model as invoice storage
   - Embed user query text
2. Search in Qdrant `tfl_invoices` collection:
   - Filter by invoice_id if provided
   - Filter by user_id for security
   - Perform vector similarity search
   - Retrieve top K relevant transactions
3. Retrieve relevant invoice data:
   - Get matching transactions
   - Get invoice summary if query is general
   - Extract transaction details
   - Include date, amount, journey type information
4. Extract structured information:
   - Parse transaction payloads
   - Group related transactions
   - Extract metadata
5. Combine with query context:
   - Match query intent with invoice data
   - Prioritize relevant transactions
   - Include date-specific information if query mentions dates

**Output State**:
- `retrieved_invoice_data`: Relevant invoice transactions
- `invoice_context`: Formatted invoice context for LLM

**Example Queries**:
- "How much did I spend on January 15th?"
- "What were my bus journeys last week?"
- "Show me all Zone 1-2 transactions"
- "What's my total commute cost for this month?"

---

### TFL Context Formatter Node: `format_tfl_context`

**Input State**:
- Retrieved invoice data
- Cost calculation results (if available)
- Query text

**Processing**:
1. Format invoice transactions:
   - Structure transaction data:
     - Date: ISO format
     - Amount: Currency formatted
     - Journey type: Clear labels
     - Zones: Zone ranges
     - Time: Peak/off-peak
   - Group by relevant criteria (date, type, zone)
2. Include cost calculation results if available:
   - Total amount
   - Per-day breakdown
   - Transaction type summary
3. Format with clear structure for LLM:
   - Create readable invoice summary
   - Include transaction details
   - Add date context
4. Add metadata:
   - Invoice period
   - Total invoice amounts
   - Date ranges
   - User context

**Output State**:
- `tfl_context`: Formatted TFL invoice context
- `context_metadata`: Invoice metadata

**Formatted Context Example**:
```
TFL Invoice Summary:
- Invoice Period: January 1-31, 2024
- Total Transactions: 120
- Total Amount: £285.50

Selected Dates Breakdown:
- January 15, 2024: 4 transactions, £15.20
  - Tube Zone 1-2 (Peak): £8.50
  - Bus: £2.30
  - Tube Zone 1-2 (Off-peak): £4.40
- January 16, 2024: 5 transactions, £18.30
  ...

Transaction Details:
[Formatted transaction list]
```

---

### TFL Response Formatter Node: `format_tfl_response`

**Input State**:
- Calculated amount (for calculation requests)
- Cost breakdown (for calculation requests)
- Chat response (for chat requests)
- Invoice context

**Processing**:
1. Format cost calculation response:
   - Structure response:
     - Total amount (formatted currency)
     - Date range
     - Number of days
     - Per-day breakdown (table or list)
     - Transaction summary
   - Include metadata:
     - Invoice ID
     - Calculation timestamp
     - Invoice period
2. Format invoice chat response:
   - Include LLM chat response
   - Reference specific transactions
   - Provide date-specific information
   - Include cost breakdown if relevant
3. Include metadata:
   - Invoice ID
   - Request type
   - Timestamp
   - User context

**Output State**:
- `formatted_response`: Structured response ready for client
- `response_type`: Type of response (calculation or chat)

**Response Format for Calculation**:
```json
{
  "type": "tfl_calculation",
  "total_amount": 45.50,
  "currency": "GBP",
  "selected_dates": ["2024-01-15", "2024-01-16", "2024-01-17"],
  "breakdown": {
    "per_day": [...],
    "by_type": {...},
    "by_zone": {...}
  },
  "metadata": {
    "invoice_id": "invoice_123",
    "calculated_at": "2024-01-18T10:30:00Z"
  }
}
```

**Response Format for Chat**:
```json
{
  "type": "tfl_chat",
  "response": "On January 15th, you made 4 journeys totaling £15.20...",
  "referenced_transactions": [...],
  "metadata": {
    "invoice_id": "invoice_123",
    "response_at": "2024-01-18T10:30:00Z"
  }
}
```

---

### Exit Node: `return_response`

**Input State**:
- LLM response
- Source citations
- Metadata

**Processing**:
1. Format final response structure
2. Include source citations
3. Add metadata (session_id, timestamp, etc.)
4. Prepare for API response

**Output State**:
- Final formatted response ready for client

---

## Memory System Architecture

### Short-Term Memory (Session Memory)

**Storage**: In-memory buffer during active session

**Structure**:
- Session ID
- Message list (user + assistant pairs)
- Active context window
- Session metadata

**Lifecycle**:
- Created when session starts
- Updated with each interaction
- Cleared when session ends or expires

### Long-Term Memory (Persistent Memory)

**Storage**: Qdrant collection or external database

**Qdrant Collection**: `conversation_memory`

**Vector Structure**:
- Embedding: Query embedding (for semantic search)
- Payload:
  - `conversation_id`: Unique conversation identifier
  - `session_id`: Session identifier
  - `user_id`: User identifier
  - `user_query`: Original query text
  - `assistant_response`: Generated response text
  - `timestamp`: ISO timestamp
  - `document_ids`: Array of referenced document IDs
  - `metadata`: Additional context (source, tags, etc.)

**Use Cases**:
1. **Conversation History Retrieval**: Load previous conversations by session_id
2. **Semantic Memory Search**: Find similar past conversations using query embeddings
3. **Context Continuity**: Maintain context across sessions
4. **Analytics**: Analyze conversation patterns and user interactions

### Memory Retrieval Strategies

#### 1. **Session-Based Retrieval**
- Retrieve all messages for a given session_id
- Ordered by timestamp
- Limited to recent N messages

#### 2. **Semantic Similarity Retrieval**
- Generate embedding for current query
- Search `conversation_memory` collection in Qdrant
- Retrieve top K similar past conversations
- Use for context-aware responses

#### 3. **User History Retrieval**
- Filter by user_id
- Retrieve recent conversations
- Aggregate user preferences and patterns

---

## Qdrant Database Schema

### Collection 1: `documents`

**Purpose**: Store document embeddings for RAG retrieval

**Vector Configuration**:
- Size: Based on embedding model (e.g., 1536 for OpenAI, 384 for sentence-transformers)
- Distance: Cosine similarity

**Payload Schema**:
```json
{
  "document_id": "string",
  "user_id": "string",
  "source": "string",
  "filename": "string",
  "chunk_index": "integer",
  "total_chunks": "integer",
  "content": "string",
  "metadata": {
    "upload_date": "ISO timestamp",
    "document_type": "string",
    "tags": ["string"],
    "custom_fields": {}
  }
}
```

**Indexes**:
- `user_id`: Filter index
- `document_id`: Filter index
- `source`: Filter index
- `upload_date`: Filter index

---

### Collection 2: `conversation_memory`

**Purpose**: Store conversation history for memory retrieval

**Vector Configuration**:
- Size: Based on embedding model (same as documents)
- Distance: Cosine similarity

**Payload Schema**:
```json
{
  "conversation_id": "string",
  "session_id": "string",
  "user_id": "string",
  "user_query": "string",
  "assistant_response": "string",
  "timestamp": "ISO timestamp",
  "document_ids": ["string"],
  "metadata": {
    "source": "string",
    "tags": ["string"],
    "model_used": "string",
    "tokens_used": "integer",
    "custom_fields": {}
  }
}
```

**Indexes**:
- `session_id`: Filter index
- `user_id`: Filter index
- `conversation_id`: Filter index
- `timestamp`: Filter index

---

### Collection 3: `tfl_invoices`

**Purpose**: Store TFL invoice embeddings and structured transaction data

**Vector Configuration**:
- Size: Based on embedding model (same as documents)
- Distance: Cosine similarity

**Storage Strategy**:
- **Transaction Points**: Each transaction stored as a separate point
  - Vector: Transaction embedding (date, amount, journey type, zones)
  - Payload: Full transaction details
- **Invoice Summary Point**: One summary point per invoice
  - Vector: Invoice summary embedding
  - Payload: Complete invoice metadata

**Transaction Payload Schema**:
```json
{
  "transaction_id": "string",
  "invoice_id": "string",
  "user_id": "string",
  "date": "ISO date",
  "amount": "decimal",
  "currency": "GBP",
  "journey_type": "string",
  "zones": {
    "start_zone": "integer",
    "end_zone": "integer",
    "zone_range": "string"
  },
  "time_of_day": "peak|off-peak",
  "start_location": "string",
  "end_location": "string",
  "timestamp": "ISO timestamp",
  "metadata": {
    "daily_cap_applied": "boolean",
    "transaction_category": "string",
    "custom_fields": {}
  }
}
```

**Invoice Summary Payload Schema**:
```json
{
  "invoice_id": "string",
  "user_id": "string",
  "invoice_period": {
    "start_date": "ISO date",
    "end_date": "ISO date"
  },
  "total_transactions": "integer",
  "total_amount": "decimal",
  "currency": "GBP",
  "journey_type_breakdown": {
    "tube": "decimal",
    "bus": "decimal",
    "train": "decimal",
    "tram": "decimal",
    "DLR": "decimal"
  },
  "zone_breakdown": {
    "zone_1_2": "decimal",
    "zone_1_3": "decimal",
    ...
  },
  "upload_timestamp": "ISO timestamp",
  "file_source": "string",
  "metadata": {
    "file_format": "CSV|PDF|JSON",
    "processing_timestamp": "ISO timestamp",
    "custom_fields": {}
  }
}
```

**Indexes**:
- `invoice_id`: Filter index (for invoice-specific queries)
- `user_id`: Filter index (for user-specific queries)
- `date`: Filter index (for date-based queries)
- `journey_type`: Filter index (for journey type queries)
- `transaction_id`: Filter index (for transaction lookups)

---

## Flow Execution Patterns

### General RAG Patterns

#### Pattern 1: New Conversation (No Memory)

**Flow Path**:
1. `receive_query` → Extract query
2. `route_request` → Route to general RAG
3. `load_memory` → No history found (empty memory)
4. `retrieve_documents` → Search Qdrant for relevant docs
5. `format_context` → Format retrieved docs
6. `generate_response` → Generate with context only
7. `update_memory` → Save first interaction
8. `return_response` → Return response

---

### Pattern 2: Continuing Conversation (With Memory)

**Flow Path**:
1. `receive_query` → Extract query
2. `route_request` → Route to general RAG
3. `load_memory` → Retrieve conversation history
4. `retrieve_documents` → Search Qdrant (if needed)
5. `format_context` → Format docs + history
6. `generate_response` → Generate with context + history
7. `update_memory` → Append to conversation history
8. `return_response` → Return response

---

### Pattern 3: Context-Aware RAG (Semantic Memory Search)

**Flow Path**:
1. `receive_query` → Extract query
2. `route_request` → Route to general RAG
3. `load_memory` → 
   - Load session history
   - Perform semantic search for similar past conversations
4. `retrieve_documents` → Search Qdrant for relevant docs
5. `format_context` → Format docs + history + similar past conversations
6. `generate_response` → Generate with enriched context
7. `update_memory` → Save interaction
8. `return_response` → Return response

---

### Pattern 4: Simple Query (No RAG Needed)

**Flow Path**:
1. `receive_query` → Extract query
2. `route_request` → Route to general RAG
3. `load_memory` → Retrieve conversation history
4. `retrieve_documents` → Skip (query doesn't require docs)
5. `format_context` → Format history only
6. `generate_response` → Generate with history
7. `update_memory` → Save interaction
8. `return_response` → Return response

---

### TFL Invoice Processing Patterns

#### Pattern 5: TFL Invoice Upload and Processing

**Flow Path**:
1. `receive_query` → Extract invoice file and metadata
2. `route_request` → Route to TFL invoice processing
3. `process_tfl_invoice` → 
   - Parse invoice file (CSV/PDF/JSON)
   - Extract transaction data
   - Generate embeddings
   - Store in Qdrant `tfl_invoices` collection
4. `update_memory` → Save invoice upload event
5. `return_response` → Return invoice summary and invoice_id

**Use Case**: User uploads TFL invoice file for processing

---

#### Pattern 6: TFL Cost Calculation (No Chat)

**Flow Path**:
1. `receive_query` → Extract selected dates (JSON payload/list) and invoice_id
2. `route_request` → Route to TFL calculation
3. `process_selected_dates` → 
   - Parse and validate selected dates
   - Retrieve invoice transactions from Qdrant
   - Filter transactions for selected dates
4. `calculate_commute_cost` → 
   - Match dates with transactions
   - Calculate costs per date
   - Generate cost breakdown
5. `format_tfl_response` → Format calculation results
6. `return_response` → Return calculated amount and breakdown

**Use Case**: User selects work days on calendar and wants cost calculation only

**Input Payload Example**:
```json
{
  "invoice_id": "invoice_123",
  "selected_dates": ["2024-01-15", "2024-01-16", "2024-01-17"],
  "user_id": "user_456"
}
```

---

#### Pattern 7: TFL Invoice Chat (Chat with Invoice)

**Flow Path**:
1. `receive_query` → Extract query and invoice_id (optional)
2. `route_request` → Route to TFL chat
3. `load_memory` → Retrieve conversation history
4. `retrieve_tfl_invoice` → 
   - Generate query embedding
   - Search Qdrant `tfl_invoices` collection
   - Retrieve relevant invoice transactions
5. `format_tfl_context` → Format invoice data for LLM
6. `generate_response` → Generate response with invoice context
7. `update_memory` → Save chat interaction
8. `format_tfl_response` → Format chat response
9. `return_response` → Return chat response with invoice references

**Use Case**: User wants to chat with uploaded invoice

**Example Queries**:
- "How much did I spend on January 15th?"
- "What were my bus journeys last week?"
- "Show me all Zone 1-2 transactions"

---

#### Pattern 8: TFL Cost Calculation with Chat

**Flow Path**:
1. `receive_query` → Extract selected dates, query, and invoice_id
2. `route_request` → Route to TFL calculation + chat
3. `load_memory` → Retrieve conversation history
4. `process_selected_dates` → Process selected dates
5. `calculate_commute_cost` → Calculate costs
6. `retrieve_tfl_invoice` → Retrieve invoice context for chat
7. `format_tfl_context` → Format invoice data + calculation results
8. `generate_response` → Generate response with calculation and invoice context
9. `update_memory` → Save interaction
10. `format_tfl_response` → Format response with calculation and chat
11. `return_response` → Return response

**Use Case**: User selects dates and wants both calculation and explanation

---

#### Pattern 9: TFL Invoice Upload with Immediate Calculation

**Flow Path**:
1. `receive_query` → Extract invoice file and selected dates
2. `route_request` → Route to TFL invoice processing
3. `process_tfl_invoice` → Process and store invoice
4. `process_selected_dates` → Process selected dates (if provided)
5. `calculate_commute_cost` → Calculate costs (if dates provided)
6. `format_tfl_response` → Format response
7. `update_memory` → Save invoice upload
8. `return_response` → Return invoice summary + calculation (if applicable)

**Use Case**: User uploads invoice and immediately calculates for selected dates

---

## State Management

### State Schema

**Core State Fields**:
- `messages`: List of message objects (user + assistant)
- `query`: Current user query string
- `retrieved_docs`: List of retrieved document chunks
- `context`: Formatted context string for LLM
- `memory`: Memory structure with history and context
- `response`: Generated LLM response
- `metadata`: Additional metadata (session_id, user_id, etc.)

**TFL-Specific State Fields**:
- `request_type`: Type of request (`general_rag`, `tfl_invoice`, `tfl_calculation`, `tfl_chat`)
- `route_path`: Determined routing path from route_request node
- `invoice_id`: Reference to uploaded TFL invoice document
- `tfl_invoice_data`: Structured TFL invoice data (transactions, dates, amounts)
- `invoice_metadata`: Invoice summary and metadata (period, totals, journey types)
- `selected_dates`: List of selected work dates (JSON/list format from calendar)
- `filtered_transactions`: Transactions matching selected dates
- `calculated_amount`: Total calculated commute cost amount
- `cost_breakdown`: Detailed cost breakdown structure (per-day, by type, by zone)
- `calculation_metadata`: Calculation details and metadata
- `retrieved_invoice_data`: Invoice transactions retrieved from Qdrant
- `tfl_context`: Formatted TFL invoice context for LLM

### State Transitions

**Initial State**:
- Empty or minimal state
- Only user query and metadata

**After Memory Load**:
- State enriched with conversation history
- Previous context available

**After RAG Retrieval**:
- State includes retrieved documents
- Document metadata available

**After Context Formatting**:
- State includes formatted context string
- Source citations prepared

**After Generation**:
- State includes LLM response
- Generation metadata available

**After Memory Update**:
- State includes updated memory
- Conversation history saved

**After TFL Invoice Processing**:
- State includes structured invoice data
- Invoice ID assigned
- Invoice stored in Qdrant

**After Date Selection Processing**:
- State includes filtered transactions
- Selected dates validated
- Transaction summary prepared

**After Cost Calculation**:
- State includes calculated amount
- Cost breakdown available
- Calculation metadata stored

**After TFL Invoice Retrieval**:
- State includes retrieved invoice data
- Invoice context available for LLM

**After TFL Context Formatting**:
- State includes formatted TFL context
- Invoice data formatted for LLM consumption

---

## Error Handling

### Error Scenarios

1. **Qdrant Connection Failure**
   - Fallback: Use cached documents or skip RAG
   - Log error and continue with memory only

2. **Memory Retrieval Failure**
   - Fallback: Start fresh conversation
   - Continue without history

3. **Document Retrieval Failure**
   - Fallback: Generate response without context
   - Use only conversation history

4. **LLM Generation Failure**
   - Retry with exponential backoff
   - Fallback to error message

5. **Memory Update Failure**
   - Log error but continue
   - Response still returned to user

---

## Configuration Parameters

### Retrieval Parameters
- `top_k`: Number of documents to retrieve (default: 5)
- `similarity_threshold`: Minimum similarity score (default: 0.7)
- `max_chunk_size`: Maximum document chunk size (default: 1000 tokens)

### TFL Invoice Parameters
- `invoice_processing_batch_size`: Number of transactions to process in batch (default: 100)
- `transaction_embedding_model`: Embedding model for transaction vectors (default: same as documents)
- `invoice_summary_enabled`: Generate invoice summary point (default: true)
- `date_selection_max_days`: Maximum number of dates that can be selected (default: 365)
- `cost_calculation_daily_cap_enabled`: Apply TFL daily price caps (default: true)
- `tfl_invoice_top_k`: Number of invoice transactions to retrieve for chat (default: 10)

### Memory Parameters
- `memory_window`: Number of previous messages to include (default: 10)
- `semantic_memory_top_k`: Number of similar past conversations to retrieve (default: 3)
- `session_timeout`: Session expiration time (default: 30 minutes)

### LLM Parameters
- `model`: LLM model name
- `temperature`: Generation temperature (default: 0.7)
- `max_tokens`: Maximum response tokens
- `streaming`: Enable streaming responses

### Qdrant Parameters
- `host`: Qdrant server host
- `port`: Qdrant server port
- `collection_documents`: Documents collection name (default: `documents`)
- `collection_memory`: Memory collection name (default: `conversation_memory`)
- `collection_tfl_invoices`: TFL invoices collection name (default: `tfl_invoices`)
- `timeout`: Connection timeout

---

## Performance Considerations

### Optimization Strategies

1. **Caching**:
   - Cache frequently accessed documents
   - Cache embedding computations
   - Cache conversation history for active sessions

2. **Batch Operations**:
   - Batch document retrievals when possible
   - Batch memory updates

3. **Async Operations**:
   - Async Qdrant queries
   - Async LLM calls
   - Parallel memory and document retrieval

4. **Indexing**:
   - Proper Qdrant indexes for fast filtering
   - Index conversation memory by session_id and user_id

---

## Monitoring and Observability

### Metrics to Track

1. **Flow Metrics**:
   - Node execution time
   - Total flow duration
   - Error rates per node

2. **Qdrant Metrics**:
   - Query latency
   - Retrieval relevance scores
   - Collection sizes

3. **Memory Metrics**:
   - Memory retrieval time
   - Memory storage size
   - Conversation history length

4. **LLM Metrics**:
   - Generation time
   - Token usage
   - Response quality scores

---

## Security Considerations

1. **Data Isolation**:
   - User-specific document filtering
   - Session-based memory isolation
   - Access control for Qdrant collections

2. **Data Privacy**:
   - Encrypt sensitive data in memory
   - Secure Qdrant connections
   - PII handling in conversation memory

3. **Authentication**:
   - User authentication before flow execution
   - Session validation
   - API key management

---

## Future Enhancements

1. **Multi-Modal Support**:
   - Image embeddings in Qdrant
   - Multi-modal document retrieval

2. **Advanced Memory**:
   - Episodic memory for specific events
   - Semantic memory for facts and concepts
   - Working memory for temporary context

3. **Adaptive Retrieval**:
   - Dynamic top_k based on query complexity
   - Hybrid search (keyword + vector)

4. **Memory Compression**:
   - Summarize long conversation histories
   - Extract key insights from past conversations

---

## Summary

This LangGraph flow provides a comprehensive RAG system with persistent memory capabilities and specialized TFL invoice processing, using Qdrant as the vector database for document retrieval, invoice storage, and conversation memory. 

### Key Features

1. **General Document RAG**:
   - Document upload and embedding
   - Semantic search and retrieval
   - Context-aware chat with documents
   - Persistent conversation memory

2. **TFL Invoice Processing**:
   - Invoice upload and parsing (CSV, PDF, JSON)
   - Transaction extraction and embedding
   - Calendar-based date selection
   - Intelligent cost calculation based on selected dates
   - Chat functionality with invoice data
   - Cost breakdown and analysis

3. **Unified Memory System**:
   - Shared conversation memory across both features
   - Invoice-specific context in memory
   - Semantic search of past conversations

4. **Flexible Routing**:
   - Automatic request routing based on input type
   - Support for calculation-only, chat-only, or combined modes
   - Seamless integration between general RAG and TFL features

The flow ensures context-aware responses by combining document knowledge, invoice data, and conversation history, creating a seamless experience for both general document interactions and specialized TFL invoice processing.

