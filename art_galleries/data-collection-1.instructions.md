# Dataset Profile: Renowned United States Art Museums and Galleries

## Goal

Build a map-ready dataset of 30 renowned public art museums and museum-style
galleries in the United States so a static prototype can compare reputation
signals, collections, visitor cost, buildings, locations, and nearby lodging.

## Inclusion and exclusion rules

- Include: public-facing U.S. institutions whose primary mission and permanent
  holdings are visual art. Sculpture parks and historic collection museums are
  eligible when visual art is central to the visitor experience.
- Exclude: commercial galleries, auction houses, artist studios without a
  museum-scale permanent collection, general history/science museums, and
  institutions without a verifiable physical visitor address.
- Record grain: one record per institution or independently visited campus.
- Required fields: rank, institution name, address, latitude/longitude, nearby
  hotel name, current general-admission information, collection summary,
  building summary, at least one notable artist or work, and source URLs.
- Optional facts such as collection object count, building square footage,
  attendance, endowment, and collection value must be `null` when a reliable
  public figure is unavailable; never estimate them.

## Ranking method

Use a transparent two-stage ranking rather than implying a universal measure
of cultural quality:

1. Rank eligible U.S. institutions reported in *The Art Newspaper*'s April
   2026 Top 150 art museums survey by reported 2025 attendance, using
   https://www.ccb.pt/wp-content/uploads/2026/04/TOP150ArtNewspaper1.pdf.
   Include separately visited campuses whose individual attendance is given in
   the survey footnote: Legion of Honor, Met Cloisters, Getty Villa, and
   Renwick Gallery. Order equal counts in the survey's printed order.
2. Fill the remaining slots with the highest-ranked non-duplicate institutions
   from the Washington Post critics' October 2024 ranked U.S. top 20 at
   https://www.washingtonpost.com/entertainment/art/2024/10/24/20-best-art-museums-in-america/.
   Attendance-tier records always precede supplemental records.

Store the source, year, metric, value, and selection tier in each record so the
ranking can be re-evaluated later.

## Discovery signals

Use the April 2026 *Art Newspaper* survey as the primary lead list, then a
national critics' list for gap filling. A discovery signal is not validation.

## Validation order

Check these constraints in this exact fail-fast order:

1. Institution fit: visual art and a permanent collection are central.
2. National ranking evidence: qualifying attendance-survey entry or explicit
   placement in the cited supplemental national ranking.
3. U.S. physical location: complete street address and recorded geocode.
4. Required visitor data: nearby hotel name, admission status/price, collection
   overview, building overview, and at least one notable artist or work.
5. Final schema and evidence review.

For every passing record, capture all fields required by
`data/mappable-records1.schema.json`, including source URLs and verification
dates. Prefer museum and government sources for institution facts. Ranking,
geocoding, and nearby-hotel sources may be reputable third-party datasets.

## Location and geocoding

- Boundary: the 50 U.S. states and District of Columbia.
- Preferred coordinates: institution-published coordinates, Wikidata, or
  OpenStreetMap/Nominatim results matching the verified street address.
- Precision: decimal degrees to at least four decimal places where available.
- Record the geocoder URL, provider, WGS84 coordinate reference system, and
  verification date in the location object.
- Nearby hotel means the nearest named OpenStreetMap feature tagged
  `tourism=hotel` within six straight-line miles of the visitor entrance,
  calculated from WGS84 coordinates. Record hotel coordinates, computed
  distance, OSM feature URL, and verification date. It is a navigation aid,
  not a recommendation.

## Retrieval and freshness

- Ranking and attendance: use the latest cited survey year (2025).
- Admission: verify against an official visitor/ticket page as of 2026-07-21.
- Stable collection/building facts: museum, government, or well-sourced
  reference pages are acceptable.
- Use native web research for small batches; use Bright Data only if repeated
  blocking or JavaScript rendering prevents retrieval.
