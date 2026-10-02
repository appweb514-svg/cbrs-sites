# Journal

- 2026-10-02 | reprise Claude | Session 1432d663-8427-405f-8cf9-82f20a2cd918, dernier « go » : réglage Vercel puis Voir la page et pictogrammes libres. Worktree cms-publication-navigation depuis main 7a555b5.
- 2026-10-02 | Vercel | autoAssignCustomDomains réactivé via API et confirmé par relecture. Domaine déjà attaché au projet, rootDirectory=cms, productionBranch=main. Formation en ligne : API 200, 3 étapes/6 cartes, page publique 200.
- 2026-10-02 | implémentation | Voir la page sur les 5 globals ; cartes Formation avec image Media facultative, types/importMap/migration PostgreSQL et snapshot.
- 2026-10-02 | vérification | 78 tests d’intégration (14 fichiers) et 4 tests des routes passent. TypeScript passe. Lint : 0 erreur, 2 avertissements préexistants. Revue indépendante : aucun blocage. Bug existant de préparation de tests corrigé : mkdir documents avant scandir.
- 2026-10-02 | navigateur local | Téléversement réel depuis Formation → sauvegarde → image servie et chargée sur la carte publique ; retrait + sauvegarde → retour au pictogramme d’origine. Voir la page vérifié (bonne URL locale, nouvel onglet). Base SQLite jetable ; aucune édition du contenu de production.
- 2026-10-02 | build | Build de production Next.js terminé avec succès sur configuration SQLite locale jetable. Migration PostgreSQL générée et revue, non exécutée sur la base de production.
