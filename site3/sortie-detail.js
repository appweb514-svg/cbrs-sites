(function () {
  const isEvent = document.body.dataset.detailType === 'event';
  const records = isEvent ? window.CBRS_EVENTS : window.CBRS_OUTINGS;
  const id = new URLSearchParams(window.location.search).get('id');
  const record = records.find((item) => item.id === id);
  const fallbackImage = window.CBRS_OUTINGS_FALLBACK || 'assets-premium/header-outings-realistic-v1.png';

  const byId = (value) => document.getElementById(value);
  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  const missing = byId('detail-state');
  const layout = byId('detail-layout');

  if (!record) {
    document.title = 'Fiche introuvable - CBRS';
    layout.hidden = true;
    missing.hidden = false;
    missing.innerHTML = [
      '<div class="rounded-3xl bg-white p-8 text-center shadow-card">',
      '<p class="text-sm font-bold uppercase tracking-[.16em] text-cbrs-green">CBRS</p>',
      '<h1 class="mt-3 text-3xl font-bold text-cbrs-blue">Fiche introuvable</h1>',
      '<p class="mx-auto mt-3 max-w-xl text-gray-600">Cette fiche n’est pas disponible ou a été déplacée.</p>',
      '<a class="mt-7 inline-flex rounded-full bg-cbrs-green px-5 py-3 font-semibold text-white" href="sorties-voyages.html">Retour aux sorties</a>',
      '</div>'
    ].join('');
    return;
  }

  document.title = `${record.title} - CBRS`;
  byId('detail-kicker').textContent = record.category;
  byId('detail-title').textContent = record.title;
  byId('detail-teaser').textContent = record.teaser;
  byId('detail-description').textContent = record.description;
  byId('detail-date').textContent = record.date || 'Informations à venir';
  byId('detail-schedule').textContent = record.schedule || 'Informations à venir';
  byId('detail-location').textContent = record.location || 'Informations à venir';
  byId('detail-status').textContent = record.status || 'Informations à venir';

  const image = byId('detail-main-image');
  image.src = record.image || record.fallbackImage || fallbackImage;
  image.alt = record.title;
  image.addEventListener('error', function () {
    if (image.src.endsWith(fallbackImage)) return;
    image.src = record.fallbackImage || fallbackImage;
  });

  const itinerary = byId('detail-itinerary-link');
  if (record.coordinates) {
    const mapUrl = `https://www.openstreetmap.org/?mlat=${record.coordinates.lat}&mlon=${record.coordinates.lng}#map=14/${record.coordinates.lat}/${record.coordinates.lng}`;
    const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${record.coordinates.bbox}&layer=mapnik&marker=${record.coordinates.lat}%2C${record.coordinates.lng}`;
    const frame = byId('detail-map-frame');
    frame.dataset.cookieSrc = embedUrl;
    frame.title = `Carte de ${record.mapLabel}`;
    frame.hidden = false;
    byId('detail-map-empty').hidden = true;
    itinerary.href = mapUrl;
    itinerary.hidden = false;
  }

  const detailTypeLabel = isEvent ? 'événement' : 'sortie';
  byId('detail-breadcrumb').textContent = `Sorties & Voyages / ${detailTypeLabel}`;
  byId('detail-back-link').href = 'sorties-voyages.html';

  const canonical = byId('detail-canonical-description');
  canonical.innerHTML = [
    `<span class="font-semibold text-cbrs-blue">${escapeHtml(record.mapLabel || record.location || 'CBRS')}</span>`,
    '<span class="text-gray-500"> — une expérience à vivre avec le club.</span>'
  ].join('');
})();
