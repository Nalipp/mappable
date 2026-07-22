# Mappable Styling Guide: shadcn-style UI With Wemo Colors

Use this guide when styling the lightweight Mappable HTML/CSS prototype.

## Direction

Build a clean, practical product interface with shadcn/ui as loose inspiration: neutral surfaces, crisp borders, compact cards, modest radius, readable type, and restrained loading states.

Use Wemo only for color, spacing, radius, and shadow tokens. Do not use any other application as the source of truth for this prototype.

Wemo reference repo:

`/Users/natelipp/code/ai_projects/west-monroe-repos/wemo`

Useful Wemo files:

- `packages/wemo/src/wemoColors.ts`
- `packages/wemo/src/wemoSpaces.ts`
- `packages/wemo/src/wemoBorderRadii.ts`
- `packages/wemo/src/wemoElevations.ts`

## Stack

- Plain HTML
- Plain CSS
- Vanilla JavaScript only if behavior is needed later
- Locally vendored MapLibre GL JS 5.24.0 for the interactive map only
- No build step
- No framework dependency

Do not install shadcn, React, Tailwind, Mantine, or Vite for this prototype.
Treat shadcn as a visual reference, not a dependency. Do not replace the
approved vendored MapLibre/OpenFreeMap stack with a synthetic map or another
mapping provider.

## Local Tokens

Define local CSS variables from Wemo values near the top of the stylesheet:

```css
:root {
  --wemo-blue-100: #f4f8fa;
  --wemo-blue-200: #e6f0f6;
  --wemo-blue-700: #0979c9;
  --wemo-blue-900: #003d68;

  --wemo-neutral-100: #f1f4f6;
  --wemo-neutral-200: #e8ecef;
  --wemo-neutral-300: #d5dce1;
  --wemo-neutral-500: #959ea4;
  --wemo-neutral-600: #6d757a;
  --wemo-neutral-800: #2a2c2f;
  --wemo-white: #ffffff;

  --wemo-green-400: #46b51c;

  --space-100: 8px;
  --space-150: 12px;
  --space-200: 16px;
  --space-300: 24px;
  --space-400: 32px;

  --radius-xs: 4px;
  --radius-sm: 8px;
  --radius-lg: 100px;

  --shadow-100: 0px 1px 4px rgba(0, 0, 0, 0.08);
}
```

Use semantic aliases after the raw Wemo tokens:

```css
:root {
  --page: var(--wemo-blue-100);
  --surface: var(--wemo-white);
  --surface-muted: var(--wemo-neutral-100);
  --border: var(--wemo-neutral-300);
  --text: var(--wemo-neutral-800);
  --muted: var(--wemo-neutral-600);
  --accent: var(--wemo-blue-700);
}
```

## Visual Rules

- Keep the app shadcn-like: quiet, functional, card-based, and compact.
- Use Wemo neutral surfaces and borders instead of app-specific brand palettes.
- Use Wemo blue for links, selected state, and in-progress/status accents.
- Use Wemo green only for success/healthy indicators.
- Prefer borders over heavy shadows.
- Use `8px` card radius and `4px` inner skeleton radius.
- Keep page structure static-first and file:// friendly.
- Avoid gradients, large brand blocks, decorative effects, and marketing-page composition.

## Product Patterns

Current Mappable pattern:

- compact header
- status badge
- full-width summary/loading card
- dense scrolling result list
- primary map surface beside the results
- explicit mobile stacking with sticky map

For map-first product flows, the map remains the anchor. Supporting results can scroll around it.

## Map Strategy

- Render a geographically accurate, interactive MapLibre map using the local
  `HTML/shadcn/vendor/maplibre-gl-5.24.0/` browser distribution.
- Use the keyless OpenFreeMap Liberty style at
  `https://tiles.openfreemap.org/styles/liberty` and keep attribution visible.
- Position markers from finalized longitude/latitude values; never estimate
  pixel positions or draw a substitute CSS/SVG geography.
- Fit the initial viewport to all visible records. Marker and result-card
  actions should resolve to the same selected record.
- Use Wemo blue for default/selected markers, clear keyboard focus, and compact
  labels or tooltips that do not obscure the map.
- Provide a visible map loading/error state. `file://` remains the entry point,
  but the basemap requires internet access for its remote style and tiles.

## Verification

Before finishing a styling pass, check:

1. The page still works by opening `index.html` directly.
2. Colors come from Wemo-derived variables.
3. The UI feels like a shadcn-style app, not a marketing page.
4. Desktop keeps the results/map split.
5. Mobile stacks summary, sticky map, then results.
6. Text and badges do not overflow.
7. The MapLibre renderer and CSS load locally, the OpenFreeMap basemap renders
   with attribution when online, and failure is communicated when offline.
8. Every finalized record with coordinates produces one accessible marker,
   the viewport fits those records, and list/marker selection stays in sync.
