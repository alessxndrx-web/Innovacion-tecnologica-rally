export type UserRole = 'PARENT' | 'TEACHER';

/** Espejo de `publicUserSchema` del backend. */
export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
}

const STORAGE_KEY = 'sinappsis.session';

/**
 * La sesión vive en `localStorage` para sobrevivir a recargas y pestañas.
 *
 * Es una decisión con contrapartida: un fallo de XSS podría leer el token de
 * renovación. La alternativa robusta es una cookie `httpOnly`, pero el backend
 * entrega los tokens en el cuerpo de la respuesta, así que no está disponible
 * sin cambiarlo. Lo que sí acota el daño es que el token de acceso dura 15
 * minutos y que la renovación rota en cada uso.
 *
 * Todo acceso va envuelto en try/catch: en modo privado o con el
 * almacenamiento bloqueado, `localStorage` lanza en lugar de devolver vacío.
 */
export function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === null) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Sin persistencia la sesión dura lo que la pestaña; no es motivo de fallo.
  }
}

export function clearSession(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nada que hacer: el llamador ya trata la sesión como cerrada.
  }
}

/** Evita que un valor corrupto en el almacenamiento reviente la aplicación. */
function isSession(value: unknown): value is Session {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Partial<Session>;
  return (
    typeof candidate.accessToken === 'string' &&
    typeof candidate.refreshToken === 'string' &&
    typeof candidate.user === 'object' &&
    candidate.user !== null &&
    typeof candidate.user.id === 'string' &&
    typeof candidate.user.email === 'string'
  );
}
