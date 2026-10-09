import * as migration_20260925_194715_init from './20260925_194715_init';
import * as migration_20260926_182301_vercel_blob from './20260926_182301_vercel_blob';
import * as migration_20260927_090415_cms_v2 from './20260927_090415_cms_v2';
import * as migration_20260927_123611_apparence_entete from './20260927_123611_apparence_entete';
import * as migration_20260928_190820_versions_partout from './20260928_190820_versions_partout';
import * as migration_20260929_213723_fix_objectkey from './20260929_213723_fix_objectkey';
import * as migration_20260930_082940_formation from './20260930_082940_formation';
import * as migration_20260930_212404_formation_listes from './20260930_212404_formation_listes';
import * as migration_20261002_053731_formation_images from './20261002_053731_formation_images';
import * as migration_20261009_120000_activites_bon_a_savoir from './20261009_120000_activites_bon_a_savoir';
import * as migration_20261009_180000_activites_bon_a_savoir_afficher from './20261009_180000_activites_bon_a_savoir_afficher';
import * as migration_20261009_202213_titres_des_pages from './20261009_202213_titres_des_pages';

export const migrations = [
  {
    up: migration_20260925_194715_init.up,
    down: migration_20260925_194715_init.down,
    name: '20260925_194715_init',
  },
  {
    up: migration_20260926_182301_vercel_blob.up,
    down: migration_20260926_182301_vercel_blob.down,
    name: '20260926_182301_vercel_blob',
  },
  {
    up: migration_20260927_090415_cms_v2.up,
    down: migration_20260927_090415_cms_v2.down,
    name: '20260927_090415_cms_v2',
  },
  {
    up: migration_20260927_123611_apparence_entete.up,
    down: migration_20260927_123611_apparence_entete.down,
    name: '20260927_123611_apparence_entete',
  },
  {
    up: migration_20260928_190820_versions_partout.up,
    down: migration_20260928_190820_versions_partout.down,
    name: '20260928_190820_versions_partout',
  },
  {
    up: migration_20260929_213723_fix_objectkey.up,
    down: migration_20260929_213723_fix_objectkey.down,
    name: '20260929_213723_fix_objectkey',
  },
  {
    up: migration_20260930_082940_formation.up,
    down: migration_20260930_082940_formation.down,
    name: '20260930_082940_formation',
  },
  {
    up: migration_20260930_212404_formation_listes.up,
    down: migration_20260930_212404_formation_listes.down,
    name: '20260930_212404_formation_listes',
  },
  {
    up: migration_20261002_053731_formation_images.up,
    down: migration_20261002_053731_formation_images.down,
    name: '20261002_053731_formation_images',
  },
  {
    up: migration_20261009_120000_activites_bon_a_savoir.up,
    down: migration_20261009_120000_activites_bon_a_savoir.down,
    name: '20261009_120000_activites_bon_a_savoir',
  },
  {
    up: migration_20261009_180000_activites_bon_a_savoir_afficher.up,
    down: migration_20261009_180000_activites_bon_a_savoir_afficher.down,
    name: '20261009_180000_activites_bon_a_savoir_afficher',
  },
  {
    up: migration_20261009_202213_titres_des_pages.up,
    down: migration_20261009_202213_titres_des_pages.down,
    name: '20261009_202213_titres_des_pages'
  },
];
