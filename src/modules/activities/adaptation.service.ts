/**
 * Minimal shapes consumed by the deterministic adaptation engine.
 *
 * They intentionally do not depend on Prisma so this domain logic can be used
 * and tested without a generated database client.
 */
export type ActivityCategory = 'LETTERS' | 'NUMBERS' | 'COLORS' | 'SHAPES' | 'SEQUENCES';

export interface AdaptableActivityStep {
  readonly id: string;
  readonly stepNumber: number;
  readonly instruction: string;
  readonly imageUrl: string | null;
  readonly audioUrl: string | null;
}

export interface AdaptableActivity {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: ActivityCategory;
  readonly difficulty: number;
  readonly estimatedMinutes: number;
  readonly steps: readonly AdaptableActivityStep[];
}

export interface AdaptationProfile {
  readonly visualSupport: boolean;
  readonly audioSupport: boolean;
  readonly shortInstructions: boolean;
  readonly stepByStep: boolean;
  readonly breaksEnabled: boolean;
  readonly attentionSupport: boolean;
  readonly autonomyLevel: number;
}

export interface AdaptedActivity {
  readonly activity: {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly category: ActivityCategory;
    readonly difficulty: number;
    readonly estimatedMinutes: number;
  };
  readonly presentation: {
    readonly showOneStepAtATime: boolean;
    readonly useShortInstructions: boolean;
    readonly showVisualSupport: boolean;
    readonly enableAudio: boolean;
    readonly enableBreaks: boolean;
    readonly attentionSupport: boolean;
    readonly autonomyLevel: number;
  };
  readonly steps: {
    readonly id: string;
    readonly number: number;
    readonly instruction: string;
    readonly imageUrl: string | null;
    readonly audioUrl: string | null;
  }[];
}

/**
 * Builds the presentation contract for an activity without changing its base
 * content. Instructions remain authored content: enabling short instructions
 * is a presentation hint and never causes generated or lossy rewriting.
 */
export function adaptActivity(
  activity: AdaptableActivity,
  profile: AdaptationProfile,
): AdaptedActivity {
  const orderedSteps = [...activity.steps].sort(
    (left, right) => left.stepNumber - right.stepNumber || left.id.localeCompare(right.id),
  );

  return {
    activity: {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      category: activity.category,
      difficulty: activity.difficulty,
      estimatedMinutes: activity.estimatedMinutes,
    },
    presentation: {
      showOneStepAtATime: profile.stepByStep,
      useShortInstructions: profile.shortInstructions,
      showVisualSupport: profile.visualSupport,
      enableAudio: profile.audioSupport,
      enableBreaks: profile.breaksEnabled,
      attentionSupport: profile.attentionSupport,
      autonomyLevel: profile.autonomyLevel,
    },
    steps: orderedSteps.map((step) => ({
      id: step.id,
      number: step.stepNumber,
      instruction: step.instruction,
      imageUrl: profile.visualSupport ? step.imageUrl : null,
      audioUrl: profile.audioSupport ? step.audioUrl : null,
    })),
  };
}
