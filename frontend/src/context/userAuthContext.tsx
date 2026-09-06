import * as React from 'react';
import { useContext, useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

interface UserAuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null, token?: string) => void;
  getAuthHeaders: () => Record<string, string>;
}

interface IUserAuthProviderProps {
  children: React.ReactNode;
}

const USER_STORAGE_KEY = 'tradershub_current_user';
const TOKEN_STORAGE_KEY = 'tradershub_session_token';
const UserAuthContext = React.createContext<UserAuthContextValue | undefined>(undefined);

const UserAuthProvider: React.FunctionComponent<IUserAuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) as AuthUser : null;
  });
  const [loading, setLoading] = useState(true);

  const setUser = (nextUser: AuthUser | null, token?: string) => {
    setUserState(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      }
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    const controller = new AbortController();
    let isActive = true;

    fetch(`${API_BASE_URL}/api/auth/me`, {
      credentials: 'include',
      headers: getAuthHeaders(),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!isActive) {
          return;
        }
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = await response.json() as { user: AuthUser | null };
        setUser(data.user);
      })
      .catch((error: unknown) => {
        if (isActive && !(error instanceof DOMException && error.name === 'AbortError')) {
          setUser(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false);
        }
      });

    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  return (
    <UserAuthContext.Provider value={{ user, loading, setUser, getAuthHeaders }}>
      {children}
    </UserAuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(UserAuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside UserAuthProvider');
  }
  return context;
}

export default UserAuthProvider;
