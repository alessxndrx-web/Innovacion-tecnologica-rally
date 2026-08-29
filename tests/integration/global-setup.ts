import { execSync } from 'node:child_process';
import { testDatabaseUrl } from './database-url';

/**
 * Garantiza que la base de pruebas tenga el esquema al día antes de la suite.
 *
 * Se usa `migrate deploy`, que es idempotente y no destructivo, en lugar de
 * `migrate reset`: cada prueba ya vacía las tablas que le interesan en su
 * `beforeEach`, así que no hace falta borrar la base entera para tener un punto
 * de partida limpio. La URL sale de `TEST_DATABASE_URL`, nunca de
 * `DATABASE_URL`, para que la suite no pueda tocar la base de desarrollo.
 */
export function setup(): void {
  execSync('npx --yes prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: testDatabaseUrl },
  });
}
