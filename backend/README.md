# Backend - Work Transport & Document Assistant

Python-based backend API service for transport cost calculation and document analysis using agentic AI.

## Status

⚠️ **Work in Progress**: This backend is a template/boilerplate that is actively being developed and will be updated with new features and improvements over time.

## Overview

This backend service powers the Work Transport & Document Assistant application with:

- LangGraph-powered transport cost calculation
- RAG (Retrieval-Augmented Generation) document analysis
- API endpoints for file processing and chat functionality
- Integration with the frontend React application

## Tech Stack

### Core Technologies

- **LangGraph**: For building agentic AI workflows and state machines
- **LangFlow**: For creating agentic AI applications and visual workflows
- **Langfuse**: For observability, monitoring, and analytics of LLM applications
- **uv**: For Python dependency management (replacing pip/requirements.txt)
- **Doppler**: For secrets and environment variable management

### Planned Integration

The following tools will be set up in the future:

- **Opikk**: For additional AI/ML capabilities
- **LangSmith**: For LLM application monitoring and debugging

## Prerequisites

- Python ≥3.13
- uv (Python package manager)
- Doppler CLI (for secrets management)

## Setup

### 1. Install uv

```bash
# macOS/Linux
curl -LsSf https://astral.sh/uv/install.sh | sh

# Or via package manager
brew install uv  # macOS
```

### 2. Create Virtual Environment

```bash
cd backend
uv venv
```

### 3. Activate Virtual Environment

```bash
# macOS/Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate
```

### 4. Install Dependencies

```bash
uv pip install -e .
```

Or add new dependencies:

```bash
uv add <package-name>
```

### 5. Configure Environment Variables

This project uses **Doppler** for secrets management. No `.env` files are needed.

#### Local Development Setup

1. Install Doppler CLI (if not already installed):
   ```bash
   curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh
   ```

2. Authenticate with Doppler:
   ```bash
   doppler login
   ```

3. Set up your project:
   ```bash
   doppler setup
   ```

4. Run with Doppler secrets:
   ```bash
   doppler run -- python main.py
   ```

#### Required Environment Variables

Configure these in Doppler:

- Backend API configuration
- LangGraph/LangFlow API keys
- Langfuse API keys and secrets
- Database connection strings (if applicable)
- Other service credentials

## Project Structure

```
backend/
├── main.py              # Application entry point
├── pyproject.toml       # Project configuration and dependencies
├── .python-version      # Python version specification
└── README.md            # This file
```

## Development

### Running the Application

```bash
# Activate virtual environment
source .venv/bin/activate  # macOS/Linux

# Run with Doppler
doppler run -- python main.py
```

### Adding Dependencies

Use `uv` to manage dependencies:

```bash
# Add a dependency
uv add <package-name>

# Add a dev dependency
uv add --dev <package-name>

# Update dependencies
uv sync
```

### Linting and Type Checking

This project uses:

- **ruff**: For linting and formatting
- **pyright**: For type checking

```bash
# Format code with ruff
ruff format .

# Lint code
ruff check .

# Type check with pyright
pyright .
```

## Features (Planned)

### Transport Cost Calculator

- Process TFL invoices (CSV, PDF)
- Calculate costs based on selected work days
- Integrate with LangGraph for intelligent cost calculation

### Document Assistant (RAG)

- Document upload and processing
- Vector database integration for document retrieval
- LangGraph-powered chat interface
- Streaming responses for real-time interaction

### API Endpoints

- File upload endpoints
- Chat endpoints with streaming support
- Transport calculation endpoints
- Health check and status endpoints

## Observability

- **Langfuse**: Integrated for LLM observability
  - Track all LLM calls
  - Monitor performance and costs
  - Debug and analyze conversations

- **LangSmith**: Will be integrated for additional monitoring and debugging

## Security

- All secrets are managed through Doppler
- No `.env` files are committed to the repository
- Environment variables are securely injected at runtime

## Deployment

### Production Setup

1. Configure Doppler secrets for production environment
2. Set up deployment pipeline (e.g., Docker, cloud functions)
3. Ensure Doppler integration with deployment platform
4. Configure health checks and monitoring

## Testing

Run tests using pytest:

```bash
pytest
```

## Future Enhancements

- Complete LangGraph workflow implementation
- LangFlow integration for visual workflow design
- Opikk integration for additional AI capabilities
- LangSmith integration for enhanced monitoring
- Database integration for data persistence
- Authentication and authorization
- Rate limiting and API security

---

**Note**: This is a template/boilerplate that will evolve as the project progresses.

For frontend setup, see [../frontend/README.md](../frontend/README.md)
