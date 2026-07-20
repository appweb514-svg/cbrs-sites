# CBRS — Suite d’améliorations UI/UX

## Objectif

Harmoniser les pages éditoriales du site CBRS autour d’une même expérience :
des contenus mieux hiérarchisés, des cartes plus engageantes, des accès
clairs vers les détails et une présentation cohérente sur desktop comme sur
mobile.

Le périmètre validé couvre six surfaces :

- sorties et voyages ;
- journées et événements ;
- galerie photo ;
- liens utiles ;
- contact ;
- accueil, carrousel d’activités et Flash Info.

## Principes de conception

- Conserver les couleurs CBRS existantes : bleu profond, bleu clair, vert et
  touches turquoise.
- Réutiliser les formes déjà présentes : grands rayons, cartes blanches,
  ombres douces et titres Manrope/Playfair.
- Privilégier le contenu réel et afficher un état explicite lorsqu’une
  information manque plutôt que d’inventer une date, un horaire ou un lieu.
- Garder les contrôles accessibles au clavier et les alternatives textuelles.
- Prévoir un rendu lisible sur mobile, sans débordement horizontal non
  intentionnel.

## Sorties et événements

### Architecture

Les cartes de `sorties-voyages.html` deviennent des liens vers deux gabarits
réutilisables :

- `sortie.html?id=<identifiant>` pour les sorties à la journée ;
- `evenement.html?id=<identifiant>` pour les journées et événements.

Les contenus sont centralisés dans un module de données local. Chaque entrée
contient au minimum :

- identifiant stable ;
- titre, catégorie et accroche ;
- image principale et image de secours ;
- lieu et coordonnées lorsqu’ils sont confirmés ;
- date et horaires lorsqu’ils sont connus ;
- description courte et description détaillée ;
- statut des informations pratiques.

Le gabarit sélectionne automatiquement l’image associée au lieu et utilise
l’image de secours si le fichier principal est absent. Les champs non
confirmés affichent « Informations à venir ».

### Fiche détaillée

Chaque fiche reprend la logique des fiches d’activités :

1. hero visuel avec titre, catégorie et accroche ;
2. colonne principale avec photo, présentation et informations pratiques ;
3. colonne latérale avec lieu, horaires, carte OSM protégée par le consentement
   cookies et boutons d’itinéraire/planning quand disponibles ;
4. CTA de retour vers la liste et CTA d’adhésion ;
5. état de repli explicite si l’identifiant n’existe pas.

### Page liste

- Les sorties restent organisées en grille de cartes compactes.
- Les événements deviennent des cartes cliquables avec date, catégorie,
  accroche et action « Voir la fiche ».
- La section « Randonnées du jeudi » reçoit un fond vert très léger, une icône
  de randonnée et une hiérarchie plus forte sans détourner l’attention des
  cartes.

## Galerie photo

La description technique du panneau de filtrage est remplacée par :

> Revivez les moments qui nous rassemblent : sorties, activités, sourires et
> souvenirs partagés.

Le changement reste éditorial et ne modifie ni le filtrage ni la galerie
lightbox.

## Liens utiles

La page devient un annuaire visuel :

- introduction : « Les partenaires et ressources qui accompagnent la vie du
  club. » ;
- regroupement par catégories : Fédération & encadrement, Collectivités
  locales, Sorties & tourisme, Ressources sportives ;
- cartes blanches avec logos plus visibles, badge de catégorie, description
  courte et action explicite « Visiter le site ↗ » ;
- grille en trois colonnes sur desktop et liste verticale lisible sur mobile ;
- états hover/focus homogènes avec les autres cartes du site.

## Contact

Dans la colonne « Nous contacter » :

- le titre reste sur le fond général, hors carte ;
- l’e-mail, la référence Sorties & Voyages et la permanence sont regroupés
  dans un encadré blanc arrondi avec ombre légère ;
- la carte « Nous trouver » conserve sa structure et son adresse ;
- le titre et la carte restent empilés dans le même ordre sur mobile.

## Accueil

### Carrousel d’activités

- le cadre interne des logos devient blanc uniforme ;
- la bordure et l’ombre sont discrètes afin d’éviter l’effet « carré blanc
  dans un cadre » ;
- le zoom au survol reste appliqué à l’image uniquement ;
- le drag existant et le curseur `grab` sont conservés.

### Flash Info

- le logo passe à environ `9rem` maximum sur desktop ;
- la taille mobile passe à environ `6.2rem` ;
- la hauteur de la barre et le texte défilant restent inchangés ;
- le logo conserve son ombre et son animation douce.

## Données et erreurs

- Aucun contenu factuel non confirmé ne doit être présenté comme définitif.
- Une image absente utilise une image de secours et un texte alternatif
  cohérent.
- Une fiche inconnue affiche un état « sortie introuvable » avec un lien de
  retour vers la liste.
- Les cartes externes utilisent `target="_blank"` avec `rel="noopener"`.
- Les cartes OSM restent soumises au consentement déjà géré par le shell.

## Validation

La validation doit couvrir :

- présence des liens et résolution des identifiants ;
- sélection automatique de l’image et fallback ;
- rendu desktop, mobile et sidebar réduite ;
- navigation clavier des cartes et CTA ;
- carte externe bloquée avant consentement puis disponible après consentement ;
- absence d’erreur console sur les pages concernées ;
- vérification visuelle locale via le serveur statique.

## Hors périmètre

- remplacement complet du système de données par un CMS ;
- géocodage automatique en production ;
- collecte de nouvelles photos sans validation éditoriale ;
- refonte de la sidebar ou du header déjà stabilisés.
