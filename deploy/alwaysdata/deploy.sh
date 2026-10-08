#!/usr/bin/env bash
# Déploie le site de test CBRS sur alwaysdata (compte cbrs-test) : site statique, JSON de l'API
# publique et CMS Payload. Sans effet sur Vercel (production).
#
# Usage : deploy/alwaysdata/deploy.sh [static|api|cms|all]     (défaut : all)
#
# Variables (aucun secret dans le dépôt) :
#   AD_API_TOKEN   jeton API alwaysdata (redémarrage du site Node)            [cms]
#   AD_SSH         utilisateur@hôte SSH      (défaut cbrs-test@ssh-cbrs-test.alwaysdata.net)
#   AD_ACCOUNT     compte alwaysdata         (défaut cbrs-test)
#   AD_CMS_SITE    identifiant du site Node  (défaut 1083477)
#   SITE_URL       origine publique          (défaut https://cbrs-test.alwaysdata.net)
#   SSH_OPTS       options ssh/rsync supplémentaires (ex. -i ~/.ssh/cbrs_deploy)
# La connexion SSH se fait par clé (voir deploy/alwaysdata/README.md).
set -euo pipefail

TARGET="${1:-all}"
REPO="$(cd "$(dirname "$0")/../.." && pwd)"
AD_SSH="${AD_SSH:-cbrs-test@ssh-cbrs-test.alwaysdata.net}"
AD_ACCOUNT="${AD_ACCOUNT:-cbrs-test}"
AD_CMS_SITE="${AD_CMS_SITE:-1083477}"
SITE_URL="${SITE_URL:-https://cbrs-test.alwaysdata.net}"
SSH_OPTS="${SSH_OPTS:-}"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

# shellcheck disable=SC2086
ssh_run() { ssh $SSH_OPTS -o StrictHostKeyChecking=accept-new "$AD_SSH" "$@"; }
# shellcheck disable=SC2086
sync_to() { rsync -az "$@"; }
RSH="ssh $SSH_OPTS -o StrictHostKeyChecking=accept-new"

pages() { (cd "$REPO/site3" && for f in *.html; do printf '%s\n' "${f%.html}"; done) | paste -sd'|' -; }

deploy_static() {
  echo "== site statique"
  mkdir -p "$STAGE/www"
  rsync -a --exclude .gitignore --exclude vercel.json "$REPO/site3/" "$STAGE/www/"
  # Une seule origine : le CMS est servi par le même nom d'hôte.
  grep -rl "https://cbrs-cms.vercel.app" "$STAGE/www" --include='*.html' --include='*.js' \
    | xargs -r sed -i.bak "s#https://cbrs-cms.vercel.app#$SITE_URL#g"
  # La page d'accueil est servie à la racine (sur Vercel, par une réécriture vers /site3/).
  sed -i.bak 's#<base href="/site3/"/>#<base href="/"/>#' "$STAGE/www/index.html"
  find "$STAGE/www" -name '*.bak' -delete
  sed "s#@PAGES@#$(pages)#g" "$REPO/deploy/alwaysdata/htaccess-site" > "$STAGE/www/.htaccess"
  sync_to --delete -e "$RSH" "$STAGE/www/" "$AD_SSH:www/"
}

deploy_api() {
  echo "== API publique (JSON statiques)"
  node "$REPO/deploy/alwaysdata/gen-public-api.cjs" "$REPO" "$STAGE/api"
  cp "$REPO/deploy/alwaysdata/htaccess-api" "$STAGE/api/api/public/.htaccess"
  sync_to --delete -e "$RSH" "$STAGE/api/api/public/" "$AD_SSH:api-public/"
}

deploy_cms() {
  echo "== CMS"
  : "${AD_API_TOKEN:?AD_API_TOKEN requis pour redémarrer le CMS}"
  # Ni next build ni npm ci ne tiennent dans la mémoire du compte alwaysdata (processus tué) :
  # on construit ici (CI Linux ou poste), puis on envoie le résultat.
  (cd "$REPO/cms" && npm ci --no-audit --no-fund \
     && NEXT_PUBLIC_CBRS_SITE_URL="$SITE_URL" npm run build)
  sync_to --delete -e "$RSH" \
    --exclude node_modules --exclude .next --exclude .env --exclude media --exclude tests --exclude .lock-sha \
    "$REPO/cms/" "$AD_SSH:cms/"
  sync_to --delete -e "$RSH" --exclude cache --exclude standalone "$REPO/cms/.next/" "$AD_SSH:cms/.next/"

  # node_modules : envoyé seulement si package-lock.json a changé (marqueur sur le serveur).
  local sha remote_sha nm_dir="$REPO/cms/node_modules"
  sha="$(shasum -a 256 "$REPO/cms/package-lock.json" | cut -d' ' -f1)"
  remote_sha="$(ssh_run 'cat ~/cms/.lock-sha 2>/dev/null || true')"
  if [ "$sha" != "$remote_sha" ]; then
    if [ "$(uname -s)" != "Linux" ]; then
      # Modules natifs (sharp, libsql, swc…) : ceux d'un Mac ne fonctionnent pas sur le serveur.
      nm_dir="$STAGE/nm/node_modules"; mkdir -p "$STAGE/nm"
      cp "$REPO/cms/package.json" "$REPO/cms/package-lock.json" "$STAGE/nm/"
      docker run --rm --platform linux/amd64 -v "$STAGE/nm:/app" -w /app \
        -e PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 node:24-bookworm-slim npm ci --no-audit --no-fund
    fi
    echo "node_modules : envoi (package-lock.json modifié)"
    sync_to --delete -e "$RSH" "$nm_dir/" "$AD_SSH:cms/node_modules/"
    ssh_run "echo $sha > ~/cms/.lock-sha"
  fi
  ssh_run 'cd ~/cms && npm run migrate'
  curl -fsS -X POST -u "$AD_API_TOKEN account=$AD_ACCOUNT:" \
    "https://api.alwaysdata.com/v1/site/$AD_CMS_SITE/restart/" -o /dev/null
  echo "CMS redémarré"
}

case "$TARGET" in
  static) deploy_static ;;
  api)    deploy_api ;;
  cms)    deploy_cms ;;
  all)    deploy_static; deploy_api; deploy_cms ;;
  *) echo "usage: $0 [static|api|cms|all]" >&2; exit 1 ;;
esac

echo "== vérification"
for p in / /planning /api/public/planning /admin/; do
  printf '%s %s\n' "$(curl -s -o /dev/null -m 60 -w '%{http_code}' "$SITE_URL$p")" "$p"
done
