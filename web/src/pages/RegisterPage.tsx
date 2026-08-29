import { useId, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { messageForError } from '../api/error-messages';
import kivoLogo from '../assets/kivo-logo.png';
import type { UserRole } from '../auth/session-storage';
import { useAuth } from '../auth/useAuth';
import { activityRoutes } from '../routes/activity-flow';

/**
 * Espejo de `registerBodySchema` del backend, para avisar antes de gastar una
 * petición. El servidor sigue siendo la autoridad: si estas reglas y las suyas
 * se separan, gana la respuesta del servidor y se muestra su mensaje.
 */
const MIN_PASSWORD_LENGTH = 10;

function localValidationError(fullName: string, email: string, password: string): string | null {
  if (fullName.length < 2) {
    return 'Escribe tu nombre completo.';
  }
  if (email === '') {
    return 'Escribe tu correo electrónico.';
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `La contraseña debe tener al menos ${String(MIN_PASSWORD_LENGTH)} caracteres.`;
  }
  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número.';
  }
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra.';
  }

  return null;
}

export function RegisterPage(): React.JSX.Element {
  const { status, signUp } = useAuth();
  const navigate = useNavigate();
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('PARENT');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to="/actividades" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();
    const problem = localValidationError(trimmedName, trimmedEmail, password);
    if (problem !== null) {
      setError(problem);
      return;
    }

    setSubmitting(true);
    try {
      await signUp({ fullName: trimmedName, email: trimmedEmail, password, role });
      void navigate(activityRoutes.home, { replace: true });
    } catch (caught) {
      setError(
        messageForError(caught, {
          EMAIL_ALREADY_REGISTERED: 'Ese correo ya tiene una cuenta. Inicia sesión en su lugar.',
          TOO_MANY_REQUESTS:
            'Demasiados intentos seguidos. Espera unos minutos antes de volver a probar.',
        }),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="register-layout">
      <section className="register-card" aria-labelledby="register-title">
        <img className="register-logo" src={kivoLogo} alt="Kivo" />

        <h1 className="register-title" id="register-title">
          Crear una cuenta
        </h1>
        <p className="register-subtitle">
          La cuenta es de la persona adulta que acompaña. Después podrás añadir a quienes aprenden.
        </p>

        <form className="register-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="register-field">
            <label className="register-label" htmlFor={nameId}>
              Nombre completo
            </label>
            <input
              id={nameId}
              className="register-input"
              type="text"
              name="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              autoComplete="name"
              maxLength={100}
              required
              disabled={submitting}
              aria-describedby={error === null ? undefined : errorId}
            />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor={emailId}>
              Correo electrónico
            </label>
            <input
              id={emailId}
              className="register-input"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={254}
              required
              disabled={submitting}
              aria-describedby={error === null ? undefined : errorId}
            />
          </div>

          <div className="register-field">
            <label className="register-label" htmlFor={passwordId}>
              Contraseña
            </label>
            <input
              id={passwordId}
              className="register-input"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              maxLength={128}
              required
              disabled={submitting}
              aria-describedby={error === null ? undefined : errorId}
            />
            <p className="register-hint">
              Al menos {MIN_PASSWORD_LENGTH} caracteres, con una letra y un número.
            </p>
          </div>

          <fieldset className="register-roles" disabled={submitting}>
            <legend className="register-label">¿Desde dónde acompañas?</legend>
            <label className="register-role">
              <input
                type="radio"
                name="role"
                value="PARENT"
                checked={role === 'PARENT'}
                onChange={() => setRole('PARENT')}
              />
              <span>Familia</span>
            </label>
            <label className="register-role">
              <input
                type="radio"
                name="role"
                value="TEACHER"
                checked={role === 'TEACHER'}
                onChange={() => setRole('TEACHER')}
              />
              <span>Docente</span>
            </label>
          </fieldset>

          {error !== null && (
            <p className="register-error" id={errorId} role="alert">
              {error}
            </p>
          )}

          <button className="register-submit" type="submit" disabled={submitting}>
            {submitting ? 'Creando la cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="register-footer">
          ¿Ya tienes una cuenta?{' '}
          <Link className="register-footer-link" to="/login">
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}
