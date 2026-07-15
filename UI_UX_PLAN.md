# Plan d’amélioration UI/UX — CBRS

## Périmètre

Audit initial réalisé sur `site3/`, qui concentre les derniers changements publics. Vérifications effectuées en desktop (1440 × 900) et mobile (390 × 844).

Avant toute mise en production, confirmer le point d’entrée : la racine affiche actuellement un sélecteur de prototypes tandis que le site public complet est dans `site3/`.

## État de l’implémentation

- [x] Socle CSS/JS partagé chargé sur les dix pages publiques.
- [x] Cadre arrondi du hero et rail latéral bleu/vert.
- [x] Point d’entrée racine redirigé vers `site3/index.html`.
- [x] Navigation active, libellés harmonisés et `aria-current`.
- [x] Menu mobile, focus clavier et panneau Accessibilité harmonisés.
- [x] Flash Info responsive et compatible avec la réduction de mouvement.
- [x] Galerie et planning utilisables au clavier.
- [x] Formulaire d’adhésion clarifié et données reprises dans le mailto.
- [ ] API/backend à tester avec ses dépendances installées.
- [ ] Audit visuel de l’administration à finaliser.

## Direction visuelle — header et menu latéral

Retenir une approche **« cadre flottant doux »** : le bleu reste dominant, le vert reste réservé aux actions et à la rubrique active, mais les grands blocs ne touchent plus brutalement les bords de l’écran.

### Desktop

- Placer le hero dans un cadre avec une marge extérieure de 12 à 16 px et un rayon de 24 à 32 px.
- Remplacer la vague SVG par une bordure basse arrondie plus calme.
- Transformer la sidebar en rail flottant de 216 px, décalé de 12 à 16 px du bord gauche, avec un rayon de 20 à 24 px.
- Faire légèrement chevaucher la sidebar sur le bas du hero pour conserver le lien visuel entre les deux zones.
- Utiliser un dégradé discret `bleu profond → bleu clair → bleu pétrole`, une bordure blanche translucide et une ombre diffuse.
- Afficher la rubrique active dans une pastille verte intérieure, avec 10 à 12 px de marge : elle ne doit plus sortir jusqu’au bord de la sidebar.
- Conserver un mode réduit à environ 68 px, avec icônes centrées et infobulles.

### Mobile

- Conserver une barre supérieure, mais avec une marge de 8 px et un rayon de 16 px.
- Ouvrir le menu comme un panneau arrondi sous la barre, avec une ombre légère, plutôt que comme un grand rectangle collé aux bords.
- Utiliser les mêmes espacements, états actifs et couleurs que la sidebar desktop.

### Variables proposées

```css
:root {
  --blue: #0a3273;
  --blue-light: #1e4b99;
  --teal: #145c75;
  --green: #58a01a;
  --surface: #f5f7fa;
  --radius-shell: 28px;
  --radius-nav: 22px;
  --radius-item: 14px;
  --shadow-shell: 0 18px 50px rgba(10, 50, 115, .14);
}
```

Le résultat recherché est arrondi mais pas « bulle » : grands rayons sur les cadres principaux, rayons plus courts sur les éléments de navigation, et très peu d’effets décoratifs concurrents.

## Diagnostic priorisé

