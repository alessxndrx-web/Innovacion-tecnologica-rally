import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  type RegisterInput,
} from '../api/client';
import { clearSession, loadSession, type PublicUser } from './session-storage';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';

export interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  // Al arrancar no basta con que haya una sesión guardada: puede estar caducada
  // o revocada desde otro dispositivo. Se confirma contra el servidor, lo que
  // de paso dispara la renovación automática si el token de acceso ya venció.
  useEffect(() => {
    let cancelled = false;

    if (loadSession() === null) {
      setStatus('anonymous');
      return;
    }

    void (async () => {
      try {
        const current = await fetchCurrentUser();
        if (!cancelled) {
          setUser(current);
          setStatus('authenticated');
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
          setStatus('anonymous');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const session = await loginRequest(email, password);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  // Registrarse deja la sesión iniciada: el backend devuelve la misma sesión
  // que `login`, así que no hay un segundo paso de acceso.
  const signUp = useCallback(async (input: RegisterInput) => {
    const session = await registerRequest(input);
    setUser(session.user);
    setStatus('authenticated');
  }, []);

  const signOut = useCallback(async () => {
    await logoutRequest();
    setUser(null);
    setStatus('anonymous');
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, status, signIn, signUp, signOut }),
    [user, status, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
