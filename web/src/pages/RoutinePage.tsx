import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/classification/avatar-frame.svg';
import avatar from '../assets/classification/avatar.png';
import backButton from '../assets/classification/back.svg';
import mascot from '../assets/classification/mascot.png';
import progressActive from '../assets/classification/progress-active.svg';
import progressPending from '../assets/classification/progress-pending.svg';
import { ActivityNav } from '../components/ActivityNav';
import { ActivityProgress } from '../components/ActivityProgress';
import { activityRoutes, flowStepFor, titleFor } from '../routes/activity-flow';

type MomentId = 'despertar' | 'desayunar' | 'vestirse' | 'mochila';

interface Moment {
  id: MomentId;
  label: string;
  /** Clase del pictograma; las figuras se dibujan en CSS, como en clasificación. */
  icon: string;
}

/** El orden correcto de la mañana, que es lo que la actividad enseña. */
const ROUTINE_ORDER: readonly MomentId[] = ['despertar', 'desayunar', 'vestirse', 'mochila'];

/**
 * Las tarjetas se presentan desordenadas, pero en un orden fijo: barajarlas en
 * cada render movería las cosas de sitio mientras el niño mira, que es justo lo
 * que esta actividad intenta evitar.
 */
const MOMENTS: readonly Moment[] = [
  { id: 'desayunar', label: 'Desayunar', icon: 'is-cup' },
  { id: 'mochila', label: 'Ir a clase', icon: 'is-backpack' },
  { id: 'despertar', label: 'Despertar', icon: 'is-sun' },
  { id: 'vestirse', label: 'Vestirse', icon: 'is-shirt' },
];

function momentFor(id: MomentId): Moment | undefined {
  return MOMENTS.find((moment) => moment.id === id);
}

export function RoutinePage(): React.JSX.Element {
  const navigate = useNavigate();
  const step = flowStepFor(activityRoutes.routine);
  const [ordered, setOrdered] = useState<MomentId[]>([]);
  const [wrongId, setWrongId] = useState<MomentId | null>(null);

  const isComplete = ordered.length === ROUTINE_ORDER.length;

  const chooseMoment = (moment: Moment): void => {
    if (ordered.includes(moment.id)) {
      return;
    }

    if (ROUTINE_ORDER[ordered.length] === moment.id) {
      setWrongId(null);
      setOrdered((current) => [...current, moment.id]);
      return;
    }

    setWrongId(moment.id);
  };

  const notice = isComplete
    ? '¡Muy bien! Esa es tu rutina de la mañana.'
    : wrongId !== null
      ? 'Ese momento va después. Piensa qué haces antes.'
      : ordered.length === 0
        ? '¿Qué haces primero al levantarte?'
        : '¿Y qué viene después?';

  return (
    <main className="routine-page">
      <header className="routine-header">
        <button
          className="routine-back"
          type="button"
          onClick={() => void navigate(step.previous)}
          aria-label={`Volver a ${titleFor(step.previous)}`}
        >
          <img src={backButton} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Rutina diaria</h1>
        <ActivityProgress
          className="routine-progress"
          dotsClassName="activity-progress-dots"
          step={{ ...step, position: ordered.length, total: ROUTINE_ORDER.length }}
          activeIcon={progressActive}
          pendingIcon={progressPending}
        />
        <div className="routine-avatar" aria-label="Perfil de Kivo">
          <img src={avatarFrame} alt="" />
          <img src={avatar} alt="Avatar de Kivo" />
        </div>
      </header>

      <section className="routine-content" aria-labelledby="routine-instruction">
        <h2 id="routine-instruction">Ordena tu rutina de la mañana.</h2>
        <p className="routine-notice" role="status" aria-live="polite">
          {notice}
        </p>

        <div className="routine-tray" aria-label="Momentos del día">
          {MOMENTS.map((moment) => {
            const placed = ordered.includes(moment.id);
            return (
              <button
                key={moment.id}
                className={`routine-card${placed ? ' is-placed' : ''}${wrongId === moment.id ? ' is-wrong' : ''}`}
                type="button"
                onClick={() => chooseMoment(moment)}
                onAnimationEnd={() => {
                  if (wrongId === moment.id) {
                    setWrongId(null);
                  }
                }}
                disabled={placed}
                aria-label={moment.label}
              >
                <span className={`routine-icon ${moment.icon}`} aria-hidden="true" />
                <span className="routine-card-label">{moment.label}</span>
              </button>
            );
          })}
        </div>

        <ol className="routine-line" aria-label="Tu rutina en orden">
          {ROUTINE_ORDER.map((id, index) => {
            const placed = ordered[index];
            const moment = placed === undefined ? undefined : momentFor(placed);

            return (
              <li key={id} className={`routine-slot${moment === undefined ? '' : ' is-filled'}`}>
                <span className="routine-slot-number" aria-hidden="true">
                  {index + 1}
                </span>
                {moment === undefined ? (
                  <span className="routine-slot-empty" aria-hidden="true" />
                ) : (
                  <>
                    <span className={`routine-icon ${moment.icon}`} aria-hidden="true" />
                    <span className="routine-card-label">{moment.label}</span>
                  </>
                )}
              </li>
            );
          })}
        </ol>

        <img className="routine-mascot" src={mascot} alt="Kivo acompañando la rutina" />

        {isComplete && (
          <button
            className="routine-done reward-pop"
            type="button"
            onClick={() => void navigate(step.next)}
            aria-label={`Continuar a ${titleFor(step.next)}`}
          >
            <span aria-hidden="true">✓</span>Continuar
          </button>
        )}
      </section>

      <ActivityNav step={step} />
    </main>
  );
}
