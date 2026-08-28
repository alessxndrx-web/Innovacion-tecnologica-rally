import { ActivityCategory, PrismaClient, UserRole } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { argon2id, hash } from 'argon2';

const prisma = new PrismaClient();

type SeedStep = {
  id: string;
  stepNumber: number;
  instruction: string;
  expectedResponse: Prisma.InputJsonObject;
};

type SeedActivity = {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  estimatedMinutes: number;
  steps: SeedStep[];
};

const activities: SeedActivity[] = [
  {
    id: '10000000-0000-4000-8000-000000000001',
    title: 'Vocales',
    description: 'Reconoce las cinco vocales.',
    category: ActivityCategory.LETTERS,
    estimatedMinutes: 5,
    steps: [
      {
        id: '11000000-0000-4000-8000-000000000001',
        stepNumber: 1,
        instruction: 'Elige la vocal A.',
        expectedResponse: { type: 'exact', value: 'A', caseSensitive: false },
      },
      {
        id: '11000000-0000-4000-8000-000000000002',
        stepNumber: 2,
        instruction: 'Elige la vocal E.',
        expectedResponse: { type: 'exact', value: 'E', caseSensitive: false },
      },
      {
        id: '11000000-0000-4000-8000-000000000003',
        stepNumber: 3,
        instruction: 'Elige la vocal I.',
        expectedResponse: { type: 'exact', value: 'I', caseSensitive: false },
      },
      {
        id: '11000000-0000-4000-8000-000000000004',
        stepNumber: 4,
        instruction: 'Elige la vocal O.',
        expectedResponse: { type: 'exact', value: 'O', caseSensitive: false },
      },
      {
        id: '11000000-0000-4000-8000-000000000005',
        stepNumber: 5,
        instruction: 'Elige la vocal U.',
        expectedResponse: { type: 'exact', value: 'U', caseSensitive: false },
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000002',
    title: 'Números del 1 al 5',
    description: 'Identifica los números del uno al cinco.',
    category: ActivityCategory.NUMBERS,
    estimatedMinutes: 5,
    steps: [
      {
        id: '12000000-0000-4000-8000-000000000001',
        stepNumber: 1,
        instruction: 'Elige el número 1.',
        expectedResponse: { type: 'exact', value: 1 },
      },
      {
        id: '12000000-0000-4000-8000-000000000002',
        stepNumber: 2,
        instruction: 'Elige el número 2.',
        expectedResponse: { type: 'exact', value: 2 },
      },
      {
        id: '12000000-0000-4000-8000-000000000003',
        stepNumber: 3,
        instruction: 'Elige el número 3.',
        expectedResponse: { type: 'exact', value: 3 },
      },
      {
        id: '12000000-0000-4000-8000-000000000004',
        stepNumber: 4,
        instruction: 'Elige el número 4.',
        expectedResponse: { type: 'exact', value: 4 },
      },
      {
        id: '12000000-0000-4000-8000-000000000005',
        stepNumber: 5,
        instruction: 'Elige el número 5.',
        expectedResponse: { type: 'exact', value: 5 },
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000003',
    title: 'Colores',
    description: 'Identifica cuatro colores básicos.',
    category: ActivityCategory.COLORS,
    estimatedMinutes: 5,
    steps: [
      {
        id: '13000000-0000-4000-8000-000000000001',
        stepNumber: 1,
        instruction: 'Elige el color rojo.',
        expectedResponse: { type: 'exact', value: 'rojo', caseSensitive: false },
      },
      {
        id: '13000000-0000-4000-8000-000000000002',
        stepNumber: 2,
        instruction: 'Elige el color azul.',
        expectedResponse: { type: 'exact', value: 'azul', caseSensitive: false },
      },
      {
        id: '13000000-0000-4000-8000-000000000003',
        stepNumber: 3,
        instruction: 'Elige el color amarillo.',
        expectedResponse: { type: 'exact', value: 'amarillo', caseSensitive: false },
      },
      {
        id: '13000000-0000-4000-8000-000000000004',
        stepNumber: 4,
        instruction: 'Elige el color verde.',
        expectedResponse: { type: 'exact', value: 'verde', caseSensitive: false },
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000004',
    title: 'Formas',
    description: 'Reconoce cuatro formas sencillas.',
    category: ActivityCategory.SHAPES,
    estimatedMinutes: 6,
    steps: [
      {
        id: '14000000-0000-4000-8000-000000000001',
        stepNumber: 1,
        instruction: 'Elige el círculo.',
        expectedResponse: { type: 'exact', value: 'círculo', caseSensitive: false },
      },
      {
        id: '14000000-0000-4000-8000-000000000002',
        stepNumber: 2,
        instruction: 'Elige el cuadrado.',
        expectedResponse: { type: 'exact', value: 'cuadrado', caseSensitive: false },
      },
      {
        id: '14000000-0000-4000-8000-000000000003',
        stepNumber: 3,
        instruction: 'Elige el triángulo.',
        expectedResponse: { type: 'exact', value: 'triángulo', caseSensitive: false },
      },
      {
        id: '14000000-0000-4000-8000-000000000004',
        stepNumber: 4,
        instruction: 'Elige el rectángulo.',
        expectedResponse: { type: 'exact', value: 'rectángulo', caseSensitive: false },
      },
    ],
  },
  {
    id: '10000000-0000-4000-8000-000000000005',
    title: 'Secuencias simples',
    description: 'Completa secuencias cortas de números.',
    category: ActivityCategory.SEQUENCES,
    estimatedMinutes: 7,
    steps: [
      {
        id: '15000000-0000-4000-8000-000000000001',
        stepNumber: 1,
        instruction: 'Completa: 1, 2, 1, ...',
        expectedResponse: { type: 'exact', value: 2 },
      },
      {
        id: '15000000-0000-4000-8000-000000000002',
        stepNumber: 2,
        instruction: 'Completa: 1, 2, 3, ...',
        expectedResponse: { type: 'exact', value: 4 },
      },
      {
        id: '15000000-0000-4000-8000-000000000003',
        stepNumber: 3,
        instruction: 'Completa: 5, 4, 3, ...',
        expectedResponse: { type: 'exact', value: 2 },
      },
      {
        id: '15000000-0000-4000-8000-000000000004',
        stepNumber: 4,
        instruction: 'Completa: 2, 4, 6, ...',
        expectedResponse: { type: 'exact', value: 8 },
      },
    ],
  },
];

async function seedActivities(): Promise<void> {
  await prisma.$transaction(
    async (tx) => {
      for (const activity of activities) {
        const activityData = {
          title: activity.title,
          description: activity.description,
          category: activity.category,
          difficulty: 1,
          estimatedMinutes: activity.estimatedMinutes,
          imageUrl: null,
          isPublished: true,
        };

        await tx.activity.upsert({
          where: { id: activity.id },
          update: activityData,
          create: { id: activity.id, ...activityData },
        });

        for (const step of activity.steps) {
          const stepData = {
            instruction: step.instruction,
            imageUrl: null,
            audioUrl: null,
            expectedResponse: step.expectedResponse,
          };

          await tx.activityStep.upsert({
            where: {
              activityId_stepNumber: {
                activityId: activity.id,
                stepNumber: step.stepNumber,
              },
            },
            update: stepData,
            create: {
              id: step.id,
              activityId: activity.id,
              stepNumber: step.stepNumber,
              ...stepData,
            },
          });
        }
      }
    },
    { timeout: 30_000 },
  );
}

async function seedDevelopmentAdult(): Promise<boolean> {
  const rawEmail = process.env.DEV_SEED_ADULT_EMAIL;
  const password = process.env.DEV_SEED_ADULT_PASSWORD;

  if (!rawEmail && !password) {
    return false;
  }

  if (!rawEmail || !password) {
    throw new Error(
      'Para crear el adulto de desarrollo, define DEV_SEED_ADULT_EMAIL y DEV_SEED_ADULT_PASSWORD.',
    );
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('El adulto de desarrollo no puede crearse con NODE_ENV=production.');
  }

  const email = rawEmail.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('DEV_SEED_ADULT_EMAIL no contiene un correo válido.');
  }

  if (password.length < 12) {
    throw new Error('DEV_SEED_ADULT_PASSWORD debe tener al menos 12 caracteres.');
  }

  const roleInput = (process.env.DEV_SEED_ADULT_ROLE ?? 'PARENT').toUpperCase();
  if (roleInput !== UserRole.PARENT && roleInput !== UserRole.TEACHER) {
    throw new Error('DEV_SEED_ADULT_ROLE debe ser PARENT o TEACHER.');
  }

  const fullName = process.env.DEV_SEED_ADULT_NAME?.trim() || 'Adulto de desarrollo';
  const passwordHash = await hash(password, {
    type: argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      fullName,
      role: roleInput,
      isActive: true,
    },
    create: {
      email,
      passwordHash,
      fullName,
      role: roleInput,
      isActive: true,
    },
  });

  return true;
}

async function main(): Promise<void> {
  await seedActivities();
  const developmentAdultCreated = await seedDevelopmentAdult();

  console.info(
    `Seed completado: ${activities.length} actividades publicadas; adulto de desarrollo ${
      developmentAdultCreated ? 'configurado' : 'omitido'
    }.`,
  );
}

main()
  .catch((error: unknown) => {
    console.error('No se pudo ejecutar el seed de desarrollo.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
