# Teacher Hub LMS — Project Overview

**Version:** MVP (local-first)  
**Date:** May 2026  
**Stack:** React 19 · TypeScript · Vite · Tailwind CSS

---

## The Pitch (30 Seconds)

**Teacher Hub** is a lightweight learning management system built for **solo tutors and small teaching studios** — not university IT departments. It combines class management, attendance, lesson billing, and a simple class feed (assignments + announcements) in one place, with a **student portal** so learners can join classes, see homework, and check their lesson balance.

Today it runs entirely in the **browser** (no server required for the MVP): data lives in localStorage, which makes it fast to demo, iterate, and use on a phone on the same Wi-Fi. The architecture is ready to swap in a real backend later without rewriting the product surface.

**One-liner:** *Teacher Hub is the operating system for independent tutors — classes, attendance, lesson billing, and student communication in one mobile-friendly app, starting local-first and designed to grow into a hosted platform.*

---

## Who It's For

| User | What they get |
|------|----------------|
| **Teacher / tutor** | Dashboard, classes, roster, attendance grid, billing, posts, join-code enrollment |
| **Student** | Sign up, join a class with a code, view posts, class info, payment/attendance summary |

Auth is **stubbed** (email-only login, no passwords or API) — enough to switch between teacher and student flows in one app.

---

## Product Features

### Teacher Experience

#### Home (Overview)
- Onboarding when the workspace is empty
- **Pending join requests** — approve/reject students who used a class code
- **Today's schedule** — classes meeting today with time/room; tap through to attendance
- **Needs your attention** — billing alerts (prepaid lessons low, monthly fees due, payments owed)
- Quick stats (students, classes)

#### My Classes
- Card grid of active classes (enrollment count, schedule snippet)
- Tap a card → **class workspace**: class feed + settings gear
- **Create post** → assignment (due date, draft/publish, optional link) or announcement
- **Settings modal** (Roster | Invite | Schedule):
  - Edit class name
  - Roster add/remove
  - Join code copy/regenerate
  - Weekly schedule, location
  - Prepaid vs monthly billing
  - Archive class

#### Assignments (Global Tab)
- All posts across classes
- Edit assignments and announcements from one list

#### Attendance
- Per-class grid: students × date columns
- Statuses: present, absent, excused, unset
- **Prepaid classes:** marking present deducts a "lesson token"; changes are reversible

#### Students
- Directory with search, detail drawer
- Add students, enroll in classes, top-up lesson packages, log monthly payments
- Approve join requests (also on Home)
- Archive / reactivate / delete

#### Settings
- Profile (name, email)
- Export/import JSON backup (full workspace)
- Reset teaching data
- Sign out (desktop sidebar + mobile profile menu)

---

### Student Experience

#### Portal (Mobile-First Shell)
- **Home:** enrolled class cards
- **Join class** via code (teacher approves)
- **Join requests** tab (pending status)

#### Inside a Class
- **Posts** — published assignments & announcements
- **Class info** — lesson balance (prepaid) or monthly plan status, attendance summary, payment history

Assignment detail is read-only (no submissions yet).

---

### Enrollment Flow

1. Teacher creates a class and receives a **join code**
2. Student signs up / logs in on the student portal
3. Student enters the join code
4. Teacher sees a **pending join request** on Home or Students
5. Teacher approves → student is enrolled in the class roster

---

## Billing Model

Each class uses one of two modes:

### 1. Prepaid Lessons
- Student has a **lesson token balance** per class
- Attendance "present" consumes a lesson
- Teacher can top up (standard / intensive / custom packages)
- Action inbox alerts when balance is low or negative

### 2. Monthly Fee
- Flat tuition per month
- Teacher records which month is paid
- Inbox nags when the current month isn't covered

Payments are **logged**, not processed (no Stripe) — built for tutors who track cash/Venmo offline.

---

## Technical Architecture

### Stack

| Layer | Choice |
|--------|--------|
| UI | React 19 + TypeScript |
| Build | Vite 8 (`--host` for phone testing) |
| Styling | Tailwind CSS 3 |
| Icons | Lucide React |
| State | React useState / useCallback in App.tsx |
| Persistence | localStorage via lib/storage.ts |
| Backend | **None** (MVP) |

