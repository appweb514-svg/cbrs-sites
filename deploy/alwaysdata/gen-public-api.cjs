// Génère en fichiers JSON statiques les réponses des fonctions Vercel `api/public/*`
// (données figées dans api/_data), pour un hébergement sans fonctions serverless.
// Usage : node gen-public-api.cjs <racine-du-depot> <dossier-de-sortie>
const fs = require('fs')
const path = require('path')

const [repo, out] = process.argv.slice(2)
if (!repo || !out) {
  console.error('usage: gen-public-api.cjs <repo> <out>')
  process.exit(1)
}

const base = path.join(repo, 'api', 'public')

function call(handler, query = {}) {
  return new Promise((resolve, reject) => {
    const res = {
      setHeader() {},
      status(code) {
        res.code = code
        return res
      },
      json(body) {
        resolve({ code: res.code || 200, body })
      },
    }
    Promise.resolve(handler({ method: 'GET', query, headers: {}, body: {} }, res)).catch(reject)
  })
}

function write(file, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(body))
}

async function main() {
  const written = []
  for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
    // gallery.js filtre sur des paramètres de requête : sans eux, il renvoie tout.
    if (entry.isFile() && entry.name.endsWith('.js')) {
      const name = entry.name.replace(/\.js$/, '')
      const { code, body } = await call(require(path.resolve(base, entry.name)))
      if (code === 200) {
        write(path.join(out, 'api', 'public', name + '.json'), body)
        written.push(name)
      }
    }
  }
  // Fiches : api/public/activities/<id>
  const dir = path.join(base, 'activities')
  if (fs.existsSync(dir)) {
    const ids = require(path.resolve(repo, 'api', '_data', 'activities')).map((a) => a.id)
    const handler = require(path.resolve(dir, '[id].js'))
    for (const id of ids) {
      const { code, body } = await call(handler, { id })
      if (code === 200) {
        write(path.join(out, 'api', 'public', 'activities', String(id) + '.json'), body)
        written.push('activities/' + id)
      }
    }
  }
  console.log('API publique statique :', written.length, 'fichiers')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
