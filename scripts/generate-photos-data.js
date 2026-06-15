const fs = require('fs');
const path = require('path');

const photosDir = path.resolve(__dirname, '..', 'site3', 'photos');
const outFile = path.resolve(__dirname, '..', 'api', '_data', 'photos.json');

if (!fs.existsSync(photosDir)) {
  console.error('Photos dir not found:', photosDir);
  process.exit(1);
}

const files = fs.readdirSync(photosDir)
  .filter(f => /\.(jpe?g|png|webp|gif)$/i.test(f))
  .sort();

const categories = ['sport', 'sortie', 'vie'];
const photos = files.map((filename, i) => {
  const num = parseInt((filename.match(/(\d+)/) || [, 0])[1], 10);
  let year = '2024';
  if (num <= 30) year = '2023';
  else if (num <= 80) year = '2024';
  else if (num <= 115) year = '2025';
  else year = '2026';
  const category = categories[i % categories.length];
  return {
    id: i + 1,
    filename,
    url: `photos/${filename}`,
    year,
    category,
    caption: `CBRS ${year}`,
    sort_order: i
  };
});

fs.writeFileSync(outFile, JSON.stringify(photos, null, 2));
console.log(`Generated ${photos.length} photos -> ${outFile}`);
