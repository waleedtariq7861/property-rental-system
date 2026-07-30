# RentEase – Smart Property Rental & Management System

RentEase is a full-stack property rental project for tenants, property owners,
and administrators. Phase 1 established secure authentication, while Phase 2
Days 1–4 add public property discovery, complete listing details, a secure
owner dashboard, and owner property creation.

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

## Phase 2 Day 1 Features

- Public property listing and single-property REST APIs
- MySQL property schema migration and realistic seed listings
- Responsive property cards with loading, empty, and error states
- Axios-powered property data loading at `/properties`

## Phase 2 Day 2 Features

- Real-time property search by title, city, or address
- Combined city, property type, price range, and bedroom filters
- Newest, oldest, and price-based sorting
- Server-side pagination with preserved discovery criteria
- Responsive property details at `/properties/:id`
- Loading, empty, error, and property-specific 404 states

## Phase 2 Day 3 Features

- JWT-protected owner dashboard at `/owner/dashboard`
- Owner-only role authorization on the frontend and backend
- Dynamic total, active, and recently added property statistics
- Owner-ID-filtered property portfolio with current listing statuses
- Responsive desktop sidebar and mobile dashboard navigation
- Reusable dashboard header, statistics, property card, loading, and empty states

## Phase 2 Day 4 Features

- Owner-only property creation page at `/owner/properties/add`
- JWT-protected `POST /api/properties` endpoint with current-role verification
- Client-side and server-side property validation with trimmed input
- Automatic owner ID and timestamp persistence
- Responsive form with loading, error, and success feedback
- Immediate owner dashboard refresh after creation
- Immediate public visibility for newly created available properties

Property editing, deletion, rental requests, and favorites remain reserved for
later Phase 2 work.

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

When upgrading an existing Phase 1 database, run the Day 1 migration before
seeding:

```bash
mysql -u root -p < server/database/phase2_day1.sql
mysql -u root -p < server/database/seed.sql
```

When upgrading an existing Phase 2 Day 3 database, apply the additive Day 4
migration:

```bash
mysql -u root -p < server/database/phase2_day4.sql
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

## Property Listings API

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/properties` | Public |
| POST | `/api/properties` | Authenticated owner |
| GET | `/api/properties/:id` | Public |

The list endpoint returns approved, available properties and accepts these
optional query parameters:

| Parameter | Values |
| --- | --- |
| `search` | Property title, city, or address text |
| `city` | Exact city name, case-insensitive |
| `propertyType` | `apartment`, `house`, `villa`, `office`, `studio`, `portion`, `room`, or `shop` |
| `minPrice` / `maxPrice` | Non-negative monthly price |
| `bedrooms` | Exact non-negative bedroom count |
| `sort` | `newest`, `oldest`, `price_asc`, or `price_desc` |
| `page` | Positive page number |
| `limit` | Results per page, from 1 to 60 |

List responses include `properties`, the current-page `count`, `totalCount`,
`currentPage`, and `totalPages`.

The creation endpoint derives `owner_id` from the verified JWT user and accepts
`title`, `propertyType`, `description`, `price`, `city`, `address`, `bedrooms`,
`bathrooms`, `area`, `imageUrl`, `propertyStatus`, and `contactNumber`.
Available properties are published to the public listing feed immediately;
rented properties remain visible in the owner's dashboard.

## Owner Dashboard API

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/owner/dashboard` | Authenticated owner |

The dashboard endpoint derives the owner ID from the verified JWT session and
returns the safe owner profile, dynamic statistics, and only that owner's
properties. Active listings are approved and available. Recently added
properties are those created during the previous seven days.

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
routes, role authorization, frontend validation, session restoration, logout,
property discovery queries, pagination, property details, owner isolation,
dashboard statistics, property creation, creation-role enforcement, immediate
listing visibility, owner-only routing, and dashboard UI states.

## Current Scope

Authentication and Phase 2 Days 1–4 are included. Property editing and deletion,
rental requests, favorites, and tenant or admin dashboards are not included yet.
