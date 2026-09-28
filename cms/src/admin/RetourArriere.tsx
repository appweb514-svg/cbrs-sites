'use client'

import { toast, useDocumentInfo } from '@payloadcms/ui'
import React from 'react'

type Version = { id: number | string; updatedAt?: string; createdAt?: string }

const quand = (version: Version): string => {
  const valeur = version.updatedAt ?? version.createdAt
  return valeur
    ? new Date(valeur).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
    : 'date inconnue'
}

// Bouton affiché à côté des boutons d'enregistrement : restaure la version précédente de la fiche.
// L'historique (20 versions) est activé par `avecRetourArriere` sur toutes les collections et globals.
export const RetourArriere: React.FC = () => {
  const { apiURL, collectionSlug, globalSlug, hasSavePermission, id, versionCount } = useDocumentInfo()
  const [precedente, setPrecedente] = React.useState<null | Version>(null)
  const [occupe, setOccupe] = React.useState(false)

  const base = React.useMemo(() => {
    if (!id) return null
    if (collectionSlug) return `${apiURL ?? '/api'}/${collectionSlug}/${id}/versions`
    if (globalSlug) return `${apiURL ?? '/api'}/globals/${globalSlug}/versions`
    return null
  }, [apiURL, collectionSlug, globalSlug, id])

  React.useEffect(() => {
    if (!base || hasSavePermission === false || (versionCount ?? 0) < 2) return
    let vivant = true
    fetch(`${base}?limit=2&depth=0&sort=-updatedAt`, { credentials: 'include' })
      .then((reponse) => (reponse.ok ? reponse.json() : null))
      .then((donnees: { docs?: Version[] } | null) => {
        if (vivant) setPrecedente(donnees?.docs?.[1] ?? null)
      })
      .catch(() => {
        if (vivant) setPrecedente(null)
      })
    return () => {
      vivant = false
    }
  }, [base, hasSavePermission, versionCount])

  if (!base || hasSavePermission === false || !precedente) return null

  const revenir = async () => {
    const date = quand(precedente)
    const message =
      `Revenir à la version du ${date} ?\n\n` +
      'Le contenu actuel sera remplacé. Il restera consultable dans l’historique des versions.'
    if (!window.confirm(message)) return

    setOccupe(true)
    try {
      const reponse = await fetch(`${base}/${precedente.id}`, { credentials: 'include', method: 'POST' })
      if (!reponse.ok) throw new Error()
      toast.success(`Version du ${date} restaurée.`)
      window.location.reload()
    } catch {
      toast.error('Retour en arrière impossible (connexion au serveur).')
      setOccupe(false)
    }
  }

  return (
    <button
      className="cbrs-bouton btn btn--style-secondary"
      disabled={occupe}
      onClick={revenir}
      title={`Revenir à la version du ${quand(precedente)}`}
      type="button"
    >
      {occupe ? 'Retour…' : 'Revenir en arrière'}
    </button>
  )
}
