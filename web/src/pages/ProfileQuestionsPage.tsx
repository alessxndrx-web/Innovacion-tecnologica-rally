import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import question2Moderate from '../assets/profile-questions/question-2-moderate.svg';
import question2Short from '../assets/profile-questions/question-2-short.svg';
import question2Variable from '../assets/profile-questions/question-2-variable.svg';
import question4Animation from '../assets/profile-questions/question-4-animation.svg';
import question4Calm from '../assets/profile-questions/question-4-calm.svg';
import question5Sequential from '../assets/profile-questions/question-5-sequential.svg';
import { useAuth } from '../auth/useAuth';
import {
  loadProfileAnswer,
  markProfileQuestionsCompleted,
  saveProfileAnswer,
} from '../profile-question-storage';
import { activityRoutes } from '../routes/activity-flow';

type QuestionStep = 1 | 2 | 3 | 4 | 5;

interface QuestionAnswer {
  readonly id: string;
  readonly label: string;
  readonly accessibleLabel?: string;
  readonly tone: string;
  readonly circle?: string;
  readonly icon?: string;
  readonly symbol?: string;
  readonly symbolClassName?: string;
}

interface ProfileQuestion {
  readonly step: QuestionStep;
  readonly nodeId: string;
  readonly theme: 'teal' | 'orange' | 'purple' | 'pink' | 'green';
  readonly text: string;
  readonly subtitle?: string;
  readonly answers: readonly QuestionAnswer[];
}

const questions: Readonly<Record<QuestionStep, ProfileQuestion>> = {
  1: {
    step: 1,
    nodeId: '130:2',
    theme: 'teal',
    text: '¿Cuál es el perfil principal de tu hijo/a?',
    answers: [
      {
        id: 'TEA',
        label: 'TEA (Trastorno del Espectro Autista).',
        tone: '#ec6683',
        circle: answerCircle1,
        icon: answerIcon1,
      },
      {
        id: 'TDAH',
        label: 'TDAH (Trastorno por Deficiencia de Atención e Hiperactividad).',
        tone: '#8bc347',
        circle: answerCircle2,
        icon: answerIcon2,
      },
      {
        id: 'BOTH',
        label: 'Ambos perfiles.',
        tone: '#7257a8',
        circle: answerCircle3,
        icon: answerIcon3,
      },
      {
        id: 'UNDIAGNOSED',
        label: 'Aún sin diagnóstico oficial, pero busco apoyo visual.',
        tone: '#ff941c',
        circle: answerCircle4,
        icon: answerIcon4,
      },
    ],
  },
  2: {
    step: 2,
    nodeId: '142:2',
    theme: 'orange',
    text: '¿Cuánto tiempo suele concentrarse en una tarea antes de distraerse?',
    answers: [
      {
        id: 'SHORT',
        label: 'Poco tiempo (2 a 5 minutos, necesita descansos rápidos).',
        tone: '#ec6683',
        icon: question2Short,
      },
      {
        id: 'MODERATE',
        label: 'Tiempo moderado (más de 5 minutos).',
        tone: '#8bc347',
        icon: question2Moderate,
      },
      {
        id: 'VARIABLE',
        label: 'Depende (se distrae rápido, pero se concentra mucho en lo que le apasiona).',
        tone: '#7257a8',
        icon: question2Variable,
      },
    ],
  },
  3: {
    step: 3,
    nodeId: '142:47',
    theme: 'purple',
    text:
      'Cuando le pides que haga algo (e. “guarda los juguetes y lávate las manos”). ¿Cómo le resulta más fácil entenderlo?',
    subtitle: '(Para ajustar la cantidad de instrucciones y no saturar su memoria).',
    answers: [
      {
        id: 'ONE_STEP',
        label: 'Un solo paso a la vez (si le digo 3 cosas juntas, olvida las últimas).',
        tone: '#20b2b3',
        symbol: '1',
      },
      {
        id: 'MULTIPLE_STEPS',
        label: 'Tiempo moderado (más de 5 minutos).',
        tone: '#8bc347',
        symbol: '2 3',
        symbolClassName: 'is-small',
      },
    ],
  },
  4: {
    step: 4,
    nodeId: '142:92',
    theme: 'pink',
    text: '¿Cómo reacciona a los ruidos y luces en las pantallas?',
    subtitle: '(Para prevenir la saturación sensorial).',
    answers: [
      {
        id: 'CALM',
        label: 'Prefiere lo tranquilo: sin ruidos fuertes ni colores brillantes.',
        tone: '#8bc347',
        icon: question4Calm,
      },
      {
        id: 'GUIDED',
        label: 'Le ayuda mucho ver dibujos simples (pictogramas) y escuchar una voz suave de guía.',
        tone: '#7257a8',
        symbol: '◖',
      },
      {
        id: 'ANIMATED',
        label: 'Le gustan las animaciones divertidas.',
        tone: '#ff941c',
        icon: question4Animation,
      },
    ],
  },
  5: {
    step: 5,
    nodeId: '142:137',
    theme: 'green',
    text: 'Al realizar una actividad, ¿saber cuánto tiempo falta le pone nervioso/a?',
    subtitle: '(Para configurar el temporizador visual).',
    answers: [
      {
        id: 'STEP_BY_STEP',
        label: 'Un solo paso a la vez (si le digo 3 cosas juntas, olvida las últimas).',
        tone: '#ec6683',
        icon: question5Sequential,
      },
      {
        id: 'MODERATE',
        label: 'Tiempo moderado (más de 5 minutos).',
        tone: '#8bc347',
        symbol: '−',
      },
      {
        id: 'TIMER',
        label: 'Tiempo moderado (más de 5 minutos).',
        tone: '#7257a8',
        symbol: '⌛',
        symbolClassName: 'is-dark',
      },
    ],
  },
};

