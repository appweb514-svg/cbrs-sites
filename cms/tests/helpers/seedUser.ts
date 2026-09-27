import { getPayload } from 'payload'
import config from '../../src/payload.config.js'

export const testUser = {
  email: 'e2e-admin@cbrs.local',
  password: 'motdepasse-e2e',
}

/**
 * Seeds a test user for e2e admin tests.
 */
export async function seedTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  const data = { ...testUser, nom: 'Admin e2e', estAdministrateur: true }

  // Update the test user if it already exists: when it is the only administrator,
  // the "last administrator" guard refuses to delete it.
  const { docs } = await payload.find({
    collection: 'users',
    limit: 1,
    where: { email: { equals: testUser.email } },
  })
  if (docs[0]) {
    await payload.update({ collection: 'users', id: docs[0].id, data })
    return
  }

  await payload.create({ collection: 'users', data })
}

/**
 * Cleans up test user after tests
 */
export async function cleanupTestUser(): Promise<void> {
  const payload = await getPayload({ config })

  await payload.delete({
    collection: 'users',
    where: {
      email: {
        equals: testUser.email,
      },
    },
  })
}
