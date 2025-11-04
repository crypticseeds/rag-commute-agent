# Frontend - Work Transport & Document Assistant

React-based frontend application for calculating work transport costs and interacting with documents using AI-powered chat.

## Features

### 🚇 Transport Cost Calculator

- **Interactive Calendar**: Select your work days with an intuitive calendar interface that supports multi-date selection
- **Invoice Upload**: Upload TFL invoices in CSV or PDF format with drag-and-drop support
- **Cost Calculation**: Automatically calculate total transport costs based on selected work days and invoice data
- **File Sharing**: Seamlessly share uploaded invoices with the Document Assistant for further analysis

### 💬 Document Assistant (RAG Chat)

- **Document Upload**: Upload various document types (CSV, PDF, TXT, DOCX) for analysis
- **AI-Powered Chat**: Ask questions about your documents and get intelligent responses using Retrieval-Augmented Generation (RAG)
- **Streaming Responses**: Experience real-time streaming responses for a smooth conversational experience
- **Integrated Workflow**: Automatically use invoices uploaded in the Transport Calculator for chat analysis

### 🎨 User Experience

- **Modern UI**: Clean, responsive design built with Tailwind CSS
- **Toast Notifications**: Real-time feedback for user actions
- **Drag & Drop**: Easy file uploads with visual feedback
- **Responsive Layout**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Secrets Management**: Doppler
- **Hosting**: Vercel

## Prerequisites

- Node.js (v18 or higher recommended)
- Doppler CLI (for secrets management)

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

This project uses **Doppler** for secrets management. No `.env` files are needed.

#### Local Development Setup

1. Install Doppler CLI:
   ```bash
   # macOS/Linux
   curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh | sh
   
   # Or via package manager
   brew install doppler  # macOS
   ```

2. Authenticate with Doppler:
   ```bash
   doppler login
   ```

3. Set up your project:
   ```bash
   doppler setup
   ```

4. Pull secrets for local development:
   ```bash
   doppler secrets download --no-file --format env > .env.local
   ```

   Or use Doppler run command:
   ```bash
   doppler run -- npm run dev
   ```

#### Required Environment Variables

- `VITE_API_BASE_URL` - Backend API URL (default: `http://localhost:8000`)

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the port Vite assigns).

## Project Structure

```
frontend/
├── components/
│   ├── Calendar.tsx              # Date selection calendar
│   ├── Chat.tsx                  # RAG chat interface
│   ├── FileUpload.tsx            # File upload component
│   ├── TransportCalculator.tsx   # Main calculator component
│   ├── Toast.tsx                 # Toast notification component
│   └── icons/                    # Icon components
├── contexts/                     # React context providers
├── App.tsx                       # Main application component
├── index.tsx                     # Application entry point
├── types.ts                      # TypeScript type definitions
├── vite.config.ts               # Vite configuration
└── tsconfig.json                # TypeScript configuration
```

## Development

### Available Scripts

- **Start development server**: `npm run dev`
- **Build for production**: `npm run build`
- **Preview production build**: `npm run preview`

### Development with Doppler

Run commands with Doppler secrets:

```bash
doppler run -- npm run dev
```

## Deployment

### Vercel Setup

The frontend is hosted on **Vercel** with secrets managed through **Doppler**.

#### Production Deployment

1. **Configure Doppler Secrets**:
   - Ensure all required environment variables are set in Doppler
   - Use appropriate Doppler config (e.g., `prod`)

2. **Integrate Doppler with Vercel**:
   - Install the Doppler integration in your Vercel project
   - Connect your Doppler project and config
   - Environment variables will be automatically synced during deployment

3. **Deploy**:
   ```bash
   vercel --prod
   ```

   Or push to your main branch if Vercel is connected to your Git repository.

#### Environment Variables in Vercel

- All environment variables are managed through Doppler
- No manual configuration needed in Vercel dashboard (if Doppler integration is set up)
- Secrets are automatically injected during build and runtime

## Backend Integration

⚠️ **Note**: Currently, the frontend includes mock implementations for backend features. Once the backend is ready, it will provide:

- LangGraph-powered transport cost calculation
- RAG (Retrieval-Augmented Generation) document analysis
- API endpoints for file processing and chat functionality

Update `VITE_API_BASE_URL` in Doppler to point to your backend API when ready.

## Security

- All secrets are managed through Doppler
- No `.env` files are committed to the repository
- Environment variables are securely injected at build/runtime

---

For backend setup, see [../backend/README.md](../backend/README.md)

