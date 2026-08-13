# Krailo Labs — Edge Workers Monorepo

Monorepo containing edge workers and serverless automation utilities running on Cloudflare Workers infrastructure.

## Workers Catalog

| Worker | Language / Tech | Description | Trigger |
| :--- | :--- | :--- | :--- |
| [`petition-tracker`](./petition-tracker) | TypeScript / JS | Automated state-driven petition signature tracking with Telegram notifications. | Cron (`*/15 * * * *`) |
| [`krailo-vault`](./krailo-vault) | Rust / WASM | Edge-native, zero-cold-start Secret & Configuration Manager with client-side GitOps encryption [1]. | HTTP (REST API) |

## Architecture Overview

- **Compute:** Cloudflare Workers (V8 Edge Isolates running JS/TS & WebAssembly compiled from Rust).
- **State Management:** Cloudflare KV (highly distributed globally) and Cloudflare D1 (Serverless SQLite).
- **Security:** In-memory zeroization of sensitive buffers, constant-time AES-256-GCM cryptography, and signature verification [1].
- **Deployment:** Directory-scoped continuous integration and deployment.

## Repository Layout

Each directory represents a self-contained service or utility. Shared configurations and workspace manifests are placed in the root folder when applicable.