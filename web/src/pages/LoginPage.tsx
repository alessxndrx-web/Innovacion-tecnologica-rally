import { useId, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { messageForError } from '../api/error-messages';
import googleIcon from '../assets/google-icon.svg';
import kivoLogo from '../assets/kivo-logo.png';
import { useAuth } from '../auth/useAuth';
import { activityRoutes } from '../routes/activity-flow';

/**
 * Aviso mostrado al pulsar una opción que todavía no tiene backend.
 *
 * Se prefiere un mensaje explícito a un elemento inerte: un control que no
 * responde al clic se lee como una aplicación rota, no como una función
 * pendiente.
 */
const UNAVAILABLE_GOOGLE = 'El acceso con Google todavía no está disponible.';
const UNAVAILABLE_RECOVERY =
  'La recuperación de contraseña todavía no está disponible. Escribe al equipo si no puedes entrar.';

type Feedback = { kind: 'error' | 'notice'; text: string };

export function LoginPage(): React.JSX.Element {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const emailId = useId();
  const passwordId = useId();
  const feedbackId = useId();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'authenticated') {
    return <Navigate to={activityRoutes.home} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setFeedback(null);

    const trimmedEmail = email.trim();
    if (trimmedEmail === '' || password === '') {
      setFeedback({ kind: 'error', text: 'Introduce tu correo y tu contraseña.' });
      return;
    }

    setSubmitting(true);
    try {
      await signIn(trimmedEmail, password);
      void navigate(activityRoutes.home, { replace: true });
    } catch (caught) {
      setFeedback({ kind: 'error', text: messageForError(caught) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-brand" aria-label="Kivo">
        <img className="auth-logo" src={kivoLogo} alt="Kivo" />
        <p className="auth-tagline">Aprende a tu ritmo, crece a tu manera.</p>
      </section>

      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-header">
          <h1 className="auth-title" id="login-title">
            ¡Bienvenido!
          </h1>
        </header>

        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <div className="field">
            <label className="field-label visually-hidden" htmlFor={emailId}>
              Correo electrónico
            </label>
            <input
              id={emailId}
              className="field-input"
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Correo electrónico"
              required
              disabled={submitting}
              aria-describedby={feedback === null ? undefined : feedbackId}
            />
          </div>

          <div className="field">
            <label className="field-label visually-hidden" htmlFor={passwordId}>
              Contraseña
            </label>
            <input
              id={passwordId}
              className="field-input"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="Contraseña"
              required
              disabled={submitting}
              aria-describedby={feedback === null ? undefined : feedbackId}
            />
          </div>

          {feedback !== null && (
            <p
              className={feedback.kind === 'error' ? 'form-error' : 'form-notice'}
              id={feedbackId}
              role={feedback.kind === 'error' ? 'alert' : 'status'}
            >
              {feedback.text}
            </p>
          )}

          <button className="auth-submit" type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </button>

          <div className="auth-links">
            <Link className="auth-link" to={activityRoutes.register}>
              Crear una cuenta
            </Link>
            <button
              className="auth-link auth-link-button"
              type="button"
              onClick={() => setFeedback({ kind: 'notice', text: UNAVAILABLE_RECOVERY })}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>

          <div className="auth-divider" aria-hidden="true" />

          <button
            className="auth-social"
            type="button"
            onClick={() => setFeedback({ kind: 'notice', text: UNAVAILABLE_GOOGLE })}
          >
            <img src={googleIcon} alt="" />
            <span>Continuar con Google</span>
          </button>
        </form>
      </section>
    </main>
  );
}
