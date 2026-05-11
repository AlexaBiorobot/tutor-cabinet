# Tutor Training Readiness Platform

Internal web platform for tutor training, webinar attendance, and readiness tracking.

## Product Architecture

The MVP is a Next.js App Router application deployed to Vercel with Supabase handling authentication, Postgres storage, row level security, and server-side data access.

### Roles

- `tutor`: completes assigned training paths, quizzes, and required webinars.
- `admin`: creates training content, assigns paths, manages webinar attendance, and reviews readiness.

### Main Domains

- **Training paths** group ordered requirements.
- **Modules** are self-paced content units.
- **Quizzes** belong to modules and produce pass/needs revision outcomes.
- **Webinars** are live events with registration, capacity, attendance, and optional path requirements.
- **Readiness** is computed from required module completion, quiz pass status, and required webinar attendance.

### Readiness Rules

A tutor is ready for a training path only when:

- every required module step is completed,
- every required quiz is passed,
- every required webinar step has attendance status `attended`,
- no required item is `needs_revision`, `no_show`, or incomplete.

## Database Schema

The Supabase SQL lives in [supabase/schema.sql](./supabase/schema.sql).

Core tables:

- `profiles`: authenticated users with role and display metadata.
- `training_paths`: admin-created curricula.
- `training_path_steps`: ordered module or webinar requirements.
- `modules`: self-paced learning content.
- `quizzes`, `quiz_questions`, `quiz_options`, `quiz_attempts`: quiz authoring and completion.
- `path_assignments`: path-to-tutor assignment and readiness status.
- `module_progress`: tutor module status.
- `webinars`: live events.
- `webinar_registrations`: tutor registration and attendance status.

## User Flows

### Tutor

1. Log in with Supabase auth.
2. Land on dashboard with assigned paths and readiness status.
3. Open a training path to see ordered module and webinar steps.
4. Complete module content.
5. Take quiz and receive `passed` or `needs_revision`.
6. View upcoming webinars.
7. Register if capacity is available.
8. Access join link after registration.
9. Track progress and readiness status.

### Admin

1. Log in as admin.
2. View aggregate progress by tutor and path.
3. Create training paths.
4. Create modules and quizzes.
5. Create webinars with trainer, date, duration, capacity, and meeting link.
6. Add modules and required webinars to paths.
7. Assign paths to tutors.
8. Review webinar registrations.
9. Mark attendance as `attended`, `partially_attended`, `no_show`, or `excused`.

## Initial Project Structure

```txt
app/
  (auth)/login/
  admin/
  tutor/
  globals.css
  layout.tsx
components/
  app-shell.tsx
  progress-ring.tsx
  readiness-badge.tsx
  status-pill.tsx
  ui/
lib/
  mock-data.ts
  readiness.ts
  supabase/
supabase/
  schema.sql
```

The current UI uses a local mock data layer so the product can be reviewed immediately. Supabase clients and SQL are included so the next step is swapping the mock data calls for real queries.

## Local Setup

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and add Supabase credentials before connecting live auth/database.
