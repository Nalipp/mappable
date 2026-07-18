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
- `data/workflow-state.json`: current phase, progress, and next action
- `data/candidates.json`: broad discovery list with unverified signals (schema: `candidates.schema.json`)
- `data/candidate-validation.json`: item-level statuses, evidence, and dates
- `data/record-index.txt`: completed datasets, their constraint profiles, and
  the `highest_id_ever_issued` counter for record IDs (only increases; a new
  record takes counter + 1, and IDs are never reused even after deletion)

Every `.json` working file has a matching `.schema.json` contract in `data/`.
Validate against it whenever the file is updated.

The validation file is the source of truth. The workflow state is a small
cursor that must be checked against it before work resumes.

## workflow status

Read the project charter, DATA-ingest instructions, active constraint file,
workflow state, and referenced working data. Do not collect data or modify
files.

Report:

- dataset, constraint profile, phase, and progress (pending, validated, rejected, needs_verification)
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
Append new companies to `data/candidates.json` (do not remove existing candidates).
Update metadata (`generated_at`, candidate count) and `workflow-state.json` progress.
Stop and report newly added candidates and total candidate count.

## workflow validate

Before starting, verify the workflow state against the validation data.
Execute exactly one validation batch (default: 5 candidates per batch).
For each candidate, check constraints in fail-fast order; record evidence with
source URLs in `data/candidate-validation.json`. Update workflow-state.json with
results and stop.

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

Normalize all `validated` candidates into the numbered dataset (`mappable-records.json`).
For each company: assign a record ID, nest qualifying job postings, add geocode
metadata, validate against `mappable-records.schema.json`. Update `record-index.txt`
with the completed dataset ID and highest record ID issued. Stop and report
finalized record count and any records that failed schema validation.

## Stages (tied to commands)

1. **`workflow discover`** — create a broad candidate list with minimal evidence. Run multiple times to expand pool before validation.
2. **`workflow validate`** — process candidates in bounded batches, fail on first decisive constraint failure. Once a company fails any constraint, stop all work on it, record the failure, and move on. Results: `validated`, `rejected`, or `needs_verification`.
3. **`workflow finalize`** — normalize validated records into the numbered dataset and matching schema.

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

Record in the finalized record's `location.geocode`: the method used, the
precision, and the lookup date. Precision comes from the geocoder's match
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

Do not assume Bright Data tools, datasets, or credentials are available. If a
recommended tool is unavailable, report the blocker and the fallback method.

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
decision in the workflow state. Do not resume through `workflow next` while
operator review is required.

Normal candidate rejection is not a quality warning.

## Multi-Machine Handoff

The operator performs all Git actions: pull, commit, push, merge, and conflict
resolution. Agents must not perform Git operations unless explicitly asked.

After the operator synchronizes a machine, run `workflow status`, choose the
recommended model if needed, then run `workflow next`. Initially, only one
machine should modify a dataset at a time. Parallel work requires the operator
to assign non-overlapping batches.

## Simplicity Rule

Do not add a database, API pipeline, scheduler, locking service, or custom
orchestrator until this file-based process proves insufficient.
