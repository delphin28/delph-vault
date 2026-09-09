import './AuthPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../../api/authApi';

function AuthPage({ initialMode = 'LOGIN' }) {
  const [mode, setMode] = useState(initialMode.toUpperCase());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRegistering = mode === 'REGISTER';
  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (isRegistering) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    try {
      const result = await login(formData.get('email'), formData.get('password'));
      localStorage.setItem('access_token', result.access_token);
      navigate('/dashboard');
    } catch {
      setError('Unable to sign in with those credentials.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="login-eyebrow">Private workspace</p>
        <h1 className="login-title" id="login-title">Delph Vault</h1>
        <p className="login-description">
          {isRegistering
            ? 'Create your secure vault account.'
            : 'Keep your credentials organized, protected, and close at hand.'}
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          {isRegistering && (
            <>
              <label htmlFor="username">
                Username <span aria-hidden="true">*</span>
              </label>
              <input type="text" id="username" name="username" autoComplete="username" required />
            </>
          )}

          <label htmlFor="email">
            Email <span aria-hidden="true">*</span>
          </label>
          <input type="email" id="email" name="email" autoComplete="email" required />

          <label htmlFor="password">
            Master password <span aria-hidden="true">*</span>
          </label>
          <input type="password" id="password" name="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} required />

          {isRegistering && (
            <>
              <label htmlFor="confirm-password">
                Confirm password <span aria-hidden="true">*</span>
              </label>
              <input type="password" id="confirm-password" name="confirm-password" autoComplete="new-password" required />
            </>
          )}

          <button type="submit" className="login-submit">
            {isSubmitting ? 'Signing in...' : isRegistering ? 'Create account' : 'Unlock vault'}
          </button>
        </form>

        {error && <p role="alert" className="auth-error">{error}</p>}

        <p className="auth-switch">
          {isRegistering ? 'Already have an account?' : 'Need an account?'}
          <button type="button" className="auth-switch-button" onClick={() => setMode(isRegistering ? 'LOGIN' : 'REGISTER')}>
            {isRegistering ? 'Sign in' : 'Register'}
          </button>
        </p>
    </section>
    </main>
  );
}

export default AuthPage;
