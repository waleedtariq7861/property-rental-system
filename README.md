# RentEase – Smart Property Rental & Management System

RentEase is a full-stack rental platform foundation for tenants, property
owners, and administrators. Phase 1 / Module 1 delivers the project setup,
MySQL user storage, secure registration and login, JWT authentication,
role-based authorization, frontend session management, and protected routes.

Property CRUD, rental requests, dashboards, favorites, and administrative
management workflows are outside Phase 1 and are not implemented here.

## Phase 1 features

- React/Vite client with responsive public, login, register, profile, and
  authorization-test pages
- Express API with consistent success and error responses
- MySQL connection pool configured entirely through environment variables
- Tenant and property-owner registration with server and client validation
- bcrypt password hashing; plaintext passwords are never stored
- Login with safe credential errors and JWT generation
- Bearer-token authentication with missing, invalid, and expired-token handling
- Reusable `tenant`, `owner`, and `admin` role authorization
- Protected profile, owner-test, and admin-test API endpoints
- Frontend auth context with login, registration, logout, token attachment, and
  session restoration after refresh
- Protected React routes with loading and unauthorized states
- Automated backend integration coverage and manual browser test guidance

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite, React Router DOM, Axios, Bootstrap 5 |
| Backend | Node.js, Express 5, JavaScript ES modules |
| Authentication | bcrypt, JSON Web Token |
| Database | MySQL 8.0+, MySQL2 promise API |
| Development | npm, Nodemon, Concurrently, Node test runner, Supertest |

## Folder structure

```text
project/
├── client/
│   ├── src/
│   │   ├── api/             # Axios client and auth header handling
│   │   ├── assets/          # Existing static images
│   │   ├── components/      # Shared UI and route guards
│   │   ├── context/         # Authentication state
│   │   ├── layouts/         # Shared page layout
│   │   ├── pages/           # Public and Phase 1 protected pages
│   │   ├── routes/          # React Router configuration
│   │   ├── services/        # Health and authentication API calls
│   │   └── utils/           # Validation, storage, and error helpers
│   ├── .env.example
│   └── package.json
├── server/
│   ├── config/              # Environment and MySQL configuration
│   ├── controllers/         # HTTP request handlers
│   ├── database/            # SQL schema and safe development seed
│   ├── middleware/          # JWT, role, error, and request middleware
│   ├── routes/              # API route definitions
│   ├── services/            # Database and token services
│   ├── tests/               # Backend integration tests
│   ├── utils/               # Validation and API helpers
│   ├── .env.example
│   └── package.json
├── .gitignore
├── package.json
└── README.md
```

## Prerequisites

- Node.js 20.19 or newer
- npm 10 or newer
- MySQL Server 8.0 or newer

Verify local versions:

```bash
node --version
npm --version
mysql --version
```

## Installation

From the project root:

```bash
npm run install-all
```

Equivalent manual commands:

```bash
npm install
npm install --prefix client
npm install --prefix server
```

## Environment setup

Copy the safe templates:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Configure `server/.env` locally:

```dotenv
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_local_mysql_password
DB_NAME=rentease_db
JWT_SECRET=replace_with_a_long_random_private_value
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
```

Configure `client/.env`:

```dotenv
VITE_API_URL=http://127.0.0.1:5000/api
```

The frontend API URL must use the backend's actual `PORT`. Restart Vite after
changing client environment values. Actual `.env` files are ignored by Git.
Never commit database passwords, JWT secrets, or issued JWT tokens.

## MySQL database setup

Import the existing schema and optional development fixtures:

```bash
mysql -u root -p < server/database/schema.sql
mysql -u root -p < server/database/seed.sql
```

If the local MySQL user has no password, omit `-p`.

The Phase 1 authentication table is `users`:

| Column | Purpose |
| --- | --- |
| `id` | Unsigned auto-increment primary key |
| `full_name` | User's display name, up to 120 characters |
| `email` | Unique login email |
| `phone` | Optional unique phone number retained by the existing project |
| `password_hash` | bcrypt hash; plaintext is never stored |
| `role` | `tenant`, `owner`, or `admin` |
| `account_status` | Existing account lifecycle status |
| `created_at` | Creation timestamp |
| `updated_at` | Automatically updated timestamp |

The existing schema also contains tables reserved for later modules. Phase 1
authentication code reads and writes only the `users` table.

The development seed contains fictional records and non-production placeholder
bcrypt hashes. It contains no plaintext password and should not be treated as a
source of login credentials.

### Safely create a local admin account

1. Register a new tenant or owner through the Register page or registration API.
   This ensures bcrypt creates the password hash.
2. Promote only that local test account in MySQL:

```sql
USE rentease_db;
UPDATE users
SET role = 'admin'
WHERE email = 'phase1.admin@example.test';
```

3. Log in with the password entered during registration.

