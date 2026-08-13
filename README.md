# Krailo Labs — Edge Workers Monorepo

Monorepo containing edge workers, serverless utilities, and AI runtime
infrastructure running on the Cloudflare platform.

## Projects Catalog

Each project is self-contained and owns its source code, configuration,
documentation, and tests.

| Project | Language / Tech | Description | Trigger |
| :--- | :--- | :--- | :--- |
| [`petition-tracker`](./petition-tracker) | TypeScript / JS | Automated state-driven petition signature tracking with Telegram notifications. | Cron (`*/15 * * * *`) |
| [`krailo-vault`](./krailo-vault) | Rust / WASM | Edge-native, zero-cold-start Secret & Configuration Manager with client-side GitOps encryption. | HTTP (REST API) |
| [`krailo-brain`](./krailo-brain) | Cloudflare Agents / AI Runtime | Persistent AI Runtime / Agent Operating Environment with durable identity, long-term memory, project continuity, tools, and recoverable execution. | HTTP / Sessions |

## Architecture Overview

- **Compute:** Cloudflare Workers, Cloudflare Agents, V8 Edge Isolates, and WebAssembly compiled from Rust where applicable.
- **State Management:** Cloudflare KV, D1, Durable Objects, and project-specific persistent state where applicable.
- **AI Runtime:** `krailo-brain` provides the agent runtime layer for persistent identity, memory, project context, tool orchestration, and recoverable execution.
- **Security:** Project-specific security boundaries, secret isolation, authorization, validation, and secure runtime handling.
- **Deployment:** Directory-scoped continuous integration and deployment.

## Repository Layout

```text
edge-workers/
├── petition-tracker/
├── krailo-vault/
└── krailo-brain/