import { test } from 'node:test'
import assert from 'node:assert/strict'

import { resolve } from '../serve.mjs'

const file = (pathname) => resolve(pathname).file?.split('/cms-v2/').pop() ?? resolve(pathname).file

test('pages servies à la racine', () => {
  assert.match(resolve('/').file, /site3\/index\.html$/)
  assert.match(resolve('/activites').file, /site3\/activites\.html$/)
  assert.match(resolve('/activite').file, /site3\/activite\.html$/)
  assert.match(resolve('/liens-utiles').file, /site3\/liens-utiles\.html$/)
})

test('anciennes adresses redirigées', () => {
  assert.deepEqual(resolve('/site3/activites.html'), { status: 308, location: '/activites' })
  assert.deepEqual(resolve('/activites.html'), { status: 308, location: '/activites' })
  assert.deepEqual(resolve('/activites/'), { status: 308, location: '/activites' })
  assert.deepEqual(resolve('/site3/index.html'), { status: 308, location: '/' })
  assert.deepEqual(resolve('/index'), { status: 308, location: '/' })
})

test('ressources du site servies depuis site3', () => {
  assert.match(resolve('/photos/photo_001.jpg').file, /site3\/photos\/photo_001\.jpg$/)
  assert.match(resolve('/ui-shell.js').file, /site3\/ui-shell\.js$/)
  assert.ok(file('/tailwind.css'))
})

test('ancienne version intacte', () => {
  assert.match(resolve('/old-version').file, /old-version\/index\.html$/)
  assert.equal(resolve('/inexistant-xyz').status, 404)
})
