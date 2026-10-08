# Page d'état — `https://cbrs-test.alwaysdata.net/status/`

Page simple : disponibilité du site et du CMS sur 30 jours, charge CPU et RAM.

- `collect.js` : sonde sans dépendance (Node ≥ 18). Toutes les 5 minutes (tâche planifiée alwaysdata) elle
  appelle `/` (site) et `/api/users/me` (CMS : réponse JSON de Payload, donc Next et la base répondent),
  lit `/proc/loadavg` et `/proc/meminfo`, ajoute une ligne à `~/status-data/samples.jsonl` (30 jours conservés)
  et régénère `~/status/data.json`.
- `index.html`, `status.css`, `status.js` : page statique qui lit `data.json`.
- `deploy.sh` : installe tout, de façon idempotente (fichiers, site alwaysdata `/status`, tâche planifiée).

```bash
AD_API_TOKEN=... SSH_OPTS="" bash status/deploy.sh   # clé SSH requise (ou SSH_ASKPASS)
```

## Limites connues

- Pas de domaine dédié : un compte alwaysdata n'a qu'une adresse `*.alwaysdata.net`, la page est donc sur le chemin `/status`.
- La sonde tourne sur le serveur qu'elle surveille : une panne totale de l'hébergement se voit comme un trou
  dans les mesures (case grise), pas comme un échec. Pour un vrai suivi externe, ajouter une sonde tierce.
- La sonde appelle le CMS toutes les 5 minutes : il n'est donc jamais inactif et le démarrage à froid n'est pas mesuré.
- CPU/RAM : valeurs vues depuis la tâche planifiée (ressources du compte d'hébergement), pas celles d'une session SSH.
- Disponibilité = mesures réussies / mesures reçues (les trous ne comptent ni en positif ni en négatif).
