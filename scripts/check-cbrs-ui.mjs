import assert from 'node:assert/strict';
import fs from 'node:fs';

const dataPath = 'site3/sorties-data.js';
assert(fs.existsSync(dataPath), 'sorties-data.js doit exister');

const data = fs.readFileSync(dataPath, 'utf8');
for (const token of ['CBRS_OUTINGS', 'CBRS_EVENTS', 'fallbackImage', 'coordinates']) {
  assert(data.includes(token), `contrat absent: ${token}`);
}

console.log('PASS — contrat sorties/événements');
