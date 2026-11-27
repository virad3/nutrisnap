# NutriSnap – AI calorie & nutrition tracker

React 19 + TypeScript + Vite + Tailwind v3 + shadcn-style UI. Firebase Auth + Firestore (free Spark plan). AI analysis runs in a Vercel serverless function (`api/analyze-meal.ts`) calling Gemini. Everything fits free tiers.

## 1. Firebase (once)
1. Create a project at console.firebase.google.com (no billing needed).
2. Build → Authentication → enable **Email/Password** and **Google**.
3. Build → Firestore Database → Create (production mode), then paste `firestore.rules` into the Rules tab and Publish.
4. Project settings → Your apps → add a **Web app** and copy its config (apiKey, authDomain, projectId, appId).
5. After deploying, add your Vercel domain under Authentication → Settings → **Authorized domains**.

## 2. Environment variables
Browser (public identifiers): `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
Server only (never `VITE_`): `GEMINI_API_KEY` (Google AI Studio), `FIREBASE_PROJECT_ID` (same as above)

Local: put them in `.env.local` (git-ignored). Vercel: Project → Settings → Environment Variables.

## 3. Run locally
`npm i -g vercel`, `vercel login`, `vercel link`, then `vercel dev` (serves the app and `/api`). `npm run dev` alone runs the UI but `/api/analyze-meal` will 404.

## 4. Deploy
Push to GitHub and import the repo in Vercel (framework: Vite), add the env vars, deploy. Or `vercel --prod`.

## Architecture
- `src/lib/nutrition.ts` – BMI / BMR (Mifflin-St Jeor, or Katch-McArdle with body fat) / TDEE / macro targets. All estimates.
- `src/pages/SnapMealPage.tsx` – photo and/or text → `/api/analyze-meal` → editable per-item results → save.
- `api/analyze-meal.ts` – verifies the Firebase ID token with Google's public keys (no admin key), enforces 30 analyses/user/day via a rules-protected counter, calls Gemini with a JSON schema, sanitises output.
- `firestore.rules` – each user can only access `users/{their uid}/**`.
- Meal photos are stored as ~360px thumbnails inside the meal document (avoids paid Firebase Storage).
