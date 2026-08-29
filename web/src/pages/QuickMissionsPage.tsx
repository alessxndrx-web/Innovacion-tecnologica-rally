import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/mini-challenge/avatar-frame.svg';
import avatar from '../assets/mini-challenge/avatar.png';
import back from '../assets/mini-challenge/back.svg';
import mascot from '../assets/mini-challenge/mascot.png';
import coin from '../assets/rewards/coin.svg';
import { ActivityNav } from '../components/ActivityNav';
import { activityRoutes, flowStepFor, titleFor } from '../routes/activity-flow';

type ShapeId =
  | 'purple-top'
  | 'green-square'
  | 'teal-top'
  | 'yellow-star'
  | 'pink-square'
  | 'orange-triangle'
  | 'teal-bottom'
  | 'pink-heart'
  | 'purple-bottom'
  | 'green-triangle';

interface Shape {
  id: ShapeId;
  className: string;
  label: string;
  isCircle: boolean;
}

/** Los dos minutos del enunciado, en segundos. */
const TOTAL_SECONDS = 120;

/** Círculos que hay que encontrar; el tablero contiene uno de más. */
const CIRCLES_TO_FIND = 3;

/**
 * Cada figura declara si es un círculo. Antes había una lista aparte con tres
 * identificadores «correctos», y dejaba fuera a un círculo que sí está en el
 * tablero: tocarlo se contaba como error.
 */
const shapes: Shape[] = [
  { id: 'purple-top', className: 'is-purple-circle', label: 'Círculo morado', isCircle: true },
  { id: 'green-square', className: 'is-green-square', label: 'Cuadrado verde', isCircle: false },
  { id: 'teal-top', className: 'is-teal-circle', label: 'Círculo turquesa', isCircle: true },
  { id: 'yellow-star', className: 'is-yellow-star', label: 'Estrella amarilla', isCircle: false },
  { id: 'pink-square', className: 'is-pink-square', label: 'Cuadrado rosado', isCircle: false },
  {
    id: 'orange-triangle',
    className: 'is-orange-triangle',
    label: 'Triángulo naranja',
    isCircle: false,
  },
  { id: 'teal-bottom', className: 'is-teal-circle', label: 'Círculo turquesa', isCircle: true },
  { id: 'pink-heart', className: 'is-pink-heart', label: 'Corazón rosado', isCircle: false },
  { id: 'purple-bottom', className: 'is-purple-circle', label: 'Círculo morado', isCircle: true },
  {
    id: 'green-triangle',
    className: 'is-green-triangle',
    label: 'Triángulo verde',
    isCircle: false,
  },
];

const circleIds = new Set(shapes.filter((shape) => shape.isCircle).map((shape) => shape.id));

