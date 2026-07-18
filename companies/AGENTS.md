# Mappable — companies data ingestion

This directory is the Mappable "companies" prototype: a file-based pipeline
that turns public web research into local JSON datasets for a map UI.

## Workflow commands

When the operator types one of these as a plain message (they are not slash
commands), execute the matching procedure from
`agents/DATA-ingest/data-ingestion-process.md`:

- `workflow status` — report state; modify nothing
- `workflow discover` — append new candidate companies to `data/candidates.json`
- `workflow validate` — verify one batch, record evidence in `data/candidate-validation.json`
- `workflow finalize` — normalize validated companies into the active numbered dataset

Read these before executing any workflow command:

1. `agents/DATA-ingest/data-ingestion-process.md` — authoritative process,
   including the File Ownership and Derived Status rules
2. `data-collection-1.instructions.md` — active constraint profile and rubric
3. `data/workflow-state.json` — current cursor and next action

`WORKFLOW_COMMANDS.md` is a quick reference for the same commands.

## Non-negotiable rules

- Every `data/*.json` file has a matching `.schema.json`; validate after
  every write.
- `data/candidate-validation.json` is the source of truth for candidate
  status. A name in `candidates.json` with no entry there is pending —
  status is derived, never stored in `candidates.json`.
- Respect file ownership (one writer per file; see the process doc).
  Parallel sessions depend on it.
- Discovery runs are stateless: no wave/run numbers, no run history in files.
- The operator performs all git operations. Never run git commands unless
  explicitly asked.
- State your retrieval method (Bright Data vs native web research) in your
  first report, and never switch methods silently — announce any fallback
  and its reason (see Retrieval Rules in the process doc).
- Bright Data MCP usage: see `agents/DATA-ingest/base-instructions.md`.
