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

export function QuestionNoticePage(): React.JSX.Element {
  const navigate = useNavigate();
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
        <button type="button" onClick={() => void navigate(activityRoutes.home)}>
          Continuar
        </button>
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
