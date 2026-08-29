import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatar from '../assets/matching/avatar.png';
import backButton from '../assets/matching/back.svg';
import bee from '../assets/matching/bee.png';
import chair from '../assets/matching/chair.png';
import church from '../assets/matching/church.png';
import eye from '../assets/matching/eye.png';
import progressActive from '../assets/matching/progress-active.svg';
import progressPending from '../assets/matching/progress-pending.svg';
import { ActivityNav } from '../components/ActivityNav';
import { ActivityProgress } from '../components/ActivityProgress';
import { activityRoutes, flowStepFor, titleFor } from '../routes/activity-flow';

type MatchId = 'ojo' | 'silla' | 'abeja' | 'iglesia';
const matches: Array<{ id: MatchId; image: string; label: string }> = [
  { id: 'ojo', image: eye, label: 'Ojo' },
  { id: 'silla', image: chair, label: 'Silla' },
  { id: 'abeja', image: bee, label: 'Abeja' },
  { id: 'iglesia', image: church, label: 'Iglesia' },
];

export function MatchingPage(): React.JSX.Element {
  const navigate = useNavigate();
  const step = flowStepFor(activityRoutes.matching);
  const [selected, setSelected] = useState<MatchId | null>(null);
  const isCorrect = selected === 'abeja';

  return (
    <main className="matching-page">
      <section className="matching-shell" aria-labelledby="matching-title">
        <header className="matching-header">
          <button
            className="matching-back"
            type="button"
            onClick={() => void navigate(step.previous)}
            aria-label={`Volver a ${titleFor(step.previous)}`}
          >
            <img src={backButton} alt="" />
            <span aria-hidden="true">←</span>
          </button>
          <h1 id="matching-title">Emparejar la palabra</h1>
          <ActivityProgress
            className="matching-progress"
            dotsClassName="activity-progress-dots"
            step={step}
            activeIcon={progressActive}
            pendingIcon={progressPending}
          />
          <img className="matching-avatar" src={avatar} alt="Avatar de Kivo" />
        </header>
        <section className="matching-content" aria-labelledby="matching-instruction">
          <h2 id="matching-instruction">Selecciona la imagen que corresponde.</h2>
          <p className="matching-notice" role="status" aria-live="polite">
            {selected === null
              ? 'Elige una imagen.'
              : isCorrect
                ? '¡Excelente! Abeja empieza con A.'
                : 'Casi. Busca una palabra que empiece con A.'}
          </p>
          <div className="letter-card" aria-label="Letra A">
            A
          </div>
          <div className="matching-options" aria-label="Opciones de imágenes">
            {matches.map((match) => (
              <button
                key={match.id}
                className={`matching-option matching-${match.id}${selected === match.id ? (match.id === 'abeja' ? ' is-correct' : ' is-incorrect') : ''}`}
                type="button"
                onClick={() => setSelected(match.id)}
                aria-label={match.label}
                aria-pressed={selected === match.id}
              >
                <img src={match.image} alt="" />
                {selected === match.id && (
                  <span className="matching-result" aria-hidden="true">
                    {match.id === 'abeja' ? '✓' : '×'}
                  </span>
                )}
              </button>
            ))}
          </div>
          {isCorrect && (
            <button
              className="matching-finish reward-pop"
              type="button"
              onClick={() => void navigate(step.next)}
              aria-label={`Terminar y ver ${titleFor(step.next)}`}
            >
              <span aria-hidden="true">✓</span>Finalizar
            </button>
          )}
        </section>
      </section>
      <ActivityNav step={step} />
    </main>
  );
}
