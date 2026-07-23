(function () {
  "use strict";

  const libraries = Array.isArray(window.MAPPABLE_LIBRARIES)
    ? window.MAPPABLE_LIBRARIES
    : [];

  const elements = {
    libraryCount: document.querySelector("#library-count"),
    stateCount: document.querySelector("#state-count"),
    resultsCount: document.querySelector("#results-count"),
    resultsList: document.querySelector("#results-list"),
    mapStatus: document.querySelector("#map-status"),
    selectedRank: document.querySelector("#selected-rank"),
    selectedTitle: document.querySelector("#selected-title"),
    selectedAddress: document.querySelector("#selected-address"),
    selectedArea: document.querySelector("#selected-area"),
    selectedMaterials: document.querySelector("#selected-materials"),
    selectedVisits: document.querySelector("#selected-visits"),
    selectionCard: document.querySelector("#selection-card"),
    sortMetrics: document.querySelectorAll(".selection-metric"),
    detailDialog: document.querySelector("#library-dialog"),
    detailClose: document.querySelector("#detail-close"),
    detailName: document.querySelector("#detail-library-name"),
    detailRank: document.querySelector("#detail-rank"),
    detailSystemName: document.querySelector("#detail-system-name"),
    detailAddress: document.querySelector("#detail-address"),
    detailArea: document.querySelector("#detail-area"),
    detailPrintMaterials: document.querySelector("#detail-print-materials"),
    detailVisits: document.querySelector("#detail-visits"),
    detailCirculation: document.querySelector("#detail-circulation"),
    detailRankingDefinition: document.querySelector("#detail-ranking-definition"),
    detailBuildingFacts: document.querySelector("#detail-building-facts"),
    detailReportingPeriod: document.querySelector("#detail-reporting-period"),
    detailSystemFacts: document.querySelector("#detail-system-facts"),
    detailDataFlags: document.querySelector("#detail-data-flags"),
    detailNotes: document.querySelector("#detail-notes"),
    detailSources: document.querySelector("#detail-sources"),
    detailFullAddress: document.querySelector("#detail-full-address"),
    detailCounty: document.querySelector("#detail-county"),
    detailCoordinates: document.querySelector("#detail-coordinates"),
    detailLibraryIdentity: document.querySelector("#detail-library-identity"),
    detailGeocode: document.querySelector("#detail-geocode"),
    detailRanking: document.querySelector("#detail-ranking"),
    detailVerifiedAt: document.querySelector("#detail-verified-at"),
  };

  const numberFormatter = new Intl.NumberFormat("en-US");
  const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const mapMarkers = new Map();
  let selectedRank = libraries.length ? libraries[0].rank : null;
  let sortKey = "square_feet";
  let sortDirection = "descending";
  let map = null;
  let lastDetailTrigger = null;

  function titleCase(value) {
    return String(value)
      .toLocaleLowerCase("en-US")
      .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase("en-US"))
      .replace(/\bJr\b/g, "Jr.")
      .replace(/\bDc\b/g, "DC");
  }

  function humanize(value) {
    return String(value)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (letter) => letter.toLocaleUpperCase("en-US"));
  }

  function formatCompact(value) {
    return Number.isFinite(value) ? compactFormatter.format(value) : "Not reported";
  }

  function formatNumber(value, suffix = "") {
    return Number.isFinite(value)
      ? `${numberFormatter.format(value)}${suffix}`
      : "Not reported";
  }

  function formatDate(value) {
    if (!value) return "Not reported";
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return value;
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function markerSize(squareFeet) {
    const values = libraries.map((library) => Math.sqrt(library.building.reported_square_feet));
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const normalized = (Math.sqrt(squareFeet) - minimum) / (maximum - minimum || 1);
    return 14 + normalized * 12;
  }

  function renderSummary() {
    const states = new Set(libraries.map((library) => library.location.state));
    elements.libraryCount.textContent = numberFormatter.format(libraries.length);
    elements.stateCount.textContent = numberFormatter.format(states.size);
  }

  function createMapMarker(library) {
    const anchor = createElement("div", "library-marker-anchor");
    const markerButton = createElement("button", "library-marker");
    const name = titleCase(library.title);
    const coordinates = library.location.coordinates;

    markerButton.type = "button";
    markerButton.dataset.rank = String(library.rank);
    markerButton.dataset.label = `Rank ${library.rank} · ${name}`;
    markerButton.setAttribute(
      "aria-label",
      `View details for rank ${library.rank}, ${name}, ${library.location.city}, ${library.location.state}`
    );
    markerButton.setAttribute("aria-pressed", "false");
    markerButton.style.setProperty(
      "--marker-size",
      `${markerSize(library.building.reported_square_feet)}px`
    );
    markerButton.addEventListener("click", () => {
      selectLibrary(library, { scrollList: true });
      openLibraryDetails(library, markerButton);
    });
    anchor.append(markerButton);

    const marker = new maplibregl.Marker({ element: anchor, anchor: "center" })
      .setLngLat([coordinates.lng, coordinates.lat])
      .addTo(map);

    mapMarkers.set(library.rank, { anchor, button: markerButton, marker });
  }

  function initializeMap() {
    if (!window.maplibregl) {
      elements.mapStatus.textContent = "Map unavailable";
      return;
    }

    map = new maplibregl.Map({
      container: "map",
      style: "https://tiles.openfreemap.org/styles/liberty",
      center: [-98.5, 38.5],
      zoom: 3.25,
      attributionControl: true,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");

    const bounds = new maplibregl.LngLatBounds();
    libraries.forEach((library) => {
      const coordinates = library.location.coordinates;
      createMapMarker(library);
      bounds.extend([coordinates.lng, coordinates.lat]);
    });

    map.fitBounds(bounds, {
      padding: 52,
      maxZoom: 4.5,
      duration: 0,
    });

    updateSelectedStyles();

    map.on("load", () => {
      elements.mapStatus.textContent = "Map loaded";
    });

    map.on("error", () => {
      if (!map.loaded()) elements.mapStatus.textContent = "Map unavailable";
    });
  }

  function resultCard(library) {
    const card = createElement("button", "result-card");
    const rank = createElement("span", "result-rank");
    const copy = createElement("span", "result-copy");
    const title = createElement("span", "result-title", titleCase(library.title));
    const location = createElement(
      "span",
      "result-location",
      `${titleCase(library.location.city)}, ${library.location.state}`
    );
    const statistics = library.system_statistics;
    const metrics = createElement("span", "result-metrics");
    const area = createElement("span", "result-value", library.value);
    const materials = createElement(
      "span",
      "result-value",
      `${formatCompact(statistics.print_materials)} print items`
    );
    const visits = createElement(
      "span",
      "result-value",
      `${formatCompact(statistics.annual_visits)} visits`
    );

    card.type = "button";
    card.dataset.rank = String(library.rank);
    card.setAttribute("aria-pressed", "false");
    card.setAttribute(
      "aria-label",
      `View details for rank ${library.rank}, ${titleCase(library.title)}, ${library.value}`
    );
    copy.append(title, location);
    metrics.append(area, materials, visits);
    card.append(rank, copy, metrics);
    card.addEventListener("click", () => {
      selectLibrary(library);
      openLibraryDetails(library, card);
    });
    return card;
  }

  function sortedLibraries() {
    const direction = sortDirection === "descending" ? -1 : 1;
    return [...libraries].sort((left, right) => {
      const leftValue = sortKey === "square_feet"
        ? left.building.reported_square_feet
        : left.system_statistics[sortKey];
      const rightValue = sortKey === "square_feet"
        ? right.building.reported_square_feet
        : right.system_statistics[sortKey];
      return (leftValue - rightValue) * direction || left.rank - right.rank;
    });
  }

  function renderResults(records) {
    const fragment = document.createDocumentFragment();
    records.forEach((library, index) => {
      const card = resultCard(library);
      card.querySelector(".result-rank").textContent = String(index + 1);
      fragment.appendChild(card);
    });
    elements.resultsList.replaceChildren(fragment);
    elements.resultsCount.textContent = `${records.length} ${records.length === 1 ? "result" : "results"}`;
    updateSelectedStyles();
  }

  function updateSelectedStyles() {
    document.querySelectorAll(".result-card").forEach((node) => {
      const isSelected = Number(node.dataset.rank) === selectedRank;
      node.classList.toggle("is-selected", isSelected);
      node.setAttribute("aria-pressed", String(isSelected));
    });

    mapMarkers.forEach(({ anchor, button }, rank) => {
      const isSelected = rank === selectedRank;
      button.classList.toggle("is-selected", isSelected);
      button.setAttribute("aria-pressed", String(isSelected));
      anchor.style.zIndex = isSelected ? "10" : String(100 - rank);
    });
  }

  function selectLibrary(library, options = {}) {
    selectedRank = library.rank;
    const statistics = library.system_statistics;

    elements.selectedRank.textContent = String(library.rank);
    elements.selectedTitle.textContent = titleCase(library.title);
    elements.selectedAddress.textContent = `${titleCase(library.location.address)} · ${titleCase(library.location.city)}, ${library.location.state}`;
    elements.selectedArea.textContent = library.value;
    elements.selectedMaterials.textContent = formatCompact(statistics.print_materials);
    elements.selectedVisits.textContent = formatCompact(statistics.annual_visits);
    updateSelectedStyles();

    if (options.scrollList) {
      const selectedCard = elements.resultsList.querySelector(
        `.result-card[data-rank="${library.rank}"]`
      );
      selectedCard?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function renderFactGrid(container, facts) {
    const cards = facts.map(({ label, value, wide = false }) => {
      const card = createElement("article", `detail-fact${wide ? " is-wide" : ""}`);
      card.append(
        createElement("span", "detail-fact-label", label),
        createElement("strong", "detail-fact-value", value)
      );
      return card;
    });
    container.replaceChildren(...cards);
  }

  function renderCompactFacts(container, facts) {
    const fragment = document.createDocumentFragment();
    facts.forEach(({ label, value }) => {
      fragment.append(
        createElement("dt", "compact-fact-label", label),
        createElement("dd", "compact-fact-value", value)
      );
    });
    container.replaceChildren(fragment);
  }

  function renderDataFlags(flags) {
    const flagRows = Object.entries(flags).map(([field, flag]) => {
      const row = createElement("div", "detail-flag");
      row.append(
        createElement("span", "detail-flag-label", humanize(field)),
        createElement("strong", "detail-flag-value", flag)
      );
      return row;
    });
    elements.detailDataFlags.replaceChildren(...flagRows);
  }

  function renderNotes(notes = []) {
    if (!notes.length) {
      elements.detailNotes.replaceChildren(
        createElement("p", "detail-note detail-note-muted", "No record-specific notes were reported.")
      );
      return;
    }

    const noteCards = notes.map((note) => createElement("p", "detail-note", note));
    elements.detailNotes.replaceChildren(...noteCards);
  }

  function renderSources(sources) {
    const sourceCards = sources.map((source, index) => {
      const card = createElement("article", "source-card card");
      const copy = createElement("div", "source-card-copy");
      copy.append(
        createElement("span", "source-card-label", `Source ${index + 1} · ${humanize(source.scope)}`),
        createElement("p", "source-card-note", source.note),
        createElement("span", "source-card-date", `Verified ${formatDate(source.verified_at)}`)
      );

      const link = createElement("a", "source-card-link", "Open source ↗");
      link.href = source.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      card.append(copy, link);
      return card;
    });
    elements.detailSources.replaceChildren(...sourceCards);
  }

  function openLibraryDetails(library, trigger) {
    const location = library.location;
    const building = library.building;
    const statistics = library.system_statistics;
    const circulation = statistics.physical_circulation;
    const visitMethods = {
      CT: "Actual count (CT)",
      ES: "Estimate (ES)",
      M: "Missing (M)",
    };

    lastDetailTrigger = trigger;
    elements.detailName.textContent = titleCase(library.title);
    elements.detailRank.textContent = `Rank ${library.rank}`;
    elements.detailSystemName.textContent = titleCase(library.library.system_name);
    elements.detailAddress.textContent = `${titleCase(location.address)} · ${titleCase(location.city)}, ${location.state} ${location.postal_code}`;
    elements.detailArea.textContent = library.value;
    elements.detailPrintMaterials.textContent = formatNumber(statistics.print_materials);
    elements.detailVisits.textContent = formatNumber(statistics.annual_visits);
    elements.detailCirculation.textContent = formatNumber(circulation);
    elements.detailRankingDefinition.textContent = library.ranking.definition;
    elements.detailReportingPeriod.textContent = `${statistics.reporting_period.start}–${statistics.reporting_period.end}`;

    const buildingFacts = [
      { label: "Reported floor area", value: library.value },
      { label: "Square-feet data flag", value: building.square_feet_flag },
      { label: "Annual public service hours", value: formatNumber(building.annual_public_service_hours) },
      { label: "Service-hours data flag", value: building.public_service_hours_flag },
      { label: "Weeks open", value: formatNumber(building.weeks_open) },
      { label: "Weeks-open data flag", value: building.weeks_open_flag },
    ];
    if (building.opened_year) {
      buildingFacts.push({ label: "Opened", value: String(building.opened_year) });
    }
    if (building.architects?.length) {
      buildingFacts.push({ label: "Architects", value: building.architects.join(", "), wide: true });
    }
    if (building.history_summary) {
      buildingFacts.push({ label: "Building history", value: building.history_summary, wide: true });
    }
    renderFactGrid(elements.detailBuildingFacts, buildingFacts);

    renderFactGrid(elements.detailSystemFacts, [
      { label: "Legal service area population", value: formatNumber(statistics.legal_service_area_population) },
      { label: "Registered users", value: formatNumber(statistics.registered_users) },
      { label: "Print materials", value: formatNumber(statistics.print_materials) },
      { label: "Total physical items", value: formatNumber(statistics.total_physical_items) },
      { label: "Annual visits", value: formatNumber(statistics.annual_visits) },
      { label: "Visits reporting method", value: visitMethods[statistics.visits_reporting_method] ?? statistics.visits_reporting_method },
      { label: "Annual circulation", value: formatNumber(statistics.annual_circulation) },
      { label: "Physical circulation", value: formatNumber(statistics.physical_circulation) },
      { label: "Central libraries", value: formatNumber(statistics.outlet_counts.central_libraries) },
      { label: "Branch libraries", value: formatNumber(statistics.outlet_counts.branch_libraries) },
      { label: "Measurement scope", value: humanize(statistics.scope) },
    ]);

    renderDataFlags(statistics.data_flags);
    renderNotes(statistics.notes);
    renderSources(library.sources);

    elements.detailFullAddress.textContent = `${titleCase(location.address)}, ${titleCase(location.city)}, ${location.state} ${location.postal_code}`;
    elements.detailCounty.textContent = `${titleCase(location.county)} County`;
    elements.detailCoordinates.textContent = `${location.coordinates.lat.toFixed(6)}, ${location.coordinates.lng.toFixed(6)}`;

    renderCompactFacts(elements.detailLibraryIdentity, [
      { label: "Outlet ID", value: library.library.outlet_id },
      { label: "System ID", value: library.library.system_id },
      { label: "System", value: titleCase(library.library.system_name) },
      { label: "Outlet type", value: humanize(library.library.outlet_type) },
      { label: "Library type", value: humanize(library.library.library_type) },
    ]);

    renderCompactFacts(elements.detailGeocode, [
      { label: "Provider", value: location.geocode.provider },
      { label: "CRS", value: location.geocode.crs },
      { label: "Status", value: location.geocode.status },
      { label: "Score", value: String(location.geocode.score) },
      { label: "Match type", value: humanize(location.geocode.match_type) },
    ]);

    renderCompactFacts(elements.detailRanking, [
      { label: "Metric", value: humanize(library.ranking.metric) },
      { label: "Value", value: formatNumber(library.ranking.value, " sq ft") },
      { label: "Unit", value: humanize(library.ranking.unit) },
      { label: "Reporting year", value: String(library.ranking.reporting_year) },
      { label: "Scope", value: humanize(library.ranking.scope) },
    ]);

    elements.detailVerifiedAt.textContent = `Record checked ${formatDate(library.verified_at)}`;
    elements.detailDialog.showModal();
    elements.detailDialog.scrollTop = 0;
    elements.detailClose.focus();
  }

  function updateSortMetricState() {
    elements.sortMetrics.forEach((metric) => {
      const isActive = metric.dataset.sortKey === sortKey;
      metric.classList.toggle("is-active", isActive);
      metric.setAttribute("aria-pressed", String(isActive));
      metric.setAttribute(
        "aria-label",
        `${metric.querySelector(".selection-metric-label").textContent}: sorted ${isActive ? sortDirection : "not selected"}`
      );
    });
  }

  function applySort(nextSortKey) {
    if (sortKey === nextSortKey) {
      sortDirection = sortDirection === "descending" ? "ascending" : "descending";
    } else {
      sortKey = nextSortKey;
      sortDirection = "descending";
    }

    updateSortMetricState();
    renderResults(sortedLibraries());
  }

  function initialize() {
    if (!libraries.length) {
      elements.resultsCount.textContent = "0 results";
      elements.selectionCard.hidden = true;
      elements.mapStatus.textContent = "Map unavailable";
      return;
    }

    renderSummary();
    updateSortMetricState();
    renderResults(sortedLibraries());
    selectLibrary(libraries[0]);
    initializeMap();

    elements.sortMetrics.forEach((metric) => {
      metric.addEventListener("click", () => applySort(metric.dataset.sortKey));
    });

    elements.detailClose.addEventListener("click", () => elements.detailDialog.close());
    elements.detailDialog.addEventListener("close", () => {
      lastDetailTrigger?.focus();
      lastDetailTrigger = null;
    });
  }

  initialize();
})();
