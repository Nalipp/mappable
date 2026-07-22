# Dataset Profile 1: Largest U.S. Central Public Libraries

## Goal

Build a map-ready dataset of the 30 largest central public-library buildings
in the 50 United States and the District of Columbia, ranked by reported
building floor area. The static prototype should be able to show where the
largest central libraries are and compare their building size with clearly
labeled library-system activity and collection metrics.

"Largest" means descending `SQ_FEET` in the Institute of Museum and Library
Services (IMLS) Public Libraries Survey (PLS) FY 2024 outlet file. It does not
mean largest collection or highest circulation. The ranking is building-level;
joined holdings, visits, circulation, and population values are system-level.

## Authoritative source

- Survey page: https://www.imls.gov/research-evaluation/surveys/public-libraries-survey-pls
- FY 2024 CSV files: https://www.imls.gov/sites/default/files/2026-06/pls_fy2024_csv.zip
- FY 2024 documentation: https://www.imls.gov/sites/default/files/2026-06/PublicLibrariesSurvey_FiscalYear2024_DataDocumentationandUsersGuide.pdf
- Outlet table: `CSV/pls_fy24_outlet_pud24i.csv`
- System table: `CSV/PLS_FY24_AE_pud24i.csv`
- Join key: `FSCSKEY`; stable outlet identifier: `FSCSKEY` plus `FSCS_SEQ`

Use the imputation flags supplied with the files. Negative numeric sentinel
values are missing or inapplicable and must never enter the final dataset.

## Inclusion and exclusion rules

- Include records where `C_OUT_TY` is `CE` (central/main library), `C_FSCS` is
  `Y`, `STATSTRU` is not `23`, `SQ_FEET` is positive, and the state is one of
  the 50 states or the District of Columbia.
- Exclude branches, bookmobiles, books-by-mail outlets, temporarily closed
  outlets, outlying territories (`AS`, `GU`, `MP`, `PR`, `VI`), records with
  missing/nonpositive floor area, and records missing required map fields.
- Record grain: one central public-library building per record. IMLS permits at
  most one central outlet per administrative entity.
- Ranking: sort qualifying records by numeric `SQ_FEET` descending, then by
  `LIBNAME` ascending as the deterministic tie-breaker. Assign ranks 1 through
  30 after validation.
- Required map location: `ADDRESS`, `CITY`, `STABR`, `ZIP`, `LONGITUD`, and
  `LATITUDE` from the same FY 2024 outlet record.
- Final output must contain exactly 30 records. Discover the first 35 ranked
  leads so a failed record can be replaced by the next eligible record without
  changing the ranking method.

## Discovery signals

Discover leads only from the ranked FY 2024 IMLS outlet table. Capture the
source rank, `SQ_FEET`, `FSCSKEY`, `FSCS_SEQ`, city, and state as signals.
Discovery signals are not final proof of inclusion.

## Validation order

Check these constraints in this exact fail-fast order:

1. **US central public library:** the outlet is `CE`, participates in the
   federal-state cooperative system, is not temporarily closed, and is in a
   covered state or DC.
2. **Reported positive building area:** `SQ_FEET` is positive. Capture
   `F_SQ_FT`; an imputed value may remain eligible but must be labeled.
3. **Physical address:** the outlet has a complete street address, city, state,
   and five-digit ZIP in its IMLS outlet record.
4. **Map coordinates:** longitude and latitude are numeric and in WGS84 ranges;
   `GEOSTATUS` is `E` or `T`, and `GEOSCORE` is at least 90. Preserve
   `GEOSTATUS`, `GEOSCORE`, and `GEOMTYPE`. A tied (`T`) result is acceptable
   only when the score is 100 and `GEOMTYPE` is `MANUAL`; otherwise mark it
   `needs_verification`.
5. **System join and facts:** exactly one FY 2024 administrative-entity record
   matches `FSCSKEY`. Capture the system name, reporting period, outlet counts,
   and all nonnegative requested system metrics with their imputation/reporting
   flags. System metrics must remain nested under `system_statistics` and must
   never be described as central-building totals.
6. **Rank and final contract:** select the first 30 validated records in source
   order, assign sequential ranks, preserve descending floor area, and validate
   every final record against `data/mappable-records1.schema.json`.

The operator's requested bounded validation batch for this run is 30. The five
remaining discovered candidates stay pending unless a validated record fails;
then validate replacements in source order until 30 records pass.

## Fields and enrichment

For each passing record capture the fields required by
`data/mappable-records1.schema.json`. Standardized enrichment comes from the
same IMLS release:

- Building/outlet: reported floor area, annual public-service hours, weeks
  open, and their flags.
- System: legal service-area population, registered users, print materials,
  total physical items, annual visits and visit reporting method, total annual
  circulation when reported, physical circulation, reporting dates, and outlet
  counts.

Building construction year, architects, renovations, and historical summaries
are optional and must be omitted unless a separate authoritative source is
recorded. Do not infer those facts from the library name or current building.

## Location and geocoding

Use the FY 2024 IMLS-provided longitude and latitude first. IMLS documents the
coordinates as WGS84/EPSG:4326 and reports that AIR batch-geocoded addresses
with the Esri World Geocoder. Preserve its match status, score, and match type.

If a required IMLS coordinate fails validation, the record is not finalized in
this run; use the next ranked validated candidate. A future run may use the
U.S. Census batch geocoder with a fixed benchmark and separately recorded
evidence, but finalization for this run performs no external lookup.
