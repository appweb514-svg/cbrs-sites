# Suivi des retours client — septembre 2026

Source : `CBRS_Tableau_Suivi_Modifications.md`. Branche : `appweb514-svg/retours-client-cbrs`.

Légende : ✅ fait · 🟨 fait, contenu à fournir par le club · ❓ à préciser

| Priorité | Rubrique | Demande | Statut | Détail |
| --- | --- | --- | --- | --- |
| 🔴 | Navigation | Titre bloqué sur « ACCUEIL » | ✅ | Vercel sert les pages sans `.html` (`/activites`) ; `site3/ui-shell.js` ne reconnaissait pas ces URL et retombait sur l'accueil. Corrigé, avec un test. |
| 🔴 | Menu | « Adhérer » sous « Planning » | ✅ | Menu latéral et mobile, 15 pages. |
| 🔴 | Accueil | Bandeau : photo du Plan d'eau du Canada | ✅ | Wikimedia Commons, Chatsam, CC BY-SA 3.0 (crédit affiché). À remplacer par une photo du club si vous en avez une. |
| 🔴 | Accueil | Agrandir et repositionner le logo | ✅ | Jusqu'à 340 px, centré verticalement à droite, sans cadre. |
| 🔴 | Accueil | Même bandeau sur toutes les pages | ✅ | Même photo sur toutes les pages publiques ; le titre de chaque page reste propre à la page. |
| 🔴 | Accueil | Supprimer « Activités du club », créer « Vie du club » | ✅ | Carrousel d'activités supprimé ; section actualités renommée « Vie du club » (future zone du CMS). |
| 🔴 | Accueil | Supprimer « Cette semaine au club » | ✅ | Le bouton « Voir le planning » mène à la page Planning. |
| 🔴 | Qui sommes-nous | Présentation du bureau avec photos | 🟨 | Structure prête (4 cartes). **Noms, fonctions et photos à fournir.** |
| 🔴 | Qui sommes-nous | Chiffres : 1993, 1 200 adhérents, une vingtaine d'activités | ✅ | Texte + encadré chiffres clés. |
| 🔴 | Adhésion | Lien vers la fiche d'adhésion | 🟨 | Lien prêt : `site3/docs/CBRS_Fiche_adhesion.pdf`. **PDF à fournir** (en attendant : « bientôt disponible »). |
| 🔴 | Nouvelle rubrique | Statuts et règlement intérieur | 🟨 | Page `statuts.html` + menus + pied de page. **PDF à fournir** : `docs/CBRS_Statuts.pdf`, `docs/CBRS_Reglement_interieur.pdf`. |
| 🟠 | Accueil | « depuis 1993 » en blanc italique | ✅ | |
| 🟠 | Accueil | Couleur du logo Flash Info | ✅ | Passé en vert, couleur du club. |
| 🟠 | Qui sommes-nous | Contenu sur toute la largeur | ✅ | |
| 🟠 | Qui sommes-nous | Supprimer le pavé bleu | ✅ | Témoignage retiré. |
| 🟠 | Activités | Ordre alphabétique | ✅ | Aussi dans le formulaire d'adhésion. |
| 🟠 | Activités | Ajouter Bridge | 🟨 | Icône + fiche créées. **Horaires, lieu, référents à fournir.** |
| 🟠 | Activités | Ajouter Relaxation / Méditation | 🟨 | Fiche créée, icône **provisoire** (le crédit du générateur d'images était épuisé). **Horaires, lieu, référents à fournir.** |
| 🟠 | Activités | Ping-pong → Tennis de table | ✅ | Libellés, fiche, formation, adhésion, icône. |
| 🟠 | Activités | Supprimer les catégories sous les icônes | ✅ | |
| 🟠 | Activités | Supprimer « Légende » et « Informations » | ✅ | Ces blocs étaient sur la page Planning. |
| 🟠 | Envie de nous rejoindre | Tarifs 49 €, 28 €, 20 € | ❓ | Montants affichés (page Planning). **Libellé de chaque tarif à préciser.** L'ancienne mention « 20 € / an, accès illimité » a été retirée. |
| 🟠 | Adhérer au club | Nom complet de l'association | ✅ | « Club Beauvaisien de Retraités Sportifs » → « Club du Beauvaisis de la Retraite Sportive ». |
| 🟠 | Formation | Supprimer « bien-être » du titre | ✅ | Titre : « Formation des animateurs ». |
| 🟠 | Sorties & Voyages | Réorganiser Manifestations / Sorties / Voyages | ✅ | Trois rubriques dans cet ordre ; « Voyages » attend son contenu. |
| 🟠 | Sorties & Voyages | Contact martinelcbrs60@gmail.com | ✅ | |
| 🟠 | Liens utiles | Déclaration d'assurance | 🟨 | **PDF à fournir** : `docs/Declaration_assurance.pdf`. |
| 🟠 | Liens utiles | Imprimé fédéral | 🟨 | **PDF à fournir** : `docs/FFRS_Imprime_federal.pdf`. |
| 🟡 | Qui sommes-nous | Supprimer les « … » inutiles | ✅ | Guillemets retirés autour de la mission. |
| 🟡 | Qui sommes-nous | Ajuster accroches et slogans | ❓ | **Formulations attendues à préciser.** |
| 🟡 | Sorties & Voyages | Uniformiser les couleurs des paragraphes | ✅ | |
| 🟡 | Sorties & Voyages | Supprimer « Randonnées du jeudi » | ✅ | |
| 🟡 | Sorties & Voyages | Supprimer « Envie de participer » | ✅ | |
| ✅ | Galerie | Validée | — | Aucune modification. |

## Documents à déposer

Déposer les PDF dans `site3/docs/` sous ces noms exacts ; les liens s'activent tout seuls.

- `CBRS_Fiche_adhesion.pdf`
- `CBRS_Statuts.pdf`
- `CBRS_Reglement_interieur.pdf`
- `Declaration_assurance.pdf`
- `FFRS_Imprime_federal.pdf`

## Vérification

- `node scripts/check-cbrs-ui.mjs` : contenus supprimés ou ajoutés, tri alphabétique, ordre du menu, bandeau commun, détection de la page active avec les URL propres.
- Vérification dans le navigateur (1440 px et 390 px) : aucune erreur console sur les 15 pages, bon onglet actif sur chacune.
