/** JSON-compatible values accepted by the deterministic response evaluator. */
export type JsonValue =
  string | number | boolean | null | readonly JsonValue[] | { readonly [key: string]: JsonValue };

export interface ExactExpectedResponse {
  readonly type: 'exact';
  readonly value: JsonValue;
  /** String comparison is case-sensitive unless explicitly disabled. */
  readonly caseSensitive?: boolean;
}

export interface OneOfExpectedResponse {
  readonly type: 'oneOf';
  readonly values: readonly JsonValue[];
  /** String comparison is case-sensitive unless explicitly disabled. */
  readonly caseSensitive?: boolean;
}

export interface UnorderedArrayExpectedResponse {
  readonly type: 'unorderedArray';
  readonly values: readonly JsonValue[];
  /** String comparison is case-sensitive unless explicitly disabled. */
  readonly caseSensitive?: boolean;
}

export type ExpectedResponse =
  ExactExpectedResponse | OneOfExpectedResponse | UnorderedArrayExpectedResponse;

export interface ScorableResponse {
  readonly isCorrect: boolean | null;
}

export interface AttemptScore {
  readonly correctAnswers: number;
  /** Number of responses that could be evaluated automatically. */
  readonly totalAnswers: number;
  readonly score: number;
  readonly stars: 0 | 1 | 2 | 3;
}

const FORBIDDEN_OBJECT_KEYS = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_COMPARISON_DEPTH = 32;
const MAX_COMPARISON_NODES = 10_000;

interface ComparisonBudget {
  remainingNodes: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const prototype: unknown = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isSafeJsonValue(
  value: unknown,
  budget: ComparisonBudget,
  depth = 0,
  ancestors = new Set<object>(),
): value is JsonValue {
  if (budget.remainingNodes-- <= 0 || depth > MAX_COMPARISON_DEPTH) {
    return false;
  }

  if (value === null || typeof value === 'string' || typeof value === 'boolean') {
    return true;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value);
  }

  if (typeof value !== 'object' || ancestors.has(value)) {
    return false;
  }

  ancestors.add(value);

  let result: boolean;
  if (Array.isArray(value)) {
    result = value.every((item) => isSafeJsonValue(item, budget, depth + 1, ancestors));
  } else if (isRecord(value)) {
    result = Object.keys(value).every(
      (key) =>
        !FORBIDDEN_OBJECT_KEYS.has(key) &&
        isSafeJsonValue(value[key], budget, depth + 1, ancestors),
    );
  } else {
    result = false;
  }

  ancestors.delete(value);
  return result;
}

function jsonEquals(expected: JsonValue, actual: JsonValue, caseSensitive: boolean): boolean {
  if (typeof expected === 'string' && typeof actual === 'string') {
    return caseSensitive
      ? expected === actual
      : expected.localeCompare(actual, undefined, { sensitivity: 'accent' }) === 0;
  }

  if (
    expected === null ||
    actual === null ||
    typeof expected !== 'object' ||
    typeof actual !== 'object'
  ) {
    return expected === actual;
  }

  if (Array.isArray(expected) || Array.isArray(actual)) {
    const expectedArray = expected as readonly JsonValue[];
    const actualArray = actual as readonly JsonValue[];
    return (
      Array.isArray(expected) &&
      Array.isArray(actual) &&
      expectedArray.length === actualArray.length &&
      expectedArray.every((item, index) => jsonEquals(item, actualArray[index]!, caseSensitive))
    );
  }

  const expectedObject = expected as Readonly<Record<string, JsonValue>>;
  const actualObject = actual as Readonly<Record<string, JsonValue>>;

  const expectedKeys = Object.keys(expectedObject).sort();
  const actualKeys = Object.keys(actualObject).sort();

  return (
    expectedKeys.length === actualKeys.length &&
    expectedKeys.every(
      (key, index) =>
        key === actualKeys[index] &&
        jsonEquals(expectedObject[key]!, actualObject[key]!, caseSensitive),
    )
  );
}

