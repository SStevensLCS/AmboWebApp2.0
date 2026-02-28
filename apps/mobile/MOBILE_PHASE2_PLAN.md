# Mobile App Phase 2 — Feature Implementation Plan

> **Status:** Planning complete, ready for implementation
> **Prerequisite:** Phase 1 (Core MVP) is complete — Dashboard, Events, Submissions, Profile for both student and admin roles are built and working.

---

## Architecture Context

- **Framework:** React Native + Expo (SDK 55) with Expo Router (file-based routing)
- **UI Library:** React Native Paper (Material Design) — already installed and configured
- **Data Layer:** Supabase direct queries via `apps/mobile/src/lib/supabase.ts` (anon key, RLS enforced)
- **Shared Types:** `@ambo/database` package (`User`, `Submission`, `EventDetails`, `SERVICE_TYPES`, etc.)
- **Auth:** `apps/mobile/src/providers/AuthProvider.tsx` provides `session`, `userRole`, `signIn`, `signOut`
- **Monorepo:** npm workspaces, Metro configured with `extraNodeModules` proxy for hoisted packages

### Existing File Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx              # Root: AuthProvider + PaperProvider
│   ├── index.tsx                # Auth redirect
│   ├── (auth)/                  # Login/Register
│   ├── (student)/
│   │   ├── _layout.tsx          # Tabs: Dashboard, Events, Chat, Profile
│   │   ├── index.tsx            # Dashboard (stats, submissions, filters)
│   │   ├── new-submission.tsx   # New submission form
│   │   ├── events/              # Events list + [id] detail
│   │   ├── chat.tsx             # "Coming Soon" placeholder
│   │   └── profile.tsx          # User info, sign out
│   └── (admin)/
│       ├── _layout.tsx          # Tabs: Dashboard, Submissions, Users, Chat, Profile
│       ├── index.tsx            # Dashboard (stats, quick access)
│       ├── submissions/         # List + [id] detail (approve/deny)
│       ├── users/               # List + [id] detail
│       ├── chat.tsx             # "Coming Soon" placeholder
│       └── profile.tsx          # User info, sign out
├── src/
│   ├── components/              # StatusBadge, RoleBadge, EmptyState, LoadingScreen, ComingSoon
│   ├── hooks/                   # useSubmissions, useEvents, useEventDetail, useUsers, useProfile
│   ├── lib/
│   │   ├── supabase.ts          # Supabase client (anon key + AsyncStorage)
│   │   └── theme.ts             # Paper theme + status/role colors
│   └── providers/
│       └── AuthProvider.tsx     # Auth context
```

---

## Phase 9: Posts + Comments

**Priority:** High — Core social feature used daily by both students and admins

### Database Tables

| Table | Key Columns | Notes |
|-------|------------|-------|
| `posts` | id, user_id, content, created_at, updated_at | FK to `users` |
| `comments` | id, post_id, user_id, content, created_at, updated_at | FK to `posts` and `users` |

### Supabase Queries

```typescript
// Fetch posts with author info + comment count
supabase.from('posts')
  .select('*, users(first_name, last_name, avatar_url, role), comments(count)')
  .order('created_at', { ascending: false })

// Fetch comments for a post
supabase.from('comments')
  .select('*, users(first_name, last_name, avatar_url, role)')
  .eq('post_id', postId)
  .order('created_at', { ascending: true })

// Create post
supabase.from('posts').insert({ user_id, content })

// Create comment
supabase.from('comments').insert({ post_id, user_id, content })

// Edit post/comment
supabase.from('posts').update({ content }).eq('id', postId)
supabase.from('comments').update({ content }).eq('id', commentId)

