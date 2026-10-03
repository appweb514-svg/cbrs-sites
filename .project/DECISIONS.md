# Décisions

## 2026-10-02 — reprise des améliorations CMS validées avec Claude

Contexte : la dernière conversation se termine sur « go » après la proposition de corriger Vercel, puis d’ajouter Voir la page et des pictogrammes libres.

- Domaine CMS : l’API Vercel confirme qu’il est déjà associé à `cbrs-cms`, racine `cms`, branche `main`, mais `autoAssignCustomDomains=false`. Option réactivée et relue à `true` ; aucune suppression de domaine nécessaire.
- Les cinq globals affichent Voir la page vers le site public dans un nouvel onglet. `NEXT_PUBLIC_CBRS_SITE_URL` permet de viser un site local ou une autre installation. Il faut enregistrer avant de voir les changements.
- Formation : champ facultatif `cartes[].image` vers Media, prioritaire sur `icone`. Le retrait rétablit le pictogramme ; sans image ni pictogramme, la carte garde son texte. Migration additive sur la collection et son historique ; droits inchangés.

Conséquences : les prochains déploiements de production peuvent reprendre automatiquement le domaine. Le code des deux fonctions d’édition est livré par PR ; la migration doit être appliquée avant l’utilisation de ce schéma en production.
