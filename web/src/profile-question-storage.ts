export const PROFILE_COMPLETED_STORAGE_KEY = 'kivo.profile.questionsCompleted';

const PROFILE_ANSWERS_STORAGE_KEY = 'kivo.profile.answers';

type StoredAnswers = Record<string, string>;

function loadStoredAnswers(): StoredAnswers {
  try {
    const raw = window.localStorage.getItem(PROFILE_ANSWERS_STORAGE_KEY);
    if (raw === null) {
      return {};
    }

    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? (parsed as StoredAnswers) : {};
  } catch {
    return {};
  }
}

export function loadProfileAnswer(question: number): string | null {
  return loadStoredAnswers()[String(question)] ?? null;
}

export function saveProfileAnswer(question: number, answer: string): void {
  try {
    const answers = loadStoredAnswers();
    answers[String(question)] = answer;
    window.localStorage.setItem(PROFILE_ANSWERS_STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // La navegación sigue funcionando aunque el navegador bloquee localStorage.
  }
}

export function hasCompletedProfileQuestions(): boolean {
  try {
    return window.localStorage.getItem(PROFILE_COMPLETED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markProfileQuestionsCompleted(): void {
  try {
    window.localStorage.setItem(PROFILE_COMPLETED_STORAGE_KEY, 'true');
  } catch {
    // La sesión actual puede continuar aunque no sea posible recordar el avance.
  }
}
