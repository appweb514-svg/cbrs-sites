/**
 * commons-search.js
 * Recherche de photos sur Wikimedia Commons via l'API officielle.
 *
 * Usage back-end (route Express) :
 *   const { searchCommonsPhotos } = require('./services/commons-search');
 *   const results = await searchCommonsPhotos('Dieppe', { limit: 12 });
 *
 * Usage CLI :
 *   node services/commons-search.js "Baie de Somme" --limit 8
 *
 * Retour par résultat :
 *   {
 *     title,            // titre du fichier (File:...)
 *     commonsUrl,       // page de description sur Commons
 *     thumbUrl,         // URL JPG 640px (aperçu léger)
 *     fileUrl,          // URL du fichier original
 *     width, height,    // dimensions de l'original
 *     license, artist,  // crédits (depuis ExtMetadata)
 *     safeName          // nom de fichier sûr pour sauvegarde locale
 *   }
 */

const API_URL = 'https://commons.wikimedia.org/w/api.php';

/**
 * Interroge l'API Commons et renvoie une liste de photos exploitables.
 * @param {string} query  - recherche libre (lieu, thème…)
 * @param {object} opts   - { limit (défaut 10), width (aperçu, défaut 640) }
 */
async function searchCommonsPhotos(query, opts = {}) {
  const limit = Math.min(opts.limit || 10, 50);
  const thumbWidth = opts.width || 640;

  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6', // File:
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: String(thumbWidth)
  });
  params.set('origin', '*');

  const res = await fetch(`${API_URL}?${params}`);
  if (!res.ok) throw new Error(`Wikimedia Commons: HTTP ${res.status}`);
  const json = await res.json();

  const pages = (json.query && json.query.pages) || {};
  const results = Object.values(pages)
    .filter((p) => p.imageinfo && p.imageinfo.length)
    .map((p) => {
      const ii = p.imageinfo[0];
      const meta = ii.extmetadata || {};
      const license = (meta.LicenseShortName && meta.LicenseShortName.value) || '';
      const rawArtist = (meta.Artist && meta.Artist.value) || '';
      const artist = rawArtist.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

      let safeName = (p.title || 'commons-image').replace(/^File:/, '').replace(/\.[^.]+$/, '');
      safeName = safeName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'commons-image';

      return {
        title: p.title,
        commonsUrl: ii.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(p.title)}`,
        thumbUrl: ((ii.thumburl) || ii.url).split('?')[0],
        fileUrl: ii.url.split('?')[0],
        width: ii.width,
        height: ii.height,
        license,
        artist,
        safeName
      };
    });

  return results;
}

module.exports = { searchCommonsPhotos };

/* CLI : node services/commons-search.js "query" [--limit N] [--width N] */
if (require.main === module) {
  const [, , query, ...flags] = process.argv;
  if (!query) {
    console.error('Usage : node services/commons-search.js "requête" [--limit N] [--width N]');
    process.exit(1);
  }
  const opts = {};
  for (let i = 0; i < flags.length; i += 2) {
    if (flags[i] === '--limit') opts.limit = Number(flags[i + 1]);
    if (flags[i] === '--width') opts.width = Number(flags[i + 1]);
  }
  searchCommonsPhotos(query, opts)
    .then((results) => {
      console.log(`${results.length} résultat(s) pour « ${query} » :\n`);
      for (const r of results) {
        console.log(`- ${r.title}`);
        console.log(`  ${r.width}x${r.height} | ${r.license} | ${r.artist || 'auteur inconnu'}`);
        console.log(`  aperçu : ${r.thumbUrl}`);
        console.log(`  fiche  : ${r.commonsUrl}\n`);
      }
    })
    .catch((err) => {
      console.error('Erreur :', err.message);
      process.exit(1);
    });
}