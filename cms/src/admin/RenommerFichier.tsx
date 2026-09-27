'use client'

import { toast, useAuth, useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import React from 'react'

import { droits } from '../access'
import { NOM_MAX, nomAffiche, separerNom } from '../nomFichier'

// Champ de saisie du nom sans extension + bouton « Renommer ».
// Remonté (key) quand le fichier change, pour repartir du nom enregistré.
const ChampRenommage: React.FC<{ extension: string; id: number | string; nomInitial: string }> = ({
  extension,
  id,
  nomInitial,
}) => {
  const router = useRouter()
  const [nom, setNom] = React.useState(nomInitial)
  const [occupe, setOccupe] = React.useState(false)

  const renommer = async () => {
    setOccupe(true)
    try {
      const reponse = await fetch('/api/media-renommer', {
        body: JSON.stringify({ id, nom }),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const donnees = (await reponse.json()) as { filename?: string; error?: string }
      if (!reponse.ok || !donnees.filename) {
        toast.error(donnees.error ?? 'Renommage impossible.')
      } else {
        toast.success(`Photo renommée : ${nomAffiche(donnees.filename)}`)
        router.refresh()
      }
    } catch {
      toast.error('Renommage impossible (connexion au serveur).')
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div className="field-type text" style={{ marginBottom: '1.5rem' }}>
      <label className="field-label" htmlFor="renommer-fichier">
        Nom du fichier
      </label>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '0.4rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <input
            aria-label="Nom du fichier sans son extension"
            className="text"
            id="renommer-fichier"
            maxLength={NOM_MAX}
            onChange={(e) => setNom(e.target.value)}
            spellCheck={false}
            style={{ width: '18rem' }}
            value={nom}
          />
          {extension && <span style={{ marginLeft: '0.5rem', opacity: 0.75 }}>{extension}</span>}
        </div>
        <button
          className="cbrs-bouton btn btn--style-secondary btn--size-small"
          disabled={occupe || !nom.trim() || nom === nomInitial}
          onClick={renommer}
          type="button"
        >
          Renommer
        </button>
      </div>
      <p style={{ marginTop: '0.4rem', opacity: 0.7, fontSize: 12 }}>
        Minuscules, chiffres, tirets : le reste est remplacé automatiquement. L’extension{' '}
        {extension || ''} n’est pas modifiable.
      </p>
    </div>
  )
}

// Renomme le fichier sans toucher à son extension : on ne modifie que la partie avant le dernier point.
export const RenommerFichier: React.FC = () => {
  const { id, savedDocumentData } = useDocumentInfo()
  const { user } = useAuth()

  const fichier = typeof savedDocumentData?.filename === 'string' ? savedDocumentData.filename : ''
  if (!droits(user, 'media', 'modifier').autorise || !id || !fichier) return null

  return (
    <ChampRenommage
      extension={separerNom(fichier).extension}
      id={id}
      key={fichier}
      nomInitial={nomAffiche(fichier)}
    />
  )
}
