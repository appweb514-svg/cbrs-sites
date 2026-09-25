import * as migration_20260925_194715_init from './20260925_194715_init';

export const migrations = [
  {
    up: migration_20260925_194715_init.up,
    down: migration_20260925_194715_init.down,
    name: '20260925_194715_init'
  },
];
