const settings = require('../_data/settings');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=3600');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ settings });
};
