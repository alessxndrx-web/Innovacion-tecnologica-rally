import { useNavigate } from 'react-router-dom';
import activityFlag from '../assets/activities/activity-flag.png';
import activityMedal from '../assets/activities/activity-medal.png';
import activityTimer from '../assets/activities/activity-timer.png';
import dotGreenSmall from '../assets/tea-menu/dot-green-small.svg';
import dotGreen from '../assets/tea-menu/dot-green.svg';
import dotOrange from '../assets/tea-menu/dot-orange.svg';
import dotPink from '../assets/tea-menu/dot-pink.svg';
import dotPurple from '../assets/tea-menu/dot-purple.svg';
import dotTeal from '../assets/tea-menu/dot-teal.svg';
import logo from '../assets/tea-menu/logo.png';
import mascot from '../assets/tea-menu/mascot.png';
import { activityRoutes, tdahFlow, titleFor } from '../routes/activity-flow';

/**
 * Las clases `tea-*` son las del nodo de Figma 92:2, que se reutiliza para
 * ambos menús; el contenido de esta pantalla es el recorrido TDAH.
 */
const MENU_ICONS: Readonly<Record<string, string>> = {
  [activityRoutes.miniChallenge]: activityFlag,
  [activityRoutes.rewards]: activityMedal,
  [activityRoutes.quickMissions]: activityTimer,
};

/**
 * La lista sale de `tdahFlow`, no de una copia a mano: así el menú no puede
 * ofrecer una actividad que ya no esté en el recorrido ni olvidar una nueva.
 */
const menuItems = tdahFlow.steps.map((path) => ({
  path,
  label: titleFor(path),
  icon: MENU_ICONS[path],
}));

export function TdahMenuPage(): React.JSX.Element {
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
          <button
            type="button"
            onClick={() => void navigate(activityRoutes.home)}
            aria-pressed="false"
            aria-label="Ver las actividades TEA"
          >
            TEA
          </button>
          <button className="is-active" type="button" aria-pressed="true">
            <span>TDAH</span>
            <span aria-hidden="true">›</span>
          </button>
        </div>
        <ul>
          {menuItems.map((item) => (
            <li key={item.path}>
              <button
                type="button"
                onClick={() => void navigate(item.path)}
                aria-label={`Abrir ${item.label}`}
              >
                {item.icon === undefined ? (
                  <span aria-hidden="true" />
                ) : (
                  <img className="tdah-menu-icon" src={item.icon} alt="" />
                )}
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
