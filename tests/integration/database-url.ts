/**
 * URL de la base de pruebas, compartida por la configuración de vitest y por la
 * preparación global. Es una variable propia y no `DATABASE_URL` a propósito: la
 * preparación ejecuta `prisma migrate reset`, que borra todos los datos. Si
 * reutilizara la variable de desarrollo, bastaría tenerla exportada en la
 * terminal para vaciar la base de trabajo sin querer.
 */
export const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:adaptadev@127.0.0.1:5432/adapta_test?schema=public';
