# Dataset Profile Template

Copy this file to `data-collection-1.instructions.md` before beginning a new
ingestion run. Replace every bracketed placeholder; the profile is the source
of truth for scope and validation order.

## Goal

Build a map-ready dataset of [record type] for [place or market] so the static
prototype can answer [user question].

## Inclusion and exclusion rules

- Include: [required attributes].
- Exclude: [disqualifying attributes].
- Record grain: [one record per organization / place / event].
- Required map location: [street address / venue / coordinate source].

## Discovery signals

Use [search terms / directories / public sources] to find leads. Discovery
signals may be incomplete and are not proof of inclusion.

## Validation order

Check the following constraints in this exact fail-fast order:

1. [constraint name and pass/fail definition]
2. [constraint name and pass/fail definition]
3. [location requirement and accepted evidence]
4. [other required data]
5. Final schema and evidence review

For every passing record, capture the exact fields required by
`data/mappable-records1.schema.json`, including source URLs and dates. Prefer
primary sources. Mark ambiguity as `needs_verification`; do not infer facts.

## Location and geocoding

State the allowed geographic boundary, geocoder, attribution, rate limits,
caching rules, and acceptable coordinate precision here. Coordinates must come
from a recorded lookup, not model memory or a visual estimate.
