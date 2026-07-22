# Mappable Base Data Starter

This starter extends the lightweight Mappable prototype base with a durable
data-ingestion loop. It turns public research into a local, schema-backed
dataset without adding a database, server, build step, or runtime dependency.

## Map implementation

The starter includes a locally vendored MapLibre GL JS 5.24.0 browser
distribution under `HTML/shadcn/vendor/`. Build agents must use it with the
keyless OpenFreeMap Liberty style instead of creating synthetic CSS/SVG maps or
hand-positioned markers. Finalized records supply numeric longitude/latitude;
the map renders one accessible marker per record and fits the initial viewport
to those coordinates.

The page still opens directly from `file://`. Local HTML, data, MapLibre code,
and CSS do not need a server, but the OpenFreeMap style and tiles require an
internet connection. Preserve visible OpenMapTiles/OpenStreetMap attribution
and the bundled MapLibre BSD license.

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
