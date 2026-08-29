import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/instruction/avatar-frame.svg';
import avatar from '../assets/instruction/avatar.png';
import backButton from '../assets/instruction/back.svg';
import checkCircle from '../assets/instruction/check-circle.svg';
import kivoHappy from '../assets/instruction/kivo-happy.png';
import pencil from '../assets/instruction/pencil.png';
import progressActive from '../assets/instruction/progress-active.svg';
import progressPending from '../assets/instruction/progress-pending.svg';
import { ActivityNav } from '../components/ActivityNav';
import { ActivityProgress } from '../components/ActivityProgress';
import { activityRoutes, flowStepFor, titleFor } from '../routes/activity-flow';

export function InstructionPage(): React.JSX.Element {
  const navigate = useNavigate();
  const step = flowStepFor(activityRoutes.instruction);

  return (
    <main className="instruction-page">
      <section className="instruction-shell" aria-labelledby="instruction-title">
        <header className="instruction-header">
          <button
            className="instruction-back"
            type="button"
            onClick={() => void navigate(step.previous)}
            aria-label={`Volver a ${titleFor(step.previous)}`}
          >
            <img src={backButton} alt="" />
            <span aria-hidden="true">←</span>
          </button>
          <h1 id="instruction-title">Instrucción única</h1>
          <ActivityProgress
            className="instruction-progress"
            dotsClassName="activity-progress-dots"
            step={step}
            activeIcon={progressActive}
            pendingIcon={progressPending}
          />
          <div className="instruction-avatar" aria-label="Perfil de Kivo">
            <img src={avatarFrame} alt="" />
            <img src={avatar} alt="Avatar de Kivo" />
          </div>
        </header>
        <div className="instruction-content">
          <div className="instruction-pencil-card">
            <img src={pencil} alt="Lápiz amarillo" />
          </div>
          <p className="instruction-copy">
            Toma
            <br />
            el lápiz.
          </p>
        </div>
        <div className="instruction-reward" role="status" aria-live="polite">
          <img className="instruction-mascot" src={kivoHappy} alt="Kivo celebrando" />
          <p>¡Muy bien!</p>
          <button
            className="reward-check instruction-continue"
            type="button"
            onClick={() => void navigate(step.next)}
            aria-label={`Continuar a ${titleFor(step.next)}`}
          >
            <img src={checkCircle} alt="" />
            <span aria-hidden="true">✓</span>
          </button>
          <span className="instruction-next-hint">Continuar</span>
        </div>
      </section>
      <ActivityNav step={step} />
    </main>
  );
}