export function QuickMissionsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const step = flowStepFor(activityRoutes.quickMissions);
  const [selected, setSelected] = useState<ReadonlySet<ShapeId>>(() => new Set());
  const [seconds, setSeconds] = useState(TOTAL_SECONDS);
  const [lastPickWasWrong, setLastPickWasWrong] = useState(false);

  const found = useMemo(() => [...selected].filter((id) => circleIds.has(id)).length, [selected]);
  const isComplete = found >= CIRCLES_TO_FIND;
  const timeIsUp = seconds === 0;

  /**
   * El reloj corre solo mientras la misión sigue abierta. Las dependencias son
   * las dos banderas y no `seconds`: si dependiera del segundo actual, el
   * intervalo se recrearía en cada tic.
   */
  useEffect(() => {
    if (isComplete || timeIsUp) {
      return;
    }

    const timer = window.setInterval(() => {
      setSeconds((value) => Math.max(0, value - 1));
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isComplete, timeIsUp]);

  const selectShape = (shape: Shape): void => {
    if (isComplete || timeIsUp) {
      return;
    }

    setLastPickWasWrong(!shape.isCircle);
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(shape.id)) {
        next.delete(shape.id);
      } else {
        next.add(shape.id);
      }
      return next;
    });
  };

  /** Sin esto, agotar el tiempo dejaba la pantalla sin ninguna salida. */
  const restart = (): void => {
    setSelected(new Set());
    setSeconds(TOTAL_SECONDS);
    setLastPickWasWrong(false);
  };

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = String(seconds % 60).padStart(2, '0');

  const headline = isComplete
    ? '¡Muy bien!'
    : timeIsUp
      ? '¡Se acabó el tiempo!'
      : '¡Sigue buscando!';
  const detail = isComplete
    ? `Encontraste los ${String(CIRCLES_TO_FIND)} círculos.`
    : timeIsUp
      ? 'Vuelve a intentarlo cuando quieras.'
      : lastPickWasWrong
        ? 'Esa figura no es un círculo. Prueba con otra.'
        : `Has encontrado ${String(found)} de ${String(CIRCLES_TO_FIND)} círculos.`;

  return (
    <main className="quick-page">
      <header className="quick-header">
        <button
          className="quick-back"
          type="button"
          onClick={() => void navigate(step.previous)}
          aria-label={`Volver a ${titleFor(step.previous)}`}
        >
          <img src={back} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Misiones rápidas</h1>
        <div className="quick-score" aria-label="125 estrellas">
          <img src={coin} alt="" />
          <strong>125</strong>
        </div>
        <div className="quick-avatar">
          <img src={avatarFrame} alt="" />
          <img src={avatar} alt="Avatar de Kivo" />
        </div>
      </header>

      <section className="quick-content" aria-labelledby="quick-instruction">
        <h2 id="quick-instruction">
          ¡Encuentra {CIRCLES_TO_FIND} círculos en {TOTAL_SECONDS / 60} minutos!
        </h2>
        <div
          className="quick-timer"
          aria-label={`Tiempo restante ${String(minutes)} minutos y ${remainingSeconds} segundos`}
        >
          <span aria-hidden="true">⏱</span>
          <strong>
            {minutes}:{remainingSeconds}
          </strong>
        </div>
        <div className="quick-progress" aria-hidden="true">
          <span style={{ width: `${String((seconds / TOTAL_SECONDS) * 100)}%` }} />
        </div>
        <div
          className="quick-stars"
          aria-label={`${String(found)} de ${String(CIRCLES_TO_FIND)} círculos encontrados`}
        >
          {Array.from({ length: CIRCLES_TO_FIND }, (_, index) => (
            <span key={index} className={index < found ? 'is-earned' : ''} aria-hidden="true">
              ★
            </span>
          ))}
        </div>

        <div className="quick-board" aria-label="Tablero de figuras">
          {shapes.map((shape) => (
            <button
              key={shape.id}
              className={`quick-shape ${shape.className}${selected.has(shape.id) ? ' is-selected' : ''}`}
              type="button"
              onClick={() => selectShape(shape)}
              aria-label={shape.label}
              aria-pressed={selected.has(shape.id)}
            >
              <span aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="quick-mascot-wrap">
          <p>¡Tú puedes!</p>
          <img src={mascot} alt="Kivo animándote" />
        </div>

        <div
          className={`quick-feedback${isComplete ? ' is-complete' : ''}`}
          role="status"
          aria-live="polite"
        >
          <div>
            <strong>{headline}</strong>
            <span>{detail}</span>
          </div>
          {isComplete && (
            <button
              className="quick-reward reward-pop"
              type="button"
              onClick={() => void navigate(step.next)}
              aria-label={`Recoger la recompensa y volver a ${titleFor(step.next)}`}
            >
              <img src={coin} alt="" />
            </button>
          )}
          {timeIsUp && !isComplete && (
            <button className="quick-retry" type="button" onClick={restart}>
              Volver a intentarlo
            </button>
          )}
        </div>
      </section>
      <ActivityNav step={step} menu={activityRoutes.tdahMenu} />
    </main>
  );
}
