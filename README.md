# Krailo Labs — Edge Workers Monorepo

Monorepo containing edge workers and serverless automation utilities running on Cloudflare Workers infrastructure.

## Workers Catalog

| Worker | Description | Trigger |
| :--- | :--- | :--- |
| [`petition-tracker`](./petition-tracker) | Automated state-driven petition signature tracking with Telegram notifications | Cron (`*/15 * * * *`) |

## Architecture Overview

- **Runtime:** Cloudflare Workers (V8 Edge Isolates)
- **State Management:** Cloudflare KV
- **Deployment:** Continuous Deployment per directory
