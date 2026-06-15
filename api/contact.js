module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Champs requis: name, email, message' });
  }

  console.log('[contact] Nouveau message:', { name, email, subject, message });

  return res.status(200).json({
    status: 'ok',
    message: 'Votre message a bien été reçu. Nous vous répondrons rapidement.',
    received_at: new Date().toISOString()
  });
};
