# RentEase – Smart Property Rental & Management System

RentEase is a full-stack property rental platform designed to bring tenants,
property owners, and administrators into one clear workflow. The project uses a
React/Vite client, an Express API, and a normalized MySQL database.

## Phase 1 status

Phase 1 establishes the development foundation only. It includes a responsive
public interface, client-side routing, backend health reporting, database
connectivity, SQL schema and seed files, environment templates, and root
development scripts.

Authentication, dashboards, property CRUD, favorites, rental-request actions,
file upload workflows, and administration are intentionally not implemented in
this phase.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, JavaScript, React Router DOM, Bootstrap 5, Bootstrap Icons, Axios |
| Backend | Node.js, Express, JavaScript ES modules, MySQL2, dotenv, CORS |
| Database | MySQL 8.0+ |
| Development | npm, Nodemon, Concurrently |

## Current features

- Responsive Home, About, Contact, Login, Register, and Not Found pages
- Shared navigation, footer, and loading components
- React Router navigation with a common page layout
- Phase 1 login and registration design previews with submission disabled
- Reusable Axios client configured through `VITE_API_URL`
- Homepage API/MySQL health indicator with loading, failure, and retry states
- Express middleware for JSON, URL-encoded input, CORS, development logging,
  static uploads, 404 responses, and global error handling
- MySQL promise-based connection pool
- Normalized schema for users, properties, images, favorites, rental requests,
  and contact messages
- Safe development seed data with bcrypt-formatted password hashes only

## Folder structure

```text
project/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── api/                  # Shared Axios configuration
│   │   ├── assets/               # Frontend images and other static imports
│   │   ├── components/           # Reusable UI components
│   │   ├── layouts/              # Shared page layouts
│   │   ├── pages/                # Route-level page components
│   │   ├── routes/               # React Router configuration
│   │   ├── services/             # API-facing client services
│   │   ├── utils/                # Small client helpers
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── config/                   # Environment and MySQL pool configuration
│   ├── controllers/              # HTTP request handlers
│   ├── database/                 # Schema and development seed SQL
│   ├── middleware/               # Express request/response middleware
│   ├── routes/                   # API route definitions
│   ├── services/                 # Backend business/infrastructure services
│   ├── uploads/                  # Future runtime uploads (ignored by Git)
│   ├── utils/                    # Shared backend helpers
│   ├── app.js                    # Express application setup
│   ├── server.js                 # Network server and graceful shutdown
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json                  # Root development commands
└── README.md
```

Feature-specific models are deliberately deferred until their corresponding
Phase 2 modules exist, which avoids empty abstractions in Phase 1.

## Prerequisites

Install the following before starting:

- **Node.js 20.19 or newer** (Node.js 22 LTS is also suitable)
- **npm 10 or newer**
- **MySQL Server 8.0 or newer**
- A terminal opened in the project root

Check the installed versions:

```bash
node --version
npm --version
mysql --version
```

## Installation

From the project root, install root, client, and server packages together:

```bash
npm run install-all
```

The equivalent manual commands are:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## Environment setup

Create local environment files from the committed examples:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Update `server/.env` with the credentials for the local MySQL server:

```dotenv
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_mysql_password
DB_NAME=rentease_db
JWT_SECRET=replace_with_a_long_secure_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

The JWT values are reserved for Phase 2 and are not used by the Phase 1 API.
Use a long, private value now if a local `.env` is created. Never commit `.env`
files.

The client setting should normally remain:

```dotenv
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after changing a client environment value.

## Database setup

The schema creates `rentease_db` automatically. From the project root, run:

```bash
mysql -u root -p < server/database/schema.sql
mysql -u root -p < server/database/seed.sql
```

If the MySQL account has no password, omit `-p`:

```bash
mysql -u root < server/database/schema.sql
mysql -u root < server/database/seed.sql
```

The seed is intended for local development. It creates one administrator, two
owners, three tenants, and five properties. Seed accounts contain a pre-generated
bcrypt hash, but no plaintext seed password is provided and Phase 1 has no login
endpoint. Password creation and reset will be implemented securely in Phase 2.

To confirm the import:

```bash
mysql -u root -p -e "USE rentease_db; SHOW TABLES; SELECT COUNT(*) AS users FROM users; SELECT COUNT(*) AS properties FROM properties;"
```

## Running the application

Run the frontend and backend together from the root:

```bash
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health endpoint: `http://localhost:5000/api/health`

Run only the frontend:

```bash
npm run client
```

Run only the backend:

```bash
npm run server
```

For a production frontend build:

```bash
npm run build
```

To run the backend without Nodemon:

```bash
npm start
```

## Health endpoint

Request the endpoint in a browser or terminal:

```bash
curl http://localhost:5000/api/health
```

With MySQL available, it returns HTTP `200`:

```json
{
  "success": true,
  "message": "RentEase API is running",
  "data": {
    "database": "connected"
  }
}
```

If the API is running but MySQL cannot be reached, it returns HTTP `503` with a
safe message and `"database": "unavailable"`. This is expected until MySQL and
`server/.env` are configured.

## Common troubleshooting

### The health endpoint reports that the database is unavailable

- Confirm the MySQL service is running.
- Confirm `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in
  `server/.env`.
- Import `schema.sql` before starting the API.
- Confirm the selected MySQL user can access `rentease_db`.

### The browser reports a CORS error

Confirm `CLIENT_URL` exactly matches the Vite origin, including the port. Multiple
allowed origins can be supplied as a comma-separated list.

### Port 5000 or 5173 is already in use

Stop the other process, or update `PORT` for the API. If the API port changes,
also update `VITE_API_URL` and restart both processes.

### Environment changes do not appear

Stop and restart the affected development server. Vite and dotenv read their
environment at startup.

### Packages or imports cannot be resolved

Run `npm run install-all` from the project root. If a previous installation was
interrupted, rerun the same command and review the first reported error.

## Planned future modules

- Secure registration, login, JWT authentication, and role authorization
- Tenant, owner, and administrator dashboards
- Property creation, editing, approval, search, filtering, and image uploads
- Tenant favorites
- Rental request submission, review, and status tracking
- Contact-message submission and administration
- Input validation, security hardening, automated tests, and deployment setup

These modules belong to later phases and are not partially implemented in the
Phase 1 codebase.
