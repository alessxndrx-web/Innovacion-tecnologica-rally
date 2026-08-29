import {
  clearSession,
  loadSession,
  saveSession,
  type PublicUser,
  type Session,
  type UserRole,
} from '../auth/session-storage';
import { API_BASE_URL } from './config';

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

interface RequestOptions {
  method?: string;
  body?: unknown;
  /** `false` en las rutas públicas de autenticación. Por defecto se envía token. */
  authenticated?: boolean;
  signal?: AbortSignal;
}

async function rawRequest(
  path: string,
  options: RequestOptions,
  accessToken: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken !== null) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const init: RequestInit = {
    method: options.method ?? 'GET',
    headers,
  };
  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }
  if (options.signal !== undefined) {
    init.signal = options.signal;
  }

  try {
    return await fetch(`${API_BASE_URL}${path}`, init);
  } catch (cause) {
    throw new NetworkError(cause);
  }
}

interface ErrorEnvelope {
  error?: { code?: unknown; message?: unknown; details?: unknown };
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  const payload: unknown = text === '' ? null : safeJsonParse(text);

  if (response.ok) {
    return payload as T;
  }

  const envelope = payload as ErrorEnvelope | null;
  const code = typeof envelope?.error?.code === 'string' ? envelope.error.code : 'UNKNOWN_ERROR';
  const message =
    typeof envelope?.error?.message === 'string'
      ? envelope.error.message
      : 'Ocurrió un error inesperado.';
  const details = Array.isArray(envelope?.error?.details)
    ? (envelope.error.details as ApiErrorDetail[])
    : [];

  throw new ApiError(response.status, code, message, details);
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

let refreshInFlight: Promise<Session | null> | null = null;

/**
 * Renueva la sesión, con una sola renovación en vuelo a la vez.
 *
 * Esto no es una optimización, es un requisito del backend: el token de
 * renovación ROTA en cada uso y, si detecta que uno ya rotado se vuelve a
 * presentar, lo interpreta como credencial robada y revoca la cadena entera de
 * sesiones. Si dos peticiones caducasen a la vez y renovaran en paralelo,
 * enviarían el mismo token dos veces y cerrarían la sesión del usuario. Las
 * llamadas concurrentes esperan al resultado de la primera.
 */
async function refreshSession(): Promise<Session | null> {
  if (refreshInFlight !== null) {
    return refreshInFlight;
  }

  refreshInFlight = (async (): Promise<Session | null> => {
    const current = loadSession();
    if (current === null) {
      return null;
    }

    const response = await rawRequest(
      '/api/v1/auth/refresh',
      { method: 'POST', body: { refreshToken: current.refreshToken } },
      null,
    );

    if (!response.ok) {
      clearSession();
      return null;
    }

    const body = (await response.json()) as { data: Session };
    saveSession(body.data);
    return body.data;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

/**
 * Petición autenticada con un único reintento tras renovar. El token de acceso
 * dura 15 minutos, así que caducar a mitad de sesión es lo normal, no la
 * excepción: se renueva y se repite la petición sin que el usuario lo note.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const requiresAuth = options.authenticated !== false;
  const session = requiresAuth ? loadSession() : null;

  let response = await rawRequest(path, options, session?.accessToken ?? null);

  if (requiresAuth && response.status === 401 && session !== null) {
    const renewed = await refreshSession();
    if (renewed === null) {
      throw new ApiError(401, 'SESSION_EXPIRED', 'La sesión expiró. Inicia sesión nuevamente.');
    }
    response = await rawRequest(path, options, renewed.accessToken);
  }

  return parseResponse<T>(response);
}

interface DataEnvelope<T> {
  data: T;
}

export async function login(email: string, password: string): Promise<Session> {
  const body = await apiRequest<DataEnvelope<Session>>('/api/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    authenticated: false,
  });

  saveSession(body.data);
  return body.data;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

/**
 * Crea la cuenta y deja la sesión iniciada.
 *
 * El backend responde `201` con exactamente el mismo sobre que `login`, así que
 * quien se registra entra directamente sin un segundo viaje al servidor.
 */
export async function register(input: RegisterInput): Promise<Session> {
  const body = await apiRequest<DataEnvelope<Session>>('/api/v1/auth/register', {
    method: 'POST',
    body: input,
    authenticated: false,
  });

  saveSession(body.data);
  return body.data;
}

/**
 * Cierra la sesión en el servidor y en el cliente. El borrado local ocurre
 * pase lo que pase: si la red falla, el usuario igualmente queda desconectado
 * en este dispositivo y el token acabará caducando por su cuenta.
 */
export async function logout(): Promise<void> {
  const current = loadSession();
  clearSession();

  if (current === null) {
    return;
  }

  try {
    await rawRequest(
      '/api/v1/auth/logout',
      { method: 'POST', body: { refreshToken: current.refreshToken } },
      null,
    );
  } catch {
    // Sin conexión no se puede revocar ahora; la sesión local ya está cerrada.
  }
}

export async function fetchCurrentUser(): Promise<PublicUser> {
  const body = await apiRequest<DataEnvelope<PublicUser>>('/api/v1/auth/me');
  return body.data;
}
