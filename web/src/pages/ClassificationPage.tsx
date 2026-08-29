import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/classification/avatar-frame.svg';
import avatar from '../assets/classification/avatar.png';
import backButton from '../assets/classification/back.svg';
import circleExample from '../assets/classification/circle-example.svg';
import circleOrange from '../assets/classification/circle-orange.svg';
import circlePink from '../assets/classification/circle-pink.svg';
import circleTeal from '../assets/classification/circle-teal.svg';
import mascot from '../assets/classification/mascot.png';
import progressActive from '../assets/classification/progress-active.svg';
import progressPending from '../assets/classification/progress-pending.svg';
import triangleGreen from '../assets/classification/triangle-green.svg';
import { activityRoutes } from '../routes/activity-flow';

type CircleId = 'teal' | 'orange' | 'pink';

const circleOptions: Array<{ id: CircleId; image: string }> = [
  { id: 'teal', image: circleTeal },
  { id: 'orange', image: circleOrange },
  { id: 'pink', image: circlePink },
];

export function ClassificationPage(): React.JSX.Element {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<CircleId[]>([]);
  const [notice, setNotice] = useState('Selecciona los círculos.');
  const isComplete = selected.length === circleOptions.length;

  const chooseCircle = (id: CircleId): void => {
    if (selected.includes(id)) return;
    const next = [...selected, id];
    setSelected(next);
    setNotice(
      next.length === 3
        ? '¡Muy bien! Encontraste todos los círculos.'
        : '¡Correcto! Ese es un círculo.',
    );
  };

  const chooseNonCircle = (): void => {
    setNotice('Esa figura no es un círculo. Intenta con otra.');
  };

  return (
    <main className="classification-page">
      <header className="classification-header">
        <button
          className="classification-back"
          type="button"
          onClick={() => void navigate(activityRoutes.sequence)}
          aria-label="Volver a Secuencia Visual"
        >
          <img src={backButton} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Clasificación</h1>
        <div className="classification-progress" aria-label="Progreso 3 de 4">
          <span className="activity-progress-dots" aria-hidden="true">
            {[0, 1, 2, 3].map((step) => (
              <img key={step} src={step < 3 ? progressActive : progressPending} alt="" />
            ))}
          </span>
          <span>3/4</span>
        </div>
        <div className="classification-avatar" aria-label="Perfil de Kivo">
          <img src={avatarFrame} alt="" />
          <img src={avatar} alt="Avatar de Kivo" />
        </div>
      </header>

      <section className="classification-content" aria-labelledby="classification-instruction">
        <h2 id="classification-instruction">Pon los círculos en la caja celeste.</h2>
        <p className="classification-notice" role="status" aria-live="polite">
          {notice}
        </p>
        <div className="shape-tray" aria-label="Figuras disponibles">
          <button
            className={`shape-option shape-teal${selected.includes('teal') ? ' is-sorted' : ''}`}
            type="button"
            onClick={() => chooseCircle('teal')}
            aria-label="Círculo turquesa"
          >
            <img src={circleTeal} alt="" />
          </button>
          <button
            className="shape-option shape-triangle"
            type="button"
            onClick={chooseNonCircle}
            aria-label="Triángulo verde"
          >
            <img src={triangleGreen} alt="" />
          </button>
          <button
            className={`shape-option shape-orange${selected.includes('orange') ? ' is-sorted' : ''}`}
            type="button"
            onClick={() => chooseCircle('orange')}
            aria-label="Círculo naranja"
          >
            <img src={circleOrange} alt="" />
          </button>
          <button
            className="shape-option shape-square"
            type="button"
            onClick={chooseNonCircle}
            aria-label="Cuadrado morado"
          />
          <button
            className={`shape-option shape-pink${selected.includes('pink') ? ' is-sorted' : ''}`}
            type="button"
            onClick={() => chooseCircle('pink')}
            aria-label="Círculo rosa"
          >
            <img src={circlePink} alt="" />
          </button>
        </div>

        <div className={`classification-bin blue-bin${isComplete ? ' is-complete' : ''}`}>
          <img src={circleExample} alt="Ejemplo de círculo en la caja celeste" />
          <div className="sorted-circles" aria-hidden="true">
            {selected.map((id) => {
              const option = circleOptions.find((item) => item.id === id);
              return option === undefined ? null : <img key={id} src={option.image} alt="" />;
            })}
          </div>
        </div>
        <div
          className="classification-bin green-bin"
          aria-label="Caja para figuras que no son círculos"
        >
          <span aria-hidden="true" />
        </div>
        <img className="classification-mascot" src={mascot} alt="Kivo observando las figuras" />
        {isComplete && (
          <button
            className="classification-continue reward-pop"
            type="button"
            onClick={() => void navigate(activityRoutes.matching)}
          >
            <span aria-hidden="true">✓</span>Continuar
          </button>
        )}
      </section>
    </main>
  );
}
