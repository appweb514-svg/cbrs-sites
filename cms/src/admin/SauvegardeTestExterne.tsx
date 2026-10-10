'use client'

import { toast, useFormModified } from '@payloadcms/ui'
import React from 'react'

// Bouton « Tester la connexion » : utilise la destination ENREGISTRÉE.
export const SauvegardeTestExterne: React.FC = () => {
  const [occupe, setOccupe] = React.useState(false)
  const modified = useFormModified()

  const tester = async () => {
    setOccupe(true)
    try {
      const reponse = await fetch('/api/sauvegardes/test-externe', { method: 'POST', credentials: 'include' })
      const donnees = (await reponse.json().catch(() => ({}))) as { message?: string; error?: string }
      if (reponse.ok) toast.success(donnees.message ?? 'Connexion réussie.')
      else toast.error(donnees.error ?? 'Connexion impossible.')
    } catch {
      toast.error('Test impossible (connexion au serveur).')
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="field-type" style={{ marginBottom: '1.5rem' }}>
      <button className="btn btn--style-secondary btn--size-medium" disabled={occupe} onClick={tester} type="button">
        {occupe ? 'Test en cours…' : 'Tester la connexion'}
      </button>
      <p style={{ marginTop: '0.5rem', opacity: 0.8 }}>
        {modified
          ? 'Des modifications ne sont pas enregistrées : enregistrez d’abord, le test utilise la destination enregistrée.'
          : 'Le test utilise la destination enregistrée.'}
      </p>
    </div>
  )
}
