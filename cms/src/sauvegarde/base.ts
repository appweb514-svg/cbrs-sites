import { spawn } from 'node:child_process'
import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import path from 'node:path'
import { createGzip } from 'node:zlib'

import type { Env } from './executer'

// Variables d’environnement de pg_dump déduites de l’URL : le mot de passe ne passe jamais en argument.
export const envPostgres = (url: string, base: Env = process.env): Env => {
  const adresse = new URL(url)
  const env: Env = {
    PATH: base.PATH,
    HOME: base.HOME,
    PGHOST: decodeURIComponent(adresse.hostname),
    PGPORT: adresse.port || '5432',
    PGDATABASE: decodeURIComponent(adresse.pathname.replace(/^\//, '')),
  }
  if (adresse.username) env.PGUSER = decodeURIComponent(adresse.username)
  if (adresse.password) env.PGPASSWORD = decodeURIComponent(adresse.password)
  const ssl = adresse.searchParams.get('sslmode')
  if (ssl) env.PGSSLMODE = ssl
  return env
}

export const urlBase = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || ''

// Écrit la sauvegarde de la base dans `dossier` et renvoie le nom du fichier
// (base.sql.gz pour PostgreSQL, base.sqlite.gz pour SQLite).
export const sauvegarderBase = async (dossier: string): Promise<string> => {
  const url = urlBase()
  if (/^postgres(ql)?:\/\//.test(url)) {
    const nom = 'base.sql.gz'
    const enfant = spawn('pg_dump', ['--no-owner', '--no-privileges', '--format=plain'], {
      env: envPostgres(url) as NodeJS.ProcessEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    let erreur = ''
    enfant.stderr.on('data', (morceau) => (erreur = (erreur + morceau).slice(-4000)))
    const fin = new Promise<void>((resolve, reject) => {
      enfant.on('error', (e: NodeJS.ErrnoException) =>
        reject(new Error(e.code === 'ENOENT' ? '« pg_dump » n’est pas installé sur ce serveur.' : e.message)),
      )
      enfant.on('close', (code) =>
        code === 0 ? resolve() : reject(new Error(erreur.trim().split('\n').slice(-5).join(' ') || `pg_dump a échoué (code ${code}).`)),
      )
    })
    const ecriture = pipeline(enfant.stdout, createGzip(), createWriteStream(path.join(dossier, nom)))
    // pg_dump qui échoue ferme stdout : on attend les deux, l’erreur de pg_dump est la plus parlante.
    const [resultat] = await Promise.allSettled([fin, ecriture])
    if (resultat.status === 'rejected') throw resultat.reason
    await ecriture
    return nom
  }
  if (url.startsWith('file:')) {
    const nom = 'base.sqlite.gz'
    await pipeline(
      createReadStream(path.resolve(url.slice('file:'.length))),
      createGzip(),
      createWriteStream(path.join(dossier, nom)),
    )
    return nom
  }
  throw new Error('Base de données non reconnue : impossible de la sauvegarder.')
}
