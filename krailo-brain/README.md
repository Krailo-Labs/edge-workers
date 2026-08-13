# krailo-brain 🧠

## Persistent AI Runtime / Agent Operating Environment

I am building `krailo-brain` as a long-lived runtime for AI agents.

The goal is not to build another chatbot.

The goal is to build an environment where an AI system can maintain identity,
durable knowledge, project context, runtime state, tools, and long-running work
independently from a single conversation or context window.

The underlying LLM is only the reasoning engine.

`krailo-brain` is the system around it.

---

# 1. Core Idea

A conventional AI interaction usually looks like this:

```text
┌──────────┐
│   USER   │
└────┬─────┘
     │
     ▼
┌──────────────┐
│ CHAT HISTORY │
└──────┬───────┘
       │
       ▼
┌─────────────────┐
│ CONTEXT WINDOW  │
└───────┬─────────┘
        │
        ▼
┌─────────────────┐
│       LLM       │
└─────────────────┘
```

The context window becomes the practical limit of continuity.

I want a different architecture:

```text
                              ┌──────────────┐
                              │     USER     │
                              └──────┬───────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │     KRAILO-BRAIN     │
                          │     AGENT RUNTIME    │
                          └──────────┬───────────┘
                                     │
        ┌────────────────────────────┼────────────────────────────┐
        │                            │                            │
        ▼                            ▼                            ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│  PERSONALITY  │           │    MEMORY     │           │   PROJECTS    │
│               │           │               │           │               │
│ Identity      │           │ Facts         │           │ State         │
│ User Profile  │           │ Decisions     │           │ Architecture  │
│ Principles    │           │ Events        │           │ Decisions     │
│ Behavior      │           │ Instructions  │           │ Constraints   │
│               │           │ Tasks         │           │               │
└───────┬───────┘           └───────┬───────┘           └───────┬───────┘
        │                            │                            │
        └────────────────────────────┼────────────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │   CONTEXT ASSEMBLER  │
                          └──────────┬───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │      AI GATEWAY      │
                          │ Model Control Layer  │
                          └──────────┬───────────┘
                                     │
                      ┌──────────────┼──────────────┐
                      │              │              │
                      ▼              ▼              ▼
               ┌───────────┐   ┌──────────┐   ┌──────────┐
               │ Workers AI│   │  Claude  │   │   GPT    │
               └─────┬─────┘   └────┬─────┘   └────┬─────┘
                     │              │              │
                     └──────────────┼──────────────┘
                                    │
                                    ▼
                            REASONING RESPONSE
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
               ┌─────────┐    ┌───────────┐   ┌───────────┐
               │ GitHub  │    │ Cloudflare│   │ Terminal  │
               └────┬────┘    └─────┬─────┘   └─────┬─────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                                    ▼
                            REAL ENVIRONMENT
```

The important distinction is:

```text
Context Window = temporary working context

Memory         = durable knowledge

Projects       = durable project/domain context

Runtime State  = what the agent is currently doing

Personality    = who the agent is and how it behaves

Tools          = what the agent can do

AI Gateway     = model-provider control, routing and observability

LLM            = reasoning engine
```

---

# 2. What I Am Building

I want `krailo-brain` to provide the following capabilities:

```text
┌────────────────────────────────────────────┐
│              KRAILO-BRAIN                  │
├────────────────────────────────────────────┤
│  1. Identity                               │
│  2. Long-Term Memory                       │
│  3. Project Continuity                     │
│  4. Runtime State & Execution              │
│  5. Tools & Integrations                   │
│  6. Model-Agnostic Reasoning               │
│  7. AI Provider Control & Observability    │
└────────────────────────────────────────────┘
```

The system should continue to understand relevant history without requiring
the entire historical conversation to be injected into every request.

---

# 3. Repository Position

`krailo-brain` is one independent project inside my `edge-workers`
repository.

```text
edge-workers/
│
├── petition-tracker/
│
├── krailo-vault/
│
└── krailo-brain/
```

