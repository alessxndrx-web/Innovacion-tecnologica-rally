/**
 * Tipos de error de la capa de red.
 *
 * Viven aparte de `client.ts` para que el modo demo pueda lanzarlos sin que
 * cliente y demo se importen en círculo.
 */

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

/** Error con el `code` estable que devuelve el backend en `error.code`. */
export class ApiError extends Error {
  public constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details: ApiErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** El servidor no respondió: sin conexión, caído o CORS mal configurado. */
export class NetworkError extends Error {
  public constructor(cause: unknown) {
    super('No se pudo conectar con el servidor.', { cause });
    this.name = 'NetworkError';
  }
}
