import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/mini-challenge/avatar-frame.svg';
import avatar from '../assets/mini-challenge/avatar.png';
import back from '../assets/mini-challenge/back.svg';
import mascot from '../assets/mini-challenge/mascot.png';
import coin from '../assets/rewards/coin.svg';
import { activityRoutes } from '../routes/activity-flow';

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

const TARGETS = new Set<ShapeId>(['teal-top', 'teal-bottom', 'purple-bottom']);

const shapes: Array<{ id: ShapeId; className: string; label: string }> = [
  { id: 'purple-top', className: 'is-purple-circle', label: 'Círculo morado' },
  { id: 'green-square', className: 'is-green-square', label: 'Cuadrado verde' },
  { id: 'teal-top', className: 'is-teal-circle', label: 'Círculo turquesa' },
  { id: 'yellow-star', className: 'is-yellow-star', label: 'Estrella amarilla' },
  { id: 'pink-square', className: 'is-pink-square', label: 'Cuadrado rosado' },
  { id: 'orange-triangle', className: 'is-orange-triangle', label: 'Triángulo naranja' },
  { id: 'teal-bottom', className: 'is-teal-circle', label: 'Círculo turquesa' },
  { id: 'pink-heart', className: 'is-pink-heart', label: 'Corazón rosado' },
  { id: 'purple-bottom', className: 'is-purple-circle', label: 'Círculo morado' },
  { id: 'green-triangle', className: 'is-green-triangle', label: 'Triángulo verde' },
];

export function QuickMissionsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<ShapeId>>(
    () => new Set(['teal-top', 'teal-bottom', 'purple-bottom']),
  );
  const [seconds, setSeconds] = useState(105);
  const [notice, setNotice] = useState('Has encontrado 3 círculos');

  const isComplete = useMemo(
    () => selected.size === TARGETS.size && [...TARGETS].every((id) => selected.has(id)),
    [selected],
  );

  useEffect(() => {
    if (isComplete || seconds === 0) return;
    const timer = window.setInterval(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [isComplete, seconds]);

  const selectShape = (id: ShapeId): void => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const correctCount = [...TARGETS].filter((target) => next.has(target)).length;
      setNotice(
        TARGETS.has(id)
          ? `Has encontrado ${String(correctCount)} de 3 círculos`
          : 'Esa figura no forma parte de los 3 círculos. Intenta otra vez.',
      );
      return next;
    });
  };

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = String(seconds % 60).padStart(2, '0');

  return (
    <main className="quick-page">
      <header className="quick-header">
        <button
          className="quick-back"
          type="button"
          onClick={() => void navigate(activityRoutes.tdahMenu)}
          aria-label="Volver al menú TDAH"
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
        <h2 id="quick-instruction">¡Encuentra 3 círculos en 2 minutos!</h2>
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
          <span style={{ width: `${String((seconds / 120) * 100)}%` }} />
        </div>
        <div className="quick-stars" aria-label="2 de 3 estrellas">
          <span>★</span>
          <span>★</span>
          <span>★</span>
        </div>

        <div className="quick-board" aria-label="Tablero de figuras">
          {shapes.map((shape) => (
            <button
              key={shape.id}
              className={`quick-shape ${shape.className}${selected.has(shape.id) ? ' is-selected' : ''}`}
              type="button"
              onClick={() => selectShape(shape.id)}
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
            <strong>{isComplete ? '¡Muy bien!' : '¡Sigue buscando!'}</strong>
            <span>{notice}</span>
          </div>
          {isComplete && (
            <button
              className="quick-reward reward-pop"
              type="button"
              onClick={() => void navigate(activityRoutes.tdahMenu)}
              aria-label="Recoger recompensa y volver al menú TDAH"
            >
              <img src={coin} alt="" />
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
