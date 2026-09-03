import * as React from 'react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/toast';
import { useAuth } from '@/context/userAuthContext';

interface ILogInProps {}

const LogIn: React.FunctionComponent<ILogInProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    }
  }, [loading, user, location.state, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!username.trim() || !password) {
      toast.add({
        title: 'Missing login details',
        description: 'Enter your username and password to continue.',
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL ?? 'http://localhost:5000'}/api/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Unable to sign in.');
      }

      const data = await response.json() as { user: { id: string; username: string; email?: string } };
      setUser(data.user);
      toast.add({ title: 'Signed in', description: 'Welcome back.', type: 'success' });
      const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/';
      navigate(destination, { replace: true });
    } catch (error) {
      toast.add({ title: 'Sign in failed', description: error instanceof Error ? error.message : 'Unable to sign in.', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || user) {
    return <div>Checking authentication...</div>;
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-mark" aria-hidden="true">TH</div>
        <p className="login-eyebrow">TRADERSHUB</p>
        <h1 id="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to access your trading blotter.</p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input">
            <label htmlFor="username-input">Username</label>
            <input
              id="username-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              autoComplete="username"
              required
            />
          </div>

          <div className="login-input">
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
            />
          </div>

          <button className="login-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
};

export default LogIn;
