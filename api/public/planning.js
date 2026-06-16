const activities = require('../_data/planning-full');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ activities });
};
