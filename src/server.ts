import 'dotenv/config';
import type { FastifyInstance } from 'fastify';
import { buildApp } from './app';

const SHUTDOWN_SIGNALS = ['SIGTERM', 'SIGINT'] as const;
const SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Cierre ordenado: un contenedor recibe SIGTERM antes de que lo retiren del
 * balanceador. Sin esto, las peticiones en vuelo se cortan y las conexiones a
 * la base de datos quedan abiertas hasta que el proceso muere.
 */
function registerShutdownHandlers(app: FastifyInstance): void {
  let shuttingDown = false;

  for (const signal of SHUTDOWN_SIGNALS) {
    process.once(signal, () => {
      if (shuttingDown) {
        return;
      }
      shuttingDown = true;
      app.log.info({ signal }, 'Cerrando ADAPTA');

      const forceExit = setTimeout(() => {
        app.log.error('El cierre ordenado excedió el tiempo límite');
        process.exit(1);
      }, SHUTDOWN_TIMEOUT_MS);
      forceExit.unref();

      void app
        .close()
        .then(() => {
          clearTimeout(forceExit);
        })
        .catch((error: unknown) => {
          app.log.error({ err: error }, 'Error durante el cierre');
          process.exit(1);
        });
    });
  }
}

async function start(): Promise<void> {
  try {
    const app = await buildApp();
    registerShutdownHandlers(app);
    await app.listen({ port: app.config.port, host: '0.0.0.0' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    process.stderr.write(`No se pudo iniciar Sinappsis: ${message}\n`);
    process.exitCode = 1;
  }
}

void start();
