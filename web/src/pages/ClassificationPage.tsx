import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import avatarFrame from '../assets/classification/avatar-frame.svg';
import avatar from '../assets/classification/avatar.png';
import backButton from '../assets/classification/back.svg';
import circleExample from '../assets/classification/circle-example.svg';
import circleOrange from '../assets/classification/circle-orange.svg';
import circlePink from '../assets/classification/circle-pink.svg';
import circleTeal from '../assets/classification/circle-teal.svg';
import mascot from '../assets/classification/mascot.png';
import progressActive from '../assets/classification/progress-active.svg';
import progressPending from '../assets/classification/progress-pending.svg';
import triangleGreen from '../assets/classification/triangle-green.svg';
import { ActivityNav } from '../components/ActivityNav';
import { ActivityProgress } from '../components/ActivityProgress';
import { activityRoutes, flowStepFor, titleFor } from '../routes/activity-flow';

type ShapeId = 'teal' | 'triangle' | 'orange' | 'square' | 'pink';
type BinId = 'blue' | 'green';

interface Shape {
  id: ShapeId;
  label: string;
  /** Clase que la coloca en la bandeja; el cuadrado se dibuja con fondo, sin imagen. */
  className: string;
  isCircle: boolean;
  image?: string;
}

const SHAPES: readonly Shape[] = [
  {
    id: 'teal',
    label: 'Círculo turquesa',
    className: 'shape-teal',
    isCircle: true,
    image: circleTeal,
  },
  {
    id: 'triangle',
    label: 'Triángulo verde',
    className: 'shape-triangle',
    isCircle: false,
    image: triangleGreen,
  },
  {
    id: 'orange',
    label: 'Círculo naranja',
    className: 'shape-orange',
    isCircle: true,
    image: circleOrange,
  },
  { id: 'square', label: 'Cuadrado morado', className: 'shape-square', isCircle: false },
  { id: 'pink', label: 'Círculo rosa', className: 'shape-pink', isCircle: true, image: circlePink },
];

const BIN_NAMES: Record<BinId, string> = {
  blue: 'la caja celeste',
  green: 'la caja verde',
};

/** Cuánto hay que mover el dedo o el ratón para que cuente como arrastre y no como toque. */
const DRAG_THRESHOLD_PX = 6;

interface DragState {
  id: ShapeId;
  dx: number;
  dy: number;
  /** Caja bajo el puntero, para resaltarla mientras se arrastra. */
  over: BinId | null;
}

function binFor(shape: Shape): BinId {
  return shape.isCircle ? 'blue' : 'green';
}

