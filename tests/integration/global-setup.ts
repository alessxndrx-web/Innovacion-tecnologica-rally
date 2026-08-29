import { execSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';

const DATABASE_URL = 'file:./test.db';

/**
 * Reconstruye la base de pruebas desde cero antes de la suite. Se usa un
 * archivo distinto al de desarrollo para no tocar `prisma/dev.db`.
 */
export function setup(): void {
  const databaseFile = path.join(process.cwd(), 'prisma', 'test.db');
  rmSync(databaseFile, { force: true });
  rmSync(`${databaseFile}-journal`, { force: true });

  execSync('npx --yes prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL },
  });
}
