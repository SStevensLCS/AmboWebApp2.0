# Mobile App (Expo) - Ambassador Portal

## Overview
Expo React Native app for Student Ambassadors. MVP scope: Login, Dashboard, Log Hours, Profile.
Student role only. Consumes the existing Next.js API.

## What Was Built (MVP)

### Mobile App (`mobile/`)
- **Expo SDK 52** with Expo Router (file-based routing)
- **NativeWind** (Tailwind CSS for React Native) for styling
- **expo-secure-store** for JWT token storage
- **expo-image-picker** for avatar uploads

### Screens
| Screen | File | Features |
|--------|------|----------|
| Login | `app/login.tsx` | Email/phone + password, error handling |
| Dashboard | `app/(tabs)/index.tsx` | Stats cards (hours/credits), submissions list, pull-to-refresh |
| Log Hours | `app/(tabs)/log.tsx` | Service type picker, date/hours/credits form, success state |
| Profile | `app/(tabs)/profile.tsx` | Avatar upload, user info, sign out |

### API Changes (Web App)
- **`src/lib/session.ts`**: Added `getSessionFromRequest()` — checks `Authorization: Bearer <token>` header, falls back to cookie
- **`src/app/api/auth/login/route.ts`**: Now returns `{ token, user, redirect }` in response body
- **`src/app/api/auth/me/route.ts`**: New endpoint — returns current user profile data
- **`src/middleware.ts`**: Checks Bearer token header in addition to cookie; returns 401 JSON for unauthorized API requests
- **`src/app/api/submissions/route.ts`**: Uses `getSessionFromRequest()` for Bearer token support
- **`src/app/api/users/avatar/route.ts`**: Uses `getSessionFromRequest()`, accepts "avatar" form field name
- **`tsconfig.json`**: Excludes `mobile/` from Next.js build

## Getting Started

```bash
# 1. Install dependencies
cd mobile
npm install

# 2. Set your API URL
cp .env.example .env
# Edit .env — set EXPO_PUBLIC_API_URL to your Next.js server

# 3. Start the dev server
npx expo start

# 4. Run on device
# - Scan QR code with Expo Go (Android) or Camera app (iOS)
# - Or press 'i' for iOS simulator / 'a' for Android emulator
```

## Building for App Store

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build for iOS (requires Apple Developer account - $99/year)
eas build --platform ios

# Build for Android
eas build --platform android

# Submit to App Store
eas submit --platform ios

# Submit to Google Play
eas submit --platform android
```

## Future Phases (Post-MVP)
- Events screen (calendar, RSVP, comments)
- Posts/Social feed
- Chat (Supabase Realtime)
- Resources browser
- Push notifications (expo-notifications)
- Google Calendar sync
