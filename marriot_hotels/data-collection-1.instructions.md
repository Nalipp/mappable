# Marriott Hotels Dataset Profile — Run 1

## Goal

Build a map-ready dataset of the 30 largest operating Marriott International
portfolio hotels in the 50 United States and District of Columbia. "Largest"
means the published total guest-room count for one hotel property, ranked from
highest to lowest, so the static prototype can compare large Marriott hotels
and place them on a map.

## Inclusion and exclusion rules

- Include: an open hotel in a current Marriott International brand portfolio,
  physically located in a U.S. state or Washington, D.C., with a verifiable
  hotel name, street address, guest-room count, and coordinates.
- Exclude: announced or under-construction hotels; permanently closed hotels;
  non-U.S. properties; non-Marriott-portfolio properties; convention centers,
  Marriott Vacation Club/timeshare complexes, MGM Collection distribution-
  partnership properties, or multi-hotel campuses reported only as a combined
  room count.
- Record grain: one record per separately named hotel. Two co-located hotels
  count separately unless their authoritative sources publish only a single
  combined inventory.
- Required map location: the hotel's complete postal street address and a
  recorded geocoder or authoritative property-map coordinate pair.
- Rank the final 30 by `size.total_guest_rooms` descending. Break equal room
  counts alphabetically by title and give each record a sequential display
  rank.
- `value` preserves the base-data display pattern and is formatted as a
  comma-separated room count plus ` rooms`.

## Discovery signals

Use Marriott property pages, Marriott/Gaylord fact sheets, convention and
visitor bureau listings, venue directories, reputable hotel-industry reports,
and public lists of large U.S. hotels to identify a pool larger than 30.
Discovery snippets and aggregator counts are leads, not final proof.

## Validation order

Check the following constraints in this exact fail-fast order:

1. Marriott portfolio and operating status: a current Marriott or brand site
   lists the bookable property; announced or closed properties fail.
2. U.S. boundary: the published address is in one of the 50 states or
   Washington, D.C.; territories fail.
3. Comparable size: a retrievable source states the property's total guest-room
   inventory. A combined campus count without a property-level count fails.
4. Ranking cutoff: after the candidate pool's room counts are compared, retain
   the top 30 and reject otherwise valid candidates below the cutoff. This
   precedes geocoding so below-cutoff controls do not consume location lookups.
5. Map location: for the retained top 30, verify the complete postal address and
   record coordinates from an authoritative page or geocoder lookup.
6. Final schema and evidence review: capture every required field in
   `data/mappable-records1.schema.json`, source URLs, and verification dates.

Prefer Marriott or official property sources for affiliation, name, address,
and room inventory. A reputable convention bureau, convention-center page,
hotel-industry publication, or established venue directory is acceptable when
the primary page omits a fact. Mark unresolved contradictions as
`needs_verification`; do not average or guess.

## Location and geocoding

- Boundary: 50 United States and Washington, D.C.
- Preferred coordinates: an authoritative Marriott/property page; otherwise
  the U.S. Census Geocoder or OpenStreetMap Nominatim.
- Record the exact lookup URL or geocoder attribution in `sources` and the
  lookup date in `verified_at`.
- Respect published service limits, cache each result locally in the validation
  record, and do not repeat a successful lookup.
- Coordinates must resolve to the published hotel address or building at
  approximately rooftop/street-address precision. Visual estimates and model
  memory are not acceptable.

## Optional enrichment

Capture verifiable fields when economical: suites, floors, year opened or
built, most recent renovation year, building square footage, meeting-space
square footage, and a short history or notable fact. Capture an indicative
nightly price range only when its currency, tax basis, stay dates, occupancy,
and observation date are available; otherwise use `null`. Missing optional
enrichment does not disqualify an otherwise complete record.
