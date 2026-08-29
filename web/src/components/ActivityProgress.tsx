import type { ActivityStep } from '../routes/activity-flow';

interface ActivityProgressProps {
  /** Clase del contenedor: cada pantalla lo coloca en su propia cabecera. */
  className: string;
  /** Clase de la fila de puntos; el diseño usa dos tamaños distintos. */
  dotsClassName: string;
  step: ActivityStep;
  activeIcon: string;
  pendingIcon: string;
}

/**
 * Indicador «2/4» de las actividades TEA. Los puntos y el número salen del
 * mismo paso calculado desde el recorrido, de modo que no pueden contradecirse
 * ni quedarse fijos cuando se añade o se quita una actividad.
 */
export function ActivityProgress({
  className,
  dotsClassName,
  step,
  activeIcon,
  pendingIcon,
}: ActivityProgressProps): React.JSX.Element {
  const dots = Array.from({ length: step.total }, (_, index) => index);

  return (
    <div
      className={className}
      aria-label={`Progreso ${String(step.position)} de ${String(step.total)}`}
    >
      <span className={dotsClassName} aria-hidden="true">
        {dots.map((index) => (
          <img key={index} src={index < step.position ? activeIcon : pendingIcon} alt="" />
        ))}
      </span>
      <span>
        {step.position}/{step.total}
      </span>
    </div>
  );
}
