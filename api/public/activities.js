const activities = require('../_data/activities');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const published = activities.filter(a => a.published);
  res.status(200).json({ activities: published });
};
