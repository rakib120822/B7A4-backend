# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — run the API with `tsx watch src/server.ts` (default port 5000)
- `npm run build` — `prisma generate && tsup` (bundles `src/server.ts` to `dist/server.js`, ESM, minified)
- `npm run db:generate` / `db:migrate` / `db:seed` / `database` (Prisma Studio)
- `npm run webhook:stripe` — forwards Stripe webhooks to `localhost:5000/webhooks` (requires Stripe CLI)
- `npm run deploy` — `vercel --prod`
- No tests or linter are configured (`npm test` is a placeholder).

Required `.env` keys (see [src/config/index.ts](src/config/index.ts)): `DATABASE_URL`, `PORT`, `SALT_ROUND`, `ACCESS_SECRET`, `REFRESH_SECRET`, `EXPIRE_ACCESS_TOKEN`, `EXPIRE_REFRESH_TOKEN`, `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`. Note the existing config maps `accessTokenExpireIn` to `EXPIRE_REFRESH_TOKEN` and `refreshTokenExpireIn` to `EXPIRE_ACCESS_TOKEN` (swapped).

## Architecture

Express 5 + TypeScript (ESM) + Prisma 7 (PostgreSQL via `@prisma/adapter-pg`) + Stripe + Zod. A service-booking API with roles CUSTOMER / TECHNICIAN / ADMIN.

- **Entry/deploy**: [src/app.ts](src/app.ts) builds the Express app and mounts routers under `/api/{users,auth,category,technician,service,review,bookings,payments}`. [src/server.ts](src/server.ts) only calls `listen` when `NODE_ENV !== "production"`; in production (Vercel, see [vercel.json](vercel.json)) it just exports `app` from the bundled `dist/server.js`. `globalError` is registered after `export default app` in app.ts.
- **Stripe webhook** is registered *before* `express.json()` with `express.raw` (signature verification needs the raw body), at both `/webhooks` and `/api/payments/webhook`. Keep any new body-parsing middleware below it.
- **Module layout**: `src/module/<name>/` with `*.route.ts` → `*.controller.ts` → `*.service.ts` (+ `*.validation.ts` Zod schemas). Controllers are wrapped in `catchAsync` and respond via `sendResponse`; services throw `AppError(httpStatus.X, msg)`, handled by [globalErrorHandler](src/middleware/globalErrorHandler.ts). The technician module's directory is spelled `technecian` (with typo'd filenames) — keep those paths as-is.
- **Auth**: [src/middleware/auth.ts](src/middleware/auth.ts) exports `auth(...roles)` and `authOptional(...roles)`. Token comes from the `accessToken` cookie or the `Authorization` header (with or without `Bearer`). It re-loads the user from the DB each request, rejects BANNED users, and sets `req.user` (typed via a global Express augmentation).
- **Prisma**: schema is split across files in `prisma/schema/` (configured in [prisma.config.ts](prisma.config.ts)). The client is generated to `generated/prisma/` (not `node_modules`); import from `../../generated/prisma/client` and enums from `.../enums`. Client instance lives in [src/lib/prisma.ts](src/lib/prisma.ts). Seed: `prisma/seed.ts`.
- **Bookings/payments flow**: bookings check for overlapping date ranges per service and compute price from day count × `service.pricePerHour`; payments create a Stripe checkout session per booking (`/api/payments/checkout/:id`), and the webhook updates payment/booking state.
