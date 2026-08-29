import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/rewards/avatar-frame.svg';
import avatar from '../assets/rewards/avatar.png';
import back from '../assets/rewards/back.svg';
import coin from '../assets/rewards/coin.svg';
import fiveStars from '../assets/rewards/five-stars.svg';
import mascot from '../assets/rewards/mascot.png';
import progressActive from '../assets/rewards/progress-active.svg';
import progressPending from '../assets/rewards/progress-pending.svg';
import { ActivityNav } from '../components/ActivityNav';
import { activityRoutes, flowStepFor, titleFor } from '../routes/activity-flow';

export function RewardsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const step = flowStepFor(activityRoutes.rewards);

  return (
    <main className="rewards-page">
      <header className="rewards-header">
        <button
          type="button"
          className="rewards-back"
          onClick={() => void navigate(step.previous)}
          aria-label={`Volver a ${titleFor(step.previous)}`}
        >
          <img src={back} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Recompensas visibles</h1>
        <div className="rewards-progress" aria-label="Recompensa 1 de 1">
          <span aria-hidden="true">
            {[0, 1, 2].map((dot) => (
              <img key={dot} src={dot < 2 ? progressActive : progressPending} alt="" />
            ))}
          </span>
          <b>1/1</b>
        </div>
        <div className="rewards-avatar">
          <img src={avatarFrame} alt="" />
          <img src={avatar} alt="Avatar de Kivo" />
        </div>
      </header>
      <section className="rewards-content">
        <h2>¡Has ganado 5 estrellas!</h2>
        <img className="rewards-stars reward-pop" src={fiveStars} alt="Cinco estrellas" />
        <img className="rewards-mascot" src={mascot} alt="Kivo celebrando" />
        <button
          type="button"
          className="rewards-earned"
          onClick={() => void navigate(step.next)}
          aria-label={`Aceptar la recompensa y continuar a ${titleFor(step.next)}`}
        >
          <img src={coin} alt="" />
          <strong>+ 5</strong>
        </button>
      </section>
      <ActivityNav step={step} menu={activityRoutes.tdahMenu} />
    </main>
  );
}