export function ClassificationPage(): React.JSX.Element {
  const navigate = useNavigate();
  const step = flowStepFor(activityRoutes.classification);

  const [placed, setPlaced] = useState<Partial<Record<ShapeId, BinId>>>({});
  const [selected, setSelected] = useState<ShapeId | null>(null);
  const [rejected, setRejected] = useState<ShapeId | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [notice, setNotice] = useState(
    'Arrastra los círculos a la caja celeste y el resto a la verde.',
  );

  const blueBinRef = useRef<HTMLButtonElement | null>(null);
  const greenBinRef = useRef<HTMLButtonElement | null>(null);
  const originRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  /** Tras arrastrar, el navegador emite además un `click`: sin esto seleccionaría la figura recién soltada. */
  const suppressClickRef = useRef(false);

  const placedCount = Object.keys(placed).length;
  const isComplete = placedCount === SHAPES.length;

  const binAt = (x: number, y: number): BinId | null => {
    const inside = (element: HTMLElement | null): boolean => {
      if (element === null) {
        return false;
      }
      const rect = element.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    if (inside(blueBinRef.current)) {
      return 'blue';
    }
    if (inside(greenBinRef.current)) {
      return 'green';
    }
    return null;
  };

  const place = (shape: Shape, bin: BinId): void => {
    if (bin !== binFor(shape)) {
      setRejected(shape.id);
      setNotice(`${shape.label} no va en ${BIN_NAMES[bin]}. Prueba en la otra.`);
      return;
    }

    setRejected(null);
    setSelected(null);
    setPlaced((current) => ({ ...current, [shape.id]: bin }));
    setNotice(
      placedCount + 1 === SHAPES.length
        ? '¡Muy bien! Clasificaste todas las figuras.'
        : '¡Correcto! Sigue con otra figura.',
    );
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>, shape: Shape): void => {
    event.currentTarget.setPointerCapture(event.pointerId);
    originRef.current = { x: event.clientX, y: event.clientY };
    movedRef.current = false;
    suppressClickRef.current = false;
    setRejected(null);
    setDrag({ id: shape.id, dx: 0, dy: 0, over: null });
  };

  const moveDrag = (event: ReactPointerEvent<HTMLButtonElement>, shape: Shape): void => {
    if (drag === null || drag.id !== shape.id) {
      return;
    }

    const dx = event.clientX - originRef.current.x;
    const dy = event.clientY - originRef.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
      movedRef.current = true;
    }

    setDrag({ id: shape.id, dx, dy, over: binAt(event.clientX, event.clientY) });
  };

  const endDrag = (event: ReactPointerEvent<HTMLButtonElement>, shape: Shape): void => {
    if (drag === null || drag.id !== shape.id) {
      return;
    }

    const bin = binAt(event.clientX, event.clientY);
    setDrag(null);

    if (!movedRef.current) {
      return;
    }

    suppressClickRef.current = true;
    if (bin === null) {
      setNotice('Suéltala dentro de una caja.');
      return;
    }

    place(shape, bin);
  };

  /**
   * El clic mantiene abierta la vía sin arrastre —imprescindible con teclado—:
   * se elige la figura y después la caja.
   */
  const toggleSelection = (shape: Shape): void => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }

    setRejected(null);
    setSelected((current) => (current === shape.id ? null : shape.id));
    setNotice(
      selected === shape.id
        ? 'Arrastra los círculos a la caja celeste y el resto a la verde.'
        : `${shape.label} elegida. Ahora toca la caja donde va.`,
    );
  };

  const dropSelected = (bin: BinId): void => {
    if (selected === null) {
      setNotice('Primero elige una figura o arrástrala hasta aquí.');
      return;
    }

    const shape = SHAPES.find((item) => item.id === selected);
    if (shape !== undefined) {
      place(shape, bin);
    }
  };

  const shapesIn = (bin: BinId): readonly Shape[] =>
    SHAPES.filter((shape) => placed[shape.id] === bin);

  const renderBin = (bin: BinId): React.JSX.Element => {
    const isTarget = drag?.over === bin || (drag === null && selected !== null);

    return (
      <button
        ref={bin === 'blue' ? blueBinRef : greenBinRef}
        className={[
          'classification-bin',
          bin === 'blue' ? 'blue-bin' : 'green-bin',
          isTarget ? 'is-target' : '',
          isComplete ? 'is-complete' : '',
        ]
          .filter((name) => name !== '')
          .join(' ')}
        type="button"
        onClick={() => dropSelected(bin)}
        aria-label={
          bin === 'blue'
            ? 'Caja celeste, para los círculos'
            : 'Caja verde, para las figuras que no son círculos'
        }
      >
        {bin === 'blue' ? (
          <img className="bin-example" src={circleExample} alt="" />
        ) : (
          <span className="bin-example" aria-hidden="true" />
        )}
        <span className="sorted-shapes" aria-hidden="true">
          {shapesIn(bin).map((shape) => (
            <span key={shape.id} className="sorted-shape">
              {shape.image === undefined ? (
                <span className="sorted-square" />
              ) : (
                <img src={shape.image} alt="" />
              )}
            </span>
          ))}
        </span>
      </button>
    );
  };

  return (
    <main className="classification-page">
      <header className="classification-header">
        <button
          className="classification-back"
          type="button"
          onClick={() => void navigate(step.previous)}
          aria-label={`Volver a ${titleFor(step.previous)}`}
        >
          <img src={backButton} alt="" />
          <span aria-hidden="true">←</span>
        </button>
        <h1>Clasificación</h1>
        <ActivityProgress
          className="classification-progress"
          dotsClassName="activity-progress-dots"
          step={step}
          activeIcon={progressActive}
          pendingIcon={progressPending}
        />
        <div className="classification-avatar" aria-label="Perfil de Kivo">
          <img src={avatarFrame} alt="" />
          <img src={avatar} alt="Avatar de Kivo" />
        </div>
      </header>

      <section className="classification-content" aria-labelledby="classification-instruction">
        <h2 id="classification-instruction">Pon cada figura en su caja.</h2>
        <p className="classification-notice" role="status" aria-live="polite">
          {notice}
        </p>

        <div className="shape-tray" aria-label="Figuras para clasificar">
          {SHAPES.map((shape) => {
            if (placed[shape.id] !== undefined) {
              return null;
            }

            const isDragging = drag?.id === shape.id;
            const className = [
              'shape-option',
              shape.className,
              isDragging ? 'is-dragging' : '',
              selected === shape.id ? 'is-selected' : '',
              rejected === shape.id ? 'is-rejected' : '',
            ]
              .filter((name) => name !== '')
              .join(' ');

            return (
              <button
                key={shape.id}
                className={className}
                type="button"
                style={
                  isDragging && drag !== null
                    ? { transform: `translate(${String(drag.dx)}px, ${String(drag.dy)}px)` }
                    : undefined
                }
                onPointerDown={(event) => startDrag(event, shape)}
                onPointerMove={(event) => moveDrag(event, shape)}
                onPointerUp={(event) => endDrag(event, shape)}
                onPointerCancel={() => setDrag(null)}
                onClick={() => toggleSelection(shape)}
                onAnimationEnd={() => {
                  if (rejected === shape.id) {
                    setRejected(null);
                  }
                }}
                aria-pressed={selected === shape.id}
                aria-label={`${shape.label}${selected === shape.id ? ', elegida' : ''}`}
              >
                {shape.image === undefined ? null : (
                  /* Sin esto la imagen arranca el arrastre nativo del navegador,
                     que cancela la captura del puntero y se come el gesto. */
                  <img src={shape.image} alt="" draggable={false} />
                )}
              </button>
            );
          })}
        </div>

        {renderBin('blue')}
        {renderBin('green')}

        <img className="classification-mascot" src={mascot} alt="Kivo observando las figuras" />

        {isComplete && (
          <button
            className="classification-continue reward-pop"
            type="button"
            onClick={() => void navigate(step.next)}
            aria-label={`Continuar a ${titleFor(step.next)}`}
          >
            <span aria-hidden="true">✓</span>Continuar
          </button>
        )}
      </section>

      <ActivityNav step={step} />
    </main>
  );
}
