# Ambassador Portal - Mobile App Design Spec for Figma

## Color System

### Primary Palette
| Token | Hex | Usage |
|---|---|---|
| Primary | `#111827` | Buttons, active tabs, sent chat bubbles, FABs, switches |
| Background | `#ffffff` | Screen backgrounds, input backgrounds |
| Surface | `#ffffff` | Cards, dialogs |
| Surface Variant | `#f5f5f5` | Alternate surfaces |
| Card Background | `#f9fafb` | Card fills, stat cards, section backgrounds |
| Input Background | `#f3f4f6` | Chat input, pill buttons, disabled states, skeleton base |
| Avatar Fallback | `#e5e7eb` | Default avatar background, chip inactive |
| Border / Outline | `#e2e5ea` | Input borders, pill borders |
| Border Light | `#e5e7eb` | Card borders, dividers, chat container top border |
| Separator | `#f3f4f6` | Section dividers |

### Text Colors
| Token | Hex | Usage |
|---|---|---|
| Text Primary | `#111827` | Headings, body text, input text |
| Text Secondary | `#374151` | Section headers (bold), titles |
| Text Tertiary | `#6b7280` | Muted text, descriptions, comment counts |
| Text Quaternary | `#9ca3af` | Timestamps, placeholders, disabled text, captions, inactive tabs |
| Text Inverse | `#ffffff` | Text on dark backgrounds (buttons, sent bubbles) |
| Text Dark Surface | `#1f2937` | Text on light chat bubbles |

### Semantic / Status Colors
| Token | Background | Text/Icon | Border |
|---|---|---|---|
| Approved / Success | `#ecfdf5` | `#10b981` | `#a7f3d0` |
| Pending / Warning | `#fffbeb` | `#f59e0b` | `#fde68a` |
| Denied / Error | `#fef2f2` | `#ef4444` | `#fecaca` |
| Info | `#eff6ff` | `#3b82f6` | — |
| Offline Banner | `#f59e0b` | `#ffffff` | — |

### Role Badge Colors
| Role | Background | Text |
|---|---|---|
| Admin | `#eff6ff` | `#3b82f6` |
| Superadmin | `#f5f3ff` | `#7c3aed` |
| Student | `#f0fdf4` | `#22c55e` |
| Basic | `#f5f5f5` | `#6b7280` |
| Applicant | `#fefce8` | `#ca8a04` |

### Application Status Colors
| Status | Background |
|---|---|
| Submitted | `#eff6ff` |
| Approved | `#ecfdf5` |
| Rejected | `#fef2f2` |
| Draft | `#f5f5f5` |

---

## Typography

**Font Family:** System default (San Francisco on iOS, Roboto on Android)

Uses React Native Paper text variants:

| Variant | Usage | Approx Size |
|---|---|---|
| `headlineMedium` | Screen titles | ~28px |
| `headlineSmall` | Section headings | ~24px |
| `labelLarge` | Subheadings, bold labels | ~14px bold |
| `labelMedium` | Secondary labels | ~12px medium |
| `labelSmall` | Metadata, tiny labels | ~11px |
| `bodyMedium` | Body text | ~14px |
| `bodySmall` | Captions, timestamps | ~12px |

**Font Weights Used:**
- 400 (regular) — body text
- 600 (semibold) — labels, badges, section headers, sender names
- 700 (bold) — titles, formatted bold text

---

## Spacing Scale

| Token | Value | Usage |
|---|---|---|
| xs | 4px | Tight gaps, badge padding vertical |
| sm | 8px | Small gaps, container padding top, chat input padding |
| md | 12px | Item spacing, card gaps, component margins |
| lg | 16px | Container padding, section spacing, form field gaps |
| xl | 20px | Large section spacing |
| 2xl | 24px | Extra section spacing |
| 3xl | 32px | Empty state / error state padding |

---

## Border Radius Scale

| Value | Usage |
|---|---|
| 4px | Flat bubble corner (message bubble bottom) |
| 8px | Buttons, pill buttons, skeleton items, date picker pills |
| 10px | Resource card icon container |
| 12px | Cards, stat cards, badges (role/status pills) |
| 16px | Message bubbles |
| 20px | Chat input field |

