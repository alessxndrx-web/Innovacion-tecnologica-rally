import { DEMO_MODE } from '../api/config';

/**
 * Aviso de que la aplicación corre sin backend.
 *
 * Se muestra solo en las pantallas de acceso, que es donde importa: quien crea
 * una cuenta debe saber que se guarda en este dispositivo y no en un servidor.
 * Va en posición fija en lugar de dentro de la tarjeta porque las pantallas de
 * acceso están maquetadas con posiciones absolutas calcadas del diseño, y
 * añadir un elemento en el flujo las descuadraría.
 */
export function DemoNotice(): React.JSX.Element | null {
  if (!DEMO_MODE) {
    return null;
  }

  return (
    <p className="demo-notice" role="status">
      Modo demostración: tu cuenta se guarda solo en este dispositivo.
    </p>
  );
}
