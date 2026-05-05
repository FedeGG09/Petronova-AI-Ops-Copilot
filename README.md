# Petronova AI Ops Copilot
<img width="1873" height="811" alt="image" src="https://github.com/user-attachments/assets/283bb1b5-937d-496a-a646-4e91841628c3" />

# Interactive Demo: https://petronova.lovable.app/
Petronova AI Ops Copilot is a production-oriented multi-agent web platform designed for industrial innovation in the energy sector. It helps teams analyze supply chain risk, track contracts, monitor maintenance alerts, and centralize operational context in one intelligent interface.

Built to look and behave like a real enterprise product, the system combines a modern frontend, a Cloudflare Workers backend, structured data storage, and a scalable architecture ready for future RAG and ML integrations.

## Key Features

- Multi-agent experience with role-based routing
- Supply chain risk analysis
- Contract and document context
- Maintenance and operations alerts
- Audit trail and query traceability
- Modern executive dashboard UI
- Cloudflare-ready deployment structure
- ML-ready architecture for future scoring and prediction
- Designed for real-world energy operations workflows

<img width="1857" height="809" alt="image" src="https://github.com/user-attachments/assets/c8256153-d3cf-4d8b-800a-8a263c88a101" />

## Use Cases

- Supplier risk monitoring
- Contract status review
- Maintenance anomaly detection
- Operational decision support
- Innovation demos for industrial leadership
- Internal copilots for energy companies

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- HTML
- CSS

### Backend
- Cloudflare Workers
- TypeScript
- D1 Database
- REST APIs

### Data & Intelligence
- Structured simulation data
- Risk scoring engine
- Intent routing
- Multi-agent orchestration
- ML-ready service layer
- RAG-ready document context

### Deployment & Infra
- Cloudflare Pages
- Cloudflare Workers
- Cloudflare D1
- GitHub

## Architecture

```text
User
  ↓
Frontend (React + Vite)
  ↓
Cloudflare Worker API
  ↓
Intent Router
  ↓
Agent Layer
  ├─ Supply Agent
  ├─ Contracts Agent
  ├─ Maintenance Agent
  └─ General Agent
  ↓
D1 Database + Document Context + Risk Engine
