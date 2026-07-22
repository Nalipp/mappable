# Mappable Project Charter

Mappable is a fast static prototype system driven by agent-collected data. The goal is to move quickly from public web research to browsable product prototypes without introducing production infrastructure.

## Prototype Model

- Data agents collect public web data directly or through the Bright Data MCP connection.
- Collected data is shaped into local `.json` files.
- Every `.json` data file must have a corresponding `.schema.json` file that defines the expected data shape.
- Build agents hydrate static HTML from those local data files.
- The prototype runs from local files using `.html`, `.css`, `.js`, `.json`, and `.schema.json`.

## Architecture Rules

- No database.
- No application-data HTTP requests from the prototype. The sole runtime
  network exception is the keyless OpenFreeMap Liberty basemap style and its
  tiles, loaded by the approved vendored MapLibre renderer.
- No Python server, Node server, dev server, or local API.
- No frameworks, package managers, or build steps. MapLibre GL JS 5.24.0 may
  be vendored under `HTML/shadcn/vendor/` as the only approved UI library;
  preserve its license and do not load it from a CDN.
- Use vanilla JavaScript only when needed for interaction or rendering local JSON data.
- Preserve `file://` compatibility as a first-class constraint. Local HTML,
  application data, MapLibre code, and CSS must load without a server; an
  internet connection is required only for the remote basemap style and tiles.

## Agent Workflow

1. BRAIN-lead defines a dataset profile with scope and validation rules.
2. Data agent discovers leads, validates them with source-backed evidence, and finalizes a numbered local dataset.
3. Every working and finalized `.json` file has a matching `.schema.json` contract.
4. Build agent reads the finalized local files and renders the prototype with static HTML, CSS, and vanilla JavaScript.
5. BRAIN-lead coordinates scope, checks that data shapes and UI needs align, and keeps the architecture lightweight.

For the detailed ingestion lifecycle, file ownership, and handoff rules, use
`agents/DATA-ingest/data-ingestion-process.md`.

## Success Criteria

- A prototype can be opened directly as a local HTML file.
- Data assumptions are visible in schema files instead of hidden in rendering code.
- UI work is decoupled from data collection, but both use the same local data contract.
- Changes stay small, reversible, and appropriate for rapid prototyping.