// Delete post/comment
supabase.from('posts').delete().eq('id', postId)
supabase.from('comments').delete().eq('id', commentId)
```

### Permission Model

| Action | Student | Admin | Superadmin |
|--------|---------|-------|------------|
| Create post | Own | Own | Own |
| Edit post | Own only | Own + student posts | Any |
| Delete post | Own only | Own + student posts | Any |
| Create comment | Own | Own | Own |
| Edit comment | Own only | Own + student comments | Any |
| Delete comment | Own only | Own + student comments | Any |

### Screens to Build

**1. Posts tab (both student and admin)**
- Add "Posts" tab to both `(student)/_layout.tsx` and `(admin)/_layout.tsx`
- Icon: `message-text-outline` (MaterialCommunityIcons)

**2. Posts feed screen** — `(student)/posts.tsx` and `(admin)/posts.tsx`
- Create post card at top: TextInput + "Post" button
- FlatList of post cards below
- Pull-to-refresh

**3. Post card component** — `src/components/PostCard.tsx`
- Author avatar (Paper `Avatar`), name, timestamp
- Post content text
- "Comments (N)" button to expand/collapse
- Edit/Delete icons (based on permissions)
- Inline edit mode: TextInput replaces content

**4. Comment thread** — Rendered inline below PostCard when expanded
- List of comments with author info
- Reply input at bottom
- Edit/Delete per comment (based on permissions)

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/usePosts.ts` | Fetch posts, create/edit/delete post |
| `src/hooks/useComments.ts` | Fetch/create/edit/delete comments for a post |
| `src/components/PostCard.tsx` | Post card with author, content, actions |
| `app/(student)/posts.tsx` | Student posts feed screen |
| `app/(admin)/posts.tsx` | Admin posts feed screen (or new tab) |

### Files to Modify

| File | Change |
|------|--------|
| `app/(student)/_layout.tsx` | Add Posts tab |
| `app/(admin)/_layout.tsx` | Add Posts tab |

---

## Phase 10: Chat (Realtime Messaging)

**Priority:** High — Replaces "Coming Soon" placeholder, most complex feature

### Database Tables

| Table | Key Columns | Notes |
|-------|------------|-------|
| `chat_groups` | id, name, created_by, created_at, updated_at | Group metadata |
| `chat_participants` | group_id, user_id, joined_at | Composite PK |
| `chat_messages` | id, group_id, sender_id, content, created_at | FK to group + user |

### Supabase Queries

```typescript
// Fetch groups the user participates in
supabase.from('chat_participants')
  .select('group_id, chat_groups(id, name, created_by, created_at, updated_at)')
  .eq('user_id', userId)

// Fetch participants for a group
supabase.from('chat_participants')
  .select('user_id, users(id, first_name, last_name, avatar_url)')
  .eq('group_id', groupId)

// Fetch messages
supabase.from('chat_messages')
  .select('*, users:sender_id(first_name, last_name, avatar_url)')
  .eq('group_id', groupId)
  .order('created_at', { ascending: true })

// Send message
supabase.from('chat_messages').insert({ group_id, sender_id, content })

// Create group
supabase.from('chat_groups').insert({ name, created_by }).select().single()
// Then insert participants:
supabase.from('chat_participants').insert(participantRows)

// Realtime subscription
supabase.channel(`chat:${groupId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'chat_messages',
    filter: `group_id=eq.${groupId}`,
  }, (payload) => { /* append new message */ })
  .subscribe()