The root `edge-workers` repository is the ecosystem.

Each directory is an independent project with its own implementation,
configuration, documentation, and internal architecture.

`krailo-brain` is not a nested Git repository and is not a second monorepo.

It is one project inside the existing `edge-workers` repository.

---

# 4. Why The Repository Is Split Into So Many Directories

The directory structure is intentional.

I do not want to mix:

* personality;
* memory;
* project knowledge;
* runtime state;
* tools;
* external integrations;
* model-provider logic;
* implementation code;
* configuration;
* tests;
* architecture documentation.

Each layer has a different responsibility.

The most important architectural rule is:

```text
PERSONALITY ≠ MEMORY ≠ PROJECT ≠ RUNTIME ≠ TOOL ≠ MODEL PROVIDER
```

This separation makes the system easier to reason about, debug, extend,
replace, and operate.

---

# 5. Repository Structure

```text
krailo-brain/
│
├── README.md
│
├── docs/
│   ├── VISION.md
│   ├── ARCHITECTURE.md
│   ├── MEMORY.md
│   ├── RUNTIME.md
│   ├── PERSONALITY.md
│   ├── PROJECTS.md
│   ├── TOOLS.md
│   ├── SECURITY.md
│   └── ROADMAP.md
│
├── personality/
│   ├── SOUL.md
│   ├── USER.md
│   ├── PRINCIPLES.md
│   └── BEHAVIOR.md
│
├── memory/
│   ├── README.md
│   ├── facts/
│   ├── decisions/
│   ├── events/
│   ├── instructions/
│   ├── tasks/
│   └── retrieval/
│
├── runtime/
│   ├── README.md
│   ├── agent/
│   ├── sessions/
│   ├── state/
│   ├── execution/
│   ├── routing/
│   └── prompt/
│
├── projects/
│   ├── README.md
│   ├── edge-workers/
│   ├── eth-node/
│   └── liquidation-bot/
│
├── tools/
│   ├── README.md
│   ├── github/
│   ├── cloudflare/
│   ├── terminal/
│   ├── filesystem/
│   └── web/
│
├── integrations/
│   ├── README.md
│   ├── github/
│   ├── cloudflare/
│   └── llm/
│
├── config/
│   ├── README.md
│   ├── environments/
│   └── schemas/
│
├── src/
│   ├── agent/
│   ├── memory/
│   ├── runtime/
│   ├── projects/
│   ├── tools/
│   └── integrations/
│
└── tests/
    ├── README.md
    ├── memory/
    ├── runtime/
    ├── tools/
    └── integration/
```

---

# 6. `personality/`

```text
personality/
├── SOUL.md
├── USER.md
├── PRINCIPLES.md
└── BEHAVIOR.md
```

This layer defines the stable identity and operating rules of the agent.

## `SOUL.md`

Defines the fundamental identity and purpose of the agent.

## `USER.md`

Defines the stable user profile.

This is not conversation history.

It contains information that should remain relevant across sessions.

## `PRINCIPLES.md`

Defines stable reasoning and operating principles.

These are rules that should remain stable and should not have to be
rediscovered from conversation history.

## `BEHAVIOR.md`

Defines practical interaction behavior.

This includes communication style, uncertainty handling, conflict handling,
decision boundaries, and interaction policies.

---

# 7. `memory/`

```text
memory/
├── facts/
├── decisions/
├── events/
├── instructions/
├── tasks/
└── retrieval/
```

Memory is the long-term knowledge layer.

It is deliberately not equivalent to storing every conversation.

## Facts

Things that are known to be true.

```text
Fact
 ├── content
 ├── source
 ├── confidence
 ├── created_at
 └── status
```

## Decisions

Important decisions and why they were made.

```text
Decision
 ├── decision
 ├── reason
 ├── project
 ├── alternatives
 ├── source
 └── status
```

## Events

Things that happened.

Examples:

