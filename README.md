# Banner Application — Production & Deployment Guide

A dynamic, multi-size banner creation and social media sharing mobile application built with **React Native (Expo)**, **Express (TypeScript)**, and **MongoDB**.

---

## 1. Project Architecture

```text
├── Backend/                    # Node.js + Express + TypeScript + Mongoose
│   ├── src/
│   │   ├── config/             # Environment, Database, Roles configuration
│   │   ├── middleware/         # Auth, RBAC, Error sanitization middlewares
│   │   ├── modules/            # Auth, Templates, Banners, Categories, Users
│   │   ├── routes/             # REST endpoints (with unauthenticated /health)
│   │   └── server.ts           # Server entry point
│   ├── scripts/                # Dynamic test suites, Seed script
│   └── package.json
│
├── Frontend React-Native/      # React Native (Expo SDK 54)
│   ├── src/
│   │   ├── api/                # Centralized API client (EXPO_PUBLIC_API_URL)
│   │   ├── components/         # BannerRenderer, RoleGuard, Canvas UI
│   │   ├── context/            # Authentication Context
│   │   ├── navigation/         # Role-based Tab Navigator
│   │   └── screens/            # Templates, Editor, Share, My Banners, Admin
│   ├── eas.json                # EAS Android APK configuration
│   └── app.json
```

---

## 2. Environment Variables Configuration

### Backend (`Backend/.env`)
Create a `.env` file in the `Backend/` directory:

```env
PORT=5000
NODE_ENV=production
# MongoDB Atlas Connection String
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/banner_app?retryWrites=true&w=majority
# Strong secret for signing JWT auth tokens
JWT_SECRET=your_super_strong_production_jwt_secret
JWT_EXPIRES_IN=7d
# Allowed CORS origins (* for mobile/all)
CLIENT_URL=*
```

### Frontend (`Frontend React-Native/.env`)
Create a `.env` file in the `Frontend React-Native/` directory:

```env
# Production Backend URL (deployed on Render)
EXPO_PUBLIC_API_URL=https://your-render-service.onrender.com/api

# For local development with Expo Go:
# EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_NETWORK_IP:5000/api
```

---

## 3. Local Development

### 1. Start Backend
```bash
cd Backend
npm install
npm run dev
```

### 2. Seed Initial Database Data
```bash
cd Backend
npm run seed
```

### 3. Start Frontend (Expo Go)
```bash
cd "Frontend React-Native"
npm install
npx expo start
```

---

## 4. Render Backend Deployment

1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your Git repository.
3. Configure the service settings:
   - **Root Directory**: `Backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
4. Add Environment Variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<Your Production JWT Secret>`
   - `PORT`: `5000` (or leave default for Render to assign)
   - `CLIENT_URL`: `*`
5. Deploy and verify health check:
   ```bash
   curl https://your-render-service.onrender.com/health
   # Expected response: {"status":"ok","message":"Banner Application backend is healthy",...}
   ```

---

## 5. Android APK Build (EAS Build)

1. Ensure `EXPO_PUBLIC_API_URL` points to your live Render backend URL:
   ```env
   EXPO_PUBLIC_API_URL=https://your-render-service.onrender.com/api
   ```
2. Run local or cloud APK build:
   ```bash
   cd "Frontend React-Native"
   # Build standalone APK using EAS
   npx eas build -p android --profile preview
   ```
3. Install the resulting `.apk` file directly on physical Android devices.
4. The APK communicates directly with Render and MongoDB Atlas without requiring any local development servers.

---

## 6. Automated Verification & Quality Assurance

Run backend automated verification suites:

```bash
cd Backend
# Dynamic template, custom sizes (1200x1600), 7-element layout & production health tests
npx ts-node scripts/test-feature-10-dynamic-verification.ts

# Social media platform sharing & template integrity tests
npx ts-node scripts/test-feature-8-social-sharing.ts

# Role-based authorization & security isolation tests
npx ts-node scripts/test-role-authorization.ts
```
