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

## Expected output

Create a reviewed shortlist of candidate companies before collecting full job-level data. For each candidate, include:

- Company name
- Role category or AI hiring signal
- Funding stage evidence
- San Francisco office evidence
- Hiring evidence
- Example AI-related job posting title
- Work mode: in-office or hybrid
- Job/work location
- Source URLs
- Confidence level
- Notes or unresolved validation questions

## Data quality requirements

- Prefer primary sources: company careers pages, company location pages, company funding announcements, and job posting pages.
- Use secondary sources only when primary sources are unavailable, and mark them clearly.
- Do not include companies unless the evidence supports all required constraints.
- If evidence is ambiguous, keep the company in a "needs verification" bucket rather than the final shortlist.
- Prepare findings so they can later be shaped into local `.json` plus matching `.schema.json` files for the static prototype.
