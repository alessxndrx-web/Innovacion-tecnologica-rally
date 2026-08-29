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
import { activityRoutes } from '../routes/activity-flow';

export function MiniChallengePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [colored, setColored] = useState<number[]>([0, 1]);
  const isComplete = colored.length === 2;

  const toggleSquare = (index: number): void => {
    setColored((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : current.length < 2
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
          onClick={() => void navigate(activityRoutes.tdahMenu)}
          aria-label="Volver al menú TDAH"
        >
          <img src={back} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Mini retos</h1>
        <div className="mini-progress" aria-label="Progreso 1 de 1">
          <span>
            {[0, 1, 2].map((step) => (
              <img key={step} src={step < 2 ? progressActive : progressPending} alt="" />
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
              aria-label={`Cuadrado ${index + 1}${colored.includes(index) ? ' azul' : ''}`}
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
              onClick={() => void navigate(activityRoutes.rewards)}
              aria-label="Ver recompensas"
            >
              <img src={successCircle} alt="" />
              <span aria-hidden="true">✓</span>
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}
