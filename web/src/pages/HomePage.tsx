import { useNavigate } from 'react-router-dom';
import { activityRoutes } from '../routes/activity-flow';
import activityFlag from '../assets/activities/activity-flag.png';
import activityMedal from '../assets/activities/activity-medal.png';
import activityRocket from '../assets/activities/activity-rocket.png';
import activityStar from '../assets/activities/activity-star.png';
import dotGreen from '../assets/activities/dot-green.svg';
import dotOrange from '../assets/activities/dot-orange.svg';
import dotPink from '../assets/activities/dot-pink.svg';
import dotPurple from '../assets/activities/dot-purple.svg';
import dotTealLarge from '../assets/activities/dot-teal-large.svg';
import dotTealSmall from '../assets/activities/dot-teal-small.svg';
import kivoLogo from '../assets/activities/kivo-logo.png';
import kivoMascot from '../assets/activities/kivo-mascot.png';

interface Activity {
  icon: string;
  label: string;
  path: string;
}

const ACTIVITIES: Activity[] = [
  { icon: activityRocket, label: 'Secuencia visual', path: activityRoutes.sequence },
  { icon: activityFlag, label: 'Instrucción única', path: activityRoutes.instruction },
  { icon: activityStar, label: 'Emparejar la palabra', path: activityRoutes.matching },
  { icon: activityMedal, label: 'Actividad completada', path: activityRoutes.completion },
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

        <div className="activities-tabs" aria-label="Perfil de actividades">
          <button
            className="activity-tab"
            type="button"
            onClick={() => void navigate(activityRoutes.tdahMenu)}
            aria-pressed="false"
            aria-label="Abrir actividades TDAH"
          >
            TDAH
          </button>
          <button
            className="activity-tab activity-tab-right activity-tab-active"
            type="button"
            aria-pressed="true"
            aria-label="Actividades TEA seleccionadas"
          >
            <span>TEA</span>
            <span className="tab-chevron" aria-hidden="true">
              ›
            </span>
          </button>
        </div>

        <ul className="activities-list">
          {ACTIVITIES.map((activity) => (
            <li key={activity.label}>
              <button
                className="activity-row"
                type="button"
                onClick={() => void navigate(activity.path)}
                aria-label={`Abrir ${activity.label}`}
              >
                <span className="activity-icon" aria-hidden="true">
                  <img src={activity.icon} alt="" />
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
