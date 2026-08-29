import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apple from '../assets/sequence-visual/apple.png';
import appleAlt from '../assets/sequence-visual/apple-alt.png';
import avatarFrame from '../assets/sequence-visual/avatar-frame.svg';
import avatar from '../assets/sequence-visual/avatar.png';
import backButton from '../assets/sequence-visual/back-button.svg';
import banana from '../assets/sequence-visual/banana.png';
import grapes from '../assets/sequence-visual/grapes.png';
import kivoIntrigued from '../assets/sequence-visual/kivo-intrigued.png';
import progressComplete from '../assets/sequence-visual/progress-complete.svg';
import progressPending from '../assets/sequence-visual/progress-pending.svg';
import { activityRoutes } from '../routes/activity-flow';

type Answer = 'banana' | 'grapes' | 'apple';

const ANSWERS: Array<{ id: Answer; image: string; label: string }> = [
  { id: 'banana', image: banana, label: 'Banano' },
  { id: 'grapes', image: grapes, label: 'Uvas' },
  { id: 'apple', image: apple, label: 'Manzana' },
];

export function SequenceVisualPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState<Answer | null>(null);
  const isCorrect = selectedAnswer === 'banana';

  const instruction =
    selectedAnswer === null
      ? 'Observa la secuencia y elegí el qué sigue.'
      : isCorrect
        ? '¡Muy bien! El banano completa la secuencia.'
        : 'Casi. Observá el patrón e intentá de nuevo.';

  return (
    <main className="sequence-page">
      <header className="sequence-header">
        <button
          className="sequence-back"
          type="button"
          onClick={() => void navigate(activityRoutes.instruction)}
          aria-label="Volver a Instrucción única"
        >
          <img src={backButton} alt="" />
          <span aria-hidden="true">‹</span>
        </button>

        <div className="sequence-title">Secuencia Visual</div>

        <div className="sequence-progress" aria-label="Progreso 2 de 4">
          <span className="progress-dots" aria-hidden="true">
            {[0, 1, 2, 3].map((step) => (
              <img key={step} src={step < 2 ? progressComplete : progressPending} alt="" />
            ))}
          </span>
          <span>2/4</span>
        </div>

        <div className="sequence-avatar" aria-label="Perfil de Kivo">
          <img src={avatarFrame} alt="" />
          <img src={avatar} alt="Avatar de Kivo" />
        </div>
      </header>

      <section className="sequence-body" aria-labelledby="sequence-instruction">
        <h1 id="sequence-instruction" aria-live="polite">
          {instruction}
        </h1>

        <div className="sequence-card" aria-label="Manzana, banano, manzana, incógnita">
          <img className="sequence-fruit sequence-apple-one" src={apple} alt="Manzana" />
          <img className="sequence-fruit sequence-banana" src={banana} alt="Banano" />
          <img className="sequence-fruit sequence-apple-two" src={appleAlt} alt="Manzana" />
          <button
            className={`sequence-question${isCorrect ? ' sequence-question-correct reward-pop' : ''}`}
            type="button"
            disabled={!isCorrect}
            onClick={() => void navigate(activityRoutes.matching)}
            aria-label={
              isCorrect ? 'Continuar a Emparejar la palabra' : 'Selecciona la figura que sigue'
            }
          >
            {isCorrect ? '✓' : '?'}
          </button>
        </div>

        <img className="sequence-mascot" src={kivoIntrigued} alt="Kivo pensando" />

        <div className="sequence-answers" aria-label="Opciones de respuesta">
          {ANSWERS.map((answer) => {
            const selected = selectedAnswer === answer.id;
            const stateClass = selected
              ? answer.id === 'banana'
                ? ' is-correct'
                : ' is-incorrect'
              : '';

            return (
              <button
                key={answer.id}
                className={`sequence-answer${stateClass}`}
                type="button"
                onClick={() => setSelectedAnswer(answer.id)}
                aria-pressed={selected}
                aria-label={answer.label}
              >
                <img src={answer.image} alt="" />
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
