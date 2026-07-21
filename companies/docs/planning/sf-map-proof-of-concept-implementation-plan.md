# San Francisco Map Proof of Concept — Implementation Plan

## Status

PR-01 and PR-02 are implemented locally with a bundled MapLibre renderer and
the keyless OpenFreeMap Liberty basemap. The map opens from `file://`, but
requires internet access to obtain its remote style and tiles.

## PR Status

| PR | Scope | Status |
| --- | --- | --- |
| PR-01 | Keyless interactive basemap | Implemented locally |
| PR-02 | Company pin rendering and selection | Implemented locally |
| PR-03 | Responsive polish and verification | Planned |

## Parallel Execution Notes

PR-01 must land before PR-02 because it provides the interactive map surface.
PR-03 follows PR-02 because it verifies the wired UI.

## PR / Review Strategy

Keep each PR to one focused implementation pass. Review the interactive map
before follow-on responsive polish.

## PR-01 — Keyless interactive basemap

**Status:** Implemented locally

**Objective:** Add a bundled MapLibre renderer that loads a keyless,
geographically accurate San Francisco basemap from OpenFreeMap.

**Dependencies:** None.

**Parallelism:** None; this establishes the shared map surface.

- [x] P1-T01 Bundle MapLibre JavaScript, CSS, and license text locally.
- [x] P1-T02 Configure the keyless OpenFreeMap Liberty style.
- [x] P1-T03 Replace the static SVG map surface with an interactive map panel.

**Validation:** Open directly through `file://`; confirm the remote map style
and tiles render when an internet connection is available.

## PR-02 — Finalized-company pins and selection

**Status:** Implemented locally

**Objective:** Render the finalized company records as SVG pins and make map
and result-list selection agree.

**Dependencies:** PR-01.

**Parallelism:** None; consumes the PR-01 bounds and viewBox.

- [x] P2-T01 Define the current finalized company coordinates locally; no
  local JSON request is required at runtime.
- [x] P2-T02 Render one accessible pin per finalized company.
- [x] P2-T03 Synchronize result cards and pin clicks with the existing
  company-detail dialog.

**Validation:** Confirm all current records render once and card/pin actions
open the expected company dialog.

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

**Validation:** Direct `file://` testing at desktop and mobile widths. No
server, API key, routing, or workflow connections.

## Open Questions

- Should role count appear in the first pin treatment, or should pins remain
  unlabeled until a company is selected?
