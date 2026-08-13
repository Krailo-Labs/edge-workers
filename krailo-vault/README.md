# krailo-vault 🔐

An edge-native, memory-safe, zero-cold-start Secret & Configuration Manager built with Rust, WebAssembly (WASM), and Cloudflare Workers. 

Designed with a declarative GitOps workflow (inspired by Kubernetes Custom Resources), `krailo-vault` allows you to securely manage, locally encrypt, and dynamically apply configurations to global edge storage without exposing credentials in your Git repositories [1, 2].

---

## 🏗️ Ecosystem Division: CLI vs. Backend

The ecosystem is strictly divided into two high-performance components:

### 1. The CLI (`kvault`) — Native Rust Binary
* **Directory:** `cli/` (compiles to binary named `kvault`)
* **Role:** Local operations (Client-side control plane).
* **Execution:** Compiles to a native machine-code binary (Mach-O, ELF, or PE) for instant execution with direct disk access.
* **Responsibilities:** Reads declarative YAML files, runs local key derivation functions (KDF), performs selective client-side symmetric encryption (AES-256-GCM) [1, 2], and securely manages the local configuration state [1]. When invoking `apply`, it decrypts secrets in-memory and sends plaintext over encrypted TLS (HTTPS) directly to the edge, ensuring no raw passwords are saved to disk or repository.

### 2. The Backend (`krailo-vault-worker`) — WebAssembly (WASM)
* **Directory:** `worker/` (compiles to Cloudflare Worker named `krailo-vault-worker`)
* **Role:** Global execution and storage (Data plane).
* **Execution:** Compiled from Rust to WebAssembly (WASM), running globally inside Cloudflare's V8 isolates (300+ edge locations).
* **Responsibilities:** Acts as the secure gatekeeper. It enforces bearer token authorization (`Authorization: Bearer <KEY>`), processes incoming configurations, performs its own edge-side AES-256-GCM database encryption, and handles persistent key-value states inside Cloudflare KV [1]. WebAssembly ensures zero-cold-start execution, guaranteed memory isolation, and high-speed cryptographic throughput.

---

## 📄 The Declarative Manifest (`EdgeVault`)

`krailo-vault` uses a strict, Kubernetes-style declarative schema. This eliminates messy prefix strings (such as `ENC[...]`) on every key, ensuring that your Infrastructure as Code (IaC) remains 100% compliant with standard YAML parsers and fits seamlessly into cloud-native automation pipelines.

### YAML Manifest Schema Specification

Below is the complete parameter specification of the `EdgeVault` manifest:

* **`apiVersion` & `kind`:** Standard API definitions. Used to safely version schemas and register custom resources (CRDs) within cloud ecosystems.
* **`metadata.name`:** Unique identifier for the targeted application or stack.
* **`metadata.namespace`:** Crucial for multi-tenancy. Dictates the Cloudflare KV prefix. All records are saved under the key schema `<namespace>:<key>` (e.g., `production:DB_PASSWORD` and `staging:DB_PASSWORD` are completely isolated in KV).
* **`metadata.annotations.krailo.sh/encrypted`:** A boolean string (`"true"` or `"false"`) indicating the cryptographic state of the `spec.secrets` block. The CLI uses this to safeguard against accidental plain-text commits to version control or double-encryption runs.
* **`spec.target.provider`:** Abstracted storage adapter. Currently set to `cloudflare-kv`. The architecture of the CLI is decoupled, meaning switching this provider in the future to `cloudflare-d1` or `aws-secrets` will route API payloads to different database adapters without modifying your schema layout.
* **`spec.target.endpoint`:** Targeted Worker API endpoint URL. Supports local hosts or custom production domains.
* **`spec.variables`:** Environmental configuration parameters that do not contain sensitive data. These always remain plaintext on disk, in Git, and are stored unencrypted at the Edge.
* **`spec.secrets`:** Highly sensitive data. They are encrypted locally by the CLI for Git storage [1, 2], temporarily decrypted in-memory during sync, and securely transmitted to the Edge where the Worker re-encrypts them before writing them to the KV database.

---

## 🔐 Selective Cryptography: Plaintext vs. Encrypted Manifests

The CLI manages the file's state seamlessly. Only values defined under the `secrets` array are cryptographically transformed, keeping public `variables` completely readable for peer reviews (Pull Requests) on GitHub.

### Plaintext State (`krailo.sh/encrypted: "false"`)
Used during local editing. Secrets are readable.

```yaml
apiVersion: krailo.sh/v1alpha1
kind: EdgeVault
metadata:
  name: portfolio-backend
  namespace: production
  annotations:
    krailo.sh/encrypted: "false"
spec:
  target:
    provider: cloudflare-kv
    endpoint: "https//api.vault.krailo.sh"
  variables:
    PORT: "8080"
    LOG_LEVEL: "info"
  secrets:
    DB_PASSWORD: "my-super-secret-password"
```

