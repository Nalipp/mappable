# Data Ingestion Workflow

## Purpose

This is a portable, file-backed workflow for converting public research into
local prototype data. It retains progress outside chat history and keeps raw
leads, evidence-based decisions, and UI-ready records separate.

Use these plain-language commands:

- `workflow status` — inspect state and recommend the next command; do not modify files.
- `workflow discover` — append new leads to `data/candidates.json`.
- `workflow validate` — check a bounded batch against the active profile and record evidence.
- `workflow finalize` — locally normalize validated entries into the active numbered dataset.

## Files and authority

| File | Purpose | Writer |
| --- | --- | --- |
| `data-collection-N.instructions.md` | Scope, constraints, and validation order | Operator / BRAIN-lead |
| `data/candidates.json` | Append-only, unverified discovery leads | `workflow discover` |
| `data/candidate-validation.json` | Evidence and final validation status; source of truth | `workflow validate` |
| `data/workflow-state.json` | Small progress cursor and active output target | `workflow validate`, `workflow finalize` |
| `data/mappable-recordsN.json` | Final UI-ready records | `workflow finalize` |
| `data/record-index.txt` | Registry of numbered dataset runs | `workflow finalize` |

Every JSON file has a same-named `.schema.json` contract. Validate the changed
file against its contract before handing it off. The validation file wins if
its counts disagree with `workflow-state.json`.

## Status and concurrency

A candidate's status is derived, not written into `candidates.json`:

- `pending`: no matching validation entry
- `validated`, `needs_verification`, or `rejected`: the matching validation entry's status

One discovery session and one validation session may run in parallel because
they own different files. Never run two sessions of the same workflow command
at once. Finalization must run alone: it reads validation output and writes the
dataset registry and workflow state.

Match candidates by case-insensitive name unless the active profile supplies a
more reliable stable identifier. Do not duplicate a candidate already present
in either working file.

## workflow status

Read the charter, this workflow, the active profile, workflow state, and all
referenced data files. Count statuses directly from the candidate and
validation files. Report the active dataset, profile, counts, next bounded
action, retrieval method, and any quality warning. Do not research or write.

If no active profile or state exists, report the missing setup rather than
inventing scope.

## workflow discover

1. Read the active profile and build a case-insensitive set of existing names.
2. Retrieve only enough public material to identify promising leads.
3. Append unique leads with weak signals and caveats to `candidates.json`.
4. Update only `metadata.generated_at`; leave `metadata.source` as a stable
   method description, not a run log.
5. Do not set status, validate, update workflow state, or write final records.

Discovery signals are leads, not evidence. Null signals are allowed when the
lead is worth checking but a signal was not available.

## workflow validate

1. Recompute pending candidates and select the first five in discovery order,
   unless the operator requests another bounded batch size.
2. Check constraints in the exact order set by the active profile.
3. Stop research on a candidate at its first decisive failure. Record that
   check, its URL, a short evidence summary, and the date as `rejected`.
4. If evidence is ambiguous or a required source cannot be retrieved, record
   the attempted retrieval and use `needs_verification`; never guess.
5. For a passing candidate, capture every fact the final record schema needs,
   including source URLs and verification dates.
6. Write `candidate-validation.json` and refresh `workflow-state.json`.

Use primary sources when possible. A source URL and a concise evidence summary
are required for each pass or fail. Record external lookups (such as geocodes)
at validation time so finalization remains local-only.

## workflow finalize

Finalization is a local transformation only. It must not search, scrape,
geocode, call MCP tools, or re-check evidence.

1. Read validated entries and their captured facts.
2. Normalize complete entries into the dataset named in workflow state.
3. Exclude entries missing a required output field and report the gap.
4. Validate the numbered output against its matching schema.
5. Update `record-index.txt` and workflow state with the final count and date.

Each numbered dataset is a separate run. Never overwrite an existing numbered
dataset; increment the run number and register the new profile instead.

## Retrieval and quality rules

Choose the lightest effective retrieval method: native web research for small
batches and disambiguation; Bright Data for repeated, JavaScript-heavy, or
blocked public pages. Announce the method before using it. If Bright Data is
chosen, confirm the tools are available with one minimal call; report any
fallback instead of switching silently.

Do not treat a search snippet as final evidence. Do not bypass access controls,
invent unavailable facts, or copy unverified data into the final dataset.
