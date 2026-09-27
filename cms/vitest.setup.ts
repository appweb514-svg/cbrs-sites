import fs from 'node:fs'

const testDb = './cbrs-cms.test.db'
for (const file of [testDb, `${testDb}-shm`, `${testDb}-wal`]) fs.rmSync(file, { force: true })
process.env.DATABASE_URL = `file:${testDb}`
process.env.PAYLOAD_SECRET ||= 'secret-de-test-uniquement'

await import('dotenv/config')