| Priorité | Incohérence | Correction attendue |
| --- | --- | --- |
| P0 | La cible de déploiement est ambiguë entre `/index.html` et `/site3/index.html`. | Définir `site3` comme source publique ou déplacer proprement sa version validée à la racine. |
| P0 | Le formulaire d’adhésion annonce « remplissez ce formulaire et nous vous contacterons », mais ne soumet rien. Le lien email n’inclut pas les données saisies. | Soit envoyer réellement le formulaire via une API, soit présenter clairement un formulaire à imprimer et supprimer la fausse promesse d’envoi. |
| P1 | Seules les pages Accueil et détail d’activité affichent correctement la rubrique active dans la navigation desktop. | Ajouter un état actif cohérent et `aria-current="page"` sur chaque page. |
| P1 | Le menu mobile reste annoncé avec `aria-expanded="false"` après ouverture. | Synchroniser l’état ARIA, le libellé et l’icône ; fermer avec Échap, clic extérieur et changement de page. |
| P1 | Le bandeau Flash Info est tronqué sur mobile et son défilement continu n’a ni pause ni adaptation automatique à `prefers-reduced-motion`. | Afficher un message lisible sur plusieurs lignes ou un ticker contrôlable, jamais coupé. |
| P1 | Les cartes de galerie sont cliquables uniquement à la souris ; la lightbox ne gère ni focus, ni dialogue, ni libellé du bouton fermer. | Transformer les déclencheurs en boutons/liens clavier, piéger/restaurer le focus et déclarer une boîte de dialogue accessible. |
| P1 | L’image du planning s’ouvre par `onclick` sur une image non focusable. | Utiliser un lien explicite « Agrandir le planning » accessible au clavier. |
| P1 | Le bouton Accessibilité change de taille et de position entre l’accueil et les autres pages. | Unifier le composant et sa position sur toutes les pages. |
| P1 | Header, sidebar, menu mobile, footer et options d’accessibilité sont dupliqués dans environ dix pages. Des variantes ont déjà divergé. | Extraire un shell partagé ou générer les pages depuis des fragments communs. |
| P2 | Le hero desktop est chargé : texte du visuel derrière le titre, grand logo concurrent et deux CTA dans une zone courte. | Simplifier le fond, réduire le logo et renforcer une action principale. |
| P2 | La page d’accueil mobile devient très longue, surtout avec cinq cartes journalières de planning. | Montrer aujourd’hui + prochains créneaux, puis ouvrir le planning complet à la demande. |
| P2 | Le vocabulaire varie : « Sorties - Voyages » / « Sorties & Voyages », « Inscriptions » / « Adhérer ». | Définir un lexique unique et l’appliquer à la navigation, aux titres et aux CTA. |
| P2 | Le footer « Mentions légales » renvoie vers Contact et « Vidéos » renvoie vers la galerie photo. | Créer les destinations réelles ou retirer les liens trompeurs. |
| P2 | Les filtres de galerie indiquent leur état uniquement par la couleur. | Ajouter `aria-pressed`, un état visuel non chromatique et annoncer le nombre de résultats. |
| P2 | Plusieurs textes et contenus sont codés directement dans chaque page malgré les API existantes. | Centraliser les contenus dynamiques et prévoir des états chargement, vide et erreur visibles. |

## Plan d’exécution

### Checkpoint 1 — Socle partagé

- Confirmer la cible publique (`site3`).
- Créer des styles et scripts partagés pour le header, la sidebar, le menu mobile, le footer et l’accessibilité.
- Introduire des variables de design : couleurs, espacements, rayons, ombres, typographie et focus.
- Mettre en place le cadre flottant arrondi du hero et de la navigation latérale.
- Retirer la vague décorative au profit d’une géométrie plus simple et plus nette.
- Ajouter automatiquement l’état actif selon la page courante.

Critère de validation : une modification de navigation se répercute partout sans copier-coller ; le header et la sidebar forment un ensemble cohérent sans toucher brutalement les bords du viewport.

### Checkpoint 2 — Navigation et accessibilité

- Corriger le menu mobile et ses états ARIA.
- Uniformiser le bouton et le panneau Accessibilité.
- Respecter `prefers-reduced-motion`.
- Ajouter des focus visibles, des zones tactiles d’au moins 44 px et une navigation clavier complète.
- Rendre la galerie et le planning accessibles au clavier.

Critère de validation : parcours Accueil → Activités → Planning → Adhésion réalisable au clavier en desktop et mobile.

### Checkpoint 3 — Accueil et hiérarchie visuelle

- Alléger le hero et clarifier le CTA principal.
- Repenser Flash Info pour mobile.
- Réduire la longueur du planning sur l’accueil.
- Harmoniser titres, espacements, cartes et densité des sections.
- Conserver l’identité bleu/vert et les visuels du club sans surcharger la lecture.

Critère de validation : proposition du club, activité principale et prochaine action comprises dans le premier écran.

### Checkpoint 4 — Parcours métier

- Activités : filtres/recherche simples, cartes homogènes et détails utiles.
- Planning : lecture par jour, recherche d’activité et téléchargement explicite.
- Adhésion : choisir entre soumission en ligne réelle et document imprimable assumé.
- Galerie : filtres accessibles, lightbox robuste et métadonnées cohérentes.
- Contact : rendre les personnes et moyens de contact immédiatement actionnables.

Critère de validation : chaque page possède une action principale claire et un retour utilisateur après interaction.

### Checkpoint 5 — Cohérence éditoriale et finition

- Uniformiser les libellés, titres de pages, dates, accents et capitalisation.
- Corriger ou retirer les liens trompeurs.
- Vérifier les contrastes, le zoom à 200 %, les tailles mobile et les états vides/erreur.
- Contrôler les performances des images et éviter les dépendances CDN bloquantes si nécessaire.
- Auditer ensuite l’administration avec le même système visuel.

Critère de validation : aucune rupture visuelle ou fonctionnelle entre les pages publiques.

## Retour arrière

Chaque checkpoint donnera lieu à un commit local séparé :

1. `uiux: shared shell and design tokens`
2. `uiux: navigation and accessibility`
3. `uiux: homepage hierarchy`
4. `uiux: core user journeys`
5. `uiux: editorial and responsive polish`

Le worktree permet de revenir immédiatement à `main`; les commits séparés permettront de comparer ou restaurer chaque étape sans annuler les autres.
