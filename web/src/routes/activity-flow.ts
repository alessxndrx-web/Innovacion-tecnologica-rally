export const activityRoutes = {
  home: '/actividades',
  instruction: '/actividades/instruccion-unica',
  sequence: '/actividades/secuencia-visual',
  matching: '/actividades/emparejar-palabra',
  completion: '/actividades/completada',
  tdahMenu: '/actividades/tdah',
  miniChallenge: '/actividades/mini-retos',
  rewards: '/actividades/recompensas',
  quickMissions: '/actividades/misiones-rapidas',
} as const;

export const activityFlow = [
  activityRoutes.instruction,
  activityRoutes.sequence,
  activityRoutes.matching,
  activityRoutes.completion,
] as const;

export const tdahActivityFlow = [
  activityRoutes.miniChallenge,
  activityRoutes.rewards,
  activityRoutes.quickMissions,
] as const;