```text
deployment
incident
migration
project milestone
architecture change
```

## Instructions

Persistent operational instructions that should influence future work.

## Tasks

Work that exists independently from the current conversation.

## Retrieval

The logic and infrastructure used to find relevant memories.

The memory layer should eventually support:

* relevance;
* deduplication;
* updates;
* supersession;
* provenance;
* confidence;
* expiration where appropriate.

---

# 8. `runtime/`

```text
runtime/
├── agent/
├── sessions/
├── state/
├── execution/
├── routing/
└── prompt/
```

Runtime is the core execution environment.

## `agent/`

The main agent lifecycle and runtime implementation.

This is where the Cloudflare Agent / Durable Object layer will eventually
live.

## `sessions/`

Manages active conversations and short-lived interaction state.

A session is not permanent memory.

```text
Session
  ↓
temporary working state

Memory
  ↓
long-term knowledge
```

## `state/`

Persistent runtime state.

Examples:

```text
active project
active task
workflow status
agent mode
execution state
```

## `execution/`

Long-running and recoverable work.

```text
start workflow
     ↓
execute step
     ↓
wait
     ↓
resume
     ↓
execute next step
     ↓
complete
```

The runtime should be able to recover important execution state instead of
depending on a live process remaining in memory.

## `routing/`

Determines what the current request needs.

```text
"What did I decide about X?"
        ↓
Memory

"Continue project Y"
        ↓
Project + Memory + Repository

"Run operation Z"
        ↓
Tool + Execution

"Explain concept X"
        ↓
Reasoning
```

## `prompt/`

Responsible for constructing the working context sent to the reasoning layer.

The runtime should assemble context from relevant sources rather than
blindly injecting everything it knows.

```text
SOUL
  +
USER
  +
RELEVANT MEMORY
  +
PROJECT STATE
  +
CURRENT SESSION
  +
TOOL RESULTS
  +
CURRENT REQUEST
        │
        ▼
  WORKING CONTEXT
        │
        ▼
  AI GATEWAY
        │
        ▼
       LLM
```

---

# 9. `projects/`

```text
projects/
├── edge-workers/
├── eth-node/
└── liquidation-bot/
```

This directory does **not** contain copies of project source code.

It contains durable knowledge about projects that the agent needs to
understand over time.

Each project has:

```text
PROJECT.md
CURRENT_STATE.md
ARCHITECTURE.md
DECISIONS.md
```

## `PROJECT.md`

What the project is, why it exists, and what its boundaries are.

## `CURRENT_STATE.md`

What is happening right now.

This should be the fastest way for the runtime to understand the current
project status.

## `ARCHITECTURE.md`

How the project is built.

## `DECISIONS.md`

Important architectural and operational decisions.

---

# 10. Project Knowledge vs. Project Code

This distinction is fundamental.

Actual source code remains in the real repositories:

```text
edge-workers/
├── petition-tracker/
├── krailo-vault/
└── krailo-brain/
```

The AI knowledge model lives here:

```text
krailo-brain/
└── projects/
    ├── edge-workers/
    ├── eth-node/
    └── liquidation-bot/
```

The two layers work together:

```text
             PROJECT KNOWLEDGE
                     │
                     ▼
              "What is this?"
                     │
                     ▼
                  GitHub
                     │
                     ▼
              "What is the
               actual code?"
                     │
                     ▼
                   LLM
```

Git remains the source of truth for source code.

`krailo-brain` provides continuity and understanding around that code.

---

# 11. `tools/`

```text
tools/
├── github/
├── cloudflare/
├── terminal/
├── filesystem/
└── web/
```

Tools represent explicit capabilities.

A tool is something the runtime can deliberately invoke.

Examples:

```text
GitHub
  ├── inspect repository
  ├── inspect commits
  └── modify repository

Cloudflare
  ├── inspect resources
  ├── inspect deployments
  └── manage resources

Terminal
  ├── run command
  └── inspect system

Filesystem
  ├── read
  └── write

Web
  ├── search
  └── retrieve information
```

