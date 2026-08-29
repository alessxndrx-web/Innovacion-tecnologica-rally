import { PrismaClient } from '@prisma/client';
import type { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildApp } from '../../src/app.js';
import { loadConfig, type AppConfig } from '../../src/config/env.js';

const ACTIVITY_ID = '20000000-0000-4000-8000-000000000001';
const STEP_ONE = '21000000-0000-4000-8000-000000000001';
const STEP_TWO = '21000000-0000-4000-8000-000000000002';
const STEP_WITHOUT_CONTRACT = '21000000-0000-4000-8000-000000000003';

let prisma: PrismaClient;
let app: FastifyInstance;

/** Límites altos: la suite hace muchas llamadas desde la misma IP simulada. */
function testConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    ...loadConfig(),
    rateLimit: { max: 10_000, windowMs: 60_000 },
    authRateLimit: { max: 10_000, windowMs: 60_000 },
    enableDocs: false,
    ...overrides,
  };
}

async function resetDatabase(): Promise<void> {
  await prisma.attemptResponse.deleteMany();
  await prisma.activityAttempt.deleteMany();
  await prisma.learningProfile.deleteMany();
  await prisma.learner.deleteMany();
  await prisma.user.deleteMany();
  await prisma.activityStep.deleteMany();
  await prisma.activity.deleteMany();

  await prisma.activity.create({
    data: {
      id: ACTIVITY_ID,
      title: 'Colores de prueba',
      description: 'Actividad usada por las pruebas de integración.',
      category: 'COLORS',
      difficulty: 1,
      estimatedMinutes: 5,
      isPublished: true,
      steps: {
        create: [
          {
            id: STEP_ONE,
            stepNumber: 1,
            instruction: 'Elige el color rojo.',
            imageUrl: '/rojo.png',
            audioUrl: '/rojo.mp3',
            expectedResponse: { type: 'exact', value: 'rojo', caseSensitive: false },
          },
          {
            id: STEP_TWO,
            stepNumber: 2,
            instruction: 'Elige el color azul.',
            imageUrl: '/azul.png',
            audioUrl: null,
            expectedResponse: { type: 'exact', value: 'azul', caseSensitive: false },
          },
          {
            // Sin contrato evaluable (columna nula): no debe contar en el
            // denominador del puntaje.
            id: STEP_WITHOUT_CONTRACT,
            stepNumber: 3,
            instruction: 'Cuenta lo que ves.',
            imageUrl: null,
            audioUrl: null,
          },
        ],
      },
    },
  });
}

async function registerAdult(email: string): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/register',
    payload: {
      email,
      password: 'ClaveSegura2026',
      fullName: 'Adulto de prueba',
      role: 'PARENT',
    },
  });
  expect(response.statusCode).toBe(201);
  return response.json<{ data: { accessToken: string } }>().data.accessToken;
}

async function createLearner(token: string, displayName = 'Luna'): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/learners',
    headers: { authorization: `Bearer ${token}` },
    payload: { displayName },
  });
  expect(response.statusCode).toBe(201);
  return response.json<{ data: { id: string } }>().data.id;
}

beforeAll(async () => {
  prisma = new PrismaClient();
  app = await buildApp({ config: testConfig(), prisma, logger: false });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

beforeEach(async () => {
  await resetDatabase();
});

describe('salud y errores de protocolo', () => {
  it('responde /health con la base disponible', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ data: { status: 'ok', database: 'ready' } });
  });

  it('devuelve 415, no 500, cuando no hay parser para el Content-Type', async () => {
    // Fastify trae parser propio para application/json y text/plain; cualquier
    // otro tipo llega al manejador de errores como fallo de protocolo.
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/xml' },
      payload: '<login />',
    });

    expect(response.statusCode).toBe(415);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('devuelve 400, no 500, cuando el JSON está mal formado', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: '{"email":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('BAD_REQUEST');
  });

  it('acepta application/json con el cuerpo vacío en un POST sin datos', async () => {
    const token = await registerAdult('cuerpovacio@example.test');
    const learnerId = await createLearner(token);
    const attempt = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts`,
      headers: { authorization: `Bearer ${token}` },
      payload: { activityId: ACTIVITY_ID },
    });
    const attemptId = attempt.json<{ data: { id: string } }>().data.id;

    const completed = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts/${attemptId}/complete`,
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      payload: '',
    });

    expect(completed.statusCode).toBe(200);
  });

  it('devuelve el sobre de error en rutas inexistentes', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/no-existe' });

    expect(response.statusCode).toBe(404);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('ROUTE_NOT_FOUND');
  });
});

