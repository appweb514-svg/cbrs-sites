import * as migration_20260925_194715_init from './20260925_194715_init';
import * as migration_20260926_182301_vercel_blob from './20260926_182301_vercel_blob';

export const migrations = [
  {
    up: migration_20260925_194715_init.up,
    down: migration_20260925_194715_init.down,
    name: '20260925_194715_init',
  },
  {
    up: migration_20260926_182301_vercel_blob.up,
    down: migration_20260926_182301_vercel_blob.down,
    name: '20260926_182301_vercel_blob'
  },
];
