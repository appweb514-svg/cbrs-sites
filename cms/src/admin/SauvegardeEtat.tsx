'use client'

import { toast } from '@payloadcms/ui'
import React from 'react'

type Etat = {
  statut?: 'encours' | 'ok' | 'erreur'
  debut?: string
  fin?: string
  taille?: number
  instantane?: string
  message?: string
  externe?: { statut: 'ok' | 'erreur' | 'aucun'; message?: string }
}

const taille = (octets?: number) => {
  if (octets == null) return '—'
  if (octets > 1e9) return `${(octets / 1e9).toFixed(1)} Go`
  return `${Math.max(1, Math.round(octets / 1e6))} Mo`
}

const date = (iso?: string) => (iso ? new Date(iso).toLocaleString('fr-FR') : '—')

// Dernier passage, boutons « Lancer maintenant » et « Télécharger » (lecture seule, mise à jour toutes les 3 s en cours).
export const SauvegardeEtat: React.FC = () => {
  const [etat, setEtat] = React.useState<Etat | null>(null)
  const [indisponible, setIndisponible] = React.useState<string | null>(null)
  const [occupe, setOccupe] = React.useState(false)

  const charger = React.useCallback(async () => {
    try {
      const reponse = await fetch('/api/sauvegardes/etat', { credentials: 'include' })
      const donnees = (await reponse.json().catch(() => ({}))) as Etat & { error?: string }
      if (reponse.status === 409) setIndisponible(donnees.error ?? 'Non disponible sur cet hébergement.')
      else if (reponse.ok) setEtat(donnees)
    } catch {
      /* hors ligne : on réessaie */
    }
  }, [])

  React.useEffect(() => {
    const premier = setTimeout(() => void charger(), 0)
    const minuteur = setInterval(() => void charger(), etat?.statut === 'encours' ? 3000 : 20000)
    return () => {
      clearTimeout(premier)
      clearInterval(minuteur)
    }
  }, [charger, etat?.statut])

  const lancer = async () => {
    setOccupe(true)
    try {
      const reponse = await fetch('/api/sauvegardes/lancer', { method: 'POST', credentials: 'include' })
      const donnees = (await reponse.json().catch(() => ({}))) as { message?: string; error?: string }
      if (reponse.ok) toast.success(donnees.message ?? 'Sauvegarde lancée.')
      else toast.error(donnees.error ?? 'Lancement impossible.')
      setTimeout(() => void charger(), 800)
    } catch {
      toast.error('Lancement impossible (connexion au serveur).')
    } finally {
      setOccupe(false)
    }
  }

  if (indisponible) {
    return <p style={{ marginBottom: '1.5rem' }}><strong>{indisponible}</strong></p>
  }

  const enCours = etat?.statut === 'encours'
  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button className="btn btn--style-primary btn--size-medium" disabled={occupe || enCours} onClick={lancer} type="button">
          {enCours ? 'Sauvegarde en cours…' : 'Lancer une sauvegarde maintenant'}
        </button>
        {/* Téléchargement de fichier (flux zip), pas une navigation de page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          className="btn btn--style-secondary btn--size-medium"
          href="/api/sauvegardes/telecharger"
          style={{ textDecoration: 'none' }}
        >
          Télécharger une sauvegarde complète (site + CMS)
        </a>
      </div>
      <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
        Le téléchargement prépare une archive zip : cela peut prendre une minute avant que le fichier arrive.
      </p>
      <div style={{ marginTop: '1rem' }}>
        <strong>Dernier passage</strong>
        {etat?.statut ? (
          <ul style={{ margin: '0.4rem 0 0', paddingLeft: '1.2rem' }}>
            <li>
              État : {enCours ? 'en cours' : etat.statut === 'ok' ? 'réussi' : 'échec'} — début {date(etat.debut)}
              {etat.fin && !enCours ? `, fin ${date(etat.fin)}` : ''}
            </li>
            {etat.statut === 'ok' && <li>Instantané {etat.instantane}, taille {taille(etat.taille)}</li>}
            {etat.message && <li>Erreur : {etat.message}</li>}
            {etat.externe && etat.externe.statut !== 'aucun' && (
              <li>
                Copie externe : {etat.externe.statut === 'ok' ? 'réussie' : 'échec'}
                {etat.externe.message ? ` — ${etat.externe.message}` : ''}
              </li>
            )}
            {etat.externe?.statut === 'aucun' && <li>Copie externe : non configurée</li>}
          </ul>
        ) : (
          <p style={{ margin: '0.4rem 0 0' }}>Aucune sauvegarde automatique enregistrée pour l’instant.</p>
        )}
      </div>
    </div>
  )
}
