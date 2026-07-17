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
- No HTTP requests from the prototype.
- No Python server, Node server, dev server, or local API.
- No frameworks, package managers, build steps, or external libraries.
- Use vanilla JavaScript only when needed for interaction or rendering local JSON data.
- Preserve `file://` compatibility as a first-class constraint.

## Agent Workflow

1. Data agent researches the target domain or dataset.
2. Data agent writes structured `.json` data and a matching `.schema.json` contract.
3. Build agent reads those local files and renders the prototype with static HTML, CSS, and vanilla JavaScript.
4. BRAIN-lead coordinates scope, checks that data shapes and UI needs align, and keeps the architecture lightweight.

## Success Criteria

- A prototype can be opened directly as a local HTML file.
- Data assumptions are visible in schema files instead of hidden in rendering code.
- UI work is decoupled from data collection, but both use the same local data contract.
- Changes stay small, reversible, and appropriate for rapid prototyping.
