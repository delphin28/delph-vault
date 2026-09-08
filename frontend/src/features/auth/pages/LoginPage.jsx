import './LoginPage.css';

function LoginPage({ backendStatus }) {
  return (
    <main className="login-page">
      <section className="login-panel" aria-labelledby="login-title">
        <p className="login-eyebrow">Private workspace</p>
        <h1 className="login-title" id="login-title">Delph Vault</h1>
        <p className="login-description">
          Keep your credentials organized, protected, and close at hand.
        </p>

        <form className="login-form">
          <label htmlFor="username">
            Username <span aria-hidden="true">*</span>
          </label>
          <input type="text" id="username" name="username" autoComplete="username" required aria-required="true" />

          <label htmlFor="password">
            Master password <span aria-hidden="true">*</span>
          </label>
          <input type="password" id="password" name="password" autoComplete="current-password" required aria-required="true" />

          <button className="login-submit" type="submit" onClick={() => {}}>
            Unlock vault
          </button>
          <p className="login-create-account">
            Don't have an account? <a href="/register">Create one</a>
          </p>
        </form>

        <span className="login-status" data-status={backendStatus}>
          Backend: {backendStatus || 'Checking...'}
        </span>
      </section>
    </main>
  );
}

export default LoginPage;
