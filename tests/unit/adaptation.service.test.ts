import { describe, expect, it } from 'vitest';

import {
  adaptActivity,
  type AdaptableActivity,
  type AdaptationProfile,
} from '../../src/modules/activities/adaptation.service.js';

const activity: AdaptableActivity = {
  id: 'activity-1',
  title: 'Reconocer colores',
  description: 'Identifica colores básicos',
  category: 'COLORS',
  difficulty: 1,
  estimatedMinutes: 5,
  steps: [
    {
      id: 'step-3',
      stepNumber: 3,
      instruction: 'Toca el color azul.',
      imageUrl: '/blue.png',
      audioUrl: '/blue.mp3',
    },
    {
      id: 'step-1',
      stepNumber: 1,
      instruction: 'Mira el color rojo.',
      imageUrl: '/red.png',
      audioUrl: '/red.mp3',
    },
    {
      id: 'step-2',
      stepNumber: 2,
      instruction: 'Elige el color verde.',
      imageUrl: '/green.png',
      audioUrl: null,
    },
  ],
};

const profile: AdaptationProfile = {
  visualSupport: true,
  audioSupport: false,
  shortInstructions: true,
  stepByStep: true,
  breaksEnabled: true,
  attentionSupport: true,
  autonomyLevel: 1,
};

describe('adaptActivity', () => {
  it('ordena los pasos y refleja exactamente el perfil de presentación', () => {
    const adapted = adaptActivity(activity, profile);

    expect(adapted.presentation).toEqual({
      showOneStepAtATime: true,
      useShortInstructions: true,
      showVisualSupport: true,
      enableAudio: false,
      enableBreaks: true,
      attentionSupport: true,
      autonomyLevel: 1,
    });
    expect(adapted.steps.map((step) => step.number)).toEqual([1, 2, 3]);
    expect(adapted.steps.map((step) => step.id)).toEqual(['step-1', 'step-2', 'step-3']);
  });

  it('oculta los recursos deshabilitados sin reescribir instrucciones', () => {
    const adapted = adaptActivity(activity, {
      ...profile,
      visualSupport: false,
      audioSupport: true,
    });

    expect(adapted.steps[0]).toMatchObject({
      instruction: 'Mira el color rojo.',
      imageUrl: null,
      audioUrl: '/red.mp3',
    });
  });

  it('no muta la actividad ni el orden base almacenado', () => {
    const original = structuredClone(activity);

    adaptActivity(activity, profile);

    expect(activity).toEqual(original);
    expect(activity.steps.map((step) => step.stepNumber)).toEqual([3, 1, 2]);
  });

  it('resuelve empates inválidos de número de paso de forma determinista', () => {
    const malformedActivity: AdaptableActivity = {
      ...activity,
      steps: [
        { ...activity.steps[0]!, id: 'step-b', stepNumber: 1 },
        { ...activity.steps[1]!, id: 'step-a', stepNumber: 1 },
      ],
    };

    expect(adaptActivity(malformedActivity, profile).steps.map((step) => step.id)).toEqual([
      'step-a',
      'step-b',
    ]);
  });
});
