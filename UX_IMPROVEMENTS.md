# UX Improvement Backlog

A prioritized backlog of UI/UX improvements for the Ambassador Portal, organized by category. Check items off as they're completed.

---

## 1. Visual Design & Theming

- [ ] **Dark mode toggle** — CSS variables already defined but no toggle exists. Add theme switcher using the existing `darkMode: ["class"]` Tailwind config
- [ ] **Consistent status colors** — Standardize Approved/Pending/Denied badge colors across submissions, applications, and events
- [ ] **Skeleton loading screens** — Add page-level skeletons for dashboard, resources, chat, profile (events/posts already have them)
- [ ] **Micro-interactions** — Add subtle hover/press feedback on submission cards, resource cards, and nav items
- [ ] **Gradient accent headers** — Subtle branded gradient backgrounds on page headers for visual hierarchy
- [ ] **Custom empty state illustrations** — Replace generic icon+text empty states with illustrated SVGs
- [ ] **Typography hierarchy** — More deliberate font size/weight steps for h1/h2/body/caption
- [ ] **Animated page transitions** — Route-level Framer Motion transitions (fade/slide) between pages

## 2. Navigation & Information Architecture

- [ ] **Breadcrumb navigation** — Add breadcrumbs on detail pages (Dashboard > Submissions > #1234)
- [ ] **Global search / command palette** — Cmd+K search across submissions, users, events, posts, resources
- [ ] **Notification bell with badge counts** — In-app notification center for unread items
- [ ] **Unread indicators on nav items** — Dot/count badges on Chat, Posts nav when new content exists
- [ ] **Tab persistence in admin dashboard** — Remember last active tab across navigations
- [ ] **Role indicator** — Show current role (Admin/Superadmin) prominently in sidebar
- [ ] **Collapsible sidebar sections** — Allow admin sidebar sections to collapse/expand
- [ ] **Swipe navigation on mobile** — Swipe gestures between main sections on mobile

## 3. Dashboard & Analytics

- [ ] **Admin KPI cards** — Pending submissions, active ambassadors, upcoming events, new applications
- [ ] **Student progress dashboard** — Visual progress toward semester hour/credit goals (progress bars or rings)
- [ ] **Submission trends chart** — Line/bar chart showing submissions over time (weekly/monthly)
- [ ] **Service type breakdown** — Pie/donut chart of service type distribution
- [ ] **Activity feed** — Recent activity stream on admin dashboard
- [ ] **Leaderboard** — Gamified top contributors view (opt-in, privacy-conscious)
- [ ] **Calendar heatmap** — GitHub-style heatmap showing submission density by day
- [ ] **Export reports to PDF** — Formatted PDF reports of submissions, hours, credits by date range

## 4. Submissions & Approvals

- [ ] **Quick approve/deny on list view** — One-click approve/deny directly from submissions table
- [ ] **Bulk approve/deny** — Checkbox multi-select with batch actions
- [ ] **Status filter chips** — Persistent filter chips (All/Pending/Approved/Denied) with counts
- [ ] **Required feedback on denial** — Make feedback required when denying a submission
- [ ] **Submission timeline** — Status change history with timestamps and who acted
- [ ] **Auto-save draft submissions** — Save form state to localStorage to prevent data loss
- [ ] **Duplicate submission warning** — Warn when submitting hours for same date/type as recent entry
- [ ] **Rich text feedback** — Basic formatting in admin feedback (bold, links)

## 5. Events & Calendar

- [ ] **Calendar grid view** — Monthly calendar grid alongside the current card list, with toggle
- [ ] **Event templates** — Save and reuse templates for recurring event types
- [ ] **Recurring events** — Create events that repeat (weekly, biweekly, monthly)
- [ ] **Calendar export (ICS)** — Export events to .ics for personal calendar import
- [ ] **RSVP attendee list** — Full attendee list grouped by status with counts
- [ ] **Event cancellation workflow** — Cancel action that notifies all RSVPed attendees
- [ ] **Event reminders** — Push reminders 24h and 1h before RSVPed events
- [ ] **Map integration** — Embedded map or Google Maps link for event locations
- [ ] **Drag-to-reschedule** — Drag events on calendar grid to change dates
- [ ] **Event check-in** — QR code or proximity-based attendance verification

## 6. Chat & Communication

- [x] **Improved group creation UI** — Scrollable user checklist instead of dropdown for selecting participants
- [ ] **Typing indicators** — Real-time "User is typing..." display
- [ ] **Read receipts** — Show who has read messages (toggleable)
- [ ] **Message reactions/emoji** — React to messages with emoji (like Slack)
- [ ] **Image/file sharing** — Upload and preview images and files in chat
- [ ] **Message search** — Search within chat messages across groups
- [ ] **Pinned messages** — Admins can pin important messages in group chats
- [ ] **@mentions** — Tag users with autocomplete, triggering notifications
- [ ] **Unread message count per group** — Badge counts on each chat group in sidebar
- [ ] **Online/offline presence** — Green dots for currently active users
- [ ] **Voice messages** — Record and send voice memos
- [ ] **Message formatting** — Basic markdown support (bold, italic, links, code)

## 7. Posts & Social Feed

- [ ] **Rich text editor** — Replace plain textarea with rich text (bold, italic, links, lists)
- [ ] **Image/media attachments** — Upload photos to posts (event recaps, team photos)
- [ ] **Post reactions** — Like/heart/celebrate reactions beyond just comments
- [ ] **Post pinning** — Pin important announcements to top of feed
- [ ] **Real-time post updates** — Supabase Realtime subscriptions for posts
- [ ] **Post categories/tags** — Filterable tags (Announcement, Question, Recap, etc.)
- [ ] **Mention users in posts** — @mention with autocomplete
- [ ] **Link preview cards** — Auto-generate previews when URLs are shared

## 8. Forms & Data Entry

- [ ] **Multi-step submission form** — Progress indicator for complex submissions
- [ ] **Inline field validation** — Real-time errors as user types
- [ ] **Smart defaults** — Pre-fill today's date, last-used service type
- [ ] **Styled date picker** — Replace native date inputs with themed picker
- [ ] **Form builder completion** — Finish admin form builder with save/preview/publish
- [ ] **Drag-and-drop file upload** — Drop zones with progress indicators
- [ ] **Character count on textareas** — Show counts for feedback/description fields

## 9. User Management & Profiles

- [ ] **User profile pages** — Public profiles showing hours, events, bio
- [ ] **Bio and status fields** — Short bio and status ("On spring break")
- [ ] **Bulk role changes** — Multi-select users for batch role updates
- [ ] **User deactivation** — Soft delete to preserve history
- [ ] **Last login tracking** — Show last login for admin monitoring
- [ ] **User directory** — Searchable ambassador directory with photos and stats
- [ ] **Notification preferences** — Per-user settings for which notifications to receive

## 10. Accessibility

- [ ] **ARIA labels audit** — Add labels to all interactive elements
- [ ] **Full keyboard navigation** — Tab order, focus rings, escape-to-close
- [ ] **Focus management in modals** — Trap focus and return on close
- [ ] **Screen reader announcements** — Live regions for dynamic content
- [ ] **Color contrast audit** — WCAG 2.1 AA compliance (especially status badges)
- [ ] **Reduced motion support** — Respect `prefers-reduced-motion`
- [ ] **Touch target sizing** — All interactive elements 44x44px minimum on mobile
- [ ] **Alt text for images** — Descriptive alt text for avatars and uploads

## 11. Performance & PWA

- [ ] **Pagination / infinite scroll** — Paginate submissions, posts, messages, resources
- [ ] **Image optimization** — Next.js `<Image>` for avatars/uploads with lazy loading
- [ ] **Offline mode indicator** — Banner when offline, cached data still accessible
- [ ] **Service worker caching** — Cache assets and data for offline-first experience
- [ ] **Optimistic UI updates** — Apply for submissions, posts, RSVPs (chat already does this)
- [ ] **Request deduplication** — Prevent duplicate API calls on re-mount
- [ ] **Bundle analysis** — Analyze size and lazy-load heavy components
- [ ] **Prefetch on hover** — Use `<Link prefetch>` for likely navigation targets

## 12. Error Handling & Resilience

- [ ] **Global error boundary** — Friendly fallback UI with retry button
- [ ] **Toast notification system** — Replace inline alerts with non-blocking toasts
- [ ] **Custom confirmation dialogs** — Styled `AlertDialog` instead of browser `confirm()`
- [ ] **Retry failed requests** — Retry button when API calls fail
- [ ] **Form error summaries** — Error summary at top of long forms
- [ ] **Graceful degradation** — Feature-detect and hide unavailable capabilities
- [ ] **Network status monitoring** — Pause/resume subscriptions on network change

## 13. Onboarding & Help

- [ ] **First-time onboarding tour** — Guided walkthrough of key features for new ambassadors
- [ ] **Contextual help tooltips** — Info icons explaining service types, credits, statuses
- [ ] **Actionable empty states** — "No submissions yet — Log your first activity" with CTA button
- [ ] **Submission guidelines inline** — Brief guidelines/examples near submission form
- [ ] **FAQ / help section** — In-app help page with common questions
- [ ] **Admin onboarding checklist** — "Connect Calendar", "Invite ambassadors", "Create first event"

## 14. Application & Recruitment

- [ ] **Application progress tracker** — Visual step indicator for multi-step application
- [ ] **Application auto-save** — Save drafts automatically
- [ ] **Application status notifications** — Email/push on approval/rejection
- [ ] **Admin pipeline view** — Kanban board (Draft > Submitted > Under Review > Approved/Rejected)
- [ ] **Interview scheduling** — Schedule interviews from application detail view
- [ ] **Scoring rubric** — Structured rubric for scoring applications
- [ ] **Bulk application updates** — Multi-select for batch approve/reject

## 15. Security & Quality of Life

- [ ] **Session expiry warning** — Modal before JWT expires with refresh option
- [ ] **Audit log** — Track who changed what and when
- [ ] **Undo for destructive actions** — "Undo" toast after deleting posts/comments/resources
- [ ] **Data export** — CSV/Excel export for submissions, users, events
- [ ] **Two-factor authentication** — Optional 2FA for admin accounts
- [ ] **Rate limiting UI** — Show messaging when users hit rate limits
