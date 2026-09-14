# VISION — CBRS

## Produit

Site web du **Club du Beauvaisis de la Retraite Sportive (CBRS)**, association loi 1901
affiliée FFRS et au CODERS de l'Oise, fondée en 1977. Site vitrine public + back-office
pour administrer les contenus sans toucher aux fichiers HTML.

## Utilisateurs

- **Visiteurs / adhérents** : consultent activités, planning, sorties, galerie, infos pratiques.
- **Webmaster / administrateur** : gère activités, flash info, planning, galerie, paramètres,
  utilisateurs (admin + formateurs).
- **Formateur** : ne modifie que les activités qui lui sont attribuées
  (table `activity_permissions`).

## Objectifs

- Supprimer l'édition manuelle des pages HTML pour les contenus courants.
- Rendre le site public autonome (fallback statique si l'API est indisponible).
- Gérer les photos de sorties avec crédit libre de droits (Wikimedia Commons).
- Isoler la mémoire projet (ce dossier `.project/` + CodeGraph) pour les agents.

## Hors périmètre (à ce stade)

- Page-builder / CMS généraliste.
- Comptes adhérents publics (seuls admin et formateurs se connectent).
- Paiement en ligne.
- Multi-langue (idée non engagée, ROADMAP P4).