Tools should eventually be:

* explicitly registered;
* authenticated;
* authorized;
* validated;
* auditable.

The reasoning model should never receive unrestricted infrastructure access.

---

# 12. `integrations/`

```text
integrations/
├── github/
├── cloudflare/
└── llm/
```

Integrations contain provider-specific implementations.

The purpose is to prevent the runtime from becoming tightly coupled to one
external provider.

For example:

```text
Runtime
   │
   ▼
Internal LLM Interface
   │
   ▼
AI Gateway
   │
   ├── Workers AI
   ├── Claude
   ├── GPT
   └── Other Providers
```

The same principle applies to GitHub and Cloudflare integrations.

---

# 13. AI Gateway

AI Gateway is the model-control and observability layer between the runtime
and external reasoning providers.

It is **not** the memory layer.

It is **not** the agent runtime.

It is **not** the reasoning model itself.

Its responsibility is to provide a controlled interface between
`krailo-brain` and the model ecosystem.

```text
                    KRAILO-BRAIN
                         │
                  Context Assembler
                         │
                         ▼
                ┌─────────────────┐
                │   AI GATEWAY    │
                │                 │
                │ Routing         │
                │ Observability   │
                │ Provider Control│
                │ Fallback        │
                │ Policy          │
                └───────┬─────────┘
                        │
             ┌──────────┼──────────┐
             ▼          ▼          ▼
        Workers AI    Claude       GPT
             │          │          │
             └──────────┼──────────┘
                        │
                        ▼
                   LLM RESPONSE
```

The gateway should allow the runtime to remain independent from a specific
model provider.

Potential responsibilities include:

* model/provider routing;
* retries;
* fallback;
* request observability;
* response observability;
* token usage tracking;
* cost tracking;
* latency tracking;
* provider health;
* optional caching;
* centralized model configuration.

The architectural separation is:

```text
Runtime      → controls the agent

Memory       → preserves knowledge

Projects     → preserve project context

AI Gateway   → controls the model layer

LLM          → provides reasoning

Tools        → provide capabilities
```

This allows me to change models without redesigning the runtime.

It also gives the system a centralized place to understand how the reasoning
layer behaves in production.

---

# 14. `config/`

```text
config/
├── environments/
└── schemas/
```

This layer contains configuration contracts.

It may eventually define:

* runtime environments;
* feature flags;
* agent configuration;
* tool configuration;
* schema definitions;
* provider configuration.

Secrets do not belong in Git.

---

# 15. `src/`

```text
src/
├── agent/
├── memory/
├── runtime/
├── projects/
├── tools/
└── integrations/
```

This is where the actual implementation will live.

The architectural relationship is:

```text
docs/
   ↓
defines architecture

src/
   ↓
implements architecture
```

---

# 16. `tests/`

```text
tests/
├── memory/
├── runtime/
├── tools/
└── integration/
```

Testing is divided according to architecture.

Eventually I want to test:

```text
Memory retrieval
Memory updates
Memory supersession

Project reconstruction

Runtime state

Tool authorization

Execution recovery

AI provider routing

AI Gateway behavior

End-to-end agent workflows
```

---

# 17. Cloudflare Runtime Model

The planned runtime is based around the Cloudflare ecosystem.

Conceptually:

```text
┌──────────────────────────────────────────┐
│          CLOUDFLARE AGENT RUNTIME        │
├──────────────────────────────────────────┤
│ Agent / Durable Object                   │
│                                          │
│ Persistent State                         │
│ Sessions                                 │
│ Scheduling                               │
│ Durable Execution                        │
│ Tool Calls                               │
│ Memory Retrieval                         │
└──────────────────────┬───────────────────┘
                       │
                       ▼
                Context Assembler
                       │
                       ▼
                  AI Gateway
                       │
                       ▼
                 Reasoning LLM
```

Cloudflare-specific services are implementation choices behind these
capabilities.