---

## Shadows

Minimal shadow usage — the app relies on borders and background color contrast rather than shadows.

---

## Icon System

**Library:** Lucide React Native + MaterialCommunityIcons (for empty states)

**Common icon size:** 20-24px for UI, 48px for empty/error states

**Icon color:** Matches text color of context (primary `#111827`, tertiary `#6b7280`, quaternary `#9ca3af`, error `#ef4444`)

---

## Component Specs

### Button (Primary)
- Background: `#111827`
- Text: `#ffffff`
- Border radius: 8px
- Padding: ~16px horizontal
- Mode: "contained" (React Native Paper)

### Button (Outlined)
- Background: transparent
- Border: 1px `#111827`
- Text: `#111827`
- Border radius: 8px

### Button (Destructive)
- Background: `#ef4444`
- Text: `#ffffff`
- Border radius: 8px

### Text Input
- Mode: outlined
- Background: `#ffffff`
- Border: `#e2e5ea` (inactive), `#111827` (focused)
- Border radius: ~4px (Paper default)
- Placeholder color: `#9ca3af`
- Text color: `#111827`

### Card
- Background: `#ffffff` or `#f9fafb`
- Border: 1px `#e5e7eb`
- Border radius: 12px
- Padding: 16px
- Margin bottom: 12px

### Avatar
- Shape: Circle
- Default sizes: 28px (chat), 36px (post cards), 80px (profile)
- Fallback: `#e5e7eb` background with initials in dark text
- Border radius: size / 2

### Status Badge
- Shape: Rounded pill
- Padding: 10px horizontal, 4px vertical
- Border radius: 12px
- Border: 1px (uses status border color)
- Font: 12px, weight 600
- Colors: per status (see Semantic Colors)

### Role Badge
- Shape: Rounded pill
- Padding: 10px horizontal, 4px vertical
- Border radius: 12px
- Font: 12px, weight 600
- Colors: per role (see Role Badge Colors)
- No border

### Chip / Filter
- Inactive: `#e5e7eb` background, dark text
- Active: `#111827` background, `#ffffff` text
- Border radius: ~16px
- Padding: ~8px horizontal

### Floating Action Button (FAB)
- Background: `#111827`
- Icon: `#ffffff`
- Position: absolute, bottom-right
- Size: 56px (standard FAB)
- Border radius: 28px (circular)
- Respects safe area bottom inset

### Message Bubble (Own)
- Background: `#111827`
- Text: `#ffffff`
- Border radius: 16px (4px bottom-right)
- Max width: 75%
- Padding: 14px horizontal, 10px vertical
- Aligned right

### Message Bubble (Other)
- Background: `#f3f4f6`
- Text: `#1f2937`
- Border radius: 16px (4px bottom-left)
- Max width: 75%
- Padding: 14px horizontal, 10px vertical
- Aligned left
- 28px avatar to the left

### Chat Input Bar
- Container: white background, 1px top border `#e5e7eb`
- Input: `#f3f4f6` background, border radius 20px, 16px horizontal padding
- Send button: icon button, `#111827` color
- Respects safe area bottom

### Date/Time Picker Pill
- Inactive: `#f3f4f6` background, dark text, 1px `#e2e5ea` border
- Active: `#111827` background, `#ffffff` text
- Border radius: 8px
- Padding: 14px horizontal, 8px vertical

### Empty State
- Centered layout
- Icon: 48px, `#9ca3af`
- Title: 16px, weight 600, `#6b7280`
- Subtitle: 14px, `#9ca3af`
- Padding: 32px

### Error State
- Centered layout
- Icon: 48px AlertCircle, `#ef4444`
- Title: "Something went wrong", weight 600, `#374151`
- Message: `#6b7280`
- Retry button: outlined style

### Offline Banner
- Full width bar at top
- Background: `#f59e0b`
- Text: `#ffffff`, 13px, weight 600
- Padding: 8px vertical, 16px horizontal

