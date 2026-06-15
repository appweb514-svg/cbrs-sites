const path = require('path');
const express = require('express');
const session = require('express-session');
const authRoutes = require('./src/routes/auth');
const publicRoutes = require('./src/routes/public');
const activityRoutes = require('./src/routes/activities');
const flashRoutes = require('./src/routes/flash');
const galleryRoutes = require('./src/routes/gallery');
const settingsRoutes = require('./src/routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '1mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'cbrs-dev-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: false }
}));

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin/activities', activityRoutes);
app.use('/api/admin/flash-info', flashRoutes);
app.use('/api/admin/gallery', galleryRoutes);
app.use('/api/admin/settings', settingsRoutes);

app.use('/admin', express.static(path.join(__dirname, 'public-admin')));
app.use('/', express.static(path.join(__dirname, '..', 'site3')));

app.listen(PORT, () => {
  console.log(`CBRS CMS running on http://127.0.0.1:${PORT}`);
  console.log(`Admin: http://127.0.0.1:${PORT}/admin/login.html`);
});