The architecture should depend on capabilities, not on one specific
Cloudflare product.

---

# 18. AI Model Strategy

I want the reasoning layer to remain replaceable.

The target architecture is:

```text
                 AGENT RUNTIME
                       │
                       ▼
                CONTEXT ASSEMBLER
                       │
                       ▼
                  AI GATEWAY
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Workers AI     Claude        GPT
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                    RESPONSE
```

Different workloads may use different models.

For example:

```text
Simple classification
        ↓
Lower-cost model

Memory extraction
        ↓
Efficient model

Complex reasoning
        ↓
High-capability model
```

The decision about which model to use belongs to the runtime and model-control
layer, not to the permanent personality or memory system.

---

# 19. Memory Is Not Context

This is one of the most important rules in the project.

```text
                 MEMORY
                   │
              Relevant recall
                   │
                   ▼
          ┌─────────────────┐
          │  CONTEXT WINDOW │
          └─────────────────┘
                   │
                   ▼
             AI GATEWAY
                   │
                   ▼
                  LLM
```

The context window is temporary.

Memory is persistent.

The runtime decides which memory is relevant enough to enter the current
working context.

The AI Gateway then controls how that working context reaches the chosen
reasoning provider.

This prevents the system from becoming dependent on increasingly large
historical conversations.

---

# 20. Lifecycle of a Request

A complete request should eventually look like this:

```text
                       USER
                        │
                        ▼
                 ┌─────────────┐
                 │   RECEIVE   │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │    ROUTE    │
                 └──────┬──────┘
                        │
           ┌────────────┼────────────┐
           ▼            ▼            ▼
        Project        Memory       Tool
        Context        Recall       Need
           │            │            │
           └────────────┼────────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │  ASSEMBLE   │
                 │   CONTEXT   │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │ AI GATEWAY  │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │     LLM     │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │    TOOLS    │
                 └──────┬──────┘
                        │
                        ▼
                 ┌─────────────┐
                 │   RESULT    │
                 └──────┬──────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
      Memory Update          Project Update
```

A completed conversation can therefore produce durable changes.

For example:

```text
Conversation
    │
    ├── New fact
    │       ↓
    │     Memory
    │
    ├── New decision
    │       ↓
    │     Decision log
    │
    ├── Project change
    │       ↓
    │     Current state
    │
    └── Remaining work
            ↓
          Task
```

---

# 21. Source of Truth

Different information has different authoritative sources.

```text
PERSONALITY
    → personality/

LONG-TERM MEMORY
    → memory / runtime memory system

PROJECT KNOWLEDGE
    → projects/

SOURCE CODE
    → Git repositories

CURRENT SYSTEM STATE
    → actual infrastructure / tools

CURRENT SESSION
    → runtime/session state

MODEL PROVIDER CONFIGURATION
    → runtime / integrations / AI Gateway configuration
```

I do not want one enormous "everything database".

Different information should have an appropriate source of truth.

If sources disagree, the runtime should detect and surface the conflict instead
of silently inventing an answer.

---

# 22. What `krailo-brain` Is Not

I am deliberately not building:

```text
LLM
 +
giant prompt
 +
full chat transcript
```

I am also not building:

* a generic public chatbot;
* an LLM permanently tied to one provider;
* unrestricted model access to infrastructure;
* a copy of every Git repository inside the agent;
* an opaque memory dump containing every conversation;
* a system where important architectural decisions exist only inside prompts;
* a model-provider implementation embedded directly into the core runtime.

---

# 23. Development Strategy

I want to build the system from the inside out.

```text
                   FOUNDATION
                       │
                       ▼
                  PERSONALITY
                       │
                       ▼
                    RUNTIME
                       │
                       ▼
                PERSISTENT STATE
                       │
                       ▼
                    MEMORY
                       │
                       ▼
                   PROJECTS
                       │
                       ▼
                CONTEXT ASSEMBLY
                       │
                       ▼
                  AI GATEWAY
                       │
                       ▼
                  REASONING LLM
                       │
                       ▼
                    TOOLS
                       │
                       ▼
                 INTEGRATIONS
                       │
                       ▼
              DURABLE EXECUTION
                       │
                       ▼
                SECURITY / AUDIT
                       │
                       ▼
                   PRODUCTION
```

