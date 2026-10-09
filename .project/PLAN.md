# Reprise Claude — 2026-10-09

Consigne : ne plus travailler sur Vercel ; développer et vérifier sur alwaysdata (https://cbrs-test.alwaysdata.net).

## Chantier 1 — Modifs client du 29/09 (branche `claude/modifs-client-2026-09-29`)

- [x] Retirer « et au CODERS de l'Oise » (Qui sommes-nous + pied de page des 16 pages + api/_data/settings.js).
- [x] Bridge sur la fiche Échecs : cms-client.js n'abandonne plus une réponse CMS lente (texte de secours resté affiché).
- [x] Aligner les textes de secours statiques « Échecs / Bridge » (activite.html, planning.html, api/_data, seed) → fiche 12 renommée « Échecs », slugs inchangés.
- [x] Barre de cookies : active et fonctionnelle (vérifiée sur alwaysdata).
- [x] Cartes : après consentement la carte restait masquée (`display:flex` l'emportait sur `[hidden]`) → corrigé dans ui-shell.css.
- [x] Nouveau logo (lettres en rouge) : détourer le fond beige, remplacer logo-cbrs.png partout ; demander au client un PNG/SVG HD (source actuelle 584 px).
- [x] Refaire le détourage des pictogrammes d'activités (01…16, flash-info-emblem) dans site3/ ; reste à remplacer ceux de la médiathèque du CMS alwaysdata.
- [x] Adhérer : rendre l'ajout de la fiche d'adhésion visible dans le CMS (description / raccourci) + procédure client.
- [ ] Formation : indiquer au client où se trouve l'onglet dans le CMS.
- [ ] « 1993 ettet » : correction côté client dans Paramètres → « Club fondé en ».
- [ ] Données : le CMS alwaysdata est un seed ; migrer le contenu saisi par le client (Neon/Vercel) vers alwaysdata — à valider.
- [ ] Déployer la branche sur alwaysdata, vérifier, PR vers main, compte rendu client.

## Chantier 2 — Sauvegardes site + CMS (branche dédiée, après le chantier 1)

- [ ] Page d'administration Payload « Sauvegardes » : sauvegarde manuelle (base + médias + site) et liste des sauvegardes.
- [ ] Restauration d'une sauvegarde choisie depuis l'admin (avec confirmation et sauvegarde de sécurité préalable).
- [ ] Sauvegarde automatique sur le serveur alwaysdata (SSH) : rétention quotidienne 7 jours + 1 semaine, 1 mois, 6 mois.
- [ ] Copie externe facultative : Google Drive et bucket S3, automatique, configurable depuis l'admin.
- [ ] Tests de restauration, documentation, PR.