function compareUnorderedArrays(
  expected: readonly JsonValue[],
  actual: readonly JsonValue[],
  caseSensitive: boolean,
): boolean {
  if (expected.length !== actual.length) {
    return false;
  }

  const usedIndexes = new Set<number>();
  return expected.every((expectedItem) => {
    const matchingIndex = actual.findIndex(
      (actualItem, index) =>
        !usedIndexes.has(index) && jsonEquals(expectedItem, actualItem, caseSensitive),
    );

    if (matchingIndex === -1) {
      return false;
    }

    usedIndexes.add(matchingIndex);
    return true;
  });
}

/**
 * Evaluates only the supported declarative JSON contracts. Unknown or invalid
 * data is non-evaluable (`null`) instead of being interpreted or executed.
 */
export function evaluateResponse(expectedResponse: unknown, response: unknown): boolean | null {
  const expectedBudget = { remainingNodes: MAX_COMPARISON_NODES };
  const responseBudget = { remainingNodes: MAX_COMPARISON_NODES };

  if (
    !isSafeJsonValue(expectedResponse, expectedBudget) ||
    !isSafeJsonValue(response, responseBudget) ||
    !isRecord(expectedResponse)
  ) {
    return null;
  }

  const caseSensitive = expectedResponse.caseSensitive !== false;
  // The API stores submitted answers as `{ value: <JSON> }`. Keeping support
  // for a direct JSON value also makes this service useful outside HTTP code.
  const responseValue =
    isRecord(response) && Object.hasOwn(response, 'value')
      ? (response.value as JsonValue)
      : response;

  if (expectedResponse.type === 'exact') {
    if (!Object.hasOwn(expectedResponse, 'value')) {
      return null;
    }

    return jsonEquals(expectedResponse.value as JsonValue, responseValue, caseSensitive);
  }

  if (expectedResponse.type === 'oneOf') {
    if (!Array.isArray(expectedResponse.values) || expectedResponse.values.length === 0) {
      return null;
    }

    return expectedResponse.values.some((candidate) =>
      jsonEquals(candidate as JsonValue, responseValue, caseSensitive),
    );
  }

  if (expectedResponse.type === 'unorderedArray') {
    if (!Array.isArray(expectedResponse.values) || !Array.isArray(responseValue)) {
      return Array.isArray(expectedResponse.values) ? false : null;
    }

    return compareUnorderedArrays(
      expectedResponse.values as readonly JsonValue[],
      responseValue,
      caseSensitive,
    );
  }

  return null;
}

/** Maps a valid percentage to the MVP star bands. */
export function starsForScore(score: number): 1 | 2 | 3 {
  if (!Number.isFinite(score) || score < 0 || score > 100) {
    throw new RangeError('El puntaje debe estar entre 0 y 100.');
  }

  if (score >= 80) {
    return 3;
  }

  if (score >= 50) {
    return 2;
  }

  return 1;
}

/**
 * Calculates server-owned attempt totals. Non-evaluable responses are excluded
 * from both the numerator and denominator.
 */
export function calculateScore(responses: readonly ScorableResponse[]): AttemptScore {
  const evaluableResponses = responses.filter(
    (response) => typeof response.isCorrect === 'boolean',
  );
  const totalAnswers = evaluableResponses.length;

  if (totalAnswers === 0) {
    return {
      correctAnswers: 0,
      totalAnswers: 0,
      score: 0,
      stars: 0,
    };
  }

  const correctAnswers = evaluableResponses.filter((response) => response.isCorrect).length;
  const score = Math.round((correctAnswers / totalAnswers) * 100);

  return {
    correctAnswers,
    totalAnswers,
    score,
    stars: starsForScore(score),
  };
}

// Explicit aliases make call sites read naturally while keeping one implementation.
export const evaluateExpectedResponse = evaluateResponse;
export const calculateAttemptScore = calculateScore;
