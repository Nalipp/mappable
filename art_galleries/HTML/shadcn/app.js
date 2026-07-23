(() => {
  'use strict';

  const museums = Array.isArray(window.ART_GALLERIES) ? window.ART_GALLERIES : [];
  const state = { filter: 'all', query: '', selectedId: null, visible: museums };
  const markers = new Map();
  let map = null;
  let mapReady = false;

  const elements = {
    search: document.querySelector('#museum-search'),
    filters: [...document.querySelectorAll('[data-filter]')],
    results: document.querySelector('#results-list'),
    resultCount: document.querySelector('#results-count'),
    mapCount: document.querySelector('#map-count'),
    mapStatus: document.querySelector('#map-status'),
    mapFallback: document.querySelector('#map-fallback'),
    empty: document.querySelector('#empty-state'),
    dialog: document.querySelector('.detail-dialog'),
    close: document.querySelector('.close-button')
  };

  const detail = Object.fromEntries([
    'eyebrow', 'title', 'admission', 'summary', 'website', 'verified', 'object-count',
    'collection', 'artists', 'works', 'building-year', 'building-history', 'architects',
    'area', 'building-scope', 'address', 'hotel', 'hotel-distance', 'ranking',
    'ranking-source', 'financial', 'financial-note'
  ].map((key) => [key, document.querySelector(`#dialog-${key}`)]));
  detail.financialCard = document.querySelector('#financial-card');

  const number = new Intl.NumberFormat('en-US');
  const currency = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0, notation: 'compact'
  });

  function admissionLabel(museum) {
    const price = museum.admission.adult_general_usd;
    if (price === 0) return 'Free general admission';
    if (price === null) return 'See current pricing';
    return `$${number.format(price)} adult admission`;
  }

  function rankingLabel(museum) {
    if (museum.ranking.metric === 'annual_visitors') {
      return `${number.format(museum.ranking.metric_value)} visitors in ${museum.ranking.metric_year}`;
    }
    return `Critics’ rank #${museum.ranking.metric_value} in ${museum.ranking.metric_year}`;
  }

  function normalize(value) {
    return String(value || '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function searchText(museum) {
    const artists = museum.collection.notable_artists.join(' ');
    const works = museum.collection.notable_works.map((work) => `${work.title} ${work.artist}`).join(' ');
    return normalize([
      museum.title, museum.institution_type, museum.location.city, museum.location.state,
      museum.location.address, artists, works
    ].join(' '));
  }

  function museumMatches(museum) {
    const price = museum.admission.adult_general_usd;
    const admissionMatches = state.filter === 'all' || (state.filter === 'free' ? price === 0 : price !== 0);
    return admissionMatches && (!state.query || searchText(museum).includes(normalize(state.query)));
  }

  function createTag(text, className = '') {
    const tag = document.createElement('span');
    tag.textContent = text;
    if (className) tag.className = className;
    return tag;
  }

  function createResultCard(museum) {
    const card = document.createElement('button');
    card.className = 'result-card card';
    card.type = 'button';
    card.dataset.museumId = museum.id;
    card.setAttribute('aria-label', `View rank ${museum.rank}, ${museum.title}`);

    const rank = createTag(String(museum.rank), 'result-rank');
    const content = document.createElement('span');
    content.className = 'result-content';

    const heading = document.createElement('span');
    heading.className = 'result-card-heading';
    const title = document.createElement('strong');
    title.textContent = museum.title;
    heading.append(title, createTag('→', 'card-arrow'));

    const metric = createTag(rankingLabel(museum), 'result-summary');
    const location = createTag(`${museum.location.city}, ${museum.location.state} · ${museum.institution_type}`, 'result-location');
    const tags = document.createElement('span');
    tags.className = 'result-tags';
    tags.append(createTag(admissionLabel(museum)), createTag(museum.nearby_hotel.name));

    content.append(heading, metric, location, tags);
    card.append(rank, content);
    card.addEventListener('click', () => selectMuseum(museum, true));
    return card;
  }

  function renderResults() {
    state.visible = museums.filter(museumMatches);
    elements.results.replaceChildren(...state.visible.map(createResultCard));
    elements.resultCount.textContent = `${state.visible.length} ${state.visible.length === 1 ? 'result' : 'results'}`;
    elements.mapCount.textContent = String(state.visible.length);
    elements.empty.hidden = state.visible.length !== 0;

    if (state.selectedId && !state.visible.some((museum) => museum.id === state.selectedId)) {
      state.selectedId = null;
    }
    syncSelection();
    syncMarkers();
    fitVisibleMuseums();
  }

  function syncSelection() {
    document.querySelectorAll('[data-museum-id]').forEach((card) => {
      const selected = card.dataset.museumId === state.selectedId;
      card.classList.toggle('is-selected', selected);
      card.setAttribute('aria-pressed', String(selected));
    });
    markers.forEach(({ button }, id) => {
      const selected = id === state.selectedId;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }

  function syncMarkers() {
    const visibleIds = new Set(state.visible.map((museum) => museum.id));
    markers.forEach(({ element }, id) => {
      element.hidden = !visibleIds.has(id);
    });
  }

  function fitVisibleMuseums() {
    if (!mapReady || !state.visible.length) return;
    const bounds = new maplibregl.LngLatBounds();
    state.visible.forEach((museum) => {
      bounds.extend([museum.location.coordinates.lng, museum.location.coordinates.lat]);
    });
    map.fitBounds(bounds, {
      padding: window.innerWidth <= 760 ? 36 : 64,
      maxZoom: state.visible.length === 1 ? 7 : 5.2,
      duration: 350
    });
  }

  function selectMuseum(museum, openDetails) {
    state.selectedId = museum.id;
    syncSelection();
    if (mapReady) {
      map.easeTo({
        center: [museum.location.coordinates.lng, museum.location.coordinates.lat],
        zoom: Math.max(map.getZoom(), 5.5),
        duration: 450
      });
    }
    if (openDetails) showMuseum(museum);
  }

  function renderArtists(artists) {
    detail.artists.replaceChildren(...artists.map((artist) => createTag(artist)));
    detail.artists.hidden = artists.length === 0;
  }

  function renderWorks(works) {
    const cards = works.map((work) => {
      const card = document.createElement('article');
      card.className = 'work-card card';
      const label = document.createElement('p');
      label.className = 'fact-label';
      label.textContent = 'Notable work';
      const title = document.createElement('strong');
      title.textContent = work.title;
      const meta = document.createElement('span');
      meta.textContent = [work.artist, work.year].filter(Boolean).join(' · ');
      card.append(label, title, meta);
      return card;
    });
    detail.works.replaceChildren(...cards);
    detail.works.hidden = works.length === 0;
  }

  function financialKind(kind) {
    return {
      endowment: 'Endowment', net_assets: 'Net assets', trust_assets: 'Trust assets',
      published_collection_value: 'Published collection value'
    }[kind] || kind;
  }

  function showMuseum(museum) {
    detail.eyebrow.textContent = `Rank ${museum.rank} · Founded ${museum.institution_founded_year || 'year unavailable'}`;
    detail.title.textContent = museum.title;
    detail.admission.textContent = admissionLabel(museum);
    detail.summary.textContent = museum.collection.summary;
    detail.website.href = museum.website;
    detail.verified.textContent = `Verified ${museum.verified_at}`;
    detail['object-count'].textContent = museum.collection.object_count
      ? `${number.format(museum.collection.object_count)} works`
      : 'Count not published';
    detail.collection.textContent = museum.collection.summary;
    renderArtists(museum.collection.notable_artists);
    renderWorks(museum.collection.notable_works);
    detail['building-year'].textContent = museum.building.year_built ? `Opened ${museum.building.year_built}` : 'Year not published';
    detail['building-history'].textContent = museum.building.history;
    detail.architects.textContent = museum.building.architects.length ? museum.building.architects.join(', ') : 'Not published';
    detail.area.textContent = museum.building.square_feet ? `${number.format(museum.building.square_feet)} sq. ft.` : 'Not published';
    detail['building-scope'].textContent = museum.building.scope_note;
    detail.address.textContent = `${museum.location.address}, ${museum.location.city}, ${museum.location.state} ${museum.location.postal_code}`;
    detail.hotel.textContent = museum.nearby_hotel.name;
    detail['hotel-distance'].textContent = `${museum.nearby_hotel.distance_miles.toFixed(1)} miles straight-line distance${museum.nearby_hotel.address ? ` · ${museum.nearby_hotel.address}` : ''}`;
    detail.ranking.textContent = rankingLabel(museum);
    detail['ranking-source'].textContent = museum.ranking.source_name;

    const financial = museum.financial_value;
    detail.financialCard.hidden = !financial;
    if (financial) {
      detail.financial.textContent = `${currency.format(financial.amount_usd)} ${financialKind(financial.kind).toLocaleLowerCase()}`;
      detail['financial-note'].textContent = `${financial.year} · ${financial.basis}`;
    }

    elements.dialog.showModal();
    elements.dialog.scrollTop = 0;
    elements.close.focus();
  }

  function setMapUnavailable() {
    elements.mapStatus.textContent = 'Map unavailable';
    elements.mapFallback.hidden = false;
  }

  function createMarkers() {
    museums.forEach((museum) => {
      const element = document.createElement('div');
      element.className = 'museum-marker-anchor';
      const button = document.createElement('button');
      button.className = 'museum-marker';
      button.type = 'button';
      button.textContent = String(museum.rank);
      button.setAttribute('aria-label', `View rank ${museum.rank}, ${museum.title}`);
      button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => selectMuseum(museum, true));
      element.append(button);
      const marker = new maplibregl.Marker({ element, anchor: 'center' })
        .setLngLat([museum.location.coordinates.lng, museum.location.coordinates.lat])
        .addTo(map);
      markers.set(museum.id, { element, button, marker });
    });
  }

  function initializeMap() {
    if (!window.maplibregl || !museums.length) {
      setMapUnavailable();
      return;
    }

    try {
      map = new maplibregl.Map({
        container: 'map',
        style: 'https://tiles.openfreemap.org/styles/liberty',
        center: [-98.5795, 39.8283],
        zoom: 2.5,
        attributionControl: true
      });
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.on('load', () => {
        mapReady = true;
        createMarkers();
        syncMarkers();
        fitVisibleMuseums();
        elements.mapStatus.textContent = 'Map loaded';
        elements.mapFallback.hidden = true;
      });
      map.on('error', () => {
        if (!mapReady) setMapUnavailable();
      });
      window.setTimeout(() => {
        if (!mapReady) setMapUnavailable();
      }, 8000);
    } catch {
      setMapUnavailable();
    }
  }

  elements.search.addEventListener('input', (event) => {
    state.query = event.currentTarget.value.trim();
    renderResults();
  });

  elements.filters.forEach((button) => {
    button.addEventListener('click', () => {
      state.filter = button.dataset.filter;
      elements.filters.forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle('is-active', active);
        candidate.setAttribute('aria-pressed', String(active));
      });
      renderResults();
    });
  });

  elements.close.addEventListener('click', () => elements.dialog.close());
  elements.dialog.addEventListener('click', (event) => {
    if (event.target === elements.dialog) elements.dialog.close();
  });

  renderResults();
  initializeMap();
})();
