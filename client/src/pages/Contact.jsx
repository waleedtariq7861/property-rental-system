function Contact() {
  return (
    <>
      <header className="page-hero page-hero-compact">
        <div className="container text-center">
          <span className="eyebrow mb-3">Contact</span>
          <h1 className="display-4 fw-bold text-white">Let’s stay connected.</h1>
          <p className="page-hero-copy mx-auto mb-0">
            Reach out directly using the contact details below.
          </p>
        </div>
      </header>
      <section className="section-space">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="content-card text-center">
                <div className="feature-icon mx-auto">
                  <i className="bi bi-chat-square-text" aria-hidden="true" />
                </div>
                <h2 className="h3">Direct contact details</h2>
                <p className="text-secondary mb-4">
                  Use these details for project communication and support.
                </p>
                <div className="d-grid gap-3 justify-content-center">
                  <a className="btn btn-brand btn-lg" href="mailto:waleedtariq7861@gamil.com">
                    <i className="bi bi-envelope me-2" aria-hidden="true" />
                    waleedtariq7861@gamil.com
                  </a>
                  <a className="btn btn-outline-brand btn-lg" href="tel:+923480577644">
                    <i className="bi bi-telephone me-2" aria-hidden="true" />
                    03480577644
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;
