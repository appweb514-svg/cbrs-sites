import type { GlobalConfig } from 'payload'

import { cacheSaufAdmin, isAdmin, isAdminField } from '../access'
import { champSecret } from '../fields/champSecret'

type Sibling = { fournisseur?: string }
const siS3 = (_: unknown, sibling: Sibling) => sibling?.fournisseur === 's3'
const siJeton = (_: unknown, sibling: Sibling) => sibling?.fournisseur === 'dropbox' || sibling?.fournisseur === 'drive'
const siExterne = (_: unknown, sibling: Sibling) => sibling?.fournisseur !== 'aucun'

export const Parametres: GlobalConfig = {
  slug: 'parametres',
  label: 'Paramètres du site',
  admin: {
    components: { elements: { beforeDocumentControls: ['/admin/VoirPage#VoirPage'] } },
    group: 'Administration',
    hidden: cacheSaufAdmin,
    description: 'Chiffres clés et adresses de contact affichés sur le site. Réservé à l’administrateur.',
  },
  access: {
    read: () => true,
    readVersions: isAdmin,
    update: isAdmin,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Site',
          fields: [
        {
          type: 'row',
          fields: [
            { name: 'depuis', label: 'Club fondé en', type: 'text', defaultValue: '1993' },
            { name: 'adherents', label: 'Adhérents', type: 'text', defaultValue: '1 200' },
            { name: 'activites', label: 'Activités', type: 'text', defaultValue: '≈ 20' },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'emailContact',
              label: 'E-mail contact',
              type: 'email',
              defaultValue: 'cbrs@cbrs60.fr',
            },
            {
              name: 'emailSorties',
              label: 'E-mail sorties & voyages',
              type: 'email',
              defaultValue: 'martinelcbrs60@gmail.com',
            },
          ],
        },
          ],
        },
        {
          label: 'E-mails (SMTP)',
          description:
            'Serveur utilisé pour les e-mails du CMS (mot de passe oublié…). Réservé à l’administrateur. Sans réglage activé ici, le CMS utilise les variables SMTP_* du serveur.',
          fields: [
            {
              name: 'smtp',
              label: 'Serveur d’envoi',
              type: 'group',
              access: { read: isAdminField, update: isAdminField },
              fields: [
                { name: 'actif', label: 'Utiliser ces réglages', type: 'checkbox', defaultValue: false },
                {
                  type: 'row',
                  fields: [
                    { name: 'hote', label: 'Serveur (hôte)', type: 'text', admin: { placeholder: 'smtp.exemple.fr' } },
                    { name: 'port', label: 'Port', type: 'number', defaultValue: 587, min: 1, max: 65535 },
                  ],
                },
                {
                  name: 'securise',
                  label: 'Connexion SSL/TLS directe (port 465)',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: { description: 'Laissez décoché pour le port 587 (STARTTLS) ou 25.' },
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'utilisateur', label: 'Identifiant', type: 'text', admin: { autoComplete: 'off' } },
                    champSecret('motDePasse', { label: 'Mot de passe' }),
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'expediteur', label: 'Adresse d’expédition', type: 'email', admin: { placeholder: 'no-reply@cbrs60.fr' } },
                    { name: 'nomExpediteur', label: 'Nom affiché', type: 'text', defaultValue: 'CBRS' },
                  ],
                },
                {
                  name: 'test',
                  type: 'ui',
                  admin: { components: { Field: '/admin/EmailTest#EmailTest' } },
                },
              ],
            },
          ],
        },
        {
          label: 'Sauvegardes',
          description:
            'Réservé à l’administrateur. Disponible uniquement sur un hébergement avec disque (pas sur Vercel).',
          fields: [
            {
              name: 'sauvegarde',
              label: 'Sauvegardes',
              type: 'group',
              access: { read: isAdminField, update: isAdminField },
              fields: [
                {
                  name: 'etat',
                  type: 'ui',
                  admin: { components: { Field: '/admin/SauvegardeEtat#SauvegardeEtat' } },
                },
                {
                  name: 'actif',
                  label: 'Sauvegarde automatique chaque semaine',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    description:
                      'Nécessite CBRS_SAUVEGARDES=1 dans l’environnement du serveur. Instantanés incrémentaux (seuls les fichiers modifiés prennent de la place).',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'jour',
                      label: 'Jour',
                      type: 'select',
                      defaultValue: '0',
                      options: [
                        { label: 'Dimanche', value: '0' },
                        { label: 'Lundi', value: '1' },
                        { label: 'Mardi', value: '2' },
                        { label: 'Mercredi', value: '3' },
                        { label: 'Jeudi', value: '4' },
                        { label: 'Vendredi', value: '5' },
                        { label: 'Samedi', value: '6' },
                      ],
                    },
                    { name: 'heure', label: 'Heure (0 à 23)', type: 'number', defaultValue: 3, min: 0, max: 23 },
                    {
                      name: 'conservationJours',
                      label: 'Durée de conservation (jours)',
                      type: 'number',
                      defaultValue: 90,
                      min: 7,
                    },
                  ],
                },
                {
                  name: 'externe',
                  label: 'Copie hors du serveur',
                  type: 'group',
                  admin: {
                    description:
                      'Après chaque sauvegarde, une copie est envoyée vers ce service. Les versions remplacées ou supprimées sont conservées dans « archives ».',
                  },
                  fields: [
                    {
                      name: 'fournisseur',
                      label: 'Destination',
                      type: 'select',
                      defaultValue: 'aucun',
                      options: [
                        { label: 'Aucune', value: 'aucun' },
                        { label: 'S3 (AWS, OVH, Scaleway, Backblaze…)', value: 's3' },
                        { label: 'Dropbox', value: 'dropbox' },
                        { label: 'Google Drive', value: 'drive' },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'endpoint',
                          label: 'Adresse du service (endpoint)',
                          type: 'text',
                          admin: { placeholder: 'https://s3.gra.io.cloud.ovh.net', description: 'Vide pour AWS.', condition: siS3 },
                        },
                        { name: 'region', label: 'Région', type: 'text', admin: { placeholder: 'gra', condition: siS3 } },
                      ],
                    },
                    {
                      type: 'row',
                      fields: [
                        { name: 'bucket', label: 'Bucket', type: 'text', admin: { condition: siS3 } },
                        { name: 'cleAcces', label: 'Clé d’accès', type: 'text', admin: { autoComplete: 'off', condition: siS3 } },
                      ],
                    },
                    champSecret('cleSecrete', { label: 'Clé secrète', condition: siS3 }),
                    champSecret('jeton', {
                      label: 'Jeton d’autorisation (JSON)',
                      multiligne: true,
                      description:
                        'Obtention : sur un ordinateur, installez rclone (rclone.org), lancez « rclone authorize "dropbox" » (Dropbox) ou « rclone authorize "drive" » (Google Drive), connectez-vous dans le navigateur qui s’ouvre, puis copiez ici tout le texte JSON affiché entre les lignes « Paste the following into your remote machine ---> » et « <---End paste ».',
                      condition: siJeton,
                    }),
                    {
                      name: 'dossier',
                      label: 'Dossier de destination',
                      type: 'text',
                      defaultValue: 'cbrs-sauvegardes',
                      admin: { condition: siExterne },
                    },
                    {
                      name: 'test',
                      type: 'ui',
                      admin: {
                        components: { Field: '/admin/SauvegardeTestExterne#SauvegardeTestExterne' },
                        condition: siExterne,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}
