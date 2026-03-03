# Admin Dashboard Mobile Improvements - Implementation Plan

## Overview
Comprehensive improvements to the mobile admin experience across 9 feature areas: navigation, dashboard, user management, posts, chat (6 sub-items), events (new tab with full CRUD), profile (edit + notifications + Google Calendar).

---

## Phase 1: Navigation & Dashboard Restructure

### 1A. Bottom Navigation Changes
**File:** `apps/mobile/app/(admin)/_layout.tsx`

- Remove `Submissions`, `Users`, and `Resources` tabs from the visible tab bar (set `href: null` to hide them while keeping routes accessible)
- Add new `Events` tab (pointing to new `events` directory)
- Final 5-tab layout: **Dashboard | Events | Posts | Chat | Profile**

### 1B. Dashboard Page Restructure
**File:** `apps/mobile/app/(admin)/index.tsx`

- Make the **Users stat card** tappable (wrap with `onPress`) with a chevron-right arrow on the right side, navigating to `/(admin)/users`
- Remove the **Users card** from Quick Access section
- Add a **Resources card** to Quick Access (with folder icon, navigating to `/(admin)/resources`)
- Keep Submissions and Applications in Quick Access

---

## Phase 2: User Detail - Inline Editing
**File:** `apps/mobile/app/(admin)/users/[id].tsx`

- Convert read-only Text fields to editable `TextInput` components for: first_name, last_name, email, phone
- Add a **role picker** (dropdown/segmented buttons) for changing role (student/admin/superadmin)
- Add a **Save** button at the bottom that calls `supabase.from('users').update(...)` with the edited fields
- Add loading/success/error states for the save operation
- Protect superadmin promotion (only allow if current user is superadmin)

---

## Phase 3: Posts - Icon Spacing Fix
**File:** `apps/mobile/src/components/PostCard.tsx`

- In the `styles.actions` style, add `gap: 0` and `marginRight: -8` to bring edit + delete icons closer together on the right
- Reduce IconButton padding so they sit tightly together
- Consider slightly smaller icon sizes or a more compact button style for a "fresher" look

---

## Phase 4: Chat Improvements (6 sub-items)

### 4A. New Chat - Pre-allocate Space for Selection Count
**File:** `apps/mobile/app/(admin)/chat/new.tsx`

- Change the conditional `{selected.length > 0 && (...)}` (line 113-117) to always render the text element
- When 0 selected, show invisible placeholder text (same height) or show "0 selected" in a muted color
- This prevents the user list from jumping down when first selection is made

### 4B. Chat Input - Keyboard Return Key Fix
**File:** `apps/mobile/src/components/ChatInput.tsx`

- Remove `returnKeyType="send"` (line 36) — use `returnKeyType="default"` so iOS shows the standard return key
- Remove `onSubmitEditing={handleSend}` (line 35) — pressing return should create a newline, not send
- Add `multiline` prop to the TextInput so users can type multi-line messages
- The blue send IconButton remains the only way to send

### 4C. Chat Thread - Keyboard Overlap Fix
**File:** `apps/mobile/app/(admin)/chat/[id].tsx`

- Add `paddingBottom` to the ChatInput container to account for safe area insets
- In `ChatInput.tsx`, add bottom padding using `useSafeAreaInsets().bottom` to ensure the text input border isn't overlapped by the keyboard
- Fine-tune `keyboardVerticalOffset` if needed (currently `insets.top + 44`)

### 4D. Chat Header - Show Group Name
**Files:**
- `apps/mobile/app/(admin)/chat/[id].tsx` — fetch group name and set it via `Stack.Screen` options
- `apps/mobile/app/(admin)/chat/_layout.tsx` — change `[id]` default title

- In `[id].tsx`, fetch the chat group name from supabase (query `chat_groups` by id) and use `<Stack.Screen options={{ title: groupName }} />` to dynamically set the header
- Fall back to "Messages" while loading

### 4E. Chat List - Smooth Transitions (No Loading Flash)
**File:** `apps/mobile/app/(admin)/chat/index.tsx`

- Separate `loading` (initial) from `refreshing` (background refetch) state
- In `useFocusEffect` callback, use a silent refetch that doesn't trigger the loading spinner
- Only show `<LoadingScreen />` on true initial load (when `groups.length === 0 && loading`)
- Use `refreshing` state for `RefreshControl` instead of `loading`
- May need to update `useChatGroups` hook to expose a separate `refreshing` state

### 4F. Chat List - Unread Message Indicator (Blue Dot)
**DB Migration:** New migration to add `last_read_at` column to `chat_participants`
```sql
ALTER TABLE chat_participants
ADD COLUMN last_read_at TIMESTAMPTZ DEFAULT NOW();
```

**Files to modify:**
- `apps/mobile/src/hooks/useChatGroups.ts` — include `last_read_at` in query, compare with last message timestamp
- `apps/mobile/app/(admin)/chat/index.tsx` — render blue dot next to group name when unread
- `apps/mobile/app/(admin)/chat/[id].tsx` — update `last_read_at` when entering a chat thread

**Logic:**
- When fetching chat groups, also fetch user's `last_read_at` from `chat_participants`
- Compare `last_read_at` with `lastMessage.created_at` — if message is newer, show blue dot
- When user opens a chat thread, update their `last_read_at` to `NOW()`

