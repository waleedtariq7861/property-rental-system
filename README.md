# RentEase – Smart Property Rental & Management System

RentEase is a full-stack property rental project for tenants, property owners,
and administrators. Phase 1 focuses on project setup and secure authentication.

## Phase 1 Features

- Responsive React frontend
- User registration for tenants and property owners
- Login with JWT authentication
- Password hashing with bcrypt
- Protected profile route
- Owner and admin role checks
- Login state restoration after page refresh
- Client-side logout
- MySQL database integration
- Backend and frontend tests

Property management, rental requests, and dashboards will be developed in later
phases.

## Technology Stack

- **Frontend:** React, Vite, React Router, Axios, Bootstrap
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT and bcrypt

## Project Structure

```text
project/
├── client/                 # React frontend
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── routes/
│       ├── services/
│       └── utils/
├── server/                 # Express backend
│   ├── config/
│   ├── controllers/
│   ├── database/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── tests/
├── package.json
└── README.md
```

## Installation

Requirements:

- Node.js 20.19 or newer
- npm 10 or newer
- MySQL 8.0 or newer

Install all packages from the project root:

```bash
npm run install-all
```

## Environment Setup

Create local environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Server environment variables:

```dotenv
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=rentease_db
JWT_SECRET=your_long_private_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173
```

Client environment variable:

```dotenv
VITE_API_URL=http://127.0.0.1:5000/api
```

Actual `.env` files are ignored by Git and should never be committed.

## Database Setup

Import the schema:

```bash
mysql -u root -p < server/database/schema.sql
```

Optional development data:

```bash
mysql -u root -p < server/database/seed.sql
```

The `users` table stores the user's name, email, bcrypt password hash, role, and
timestamps. Supported roles are `tenant`, `owner`, and `admin`.

Public registration only allows tenant and owner accounts. To create a local
test admin, register normally and then update that account's role in MySQL:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.test';
```

## Running the Project

Run frontend and backend together:

```bash
npm run dev
```

Run them separately:

```bash
npm run client
npm run server
```

Default URLs:

- Frontend: `http://127.0.0.1:5173`
- Backend: `http://127.0.0.1:5000`
- Health check: `http://127.0.0.1:5000/api/health`

## Authentication API

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/auth/register` | Public |
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/profile` | Authenticated |
| GET | `/api/auth/owner-test` | Owner |
| GET | `/api/auth/admin-test` | Admin |

Protected requests use:

```http
Authorization: Bearer <jwt-token>
```

## Testing

Run all tests:

```bash
npm test
```

Run individual test suites:

```bash
npm run test:server
npm run test:client
```

Create a production frontend build:

```bash
npm run build
```

Current test coverage includes registration, login, JWT validation, protected
routes, role authorization, frontend validation, session restoration, and
logout.

## Phase 1 Scope

Phase 1 includes project setup and authentication only. Property CRUD, rental
requests, favorites, and tenant, owner, or admin dashboards are not included
yet.
