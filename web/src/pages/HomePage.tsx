import { useNavigate } from 'react-router-dom';
import { activityRoutes, titleFor } from '../routes/activity-flow';
import activityFlag from '../assets/activities/activity-flag.png';
import activityLeaf from '../assets/activities/activity-leaf.png';
import activityRocket from '../assets/activities/activity-rocket.png';
import activityStar from '../assets/activities/activity-star.png';
import activityTimer from '../assets/activities/activity-timer.png';
import dotGreen from '../assets/activities/dot-green.svg';
import dotOrange from '../assets/activities/dot-orange.svg';
import dotPink from '../assets/activities/dot-pink.svg';
import dotPurple from '../assets/activities/dot-purple.svg';
import dotTealLarge from '../assets/activities/dot-teal-large.svg';
import dotTealSmall from '../assets/activities/dot-teal-small.svg';
import kivoLogo from '../assets/activities/kivo-logo.png';
import kivoMascot from '../assets/activities/kivo-mascot.png';

interface Activity {
  label: string;
  path: string;
  /** Icono exportado; «Colores y formas» usa figuras de CSS porque no tiene uno. */
  icon?: string;
}

/**
 * Las seis actividades del menú TEA. Las cuatro primeras forman el recorrido
 * guiado que numeran las pantallas («2/4»); «Rutina diaria» y «Colores y
 * formas» se juegan sueltas, por eso no cambian ese contador.
 */
const ACTIVITIES: readonly Activity[] = [
  { icon: activityRocket, label: titleFor(activityRoutes.sequence), path: activityRoutes.sequence },
  {
    icon: activityFlag,
    label: titleFor(activityRoutes.instruction),
    path: activityRoutes.instruction,
  },
  {
    icon: activityLeaf,
    label: titleFor(activityRoutes.classification),
    path: activityRoutes.classification,
  },
  { icon: activityStar, label: titleFor(activityRoutes.matching), path: activityRoutes.matching },
  { icon: activityTimer, label: titleFor(activityRoutes.routine), path: activityRoutes.routine },
  { label: titleFor(activityRoutes.colors), path: activityRoutes.colors },
];

export function HomePage(): React.JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="activities-page">
      <section className="activities-brand" aria-label="Kivo">
        <img className="activities-logo" src={kivoLogo} alt="Kivo" />
        <p className="activities-tagline">
          Aprende a tu <span className="tagline-rhythm">ritmo</span>, crece a tu{' '}
          <span className="tagline-way">manera</span>
        </p>

        <div className="mascot-scene" aria-hidden="true">
          <img className="mascot-dot mascot-dot-purple" src={dotPurple} alt="" />
          <img className="mascot-dot mascot-dot-teal-large" src={dotTealLarge} alt="" />
          <img className="mascot-dot mascot-dot-teal-small" src={dotTealSmall} alt="" />
          <img className="mascot-dot mascot-dot-orange" src={dotOrange} alt="" />
          <img className="mascot-dot mascot-dot-pink" src={dotPink} alt="" />
          <img className="mascot-dot mascot-dot-green" src={dotGreen} alt="" />
          <img className="activities-mascot" src={kivoMascot} alt="" />
        </div>
      </section>

      <section className="activities-panel" aria-labelledby="activities-title">
        <h1 id="activities-title">Elige una actividad</h1>

        <div className="activities-tabs" role="tablist" aria-label="Elige el perfil de apoyo">
          <button
            className="activity-tab activity-tab-active"
            type="button"
            role="tab"
            aria-selected="true"
            aria-label="Actividades TEA, seleccionado"
          >
            TEA
          </button>
          <button
            className="activity-tab activity-tab-right"
            type="button"
            role="tab"
            aria-selected="false"
            onClick={() => void navigate(activityRoutes.tdahMenu)}
            aria-label="Ver las actividades TDAH"
          >
            <span>TDAH</span>
            <span className="tab-chevron" aria-hidden="true">
              ›
            </span>
          </button>
        </div>

        <ul className="activities-list">
          {ACTIVITIES.map((activity, index) => (
            <li key={activity.path} style={{ '--row-index': index } as React.CSSProperties}>
              <button
                className="activity-row"
                type="button"
                onClick={() => void navigate(activity.path)}
                aria-label={`Abrir ${activity.label}`}
              >
                <span className="activity-icon" aria-hidden="true">
                  {activity.icon === undefined ? (
                    <span className="activity-colors-icon">
                      <i />
                      <i />
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : (
                    <img src={activity.icon} alt="" />
                  )}
                </span>
                <span className="activity-label">{activity.label}</span>
                <span className="activity-chevron" aria-hidden="true">
                  ›
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
