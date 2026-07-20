# San Francisco Map Proof of Concept — Implementation Plan

## Status

PR-01 is implemented locally with an OpenStreetMap-derived local SVG basemap.
The company-detail interaction is in place. This plan adds a local SVG-backed
map only; it does not add workflow-map behavior.

## PR Status

| PR | Scope | Status |
| --- | --- | --- |
| PR-01 | Map contract and static basemap | Implemented locally |
| PR-02 | Company pin rendering and selection | Planned |
| PR-03 | Responsive polish and verification | Planned |

## Parallel Execution Notes

PR-01 must land before PR-02 because it defines the geographic projection and
local SVG surface. PR-03 follows PR-02 because it verifies the wired UI.

## PR / Review Strategy

Keep each PR to one focused implementation pass. Review the static map before
binding data, then review interactions before responsive polish.

## PR-01 — Local map contract and basemap

**Status:** Implemented locally

**Objective:** Add a schema-validated regional map contract and a restrained,
geographically grounded local SVG basemap for San Francisco.

**Dependencies:** None.

**Parallelism:** None; this establishes the shared geometry.

- [x] P1-T01 Define a regional map JSON contract: geographic bounds, SVG
  viewBox, and source dataset identifier.
- [x] P1-T02 Add the matching JSON schema and validate the contract.
- [x] P1-T03 Create a local SVG from OpenStreetMap coastline and major-road
  geometry, with local attribution and no runtime map request.
- [x] P1-T04 Replace the decorative CSS map canvas with the local SVG surface.

**Validation:** Open directly through `file://`; confirm no network requests,
the SVG scales inside the existing desktop map panel, and map JSON conforms to
its schema.

## PR-02 — Finalized-company pins and selection

**Status:** Planned

**Objective:** Render the finalized company records as SVG pins and make map
and result-list selection agree.

**Dependencies:** PR-01.

**Parallelism:** None; consumes the PR-01 bounds and viewBox.

- [ ] P2-T01 Create a local UI data module derived from
  `data/mappable-records1.json`; do not use `fetch()` so `file://` remains
  supported.
- [ ] P2-T02 Implement latitude/longitude-to-SVG coordinate projection from
  the map contract bounds.
- [ ] P2-T03 Render one accessible pin per finalized company.
- [ ] P2-T04 Synchronize pin and result-card selection; either action opens
  the existing company-detail dialog.

**Validation:** Confirm all current records render once, each pin falls within
the SF map bounds, and card/pin actions open the expected company dialog.

## PR-03 — Responsive polish and verification

**Status:** Planned

**Objective:** Finish map states without adding workflow-map features.

**Dependencies:** PR-02.

**Parallelism:** None; validates the integrated experience.

- [ ] P3-T01 Add selected and keyboard-focus pin states using existing Wemo
  tokens.
- [ ] P3-T02 Verify desktop list/map split and mobile sticky-map stacking.
- [ ] P3-T03 Check name, badge, and pin-label overflow at narrow widths.
- [ ] P3-T04 Confirm Escape, close-control, and Mappable-home behaviors still
  work from the detail view.

**Validation:** Direct `file://` testing at desktop and mobile widths, plus a
local script/schema check. No external libraries, tiles, routing, or workflow
connections.

## Open Questions

- Should role count appear in the first pin treatment, or should pins remain
  unlabeled until a company is selected?
