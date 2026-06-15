const photos = require('../_data/photos.json');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { year, category } = req.query;
  let filtered = photos;
  if (year) filtered = filtered.filter(p => p.year === year);
  if (category) filtered = filtered.filter(p => p.category === category);
  res.status(200).json({ photos: filtered });
};
