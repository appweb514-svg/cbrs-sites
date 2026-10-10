'use client'

import { toast, useFormModified } from '@payloadcms/ui'
import React from 'react'

// Bouton « Envoyer un e-mail de test » : utilise les réglages ENREGISTRÉS, d’où l’avertissement.
export const EmailTest: React.FC = () => {
  const [occupe, setOccupe] = React.useState(false)
  const modified = useFormModified()

  const tester = async () => {
    setOccupe(true)
    try {
      const reponse = await fetch('/api/parametres-smtp-test', { method: 'POST', credentials: 'include' })
      const donnees = (await reponse.json().catch(() => ({}))) as { message?: string; error?: string }
      if (reponse.ok) toast.success(donnees.message ?? 'E-mail de test envoyé.')
      else toast.error(donnees.error ?? 'Envoi impossible.')
    } catch {
      toast.error('Envoi impossible (connexion au serveur).')
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <button className="btn btn--style-secondary btn--size-medium" disabled={occupe} onClick={tester} type="button">
        {occupe ? 'Envoi en cours…' : 'Envoyer un e-mail de test'}
      </button>
      <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
        {modified
          ? 'Des modifications ne sont pas enregistrées : enregistrez d’abord, le test utilise les réglages enregistrés.'
          : 'Le test utilise les réglages enregistrés et s’envoie à votre adresse.'}
      </p>
    </div>
  )
}
