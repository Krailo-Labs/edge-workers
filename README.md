# Krailo Labs — Edge Workers Monorepo

Monorepo containing edge workers and serverless automation utilities running on Cloudflare Workers infrastructure.

## Workers Catalog

| Worker | Description | Trigger |
| :--- | :--- | :--- |
| [`petition-tracker`](./petition-tracker) | Automated state-driven petition signature tracking with Telegram notifications | Cron (`*/15 * * * *`) |
| [`vault`](./vault) | Zero-server, memory-safe Secret & Configuration Manager written in Rust / WASM | HTTP (REST API) |

## Architecture Overview

- **Compute:** Cloudflare Workers (V8 Edge Isolates for JS/TS & WebAssembly for Rust)
- **State Management:** Cloudflare KV, Cloudflare D1 (SQLite Edge Database)
- **Security:** Memory zeroization via Rust, constant-time cryptography (AES-256-GCM)
- **Deployment:** Continuous Deployment per directory
