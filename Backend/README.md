# Banner Application Backend

## Overview

This backend contains the production-ready foundation for the Banner Application API.

## Features in this foundation

- Express.js application setup
- Environment validation with `.env` values
- MongoDB connection handling with safe startup behavior
- Centralized error handling and route not-found handling
- Consistent API response format
- Async error handling utility
- Health-check endpoint with database status
- Graceful shutdown handling
- Authentication API foundation: register, login, current-user retrieval, JWT verification, secure protected route

## Required environment variables

Copy `.env.example` to `.env` and update the values.

- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `CLIENT_URL`
- `SUPER_ADMIN_NAME`
- `SUPER_ADMIN_EMAIL`
- `SUPER_ADMIN_PASSWORD`

`MONGODB_URI` can remain empty during local development if DB connectivity is intentionally deferred, but it must be set in production.

`CLIENT_URL` may include multiple comma-separated frontend origins during local development, including the machine LAN IP used by Expo Go, such as `http://192.168.1.37:8081,http://192.168.1.37:3000,http://127.0.0.1:8081,http://127.0.0.1:3000`.

## Role architecture

The application uses a centralized role model with these exact values:

- `USER`
- `ADMIN`
- `SUPER_ADMIN`

Role checks are enforced by `requireAuth` followed by `authorize(...)` middleware. Authentication happens before authorization, and admin-only endpoints reject users without the required role with a standardized 403 response.

## SUPER_ADMIN bootstrap

A development-safe bootstrap process is included to create the first administrator without exposing a public escalation endpoint.

1. Set the following values in `.env`:
   - `SUPER_ADMIN_NAME`
   - `SUPER_ADMIN_EMAIL`
   - `SUPER_ADMIN_PASSWORD`
2. Run:

```bash
npm run bootstrap:super-admin
```

This script creates or promotes a matching user to `SUPER_ADMIN` only when the environment values are set. No public registration route can create a `SUPER_ADMIN`.

## User management APIs

- `GET /api/users` — `SUPER_ADMIN` only; returns safe user data
- `GET /api/users/:id` — `SUPER_ADMIN` only
- `PATCH /api/users/:id/role` — `SUPER_ADMIN` only; validates role values and blocks self-escalation
- `PATCH /api/users/:id/status` — `SUPER_ADMIN` only; supports activation and deactivation

These routes are scoped to Feature 4 and do not include category or template management.

## Run locally

```bash
cd backend
npm install
npm run dev
```

The API will run on the configured `PORT` value.

## Deploy on Render

Create a Render **Web Service** using the `Backend` directory as the service root:

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Health Check Path:** `/health`

Render supplies `PORT` automatically. Configure the remaining production values in
the Render dashboard rather than committing a `.env` file:

```env
HOST=0.0.0.0
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-host>/banner_app?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=https://<frontend-domain>
```

After the first deploy, optionally create the initial administrator from the
Render service shell:

```bash
npm run bootstrap:super-admin
```

## Test health endpoint

```bash
curl http://192.168.1.37:5000/api/health
```

Expected result:

```json
{
  "success": true,
  "message": "Backend is healthy",
  "data": {
    "server": "running",
    "api": "healthy",
    "environment": "development",
    "database": {
      "connected": false,
      "uriConfigured": false,
      "state": "disconnected"
    }
  },
  "timestamp": "2026-08-25T15:24:55.088Z",
  "environment": "development"
}
```

## Test invalid route

```bash
curl http://192.168.1.37:5000/unknown
```

Expected result:

```json
{
  "success": false,
  "message": "Route not found: /unknown",
  "timestamp": "2026-08-25T15:24:55.187Z",
  "environment": "development"
}
```

## Important notes

- Do not hardcode secrets or URLs.
- Production values must be configured through `.env` files.
- Database connectivity is validated separately with a valid `MONGODB_URI`.
- This feature intentionally stops before authentication, categories, templates, or banner builder logic.
