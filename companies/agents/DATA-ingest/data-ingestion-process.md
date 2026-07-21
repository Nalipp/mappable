# Data Ingestion Workflow

## Purpose

This is a portable, Git-backed workflow for collecting public data across
multiple machines and AI providers. It preserves progress in files rather than
chat history.

Use these prompt conventions:

- `workflow status` — read current state, progress, and next action (no modifications)
- `workflow discover` — search for more companies and append to `candidates.json` (discovery phase)
- `workflow validate` — verify candidates against constraints and record evidence in `candidate-validation.json` (validation phase)
- `workflow finalize` — normalize validated records into the numbered dataset (finalization phase)

They are plain-language triggers, not provider-specific slash commands.

## Files

- `data-collection-N.instructions.md`: active constraints and validation rubric
- `data/workflow-state.json`: progress snapshot and next action (there is no
  single "phase" — discovery and validation may run at the same time)
- `data/candidates.json`: broad discovery list with unverified signals (schema: `candidates.schema.json`)
- `data/candidate-validation.json`: item-level statuses, evidence, and dates
- `data/record-index.txt`: registry of completed and in-progress datasets and
  their constraint profiles

Every `.json` working file has a matching `.schema.json` contract in `data/`.
Validate against it whenever the file is updated.

The validation file is the source of truth. The workflow state is a small
cursor that must be checked against it before work resumes.

## File Ownership and Derived Status

Each working file has exactly one writer, so `workflow discover` and
`workflow validate` can run in parallel sessions without coordination:

- `workflow discover` writes only `candidates.json` (append-only).
- `workflow validate` writes `candidate-validation.json` and
  `workflow-state.json`.
- `workflow finalize` writes the numbered dataset, `record-index.txt`, and
  `workflow-state.json`.

Never run two sessions of the same command at once: at most one `workflow
validate` (or `finalize`) session and one `workflow discover` session may
exist at a time.

A candidate's status is never stored in `candidates.json`. It is derived:

- **pending**: the name appears in `candidates.json` but has no entry in
  `candidate-validation.json`
- otherwise: the status recorded in the candidate's
  `candidate-validation.json` entry

Compute this set difference fresh at the start of every validation batch and
every status report. Do not cache it, store it, or add a sync step.

## Dataset Runs

Each constraint-driven ingestion run creates its own numbered dataset pair:

- `mappable-records1.json`
- `mappable-records1.schema.json`

The number identifies the dataset run, not a company record. Different runs
may have different constraints and schemas, and their datasets coexist. Never
overwrite an existing numbered dataset when starting a new run. The active
target dataset is named in `workflow-state.json`; `record-index.txt` records
each dataset, its schema, constraint profile, and status.

## workflow status

Read the project charter, DATA-ingest instructions, active constraint file,
workflow state, and referenced working data. Do not collect data or modify
files.

Report:

- dataset, constraint profile, and progress (pending, validated, rejected, needs_verification) — count these from `candidates.json` and `candidate-validation.json` directly; the snapshot in `workflow-state.json` may lag a parallel session
- last completed action
- recommended model capability for the next phase
- planned retrieval method and whether Bright Data is available
- quality warnings, unresolved decisions, or setup gaps
- which command to run next: `workflow discover`, `workflow validate`, or `workflow finalize`

Use capability classes, never fixed model names:

- `fast-low-cost`: routine extraction and clear validation (e.g., `workflow validate` with strong evidence)
- `high-reasoning`: discovery and complex validation decisions (e.g., `workflow discover` with complex searches, `workflow validate` with edge cases)
- `flagship`: workflow design, rubric changes, and final analysis

Tell the operator to select the matching current Claude/OpenAI model
before entering the next `workflow` command. Bright Data is a retrieval method, not a
model tier.

If no workflow state exists, report the required setup and wait for direction.

## workflow discover

Search for additional companies using applied-AI job titles and adjacent queries.

Every discovery run is stateless. There are no wave or run numbers, and no run
history is stored in any file — do not try to reconstruct how many runs came
before, and do not write run history into `metadata.source` or anywhere else.
The only state that matters is the set of names already collected.

Rules for a run:

1. Before appending, build the set of existing names from `candidates.json`
   and `candidate-validation.json`. Skip any company already present
   (case-insensitive name match).
2. Append new unique companies to `data/candidates.json`; never remove or
   rewrite existing entries.
3. Update only `metadata.generated_at` (date of this append). Leave
   `metadata.source` unchanged — it is a fixed description of the method, not
   a log.
4. Do not modify `workflow-state.json` or any other file — a parallel
   validation session may own them.
5. Stop and report the newly added names and new total in chat. The chat
   report is informational only; no later session should depend on it.

## workflow validate

Before starting, verify the workflow state against the validation data.
Select exactly one batch by derived status: the first 5 names (default batch
size) in `data/candidates.json` order that have no entry in
`data/candidate-validation.json`. A parallel discovery session may append to
`candidates.json` at any time; never write to that file.
For each candidate, check constraints in fail-fast order; record evidence with
source URLs in `data/candidate-validation.json`. Update workflow-state.json with
results and stop.

For every `validated` candidate, capture the complete facts needed by the
numbered dataset while performing validation: qualifying job details, confirmed
SF address, and geocode result (coordinates, precision, method, and lookup
date), as well as the funding facts and their source URLs. Validation is the
only workflow command permitted to perform external research, scraping, or
geocoding for candidate data.

