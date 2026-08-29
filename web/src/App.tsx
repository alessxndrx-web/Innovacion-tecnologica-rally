import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { CompletionPage } from './pages/CompletionPage';
import { HomePage } from './pages/HomePage';
import { InstructionPage } from './pages/InstructionPage';
import { LoginPage } from './pages/LoginPage';
import { MatchingPage } from './pages/MatchingPage';
import { MiniChallengePage } from './pages/MiniChallengePage';
import { QuickMissionsPage } from './pages/QuickMissionsPage';
import { RegisterPage } from './pages/RegisterPage';
import { RewardsPage } from './pages/RewardsPage';
import { SequenceVisualPage } from './pages/SequenceVisualPage';
import { TeaMenuPage } from './pages/TeaMenuPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { activityRoutes } from './routes/activity-flow';

export function App(): React.JSX.Element {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path={activityRoutes.home}
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={activityRoutes.instruction}
            element={
              <ProtectedRoute>
                <InstructionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={activityRoutes.sequence}
            element={
              <ProtectedRoute>
                <SequenceVisualPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={activityRoutes.matching}
            element={
              <ProtectedRoute>
                <MatchingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={activityRoutes.completion}
            element={
              <ProtectedRoute>
                <CompletionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={activityRoutes.tdahMenu}
            element={
              <ProtectedRoute>
                <TeaMenuPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={activityRoutes.miniChallenge}
            element={
              <ProtectedRoute>
                <MiniChallengePage />
              </ProtectedRoute>
            }
          />
          <Route
            path={activityRoutes.rewards}
            element={
              <ProtectedRoute>
                <RewardsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path={activityRoutes.quickMissions}
            element={
              <ProtectedRoute>
                <QuickMissionsPage />
              </ProtectedRoute>
            }
          />
          <Route path="/actividades/tea" element={<Navigate to={activityRoutes.home} replace />} />
          <Route
            path="/actividades/clasificacion"
            element={<Navigate to={activityRoutes.home} replace />}
          />
          <Route path="/preguntas/aviso" element={<Navigate to={activityRoutes.home} replace />} />
          <Route path="/" element={<Navigate to={activityRoutes.home} replace />} />
          <Route path="*" element={<Navigate to={activityRoutes.home} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
