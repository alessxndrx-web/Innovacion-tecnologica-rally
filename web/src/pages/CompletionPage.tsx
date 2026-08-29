import { useNavigate } from 'react-router-dom';
import confettiGreenMid from '../assets/completion/confetti-green-mid.svg';
import confettiGreenRight from '../assets/completion/confetti-green-right.svg';
import confettiGreenTopLeft from '../assets/completion/confetti-green-tl.svg';
import confettiOrangeRight from '../assets/completion/confetti-orange-right.svg';
import confettiOrangeTop from '../assets/completion/confetti-orange-top.svg';
import confettiPinkCenter from '../assets/completion/confetti-pink-center.svg';
import confettiPinkTop from '../assets/completion/confetti-pink-top.svg';
import confettiPurpleLeft from '../assets/completion/confetti-purple-left.svg';
import confettiPurpleMid from '../assets/completion/confetti-purple-mid.svg';
import confettiPurpleRight from '../assets/completion/confetti-purple-right.svg';
import confettiTealRight from '../assets/completion/confetti-teal-right.svg';
import confettiYellowLeft from '../assets/completion/confetti-yellow-left.svg';
import confettiYellowRight from '../assets/completion/confetti-yellow-right.svg';
import kivoHappy from '../assets/completion/kivo-happy.png';
import rewardCircle from '../assets/completion/reward-circle.svg';
import rewardStar from '../assets/completion/reward-star.svg';
import { activityRoutes } from '../routes/activity-flow';

const confetti = [
  { className: 'completion-confetti-green-tl', source: confettiGreenTopLeft },
  { className: 'completion-confetti-pink-top', source: confettiPinkTop },
  { className: 'completion-confetti-orange-top', source: confettiOrangeTop },
  { className: 'completion-confetti-green-mid', source: confettiGreenMid },
  { className: 'completion-confetti-purple-mid', source: confettiPurpleMid },
  { className: 'completion-confetti-yellow-left', source: confettiYellowLeft },
  { className: 'completion-confetti-purple-left', source: confettiPurpleLeft },
  { className: 'completion-confetti-pink-center', source: confettiPinkCenter },
  { className: 'completion-confetti-yellow-right', source: confettiYellowRight },
  { className: 'completion-confetti-purple-right', source: confettiPurpleRight },
  { className: 'completion-confetti-teal-right', source: confettiTealRight },
  { className: 'completion-confetti-green-right', source: confettiGreenRight },
  { className: 'completion-confetti-orange-right', source: confettiOrangeRight },
] as const;

export function CompletionPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="completion-page" aria-labelledby="completion-title">
      <div className="completion-confetti" aria-hidden="true">
        {confetti.map((item, index) => (
          <img
            key={item.className}
            className={item.className}
            src={item.source}
            alt=""
            style={{ '--confetti-delay': `${index * 45}ms` } as React.CSSProperties}
          />
        ))}
      </div>

      <img className="completion-mascot" src={kivoHappy} alt="Kivo celebrando" />

      <section className="completion-result">
        <h1 id="completion-title">
          ¡Actividad
          <br />
          completada!
        </h1>
        <div className="completion-award" aria-label="Estrella obtenida">
          <img src={rewardCircle} alt="" />
          <img src={rewardStar} alt="" />
        </div>
        <p>¡Lo lograste!</p>
        <button
          className="completion-next"
          type="button"
          onClick={() => void navigate(activityRoutes.home)}
        >
          <span>Siguiente actividad</span>
          <span aria-hidden="true">›</span>
        </button>
      </section>
    </main>
  );
}
