import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dot1 from '../assets/question-notice/dot-1.svg';
import dot2 from '../assets/question-notice/dot-2.svg';
import dot3 from '../assets/question-notice/dot-3.svg';
import dot4 from '../assets/question-notice/dot-4.svg';
import dot5 from '../assets/question-notice/dot-5.svg';
import dot6 from '../assets/question-notice/dot-6.svg';
import dot7 from '../assets/question-notice/dot-7.svg';
import dot8 from '../assets/question-notice/dot-8.svg';
import logo from '../assets/question-notice/logo.png';
import mascot from '../assets/question-notice/mascot.png';
import shield from '../assets/question-notice/shield.svg';
import { activityRoutes } from '../routes/activity-flow';

const dots = [dot1, dot2, dot3, dot4, dot5, dot6, dot7, dot8];
const LOADING_DURATION_MS = 10_000;

export function QuestionNoticePage(): React.JSX.Element {
  const navigate = useNavigate();
  const [remainingMs, setRemainingMs] = useState(LOADING_DURATION_MS);

  useEffect(() => {
    const startedAt = Date.now();
    const updateCountdown = (): void => {
      setRemainingMs(Math.max(0, LOADING_DURATION_MS - (Date.now() - startedAt)));
    };

    const intervalId = window.setInterval(updateCountdown, 200);
    const timeoutId = window.setTimeout(() => {
      void navigate(activityRoutes.login, { replace: true });
    }, LOADING_DURATION_MS);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [navigate]);

  const remainingSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
  const progress = ((LOADING_DURATION_MS - remainingMs) / LOADING_DURATION_MS) * 100;

  return (
    <main className="question-notice-page">
      <section className="question-notice-copy">
        <img src={logo} alt="Kivo" />
        <p className="question-notice-tagline">
          Aprende a tu <span>ritmo</span>, crece a tu <strong>manera</strong>
        </p>
        <h1>
          Conoce a tu hijo/a
          <br />
          para acompañarlo mejor
        </h1>
        <p className="question-notice-description">
          Estas preguntas nos ayudan a<br />
          personalizar su experiencia
          <br />y ofrecerle el apoyo que
          <br />
          más necesita.
        </p>
        <div className="question-notice-loader" role="status" aria-live="polite">
          <div className="question-loader-copy">
            <span>Preparando tu experiencia</span>
            <strong>{remainingSeconds} s</strong>
          </div>
          <div className="question-loader-track" aria-hidden="true">
            <span style={{ width: `${String(progress)}%` }} />
          </div>
        </div>
      </section>
      <img className="question-notice-mascot" src={mascot} alt="Kivo pensando" />
      <div className="question-notice-dots" aria-hidden="true">
        {dots.map((source, index) => (
          <img key={source} className={`question-dot-${index + 1}`} src={source} alt="" />
        ))}
      </div>
      <aside className="privacy-card">
        <img src={shield} alt="" />
        <p>
          Tu información
          <br />
          está segura con
          <br />
          nosotros.
        </p>
      </aside>
    </main>
  );
}