const nextRoute: Readonly<Record<QuestionStep, string | null>> = {
  1: activityRoutes.profileQuestion2,
  2: activityRoutes.profileQuestion3,
  3: activityRoutes.profileQuestion4,
  4: activityRoutes.profileQuestion5,
  5: null,
};

export function ProfileQuestionsPage({ step }: { step: QuestionStep }): React.JSX.Element {
  const question = questions[step];
  const navigate = useNavigate();
  const { status } = useAuth();
  const [selected, setSelected] = useState<string | null>(() => loadProfileAnswer(step));
  const [advancing, setAdvancing] = useState(false);

  const selectAnswer = (answer: QuestionAnswer): void => {
    if (advancing) {
      return;
    }

    setSelected(answer.id);
    setAdvancing(true);
    saveProfileAnswer(step, answer.id);

    const route = nextRoute[step];
    if (route === null) {
      markProfileQuestionsCompleted();
    }

    window.setTimeout(() => {
      if (route !== null) {
        void navigate(route);
        return;
      }

      void navigate(status === 'authenticated' ? activityRoutes.home : activityRoutes.login, {
        replace: true,
      });
    }, 220);
  };

  return (
    <main className="profile-questions-page" data-node-id={question.nodeId}>
      <section
        className={`profile-questions-card profile-question-step-${String(step)}`}
        data-theme={question.theme}
        aria-labelledby="profile-questions-title"
      >
        <header className="profile-questions-header">
          <span className="profile-questions-avatar-shell">
            <img className="profile-questions-avatar" src={avatar} alt="Avatar de Kivo" />
          </span>
          <h1 id="profile-questions-title">Responde a estas preguntas</h1>
          <div
            className="profile-questions-progress"
            aria-label={`Pregunta ${String(step)} de 7`}
          >
            <span aria-hidden="true">
              {[1, 2, 3, 4, 5, 6, 7].map((position) => (
                <i key={position} className={position <= step ? 'is-complete' : ''} />
              ))}
            </span>
            <strong>{step} de 7</strong>
          </div>
        </header>

        <div className="profile-mascot-scene" aria-hidden="true">
          <img className="profile-mascot-shadow" src={mascotShadow} alt="" />
          <img className="profile-mascot" src={mascot} alt="" />
        </div>

        <section
          className={`profile-question-panel${question.subtitle === undefined ? '' : ' has-subtitle'}`}
          aria-labelledby="profile-question-text"
        >
          <div className="profile-question-heading">
            <span className="profile-question-number" aria-hidden="true">
              <b>{step}</b>
            </span>
            <div className="profile-question-copy">
              <h2 id="profile-question-text">{question.text}</h2>
              {question.subtitle !== undefined && <p>{question.subtitle}</p>}
            </div>
          </div>

          <div
            className="profile-answer-list"
            role="group"
            aria-label={`Opciones de la pregunta ${String(step)}`}
            style={{ gridTemplateRows: `repeat(${String(question.answers.length)}, minmax(0, 1fr))` }}
          >
            {question.answers.map((answer) => (
              <button
                key={answer.id}
                className={`profile-answer${selected === answer.id ? ' is-selected' : ''}`}
                type="button"
                onClick={() => selectAnswer(answer)}
                aria-label={answer.accessibleLabel ?? answer.label}
                aria-pressed={selected === answer.id}
                disabled={advancing}
              >
                <span
                  className={`profile-answer-icon${answer.circle === undefined ? ' is-color-circle' : ''}`}
                  style={answer.circle === undefined ? { backgroundColor: answer.tone } : undefined}
                  aria-hidden="true"
                >
                  {answer.circle !== undefined && (
                    <img className="profile-answer-circle" src={answer.circle} alt="" />
                  )}
                  {answer.icon !== undefined && (
                    <img className="profile-answer-glyph" src={answer.icon} alt="" />
                  )}
                  {answer.symbol !== undefined && (
                    <b className={answer.symbolClassName}>{answer.symbol}</b>
                  )}
                </span>
                <span>{answer.label}</span>
              </button>
            ))}
          </div>
          <p className="visually-hidden" role="status" aria-live="polite">
            {selected === null ? '' : 'Respuesta guardada. Avanzando a la siguiente pantalla.'}
          </p>
        </section>
      </section>
    </main>
  );
}
