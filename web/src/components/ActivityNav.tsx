import { useNavigate } from 'react-router-dom';
import { activityRoutes, titleFor, type ActivityStep } from '../routes/activity-flow';

interface ActivityNavProps {
  step: ActivityStep;
  /** Menú al que vuelve el botón «Menú»; por defecto, el de actividades TEA. */
  menu?: string;
}

/**
 * Barra de avance fija que llevan todas las actividades.
 *
 * Antes solo se podía continuar acertando el ejercicio, y cada pantalla
 * escondía su salida en un sitio distinto: quien se atascaba se quedaba
 * encerrado. Al ser fija y estar siempre activa, avanzar no depende de resolver.
 */
export function ActivityNav({
  step,
  menu = activityRoutes.home,
}: ActivityNavProps): React.JSX.Element {
  const navigate = useNavigate();
  const isLastStep = step.position === step.total;

  return (
    <nav className="activity-nav" aria-label="Navegación de la actividad">
      <button
        className="activity-nav-menu"
        type="button"
        onClick={() => void navigate(menu)}
        aria-label={`Ir a ${titleFor(menu)}`}
      >
        Menú
      </button>
      <button
        className="activity-nav-next"
        type="button"
        onClick={() => void navigate(step.next)}
        aria-label={`Continuar a ${titleFor(step.next)}`}
      >
        <span>{isLastStep ? 'Terminar' : 'Continuar'}</span>
        <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}
