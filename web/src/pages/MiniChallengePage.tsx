import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/mini-challenge/avatar-frame.svg';
import avatar from '../assets/mini-challenge/avatar.png';
import back from '../assets/mini-challenge/back.svg';
import emptyCircle from '../assets/mini-challenge/empty-circle.svg';
import mascot from '../assets/mini-challenge/mascot.png';
import progressActive from '../assets/mini-challenge/progress-active.svg';
import progressPending from '../assets/mini-challenge/progress-pending.svg';
import successCircle from '../assets/mini-challenge/success-circle.svg';
import { ActivityNav } from '../components/ActivityNav';
import { activityRoutes, flowStepFor, titleFor } from '../routes/activity-flow';

/** Cuadrados que hay que colorear, según el enunciado de la actividad. */
const SQUARES_TO_COLOR = 2;

export function MiniChallengePage(): React.JSX.Element {
  const navigate = useNavigate();
  const step = flowStepFor(activityRoutes.miniChallenge);
  const [colored, setColored] = useState<number[]>([]);
  const isComplete = colored.length === SQUARES_TO_COLOR;

  const toggleSquare = (index: number): void => {
    setColored((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : current.length < SQUARES_TO_COLOR
          ? [...current, index]
          : current,
    );
  };

  return (
    <main className="mini-page">
      <header className="mini-header">
        <button
          type="button"
          className="mini-back"
          onClick={() => void navigate(step.previous)}
          aria-label={`Volver a ${titleFor(step.previous)}`}
        >
          <img src={back} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Mini retos</h1>
        <div className="mini-progress" aria-label="Reto 1 de 1">
          <span aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <img key={dot} src={dot < 2 ? progressActive : progressPending} alt="" />
            ))}
          </span>
          <b>1/1</b>
        </div>
        <div className="mini-avatar">
          <img src={avatarFrame} alt="" />
          <img src={avatar} alt="Avatar de Kivo" />
        </div>
      </header>
      <section className="mini-content" aria-labelledby="mini-instruction">
        <h2 id="mini-instruction">Colorea 2 cuadrados de azul</h2>
        <div className="mini-shapes">
          {[0, 1, 2, 3].map((index) => (
            <button
              key={index}
              type="button"
              className={`mini-square${colored.includes(index) ? ' is-blue' : ''}`}
              onClick={() => toggleSquare(index)}
              aria-label={`Cuadrado ${String(index + 1)}${colored.includes(index) ? ' azul' : ''}`}
              aria-pressed={colored.includes(index)}
            />
          ))}
          <img src={emptyCircle} alt="Círculo vacío" />
        </div>
        <footer className={`mini-success${isComplete ? ' is-visible' : ''}`} role="status">
          <img className="mini-mascot" src={mascot} alt="Kivo celebrando" />
          <strong>{isComplete ? '¡Excelente!' : 'Selecciona dos cuadrados'}</strong>
          {isComplete && (
            <button
              type="button"
              className="mini-success-button reward-pop"
              onClick={() => void navigate(step.next)}
              aria-label={`Continuar a ${titleFor(step.next)}`}
            >
              <img src={successCircle} alt="" />
              <span aria-hidden="true">✓</span>
            </button>
          )}
        </footer>
      </section>
      <ActivityNav step={step} menu={activityRoutes.tdahMenu} />
    </main>
  );
}