### Encrypted State (`krailo.sh/encrypted: "true"`)
Generated via CLI. Secrets are strong AES-256-GCM ciphertexts wrapped in Base64 [1, 2]. Safely committed to public Git repos.

```yaml
apiVersion: krailo.sh/v1alpha1
kind: EdgeVault
metadata:
  name: portfolio-backend
  namespace: production
  annotations:
    krailo.sh/encrypted: "true"
spec:
  target:
    provider: cloudflare-kv
    endpoint: "https//api.vault.krailo.sh"
  variables:
    PORT: "8080"
    LOG_LEVEL: "info"
  secrets:
    DB_PASSWORD: "U2FsdGVkX19P8MhY7m9vM2FzZTY0Y2lwaGVydGV4dGRlbW8="
```

---

## 🛠️ CLI Usage & GitOps Workflow

Before executing any commands, export your secret passphrase. The CLI automatically reads this variable to perform local cryptographic processes and authenticate requests to the Cloudflare API:

```bash
export VAULT_MASTER_KEY="my-local-test-master-key-123"
```

### 1. Encrypting for Git (`encrypt`)
Run this command locally before committing your plaintext configuration:
```bash
kvault encrypt --file test.yaml
```
* **Process:** The CLI verifies the file is decrypted (`krailo.sh/encrypted: "false"`). It generates a random 12-byte initialization vector (nonce) for every secret entry, encrypts it using AES-256-GCM with your key, combines them, encodes the binary ciphertext to a clean Base64 string, and updates the file annotation to `"true"` [1, 2].

### 2. Decrypting for Editing (`decrypt`)
Run this command when you need to change a password or add configurations locally:
```bash
kvault decrypt --file test.yaml
```
* **Process:** Decodes the Base64 ciphertext, extracts the 12-byte nonce, decrypts the ciphertext using your master key, and restores the file back to plaintext (annotated with `"false"`) [1, 2].

### 3. Deploying to the Edge (`apply`)
Apply the configuration to your live Cloudflare infrastructure. Run this either locally during development or directly inside your GitHub Actions CI/CD workflows:
```bash
kvault apply --file test.yaml
```
* **Process:** The CLI reads the manifest. If it is marked as `encrypted: "true"`, the CLI decrypts secrets in-memory and streams both plaintext variables and decrypted secrets securely over HTTPS TLS to the Worker API. The Worker then authenticates the payload, encrypts it using its own Edge-side key, and saves it into KV.

---

## 🚀 Local Development & Setup

You can completely emulate the global Cloudflare Edge environment locally on your workstation.

### Step 1: Start the Local Cloudflare Worker Emulator
1. Navigate to your worker package directory:
   ```bash
   cd worker
   ```
2. Create your local development environment variables file (gitignored):
   ```text
   VAULT_MASTER_KEY=my-local-test-master-key-123
   ```
3. Start the local server using Wrangler:
   ```bash
   npx wrangler dev
   ```
   *The mock Edge Worker is now listening locally at `https//api.vault.krailo.sh OR http://127.0.0.1:8787`.*

### Step 2: Build and Install the `kvault` CLI Globally
Open a separate terminal window, return to the workspace root, and compile the CLI package globally:
```bash
cd /home/init/work_dir/github/edge-workers/krailo-vault
cargo install --path cli
```
*This compiles an optimized release build and maps it directly into your global system PATH (typically `~/.cargo/bin/`). You can now execute `kvault` from any directory on your computer.*

### Step 3: Run the Local Synchronization Test
Create a `dev.yaml` manifest in your directory, targeting `https//api.vault.krailo.sh OR http://127.0.0.1:8787` as the endpoint, and run:
```bash
export VAULT_MASTER_KEY="my-local-test-master-key-123"
kvault apply -f dev.yaml
```

---

## 🌍 Production Deployment (Self-Hosted Model)

`krailo-vault` is designed to be 100% self-hosted, giving you total ownership of your domains, encryption keys, and edge data storage.

### Step 1: Create KV Namespace
Inside your Cloudflare Dashboard, go to **Workers & Pages** -> **KV** -> **Create a Namespace** (e.g., `krailo-vault-production`). Copy the generated **Namespace ID**.

### Step 2: Configure `worker/wrangler.toml`
Update your Wrangler configuration with your unique Namespace ID and target Worker name:
```toml
name = "krailo-vault-worker"
main = "build/worker/shim.mjs"
compatibility_date = "2026-01-01"

[[kv_namespaces]]
binding = "VAULT_KV"
id = "YOUR_CLOUDFLARE_KV_ID_HERE"

[build]
command = "worker-build --release"
```

