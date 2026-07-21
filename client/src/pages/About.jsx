const principles = [
  ['bi-person-check', 'People first', 'Straightforward experiences for tenants, owners, and administrators.'],
  ['bi-diagram-3', 'Ready to scale', 'A clean full-stack structure that can grow feature by feature.'],
  ['bi-code-square', 'Easy to maintain', 'Readable JavaScript and focused modules suitable for a student team.'],
];

function About() {
  return (
    <>
      <header className="page-hero">
        <div className="container text-center">
          <span className="eyebrow mb-3">About the project</span>
          <h1 className="display-4 fw-bold text-white">Renting should feel manageable.</h1>
          <p className="page-hero-copy mx-auto mb-0">
            RentEase is being built to make property discovery and rental
            management clearer for everyone involved.
          </p>
        </div>
      </header>
      <section className="section-space">
        <div className="container">
          <div className="row align-items-center gy-5">
            <div className="col-lg-6">
              <span className="section-label">Our direction</span>
              <h2 className="display-6 fw-bold mt-2 mb-3">A professional platform with a practical core</h2>
              <p className="section-intro">
                The project begins with dependable architecture and a simple
                interface. Future phases will add secure accounts, property
                workflows, favorites, rental requests, and administration.
              </p>
              <p className="mb-0 text-secondary">
                Phase 1 intentionally focuses on the shared foundation those
                modules need, keeping later development organized and testable.
              </p>
            </div>
            <div className="col-lg-5 offset-lg-1">
              <div className="principle-list">
                {principles.map(([icon, title, description]) => (
                  <div className="principle-item" key={title}>
                    <i className={`bi ${icon}`} aria-hidden="true" />
                    <div>
                      <h3 className="h5 mb-1">{title}</h3>
                      <p className="mb-0">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
