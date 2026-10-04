#!/usr/bin/env bash
# Installe (ou met à jour) la page d'état sur alwaysdata :
#   - fichiers statiques  -> ~/status/        (data.json, généré par la sonde, est conservé)
#   - sonde               -> ~/status-bin/collect.js
#   - site alwaysdata     -> cbrs-test.alwaysdata.net/status  (créé s'il n'existe pas)
#   - tâche planifiée     -> sonde toutes les 5 minutes       (créée si elle n'existe pas)
#
# Variables : AD_API_TOKEN (obligatoire), AD_SSH, AD_ACCOUNT, SITE_HOST, SSH_OPTS.
set -euo pipefail

: "${AD_API_TOKEN:?AD_API_TOKEN manquant (jeton API alwaysdata)}"
AD_ACCOUNT="${AD_ACCOUNT:-cbrs-test}"
AD_SSH="${AD_SSH:-${AD_ACCOUNT}@ssh-${AD_ACCOUNT}.alwaysdata.net}"
SITE_HOST="${SITE_HOST:-${AD_ACCOUNT}.alwaysdata.net}"
SSH_OPTS="${SSH_OPTS:-}"
API="https://api.alwaysdata.com/v1"
HERE="$(cd "$(dirname "$0")" && pwd)"
ADDRESS="${SITE_HOST}/status"
REMOTE_HOME="/home/${AD_ACCOUNT}"

api() { curl -fsS -u "${AD_API_TOKEN} account=${AD_ACCOUNT}:" -H 'Content-Type: application/json' "$@"; }
# shellcheck disable=SC2086
ssh_run() { ssh ${SSH_OPTS} "${AD_SSH}" "$@"; }

echo "→ fichiers"
ssh_run 'mkdir -p ~/status ~/status-bin ~/status-data'
# shellcheck disable=SC2086
rsync -rt -e "ssh ${SSH_OPTS}" "${HERE}/index.html" "${HERE}/status.css" "${HERE}/status.js" "${AD_SSH}:status/"
# shellcheck disable=SC2086
rsync -t -e "ssh ${SSH_OPTS}" "${HERE}/collect.js" "${AD_SSH}:status-bin/"

echo "→ site ${ADDRESS}"
site_id="$(api "${API}/site/" | ADDRESS="$ADDRESS" node -e '
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    const f=JSON.parse(s).find(x=>(x.addresses||[]).includes(process.env.ADDRESS));
    console.log(f?f.id:"")})')"
if [ -z "$site_id" ]; then
  api -X POST "${API}/site/" -d "{\"type\":\"static\",\"path\":\"status/\",\"addresses\":[\"${ADDRESS}\"],\"name\":\"status\",\"annotation\":\"cbrs-status\",\"max_idle_time\":1800}" -o /dev/null
  echo "  site créé"
else
  echo "  site déjà présent (id ${site_id})"
fi

echo "→ tâche planifiée"
job_id="$(api "${API}/job/" | node -e '
  let s=""; process.stdin.on("data",d=>s+=d).on("end",()=>{
    const f=JSON.parse(s).find(x=>x.annotation==="cbrs-status");
    console.log(f?f.id:"")})')"
if [ -z "$job_id" ]; then
  api -X POST "${API}/job/" -o /dev/null -d "{\"type\":\"TYPE_COMMAND\",\"argument\":\"node ${REMOTE_HOME}/status-bin/collect.js\",\"date_type\":\"FREQUENCY\",\"frequency\":5,\"frequency_period\":\"minute\",\"annotation\":\"cbrs-status\"}"
  echo "  tâche créée (toutes les 5 min)"
else
  echo "  tâche déjà présente (id ${job_id})"
fi

echo "→ première mesure"
ssh_run 'STATUS_SKIP_SYS=1 node ~/status-bin/collect.js'

echo "→ vérification"
for u in "/status/" "/status/data.json"; do
  printf '  %s -> ' "$u"
  curl -s -o /dev/null -w '%{http_code}\n' "https://${SITE_HOST}${u}"
done
