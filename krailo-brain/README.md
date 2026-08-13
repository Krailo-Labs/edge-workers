# krailo-brain 🧠

## Persistent AI Runtime / Agent Operating Environment

I am building `krailo-brain` as a long-lived runtime for AI agents.

The goal is not to build another chatbot.

The goal is to build an environment where an AI system can maintain identity, durable knowledge, project context, state, tools, and long-running work independently from a single conversation or context window.

The underlying LLM is only the reasoning engine.

`krailo-brain` is the system around it.

---

# 1. The Core Idea

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
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐
  │  PERSONALITY  │    │    MEMORY     │    │   PROJECTS    │
  │               │    │               │    │               │
  │ Identity      │    │ Facts         │    │ State         │
  │ User Profile  │    │ Decisions     │    │ Architecture  │
  │ Principles    │    │ Events        │    │ Decisions     │
  │ Behavior      │    │ Instructions  │    │ Constraints   │
  │               │    │ Tasks         │    │               │
  └───────┬───────┘    └───────┬───────┘    └───────┬───────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   CONTEXT ASSEMBLER  │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     REASONING LLM    │
                    └──────────┬───────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                 ▼             ▼             ▼
            ┌─────────┐   ┌───────────┐   ┌───────────┐
            │ GitHub  │   │ Cloudflare│   │ Terminal  │
            └────┬────┘   └─────┬─────┘   └─────┬─────┘
                 │              │               │
                 └──────────────┼───────────────┘
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

LLM            = reasoning engine
```

---

# 2. What I Am Building

I want `krailo-brain` to provide six major capabilities:

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
configuration and documentation.

`krailo-brain` is not a nested repository and is not a second monorepo.

Its purpose is to provide the AI runtime layer for the ecosystem and for
future projects that need a persistent agent environment.

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
* implementation code;
* configuration;
* tests.

Each layer has a different responsibility.

The most important architectural rule is:

```text
PERSONALITY ≠ MEMORY ≠ PROJECT ≠ RUNTIME ≠ TOOL
```

This separation makes the system easier to reason about, debug, extend and
replace.

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

Defines the fundamental identity of the agent.

It should answer:

* What is this agent?
* What is its purpose?
* What kind of continuity should it maintain?
* What fundamental behavior should remain stable?

## `USER.md`

Defines the stable user profile.

This is not conversation history.

It contains information that should remain relevant across sessions.

## `PRINCIPLES.md`

Defines stable reasoning and operating principles.

These are rules that should not be recreated from memory every time the agent
starts.

## `BEHAVIOR.md`

Defines practical interaction behavior.

This includes communication style, decision boundaries, conflict handling,
uncertainty handling, and other behavioral rules.

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

Work that exists independently of the current conversation.

## Retrieval

The logic and infrastructure used to find relevant memories.

The memory layer should eventually support:

* relevance;
* deduplication;
* updates;
* supersession;
* provenance;
* expiration where appropriate;
* confidence.

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

Examples:

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

## `routing/`

Determines what the current request actually needs.

Examples:

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

Responsible for constructing the working context sent to the LLM.

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

What the project is, why it exists and what its boundaries are.

## `CURRENT_STATE.md`

What is happening right now.

This should be the fastest way for the runtime to understand current project
status.

## `ARCHITECTURE.md`

How the project is built.

## `DECISIONS.md`

Important architectural and operational decisions.

---

# 10. Project Knowledge vs. Project Code

This distinction is fundamental.

Actual source code remains in the real repository:

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

Tools represent capabilities.

A tool is something the runtime can explicitly invoke.

Examples:

```text
GitHub
  ├── inspect repository
  ├── inspect commits
  └── modify repository

Cloudflare
  ├── inspect resources
  ├── inspect deployment
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

The LLM should never receive unrestricted infrastructure access.

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
LLM abstraction
   │
   ├── Provider A
   ├── Provider B
   └── Provider C
```

The same principle applies to GitHub and Cloudflare.

---

# 13. `config/`

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
* schema definitions.

Secrets do not belong in Git.

---

# 14. `src/`

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

The architectural principle is:

```text
docs/
   ↓
