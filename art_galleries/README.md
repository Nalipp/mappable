# Mappable: United States Art Museums

A static, map-first prototype for exploring 30 renowned art museums and
independently visited museum campuses across the United States.

## Open the prototype

Open `HTML/shadcn/index.html` directly in a browser. No install, server, package
manager, or build step is required.

The ranked list, filters, and museum profiles work from local files. The real
basemap uses the keyless OpenFreeMap Liberty style and therefore needs an
internet connection for map style and tile requests. MapLibre itself is
vendored locally under `HTML/shadcn/vendor/` with its license.

## Data flow

- `data/mappable-records1.json` is the finalized source of truth.
- `data/mappable-records1.schema.json` defines its shape.
- `HTML/shadcn/data.js` is a generated copy used only so the prototype remains
  compatible with `file://` browser security rules.
- `HTML/shadcn/app.js` renders the ranked list, filters, markers, and profiles.

After changing the finalized JSON, regenerate the browser data bundle from the
project root:

```sh
node -e 'const fs=require("fs");const records=JSON.parse(fs.readFileSync("data/mappable-records1.json","utf8"));fs.writeFileSync("HTML/shadcn/data.js","/* Generated from ../../data/mappable-records1.json for file:// compatibility. */\nwindow.ART_GALLERIES = "+JSON.stringify(records,null,2)+";\n");'
```

The ranking methodology and validation rules are documented in
`data-collection-1.instructions.md`.
