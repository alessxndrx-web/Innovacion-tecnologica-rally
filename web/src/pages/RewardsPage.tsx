import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/rewards/avatar-frame.svg';
import avatar from '../assets/rewards/avatar.png';
import back from '../assets/rewards/back.svg';
import coin from '../assets/rewards/coin.svg';
import fiveStars from '../assets/rewards/five-stars.svg';
import mascot from '../assets/rewards/mascot.png';
import progressActive from '../assets/rewards/progress-active.svg';
import progressPending from '../assets/rewards/progress-pending.svg';
import { activityRoutes } from '../routes/activity-flow';

export function RewardsPage(): React.JSX.Element {
  const navigate = useNavigate();
  return (
    <main className="rewards-page">
      <header className="rewards-header">
        <button
          type="button"
          className="rewards-back"
          onClick={() => void navigate(activityRoutes.tdahMenu)}
          aria-label="Volver al menú TDAH"
        >
          <img src={back} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Recompensas visibles</h1>
        <div className="rewards-progress" aria-label="Progreso 1 de 1">
          <span>
            {[0, 1, 2].map((step) => (
              <img key={step} src={step < 2 ? progressActive : progressPending} alt="" />
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
          onClick={() => void navigate(activityRoutes.quickMissions)}
          aria-label="Aceptar recompensa y continuar a Misiones rápidas"
        >
          <img src={coin} alt="" />
          <strong>+ 5</strong>
        </button>
      </section>
    </main>
  );
}
