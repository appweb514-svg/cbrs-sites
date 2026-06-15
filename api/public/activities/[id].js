const activities = require('../../_data/activities');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;
  const activity = activities.find(a => a.id === id && a.published);
  if (!activity) {
    return res.status(404).json({ error: 'Activité introuvable' });
  }
  res.status(200).json({ activity });
};
