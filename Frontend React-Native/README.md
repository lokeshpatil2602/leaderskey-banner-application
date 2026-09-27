# Banner Application Frontend

## Overview

This frontend is the foundation for the Banner Application mobile app. It provides the app shell, environment-based API connectivity, and a simple health-check screen for validating the backend connection before later app features are built.

## Current frontend architecture

- `App.tsx` — root application entry and auth flow switch
- `src/config/env.ts` — environment configuration layer for API values
- `src/api/client/index.ts` — shared fetch wrapper with timeout and error handling
- `src/api/services/authService.ts` — authentication API integration for register, login, and current user
- `src/api/services/userService.ts` — role-aware user management calls for SUPER_ADMIN
- `src/utils/tokenStorage.ts` — secure JWT storage with web-safe fallback
- `src/context/AuthContext.tsx` — authentication state and session restoration
- `src/screens/auth/LoginScreen.tsx` — login UI
- `src/screens/auth/RegisterScreen.tsx` — registration UI
- `src/screens/app/AuthenticatedScreen.tsx` — logged-in user screen
- `src/screens/app/UserManagementScreen.tsx` — temporary SUPER_ADMIN-only user management screen
- `src/components/common/LoadingState.tsx` — reusable loading UI
- `src/components/common/ErrorState.tsx` — reusable error UI
- `src/screens/app/FoundationScreen.tsx` — foundation health-check screen retained for backend connectivity validation

## Required environment variables

Create `.env` from `.env.example` if it does not already exist.

- `EXPO_PUBLIC_API_URL`

Example:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.37:5000/api
```

## Role-aware authenticated experience

The frontend reads the authenticated user’s `role` from the JWT-backed backend response. A `SUPER_ADMIN` account is routed to a temporary user-management screen, while regular users remain on the standard authenticated experience. This UI layer is for visibility only; the backend still enforces the real authorization checks.

## Temporary user management screen

`UserManagementScreen` is intentionally simple and scoped to verification of:

- ROLE loading
- ROLE updates
- Account activation/deactivation
- SUPER_ADMIN-only visibility

It does not implement a final admin dashboard, category management, templates, or banner builder features.

## How to configure the backend API URL

The app reads the backend URL from `EXPO_PUBLIC_API_URL` in the Expo environment. No URL is hardcoded in frontend service logic.

## Run locally

```bash
cd "Frontend React-Native"
npm install
npm start
```

For web preview:

```bash
cd "Frontend React-Native"
$env:CI="1"
npx expo start --web
```

## How to test backend connectivity

1. Start the backend API:

```bash
cd "Backend"
npm run dev
```

2. Confirm the health endpoint is available:

```bash
curl http://192.168.1.37:5000/api/health
```

3. Launch the frontend and view the foundation screen.

Expected behavior:
- Loading state appears immediately
- Success state appears when the backend returns a healthy response
- A clear error message appears when the backend is unavailable
- A retry button appears in the error state

## Feature 2 implementation details

- Uses the Expo environment variable system (`EXPO_PUBLIC_API_URL`)
- Uses a centralized fetch client with timeout support
- Handles backend offline, network failure, timeout, and invalid response states
- Performs a real backend health check without hardcoded hostnames or API URLs
- Keeps the current screen intentionally simple as a foundation for later authentication and app screens

## Important notes

- Do not hardcode local-only or production URLs in app code. Keep the LAN IP in `.env` for Expo Go testing.
- Keep environment-specific values in `.env` files.
- This feature is intentionally limited to the frontend foundation and does not include auth, user logic, categories, templates, or builder screens.
