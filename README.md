# Service Booking API

A RESTful backend for a home-service marketplace. Customers browse services offered by technicians, book a time slot, pay through Stripe Checkout, and leave reviews. Admins manage users and categories.

## Features

- **Role-based access control** — `ADMIN`, `TECHNICIAN`, `CUSTOMER` (JWT via cookie or `Authorization` header)
- **Service catalog** — categories and technician-owned services with pricing and service areas
- **Bookings** — overlap detection per service, price calculated from the booked date range
- **Stripe payments** — Checkout sessions plus a webhook that confirms payment status
- **Reviews** — customers review services; admins can moderate
- **Validation and errors** — Zod request validation and a centralized error handler
- **Serverless-ready** — bundled with `tsup` and deployable to Vercel

## Tech Stack

| Area | Technology |
| --- | --- |
| Runtime / language | Node.js, TypeScript (ESM) |
| Framework | Express 5 |
| Database | PostgreSQL with Prisma 7 (`@prisma/adapter-pg`) |
| Auth | JSON Web Tokens, bcrypt |
| Payments | Stripe |
| Validation | Zod |
| Build / deploy | tsup, Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A PostgreSQL database
- A Stripe account and the [Stripe CLI](https://stripe.com/docs/stripe-cli) (for local webhooks)

### Installation

```bash
git clone <repository-url>
cd B7A4
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

SALT_ROUND=10
ACCESS_SECRET=your_access_secret
REFRESH_SECRET=your_refresh_secret
EXPIRE_ACCESS_TOKEN=1d
EXPIRE_REFRESH_TOKEN=7d

STRIPE_SECRET=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Database setup

```bash
npm run db:generate   # generate the Prisma client into ./generated/prisma
npm run db:migrate    # apply migrations
npm run db:seed       # optional: load sample data
```

> **Warning:** the seed script deletes all existing data before inserting sample records. Seeded users share the password `password123`.

### Run the server

```bash
npm run dev
```

The API listens on `http://localhost:5000`.

To test payments locally, forward Stripe events in a second terminal and copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`:

```bash
npm run webhook:stripe
```

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server with file watching |
| `npm run build` | Generate the Prisma client and bundle to `dist/` |
| `npm run db:generate` | Generate the Prisma client |
| `npm run db:migrate` | Create and apply migrations |
| `npm run db:seed` | Seed the database |
| `npm run database` | Open Prisma Studio |
| `npm run webhook:stripe` | Forward Stripe webhooks to localhost |
| `npm run deploy` | Deploy to Vercel (production) |

## API Overview

All routes are prefixed with `/api`. Auth levels: **Public**, **Any** (any logged-in user), or specific roles.

| Resource | Endpoint | Access |
| --- | --- | --- |
| **Users** | `POST /users` | Public (register) |
| | `GET /users` | Admin |
| | `GET /users/me` | Any |
| | `PATCH /users` | Any (update own profile) |
| | `PATCH /users/:id` | Admin (block user) |
| **Auth** | `POST /auth/login` | Public |
| **Categories** | `GET /category` | Public |
| | `GET /category/:id` | Admin, Technician |
| | `POST /category`, `PATCH /category/:id` | Admin |
| **Technicians** | `POST /technician` | Public |
| | `GET /technician` | Admin |
| | `GET /technician/:id` | Public |
| **Services** | `GET /service`, `GET /service/:id` | Public |
| | `GET /service/my-services` | Technician |
| | `POST /service`, `PATCH /service/:id` | Technician |
| **Bookings** | `POST /bookings` | Admin, Customer |
| | `GET /bookings` | Any |
| | `GET /bookings/technician/dashboard` | Technician |
| | `PATCH /bookings/:id` | Customer, Technician |
| **Payments** | `POST /payments/checkout/:id` | Customer |
| | `GET /payments/my-payments` | Any |
| | `GET /payments`, `GET /payments/:id` | Admin |
| | `POST /payments/webhook` (also `POST /webhooks`) | Stripe |
| **Reviews** | `GET /review/:serviceId` | Public |
| | `POST /review` | Customer |
| | `PATCH /review/:id` | Customer |
| | `DELETE /review/:id` | Customer, Admin |

Authenticate by logging in, then send the token either as the `accessToken` cookie or as `Authorization: Bearer <token>`.

## Project Structure

```
src/
├── app.ts              # Express app, middleware, route mounting
├── server.ts           # Entry point
├── config/             # Environment configuration
├── lib/                # Prisma and Stripe clients
├── middleware/         # auth, error handler, not-found
├── module/             # Feature modules (route → controller → service → validation)
│   ├── auth, user, technecian, category
│   └── service, booking, payment, review
└── utils/              # AppError, catchAsync, sendResponse, JWT helpers
prisma/
├── schema/             # Split Prisma schema (one file per model group)
├── migrations/
└── seed.ts
```

## Data Model

`User` (1–1 `Profile`, 1–1 `TechnicianProfile`) → `Service` (belongs to `Category`) → `Booking` (1–1 `Payment`) and `Review`.

Booking statuses: `PENDING`, `PAID`, `ACCEPTED`, `CANCELED`. Payment statuses: `PENDING`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `CANCELLED`, `REFUNDED`.

## Deployment

The project deploys to Vercel using [vercel.json](vercel.json), which serves the bundled `dist/server.js`.

```bash
npm run build
npm run deploy
```

Set all environment variables in the Vercel project settings, set `NODE_ENV=production`, and point your Stripe webhook endpoint at `https://<your-domain>/api/payments/webhook`.

## License

ISC
