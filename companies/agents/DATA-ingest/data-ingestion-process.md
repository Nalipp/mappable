# Data Ingestion Workflow

## Purpose

This is a portable, Git-backed workflow for collecting public data across
multiple machines and AI providers. It preserves progress in files rather than
chat history.

Use these prompt conventions:

- `workflow status`
- `workflow next`

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

- dataset, constraint profile, phase, and progress
- last completed action and next bounded action
- recommended model capability and batch size
- planned retrieval method and whether Bright Data is available
- quality warnings, unresolved decisions, or setup gaps

Use capability classes, never fixed model names:

- `fast-low-cost`: routine extraction and clear validation
- `high-reasoning`: discovery, ambiguous decisions, and review
- `flagship`: workflow design, rubric changes, and final analysis

Tell the operator to select the matching current OpenAI or Anthropic model
before entering `workflow next`. Bright Data is a retrieval method, not a
model tier.

If no workflow state exists, report the required setup and wait for direction.

## workflow next

Before starting, verify the workflow state against the validation data.
Execute exactly one recorded action or batch. Update the working data and
workflow state together, then stop and report the next action.

For each rejected candidate, record the first failed constraint, source URL,
short evidence, and verification date. Candidate statuses are:

- `validated`
- `needs_verification`
- `rejected`

## Stages

1. Discovery: create a broad candidate list with minimal evidence.
2. Validation: process candidates in bounded batches and fail on the first
   decisive constraint failure. Once a company fails any constraint, stop all
   work on it, record the failure, and move on.
3. Review: resolve only ambiguous or low-confidence records.
4. Finalization: normalize validated records into the numbered dataset and
   matching schema.

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
