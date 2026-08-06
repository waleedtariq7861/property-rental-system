# RentEase – Smart Property Rental & Management System

RentEase is a full-stack property rental project for tenants, property owners,
and administrators. Phase 1 established secure authentication, Phase 2 added
property discovery and owner property management, and Phase 3 adds the tenant
rental request workflow plus owner request decisions.

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

## Phase 2 Day 5 Features

- Owner-only property editing at `/owner/properties/edit/:id`
- Owner-only property deletion with confirmation modal
- JWT-protected update and delete APIs with ownership checks
- Automatic dashboard refresh after editing or deleting
- Automatic public-listing refresh after availability changes or deletion
- Responsive edit, loading, success, error, and confirmation states

## Phase 3 Day 1 Features

- Tenant-only rental request creation for available, approved properties
- JWT-derived tenant IDs and property-derived owner IDs
- Duplicate pending-request prevention, including concurrent submissions
- Tenant-scoped `my-requests` API
- Optional owner message from the Property Details page
- Loading, success, duplicate, and general error feedback

## Phase 3 Day 2 Features

- Owner-only rental request inbox at `/owner/requests`
- Tenant contact, property, request date, message, and current-status details
- Secure accept and reject actions for pending requests
- Property-ownership isolation on request reads and updates
- Transactional pending-to-approved or pending-to-rejected status changes
- Tenant/property/message search and request-status filters
- Responsive loading, empty, success, and error states

## Phase 3 Day 3 Features

- Tenant-only rental dashboard at `/tenant/dashboard`
- Total, pending, accepted, and rejected request summaries
- Property, owner, request-date, message, and current-status details
- Secure cancellation for the authenticated tenant's pending requests only
- Transactional pending-to-cancelled status changes
- Property/owner/message search and request-status filters
- Recent activity feed ordered by the latest request update
- Responsive loading, empty, success, and error states

## Phase 3 Day 4 Features

- Admin-only dashboard at `/admin/dashboard`
- Total user, owner, tenant, property, and rental-request statistics
- Recent users, properties, and rental-request activity panels
- Read-only user directory with account details, search, and role/status filters
- Read-only property inventory with owner/listing details and combined filters
- Read-only rental-request register with tenant, owner, property, and status details
- Current database-role verification on every admin API
- Responsive loading, empty, success, and error states

Phase 3 Day 5 administrative actions are intentionally reserved for later work.

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

When upgrading an existing Phase 2 database for Phase 3 Day 1, apply the rental
request migration:

```bash
mysql -u root -p < server/database/phase3_day1.sql
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
| GET | `/api/properties/:id/manage` | Authenticated owner of property |
| PUT | `/api/properties/:id` | Authenticated owner of property |
| DELETE | `/api/properties/:id` | Authenticated owner of property |
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
Owners can update or delete only properties they own. Deleting a property
removes it from the database and from subsequent dashboard and public-listing
responses.

## Owner Dashboard API

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/owner/dashboard` | Authenticated owner |

The dashboard endpoint derives the owner ID from the verified JWT session and
returns the safe owner profile, dynamic statistics, and only that owner's
properties. Active listings are approved and available. Recently added
properties are those created during the previous seven days.

## Rental Requests API

| Method | Endpoint | Access |
| --- | --- | --- |
| POST | `/api/rental-requests` | Authenticated tenant |
| GET | `/api/rental-requests/my-requests` | Authenticated tenant |
| PATCH | `/api/rental-requests/:requestId/cancel` | Authenticated tenant who created the request |
| GET | `/api/rental-requests/owner-requests` | Authenticated owner |
| PATCH | `/api/rental-requests/:requestId/status` | Authenticated owner of the request property |

Create requests accept `propertyId` and an optional `message`. The server takes
the tenant ID from the verified JWT, takes the owner ID from the property, and
accepts only approved properties whose availability status is `available`.
Duplicate pending requests for the same tenant and property are rejected.
The owner list returns requests only when both the saved request owner and the
current property owner match the authenticated owner. Status updates accept
only `approved` or `rejected`, lock the request while deciding it, and reject
repeat decisions once a request is no longer pending.
Tenant cancellation derives the tenant ID from the verified JWT, locks the
owned request while updating it, and permits only a `pending` to `cancelled`
transition.

## Admin Dashboard API

| Method | Endpoint | Access |
| --- | --- | --- |
| GET | `/api/admin/dashboard` | Authenticated admin |
| GET | `/api/admin/users` | Authenticated admin |
| GET | `/api/admin/properties` | Authenticated admin |
| GET | `/api/admin/rental-requests` | Authenticated admin |

Admin endpoints reload the current account from the database before checking
its role. They expose safe account fields and read-only platform data; no user,
property, or rental-request mutation actions are included in Day 4.

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
listing visibility, property editing, property deletion, ownership isolation,
owner-only routing, dashboard UI states, rental-request role enforcement,
duplicate prevention, tenant isolation, owner-property request isolation,
pending-only accept and reject decisions, tenant dashboard summaries,
pending-only cancellation, rental-request UI feedback, admin-only API access,
safe user reporting, platform statistics, recent admin activity panels, and
admin directory search and filters.

## Current Scope

Authentication, Phase 2 Days 1–5, and Phase 3 Days 1–4 rental-request creation,
owner management, the Tenant Dashboard, and the read-only Admin Dashboard are
included. Favorites and Phase 3 Day 5 administrative actions are not included
yet.
