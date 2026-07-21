function Contact() {
  return (
    <>
      <header className="page-hero page-hero-compact">
        <div className="container text-center">
          <span className="eyebrow mb-3">Contact</span>
          <h1 className="display-4 fw-bold text-white">Let’s stay connected.</h1>
          <p className="page-hero-copy mx-auto mb-0">
            Contact workflows will be connected to the RentEase API in a future phase.
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
                <h2 className="h3">Contact module foundation</h2>
                <p className="text-secondary mb-4">
                  The database is ready to store contact messages. Form submission
                  will be enabled alongside validation and administration tools in
                  a later project phase.
                </p>
                <span className="badge text-bg-light border px-3 py-2">
                  <i className="bi bi-tools me-2" aria-hidden="true" />
                  Planned for a future phase
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Contact;
