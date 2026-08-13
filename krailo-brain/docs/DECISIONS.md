# Architectural Decisions

This document contains decisions that affect the overall architecture of
`krailo-brain`.

Project-specific decisions belong in:

```text
projects/<project>/DECISIONS.md
```

## ADR-0001 — Separate Runtime from Memory

**Status:** Accepted

Memory must remain independent from the current context window.

The runtime decides which long-term information is relevant to the current
task and provides only the required context to the reasoning model.

## ADR-0002 — Projects Are Knowledge, Not Source Code

**Status:** Accepted

The `projects/` directory stores durable project knowledge such as:

* purpose;
* current state;
* architecture;
* decisions.

Actual source code remains in its source repository.

## ADR-0003 — Personality Is Separate from Memory

**Status:** Accepted

Stable identity and behavioral rules belong under `personality/`.

They must not be mixed with dynamically changing memories.

## ADR-0004 — Provider Independence

**Status:** Accepted

The runtime should avoid unnecessary coupling to one LLM provider or one
external platform implementation.

Provider-specific code belongs under `integrations/`.

## ADR-0005 — Tools Are Explicit Capabilities

**Status:** Accepted

External actions are exposed through explicit tools rather than unrestricted
model access.

This allows authentication, authorization, validation, auditing and approval
policies to be introduced independently.
