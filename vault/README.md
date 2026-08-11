# 🗄️ Vault (Krailo Labs Edge-Vault)

A high-performance, serverless **Secret & Configuration Manager** built for the Cloudflare Edge. Written in **Rust** and compiled to **WebAssembly (WASM)** to guarantee extreme speed, type safety, and memory-safe cryptography within V8 Isolates.

## ⚡ Why Rust & WASM?
Unlike traditional Node.js/TypeScript implementations where decrypted secrets linger in the V8 garbage-collected heap, this vault leverages Rust's strict memory management and the `zeroize` crate to **guarantee immediate memory clearing**. Decrypted bytes are overwritten with zeros in RAM the exact nanosecond they are no longer needed.

## ✨ Features
- **Serverless & Stateless:** No heavy daemons (like HashiCorp Vault), no infrastructure overhead. Runs natively on Cloudflare Workers + D1/KV.
- **Memory-Safe Cryptography:** Uses AES-256-GCM for payload encryption.
- **Declarative Access (GitOps Ready):** Service namespaces and access boundaries are driven by TOML configurations.
- **Zero-Trust Auth:** Admin REST API endpoints secured via Bearer Master Tokens.
- **Cold Starts:** <1ms initialization time thanks to compact WASM binaries.

## 🏗️ Architecture

```text
[ Client / CI/CD ] 
        │ (HTTPS + Authorization: Bearer <MASTER_KEY>)
        ▼
[ Rust WASM Worker ] ──(Web Crypto API: AES-256-GCM)──► [ CF D1 / KV Storage ]
        │
  (Memory Zeroization via `zeroize`)