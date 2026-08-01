import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getAuthenticatedProfile,
  loginAccount,
  registerAccount,
} from '../services/authService.js';
import {
  AUTH_INVALID_EVENT,
  clearStoredAuth,
  getStoredAuth,
  saveStoredAuth,
} from '../utils/authStorage.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => getStoredAuth());
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const storedAuth = getStoredAuth();

    if (!storedAuth) {
      setAuth(null);
      setIsRestoring(false);
      return () => controller.abort();
    }

    async function restoreAuthentication() {
      try {
        const result = await getAuthenticatedProfile({
          signal: controller.signal,
        });
        const restoredAuth = {
          token: storedAuth.token,
          user: result.data.user,
        };

        saveStoredAuth(restoredAuth);
        setAuth(restoredAuth);
      } catch (error) {
        if (error.code === 'ERR_CANCELED') {
          return;
        }

        clearStoredAuth();
        setAuth(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsRestoring(false);
        }
      }
    }

    restoreAuthentication();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    function handleInvalidAuthentication() {
      clearStoredAuth();
      setAuth(null);
      setIsRestoring(false);
    }

    window.addEventListener(AUTH_INVALID_EVENT, handleInvalidAuthentication);
    return () => {
      window.removeEventListener(AUTH_INVALID_EVENT, handleInvalidAuthentication);
    };
  }, []);

  const register = useCallback((payload) => registerAccount(payload), []);

  const login = useCallback(async (credentials) => {
    const result = await loginAccount(credentials);
    const nextAuth = {
      token: result.data.token,
      user: result.data.user,
    };

    saveStoredAuth(nextAuth);
    setAuth(nextAuth);
    return result;
  }, []);

  const logout = useCallback(() => {
    clearStoredAuth();
    setAuth(null);
  }, []);

  const value = useMemo(
    () => ({
      currentUser: auth?.user || null,
      isAuthenticated: Boolean(auth?.token && auth?.user),
      isRestoring,
      login,
      logout,
      register,
      token: auth?.token || null,
    }),
    [auth, isRestoring, login, logout, register],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
