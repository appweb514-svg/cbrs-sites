import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataPath = 'site3/sorties-data.js';
assert(fs.existsSync(dataPath), 'sorties-data.js doit exister');

const data = fs.readFileSync(dataPath, 'utf8');
for (const token of ['CBRS_OUTINGS', 'CBRS_EVENTS', 'fallbackImage', 'coordinates']) {
  assert(data.includes(token), `contrat absent: ${token}`);
}

console.log('PASS — contrat sorties/événements');

for (const file of ['site3/sortie.html', 'site3/evenement.html']) {
  assert(fs.existsSync(file), `${file} doit exister`);
  const html = fs.readFileSync(file, 'utf8');
  for (const token of [
    'sorties-data.js',
    'Informations à venir',
    'sorties-voyages.html',
    'data-cookie-src',
    'mapLabel'
  ]) {
    assert(html.includes(token), `${file}: ${token} absent`);
  }
}

console.log('PASS — gabarits sorties/événements');

const expectations = [
  ['site3/galerie.html', 'Revivez les moments qui nous rassemblent'],
  ['site3/liens-utiles.html', 'Les partenaires et ressources qui accompagnent'],
  ['site3/liens-utiles.html', 'Visiter le site'],
  ['site3/contact.html', 'contact-panel-card'],
  ['site3/sorties-voyages.html', 'Randonnées du jeudi']
];

for (const [file, token] of expectations) {
  assert(fs.readFileSync(file, 'utf8').includes(token), `${file}: ${token} absent`);
}

console.log('PASS — contenu UI/UX');
