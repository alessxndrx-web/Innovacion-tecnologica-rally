import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { ClassificationPage } from './pages/ClassificationPage';
import { ColorsShapesPage } from './pages/ColorsShapesPage';
import { CompletionPage } from './pages/CompletionPage';
import { HomePage } from './pages/HomePage';
import { InstructionPage } from './pages/InstructionPage';
import { LoginPage } from './pages/LoginPage';
import { MatchingPage } from './pages/MatchingPage';
import { MiniChallengePage } from './pages/MiniChallengePage';
import { ProfileQuestionsPage } from './pages/ProfileQuestionsPage';
import { ProfileThanksPage } from './pages/ProfileThanksPage';
import { QuestionNoticePage } from './pages/QuestionNoticePage';
import { QuickMissionsPage } from './pages/QuickMissionsPage';
import { RegisterPage } from './pages/RegisterPage';
import { RewardsPage } from './pages/RewardsPage';
import { RoutinePage } from './pages/RoutinePage';
import { SequenceVisualPage } from './pages/SequenceVisualPage';
import { TdahMenuPage } from './pages/TdahMenuPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { activityRoutes } from './routes/activity-flow';

/**
 * Toda pantalla que hay detrás de la sesión. Se declaran en una tabla porque el
 * bloque `<Route>` repetido escondía el problema real: había pantallas escritas
 * y sin ruta —clasificación y el aviso de preguntas— que solo se alcanzaban
 * editando el código.
 */
const protectedScreens: ReadonlyArray<{ path: string; element: React.JSX.Element }> = [
  { path: activityRoutes.home, element: <HomePage /> },
  { path: activityRoutes.instruction, element: <InstructionPage /> },
  { path: activityRoutes.sequence, element: <SequenceVisualPage /> },
  { path: activityRoutes.classification, element: <ClassificationPage /> },
  { path: activityRoutes.matching, element: <MatchingPage /> },
  { path: activityRoutes.routine, element: <RoutinePage /> },
  { path: activityRoutes.colors, element: <ColorsShapesPage /> },
  { path: activityRoutes.completion, element: <CompletionPage /> },
  { path: activityRoutes.tdahMenu, element: <TdahMenuPage /> },
  { path: activityRoutes.miniChallenge, element: <MiniChallengePage /> },
  { path: activityRoutes.rewards, element: <RewardsPage /> },
  { path: activityRoutes.quickMissions, element: <QuickMissionsPage /> },
];

const profileQuestionScreens = [
  { path: activityRoutes.profileQuestions, step: 1 },
  { path: activityRoutes.profileQuestion2, step: 2 },
  { path: activityRoutes.profileQuestion3, step: 3 },
  { path: activityRoutes.profileQuestion4, step: 4 },
  { path: activityRoutes.profileQuestion5, step: 5 },
  { path: activityRoutes.profileQuestion6, step: 6 },
  { path: activityRoutes.profileQuestion7, step: 7 },
] as const;

/** Direcciones antiguas que ya se compartieron: redirigen en vez de dar 404. */
const routeAliases: ReadonlyArray<{ from: string; to: string }> = [
  { from: '/actividades/tea', to: activityRoutes.home },
  { from: '/', to: activityRoutes.questionNotice },
];

export function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path={activityRoutes.login} element={<LoginPage />} />
          <Route path={activityRoutes.register} element={<RegisterPage />} />
          <Route path={activityRoutes.questionNotice} element={<QuestionNoticePage />} />
          <Route path={activityRoutes.profileThanks} element={<ProfileThanksPage />} />

          {profileQuestionScreens.map((screen) => (
            <Route
              key={screen.path}
              path={screen.path}
              element={
                /*
                 * La `key` es lo que hace avanzar el cuestionario. Todas las
                 * preguntas son el mismo componente en la misma posicion del
                 * arbol, asi que React reutilizaba la instancia al cambiar de
                 * ruta y conservaba su estado: `advancing` seguia en `true`
                 * desde la pregunta anterior y llegaba con las respuestas
                 * deshabilitadas. Con la `key` cada pregunta es una instancia
                 * nueva y empieza limpia.
                 */
                <ProfileQuestionsPage key={screen.path} step={screen.step} />
              }
            />
          ))}

          {protectedScreens.map((screen) => (
            <Route
              key={screen.path}
              path={screen.path}
              element={<ProtectedRoute>{screen.element}</ProtectedRoute>}
            />
          ))}

          {routeAliases.map((alias) => (
            <Route
              key={alias.from}
              path={alias.from}
              element={<Navigate to={alias.to} replace />}
            />
          ))}

          <Route path="*" element={<Navigate to={activityRoutes.questionNotice} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
