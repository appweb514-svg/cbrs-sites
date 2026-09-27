'use client'

import { useAuth, useSelection, toast } from '@payloadcms/ui'
import React from 'react'

import { droits } from '../access'

// Action en lot dans la photothèque : cocher des photos puis les ajouter à la galerie du site ou en retirer.
export const GalerieLot: React.FC = () => {
  const { user } = useAuth()
  const { count, getSelectedIds, toggleAll } = useSelection()
  const [occupe, setOccupe] = React.useState(false)

  const peutCreer = droits(user, 'galerie', 'creer').autorise
  const peutSupprimer = droits(user, 'galerie', 'supprimer').autorise
  if (!peutCreer && !peutSupprimer) return null

  const envoyer = async (corps: { ajouter?: (number | string)[]; retirer?: (number | string)[] }, message: string) => {
    setOccupe(true)
    try {
      const reponse = await fetch('/api/galerie-lot', {
        body: JSON.stringify(corps),
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      })
      const donnees = (await reponse.json()) as {
        ajoutes?: number
        dejaPresentes?: number
        retires?: number
        erreurs?: string[]
        error?: string
      }
      if (!reponse.ok) {
        toast.error(donnees.error ?? 'Action impossible.')
      } else {
        const nombre = donnees.ajoutes ?? donnees.retires ?? 0
        toast.success(`${message} : ${nombre}`)
        if (donnees.dejaPresentes) toast.info(`${donnees.dejaPresentes} photo(s) déjà dans la galerie : aucun changement.`)
        if (donnees.erreurs?.length) donnees.erreurs.forEach((erreur) => toast.error(erreur))
        toggleAll()
      }
    } catch {
      toast.error('Action impossible (connexion au serveur).')
    } finally {
      setOccupe(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0 0 1rem' }}>
      <span style={{ opacity: 0.75 }}>
        {count ? `${count} photo${count > 1 ? 's' : ''} sélectionnée${count > 1 ? 's' : ''}` : 'Sélectionnez des photos dans la liste'}
      </span>
      {peutCreer && (
        <button
          className="btn btn--style-primary btn--size-small"
          disabled={!count || occupe}
          onClick={() => envoyer({ ajouter: getSelectedIds() }, 'Photos ajoutées à la galerie')}
          type="button"
        >
          Ajouter à la galerie
        </button>
      )}
      {peutSupprimer && (
        <button
          className="btn btn--style-secondary btn--size-small"
          disabled={!count || occupe}
          onClick={() => envoyer({ retirer: getSelectedIds() }, 'Photos retirées de la galerie')}
          type="button"
        >
          Retirer de la galerie
        </button>
      )}
    </div>
  )
}