### Project Structure

```
teacher-hub-lms/
├── src/
│   ├── App.tsx              # Root router, all app state, handlers
│   ├── types.ts             # Domain types
│   ├── main.tsx
│   ├── components/
│   │   ├── auth/            # Landing, teacher/student login & signup
│   │   ├── tabs/            # Teacher main tabs
│   │   ├── teacher/         # Class workspace + feed panel
│   │   ├── student/         # Student portal, class detail
│   │   ├── modals/          # Create/manage class, assignments, top-up
│   │   ├── drawers/         # Student detail drawer
│   │   └── ui/              # Shared UI (EmptyState, etc.)
│   ├── lib/                 # Business logic (pure functions)
│   │   ├── storage.ts       # Load/save/migrate localStorage + backup
│   │   ├── assignments.ts   # Posts, migration, builders
│   │   ├── joinCodes.ts     # Class join codes
│   │   ├── joinRequests.ts  # Approve/reject flow
│   │   ├── billing.ts       # Prepaid vs monthly helpers
│   │   ├── payments.ts      # Payment records
│   │   ├── studentTokens.ts # Lesson balances, roster sync
│   │   ├── attendanceTokens.ts
│   │   ├── actionInbox.ts   # "Needs attention" items
│   │   └── classSchedule.ts
│   └── data/                # Initial demo seed data
```

### Routing Model

No React Router. Navigation is **view state** in App.tsx:

- **AppView:** landing → login/signup → dashboard (teacher) or student-portal
- **Teacher TabId:** overview | classes | assignments | attendance | students | settings
- **Nested:** teacherClassId opens class workspace; manageClassId opens settings modal
- **Student:** home | requests + selected class/assignment

### State & Persistence

App.tsx holds canonical state: classes, students, attendance, payments, assignments, joinRequests, studentAccounts, user.

Mutations go through named handlers. localStorage is written via lib/storage.ts with migration support for legacy data shapes.

**Backup format (AppDataBackup v1/v2):** JSON export with full workspace — portable between browsers if imported manually.

### Responsive Layout

- **Desktop:** dark sidebar + top header
- **Mobile:** fixed top bar, bottom nav (5 tabs), profile menu for settings/sign out

---

## Core Data Model

| Entity | Role |
|--------|------|
| **Class** | classKey (stable ID), name, schedule, roster, joinCode, billing mode |
| **Student** | Roster record; enrolledClasses, tokensByClass, paidThroughMonthByClass |
| **StudentAccount** | Portal login; links to Student after join approval |
| **JoinRequest** | Student → class pending approval |
| **Assignment** | Post with kind: assignment \| announcement; status: draft/published/closed |
| **AttendanceLedger** | recordsByClass[classKey][studentId][dateKey] |
| **PaymentRecord** | Top-ups and monthly fee logs |

The classKey never changes when the display name changes — assignments, attendance, and codes stay linked.

---

## Design Strengths

1. **Teacher-first CRM** — billing and attendance are first-class, not bolted on
2. **Class feed** — Classroom-style posts without overbuilding (links only, no file upload yet)
3. **Join codes + approval** — safe enrollment without exposing the full roster
4. **Local-first MVP** — zero hosting cost for demos; teachers own data via JSON backup
5. **Clear seam for backend** — lib/* separated from UI; storage.ts is the single persistence adapter to replace with API calls

---

## Current Limitations

- No real authentication, email delivery, or multi-device sync
- No payment processing (Stripe, etc.)
- No assignment submissions or grading
- No file uploads (resource links only)
- Data is per-browser profile
- README in repo is partially outdated vs. actual features

---

## Roadmap (Logical Next Steps)

1. **Backend** — Auth, API, database; real-time sync for join codes and rosters
2. **Submissions** — Students hand in work; teacher grades in feed
3. **Notifications** — Email/push for new posts and join requests
4. **Payments** — Stripe for top-ups and monthly billing
5. **Multi-teacher / studio** — Organizations, shared rosters, roles

---

## Running the App

```bash
cd teacher-hub-lms
npm install
npm run dev
```

- Local: http://localhost:5173
- Phone (same Wi-Fi): http://YOUR_PC_IP:5173

---

*Document generated for Teacher Hub LMS — teacher-hub-lms project.*