### Step 3: Upload the Production Master Key
Submit your production master key directly to Cloudflare's secure secrets store:
```bash
cd worker
npx wrangler secret put VAULT_MASTER_KEY
```
*Input your secure production key when prompted.*

### Step 4: Deploy the Worker
```bash
npx wrangler deploy
```

### Step 5: Configure Your Custom Domain (`api.vault.krailo.sh`)
To bind your own domain (e.g., `api.vault.krailo.sh`) to the deployed worker:
1. In the Cloudflare Dashboard, go to **Workers & Pages** -> **krailo-vault-worker**.
2. Select **Settings** -> **Triggers** -> **Custom Domains**.
3. Click **Add Custom Domain** and enter: `api.vault.krailo.sh` (or any custom domain you control).
4. Update your production `EdgeVault` YAML manifests to point to this new endpoint.

---

## 💻 API Consumption & Integrations

Once applied to Cloudflare Edge KV, your applications and services can pull configurations dynamically at runtime over secure REST requests.

### 1. Shell / Curl Consumption
```bash
curl -H "Authorization: Bearer my-local-test-master-key-123" \
  https://api.vault.krailo.sh/v1/store/production/DB_PASSWORD
```

### 2. Node.js / TypeScript Runtime Integration
```typescript
const fetchSecret = async (namespace: string, key: string): Promise<string> => {
  const url = `https://api.vault.krailo.sh/v1/store/${namespace}/${key}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${process.env.VAULT_MASTER_KEY}`
    }
  });

  if (!response.ok) {
    throw new Error(`Edge Vault Error: ${response.status} ${response.statusText}`);
  }

  return await response.text();
};
```

### 3. Future Kubernetes (K8s) Declarative Integration
Because the `EdgeVault` manifest is completely standard-compliant, future versions of the `kvault` CLI will feature native Kubernetes `Secret` generation.

Running this command:
```bash
kvault generate-k8s -f test.yaml > secret.yaml
```

Will dynamically parse your `EdgeVault` resource, decrypt secrets locally in memory using `VAULT_MASTER_KEY`, and output a native Kubernetes Opaque Secret manifest:

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: portfolio-backend-secrets
  namespace: production
type: Opaque
data:
  DB_PASSWORD: "bXktc3VwZXItc2VjcmV0LXBhc3N3b3Jk" # Native K8s Base64 plaintext string
```

---

## 📦 Upcoming Storage Providers & Adapters (To be added to the Providers/Target section)

While `cloudflare-kv` is currently the primary reference storage engine [1], `krailo-vault` is architected as a multi-storage system. Cloudflare provides several robust storage mechanisms, and support for the following adapters is currently under active development and will be integrated into the codebase shortly:

*   **`cloudflare-d1` (Cloudflare D1 Serverless SQLite):** Perfect for relational configurations, access-control lists, and generating granular audit logs (e.g., tracking who accessed which secret, when, and with what token directly at the edge) [1].
*   **`cloudflare-r2` (Cloudflare R2 Object Storage):** Designed for storing larger payloads such as SSL/TLS certificates, structured `.env` files, or encrypted container configuration bundles.
*   **`cloudflare-do` (Cloudflare Durable Objects):** Will be used to handle strongly consistent configurations, distributed locks, and real-time state synchronization across global edge instances.

---

### 2. Edge-Native AI Orchestration (`cloudflare-ai` Profiles)

We are extending the declarative GitOps approach to serverless AI configurations. Soon, using the new **`cloudflare-ai`** target provider, you will be able to manage AI prompts, model weights, and routing rules globally using the same workflow with a new manifest: `kind: EdgeAIProfile`.

This allows you to version-control and deploy:
*   **System prompts:** System instructions and operational guidelines for LLMs.
*   **Active AI model routing:** Automatically switching between models (like Llama 3 or Mistral) based on cost, performance, or latency thresholds.
*   **Model parameters:** Dynamic adjustment of model temperature, maximum tokens, and orchestration parameters directly at the Edge.

---

### 3. Kubernetes Ecosystem Integration (CRD & Operator)

To bridge the gap between Cloudflare's serverless edge and traditional containerized infrastructure, we are actively developing a native Kubernetes Operator written in Rust.

*   **Custom Resource Definition (CRD):** The operator registers `EdgeVault` as a native object inside your cluster.
*   **Active Reconciliation:** Instead of manually running CLI commands, the operator will run in your cluster, watch `EdgeVault` resources, dynamically communicate with your Cloudflare Worker API (`api.vault.krailo.sh`), and automatically generate, update, or sync native Kubernetes `Secret` objects in real-time.


## License

This project is licensed under the MIT License.

*Built with 🦀 Rust and 💛 Cloudflare Workers by Krailo Labs.*
```
```