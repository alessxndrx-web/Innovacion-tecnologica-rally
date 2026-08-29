import { ApiError } from '../api/errors';
import type { PublicUser, Session, UserRole } from './session-storage';

/**
 * Autenticación local para demostraciones, sin backend.
 *
 * Se activa sola cuando `VITE_API_BASE_URL` no apunta a ninguna parte (ver
 * `api/config.ts`). Reproduce el contrato del backend —las mismas reglas de
 * validación, los mismos `code` de error y el mismo sobre de sesión— para que
 * las pantallas no sepan cuál de los dos las atiende y para que el día que
 * haya API el comportamiento no cambie.
 *
 * Las cuentas viven en `localStorage` de quien visita: no se comparten entre
 * dispositivos ni sobreviven a un borrado de datos del navegador. Es suficiente
 * para que alguien cree su cuenta y recorra la aplicación; no sustituye al
 * registro real.
 */

const ACCOUNTS_KEY = 'sinappsis.demo.accounts';

interface DemoAccount {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  /** Sal por cuenta: sin ella dos contraseñas iguales darían el mismo hash. */
  salt: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface DemoRegisterInput {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}

function validationError(message: string, field?: string): ApiError {
  return new ApiError(400, 'VALIDATION_ERROR', message, [
    field === undefined ? { message } : { field, message },
  ]);
}

function readAccounts(): DemoAccount[] {
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    if (raw === null) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as DemoAccount[]) : [];
  } catch {
    // Almacenamiento bloqueado o contenido corrupto: se empieza en limpio en
    // lugar de dejar la pantalla de acceso inservible.
    return [];
  }
}

function writeAccounts(accounts: DemoAccount[]): void {
  try {
    window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // Sin persistencia la cuenta dura lo que la pestaña, que para una demo
    // sigue siendo mejor que no poder entrar.
  }
}

function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(buffer);
  } else {
    for (let index = 0; index < buffer.length; index += 1) {
      buffer[index] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(buffer, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Deriva la contraseña antes de guardarla.
 *
 * Escribir contraseñas en claro en `localStorage` sería innecesario incluso en
 * una demo: mucha gente reutiliza contraseñas y el navegador es de quien visita.
 * SHA-256 con sal no es argon2id —no tiene coste de memoria ni de tiempo, así
 * que no resiste fuerza bruta— pero evita el texto plano, que es el problema
 * real aquí.
 *
 * `crypto.subtle` solo existe en contexto seguro (HTTPS o localhost). Sirviendo
 * la demo por HTTP desde una IP de la red local no está, de ahí el respaldo.
 */
async function hashPassword(password: string, salt: string): Promise<string> {
  const material = `${salt}:${password}`;

  if (typeof crypto !== 'undefined' && crypto.subtle !== undefined) {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(material));
    return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join(
      '',
    );
  }

  let hash = 0x811c9dc5;
  for (let index = 0; index < material.length; index += 1) {
    hash ^= material.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `fnv-${hash.toString(16)}`;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toPublicUser(account: DemoAccount): PublicUser {
  return {
    id: account.id,
    email: account.email,
    fullName: account.fullName,
    role: account.role,
    avatarUrl: null,
    isActive: true,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}

/** Los tokens no se verifican contra nada; identifican la sesión y poco más. */
function buildSession(account: DemoAccount): Session {
  return {
    accessToken: `demo.${account.id}.${randomHex(8)}`,
    refreshToken: `demo.${account.id}.${randomHex(16)}`,
    user: toPublicUser(account),
  };
}

/** Mismas reglas que `registerBodySchema` en el backend. */
function assertValidRegistration(input: DemoRegisterInput): void {
  const email = normalizeEmail(input.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw validationError('El correo no es válido.', 'email');
  }

  const fullName = input.fullName.trim();
  if (fullName.length < 2 || fullName.length > 100) {
    throw validationError('El nombre debe tener entre 2 y 100 caracteres.', 'fullName');
  }

  if (input.password.length < 10 || input.password.length > 128) {
    throw validationError('La contraseña debe tener al menos 10 caracteres.', 'password');
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(input.password)) {
    throw validationError('La contraseña debe incluir una letra.', 'password');
  }
  if (!/[0-9]/.test(input.password)) {
    throw validationError('La contraseña debe incluir un número.', 'password');
  }

  if (input.role !== 'PARENT' && input.role !== 'TEACHER') {
    throw validationError('Elige desde dónde acompañas.', 'role');
  }
}

export async function demoRegister(input: DemoRegisterInput): Promise<Session> {
  assertValidRegistration(input);

  const email = normalizeEmail(input.email);
  const accounts = readAccounts();

  if (accounts.some((account) => account.email === email)) {
    // El backend responde con este mismo código y un mensaje deliberadamente
    // vago, para no confirmar qué correos están registrados.
    throw new ApiError(409, 'EMAIL_ALREADY_REGISTERED', 'No fue posible registrar la cuenta.');
  }

  const salt = randomHex(16);
  const now = new Date().toISOString();
  const account: DemoAccount = {
    id: randomHex(16),
    email,
    fullName: input.fullName.trim(),
    role: input.role,
    salt,
    passwordHash: await hashPassword(input.password, salt),
    createdAt: now,
    updatedAt: now,
  };

  writeAccounts([...accounts, account]);
  return buildSession(account);
}

export async function demoLogin(email: string, password: string): Promise<Session> {
  const account = readAccounts().find((candidate) => candidate.email === normalizeEmail(email));

  // Un solo mensaje para «no existe» y «contraseña incorrecta», igual que el
  // backend: distinguirlos revelaría qué correos tienen cuenta.
  if (
    account === undefined ||
    (await hashPassword(password, account.salt)) !== account.passwordHash
  ) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'El correo o la contraseña no son válidos.');
  }

  return buildSession(account);
}

/**
 * Confirma la sesión guardada contra el almacén local, que es lo que hace el
 * `GET /auth/me` real: si la cuenta ya no está, la sesión no vale.
 */
export function demoCurrentUser(userId: string): PublicUser {
  const account = readAccounts().find((candidate) => candidate.id === userId);
  if (account === undefined) {
    throw new ApiError(401, 'UNAUTHORIZED', 'La sesión no es válida.');
  }
  return toPublicUser(account);
}
