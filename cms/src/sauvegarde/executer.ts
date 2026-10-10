import { spawn } from 'node:child_process'

export type Env = Record<string, string | undefined>

// Lance une commande sans shell. Rejette avec la fin de stderr si le code de sortie n’est pas 0.
// `sortie: true` renvoie stdout (sinon une chaîne vide).
export const executer = (
  commande: string,
  args: string[],
  options: { cwd?: string; env?: Env; sortie?: boolean } = {},
): Promise<string> =>
  new Promise((resolve, reject) => {
    const enfant = spawn(commande, args, {
      cwd: options.cwd,
      env: (options.env ?? process.env) as NodeJS.ProcessEnv,
      stdio: ['ignore', options.sortie ? 'pipe' : 'ignore', 'pipe'],
    })
    let sortie = ''
    let erreur = ''
    enfant.stdout?.on('data', (morceau) => (sortie += morceau))
    enfant.stderr?.on('data', (morceau) => (erreur = (erreur + morceau).slice(-4000)))
    enfant.on('error', (e: NodeJS.ErrnoException) =>
      reject(new Error(e.code === 'ENOENT' ? `« ${commande} » n’est pas installé sur ce serveur.` : e.message)),
    )
    enfant.on('close', (code) => {
      if (code === 0) resolve(sortie)
      else reject(new Error(erreur.trim().split('\n').slice(-5).join(' ') || `${commande} a échoué (code ${code}).`))
    })
  })
