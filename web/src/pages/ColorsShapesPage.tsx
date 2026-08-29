import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/mini-challenge/avatar-frame.svg';
import avatar from '../assets/mini-challenge/avatar.png';
import backButton from '../assets/mini-challenge/back.svg';
import mascot from '../assets/mini-challenge/mascot.png';
import progressActive from '../assets/mini-challenge/progress-active.svg';
import progressPending from '../assets/mini-challenge/progress-pending.svg';
import { ActivityNav } from '../components/ActivityNav';
import { ActivityProgress } from '../components/ActivityProgress';
import { activityRoutes, flowStepFor, titleFor } from '../routes/activity-flow';

interface Piece {
  id: string;
  shape: string;
  color: string;
  /** Nombre completo, tal como lo pide el enunciado y lo lee el lector de pantalla. */
  label: string;
}

const PIECES: readonly Piece[] = [
  { id: 'circulo-azul', shape: 'is-circulo', color: 'is-azul', label: 'círculo azul' },
  { id: 'cuadrado-verde', shape: 'is-cuadrado', color: 'is-verde', label: 'cuadrado verde' },
  {
    id: 'triangulo-naranja',
    shape: 'is-triangulo',
    color: 'is-naranja',
    label: 'triángulo naranja',
  },
  { id: 'circulo-rosa', shape: 'is-circulo', color: 'is-rosa', label: 'círculo rosa' },
  { id: 'cuadrado-morado', shape: 'is-cuadrado', color: 'is-morado', label: 'cuadrado morado' },
  {
    id: 'triangulo-amarillo',
    shape: 'is-triangulo',
    color: 'is-amarillo',
    label: 'triángulo amarillo',
  },
];

/** Una consigna por ronda; cada una mezcla forma y color para que no valga adivinar por una sola pista. */
const ROUNDS: readonly string[] = ['circulo-azul', 'cuadrado-verde', 'triangulo-amarillo'];

/** Lo que tarda la celebración de un acierto antes de pasar a la ronda siguiente. */
const CELEBRATION_MS = 900;

export function ColorsShapesPage(): React.JSX.Element {
  const navigate = useNavigate();
  const step = flowStepFor(activityRoutes.colors);
  const [round, setRound] = useState(0);
  const [solved, setSolved] = useState(false);
  const [wrongId, setWrongId] = useState<string | null>(null);

  const target = ROUNDS[round];
  const targetPiece = PIECES.find((piece) => piece.id === target);
  const isComplete = round >= ROUNDS.length;

  /** El acierto se celebra un momento antes de cambiar la consigna, para que el cambio no pase desapercibido. */
  useEffect(() => {
    if (!solved) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSolved(false);
      setRound((current) => current + 1);
    }, CELEBRATION_MS);

    return () => {
      window.clearTimeout(timer);
    };
  }, [solved]);

  const choosePiece = (piece: Piece): void => {
    if (solved || isComplete) {
      return;
    }

    if (piece.id === target) {
      setWrongId(null);
      setSolved(true);
      return;
    }

    setWrongId(piece.id);
  };

  const instruction = isComplete
    ? '¡Lo lograste! Encontraste todas las figuras.'
    : targetPiece === undefined
      ? 'Toca la figura que se pide.'
      : `Toca el ${targetPiece.label}.`;

  const notice = solved
    ? '¡Muy bien!'
    : wrongId !== null
      ? 'Esa no es. Fíjate en la forma y en el color.'
      : isComplete
        ? 'Ronda completada.'
        : `Ronda ${String(round + 1)} de ${String(ROUNDS.length)}`;

  return (
    <main className="colors-page">
      <header className="colors-header">
        <button
          className="colors-back"
          type="button"
          onClick={() => void navigate(step.previous)}
          aria-label={`Volver a ${titleFor(step.previous)}`}
        >
          <img src={backButton} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Colores y formas</h1>
        <ActivityProgress
          className="colors-progress"
          dotsClassName="activity-progress-dots"
          step={{ ...step, position: round, total: ROUNDS.length }}
          activeIcon={progressActive}
          pendingIcon={progressPending}
        />
        <div className="colors-avatar" aria-label="Perfil de Kivo">
          <img src={avatarFrame} alt="" />
          <img src={avatar} alt="Avatar de Kivo" />
        </div>
      </header>

      <section className="colors-content" aria-labelledby="colors-instruction">
        <h2 id="colors-instruction" aria-live="polite">
          {instruction}
        </h2>

        <div className="colors-board" aria-label="Figuras">
          {PIECES.map((piece) => {
            const isTarget = piece.id === target;
            const state =
              solved && isTarget ? ' is-correct' : wrongId === piece.id ? ' is-wrong' : '';

            return (
              <button
                key={piece.id}
                className={`colors-piece ${piece.shape} ${piece.color}${state}`}
                type="button"
                onClick={() => choosePiece(piece)}
                onAnimationEnd={() => {
                  if (wrongId === piece.id) {
                    setWrongId(null);
                  }
                }}
                disabled={isComplete}
                aria-label={piece.label}
              >
                <span aria-hidden="true" />
              </button>
            );
          })}
        </div>

        <footer
          className={`colors-feedback${isComplete ? ' is-complete' : ''}`}
          role="status"
          aria-live="polite"
        >
          <img className="colors-mascot" src={mascot} alt="Kivo animándote" />
          <strong>{notice}</strong>
          {isComplete && (
            <button
              className="colors-done reward-pop"
              type="button"
              onClick={() => void navigate(step.next)}
              aria-label={`Continuar a ${titleFor(step.next)}`}
            >
              <span aria-hidden="true">✓</span>
            </button>
          )}
        </footer>
      </section>

      <ActivityNav step={step} />
    </main>
  );
}
