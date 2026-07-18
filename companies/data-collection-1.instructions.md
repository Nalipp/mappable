# Data Collection 1 Instructions

Act as the DATA-ingest agent for the Mappable companies prototype.

## Goal

Build an initial target list of Series B technology companies located in San Francisco city only, with active hiring signals for applied AI-related roles. The eventual dataset will support a static prototype focused on current AI-related job offerings and company office/work-location details.

## Scope constraints

- Include only technology companies with a physical office inside San Francisco city limits.
- Exclude companies based only in the greater Bay Area, South Bay, Peninsula, East Bay, or remote-only locations.
- Focus on companies at Series B stage.
- Companies must appear to be actively hiring for applied AI-related roles.
- Relevant job postings must be in-office or hybrid, not remote-only.
- The company itself does not need to be an "AI company" by product category, but the specific role must clearly involve AI, LLMs, agents, generative AI, AI infrastructure, AI product work, or applied AI delivery.

## Research approach

The numbered steps below describe the discovery search method (jobs-first,
because postings are the easiest broad signal to search). They are not the
validation order. Validation follows the fail-fast constraint order defined in
the ingestion workflow (`agents/DATA-ingest/data-ingestion-process.md`):
funding stage, then qualifying job and work mode, then SF address, then
geocode, then final validation.

1. Define a practical list of applied AI-related job titles to search for.
2. Search current job postings using those titles and adjacent title variants.
3. Identify companies with active postings tied to applied AI work.
4. Verify each company is Series B.
5. Verify each company has a physical San Francisco office.
6. Verify each relevant job posting is hybrid or in-office and tied to San Francisco city, not remote-only or broad "Bay Area" only.
7. Collect source-backed evidence for company stage, hiring status, AI role relevance, job title, work mode, and office/work location.

## Target applied AI job-title categories

- AI Engineer
- Applied AI Engineer
- LLM Engineer
- Generative AI Engineer
- Agentic AI Engineer
- MLOps Engineer
- AI Product Engineer
- AI Infrastructure Engineer
- Prompt Engineer
- Solutions Engineer, AI
- Forward Deployed Engineer, AI
- AI Product Manager
- Software Engineer, AI
- Software Engineer, Applied AI
- Backend Engineer, AI
- Backend Engineer, LLM
- Frontend Engineer, AI
- Full Stack Engineer, AI
- Product Engineer, AI
- Agent Engineer
- AI Agents Engineer
- Developer Experience Engineer, AI
- Platform Engineer, AI
- AI Solutions Architect
- Customer Engineer, AI
- Technical Product Manager, AI

## Constraint definitions

Apply these definitions during validation to keep results consistent:

- **Series B**: the company's latest disclosed funding round is Series B. A
  company that has since raised Series C or later fails. Series A or earlier
  fails. If the latest round is undisclosed or ambiguous, use
  `needs_verification`, not a guess.
- **Physical SF office**: a specific street address inside San Francisco city
  limits, confirmed by a primary source (company site, job posting, or
  official filing). A job board listing "San Francisco" as a hiring location
  is not sufficient on its own.
- **Active posting**: the posting is live on the company's own careers page
  (or its ATS, e.g. Greenhouse/Lever/Ashby) at verification time. A cached or
  aggregator-only listing does not count as active.
- **Work mode**: the posting must be hybrid or in-office and tied to San
  Francisco. Remote-only fails. Remote-with-optional-office fails. A posting
  listing SF among multiple cities passes only if SF attendance is an option
  under a hybrid or in-office arrangement.

## Record grain and fail-fast rule

The final dataset holds one record per validated company, with that company's
qualifying job postings nested inside the record (see
`data/mappable-records.schema.json`). Constraints are checked in the order
set by the ingestion workflow; the moment a company decisively fails any
constraint, stop all work on that company, record the failure and evidence in
`data/candidate-validation.json`, and move to the next candidate. Do not
collect job-level detail for a company that has not passed the checks that
come before it.

## Expected output

Discovery produces a broad, unverified candidate pool in `data/candidates.json`
(schema: `data/candidates.schema.json`). For each candidate, include:

- Company name
- Discovery signals as found in search results: funding hint, example AI-role
  posting title, and location hint (null when not found — a missing signal is
  allowed at this stage)
- Notes on ambiguities or known caveats worth checking during validation

Discovery signals are leads, not evidence. Full source-backed evidence —
source URLs, work mode, office address, funding confirmation — is collected
during validation and recorded in `data/candidate-validation.json`, which is
the source of truth for candidate status.

## Data quality requirements

These requirements apply to validation and finalized records, not to the
discovery pool:

- Prefer primary sources: company careers pages, company location pages, company funding announcements, and job posting pages.
- Use secondary sources only when primary sources are unavailable, and mark them clearly.
- Do not finalize a company record unless the evidence supports all required constraints.
- If evidence is ambiguous, mark the company `needs_verification` in `data/candidate-validation.json` rather than validating or rejecting it.
- Prepare findings so they can later be shaped into local `.json` plus matching `.schema.json` files for the static prototype.