Do not put an admin password, hash, database password, or JWT secret in
`seed.sql`, README, source code, shell history, screenshots, or Git.

## Running RentEase

Run both applications from the project root:

```bash
npm run dev
```

Run only the frontend:

```bash
npm run client
```

Run only the backend with Nodemon:

```bash
npm run server
```

Run the backend without Nodemon:

```bash
npm start
```

Default URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:5000`
- Health: `http://127.0.0.1:5000/api/health`

## Authentication API

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a tenant or owner |
| `POST` | `/api/auth/login` | Public | Authenticate and receive a JWT |
| `GET` | `/api/auth/profile` | Authenticated | Return the current safe user |
| `GET` | `/api/auth/owner-test` | Owner | Verify owner authorization |
| `GET` | `/api/auth/admin-test` | Admin | Verify admin authorization |
| `GET` | `/api/health` | Public | Check API and database health |

Authenticated requests use:

```http
Authorization: Bearer <jwt-token>
```

### Registration request

```json
{
  "fullName": "Amina Shah",
  "email": "amina@example.test",
  "password": "choose-a-private-password",
  "confirmPassword": "choose-a-private-password",
  "role": "tenant"
}
```

Only `tenant` and `owner` may be registered publicly.

### Login request

```json
{
  "email": "amina@example.test",
  "password": "choose-a-private-password"
}
```

### Safe login response shape

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": 7,
      "fullName": "Amina Shah",
      "email": "amina@example.test",
      "role": "tenant"
    },
    "token": "<jwt-token>",
    "tokenType": "Bearer",
    "expiresIn": "7d"
  }
}
```

The real API may include other safe existing profile fields, but never returns
the plaintext password or `password_hash`. The JWT payload contains only
`userId`, `email`, and `role`, plus standard `iat` and `exp` claims.

## Frontend routes

| Route | Access |
| --- | --- |
| `/` | Public |
| `/login` | Public; authenticated users redirect to profile |
| `/register` | Public; authenticated users redirect to profile |
| `/profile` | Authenticated users |
| `/owner-access` | Property owners |
| `/admin-access` | Administrators |
| `/unauthorized` | Public authorization message |

The frontend stores the JWT and a minimal safe user object in local storage to
restore login after refresh. It revalidates the token through the protected
profile API. Logout is client-side: it clears the local authentication record
and updates the React state; no fake backend logout endpoint is used.

## Validation and error handling

Registration validates:

- required name, email, password, confirmation, and role
- full-name length from 2 to 120 characters
- email format
- minimum password length of 8 characters
- matching password confirmation
- public roles limited to tenant and owner
- duplicate email through both lookup and database uniqueness protection

The API returns safe status codes:

- `400` invalid input
- `401` invalid credentials or missing/invalid/expired token
- `403` insufficient role
- `404` authenticated user no longer exists
- `409` duplicate account
- `500` unexpected server error with a generic client message
- `503` database unavailable through the health endpoint

## Testing

Run all backend and frontend tests from the root:

```bash
npm test
```

Run an individual suite:

```bash
npm run test:server
npm run test:client
```

Backend tests require the local MySQL server and imported `users` table.
Temporary test users are removed after the suite. Frontend component tests use
Vitest, Testing Library, and a browser-like test DOM; API service calls are
mocked so validation, redirects, auth state, and logout remain deterministic.

Build the frontend:

```bash
npm run build
```

There is currently no separate lint script. Automated component tests do not
replace responsive and console checks in a real browser. For manual browser
verification:

1. Start MySQL and run `npm run dev`.
2. Open `/register` and verify required, email, password, and confirmation errors.
3. Register a unique tenant and confirm the redirect and success message.
4. Log in and confirm the protected profile appears.
5. Refresh `/profile` and confirm the authenticated session is restored.
6. Open `/owner-access` as a tenant and confirm the unauthorized page.
7. Log out and confirm `/profile` redirects to `/login`.
8. Repeat with an owner and verify `/owner-access`.
9. Check mobile, tablet, and desktop widths.
10. Confirm the browser console has no relevant application errors.

## Common troubleshooting

### Database unavailable

- Confirm MySQL is running.
- Verify the `DB_*` values in `server/.env`.
- Import `schema.sql`.
- Confirm the selected database user can access `rentease_db`.

### CORS error

Ensure `CLIENT_URL` contains the exact browser origin, including protocol and
port. The provided example supports both `localhost` and `127.0.0.1`.

### Authentication requests reach the wrong port

Make `VITE_API_URL` match the backend `PORT`, then restart Vite.

### Missing JWT environment values

Set both `JWT_SECRET` and `JWT_EXPIRES_IN` in the ignored `server/.env`. The API
will not start without them.

## Phase boundary

Phase 1 is limited to setup and authentication. The existing placeholder
property page and pre-existing future database tables remain untouched, but no
property listing backend, rental request flow, dashboard, management interface,
or other Phase 2/3 feature is implemented by this module.
