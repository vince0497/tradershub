import * as React from 'react';
import { useContext, useEffect, useState } from 'react';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

interface UserAuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
}

interface IUserAuthProviderProps {
  children: React.ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
const USER_STORAGE_KEY = 'tradershub_current_user';
const UserAuthContext = React.createContext<UserAuthContextValue | undefined>(undefined);

const UserAuthProvider: React.FunctionComponent<IUserAuthProviderProps> = ({ children }) => {
  const [user, setUserState] = useState<AuthUser | null>(() => {
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) as AuthUser : null;
  });
  const [loading, setLoading] = useState(true);

  const setUser = (nextUser: AuthUser | null) => {
    setUserState(nextUser);
    if (nextUser) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) {
          setUser(null);
          return;
        }
        const data = await response.json() as { user: AuthUser | null };
        setUser(data.user);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserAuthContext.Provider value={{ user, loading, setUser }}>
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
