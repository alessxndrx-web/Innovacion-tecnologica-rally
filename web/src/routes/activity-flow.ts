/**
 * Mapa único de rutas del producto.
 *
 * Las pantallas no se enlazan entre sí a mano: piden su posición a
 * `flowStepFor` y navegan a `previous` / `next`. Así, insertar o mover una
 * actividad se hace solo aquí y el contador («2/4») no puede desmentir al
 * recorrido real, que es justo lo que pasaba cuando cada pantalla escribía su
 * propio destino y su propio número.
 */
export const activityRoutes = {
  login: '/login',
  register: '/register',
  questionNotice: '/preguntas/aviso',
  profileQuestions: '/perfil/preguntas',
  home: '/actividades',
  instruction: '/actividades/instruccion-unica',
  sequence: '/actividades/secuencia-visual',
  classification: '/actividades/clasificacion',
  matching: '/actividades/emparejar-palabra',
  routine: '/actividades/rutina-diaria',
  colors: '/actividades/colores-y-formas',
  completion: '/actividades/completada',
  tdahMenu: '/actividades/tdah',
  miniChallenge: '/actividades/mini-retos',
  rewards: '/actividades/recompensas',
  quickMissions: '/actividades/misiones-rapidas',
} as const;

export type ActivityRoute = (typeof activityRoutes)[keyof typeof activityRoutes];

interface ActivitySequence {
  /** Menú del que cuelga el recorrido y destino del «volver» del primer paso. */
  readonly menu: string;
  /** Pasos en el orden en que se recorren; define el numerador del progreso. */
  readonly steps: readonly string[];
  /** Pantalla que sigue al último paso. */
  readonly exit: string;
}

/** Recorrido TEA: instrucción → secuencia → clasificación → emparejar → cierre. */
export const teaFlow: ActivitySequence = {
  menu: activityRoutes.home,
  steps: [
    activityRoutes.instruction,
    activityRoutes.sequence,
    activityRoutes.classification,
    activityRoutes.matching,
  ],
  exit: activityRoutes.completion,
};

/** Recorrido TDAH: mini retos → recompensas → misiones rápidas → menú. */
export const tdahFlow: ActivitySequence = {
  menu: activityRoutes.tdahMenu,
  steps: [activityRoutes.miniChallenge, activityRoutes.rewards, activityRoutes.quickMissions],
  exit: activityRoutes.tdahMenu,
};

/**
 * «Rutina diaria» y «Colores y formas» están en el menú TEA pero fuera del
 * recorrido guiado: por eso el diseño numera cuatro pasos («2/4») aunque el
 * menú ofrezca seis actividades. Cada una es un recorrido de un solo paso que
 * termina en la pantalla de cierre.
 */
export const routineFlow: ActivitySequence = {
  menu: activityRoutes.home,
  steps: [activityRoutes.routine],
  exit: activityRoutes.completion,
};

export const colorsFlow: ActivitySequence = {
  menu: activityRoutes.home,
  steps: [activityRoutes.colors],
  exit: activityRoutes.completion,
};

const flows: readonly ActivitySequence[] = [teaFlow, routineFlow, colorsFlow, tdahFlow];

export interface ActivityStep {
  /** Posición del paso empezando en 1: es el número que se muestra como «2/4». */
  readonly position: number;
  readonly total: number;
  readonly previous: string;
  readonly next: string;
}

/**
 * Una pantalla abierta por enlace directo no puede quedarse sin salida: si no
 * pertenece a ningún recorrido, ambas direcciones devuelven al menú principal.
 */
const ORPHAN_STEP: ActivityStep = {
  position: 1,
  total: 1,
  previous: activityRoutes.home,
  next: activityRoutes.home,
};

export function flowStepFor(path: string): ActivityStep {
  for (const flow of flows) {
    const index = flow.steps.indexOf(path);
    if (index === -1) {
      continue;
    }

    return {
      position: index + 1,
      total: flow.steps.length,
      previous: flow.steps[index - 1] ?? flow.menu,
      next: flow.steps[index + 1] ?? flow.exit,
    };
  }

  return ORPHAN_STEP;
}

/**
 * Títulos visibles de cada pantalla. Los botones de volver los usan para
 * anunciar su destino real; escritos a mano quedaban desactualizados en cuanto
 * cambiaba el orden del recorrido.
 */
const SCREEN_TITLES: Readonly<Record<string, string>> = {
  [activityRoutes.home]: 'Elige una actividad',
  [activityRoutes.profileQuestions]: 'Preguntas de perfil',
  [activityRoutes.instruction]: 'Instrucción única',
  [activityRoutes.sequence]: 'Secuencia visual',
  [activityRoutes.classification]: 'Clasificación',
  [activityRoutes.matching]: 'Emparejar la palabra',
  [activityRoutes.routine]: 'Rutina diaria',
  [activityRoutes.colors]: 'Colores y formas',
  [activityRoutes.completion]: 'Actividad completada',
  [activityRoutes.tdahMenu]: 'Actividades TDAH',
  [activityRoutes.miniChallenge]: 'Mini retos',
  [activityRoutes.rewards]: 'Recompensas visibles',
  [activityRoutes.quickMissions]: 'Misiones rápidas',
};

export function titleFor(path: string): string {
  return SCREEN_TITLES[path] ?? 'la pantalla anterior';
}