```

### Key Patterns

- **Optimistic updates:** Show sent message immediately, replace with server response
- **Realtime:** Subscribe to `chat_messages` INSERT events per group
- **Group naming:** If no name set, display participant first names (exclude self)
- **Cleanup:** Unsubscribe from channel on unmount or group change

### Screens to Build

**1. Chat group list** — `(student)/chat/index.tsx` and `(admin)/chat/index.tsx`
- FlatList of groups with name/participants and last activity date
- FAB or header button to create new group
- Tap navigates to message thread

**2. Message thread** — `(student)/chat/[id].tsx` and `(admin)/chat/[id].tsx`
- FlatList (inverted or with auto-scroll) of message bubbles
- Own messages right-aligned (blue), others left-aligned (gray)
- Sender avatar + name on other's messages
- TextInput + send button at bottom
- KeyboardAvoidingView for proper keyboard handling
- Realtime subscription active while screen is focused

**3. Create group** — `(student)/chat/new.tsx` and `(admin)/chat/new.tsx`
- Search users by name
- Multi-select participants
- Optional group name input
- Create button

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useChatGroups.ts` | Fetch groups, create group |
| `src/hooks/useChatMessages.ts` | Fetch messages, send message, realtime subscription |
| `src/components/MessageBubble.tsx` | Chat message bubble (own vs other styling) |
| `src/components/ChatInput.tsx` | TextInput + send button bar |
| `app/(student)/chat/index.tsx` | Student chat group list |
| `app/(student)/chat/[id].tsx` | Student message thread |
| `app/(student)/chat/new.tsx` | Student create group |
| `app/(student)/chat/_layout.tsx` | Stack navigator for chat screens |
| `app/(admin)/chat/index.tsx` | Admin chat group list |
| `app/(admin)/chat/[id].tsx` | Admin message thread |
| `app/(admin)/chat/new.tsx` | Admin create group |
| `app/(admin)/chat/_layout.tsx` | Stack navigator for chat screens |

### Files to Modify

| File | Change |
|------|--------|
| `app/(student)/_layout.tsx` | Change chat from single file to directory route |
| `app/(admin)/_layout.tsx` | Change chat from single file to directory route |

### Files to Delete

| File | Reason |
|------|--------|
| `app/(student)/chat.tsx` | Replaced by `chat/` directory |
| `app/(admin)/chat.tsx` | Replaced by `chat/` directory |

---

## Phase 11: Resources (File Library)

**Priority:** Medium — Simple read + download for students, upload for admins

### Database Tables

| Table | Key Columns | Notes |
|-------|------------|-------|
| `resources` | id, title, description, file_url, file_type, file_size, uploaded_by, created_at | Metadata for uploaded files |

### Storage

- **Bucket:** `resources/` in Supabase Storage
- **Public URLs:** Generated with `supabase.storage.from('resources').getPublicUrl(path)`

### Supabase Queries

```typescript
// Fetch all resources
supabase.from('resources')
  .select('*')
  .order('created_at', { ascending: false })

// Upload file (admin)
supabase.storage.from('resources').upload(filePath, file)
// Then insert metadata:
supabase.from('resources').insert({ title, description, file_url, file_type, file_size, uploaded_by })

// Delete resource (admin)
supabase.storage.from('resources').remove([filePath])
supabase.from('resources').delete().eq('id', resourceId)
```

### Screens to Build

**1. Student resources** — `(student)/resources.tsx`
- FlatList of resource cards (read-only)
- Each card: file type icon, title, description, size, date
- Download button opens URL via `Linking.openURL(publicUrl)`

**2. Admin resources** — `(admin)/resources.tsx` (new tab or accessible from dashboard)
- Same list as student + upload FAB
- Upload flow: `expo-document-picker` → upload to bucket → save metadata
- Delete button per resource (with confirmation)

### Dependencies to Install

```bash
npm install expo-document-picker expo-file-system --workspace=apps/mobile
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useResources.ts` | Fetch resources, upload, delete |
| `src/components/ResourceCard.tsx` | Mobile resource card (title, icon, download) |
| `app/(student)/resources.tsx` | Student resources screen |
| `app/(admin)/resources.tsx` | Admin resources screen (or new tab) |

### Files to Modify

| File | Change |
|------|--------|
| `app/(student)/_layout.tsx` | Optionally add Resources tab, or access from Dashboard |
| `app/(admin)/_layout.tsx` | Optionally add Resources tab |

---

## Phase 12: Profile Enhancements

**Priority:** Medium — Polish, avatar upload

### Avatar Upload

**Dependencies:**
```bash
npm install expo-image-picker --workspace=apps/mobile
```

