import { describe, expect, it } from 'vitest';

import {
  calculateScore,
  evaluateResponse,
  starsForScore,
} from '../../src/modules/attempts/scoring.service.js';

describe('evaluateResponse', () => {
  it('evalúa igualdad exacta de valores JSON, incluidos objetos', () => {
    expect(evaluateResponse({ type: 'exact', value: 'rojo' }, 'rojo')).toBe(true);
    expect(
      evaluateResponse(
        { type: 'exact', value: { color: 'rojo', count: 2 } },
        { count: 2, color: 'rojo' },
      ),
    ).toBe(true);
    expect(evaluateResponse({ type: 'exact', value: 5 }, '5')).toBe(false);
  });

  it('extrae el valor del contrato de respuesta usado por la API', () => {
    expect(
      evaluateResponse({ type: 'exact', value: 'rojo', caseSensitive: false }, { value: 'ROJO' }),
    ).toBe(true);
    expect(evaluateResponse({ type: 'exact', value: 3 }, { value: 4 })).toBe(false);
  });

  it('solo ignora mayúsculas cuando el contrato lo solicita', () => {
    expect(evaluateResponse({ type: 'exact', value: 'Rojo' }, 'rojo')).toBe(false);
    expect(evaluateResponse({ type: 'exact', value: 'Rojo', caseSensitive: false }, 'rojo')).toBe(
      true,
    );
  });

  it('soporta respuestas alternativas y arreglos sin orden', () => {
    expect(evaluateResponse({ type: 'oneOf', values: ['círculo', 'redondo'] }, 'redondo')).toBe(
      true,
    );
    expect(evaluateResponse({ type: 'unorderedArray', values: [1, 2, 2] }, [2, 1, 2])).toBe(true);
    expect(evaluateResponse({ type: 'unorderedArray', values: [1, 2, 2] }, [1, 1, 2])).toBe(false);
  });

  it('devuelve null para contratos desconocidos, incompletos o no JSON', () => {
    expect(evaluateResponse(null, 'rojo')).toBeNull();
    expect(evaluateResponse({ type: 'script', code: 'process.exit()' }, 'x')).toBeNull();
    expect(evaluateResponse({ type: 'exact' }, undefined)).toBeNull();
    expect(evaluateResponse({ type: 'oneOf', values: [] }, 'x')).toBeNull();
    expect(evaluateResponse({ type: 'exact', value: Number.NaN }, 1)).toBeNull();
  });

  it('rechaza estructuras cíclicas sin ejecutar ni interpretar contenido', () => {
    const cyclic: Record<string, unknown> = { type: 'exact' };
    cyclic.value = cyclic;
    (globalThis as { __unsafeEvaluationMarker?: boolean }).__unsafeEvaluationMarker = false;

    expect(evaluateResponse(cyclic, 'x')).toBeNull();
    expect(
      evaluateResponse(
        { type: 'exact', value: 'globalThis.__unsafeEvaluationMarker = true' },
        'otra respuesta',
      ),
    ).toBe(false);
    expect((globalThis as { __unsafeEvaluationMarker?: boolean }).__unsafeEvaluationMarker).toBe(
      false,
    );

    delete (globalThis as { __unsafeEvaluationMarker?: boolean }).__unsafeEvaluationMarker;
  });
});

describe('calculateScore', () => {
  it('excluye respuestas no evaluables del cálculo', () => {
    expect(
      calculateScore([
        { isCorrect: true },
        { isCorrect: null },
        { isCorrect: false },
        { isCorrect: true },
      ]),
    ).toEqual({
      correctAnswers: 2,
      totalAnswers: 3,
      score: 67,
      stars: 2,
    });
  });

  it('devuelve cero estrellas cuando no hay respuestas evaluables', () => {
    expect(calculateScore([{ isCorrect: null }])).toEqual({
      correctAnswers: 0,
      totalAnswers: 0,
      score: 0,
      stars: 0,
    });
    expect(calculateScore([])).toEqual({
      correctAnswers: 0,
      totalAnswers: 0,
      score: 0,
      stars: 0,
    });
  });

  it.each([
    [0, 1],
    [49, 1],
    [50, 2],
    [79, 2],
    [80, 3],
    [100, 3],
  ] as const)('asigna %i puntos a %i estrella(s)', (score, stars) => {
    expect(starsForScore(score)).toBe(stars);
  });

  it('aplica las bandas de estrellas al puntaje calculado', () => {
    expect(calculateScore([{ isCorrect: false }]).stars).toBe(1);
    expect(calculateScore([{ isCorrect: true }, { isCorrect: false }]).stars).toBe(2);
    expect(calculateScore([{ isCorrect: true }]).stars).toBe(3);
  });
});
