# BUILD-ui Context

Build Mappable as a lightweight static prototype.

Project source of truth:
- Use `../../PROJECT_CHARTER.md` for the shared prototype model, architecture rules, data contract, and agent workflow.

Core build rules:
- Use plain HTML and CSS.
- Use vanilla JavaScript only when interaction or data rendering requires it.
- Use local `.json` files as the data source and respect their corresponding `.schema.json` contracts.
- Keep prototypes runnable directly from `file://`.
- Do not add a framework, build step, server, router, package manager, or
  dependency. The approved exception is the locally vendored MapLibre GL JS
  5.24.0 browser distribution.
- Do not make application-data HTTP requests. The approved map may request the
  keyless OpenFreeMap Liberty style and tiles at runtime.
- Keep each prototype focused on demonstrating the product idea, not building production infrastructure.

Map implementation:
- Use the vendored files under `HTML/shadcn/vendor/maplibre-gl-5.24.0/`; never
  load MapLibre itself from a CDN, and preserve its BSD license text.
- Use `https://tiles.openfreemap.org/styles/liberty` as the default keyless
  basemap and retain visible OpenMapTiles/OpenStreetMap attribution.
- Create one accessible MapLibre marker from each finalized record's numeric
  longitude/latitude and fit the viewport to the resulting bounds.
- Keep map selection synchronized with the result list and expose a clear
  loading, loaded, or unavailable status.
- Do not substitute a synthetic CSS/SVG map, hand-positioned markers, or a
  different map provider unless the operator explicitly changes the strategy.
- The page must still open from `file://`; document that the real basemap needs
  internet access for its remote style and tiles.

Design guidance:
- Use `DESIGN_GUIDE.md` in this directory as the source of truth for visual direction, styling tokens, product layout patterns, and verification checks.
