import { ApiError, NetworkError } from './client';

/**
 * Traduce un fallo a un mensaje para la persona usuaria.
 *
 * Se decide por el `code` del sobre de error, no por el texto: el código es
 * parte del contrato del backend y el mensaje puede cambiar sin aviso.
 *
 * `extra` permite a cada pantalla añadir los códigos que solo le afectan sin
 * duplicar los comunes.
 */
export function messageForError(error: unknown, extra: Record<string, string> = {}): string {
  if (error instanceof NetworkError) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }

  if (error instanceof ApiError) {
    const specific = extra[error.code];
    if (specific !== undefined) {
      return specific;
    }

    switch (error.code) {
      case 'INVALID_CREDENTIALS':
        return 'El correo o la contraseña no son válidos.';
      case 'TOO_MANY_REQUESTS':
        return 'Demasiados intentos seguidos. Espera unos minutos antes de volver a probar.';
      case 'VALIDATION_ERROR':
        return error.details[0]?.message ?? 'Revisa los datos introducidos.';
      case 'SESSION_EXPIRED':
        return 'La sesión expiró. Inicia sesión nuevamente.';
      default:
        return error.message;
    }
  }

  return 'Ocurrió un error inesperado. Inténtalo nuevamente.';
}
