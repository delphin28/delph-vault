import './AuthPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register, resetPassword as resetPasswordAPI, checkMfa } from '../../../api/authApi';

function AuthPage({ initialMode = 'LOGIN' }) {
  const [mode, setMode] = useState(initialMode.toUpperCase());
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMethod, setMfaMethod] = useState('otp'); // 'otp' or 'backup_code'
  const [loginCredentials, setLoginCredentials] = useState(null);
  const [resetEmail, setResetEmail] = useState(''); // Store email for password reset flow
  const [newPassword, setNewPassword] = useState(''); // Store new password for password reset flow
  const navigate = useNavigate();

  const isForgotPasswordMode = mode === 'FORGOT_PASSWORD';
  const isRegistering = mode === 'REGISTER';

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (isRegistering) {
      const formData = new FormData(event.currentTarget);
      const password = formData.get('password');
      if (password !== formData.get('confirm-password')) {
        setError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        await register(formData.get('username'), formData.get('email'), password);
        setMode('LOGIN');
        setError('Account created. Sign in to unlock your vault.');
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to create your account.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (isForgotPasswordMode) {
      return handlePasswordReset(event);
    }

    if (mfaRequired) {
      const formData = new FormData(event.currentTarget);
      setIsSubmitting(true);
      try {
        await login(
          loginCredentials.email,
          loginCredentials.password,
          mfaMethod === 'otp' ? formData.get('otp') : null,
          mfaMethod === 'backup_code' ? formData.get('backup-code') : null,
        );
        navigate('/dashboard');
      } catch (err) {
        setError(err.response?.data?.detail || 'Unable to verify your MFA code.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Handle login
    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);

    try {
      await login(formData.get('email'), formData.get('password'));
      // Token is set as HTTP-only cookie by backend
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.detail === 'MFA_REQUIRED') {
        setLoginCredentials({ email: formData.get('email'), password: formData.get('password') });
        setMfaRequired(true);
        setMfaMethod('otp');
      } else {
        setError(err.response?.data?.detail || 'Unable to sign in with those credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handlePasswordReset(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    
    // If MFA is already required, submit with MFA using stored email and password
    if (mfaRequired) {
      setIsSubmitting(true);
      try {
        const otp = mfaMethod === 'otp' ? formData.get('otp') : null;
        const backupCode = mfaMethod === 'backup_code' ? formData.get('backup-code') : null;

        await resetPasswordAPI(resetEmail, newPassword, otp, backupCode);
        setError('');
        setMfaRequired(false);
        setResetEmail('');
        setNewPassword('');
        alert('Password reset successfully! Please log in with your new password.');
        setMode('LOGIN');
      } catch (err) {
        setError(err.response?.data?.detail || 'Failed to reset password');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // First time: check if MFA is enabled
    const email = formData.get('email');
    const password = formData.get('password');

    if (password !== formData.get('confirm-password')) {
      setError('Passwords do not match.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const mfaStatus = await checkMfa(email);

      if (mfaStatus.mfa_enabled) {
        // MFA enabled: store credentials and proceed with MFA verification
        setResetEmail(email);
        setNewPassword(password);
        setMfaRequired(true);
        setError('');
      } else {
        // MFA is disabled - cannot reset password
        setError('Multi-factor authentication is required to reset your password. Please enable MFA in your account settings first.');
        setMfaRequired(false);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'User not found');
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
          {!isRegistering && !isForgotPasswordMode
            ? 'Create your secure vault account.'
            : isRegistering
            ? 'Keep your credentials organized, protected, and close at hand.'
            : 'Enter your email to reset your master password.'}
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

          {!mfaRequired && (
            <>
              <label htmlFor="email">
                Email <span aria-hidden="true">*</span>
              </label>
              <input type="email" id="email" name="email" autoComplete="email" required />
            </>
          )}

          {!mfaRequired && (
            <>
              <label htmlFor="password">
                {isRegistering ? 'Master' : isForgotPasswordMode ? 'New master' : 'Master'} password <span aria-hidden="true">*</span>
              </label>
              <input type="password" id="password" name="password" autoComplete={isRegistering ? 'new-password' : 'current-password'} required />
            </>
          )}

          {!mfaRequired && (isRegistering || isForgotPasswordMode) && (
            <>
              <label htmlFor="confirm-password">
                Confirm password <span aria-hidden="true">*</span>
              </label>
              <input type="password" id="confirm-password" name="confirm-password" autoComplete="new-password" required />
            </>
          )}

          {mfaRequired && (
            <>
              <p className="mfa-notice">Multi-factor authentication is required to {isForgotPasswordMode ? 'reset your password' : 'sign in'}.</p>
              <div className="mfa-method-selector">
                <label>
                  <input
                    type="radio"
                    name="mfa-method"
                    value="otp"
                    checked={mfaMethod === 'otp'}
                    onChange={() => setMfaMethod('otp')}
                  />
                  Authenticator App
                </label>
                <label>
                  <input
                    type="radio"
                    name="mfa-method"
                    value="backup_code"
                    checked={mfaMethod === 'backup_code'}
                    onChange={() => setMfaMethod('backup_code')}
                  />
                  Backup Code
                </label>
              </div>

              {mfaMethod === 'otp' && (
                <>
                  <label htmlFor="otp">
                    Authenticator Code <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="otp"
                    name="otp"
                    placeholder="000000"
                    autoComplete="off"
                    inputMode="numeric"
                    maxLength="6"
                    required
                  />
                </>
              )}

              {mfaMethod === 'backup_code' && (
                <>
                  <label htmlFor="backup-code">
                    Backup Code <span aria-hidden="true">*</span>
                  </label>
                  <input
                    type="text"
                    id="backup-code"
                    name="backup-code"
                    placeholder="XXXX-XXXX"
                    autoComplete="off"
                    required
                  />
                </>
              )}
            </>
          )}

          <button type="submit" className="login-submit" disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : isForgotPasswordMode && !mfaRequired ? 'Check MFA' : isForgotPasswordMode && mfaRequired ? 'Reset Password' : isRegistering ? 'Create account' : 'Unlock vault'}
          </button>
        </form>

        {error && <p role="alert" className="auth-error">{error}</p>}

        {!isForgotPasswordMode && !mfaRequired && (
          <p className="auth-switch">
            {isRegistering ? 'Already have an account?' : 'Need an account?'}
            <button type="button" className="auth-switch-button" onClick={() => setMode(isRegistering ? 'LOGIN' : 'REGISTER')}>
              {isRegistering ? 'Sign in' : 'Register'}
            </button>
          </p>
        )}

        {!mfaRequired && (
          <p className="auth-switch">
            {isForgotPasswordMode ? 'Back to login' : 'Forgot password?'}
            <button type="button" className="auth-switch-button" onClick={() => setMode(isForgotPasswordMode ? 'LOGIN' : 'FORGOT_PASSWORD')}>
              {isForgotPasswordMode ? 'Sign in' : 'Reset password'}
            </button>
          </p>
        )}

        {mfaRequired && (
          <p className="auth-switch">
            <button type="button" className="auth-switch-button" onClick={() => { setMfaRequired(false); setLoginCredentials(null); setError(''); }}>
              Back
            </button>
          </p>
        )}
      </section>
    </main>
  );
}

export default AuthPage;