defines architecture

src/
   ↓
implements architecture
```

---

# 15. `tests/`

```text
tests/
├── memory/
├── runtime/
├── tools/
└── integration/
```

Testing is divided according to architecture.

Eventually I want to test things such as:

```text
Memory retrieval
Memory updates
Memory supersession

Project reconstruction

Runtime state

Tool authorization

Execution recovery

End-to-end agent workflows
```

---

# 16. Cloudflare Runtime Model

The planned runtime is based around the Cloudflare ecosystem.

Conceptually:

```text
┌──────────────────────────────────────┐
│        Cloudflare Agent Runtime      │
├──────────────────────────────────────┤
│ Agent / Durable Object               │
│                                      │
│ Persistent State                     │
│ Sessions                             │
│ Scheduling                            │
│ Durable Execution                    │
│ Tool Calls                           │
│ Memory Retrieval                     │
└──────────────────────┬───────────────┘
                       │
                       ▼
                 Reasoning LLM
```

Cloudflare Agents already provide primitives for persistent agent state,
sessions, scheduling, execution and durable lifecycle management. The exact
Cloudflare service used underneath a specific subsystem may evolve without
changing the architecture of `krailo-brain`.

The architecture therefore depends on **capabilities**, not on one specific
Cloudflare product.

---

# 17. Memory Is Not Context

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
                  LLM
```

The context window is temporary.

Memory is persistent.

The runtime decides which memory is relevant enough to enter the current
working context.

This prevents the system from becoming dependent on increasingly large
historical conversations.

---

# 18. The Lifecycle of a Request

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
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Project        Memory         Tool
       Context        Recall         Need
          │             │             │
          └─────────────┼─────────────┘
                        │
                        ▼
                 ┌─────────────┐
                 │  ASSEMBLE   │
                 │   CONTEXT   │
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

The result of a conversation can therefore become durable state.

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

# 19. Source of Truth

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
```

I do not want one enormous "everything database".

Different information should have an appropriate source of truth.

If sources disagree, the runtime should detect and surface the conflict instead
of silently inventing an answer.

---

# 20. What `krailo-brain` Is Not

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
* a system where important architectural decisions exist only inside prompts.

---

# 21. Development Strategy

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
5. call a tool;
6. continue the same work in a later session.

Everything else should grow around that foundation.

---

# 22. Current Status

```text
[✓] Repository created
[✓] Architecture skeleton
[✓] Personality boundary
[✓] Memory boundary
[✓] Runtime boundary
[✓] Project model
[✓] Tool model
[✓] Integration model
[✓] Documentation structure

[ ] Agent runtime
[ ] Persistent state implementation
[ ] Memory implementation
[ ] Retrieval
[ ] Project loading
[ ] Context assembly
[ ] Tool execution
[ ] Durable execution
[ ] Security
[ ] Observability
[ ] Production deployment
```

---

# 23. Final Architectural Model

The final system should be understandable through one diagram:

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
                      │    REASONING LLM   │
                      └──────────┬──────────┘
                                 │
               ┌─────────────────┼─────────────────┐
               │                 │                 │
               ▼                 ▼                 ▼
         ┌──────────┐      ┌───────────┐     ┌───────────┐
         │  GitHub  │      │ Cloudflare│     │ Terminal  │
         └────┬─────┘      └─────┬─────┘     └─────┬─────┘
              │                  │                 │
              └──────────────────┼─────────────────┘
                                 │
                                 ▼
                        REAL ENVIRONMENT
```

The architectural division is intentionally simple:

```text
Personality → Who the agent is
Memory      → What the agent remembers
Projects    → What the agent understands about ongoing work
Runtime     → What the agent is doing
Tools       → What the agent can do
Integrations→ What external systems it can connect to
LLM         → How the agent reasons
```

That separation is the foundation of `krailo-brain`.

The goal is not to make one extremely large prompt.

The goal is to build a runtime where an AI system can maintain continuity,
recover relevant knowledge, understand long-running work, use tools and
continue operating as the system evolves.
