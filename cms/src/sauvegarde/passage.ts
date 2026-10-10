import { mkdir, open, readdir, rename, rm, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

import type { Payload } from 'payload'

import { CONTEXTE_BRUT } from '../fields/champSecret'
import { sauvegarderBase } from './base'
import { dossierSauvegardes, sources } from './chemins'
import { ecrireEtat, type Etat } from './etat'
import { aPurger, estNomInstantane, nomInstantane } from './purge'
import { EXTERNE_ACTIF, dossierDistant, racineDistante, rclone, verifierExterne, type Externe } from './rclone'
import { executer } from './executer'

const VERROU_PERIME_MS = 6 * 3_600_000

// Verrou par fichier : un seul passage à la fois. Un verrou de plus de 6 h est considéré abandonné.
const prendreVerrou = async (dossier: string): Promise<(() => Promise<void>) | null> => {
  const chemin = path.join(dossier, '.verrou')
  await mkdir(dossier, { recursive: true })
  for (let essai = 0; essai < 2; essai++) {
    try {
      const fichier = await open(chemin, 'wx')
      await fichier.writeFile(`${process.pid} ${new Date().toISOString()}`)
      await fichier.close()
      return () => unlink(chemin).catch(() => undefined)
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e
      const age = Date.now() - (await stat(chemin).catch(() => ({ mtimeMs: 0 }))).mtimeMs
      if (age < VERROU_PERIME_MS) return null
      await unlink(chemin).catch(() => undefined)
    }
  }
  return null
}

const tailleDe = async (dossier: string): Promise<number> => {
  let total = 0
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = path.join(dossier, entree.name)
    if (entree.isDirectory()) total += await tailleDe(chemin)
    else if (entree.isFile()) total += (await stat(chemin)).size
  }
  return total
}

export type Reglages = { conservationJours: number; externe?: Externe }

export const lireReglages = async (payload: Payload): Promise<Reglages & { actif: boolean; jour: number; heure: number }> => {
  const parametres = await payload.findGlobal({
    slug: 'parametres',
    depth: 0,
    overrideAccess: true,
    context: { [CONTEXTE_BRUT]: true },
  })
  const s = parametres.sauvegarde
  return {
    actif: s?.actif !== false,
    jour: Number(s?.jour ?? 0),
    heure: s?.heure ?? 3,
    conservationJours: Math.max(7, s?.conservationJours ?? 90),
    externe: s?.externe ?? undefined,
  }
}

// Instantané local : rsync -a --delete --link-dest (fichiers inchangés = liens physiques) + base du jour.
export const creerInstantane = async (payload: Payload, dossier: string, conservationJours: number) => {
  const existants = (await readdir(dossier)).filter(estNomInstantane).sort()
  const precedent = existants.at(-1)
  const nom = nomInstantane(new Date())
  const cible = path.join(dossier, nom)
  const travail = path.join(dossier, `.en-cours-${nom}`)
  await rm(travail, { recursive: true, force: true })
  await mkdir(travail, { recursive: true })
  try {
    for (const { nom: sousDossier, chemin } of sources(payload)) {
      const args = ['-a', '--delete']
      if (precedent) args.push(`--link-dest=${path.join(dossier, precedent, sousDossier)}`)
      await executer('rsync', [...args, `${chemin}/`, `${path.join(travail, sousDossier)}/`])
    }
    await sauvegarderBase(travail)
    if (existants.includes(nom)) throw new Error(`L’instantané ${nom} existe déjà (deux passages dans la même minute).`)
    await rename(travail, cible)
  } catch (e) {
    await rm(travail, { recursive: true, force: true })
    throw e
  }
  // Purge locale : jamais le plus récent.
  const aSupprimer = aPurger([...existants, nom], new Date(), conservationJours)
  for (const ancien of aSupprimer) await rm(path.join(dossier, ancien), { recursive: true, force: true })
  return { nom, chemin: cible, taille: await tailleDe(cible) }
}

