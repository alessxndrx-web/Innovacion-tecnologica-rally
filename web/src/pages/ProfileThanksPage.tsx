import { useNavigate } from 'react-router-dom';
import confetti1 from '../assets/profile-thanks/confetti-1.svg';
import confetti11 from '../assets/profile-thanks/confetti-11.svg';
import confetti12 from '../assets/profile-thanks/confetti-12.svg';
import confetti13 from '../assets/profile-thanks/confetti-13.svg';
import confetti2 from '../assets/profile-thanks/confetti-2.svg';
import confetti3 from '../assets/profile-thanks/confetti-3.svg';
import confetti4 from '../assets/profile-thanks/confetti-4.svg';
import confetti5 from '../assets/profile-thanks/confetti-5.svg';
import confetti6 from '../assets/profile-thanks/confetti-6.svg';
import confetti7 from '../assets/profile-thanks/confetti-7.svg';
import confetti8 from '../assets/profile-thanks/confetti-8.svg';
import confetti9 from '../assets/profile-thanks/confetti-9.svg';
import mascotShadow from '../assets/profile-thanks/mascot-shadow.svg';
import mascot from '../assets/profile-thanks/mascot.png';
import { useAuth } from '../auth/useAuth';
import { activityRoutes } from '../routes/activity-flow';

/**
 * Los trece confetis del diseño (nodo 156:2). El décimo reutiliza el círculo
 * del séptimo, igual que en Figma, así que comparte el mismo fichero.
 */
const confetti = [
  { className: 'thanks-confetti-1', source: confetti1 },
  { className: 'thanks-confetti-2', source: confetti2 },
  { className: 'thanks-confetti-3', source: confetti3 },
  { className: 'thanks-confetti-4', source: confetti4 },
  { className: 'thanks-confetti-5', source: confetti5 },
  { className: 'thanks-confetti-6', source: confetti6 },
  { className: 'thanks-confetti-7', source: confetti7 },
  { className: 'thanks-confetti-8', source: confetti8 },
  { className: 'thanks-confetti-9', source: confetti9 },
  { className: 'thanks-confetti-10', source: confetti7 },
  { className: 'thanks-confetti-11', source: confetti11 },
  { className: 'thanks-confetti-12', source: confetti12 },
  { className: 'thanks-confetti-13', source: confetti13 },
] as const;

/** Los tres destellos junto a la mano de Kivo; en el diseño son barras giradas. */
const joyRays = ['thanks-ray-1', 'thanks-ray-2', 'thanks-ray-3'] as const;

/**
 * Cierre del cuestionario de perfil (Figma 156:2, «Kivo Gracias - 21»).
 *
 * Es la pantalla que faltaba entre la última pregunta y el menú: hasta ahora la
 * séptima respuesta saltaba directamente a las actividades.
 */
export function ProfileThanksPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { status } = useAuth();

  const continueToApp = (): void => {
    void navigate(status === 'authenticated' ? activityRoutes.home : activityRoutes.login, {
      replace: true,
    });
  };

  return (
    <main className="profile-thanks-page" data-node-id="156:2">
      <div className="thanks-panel" aria-hidden="true" />

      <div className="thanks-confetti" aria-hidden="true">
        {confetti.map((item, index) => (
          <img
            key={item.className}
            className={item.className}
            src={item.source}
            alt=""
            style={{ '--confetti-delay': `${String(index * 55)}ms` } as React.CSSProperties}
          />
        ))}
      </div>

      <div className="thanks-mascot-scene" aria-hidden="true">
        <span className="thanks-mascot-shadow">
          <img src={mascotShadow} alt="" />
        </span>
        <img className="thanks-mascot" src={mascot} alt="" />
        {joyRays.map((className) => (
          <span key={className} className={`thanks-ray ${className}`}>
            <i />
          </span>
        ))}
      </div>

      <section className="thanks-copy" aria-labelledby="thanks-title">
        <h1 id="thanks-title">
          ¡Gracias por
          <br />
          contarnos más!
        </h1>
        <p>
          Con tus respuestas podemos
          <br />
          recrear experiencias que se
          <br />
          adapten a él/ella.
        </p>
        <button className="thanks-continue" type="button" onClick={continueToApp}>
          <span>Continuar</span>
          <span className="thanks-continue-arrow" aria-hidden="true">
            ›
          </span>
        </button>
      </section>
    </main>
  );
}