For each result, record:
- First failed constraint (if rejected)
- Source URL(s)
- Short evidence snippet
- Verification date

Candidate statuses are:

- `validated` — passed all constraints
- `needs_verification` — evidence ambiguous or inconclusive
- `rejected` — failed a constraint decisively

## workflow finalize

Normalize all `validated` candidates into the active numbered dataset named in
`workflow-state.json` (currently `mappable-records1.json`).
This is a local-only transformation: read the recorded validation facts, nest
qualifying job postings, map recorded geocode metadata, and validate against
the matching numbered schema. It must not browse, search, scrape, call an MCP,
call a geocoder, or re-verify any company. If a validated entry lacks a field
required by the numbered schema, leave it out of the finalized dataset and
report the missing validation data; do not retrieve it during finalization.
Update
`record-index.txt` with the dataset status and finalized date. Stop and report
finalized record count and any records that failed schema validation.

## Stages (tied to commands)

1. **`workflow discover`** — create a broad candidate list with minimal evidence. Run multiple times to expand pool before validation.
2. **`workflow validate`** — process candidates in bounded batches, fail on first decisive constraint failure. Once a company fails any constraint, stop all work on it, record the failure, and move on. Results: `validated`, `rejected`, or `needs_verification`.
3. **`workflow finalize`** — perform a local-only normalization of validated records into the numbered dataset and matching schema; it never performs research or geocoding.

The record grain is the company: one finalized record per validated company,
with its qualifying job postings nested inside that record. Jobs are never
their own records, and job-level work happens only for companies that have
passed every company-level constraint checked so far.

The active constraint file controls validation order. For the current company
profile, the default order is:

1. Required funding stage
2. Active qualifying job and SF work arrangement, from the same posting where
   possible
3. Physical San Francisco street address
4. Immediate geocoding of the confirmed address (see Geocoding)
5. Final evidence and schema validation

## Geocoding

Coordinates come from looking up the confirmed street address, never from
model memory or estimation. Default method: query OpenStreetMap Nominatim
(`nominatim.openstreetmap.org/search`) with the full street address.

Nominatim usage must follow the OSMF usage policy
(https://operations.osmfoundation.org/policies/nominatim/):

- Send an identifiable User-Agent that names this project.
- No more than one request per second, from one machine.
- Cache results locally; never re-geocode an address already recorded.
- Attribute the data to OpenStreetMap (ODbL) wherever coordinates are shown.

Do not use Bright Data or any proxy to route around a Nominatim block. If
Nominatim is unavailable or blocks the request, fall back to the US Census
geocoder (`geocoding.geo.census.gov`) or send the candidate to
`needs_verification` with the attempted query recorded.

Record the geocode result during validation so it can be copied into the
finalized record's `location.geocode`: the method used, the precision, and the
lookup date. Precision comes from the geocoder's match
type: a building or house-number match is `rooftop`, a road or interpolated
match is `street`, anything coarser is `neighborhood`.

Sanity bounds, enforced by the dataset schema: latitude 37.70 to 37.84,
longitude -122.53 to -122.35. A result outside these bounds, an ambiguous
match, or a failed lookup sends the candidate to `needs_verification` with
the attempted query recorded; do not guess or substitute a city-center
coordinate.

## Retrieval Rules

Select retrieval according to the active instructions and report the choice in
`workflow status`:

- Native web research: small batches, source finding, and disambiguation
- Bright Data: available structured sources, repeated retrieval, JavaScript-
  heavy pages, blocked pages, or larger batches
- Model reasoning: extract and interpret facts after content is retrieved

Do not assume Bright Data tools, datasets, or credentials are available.

Retrieval preflight and no silent fallback:

- In its first report, every workflow command must state which retrieval
  method it will use and why (per the rules above).
- If Bright Data is the selected method, confirm it before relying on it:
  load the tools and make one minimal test call (e.g. a single
  `search_engine` query). Report the result as "Bright Data: available" or
  "Bright Data: unavailable — <error>".
- Never switch retrieval methods silently. Any fallback — tool missing, call
  erroring, or the operator denying permission — must be announced with the
  reason before continuing, so the operator can troubleshoot the connection
  instead of discovering the substitution later.

## Quality Control

The agent may detect quality problems but must not correct them automatically.
Warnings include repeated retrieval failures, conflicting sources, unusually
high `needs_verification` results, inconsistent classification, incomplete
records, or an uncovered rubric case.

When a warning occurs:

1. Stop at a safe checkpoint and preserve completed work.
2. Set `quality.status` to `operator_review_required` in the workflow state.
3. Report the evidence, affected records, likely cause, and recommended
   options.
4. Wait for an explicit operator decision.

The operator may approve a smaller batch, a different model capability, Bright
Data retrieval, a retry, or a constraint clarification. Record the approved
decision in the workflow state. Do not run another workflow command while
operator review is required.

Normal candidate rejection is not a quality warning.

## Multi-Machine Handoff

The operator performs all Git actions: pull, commit, push, merge, and conflict
resolution. Agents must not perform Git operations unless explicitly asked.

After the operator synchronizes a machine, run `workflow status`, choose the
recommended model if needed, then run the command named by the status report.
Across machines, only one
machine should modify a dataset at a time. Within one machine, parallel
sessions must follow the File Ownership rules above.

## Simplicity Rule

Do not add a database, API pipeline, scheduler, locking service, or custom
orchestrator until this file-based process proves insufficient.
