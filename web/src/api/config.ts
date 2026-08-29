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

/**
 * Autenticación local, sin backend.
 *
 * Se activa cuando la base de la API queda vacía, que es justo lo que ocurre
 * al desplegar solo la interfaz: `VITE_API_BASE_URL=""` deja las peticiones
 * colgando de un origen que no tiene API, y registrarse devolvía 404. Con esto
 * la aplicación se puede recorrer entera mientras el backend no esté publicado.
 *
 * Es una condición, no un interruptor que haya que acordarse de apagar: en
 * cuanto la variable apunte a un servidor real, el modo demo desaparece y se
 * usa el registro de verdad. `VITE_DEMO_MODE` permite forzar cualquiera de los
 * dos comportamientos si hiciera falta.
 */
function resolveDemoMode(): boolean {
  const override = import.meta.env.VITE_DEMO_MODE;
  if (override === 'true') {
    return true;
  }
  if (override === 'false') {
    return false;
  }
  return API_BASE_URL === '';
}

export const DEMO_MODE = resolveDemoMode();