const lister = async (externe: Externe, sousDossier: string, dossiersSeulement: boolean): Promise<string[]> => {
  try {
    const sortie = await rclone(externe, ['lsf', ...(dossiersSeulement ? ['--dirs-only'] : ['--files-only']), `${racineDistante(externe)}/${sousDossier}`], { sortie: true })
    return sortie.split('\n').map((l) => l.trim()).filter(Boolean)
  } catch (e) {
    // Dossier pas encore créé : rien à purger.
    if (/not found/i.test((e as Error).message)) return []
    throw e
  }
}

// Envoi : courant (miroir) + archives/<date> (versions remplacées ou supprimées) + bases/<date>.sql.gz.
export const envoyerExterne = async (externe: Externe, instantane: { nom: string; chemin: string }, conservationJours: number) => {
  const racine = racineDistante(externe)
  await rclone(externe, [
    'sync',
    instantane.chemin,
    `${racine}/courant`,
    '--backup-dir',
    `${racine}/archives/${instantane.nom}`,
    '--exclude',
    '/base.*',
    '--transfers',
    '4',
  ])
  const fichiersBase = (await readdir(instantane.chemin)).filter((f) => f.startsWith('base.'))
  for (const fichier of fichiersBase) {
    await rclone(externe, ['copyto', path.join(instantane.chemin, fichier), `${racine}/bases/${instantane.nom}${fichier.slice('base'.length)}`])
  }
  // Purge distante d’après la date dans le nom (la date de modification des fichiers archivés est celle d’origine).
  const avertissements: string[] = []
  try {
    for (const archive of aPurger(await lister(externe, 'archives', true), new Date(), conservationJours)) {
      await rclone(externe, ['purge', `${racine}/archives/${archive.replace(/\/+$/, '')}`])
    }
    for (const base of aPurger(await lister(externe, 'bases', false), new Date(), conservationJours)) {
      await rclone(externe, ['deletefile', `${racine}/bases/${base}`])
    }
  } catch (e) {
    avertissements.push(`purge distante incomplète : ${(e as Error).message}`)
  }
  return avertissements
}

export const testerExterne = async (externe: Externe): Promise<string> => {
  const probleme = verifierExterne(externe)
  if (probleme) throw new Error(probleme)
  await rclone(externe, ['mkdir', racineDistante(externe)])
  await rclone(externe, ['lsf', '--max-depth', '1', racineDistante(externe)], { sortie: true })
  return `Connexion réussie (dossier « ${dossierDistant(externe.dossier)} »).`
}

let enCours = false
export const passageEnCours = () => enCours

// Passage complet : instantané local puis envoi externe. Ne lève jamais : le résultat va dans l’état.
export const lancerPassage = async (payload: Payload): Promise<Etat> => {
  const dossier = dossierSauvegardes()
  if (enCours) return { statut: 'encours' }
  enCours = true
  const liberer = await prendreVerrou(dossier).catch(() => null)
  if (!liberer) {
    enCours = false
    return { statut: 'encours', message: 'Une sauvegarde est déjà en cours.' }
  }
  const debut = new Date().toISOString()
  try {
    await ecrireEtat({ statut: 'encours', debut })
    const reglages = await lireReglages(payload)
    const instantane = await creerInstantane(payload, dossier, reglages.conservationJours)
    let externe: Etat['externe'] = { statut: 'aucun' }
    if (EXTERNE_ACTIF(reglages.externe)) {
      try {
        const probleme = verifierExterne(reglages.externe)
        if (probleme) throw new Error(probleme)
        const avertissements = await envoyerExterne(reglages.externe, instantane, reglages.conservationJours)
        externe = { statut: 'ok', message: avertissements.join(' ') || undefined }
      } catch (e) {
        externe = { statut: 'erreur', message: (e as Error).message }
      }
    }
    const etat: Etat = {
      statut: 'ok',
      debut,
      fin: new Date().toISOString(),
      taille: instantane.taille,
      instantane: instantane.nom,
      externe,
    }
    await ecrireEtat(etat)
    return etat
  } catch (e) {
    const etat: Etat = { statut: 'erreur', debut, fin: new Date().toISOString(), message: (e as Error).message }
    payload.logger.error(`Sauvegarde échouée : ${etat.message}`)
    await ecrireEtat(etat).catch(() => undefined)
    return etat
  } finally {
    await liberer()
    enCours = false
  }
}