I do not want to implement every possible subsystem before the core runtime
works.

The first milestone is a minimal agent that can:

1. maintain identity;
2. maintain persistent state;
3. retrieve durable memory;
4. understand a project;
5. assemble relevant context;
6. invoke a model through the model-control layer;
7. call an explicit tool;
8. continue the same work in a later session.

Everything else should grow around that foundation.

---

# 24. Current Status

```text
[✓] Repository created
[✓] Architecture skeleton
[✓] Personality boundary
[✓] Memory boundary
[✓] Runtime boundary
[✓] Project model
[✓] Tool model
[✓] Integration model
[✓] AI Gateway architecture
[✓] Documentation structure

[ ] Agent runtime
[ ] Persistent state implementation
[ ] Memory implementation
[ ] Retrieval
[ ] Project loading
[ ] Context assembly
[ ] AI Gateway integration
[ ] Model routing
[ ] Tool execution
[ ] Durable execution
[ ] Security
[ ] Observability
[ ] Production deployment
```

---

# 25. Final Architectural Model

The complete architecture should be understandable through one diagram:

```text
                              ┌──────────────┐
                              │     USER     │
                              └──────┬───────┘
                                     │
                                     ▼
                    ╔══════════════════════════╗
                    ║       KRAILO-BRAIN       ║
                    ║      AGENT RUNTIME       ║
                    ╚════════════╤═════════════╝
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       │                         │                         │
       ▼                         ▼                         ▼
┌───────────────┐        ┌───────────────┐        ┌───────────────┐
│  PERSONALITY  │        │    MEMORY     │        │   PROJECTS    │
├───────────────┤        ├───────────────┤        ├───────────────┤
│ SOUL          │        │ Facts         │        │ State         │
│ USER          │        │ Decisions     │        │ Architecture  │
│ PRINCIPLES    │        │ Events        │        │ Decisions     │
│ BEHAVIOR      │        │ Instructions  │        │ Constraints   │
└───────┬───────┘        │ Tasks         │        └───────┬───────┘
        │                └───────┬───────┘                │
        │                        │                        │
        └────────────────────────┼────────────────────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │   CONTEXT ASSEMBLER │
                      └──────────┬──────────┘
                                 │
                                 ▼
                      ┌─────────────────────┐
                      │     AI GATEWAY      │
                      │                     │
                      │ Routing             │
                      │ Fallback            │
                      │ Observability       │
                      │ Cost / Tokens       │
                      │ Provider Control    │
                      └──────────┬──────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
               Workers AI      Claude         GPT
                    │            │            │
                    └────────────┼────────────┘
                                 │
                                 ▼
                           REASONING
                                 │
                                 ▼
                              TOOLS
                                 │
                    ┌────────────┼────────────┐
                    ▼            ▼            ▼
                 GitHub      Cloudflare    Terminal
                    │            │            │
                    └────────────┼────────────┘
                                 │
                                 ▼
                         REAL ENVIRONMENT
```

The architectural division is intentionally simple:

```text
Personality  → Who the agent is

Memory       → What the agent remembers

Projects     → What the agent understands about ongoing work

Runtime      → What the agent is doing

AI Gateway   → How model providers are controlled

LLM          → How the agent reasons

Tools        → What the agent can do

Integrations → What external systems it can connect to
```

That separation is the foundation of `krailo-brain`.

The goal is not to create one enormous prompt or one enormous database.

The goal is to build a runtime where an AI system can maintain continuity,
recover relevant knowledge, understand long-running work, select an appropriate
reasoning model, use explicit tools, and continue operating as the system
evolves.
