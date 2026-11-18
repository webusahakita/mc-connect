---
name: freellmapi
description: FreeLLMAPI router and aggregator for 87+ free LLM providers behind a single OpenAI-compatible /v1 endpoint. Use to route AI queries through free tiers with automated fallback, quota management, and multi-model failover.
---

# FreeLLMAPI Skill

FreeLLMAPI aggregates free tiers from 87+ LLM providers (1,300+ free model endpoints) behind a single OpenAI-compatible `/v1` endpoint (`http://localhost:3001/v1`).

## Core Capabilities
- **Multi-Provider Unified Gateway:** Connects to Groq, Cerebras, Google Gemini Free, Cohere, Together AI, Mistral, OpenRouter, and more.
- **Intelligent Routing & Failover:** Automatically switches providers when a rate limit (HTTP 429) or quota exhaustion occurs.
- **Quota & Token Tracking:** Monitors daily and monthly free token budgets to prevent unexpected downtime.
- **Agent Integration:** Compatible with Claude Code, Codex, Cline, Continue, Aider, and Antigravity via standard OpenAI SDK wire protocol.

## Quick Start & Setup

### 1. Local / Docker Deployment
```bash
# Clone and run via Docker Compose
cd "c:\Users\Nawakara\.gemini\antigravity-ide\scratch\REPO OP\freellmapi-main\freellmapi-main"
docker compose up -d
```
Default Dashboard & API: `http://localhost:3001`
Unified OpenAI endpoint: `http://localhost:3001/v1`

### 2. Configure Client / AI Agent
To connect any agent or script to FreeLLMAPI:
- **Base URL:** `http://localhost:3001/v1`
- **API Key:** `<unified-key-from-dashboard>`
- **Model:** `auto` (auto-routing) or any specific free model ID (e.g. `llama-3.3-70b-versatile`, `gemini-2.0-flash`).

### 3. CLI Helper Commands
```bash
npx freellmapi setup-claude --url http://localhost:3001
npx freellmapi setup-codex --url http://localhost:3001/v1
```
