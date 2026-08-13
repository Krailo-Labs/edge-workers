
### 3. У `docs/ARCHITECTURE.md` додай це

```markdown
## AI Model Layer

The model layer is intentionally separated from the agent runtime.

`krailo-brain` should be able to switch between model providers without
rewriting the core runtime.

The expected flow is:

```text
Agent Runtime
      │
      ▼
Context Assembly
      │
      ▼
AI Gateway
      │
      ├── Workers AI
      ├── Claude
      ├── GPT
      └── Other providers