# ArchLens — DoDAF Security Architecture Generator

A DoDAF-inspired architecture modeling tool that ingests **user personas** and **use cases**, then automatically generates structured architectural views of the target system using the Anthropic Claude API.

## What It Does

ArchLens applies a formal decomposition methodology (based on DoDAF — Department of Defense Architecture Framework) to transform free-text operational descriptions into structured architectural views:

| View | DoDAF Equivalent | Description |
|------|-----------------|-------------|
| OV-2 | Operational Resource Flow | Persona relationship graph — who collaborates with whom |
| OV-5b | Operational Activity Model | Capabilities decomposed into sequenced functions (Actor → Input → Process → Output) |
| OV-6c | Operational Event Trace | Swimlane sequence diagrams showing data flow per use case |
| SV-6 | Systems Data Exchange Matrix | Software × Persona × Data Object × Use Case mapping |
| SV-1 | Systems Interface Description | Systems and sub-systems with interfaces, protocols, and data flows between them |
| SV-4 | Systems Functionality Description | Functions performed by each system with inputs, outputs, and execution sequence |
| DIV-2 | Logical Data Model | Data entities, attributes, types, and relationships across the architecture |

**Planned future views:** CV-4, StdV-1

## Decomposition Methodology

Every use case is decomposed through the following instruction pipeline (encoded as Claude system prompts):

1. Review and understand every persona role and their primary goals
2. Review every use case and understand which personas participate
3. Decompose use cases into **Capabilities** → **Functions** → **Requirements**
4. For every function define: **Actor**, **Input**, **Process**, **Output**, **Destination**
5. Sequence functions in execution order within their parent capability
6. Classify every function: `human` | `auto` | `handoff`
7. Identify hardware boundaries (data boundary / latency / compliance / reachability)
8. Identify software components and data objects per use case
9. Analyze use cases for similarity and redundancy
10. Build persona relationship data
11. Map systems interfaces, protocols, and data flows (SV-1)
12. Derive per-system function inventory with inputs/outputs (SV-4)
13. Build logical data model with entity attributes and relationships (DIV-2)

## Getting Started

### Prerequisites
- Node.js 20+
- An [Anthropic API key](https://console.anthropic.com)

### Local Development

```bash
git clone https://github.com/Lamurrz/arch-lens.git
cd arch-lens/soc-architect
npm install
npm run dev
```

Open `http://localhost:5173`, enter your API key, and load the SOC example or enter your own personas and use cases.

### Build for Production

```bash
npm run build
```

The `dist/` directory is ready for any static host.

## GitHub Pages Deployment

This repo includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that automatically builds and deploys to GitHub Pages on every push to `main`.

**Setup steps:**
1. Push this repo to GitHub
2. Go to **Settings → Pages → Source** and select **GitHub Actions**
3. Push to `main` — the workflow handles the rest

The base path is automatically set to `/<repo-name>/` by the workflow.

## Architecture

```
soc-architect/
├── src/
│   ├── api/
│   │   ├── client.ts          # Claude API caller + FastAPI stub
│   │   └── backend.ts         # FastAPI integration point (swap in when ready)
│   ├── engine/
│   │   ├── prompts.ts         # Instruction set encoded as system prompts
│   │   └── decompose.ts       # Orchestrates API calls → typed view data
│   ├── models/
│   │   └── types.ts           # All TypeScript interfaces
│   ├── views/
│   │   ├── OV2_PersonaRelationships.tsx
│   │   ├── OV5b_ActivityModel.tsx
│   │   ├── OV6c_EventTrace.tsx
│   │   ├── SV6_DataExchangeMatrix.tsx
│   │   ├── SV1_SystemsInterface.tsx
│   │   ├── SV4_SystemsFunctionality.tsx
│   │   └── DIV2_LogicalDataModel.tsx
│   ├── components/
│   │   ├── InputPanel.tsx     # Persona + use case intake forms
│   │   └── ProcessingStatus.tsx
│   ├── store/
│   │   └── architectureStore.ts  # Zustand state (persisted to localStorage)
│   └── App.tsx
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Migrating to FastAPI Backend

When you're ready to add the FastAPI backend:

1. Set `USE_BACKEND = true` in `src/api/client.ts`
2. Set `VITE_BACKEND_URL` in your environment (`.env.local` for dev, GitHub Actions secrets for prod)
3. The `backendDecompose()` function in `client.ts` already points to `/api/decompose`
4. Implement the FastAPI endpoint to accept `ArchitectureInput` and return `DecomposeResult`

The frontend data models in `src/models/types.ts` map directly to Pydantic models for the FastAPI backend.

### FastAPI Backend Skeleton

```python
# backend/api/decompose.py
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Persona(BaseModel):
    id: str
    name: str
    description: str
    goals: list[str]

class UseCase(BaseModel):
    id: str
    title: str
    description: str
    personaIds: list[str]

class ArchitectureInput(BaseModel):
    projectName: str
    domain: str
    personas: list[Persona]
    useCases: list[UseCase]

@app.post("/api/decompose")
async def decompose(input: ArchitectureInput):
    # Call Claude API with SYSTEM_PROMPT + buildDecomposePrompt(input)
    # Return structured DecomposeResult
    pass
```

## API Key Security

Your Anthropic API key is:
- Stored only in your browser's `localStorage`
- Sent only to `api.anthropic.com` directly from your browser
- Never sent to any other server
- Never committed to the repository

For production deployments with a FastAPI backend, move the API key to the backend environment and remove it from the frontend entirely.

## Domain Flexibility

While the included example is a Security Operations Center, ArchLens works for any domain. The decomposition methodology is domain-agnostic — the Claude prompts derive architecture from whatever personas and use cases you provide.

## License

MIT