describe('autenticación', () => {
  it('registra una cuenta y nunca expone el hash de la contraseña', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'adulto@example.test',
        password: 'ClaveSegura2026',
        fullName: 'Adulto de prueba',
        role: 'PARENT',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.body).not.toContain('passwordHash');
    expect(response.json<{ data: { user: { email: string } } }>().data.user.email).toBe(
      'adulto@example.test',
    );
  });

  it('rechaza un correo ya registrado sin revelar detalles', async () => {
    await registerAdult('repetido@example.test');
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: 'repetido@example.test',
        password: 'OtraClave2026',
        fullName: 'Otro adulto',
        role: 'TEACHER',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json<{ error: { code: string } }>().error.code).toBe(
      'EMAIL_ALREADY_REGISTERED',
    );
  });

  it('rechaza credenciales inválidas', async () => {
    await registerAdult('login@example.test');
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'login@example.test', password: 'ClaveEquivocada1' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('INVALID_CREDENTIALS');
  });

  it('exige token en las rutas protegidas', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/learners' });

    expect(response.statusCode).toBe(401);
  });
});

describe('aislamiento entre cuentas', () => {
  it('no deja que otra cuenta lea el estudiante ajeno', async () => {
    const ownerToken = await registerAdult('duenio@example.test');
    const learnerId = await createLearner(ownerToken);
    const intruderToken = await registerAdult('intruso@example.test');

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/learners/${learnerId}`,
      headers: { authorization: `Bearer ${intruderToken}` },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('LEARNER_NOT_FOUND');
  });

  it('no deja que otra cuenta consulte el progreso ajeno', async () => {
    const ownerToken = await registerAdult('duenio2@example.test');
    const learnerId = await createLearner(ownerToken);
    const intruderToken = await registerAdult('intruso2@example.test');

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/learners/${learnerId}/progress`,
      headers: { authorization: `Bearer ${intruderToken}` },
    });

    expect(response.statusCode).toBe(404);
  });

  it('no deja que otra cuenta abra un intento sobre el estudiante ajeno', async () => {
    const ownerToken = await registerAdult('duenio3@example.test');
    const learnerId = await createLearner(ownerToken);
    const intruderToken = await registerAdult('intruso3@example.test');

    const response = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts`,
      headers: { authorization: `Bearer ${intruderToken}` },
      payload: { activityId: ACTIVITY_ID },
    });

    expect(response.statusCode).toBe(404);
  });
});

describe('actividad adaptada', () => {
  it('oculta el audio cuando el perfil no lo activa', async () => {
    const token = await registerAdult('adaptada@example.test');
    const learnerId = await createLearner(token);

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/learners/${learnerId}/activities/${ACTIVITY_ID}/adapted`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{
      data: {
        presentation: { enableAudio: boolean; showVisualSupport: boolean };
        steps: { number: number; imageUrl: string | null; audioUrl: string | null }[];
      };
    }>();
    expect(body.data.presentation.enableAudio).toBe(false);
    expect(body.data.presentation.showVisualSupport).toBe(true);
    expect(body.data.steps.map((step) => step.number)).toEqual([1, 2, 3]);
    expect(body.data.steps.every((step) => step.audioUrl === null)).toBe(true);
    expect(body.data.steps[0]?.imageUrl).toBe('/rojo.png');
  });
});

