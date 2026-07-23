# Mappable Base Data Starter

This starter extends the lightweight Mappable prototype base with a durable
data-ingestion loop. It turns public research into a local, schema-backed
dataset without adding a database, server, build step, or runtime dependency.

## Open the library map

Open `HTML/shadcn/index.html` directly in a browser. The prototype plots the 30
largest U.S. central public-library buildings by reported FY 2024 floor area
and synchronizes map markers with the sortable ranked list and full record
detail views.

The canonical records remain in `data/mappable-records1.json`, with their
contract in `data/mappable-records1.schema.json`. `HTML/shadcn/libraries-data.js`
is a generated browser-ready snapshot of those records so the prototype works
from `file://` without a server or runtime data request; do not edit it by hand.
Regenerate it with `node scripts/build-browser-data.mjs` after changing the
canonical records.
The MapLibre 5.24.0 renderer is bundled locally under `HTML/shadcn/vendor/`.
The geographically accurate OpenFreeMap Liberty basemap requires internet
access for its remote style and tiles and retains visible map attribution.

## Start a dataset run

1. Copy `data-collection-template.instructions.md` to
   `data-collection-1.instructions.md` and define the target, constraints, and
   validation order.
2. Set that profile and the new output name (for example,
   `mappable-records1.json`) in `data/workflow-state.json`.
3. Run `workflow discover`, `workflow validate`, and `workflow finalize` with
   the DATA-ingest agent. The command details and ownership rules are in
   `agents/DATA-ingest/data-ingestion-process.md`.
4. Hand the finalized `data/mappable-recordsN.json` and matching schema to the
   BUILD-ui agent.

`candidates.json` holds leads, `candidate-validation.json` holds the evidence
and decision record, and numbered record files hold UI-ready data. Do not use
an empty `mappable-records.json` as a live run; numbered datasets make each
run reproducible and prevent accidental overwrite.
