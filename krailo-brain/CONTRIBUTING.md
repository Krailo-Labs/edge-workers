# Contributing

`krailo-brain` is developed inside the Krailo Labs `edge-workers`
repository.

## Before Making Changes

Read:

* `README.md`
* `docs/ARCHITECTURE.md`
* `docs/ROADMAP.md`
* relevant project documentation

The architecture is intentionally separated into:

* personality;
* memory;
* runtime;
* projects;
* tools;
* integrations.

Keep these boundaries clear.

## Changes

Prefer small, focused changes.

Do not introduce a new subsystem when an existing runtime layer already owns
the responsibility.

Architectural changes should be documented before or together with the
implementation.

## Memory

Do not store secrets or private credentials as persistent agent memory.

Durable memory should represent meaningful facts, decisions, events,
instructions, or tasks rather than indiscriminately storing raw conversation
history.

## Projects

Project knowledge belongs under `projects/`.

Actual source code remains in its source repository.

Do not copy complete repositories into `projects/`.

## Pull Requests

A pull request should explain:

* what changed;
* why it changed;
* affected architecture;
* testing performed;
* any migration or compatibility concerns.

## Current Development Stage

The project is currently in the foundation / architecture stage.

Breaking architectural changes are acceptable while the core runtime is still
being established, but they should be documented clearly.
