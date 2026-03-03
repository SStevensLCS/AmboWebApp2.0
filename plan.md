# Ambassador Portal — Industrial-Grade Product Plan

> **Last Updated:** March 3, 2026
> **Status:** Active Development
> **Goal:** Transform the Ambassador Portal into a polished, production-quality product with senior-level UI/UX design and engineering rigor across both web and mobile platforms.

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Phase 1: Design System & Visual Foundation](#phase-1-design-system--visual-foundation)
3. [Phase 2: Mobile App — Core Polish](#phase-2-mobile-app--core-polish)
4. [Phase 3: Web App — Core Polish](#phase-3-web-app--core-polish)
5. [Phase 4: Shared Feature Completion](#phase-4-shared-feature-completion)
6. [Phase 5: Performance & Reliability](#phase-5-performance--reliability)
7. [Phase 6: Advanced Features](#phase-6-advanced-features)
8. [Phase 7: Testing, Security & Launch Prep](#phase-7-testing-security--launch-prep)
9. [Database Migrations](#database-migrations)
10. [File Change Summary](#file-change-summary)

---

## Current State Assessment

### What's Built & Working

**Web App (Next.js 14 — Production-Ready Core):**
- Full auth flow (magic link, Google OAuth, password reset)
- Student dashboard (stats, submission history, events, chat, posts, resources, profile)
- Admin dashboard (applications, submissions, users, events, posts, chat, resources, form builder)
- 42 REST API routes with proper auth/authorization
- Real-time chat via Supabase Realtime
- PWA with service worker and manifest
- File uploads to Supabase Storage
- Web push notifications
- Google Calendar integration
- CSV import/export for users & submissions

**Mobile App (Expo 55 / React Native — Functional Core):**
- Complete auth flow (email/password login)
- Role-based navigation (student vs admin tab bars)
- Student: Dashboard, events, posts, chat, profile, resources, submission logging
- Admin: Dashboard, submissions, users, applications, events, posts, chat, resources, profile
- 14 custom data hooks with consistent fetch/loading/error pattern
- Push notifications (Expo Notifications)
- Avatar upload
- Notification preferences & Google Calendar hooks

**Shared Monorepo Infrastructure:**
- Turborepo with npm workspaces
- Shared packages: `@ambo/database` (types), `@ambo/utils`, `@ambo/config` (Tailwind)
- Consistent TypeScript strict mode across all packages

### What Needs Work

| Area | Gap |
|------|-----|
| Design system | No unified token system across web/mobile; hardcoded colors everywhere |
| Mobile detail pages | Admin submission approval, user editing, application review — partially stubbed |
| Mobile admin workflows | No approve/deny UX, no bulk actions, no inline editing |
| Error handling | Inconsistent; some pages silently fail |
| Loading states | Missing skeleton screens on several pages |
| Accessibility | No ARIA audit, no keyboard nav, no screen reader support |
| Testing | Web has 6 tests; mobile has 0 |
| Offline support | No caching strategy for mobile |
| Dark mode | CSS variables exist but no toggle |
| Onboarding | No first-time user experience |

---

## Phase 1: Design System & Visual Foundation

**Goal:** Establish a unified, token-based design system that ensures visual consistency across web and mobile. This is the foundation everything else builds on.

### 1A. Unified Color Tokens

**Files:**
- `packages/config/tokens.ts` (NEW — shared design tokens)
- `apps/web/src/app/globals.css` (UPDATE — reference tokens)
- `apps/mobile/src/lib/theme.ts` (UPDATE — reference tokens)

**Deliverables:**
- Define a single source of truth for all colors, spacing, radii, shadows, and typography
- Primary color: `#111827` (black) for mobile, `#3b82f6` or `#111827` for web (align decision)
- Semantic color palette: success (#10b981), warning (#f59e0b), danger (#ef4444), info (#3b82f6)
- Surface hierarchy: background, surface, surface-variant, elevated
- Text hierarchy: primary, secondary, tertiary, inverse, on-primary
- Border tokens: light, medium, focus
- Shadow depth scale: xs, sm, md, lg, xl (already defined, formalize)

### 1B. Typography System

**Files:**
- `packages/config/tokens.ts` (extend)
- `apps/web/tailwind.config.ts` (UPDATE)
- `apps/mobile/src/lib/theme.ts` (UPDATE)

**Deliverables:**
- Define font size scale: xs (12), sm (14), base (16), lg (18), xl (20), 2xl (24), 3xl (30)
- Define weight scale: regular (400), medium (500), semibold (600), bold (700)
- Line height scale tied to each size
- Letter spacing for headings vs body
- Consistent heading styles: h1, h2, h3, section-title, body, caption, overline

### 1C. Component Library Audit

**Files:**
- `apps/web/src/components/ui/*` (AUDIT)
- `apps/mobile/src/components/*` (AUDIT)

**Deliverables:**
- Audit all Shadcn/ui components for consistency with new token system
- Ensure all mobile components use theme tokens instead of hardcoded colors
- Document component API for each shared component
- Create a `<StatusBadge>` component that works identically on web and mobile
- Ensure all buttons, cards, inputs share the same visual language

### 1D. Animation & Motion Guidelines

**Deliverables:**
- Define standard transition durations: fast (150ms), normal (250ms), slow (350ms)
- Standard easing curves: ease-out for entrances, ease-in for exits
- Page transition pattern: fade + slide-up (already partially in place)
- Micro-interaction patterns: button press scale, card hover lift, toggle slide
- Respect `prefers-reduced-motion` on web; `accessibilityReduceMotionEnabled` on mobile

---

## Phase 2: Mobile App — Core Polish

**Goal:** Bring every mobile screen to production quality with complete functionality, polished interactions, and consistent styling.

### 2A. Navigation & Dashboard Restructure

**File:** `apps/mobile/app/(admin)/_layout.tsx`

- Final 5-tab layout: **Dashboard | Events | Posts | Chat | Profile**
- Hidden routes: Submissions, Users, Resources, Applications (accessible via Dashboard links)
- Add badge counts on Chat tab for unread messages

**File:** `apps/mobile/app/(admin)/index.tsx`

- Users stat card: tappable with chevron-right, navigates to `/(admin)/users`
- Resources card in Quick Access section with folder icon
- Add "Pending Applications" card with count badge
- Subtle card press animation (scale 0.98 on press)

### 2B. Admin Submission Approval Workflow

**File:** `apps/mobile/app/(admin)/submissions/[id].tsx` (MAJOR UPDATE)

- Full submission detail view: student name/avatar, service type, date, hours, credits, notes
- Status badge (Pending/Approved/Denied) with color coding
- Approve button (green) and Deny button (red) — prominent at bottom
- Required feedback field when denying (text input, minimum 10 characters)
- Optional feedback field when approving
- Confirmation dialog before action
- Success animation + navigate back to list
- Loading states during API call

### 2C. User Detail — Inline Editing

**File:** `apps/mobile/app/(admin)/users/[id].tsx` (MAJOR UPDATE)

- Convert read-only Text fields to editable TextInput for: first_name, last_name, email, phone
- Role picker (segmented buttons): student | admin | superadmin
- Superadmin promotion: only visible if current user is superadmin
- Save button with loading/success/error states
- Confirmation dialog for role changes
- View user's submission history (collapsible section)
- View user's event attendance (collapsible section)

### 2D. Application Review

**File:** `apps/mobile/app/(admin)/applications/[id].tsx` (MAJOR UPDATE)

- Full multi-step application viewer (scrollable, section headers)
- Status badge with current step indicator
- Approve / Reject buttons with confirmation
- Notes field for admin comments
- View applicant's responses in a clean, readable format

### 2E. Posts — Polish

**File:** `apps/mobile/src/components/PostCard.tsx`

- Tighten edit/delete icon spacing (gap: 0, marginRight: -8)
- Add subtle card shadow for depth
- Comment expand animation (height transition)
- Long-press to copy post text
- Pull-to-refresh on posts feed

### 2F. Chat Improvements

**Files:** Multiple chat files

1. **Pre-allocate selection count space** (`chat/new.tsx`)
   - Always render the count text; use opacity 0 when empty instead of conditional rendering
   - Prevents layout jump on first selection

2. **Keyboard return key fix** (`components/ChatInput.tsx`)
   - Change `returnKeyType` to `"default"` (not "send")
   - Remove `onSubmitEditing={handleSend}` — return creates newline
   - Add `multiline` prop to TextInput
   - Send button remains the only send trigger

3. **Keyboard overlap fix** (`chat/[id].tsx`)
   - Add `paddingBottom` using `useSafeAreaInsets().bottom`
   - Fine-tune `keyboardVerticalOffset` for different devices

4. **Dynamic group name in header** (`chat/[id].tsx`, `chat/_layout.tsx`)
   - Fetch group name from `chat_groups` table
   - Set via `<Stack.Screen options={{ title: groupName }} />`
   - Fallback to "Messages" while loading

5. **Smooth transitions** (`chat/index.tsx`)
   - Separate `loading` (initial) from `refreshing` (background) state
   - Only show full-screen loader on first load
   - Use `refreshing` for pull-to-refresh indicator

6. **Unread message indicator** (`chat/index.tsx`, `useChatGroups.ts`)
   - Compare `last_read_at` with latest message timestamp
   - Show black dot next to group name when unread
   - Update `last_read_at` when entering a thread
   - Requires DB migration (see Phase 9)

### 2G. Events Tab — Full CRUD (Admin)

**New Files:**
- `apps/mobile/app/(admin)/events/_layout.tsx` (if not exists)
- `apps/mobile/app/(admin)/events/index.tsx` (UPDATE — add FAB + admin actions)
- `apps/mobile/app/(admin)/events/[id].tsx` (UPDATE — add edit/delete)

**Deliverables:**
- Events list with SectionList grouped by date
- FAB (+) for creating new events → opens modal/sheet
- Create Event form: title, description, start/end datetime, location, uniform, type
- Date/time picker using `@react-native-community/datetimepicker`
- Edit event inline (toggle edit mode on detail page)
- Delete event with confirmation dialog
- Success/error feedback for all actions

### 2H. Profile Page — Full Overhaul

**File:** `apps/mobile/app/(admin)/profile.tsx` (ALREADY IMPLEMENTED — POLISH)

- Editable fields with save (done ✓)
- Notification preferences toggles (done ✓)
- Google Calendar connect/disconnect (done ✓)
- Add: avatar upload progress indicator
- Add: email verification status indicator
- Add: app version display at bottom
- Add: support/feedback link

**File:** `apps/mobile/app/(student)/profile.tsx` (UPDATE to match admin profile)

- Mirror the same editable fields + notification preferences from admin profile
- Add notification preferences section
- Add Google Calendar connection section

### 2I. Student Dashboard — Enhanced Stats

**File:** `apps/mobile/app/(student)/index.tsx`

- Add credits stat card alongside hours
- Add visual progress indicator (progress bar or ring) toward semester goals
- Show recent submissions (last 3) as preview cards
- Quick action: "Log Activity" button (prominent, uses primary color)
- Show upcoming events (next 2) as preview cards

### 2J. Resource Upload (Admin)

**File:** `apps/mobile/app/(admin)/resources.tsx` (UPDATE)

- FAB (+) opens file picker via `expo-document-picker`
- Upload to Supabase Storage `resources` bucket
- Show upload progress indicator
- Insert metadata row into `resources` table
- Success feedback + list refresh

---

## Phase 3: Web App — Core Polish

**Goal:** Elevate the web app's UI to senior designer standards with polished interactions, consistent spacing, and professional attention to detail.

### 3A. Dashboard Overhaul

**File:** `apps/web/src/app/admin/page.tsx`

- Admin KPI cards: Pending submissions, active ambassadors, upcoming events, new applications
- Activity feed: recent actions (approvals, new submissions, new users)
- Quick stats with trend indicators (↑ 12% from last week)
- Responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile

**File:** `apps/web/src/app/student/page.tsx`

- Progress toward semester goals (visual progress rings)
- Recent submission history with status badges
- Upcoming events (next 3)
- Quick action cards: Log Hours, View Events, Chat

### 3B. Table & List Views — Senior UX

**Files:** Multiple admin pages

- Add status filter chips with counts (All/Pending/Approved/Denied)
- Add search with debounce (250ms) across name, email, type
- Add column sorting (click header to sort)
- Paginate with 25 items/page + "Load More" or page numbers
- Add bulk selection checkboxes + batch approve/deny
- Add inline quick-approve/deny buttons on each row (icon buttons)
- Export to CSV button in toolbar
- Responsive: tables collapse to cards on mobile

### 3C. Skeleton Loading Screens

**Files:** All major pages

- Dashboard skeleton (stat card placeholders + activity feed placeholders)
- Table skeleton (header + shimmer rows)
- Chat skeleton (sidebar list + message area)
- Profile skeleton (avatar circle + text lines)
- Event list skeleton (date headers + card placeholders)
- Posts skeleton (avatar + text block placeholders)

### 3D. Toast Notification System

**Files:**
- `apps/web/src/components/ui/toast.tsx` (ADD via Shadcn)
- All pages that show alerts/feedback

**Deliverables:**
- Replace inline `alert()` calls with non-blocking toast notifications
- Success: green left-border toast, auto-dismiss 3s
- Error: red left-border toast, persistent until dismissed
- Info: neutral toast, auto-dismiss 5s
- Position: bottom-right on desktop, top-center on mobile
- Stack up to 3 toasts

### 3E. Empty States

**Files:** All list/grid pages

- Custom illustrated empty states (SVG illustrations or Lucide icon compositions)
- Actionable CTA: "No submissions yet — Log your first activity" with button
- Contextual messaging per page (not generic "No data" everywhere)

### 3F. Form UX Polish

**Files:** Submission forms, event forms, application form

- Inline validation with real-time error messages (red text below field)
- Smart defaults: pre-fill today's date, last-used service type
- Character count on textareas
- Styled date/time pickers (replace native inputs)
- Form error summary at top when submitting with errors
- Disable submit button during API call with spinner
- Success state: checkmark animation + redirect

### 3G. Navigation Polish

**Files:** Sidebar components, mobile nav

- Breadcrumb navigation on detail pages (Dashboard > Submissions > #1234)
- Active nav item indicator (left border bar, not just color change)
- Notification badges on nav items (Chat: unread count, Submissions: pending count)
- Keyboard shortcut: Cmd+K for global search/command palette
- Collapsible sidebar on desktop (icon-only mode)
- Smooth sidebar collapse animation

---

## Phase 4: Shared Feature Completion

**Goal:** Complete features that span both web and mobile platforms.

### 4A. Event System — Full CRUD Both Platforms

**Deliverables:**
- Create, edit, delete events (admin, both platforms)
- RSVP going/maybe/not going (student, both platforms)
- Event comments (both platforms)
- RSVP attendee list with counts per status
- Google Calendar sync on event create/update
- Event reminders via push notification (24h and 1h before)
- Calendar export (.ics file download on web)

### 4B. Chat — Feature Parity

**Deliverables:**
- Unread message counts per group (both platforms)
- Typing indicators (Supabase Realtime presence)
- Message reactions (emoji — start with 👍 ❤️ 😂 🎉)
- Image/file sharing in chat (upload to Supabase Storage)
- @mentions with autocomplete
- Message search within groups
- Group settings (rename, add/remove participants)

### 4C. Posts — Feature Parity

**Deliverables:**
- Post reactions (like/heart) beyond just comments
- Image attachments on posts (photo upload)
- Post pinning (admin can pin announcements to top)
- Rich text in posts (basic markdown: bold, italic, links)
- Real-time post updates via Supabase Realtime

### 4D. Push Notifications — Full Coverage

**Deliverables:**
- Submission approved/denied → notify student
- New chat message → notify group participants
- New post → notify all ambassadors
- Event reminder → notify RSVPed attendees
- Application status change → notify applicant
- Respect notification preferences per user
- Notification history/center (in-app list of past notifications)

### 4E. Application Pipeline — Admin

**Deliverables (web):**
- Kanban board view (Draft | Submitted | Under Review | Approved | Rejected)
- Drag cards between columns to update status
- Application scoring rubric (structured fields for admin evaluation)
- Interview scheduling (date/time picker + notify applicant)
- Bulk approve/reject selected applications

**Deliverables (mobile):**
- Application list with filter tabs
- Application detail with full response viewer
- Approve/reject with notes

---

## Phase 5: Performance & Reliability

**Goal:** Make the app fast, reliable, and resilient to poor network conditions.

### 5A. API & Data Layer

- Request deduplication (prevent double-fetches on component re-mount)
- Optimistic UI updates for: post create/edit/delete, RSVP, chat send, submission create
- Stale-while-revalidate pattern for lists (show cached data, refresh in background)
- Pagination on all list endpoints (25 items default, cursor-based for chat)
- API response caching with TTL (submissions: 30s, events: 60s, profile: 5m)

### 5B. Image & Asset Optimization

**Web:**
- Use Next.js `<Image>` component for all avatars and uploads (lazy loading, blur placeholder)
- WebP format for uploaded images
- CDN cache headers on Supabase Storage

**Mobile:**
- Use `expo-image` for fast image loading with caching
- Thumbnail generation for uploaded images
- Progressive image loading (blur → full)

### 5C. Bundle & Load Performance

**Web:**
- Analyze bundle with `@next/bundle-analyzer`
- Lazy-load heavy components (FormBuilder, calendar views, charts)
- Code-split admin vs student routes
- Prefetch on hover for likely navigation targets

**Mobile:**
- Lazy-load screens that aren't in the initial tab set
- Minimize re-renders with React.memo on list items
- Use FlatList/SectionList for all lists (not ScrollView with map)

### 5D. Offline & Network Resilience

**Mobile:**
- Cache critical data in AsyncStorage (user profile, recent submissions, events)
- Show cached data when offline with "Offline" banner
- Queue mutations when offline, sync when back online
- Network status monitoring with auto-reconnect for Realtime

**Web:**
- Service worker caching for assets and API responses
- Offline indicator banner
- Retry failed requests with exponential backoff

### 5E. Error Handling & Recovery

- Global error boundary on web (friendly fallback UI with retry)
- Per-screen error boundary on mobile (retry button)
- Toast/snackbar for non-fatal errors
- Structured error logging (source, message, stack, user context)
- Retry logic for transient failures (network timeouts, 503s)
- Graceful degradation when optional services fail (Calendar, push, AI chat)

---

## Phase 6: Advanced Features

**Goal:** Differentiate the app with power-user features that make it genuinely indispensable.

### 6A. Dark Mode

**Web:**
- Toggle in sidebar/profile using existing `darkMode: ["class"]` config
- Persist preference in localStorage and sync to DB
- CSS variables already define dark palette — wire up the toggle
- Animated transition between modes (150ms fade)

**Mobile:**
- Toggle in profile settings
- Use React Native Paper's `MD3DarkTheme` as base
- System preference detection (`useColorScheme`)
- Persist preference in AsyncStorage

### 6B. Analytics Dashboard (Admin)

**Web only (desktop-optimized):**
- Submission trends chart (line/bar — submissions per week/month)
- Service type breakdown (donut chart)
- Ambassador leaderboard (opt-in, privacy-conscious)
- Calendar heatmap (GitHub-style) showing submission density
- Event attendance metrics (avg RSVPs, show-up rate)
- Application funnel (submitted → reviewed → approved → active)
- Export reports to PDF

### 6C. Global Search / Command Palette

**Web:**
- Cmd+K to open (or click search icon in nav)
- Search across: users, submissions, events, posts, resources
- Recent searches + suggested actions
- Keyboard navigation within results
- Quick actions: "Create Event", "View Pending Submissions", etc.

### 6D. Onboarding

**Both platforms:**
- First-time user tour highlighting key features (4-5 steps)
- Admin onboarding checklist: "Connect Calendar", "Invite ambassadors", "Create first event"
- Student onboarding: "Complete your profile", "Log your first hours", "Check upcoming events"
- Dismissible, with "Show again" option in settings

### 6E. Audit Log (Admin)

**Web:**
- Track: submission approvals/denials, role changes, user edits, event changes
- Searchable log with filters (date range, action type, actor)
- Display in admin settings page
- Stored in `audit_log` table (see migrations)

### 6F. Session Management

- Session expiry warning (modal 5 minutes before JWT expires)
- "Stay signed in" button to refresh session
- Auto-refresh JWT in background (if tab is active)
- Force logout on all devices (invalidate all sessions for user)

---

## Phase 7: Testing, Security & Launch Prep

**Goal:** Ensure the app is secure, well-tested, and ready for production deployment.

### 7A. Testing Strategy

**Web (Vitest + Playwright):**
- Unit tests for utility functions and server actions
- Integration tests for API routes (auth, submissions, events, chat)
- E2E tests for critical flows: login → dashboard → submit hours → logout
- E2E tests for admin flows: login → review submission → approve/deny
- Target: 80% coverage on API routes, 60% overall

**Mobile (Jest + Detox or Maestro):**
- Unit tests for all 14 hooks
- Component tests for shared components (PostCard, MessageBubble, StatusBadge)
- E2E tests for: login → dashboard → log activity → view history
- E2E tests for: admin login → view submissions → approve

### 7B. Security Hardening

- ARIA labels audit on all interactive elements
- CSRF protection on all mutation endpoints
- Rate limiting on auth endpoints (5 attempts/minute)
- Input sanitization on all user-generated content (XSS prevention)
- SQL injection prevention (already handled by Supabase parameterized queries)
- Secure headers (CSP, HSTS, X-Frame-Options)
- Secrets audit (ensure no keys in client bundles)
- Session fixation prevention
- Superadmin escalation protection (already implemented — verify)

### 7C. Accessibility (WCAG 2.1 AA)

**Web:**
- ARIA labels on all interactive elements
- Full keyboard navigation (tab order, focus rings, escape-to-close)
- Focus trap in modals and dialogs
- Screen reader announcements for dynamic content (live regions)
- Color contrast audit (minimum 4.5:1 for text)
- Touch target sizing (minimum 44x44px on mobile views)
- Alt text for all images
- Skip-to-content link
- Reduced motion support (`prefers-reduced-motion`)

**Mobile:**
- `accessibilityLabel` on all touchable elements
- `accessibilityRole` on semantic elements
- VoiceOver (iOS) and TalkBack (Android) testing
- Minimum touch target 44x44pt

### 7D. Deployment & CI/CD

**Web:**
- Vercel deployment with preview branches
- GitHub Actions: lint, type-check, test on PR
- Automatic Lighthouse audits on preview deploys
- Environment variable validation at build time

**Mobile:**
- EAS Build profiles: development (simulator), preview (internal), production
- EAS Update for OTA JavaScript updates
- App Store / Play Store submission checklist
- Beta testing via TestFlight (iOS) and Internal Testing (Android)

### 7E. Documentation

- Update CLAUDE.md with any architectural changes
- API documentation (endpoint list with request/response examples)
- Component documentation (props, usage examples)
- Deployment runbook (step-by-step for web and mobile releases)
- Database migration runbook

---

## Database Migrations

### Migration 1: `20260303_add_last_read_at_to_chat_participants.sql`
```sql
ALTER TABLE chat_participants
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT NOW();
```

### Migration 2: `20260303_create_notification_preferences.sql`
```sql
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  chat_messages BOOLEAN DEFAULT TRUE,
  new_posts BOOLEAN DEFAULT TRUE,
  post_comments BOOLEAN DEFAULT TRUE,
  event_comments BOOLEAN DEFAULT TRUE,
  event_reminders BOOLEAN DEFAULT TRUE,
  submission_updates BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());
```

### Migration 3: `20260303_create_audit_log.sql`
```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log"
  ON audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('admin', 'superadmin')
    )
  );
```

### Migration 4: `20260303_add_notification_tracking.sql`
```sql
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());
```

### Migration 5: `20260303_add_post_reactions.sql`
```sql
CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL DEFAULT 'like',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id, reaction)
);

CREATE INDEX idx_post_reactions_post ON post_reactions(post_id);

ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
  ON post_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own reactions"
  ON post_reactions FOR ALL
  USING (user_id = auth.uid());
```

### Migration 6: `20260303_add_message_reactions.sql`
```sql
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES public.chat_messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  reaction TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(message_id, user_id, reaction)
);

ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view reactions"
  ON message_reactions FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own reactions"
  ON message_reactions FOR ALL
  USING (user_id = auth.uid());
```

---

## File Change Summary

### New Files (~25-30)

**Shared Packages:**
- `packages/config/tokens.ts` — unified design tokens

**Mobile (New):**
- `apps/mobile/src/components/SkeletonScreen.tsx`
- `apps/mobile/src/components/Toast.tsx`
- `apps/mobile/src/components/ProgressRing.tsx`
- `apps/mobile/src/components/UnreadBadge.tsx`
- `apps/mobile/src/hooks/useOfflineCache.ts`
- `apps/mobile/src/hooks/useNotifications.ts` (in-app notification center)

**Web (New):**
- `apps/web/src/components/CommandPalette.tsx`
- `apps/web/src/components/Breadcrumb.tsx`
- `apps/web/src/components/SkeletonDashboard.tsx`
- `apps/web/src/components/SkeletonTable.tsx`
- `apps/web/src/components/EmptyState.tsx`
- `apps/web/src/components/AuditLog.tsx`
- `apps/web/src/components/AnalyticsCharts.tsx`

**Database:**
- `supabase/migrations/20260303_add_last_read_at_to_chat_participants.sql`
- `supabase/migrations/20260303_create_notification_preferences.sql`
- `supabase/migrations/20260303_create_audit_log.sql`
- `supabase/migrations/20260303_add_notification_tracking.sql`
- `supabase/migrations/20260303_add_post_reactions.sql`
- `supabase/migrations/20260303_add_message_reactions.sql`

**Tests:**
- `apps/web/src/__tests__/api/submissions.test.ts`
- `apps/web/src/__tests__/api/events.test.ts`
- `apps/web/src/__tests__/api/chat.test.ts`
- `apps/mobile/src/__tests__/hooks/*.test.ts`

### Modified Files (~30-40)

**Mobile:**
- `apps/mobile/src/lib/theme.ts` — token system integration
- `apps/mobile/app/(admin)/_layout.tsx` — nav badge counts
- `apps/mobile/app/(admin)/index.tsx` — enhanced dashboard
- `apps/mobile/app/(admin)/submissions/[id].tsx` — approval workflow
- `apps/mobile/app/(admin)/users/[id].tsx` — inline editing
- `apps/mobile/app/(admin)/applications/[id].tsx` — review UX
- `apps/mobile/app/(admin)/chat/new.tsx` — layout fix
- `apps/mobile/app/(admin)/chat/[id].tsx` — keyboard fix, header
- `apps/mobile/app/(admin)/chat/index.tsx` — smooth transitions, unread dot
- `apps/mobile/app/(admin)/events/index.tsx` — create event
- `apps/mobile/app/(admin)/events/[id].tsx` — edit/delete
- `apps/mobile/app/(admin)/resources.tsx` — upload flow
- `apps/mobile/app/(admin)/profile.tsx` — polish
- `apps/mobile/app/(student)/index.tsx` — enhanced stats
- `apps/mobile/app/(student)/profile.tsx` — notification prefs
- `apps/mobile/src/components/PostCard.tsx` — icon spacing, reactions
- `apps/mobile/src/components/ChatInput.tsx` — multiline fix
- `apps/mobile/src/components/MessageBubble.tsx` — reactions
- `apps/mobile/src/hooks/useChatGroups.ts` — unread tracking
- `apps/mobile/src/hooks/useChatMessages.ts` — reactions, typing

**Web:**
- `apps/web/src/app/admin/page.tsx` — KPI dashboard
- `apps/web/src/app/student/page.tsx` — progress dashboard
- `apps/web/src/app/globals.css` — token alignment
- Multiple admin pages — table polish, skeletons, toasts
- Multiple API routes — pagination, rate limiting

---

## Priority Order (Recommended Execution)

| Priority | Phase | Effort | Impact |
|----------|-------|--------|--------|
| 1 | 2F (Chat fixes) | Small | High — fixes usability bugs |
| 2 | 2B (Submission approval) | Medium | Critical — core admin workflow |
| 3 | 2E (Posts polish) | Small | Medium — visual quality |
| 4 | 2C (User editing) | Medium | High — admin productivity |
| 5 | 2A (Nav restructure) | Small | Medium — cleaner navigation |
| 6 | 3D (Toast system) | Small | High — better feedback UX |
| 7 | 3C (Skeleton screens) | Medium | High — perceived performance |
| 8 | 2G (Events CRUD) | Large | High — missing core feature |
| 9 | 1A (Design tokens) | Medium | Foundation — enables consistency |
| 10 | 4D (Push notifications) | Medium | High — engagement |
| 11 | 5E (Error handling) | Medium | High — reliability |
| 12 | 3B (Table UX) | Large | High — admin power-user needs |
| 13 | 6A (Dark mode) | Medium | Medium — user request |
| 14 | 4B (Chat features) | Large | Medium — nice-to-have |
| 15 | 6B (Analytics) | Large | Medium — admin insight |
| 16 | 7A (Testing) | Large | Critical — confidence |
| 17 | 7C (Accessibility) | Large | Critical — compliance |

---

## Design Principles

1. **Consistency over novelty** — Every screen should feel like it belongs to the same app. Use the token system religiously.
2. **Feedback for every action** — Users should never wonder "did that work?" Toasts, animations, and state transitions confirm every interaction.
3. **Progressive disclosure** — Show the most important information first. Details on demand (expand, modal, drill-down).
4. **Mobile-first, desktop-enhanced** — Design for the phone screen first, then enhance for desktop with more columns and power-user features.
5. **Accessible by default** — Accessibility is not an afterthought. Every component should be keyboard-navigable and screen-reader friendly from day one.
6. **Graceful degradation** — If a feature fails (Calendar sync, push notifications, AI chat), the rest of the app should work perfectly.
7. **Fast perceived performance** — Use skeletons, optimistic updates, and prefetching to make the app feel instant even when the network is slow.
8. **Minimal, purposeful animation** — Animation should guide attention and confirm actions, never distract. Keep transitions under 350ms.
