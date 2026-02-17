

# রমাদান মিনিমাল ট্র্যাকার — Implementation Plan

## Phase 1: Foundation & Design System
- Add **Noto Serif Bengali** font from Google Fonts
- Set up the warm off-white background, muted Islamic green accent, and dark charcoal text colors
- Establish clean typography hierarchy with comfortable Bangla spacing

## Phase 2: Supabase Backend Setup
- Enable **Lovable Cloud** (Supabase) with Auth (Email + Password)
- Create `profiles` table for user data
- Create `habits` table (id, user_id, name, is_custom, created_at)
- Create `habit_entries` table (id, user_id, habit_id, day 1–30, completed, updated_at)
- Enable **Row Level Security** on all tables — policy: `user_id = auth.uid()`
- Create trigger to seed the **15 predefined habits** for each new user on signup

## Phase 3: Authentication
- Login page (email + password) — all labels in Bangla
- Signup page — all labels in Bangla
- Password reset flow
- Logout option
- Protected routes — redirect unauthenticated users to login

## Phase 4: Dashboard — Header & Progress
- Header showing **🌙 রমাদান ট্র্যাকার** with current day (দিন X / ৩০)
- Animated progress bar with percentage (e.g., ৬৮%)
- "সম্পূর্ণ দিন: X" showing fully completed days count
- All calculations dynamic based on real habit_entries data

## Phase 5: Habit Tracking Grid
- **Mobile-first** horizontally scrollable grid (days ১–৩০)
- Sticky first column showing habit names
- Rounded checkboxes with soft green checked state and smooth toggle animation
- Minimum 40px touch targets
- **Desktop**: centered card (max 1100px), full grid visible, light shadow
- Instant auto-save to Supabase on toggle

## Phase 6: Custom Habits
- "+ নতুন অভ্যাস যোগ করুন" button
- Clean modal for adding custom habits (max 40 characters, max 5 custom habits)
- Edit and delete custom habits
- Custom habits appear in the same grid and count toward overall progress %

## Phase 7: Polish & Performance
- Optimistic UI updates for instant feel when toggling
- Client-side caching with React Query
- Bangla numerals throughout (১, ২, ৩... ৩০)
- Fully responsive — calm, clean, spiritually focused experience