---

## Phase 5: Events Tab (New - Full CRUD)

### 5A. File Structure
Create new directory: `apps/mobile/app/(admin)/events/`
- `_layout.tsx` — Stack navigator (Events list, Event Detail, Create Event)
- `index.tsx` — Events list (adapted from student version, add FAB for creating)
- `[id].tsx` — Event detail with RSVP, comments (adapted from student version, add edit/delete)

### 5B. Events List (index.tsx)
- Reuse `useEvents` hook from `src/hooks/useEvents.ts`
- Same SectionList grouped by date as student version
- Add FAB (+) button for creating new events (opens bottom sheet modal)
- Add ability to delete events (swipe or long-press)

### 5C. Event Detail ([id].tsx)
- Same as student event detail (RSVP, comments, attendees)
- Add edit capability for admin (edit title, description, date/time, location)
- Add delete button

### 5D. Create Event (Bottom Sheet Modal)
- New component or use `presentation: 'modal'` in Stack
- Form fields: title, description, start date/time, end date/time, location, uniform, type
- Use `@react-native-community/datetimepicker` or similar for date/time selection
- On submit, insert into `events` table via supabase

---

## Phase 6: Profile Page Overhaul

### 6A. Editable Profile Fields
**File:** `apps/mobile/app/(admin)/profile.tsx`

- Convert read-only display to editable `TextInput` fields for: first_name, last_name, email, phone
- Add a **Save** button that updates via `supabase.from('users').update(...)`
- Show success/error feedback (Snackbar or Alert)

### 6B. Notification Preferences
**DB Migration:** New `notification_preferences` table
```sql
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  chat_messages BOOLEAN DEFAULT TRUE,
  new_posts BOOLEAN DEFAULT TRUE,
  post_comments BOOLEAN DEFAULT TRUE,
  event_comments BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON notification_preferences FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own preferences" ON notification_preferences FOR ALL USING (user_id = auth.uid());
```

**New hook:** `apps/mobile/src/hooks/useNotificationPreferences.ts`
- Fetch/upsert notification preferences for the current user

**Profile UI additions:**
- Section titled "Notifications" with 4 toggle switches:
  - Chat Messages (group chats I'm in)
  - New Posts
  - Comments on My Posts
  - Event Comments
- Each toggle calls the hook to update the preference in DB

### 6C. Google Calendar Connection
**New dependency:** `expo-web-browser` (for opening Google OAuth in browser)

**New API routes on web server:**
- Modify the existing `/api/auth/google/student/route.ts` to also accept admin role (or create parallel admin routes)
- The callback route redirects back to the app via deep link (`ambo://gcal-callback`)

**New hook:** `apps/mobile/src/hooks/useGoogleCalendar.ts`
- Check connection status via `supabase.from('users').select('calendar_tokens')`
- Connect: open Google OAuth URL in browser using `expo-web-browser`
- Disconnect: set `calendar_tokens` to null

**Profile UI additions:**
- Section titled "Integrations" with Google Calendar card
- Shows connected/disconnected status
- Connect/Disconnect button

---

## Phase 7: Database Migrations

Two new SQL migration files:

1. `supabase/migrations/20260303_add_last_read_at_to_chat_participants.sql`
   - Adds `last_read_at TIMESTAMPTZ DEFAULT NOW()` to `chat_participants`

2. `supabase/migrations/20260303_create_notification_preferences.sql`
   - Creates `notification_preferences` table with RLS policies

---

## File Change Summary

### New Files (~12)
- `apps/mobile/app/(admin)/events/_layout.tsx`
- `apps/mobile/app/(admin)/events/index.tsx`
- `apps/mobile/app/(admin)/events/[id].tsx`
- `apps/mobile/src/hooks/useNotificationPreferences.ts`
- `apps/mobile/src/hooks/useGoogleCalendar.ts`
- `supabase/migrations/20260303_add_last_read_at_to_chat_participants.sql`
- `supabase/migrations/20260303_create_notification_preferences.sql`

### Modified Files (~12)
- `apps/mobile/app/(admin)/_layout.tsx` — nav restructure
- `apps/mobile/app/(admin)/index.tsx` — dashboard changes
- `apps/mobile/app/(admin)/users/[id].tsx` — inline editing
- `apps/mobile/src/components/PostCard.tsx` — icon spacing
- `apps/mobile/app/(admin)/chat/new.tsx` — selection count spacing
- `apps/mobile/src/components/ChatInput.tsx` — keyboard fix
- `apps/mobile/app/(admin)/chat/[id].tsx` — keyboard overlap + header + update last_read_at
- `apps/mobile/app/(admin)/chat/_layout.tsx` — dynamic title
- `apps/mobile/app/(admin)/chat/index.tsx` — smooth transitions + unread dot
- `apps/mobile/src/hooks/useChatGroups.ts` — unread tracking
- `apps/mobile/app/(admin)/profile.tsx` — editable + notifications + gcal
- `apps/mobile/package.json` — add expo-web-browser

### Possibly Modified
- `apps/web/src/app/api/auth/google/student/route.ts` — accept admin role for mobile OAuth
- `apps/web/src/app/api/auth/google/student/callback/route.ts` — deep link redirect for mobile
