# CMS CBRS — image de production (serveur Next standalone + CLI payload pour les migrations).
# Construire depuis le dossier cms/ : docker build -t cbrs-cms .

FROM node:22.17.0-alpine AS base

# Dépendances (devDependencies incluses : le CLI payload en a besoin pour les migrations)
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Les navigateurs Playwright (tests e2e) ne sont jamais utilisés dans l'image.
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
COPY package.json package-lock.json .npmrc ./
RUN npm ci

# Compilation (next build, sortie standalone)
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# URL factice : la compilation n'établit aucune connexion,
# mais l'adaptateur PostgreSQL doit être sélectionné à l'image de la production.
ENV DATABASE_URL=postgres://build:build@127.0.0.1:5432/build \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Image d'exécution
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Serveur standalone (server.js + fichiers tracés)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# CLI payload, sources TypeScript et migrations : nécessaires à `payload migrate` au démarrage
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json /app/tsconfig.json ./
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Médias envoyés par les bénévoles (monter un volume Docker dessus)
RUN mkdir -p /app/media && chown nextjs:nodejs /app/media
VOLUME /app/media

USER nextjs
EXPOSE 3000

# Les migrations en attente sont appliquées à chaque démarrage (opération idempotente),
# puis le serveur démarre.
CMD ["sh", "-c", "node_modules/.bin/payload migrate && node server.js"]