**Flow:**
1. Tap avatar → `expo-image-picker` to select/take photo
2. Upload to Supabase `avatars/` bucket with filename = `userId`
3. Update `users.avatar_url` in database
4. Refresh local profile state

**Supabase Queries:**
```typescript
// Upload avatar
supabase.storage.from('avatars').upload(`${userId}.jpg`, file, { upsert: true })

// Get public URL
supabase.storage.from('avatars').getPublicUrl(`${userId}.jpg`)

// Update user record
supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId)
```

### Files to Create

| File | Purpose |
|------|---------|
| `src/components/AvatarUpload.tsx` | Tappable avatar with image picker + upload |

### Files to Modify

| File | Change |
|------|--------|
| `app/(student)/profile.tsx` | Replace static Avatar with AvatarUpload component |
| `app/(admin)/profile.tsx` | Replace static Avatar with AvatarUpload component |

---

## Phase 13: Applications Management (Admin Only)

**Priority:** Lower — Complex admin feature, less critical on mobile

### Database Tables

| Table | Key Columns | Notes |
|-------|------------|-------|
| `applications` | phone_number (PK), status, current_step, first_name, last_name, email, grade_current, grade_entry, gpa, transcript_url, + 9 questionnaire fields, created_at, updated_at | 30+ fields |

**Status enum:** `draft` | `submitted` | `approved` | `rejected`

### Supabase Queries

```typescript
// Fetch all applications
supabase.from('applications')
  .select('*')
  .order('created_at', { ascending: false })

// Update application status
supabase.from('applications')
  .update({ status, updated_at: new Date().toISOString() })
  .eq('id', applicationId)
```

### Screens to Build

**1. Applications list** — `(admin)/applications/index.tsx`
- Searchable list (name, email, phone)
- Filter by status (draft, submitted, approved, rejected)
- Card per application: name, email, status badge, date

**2. Application detail** — `(admin)/applications/[id].tsx`
- ScrollView with all application sections:
  - Personal info (name, email, phone)
  - Academic info (grade, GPA)
  - References (2 referrers with names/emails)
  - Questionnaire answers (9 free-form responses)
  - Transcript link (open URL)
- Action buttons at bottom: Approve / Reject / Mark as Draft

### Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useApplications.ts` | Fetch applications, update status |
| `app/(admin)/applications/_layout.tsx` | Stack navigator |
| `app/(admin)/applications/index.tsx` | Applications list |
| `app/(admin)/applications/[id].tsx` | Application detail + actions |

### Files to Modify

| File | Change |
|------|--------|
| `app/(admin)/_layout.tsx` | Hide `applications` from tab bar (`href: null`) |
| `app/(admin)/index.tsx` | Add "Applications" quick access card on dashboard |

---

## Implementation Order Summary

| Phase | Feature | Effort | Files New | Files Modified |
|-------|---------|--------|-----------|----------------|
| **9** | Posts + Comments | Medium | 5 | 2 |
| **10** | Chat (Realtime) | High | 12 | 2 (+2 deleted) |
| **11** | Resources | Medium | 4 | 2 |
| **12** | Profile (Avatar) | Low | 1 | 2 |
| **13** | Applications | Medium | 4 | 2 |
| **Total** | | | **26** | **10** |

---

## Key Dependencies to Install

```bash
# For Resources (Phase 11)
npm install expo-document-picker expo-file-system --workspace=apps/mobile

# For Avatar Upload (Phase 12)
npm install expo-image-picker --workspace=apps/mobile
```

---

## Testing Checklist (Per Phase)

- [ ] Run `cd apps/mobile && npx expo start --clear`
- [ ] Log in as student — verify new screens render, data loads
- [ ] Log in as admin — verify admin-specific actions work
- [ ] Test pull-to-refresh on all list screens
- [ ] Test form submissions (create post, send message, upload file)
- [ ] Test edit/delete flows with proper permission checks
- [ ] Test empty states (no posts, no messages, no resources)
- [ ] Verify TypeScript: `cd apps/mobile && npx tsc --noEmit`
