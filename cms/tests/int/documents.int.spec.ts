import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

let payload: Payload
let dossier: string

// En-tête OLE2 (CFB) : signature des .doc et .xls enregistrés par les anciennes versions d'Office.
// file-type les détecte « application/x-cfb », pas « application/msword » : la liste des formats
// acceptés doit en tenir compte, sinon le dépôt est refusé.
const conteneurOle2 = (contenu: string) => {
  const buf = Buffer.alloc(4096)
  Buffer.from('D0CF11E0A1B11AE1', 'hex').copy(buf)
  buf.write(contenu, 64)
  return buf
}

// Archive ZIP minimale : suffisant pour que file-type reconnaisse les formats OOXML.
const zipMinimal = (entrees: Record<string, string>) => {
  const morceaux: Buffer[] = []
  const central: Buffer[] = []
  let decalage = 0
  for (const [nom, contenu] of Object.entries(entrees)) {
    const donnees = Buffer.from(contenu, 'utf8')
    const entete = Buffer.alloc(30)
    entete.writeUInt32LE(0x04034b50, 0)
    entete.writeUInt16LE(20, 4)
    entete.writeUInt16LE(0x0800, 6)
    entete.writeUInt16LE(0, 8)
    entete.writeUInt32LE(0, 10)
    entete.writeUInt32LE(0, 14)
    entete.writeUInt32LE(donnees.length, 18)
    entete.writeUInt32LE(donnees.length, 22)
    entete.writeUInt16LE(nom.length, 26)
    const nomBuf = Buffer.from(nom, 'utf8')
    morceaux.push(entete, nomBuf, donnees)

    const c = Buffer.alloc(46)
    c.writeUInt32LE(0x02014b50, 0)
    c.writeUInt16LE(20, 4)
    c.writeUInt16LE(20, 6)
    c.writeUInt16LE(0x0800, 8)
    c.writeUInt32LE(0, 16)
    c.writeUInt32LE(donnees.length, 20)
    c.writeUInt32LE(donnees.length, 24)
    c.writeUInt16LE(nom.length, 28)
    c.writeUInt32LE(decalage, 42)
    central.push(c, nomBuf)
    decalage += entete.length + nomBuf.length + donnees.length
  }
  const fin = Buffer.alloc(22)
  fin.writeUInt32LE(0x06054b50, 0)
  fin.writeUInt16LE(Object.keys(entrees).length, 8)
  fin.writeUInt16LE(Object.keys(entrees).length, 10)
  fin.writeUInt32LE(Buffer.concat(central).length, 12)
  fin.writeUInt32LE(decalage, 16)
  return Buffer.concat([...morceaux, ...central, fin])
}

const types = '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'

const FICHIERS: { contenu: Buffer; nom: string }[] = [
  // PDF minimal valide : en-tête « %PDF- », table « xref » et « %%EOF » exigés par Payload.
  {
    nom: 'doc.pdf',
    contenu: Buffer.from(
      '%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\nxref\n0 2\n0000000000 65535 f \n0000000009 00000 n \ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n50\n%%EOF\n',
    ),
  },
  { nom: 'doc.doc', contenu: conteneurOle2('Word ancien') },
  { nom: 'doc.xls', contenu: conteneurOle2('Excel ancien') },
  {
    nom: 'doc.docx',
    contenu: zipMinimal({
      '[Content_Types].xml': `${types}<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`,
      'word/document.xml': '<w:document/>',
    }),
  },
  {
    nom: 'doc.xlsx',
    contenu: zipMinimal({
      '[Content_Types].xml': `${types}<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/></Types>`,
      'xl/workbook.xml': '<workbook/>',
    }),
  },
  {
    nom: 'doc.odt',
    contenu: zipMinimal({
      mimetype: 'application/vnd.oasis.opendocument.text',
      content: '<office/>',
    }),
  },
]

beforeAll(async () => {
  payload = await getPayload({ config })
  dossier = mkdtempSync(join(tmpdir(), 'cbrs-docs-'))
  FICHIERS.forEach(({ contenu, nom }) => writeFileSync(join(dossier, nom), contenu))
})

describe('Dépôt des documents', () => {
  it('accepte tous les formats annoncés (PDF, Word, Excel, OpenDocument)', async () => {
    for (const { nom } of FICHIERS) {
      const document = await payload.create({
        collection: 'documents',
        data: { titre: `Essai ${nom}`, categorie: 'autre', remplaceLienOfficiel: 'aucun' },
        filePath: join(dossier, nom),
        draft: false,
        overrideAccess: true,
      })
      expect(document.filename, `${nom} devrait être accepté`).toBeTruthy()
      await payload.delete({ collection: 'documents', id: document.id, overrideAccess: true })
    }
  })

  it('refuse encore un format non prévu', async () => {
    const chemin = join(dossier, 'script.sh')
    writeFileSync(chemin, '#!/bin/sh\necho bonjour\n')
    await expect(
      payload.create({
        collection: 'documents',
        data: { titre: 'Script', categorie: 'autre', remplaceLienOfficiel: 'aucun' },
        filePath: chemin,
        draft: false,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })
})
