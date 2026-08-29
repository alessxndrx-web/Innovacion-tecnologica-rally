import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

/**
 * Mientras se confirma la sesión contra el servidor no se decide nada: navegar
 * al login en ese momento expulsaría a quien sí tiene sesión válida cada vez
 * que recarga la página.
 */
export function ProtectedRoute({ children }: { children: ReactNode }): React.JSX.Element {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <main className="app-layout">
        <p className="loading-text" role="status">
          Comprobando la sesión…
        </p>
      </main>
    );
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
