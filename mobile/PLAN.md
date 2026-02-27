# Mobile App (Expo) - Implementation Plan

## Overview
Expo React Native app for Student Ambassadors. MVP scope: Login, Dashboard, Log Hours, Profile.
Student role only. Consumes the existing Next.js API.

## Phase 1: Project Scaffolding

### 1.1 Initialize Expo project
- `npx create-expo-app@latest mobile --template blank-typescript` (or set up manually)
- Use Expo SDK 52+ with Expo Router for file-based routing
- Configure for iOS + Android

### 1.2 Install core dependencies
- `expo-router` — file-based navigation (like Next.js App Router)
- `nativewind` + `tailwindcss` — Tailwind for React Native
- `expo-secure-store` — secure JWT storage
- `expo-image-picker` — avatar uploads
- `@supabase/supabase-js` — for Realtime (chat, later phases)
- `expo-notifications` — push notifications (later phases)
- `react-native-safe-area-context` — safe area handling

### 1.3 Project structure
```
mobile/
├── app/                    # Expo Router (file-based)
│   ├── _layout.tsx         # Root layout (auth provider, fonts)
│   ├── login.tsx           # Login screen
│   └── (tabs)/             # Tab navigator (authenticated)
│       ├── _layout.tsx     # Tab bar config
│       ├── index.tsx       # Dashboard
│       ├── log.tsx         # Log service hours
│       └── profile.tsx     # Profile & settings
├── components/             # Shared components
│   ├── ui/                 # Base UI components
│   └── ...                 # Feature components
├── lib/
│   ├── api.ts              # API client (fetch wrapper with auth headers)
│   ├── auth.ts             # Auth context + secure storage
│   └── types.ts            # Shared types (can import from web app)
├── app.json                # Expo config
├── tailwind.config.js      # NativeWind config
├── eas.json                # EAS Build config
└── package.json
```

## Phase 2: Auth System

### 2.1 API-side changes (minimal)
- Update existing API routes to accept `Authorization: Bearer <token>` header
  as an alternative to the `ambo_session` cookie
- Modify `getSession()` in `src/lib/session.ts` to check both sources
- Modify login API to return the JWT token in the response body (in addition to setting cookie)

### 2.2 Mobile auth flow
- Login screen: email/phone + password form
- Call `POST /api/auth/login`, receive JWT in response
- Store JWT in `expo-secure-store`
- Auth context provider wraps app, provides user state + token
- All API calls include `Authorization: Bearer <token>` header
- Auto-redirect: unauthenticated → login, authenticated → dashboard

## Phase 3: Dashboard Screen

### 3.1 Stats cards
- Total hours and total credits (aggregated from submissions)
- Fetch from submissions API

### 3.2 Recent submissions list
- FlatList showing recent submissions
- Status badges (Approved/Pending/Denied) with color coding
- Pull-to-refresh

## Phase 4: Log Service Hours Screen

### 4.1 Form
- Service type picker (from SERVICE_TYPES constant)
- Date picker (service date)
- Hours input (numeric, 0.5 increments)
- Credits input (whole number)
- Notes textarea
- Submit → `POST /api/submissions`

### 4.2 Success state
- Confirmation screen with "Log Another" and "View Dashboard" options

## Phase 5: Profile Screen

### 5.1 User info display
- Avatar with upload capability (expo-image-picker → /api/users/avatar)
- Name, email, phone display

### 5.2 Actions
- Sign out button (clears secure store, redirects to login)

## Phase 6: App Store Prep

### 6.1 Config
- App icon (1024x1024)
- Splash screen
- app.json metadata (name, slug, version, bundle identifiers)
- eas.json build profiles (development, preview, production)

### 6.2 Build & Submit
- `eas build --platform ios` → builds in cloud
- `eas submit --platform ios` → submits to App Store Connect
- Same for Android/Google Play

## Future Phases (Post-MVP)
- Events screen (calendar, RSVP, comments)
- Posts/Social feed
- Chat (Supabase Realtime)
- Resources browser
- Push notifications (expo-notifications + server changes)
- Google Calendar sync