### Skeleton Loader
- Animated pulse (opacity 0.3 → 0.7, 800ms loop)
- Color: `#e5e7eb`
- Border radius: 8px
- Variants: card, list item, stat card, full dashboard

### Resource Card
- White background
- Left: 44x44 icon container (`#f3f4f6`, radius 10)
- Center: title (bold), description (`#6b7280`), meta (`#9ca3af`)
- Right: download icon (`#111827`), optional delete icon (`#ef4444`)
- Gap: 12px

---

## Screen Inventory (All Screens to Recreate)

### Auth (1 screen)
1. **Login** — Email/password form, dark primary button, "Ambassador Portal" title

### Student Screens (11 screens)
1. **Dashboard** — Stat cards grid (hours, credits, pending), quick action button, upcoming events list, recent submissions with status filter chips
2. **New Submission** — Service type dropdown, hours/credits/notes inputs, success state with green checkmark
3. **Events List** — SectionList grouped by date, filter chips (Upcoming/All/Past)
4. **Event Detail** — Title, date/time/location metadata with icons, description, RSVP chips with counts, attendees, comments section
5. **Posts Feed** — PostCard list, FAB for new post
6. **New Post** — Multiline text input, bold/italic toolbar, submit button
7. **Post Detail** — Post with author header (avatar, name, role badge, timestamp), comments list, sticky comment input
8. **Chat List** — Chat group rows (avatar, name, last message, unread dot, timestamp), FAB
9. **New Chat** — User search, multi-select checkboxes, group name input
10. **Chat Thread** — Message bubbles (sent/received), sticky chat input
11. **Profile** — Avatar upload, editable fields, notification toggle, Google Calendar connect, sign out, delete account
12. **Resources** — ResourceCard list with pull-to-refresh

### Admin Screens (16 screens)
1. **Dashboard** — 2x2 stat card grid (Pending Reviews, Users, Applications, Submissions, Resources)
2. **Submissions List** — Submission cards (avatar, name, type, date, hours, credits, status badge)
3. **Submission Review** — Student info header, details card, feedback textarea, approve (green) / deny (red) buttons with confirmation dialog
4. **Users List** — User cards (avatar, name, email, role badge)
5. **User Detail** — Avatar, role badge, editable fields, role picker (segmented buttons), collapsible submissions summary
6. **Applications List** — Search input, status filter chips, application cards with colored status badges
7. **Application Detail** — Status badge, personal/academic info sections, references, questionnaire (expandable), approve/reject buttons
8. **Events List** — Same as student + FAB for create
9. **Event Detail** — Same as student + edit/delete actions
10. **New Event** — Title, description, uniform, date/time picker, RSVP options (dynamic list), create button
11. **Posts Feed** — Same as student
12. **New Post** — Same as student
13. **Post Detail** — Same as student + edit/delete actions
14. **Chat List** — Same as student
15. **Chat Thread** — Same as student
16. **Profile** — Same as student + notification preference toggles (chat, posts, comments, events)
17. **Resources** — Same as student + FAB for upload with file selection dialog

### Navigation
- **Bottom Tab Bar**: 5 tabs visible, white background, active color `#111827`, inactive `#9ca3af`
- **Student tabs**: Dashboard, Events, Posts, Chat, Profile
- **Admin tabs**: Dashboard, Events, Posts, Chat, Profile (with badge indicators)
- **Stack navigation**: Headerless or standard header within each tab

---

## Layout Patterns

### Screen Container
- Background: `#ffffff`
- Safe area insets respected
- Content padding: 16px horizontal

### List Screen
- FlatList or SectionList
- Content container padding: 16px
- Item spacing: 12px (margin bottom)
- Pull-to-refresh: tint color `#111827`

### Form Screen
- ScrollView with keyboard avoiding
- Field spacing: 12-16px
- Labels above inputs
- Required fields marked with asterisk

### Detail Screen
- ScrollView
- Header section: `#f9fafb` background or white
- Content sections with 16px padding
- Action buttons at bottom

### Dialog / Modal
- Dark overlay backdrop
- Centered white card
- Border radius: 12px
- Padding: 16-24px
- Action buttons at bottom of dialog
