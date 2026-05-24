import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authService } from '../services/authService';
import { mapAuthUser } from '../utils/apiMappers';
import type { AuthUser } from '../types';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('accessToken'),
  );
  const [loading, setLoading] = useState(() => !!localStorage.getItem('accessToken'));

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }
    authService
      .me()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.clear();
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authService.login(email, password);
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setAccessToken(data.accessToken);
    const authUser = mapAuthUser(data);
    setUser(authUser);
    return authUser;
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    const token = localStorage.getItem('accessToken');
    if (refreshToken) {
      await authService.logout(refreshToken, token).catch(() => {});
    }
    localStorage.clear();
    setAccessToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        isAuthenticated: !!user,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
