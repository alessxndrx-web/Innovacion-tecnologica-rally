import { useNavigate } from 'react-router-dom';
import activityFlag from '../assets/activities/activity-flag.png';
import activityMedal from '../assets/activities/activity-medal.png';
import activityRocket from '../assets/activities/activity-rocket.png';
import dotGreenSmall from '../assets/tea-menu/dot-green-small.svg';
import dotGreen from '../assets/tea-menu/dot-green.svg';
import dotOrange from '../assets/tea-menu/dot-orange.svg';
import dotPink from '../assets/tea-menu/dot-pink.svg';
import dotPurple from '../assets/tea-menu/dot-purple.svg';
import dotTeal from '../assets/tea-menu/dot-teal.svg';
import logo from '../assets/tea-menu/logo.png';
import mascot from '../assets/tea-menu/mascot.png';
import { activityRoutes } from '../routes/activity-flow';

const menuItems = [
  { label: 'Mini retos', icon: activityFlag, path: activityRoutes.miniChallenge },
  { label: 'Recompensas visibles', icon: activityMedal, path: activityRoutes.rewards },
  { label: 'Misiones rápidas', icon: activityRocket, path: activityRoutes.quickMissions },
] as const;

export function TeaMenuPage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="tea-menu-page">
      <section className="tea-brand">
        <button
          type="button"
          className="tea-logo-button"
          onClick={() => void navigate(activityRoutes.home)}
          aria-label="Volver al menú TEA"
        >
          <img src={logo} alt="Kivo" />
        </button>
        <p>
          Aprende a tu <span>ritmo</span>, crece a tu <strong>manera</strong>
        </p>
        <div className="tea-mascot-scene" aria-hidden="true">
          <img className="tea-dot tea-dot-purple" src={dotPurple} alt="" />
          <img className="tea-dot tea-dot-teal" src={dotTeal} alt="" />
          <img className="tea-dot tea-dot-green" src={dotGreen} alt="" />
          <img className="tea-dot tea-dot-orange" src={dotOrange} alt="" />
          <img className="tea-dot tea-dot-pink" src={dotPink} alt="" />
          <img className="tea-dot tea-dot-green-small" src={dotGreenSmall} alt="" />
          <img className="tea-mascot" src={mascot} alt="" />
        </div>
      </section>

      <section className="tea-menu-panel" aria-labelledby="tdah-menu-title">
        <h1 id="tdah-menu-title">Elige una actividad</h1>
        <div className="tea-menu-tabs" aria-label="Perfil de actividades">
          <button type="button" onClick={() => void navigate(activityRoutes.home)}>
            TEA
          </button>
          <button className="is-active" type="button" aria-pressed="true">
            <span>TDAH</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <ul>
          {menuItems.map((item) => (
            <li key={item.label}>
              <button type="button" onClick={() => void navigate(item.path)}>
                <img className="tdah-menu-icon" src={item.icon} alt="" />
                <span>{item.label}</span>
                <span aria-hidden="true">›</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
