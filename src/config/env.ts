import { z } from 'zod';

const durationPattern = /^(\d+)(s|m|h|d)$/;

function durationToSeconds(value: string): number {
  const match = durationPattern.exec(value);
  if (!match) {
    throw new Error(`Duración inválida: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];
  const multiplier = unit === 'd' ? 86_400 : unit === 'h' ? 3_600 : unit === 'm' ? 60 : 1;
  return amount * multiplier;
}

const booleanFlag = z.enum(['true', 'false']);

/** Secretos de ejemplo que nunca deben llegar a un despliegue real. */
const PLACEHOLDER_SECRET_MARKERS = [
  'replace-this-with-a-random-secret',
  'local-compose-secret-change-before-any-real-deployment',
  'change-me',
];

const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria.'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET debe tener al menos 32 caracteres.'),
  ACCESS_TOKEN_TTL: z
    .string()
    .regex(durationPattern, 'ACCESS_TOKEN_TTL debe usar s, m, h o d (por ejemplo, 15m).')
    .default('1h'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  // Detrás de un balanceador o CDN, sin esto la limitación por IP ve siempre la
  // del proxy y limita a todos los clientes como si fueran uno solo.
  TRUST_PROXY: booleanFlag.default('false'),
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),
  RATE_LIMIT_WINDOW: z.string().regex(durationPattern).default('1m'),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(10),
  AUTH_RATE_LIMIT_WINDOW: z.string().regex(durationPattern).default('15m'),
  ENABLE_DOCS: booleanFlag.optional(),
});

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface AppConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  jwtAccessSecret: string;
  accessTokenTtlSeconds: number;
  corsOrigins: string[];
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  trustProxy: boolean;
  rateLimit: RateLimitConfig;
  authRateLimit: RateLimitConfig;
  enableDocs: boolean;
}

export function loadConfig(environment: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = environmentSchema.safeParse(environment);
  if (!parsed.success) {
    const problems = parsed.error.issues.map((issue) => issue.message).join(' ');
    throw new Error(`Configuración de entorno inválida. ${problems}`);
  }

  const env = parsed.data;
  const corsOrigins = env.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    throw new Error('Configuración de entorno inválida. CORS_ORIGINS no puede estar vacío.');
  }

  if (env.NODE_ENV === 'production') {
    const secret = env.JWT_ACCESS_SECRET.toLowerCase();
    if (PLACEHOLDER_SECRET_MARKERS.some((marker) => secret.includes(marker))) {
      throw new Error(
        'Configuración de entorno inválida. JWT_ACCESS_SECRET conserva un valor de ejemplo; ' +
          'genere uno propio antes de desplegar (openssl rand -base64 48).',
      );
    }

    if (corsOrigins.includes('*')) {
      throw new Error(
        'Configuración de entorno inválida. CORS_ORIGINS no puede ser "*" en producción.',
      );
    }
  }

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    databaseUrl: env.DATABASE_URL,
    jwtAccessSecret: env.JWT_ACCESS_SECRET,
    accessTokenTtlSeconds: durationToSeconds(env.ACCESS_TOKEN_TTL),
    corsOrigins,
    logLevel: env.LOG_LEVEL,
    trustProxy: env.TRUST_PROXY === 'true',
    rateLimit: {
      max: env.RATE_LIMIT_MAX,
      windowMs: durationToSeconds(env.RATE_LIMIT_WINDOW) * 1000,
    },
    authRateLimit: {
      max: env.AUTH_RATE_LIMIT_MAX,
      windowMs: durationToSeconds(env.AUTH_RATE_LIMIT_WINDOW) * 1000,
    },
    enableDocs:
      env.ENABLE_DOCS === undefined ? env.NODE_ENV !== 'production' : env.ENABLE_DOCS === 'true',
  };
}
