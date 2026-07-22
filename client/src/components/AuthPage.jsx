function AuthPage({
  asideDescription,
  asideTitle,
  children,
  description,
  eyebrow,
  footer,
  highlights,
  icon,
  title,
}) {
  return (
    <section className="auth-section">
      <div className="container auth-container">
        <div className="auth-shell">
          <aside className="auth-aside">
            <span className="auth-aside-mark" aria-hidden="true">
              <i className="bi bi-buildings-fill" />
            </span>
            <p className="auth-aside-kicker mb-3">RentEase</p>
            <h2>{asideTitle}</h2>
            <p className="auth-aside-copy mb-0">{asideDescription}</p>
            <ul className="auth-highlights list-unstyled mb-0">
              {highlights.map((highlight) => (
                <li key={highlight}>
                  <i className="bi bi-check-circle-fill" aria-hidden="true" />
                  <span>{highlight}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="auth-form-panel">
            <div className="auth-card">
              <div className="auth-heading">
                <span className="auth-icon" aria-hidden="true">
                  <i className={`bi ${icon}`} />
                </span>
                <div>
                  <p className="auth-eyebrow mb-1">{eyebrow}</p>
                  <h1 className="h2 mb-2">{title}</h1>
                  <p className="text-secondary mb-0">{description}</p>
                </div>
              </div>

              <div className="auth-phase-note" role="note">
                <i className="bi bi-info-circle" aria-hidden="true" />
                <span>
                  Phase 1 frontend preview. Your details are validated in the browser
                  and are not sent to a server.
                </span>
              </div>

              {children}
              <div className="auth-footer">{footer}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AuthPage;