describe('intentos y puntuación', () => {
  it('retoma el intento abierto en lugar de crear otro', async () => {
    const token = await registerAdult('intento@example.test');
    const learnerId = await createLearner(token);

    const first = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts`,
      headers: { authorization: `Bearer ${token}` },
      payload: { activityId: ACTIVITY_ID },
    });
    const second = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts`,
      headers: { authorization: `Bearer ${token}` },
      payload: { activityId: ACTIVITY_ID },
    });

    expect(first.statusCode).toBe(201);
    expect(second.statusCode).toBe(200);
    expect(second.json<{ data: { id: string } }>().data.id).toBe(
      first.json<{ data: { id: string } }>().data.id,
    );
    expect(await prisma.activityAttempt.count({ where: { learnerId } })).toBe(1);
  });

  it('cuenta los pasos evaluables sin responder como incorrectos', async () => {
    const token = await registerAdult('puntaje@example.test');
    const learnerId = await createLearner(token);
    const attempt = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts`,
      headers: { authorization: `Bearer ${token}` },
      payload: { activityId: ACTIVITY_ID },
    });
    const attemptId = attempt.json<{ data: { id: string } }>().data.id;

    // Solo se responde uno de los dos pasos evaluables, y correctamente.
    const answer = await app.inject({
      method: 'PUT',
      url: `/api/v1/learners/${learnerId}/attempts/${attemptId}/responses/${STEP_ONE}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { response: { value: 'ROJO' } },
    });
    expect(answer.statusCode).toBe(200);
    expect(answer.json<{ data: { isCorrect: boolean } }>().data.isCorrect).toBe(true);

    const completed = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts/${attemptId}/complete`,
      headers: { authorization: `Bearer ${token}` },
    });

    expect(completed.statusCode).toBe(200);
    const data = completed.json<{
      data: { correctAnswers: number; totalAnswers: number; score: number; stars: number };
    }>().data;
    // Dos pasos evaluables (el tercero no tiene contrato): 1 de 2 = 50.
    expect(data).toMatchObject({ correctAnswers: 1, totalAnswers: 2, score: 50, stars: 2 });
  });

  it('marca como no evaluable el paso sin contrato', async () => {
    const token = await registerAdult('noevaluable@example.test');
    const learnerId = await createLearner(token);
    const attempt = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts`,
      headers: { authorization: `Bearer ${token}` },
      payload: { activityId: ACTIVITY_ID },
    });
    const attemptId = attempt.json<{ data: { id: string } }>().data.id;

    const answer = await app.inject({
      method: 'PUT',
      url: `/api/v1/learners/${learnerId}/attempts/${attemptId}/responses/${STEP_WITHOUT_CONTRACT}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { response: { value: 'lo que sea' } },
    });

    expect(answer.statusCode).toBe(200);
    expect(answer.json<{ data: { isCorrect: boolean | null } }>().data.isCorrect).toBeNull();
  });

  it('permite abandonar un intento y bloquea completarlo después', async () => {
    const token = await registerAdult('abandono@example.test');
    const learnerId = await createLearner(token);
    const attempt = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts`,
      headers: { authorization: `Bearer ${token}` },
      payload: { activityId: ACTIVITY_ID },
    });
    const attemptId = attempt.json<{ data: { id: string } }>().data.id;

    const abandoned = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts/${attemptId}/abandon`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(abandoned.statusCode).toBe(200);
    expect(abandoned.json<{ data: { status: string } }>().data.status).toBe('ABANDONED');

    const completed = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts/${attemptId}/complete`,
      headers: { authorization: `Bearer ${token}` },
    });
    expect(completed.statusCode).toBe(409);
    expect(completed.json<{ error: { code: string } }>().error.code).toBe('ATTEMPT_NOT_EDITABLE');
  });

  it('rechaza un paso que no pertenece a la actividad del intento', async () => {
    const token = await registerAdult('pasoajeno@example.test');
    const learnerId = await createLearner(token);
    const other = await prisma.activity.create({
      data: {
        title: 'Otra actividad',
        description: 'No relacionada.',
        category: 'SHAPES',
        difficulty: 1,
        estimatedMinutes: 3,
        isPublished: true,
        steps: {
          create: [
            {
              stepNumber: 1,
              instruction: 'Elige el círculo.',
              expectedResponse: { type: 'exact', value: 'circulo' },
            },
          ],
        },
      },
      include: { steps: true },
    });
    const attempt = await app.inject({
      method: 'POST',
      url: `/api/v1/learners/${learnerId}/attempts`,
      headers: { authorization: `Bearer ${token}` },
      payload: { activityId: ACTIVITY_ID },
    });
    const attemptId = attempt.json<{ data: { id: string } }>().data.id;

    const response = await app.inject({
      method: 'PUT',
      url: `/api/v1/learners/${learnerId}/attempts/${attemptId}/responses/${other.steps[0]!.id}`,
      headers: { authorization: `Bearer ${token}` },
      payload: { response: { value: 'circulo' } },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ error: { code: string } }>().error.code).toBe('INVALID_ACTIVITY_STEP');
  });
});

describe('limitación de tasa', () => {
  it('responde 429 con el sobre de error al superar el límite de autenticación', async () => {
    const limitedApp = await buildApp({
      config: testConfig({ authRateLimit: { max: 2, windowMs: 60_000 } }),
      prisma,
      logger: false,
    });
    await limitedApp.ready();

    try {
      const attempt = () =>
        limitedApp.inject({
          method: 'POST',
          url: '/api/v1/auth/login',
          payload: { email: 'inexistente@example.test', password: 'ClaveSegura2026' },
        });

      await attempt();
      await attempt();
      const blocked = await attempt();

      expect(blocked.statusCode).toBe(429);
      expect(blocked.json<{ error: { code: string } }>().error.code).toBe('TOO_MANY_REQUESTS');
    } finally {
      // El cliente Prisma es compartido; se cierra una sola vez en afterAll.
      await limitedApp.close();
    }
  });
});
