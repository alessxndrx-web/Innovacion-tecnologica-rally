import 'dotenv/config';
import { buildApp } from './app';

async function start(): Promise<void> {
  try {
    const app = await buildApp();
    await app.listen({ port: app.config.port, host: '0.0.0.0' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    process.stderr.write(`No se pudo iniciar Sinappsis: ${message}\n`);
    process.exitCode = 1;
  }
}

void start();
