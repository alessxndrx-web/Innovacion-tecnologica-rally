/**
 * Base de la API REST.
 *
 * Vite sustituye `import.meta.env.VITE_API_BASE_URL` en tiempo de compilación,
 * no de ejecución: el valor queda incrustado en el bundle. Para apuntar a otro
 * servidor hay que definir la variable y volver a construir.
 *
 * El valor por defecto coincide con el puerto del backend en local, que además
 * ya acepta `http://localhost:5173` en `CORS_ORIGINS`.
 */
const DEFAULT_API_BASE_URL = 'http://localhost:3000';

/** Sin barra final, para concatenar rutas sin duplicarla. */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(
  /\/+$/,
  '',
);
