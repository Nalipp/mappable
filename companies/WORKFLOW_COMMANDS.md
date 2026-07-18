# Workflow Commands Reference

This document defines the formal commands for the data ingestion workflow. Use these instead of generic prompts.

## Commands

### `workflow status`

**Purpose:** Check current state without making changes.

**Does:**
- Reads workflow state, progress, and data files
- Reports progress with counts derived from candidates.json and
  candidate-validation.json (a name with no validation entry is pending)
- Recommends model capability for next phase
- Identifies quality warnings or setup gaps
- Suggests which workflow command to run next

**Output:** Status report with:
- Dataset and constraint profile
- Progress (pending, validated, rejected, needs_verification counts)
- Last completed action
- Next recommended command
- Model capability class (fast-low-cost, high-reasoning, or flagship)
- Quality warnings (if any)

**Example:**
```
workflow status
```

---

### `workflow discover`

**Purpose:** Search for additional companies and expand the candidate pool.

**Does:**
- Runs job title searches and web research (via Bright Data or native)
- Identifies new Series B companies with applied-AI hiring signals
- Skips companies already present in candidates.json or
  candidate-validation.json (case-insensitive name match)
- Appends new company names to `data/candidates.json`
- Updates only `metadata.generated_at`; never writes run/wave history into
  metadata (each run is stateless — no wave numbers)
- Writes no other file (workflow-state.json is owned by validate/finalize), so
  it is safe to run alongside a validation session
- Reports newly added companies and total candidate pool size

**Input:** None required (uses active constraint profile: `data-collection-1.instructions.md`)

**Output:** Summary of:
- Number of new companies found
- List of newly added company names
- Total candidates now in pool
- Recommended next step (discover again, or move to validate)

**Example:**
```
workflow discover
```

---

### `workflow validate`

**Purpose:** Verify candidates against constraints. Run once per batch (default: 5 companies per batch).

**Does:**
- Selects the next batch by derived status: the first 5 names in
  candidates.json order with no entry in candidate-validation.json
- Never writes to candidates.json (owned by discover)
- Checks constraints in order:
  1. Series B funding stage
  2. Active qualifying applied-AI job posting
  3. Hybrid or in-office SF work mode
  4. Physical SF street address
  5. Geocode validation
- Records evidence, source URLs, and verification date
- Updates `data/candidate-validation.json` with results
- Updates `workflow-state.json` with batch results and progress
- Stops after one batch

**Candidate outcome statuses:**
- `validated` — passed all constraints
- `needs_verification` — evidence ambiguous, needs human review
- `rejected` — failed a constraint decisively

**Output:** Summary of:
- Batch number and company count
- Per-company results (validated, rejected, or needs_verification)
- Evidence snippets and source URLs
- Recommendations for rejected companies (why they failed)
- Next batch preview

**Example:**
```
workflow validate
```

---

### `workflow finalize`

**Purpose:** Normalize validated candidates into the final numbered dataset.

**Does:**
- Reads all `validated` records from candidate-validation.json
- For each validated company:
  - Nests qualifying job postings
  - Copies the already-recorded geocode metadata (lat, lon, precision, method, date)
  - Validates against the matching numbered schema
- Writes finalized records to the numbered dataset named in `workflow-state.json`
- Updates `record-index.txt` with the dataset status and finalized date
- Reports any schema validation failures

**Boundary:** This is a local-only transformation. It must not browse, scrape,
use Bright Data or another MCP, geocode, or re-validate companies. Missing
final-record fields are reported as incomplete validation data, not fetched
during finalization.

**Output:** Summary of:
- Records finalized
- Finalized dataset filename
- Schema validation results
- Ready for prototype build

**Example:**
```
workflow finalize
```

---

## Workflow Phases

The three phases are tied to commands:

1. **Discovery** (`workflow discover`) — Search for companies, expand candidate pool. Can run multiple times before validation.
2. **Validation** (`workflow validate`) — Verify candidates in batches, fail-fast. Record evidence (validated, rejected, or needs_verification).
3. **Finalization** (`workflow finalize`) — Normalize validated records into dataset.

Discovery and validation may run in parallel sessions — each writes different
files. Never run two sessions of the same command at once.

## Typical Workflow

```
workflow status                  # Check state
workflow discover                # Expand candidate pool (optional, can repeat)
workflow discover                # More discovery (optional)
workflow status                  # Ready to validate?
workflow validate                # Batch 1 (5 companies)
workflow validate                # Batch 2 (5 companies)
...
workflow status                  # All validated? Ready to finalize?
workflow finalize                # Normalize into dataset
```

## Key Files

- `data-collection-1.instructions.md` — Active constraints and rubric
- `data/workflow-state.json` — Phase, progress, and next action
- `data/candidates.json` — Candidate company names (discovery pool)
- `data/candidate-validation.json` — Validation evidence, results, and statuses (source of truth)
- `data/mappable-records1.json` — Current final normalized dataset
- `data/record-index.txt` — Dataset registry and constraint-profile summary
