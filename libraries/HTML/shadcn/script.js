(function () {
  "use strict";

  const libraries = Array.isArray(window.MAPPABLE_LIBRARIES)
    ? window.MAPPABLE_LIBRARIES
    : [];

  const elements = {
    libraryCount: document.querySelector("#library-count"),
    stateCount: document.querySelector("#state-count"),
    totalArea: document.querySelector("#total-area"),
    resultsCount: document.querySelector("#results-count"),
    resultsList: document.querySelector("#results-list"),
    emptyState: document.querySelector("#empty-state"),
    search: document.querySelector("#library-search"),
    mapStatus: document.querySelector("#map-status"),
    selectedRank: document.querySelector("#selected-rank"),
    selectedTitle: document.querySelector("#selected-title"),
    selectedAddress: document.querySelector("#selected-address"),
    selectedArea: document.querySelector("#selected-area"),
    selectedMaterials: document.querySelector("#selected-materials"),
    selectedVisits: document.querySelector("#selected-visits"),
    selectedCoordinates: document.querySelector("#selected-coordinates"),
    selectionCard: document.querySelector("#selection-card"),
  };

  const numberFormatter = new Intl.NumberFormat("en-US");
  const compactFormatter = new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  });

  const mapMarkers = new Map();
  let selectedRank = libraries.length ? libraries[0].rank : null;
  let filteredRanks = new Set(libraries.map((library) => library.rank));
  let map = null;

  function titleCase(value) {
    return value
      .toLocaleLowerCase("en-US")
      .replace(/\b[a-z]/g, (letter) => letter.toLocaleUpperCase("en-US"))
      .replace(/\bJr\b/g, "Jr.")
      .replace(/\bDc\b/g, "DC");
  }

  function formatCompact(value) {
    return Number.isFinite(value) ? compactFormatter.format(value) : "Not reported";
  }

  function markerSize(squareFeet) {
    const values = libraries.map((library) => Math.sqrt(library.square_feet));
    const minimum = Math.min(...values);
    const maximum = Math.max(...values);
    const normalized = (Math.sqrt(squareFeet) - minimum) / (maximum - minimum || 1);
    return 14 + normalized * 12;
  }

  function createElement(tagName, className, text) {
    const node = document.createElement(tagName);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function renderSummary() {
    const states = new Set(libraries.map((library) => library.location.state));
    const totalSquareFeet = libraries.reduce(
      (total, library) => total + library.square_feet,
      0
    );

    elements.libraryCount.textContent = numberFormatter.format(libraries.length);
    elements.stateCount.textContent = numberFormatter.format(states.size);
    elements.totalArea.textContent = `${formatCompact(totalSquareFeet)} sq ft`;
  }

  function createMapMarker(library) {
    const anchor = createElement("div", "library-marker-anchor");
    const markerButton = createElement("button", "library-marker");
    const name = titleCase(library.title);
    const coordinates = library.location.coordinates;

    markerButton.type = "button";
    markerButton.dataset.rank = String(library.rank);
    markerButton.dataset.label = `#${library.rank} ${name}`;
    markerButton.setAttribute(
      "aria-label",
      `Rank ${library.rank}, ${name}, ${library.location.city}, ${library.location.state}, ${library.value}`
    );
    markerButton.setAttribute("aria-pressed", "false");
    markerButton.style.setProperty("--marker-size", `${markerSize(library.square_feet)}px`);
    markerButton.addEventListener("click", () => selectLibrary(library, { scrollList: true }));
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
    const rank = createElement("span", "result-rank", `#${library.rank}`);
    const copy = createElement("span", "result-copy");
    const title = createElement("span", "result-title", titleCase(library.title));
    const location = createElement(
      "span",
      "result-location",
      `${titleCase(library.location.city)}, ${library.location.state}`
    );
    const statistics = library.system_statistics;
    const context = createElement(
      "span",
      "result-context",
      `${formatCompact(statistics.print_materials)} system print items · ${formatCompact(statistics.annual_visits)} visits`
    );
    const value = createElement("span", "result-value", library.value);

    card.type = "button";
    card.dataset.rank = String(library.rank);
    card.setAttribute("aria-pressed", "false");
    card.setAttribute(
      "aria-label",
      `Select rank ${library.rank}, ${titleCase(library.title)}, ${library.value}`
    );
    copy.append(title, location, context);
    card.append(rank, copy, value);
    card.addEventListener("click", () => selectLibrary(library));
    return card;
  }

  function renderResults(records) {
    const fragment = document.createDocumentFragment();
    records.forEach((library) => fragment.appendChild(resultCard(library)));
    elements.resultsList.replaceChildren(fragment);
    elements.resultsCount.textContent = `${records.length} ${records.length === 1 ? "result" : "results"}`;
    elements.emptyState.hidden = records.length !== 0;
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
    const coordinates = library.location.coordinates;

    elements.selectedRank.textContent = `#${library.rank}`;
    elements.selectedTitle.textContent = titleCase(library.title);
    elements.selectedAddress.textContent = `${titleCase(library.location.address)} · ${titleCase(library.location.city)}, ${library.location.state}`;
    elements.selectedArea.textContent = library.value;
    elements.selectedMaterials.textContent = formatCompact(statistics.print_materials);
    elements.selectedVisits.textContent = formatCompact(statistics.annual_visits);
    elements.selectedCoordinates.textContent = `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`;
    updateSelectedStyles();

    if (options.scrollList) {
      const selectedCard = elements.resultsList.querySelector(
        `.result-card[data-rank="${library.rank}"]`
      );
      selectedCard?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function searchableText(library) {
    return [
      library.title,
      library.system_name,
      library.location.address,
      library.location.city,
      library.location.state,
      library.location.county,
    ]
      .join(" ")
      .toLocaleLowerCase("en-US");
  }

  function applySearch() {
    const query = elements.search.value.trim().toLocaleLowerCase("en-US");
    const matches = query
      ? libraries.filter((library) => searchableText(library).includes(query))
      : libraries;

    filteredRanks = new Set(matches.map((library) => library.rank));
    renderResults(matches);
    elements.selectionCard.hidden = matches.length === 0;

    mapMarkers.forEach(({ anchor }, rank) => {
      anchor.hidden = !filteredRanks.has(rank);
    });

    if (matches.length && !filteredRanks.has(selectedRank)) {
      selectLibrary(matches[0]);
    }
  }

  function initialize() {
    if (!libraries.length) {
      elements.resultsCount.textContent = "0 results";
      elements.emptyState.hidden = false;
      elements.emptyState.textContent = "The local library dataset could not be loaded.";
      elements.selectionCard.hidden = true;
      elements.mapStatus.textContent = "Map unavailable";
      return;
    }

    renderSummary();
    renderResults(libraries);
    selectLibrary(libraries[0]);
    initializeMap();
    elements.search.addEventListener("input", applySearch);
  }

  initialize();
})();
