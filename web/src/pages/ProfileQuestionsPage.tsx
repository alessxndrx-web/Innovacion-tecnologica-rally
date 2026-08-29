import { useState } from 'react';
import answerCircle1 from '../assets/profile-questions/answer-circle-1.svg';
import answerCircle2 from '../assets/profile-questions/answer-circle-2.svg';
import answerCircle3 from '../assets/profile-questions/answer-circle-3.svg';
import answerCircle4 from '../assets/profile-questions/answer-circle-4.svg';
import answerIcon1 from '../assets/profile-questions/answer-icon-1.svg';
import answerIcon2 from '../assets/profile-questions/answer-icon-2.svg';
import answerIcon3 from '../assets/profile-questions/answer-icon-3.svg';
import answerIcon4 from '../assets/profile-questions/answer-icon-4.svg';
import avatar from '../assets/profile-questions/avatar.png';
import mascotShadow from '../assets/profile-questions/mascot-shadow.svg';
import mascot from '../assets/profile-questions/mascot.png';
import numberCircle from '../assets/profile-questions/number-circle.svg';
import progressActive from '../assets/profile-questions/progress-active.svg';
import progressPending from '../assets/profile-questions/progress-pending.svg';

type ProfileAnswer = 'TEA' | 'TDAH' | 'BOTH' | 'UNDIAGNOSED';

const PROFILE_STORAGE_KEY = 'kivo.profile.primaryProfile';

const answers: Array<{
  id: ProfileAnswer;
  circle: string;
  icon: string;
  label: React.JSX.Element;
  accessibleLabel: string;
}> = [
  {
    id: 'TEA',
    circle: answerCircle1,
    icon: answerIcon1,
    label: <>TEA (Trastorno del Espectro Autista).</>,
    accessibleLabel: 'TEA, Trastorno del Espectro Autista',
  },
  {
    id: 'TDAH',
    circle: answerCircle2,
    icon: answerIcon2,
    label: (
      <>
        TDAH (Trastorno por Deficiencia
        <br />
        de Atención e Hiperactividad).
      </>
    ),
    accessibleLabel: 'TDAH, Trastorno por Deficiencia de Atención e Hiperactividad',
  },
  {
    id: 'BOTH',
    circle: answerCircle3,
    icon: answerIcon3,
    label: <>Ambos perfiles.</>,
    accessibleLabel: 'Ambos perfiles',
  },
  {
    id: 'UNDIAGNOSED',
    circle: answerCircle4,
    icon: answerIcon4,
    label: (
      <>
        Aún sin diagnóstico oficial,
        <br />
        pero busco apoyo visual
      </>
    ),
    accessibleLabel: 'Aún sin diagnóstico oficial, pero busco apoyo visual',
  },
];

function loadSavedAnswer(): ProfileAnswer | null {
  try {
    const saved = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return answers.some((answer) => answer.id === saved) ? (saved as ProfileAnswer) : null;
  } catch {
    return null;
  }
}

export function ProfileQuestionsPage(): React.JSX.Element {
  const [selected, setSelected] = useState<ProfileAnswer | null>(loadSavedAnswer);

  const selectAnswer = (answer: ProfileAnswer): void => {
    setSelected(answer);
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, answer);
    } catch {
      // La selección sigue activa durante esta sesión aunque no haya almacenamiento.
    }
  };

  return (
    <main className="profile-questions-page">
      <section className="profile-questions-card" aria-labelledby="profile-questions-title">
        <header className="profile-questions-header">
          <img className="profile-questions-avatar" src={avatar} alt="Avatar de Kivo" />
          <h1 id="profile-questions-title">Responde a estas preguntas</h1>
          <div className="profile-questions-progress" aria-label="Pregunta 1 de 7">
            <span aria-hidden="true">
              {[0, 1, 2, 3, 4, 5, 6].map((step) => (
                <img key={step} src={step === 0 ? progressActive : progressPending} alt="" />
              ))}
            </span>
            <strong>1 de 7</strong>
          </div>
        </header>

        <div className="profile-mascot-scene" aria-hidden="true">
          <img className="profile-mascot-shadow" src={mascotShadow} alt="" />
          <img className="profile-mascot" src={mascot} alt="" />
        </div>

        <section className="profile-question-panel" aria-labelledby="profile-question-text">
          <div className="profile-question-heading">
            <span className="profile-question-number" aria-hidden="true">
              <img src={numberCircle} alt="" />
              <b>1</b>
            </span>
            <h2 id="profile-question-text">¿Cuál es el perfil principal de tu hijo/a?</h2>
          </div>

          <div className="profile-answer-list" role="group" aria-label="Opciones de perfil">
            {answers.map((answer) => (
              <button
                key={answer.id}
                className={`profile-answer${selected === answer.id ? ' is-selected' : ''}`}
                type="button"
                onClick={() => selectAnswer(answer.id)}
                aria-label={answer.accessibleLabel}
                aria-pressed={selected === answer.id}
              >
                <span className="profile-answer-icon" aria-hidden="true">
                  <img src={answer.circle} alt="" />
                  <img src={answer.icon} alt="" />
                </span>
                <span>{answer.label}</span>
              </button>
            ))}
          </div>
          <p className="visually-hidden" role="status" aria-live="polite">
            {selected === null
              ? ''
              : 'Respuesta guardada. La siguiente pregunta estará disponible pronto.'}
          </p>
        </section>
      </section>
    </main>
  );
}
