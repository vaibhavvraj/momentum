# Momentum

**A personal workspace for studying, focus, and the projects you care about.**

Momentum brings daily goals, focus sessions, study subjects, notes, planning, and progress insights together in one calm, dark-first dashboard. It is designed for individual use, starts with an empty workspace, and saves your data locally in the browser.

## Live app

[Open Momentum](https://momentum-workspace.pages.dev/)

## Features

### Dashboard

- See today’s focus time, planned time remaining, goal completion, session count, and streaks.
- Add goals with an optional subject and estimated duration. Mark goals complete or remove them.
- Review recent focus sessions and a productivity score calculated from your session data and daily focus goal.
- Record a daily mood and energy check-in.
- Write a daily reflection with prompts for what went well, what wasted time, and what to improve tomorrow. Earlier reflections remain available in the history view.

### Study

- Create and remove subjects, then organize each subject into chapters.
- Set an estimated duration for a chapter and track its completed time.
- Link a focus session to a subject and chapter. Completing the session adds its duration to that chapter’s progress.

### Focus

- Choose Pomodoro, stopwatch, or custom timer mode.
- Optionally associate a session with a subject, chapter, and task.
- Pause and resume a timer, then finish the session with a rating and optional note.
- Saved sessions contribute to your study totals, streaks, chapter progress, analytics, and heatmap.

### Planner

- Create dated timeline events with a title, time range, and optional subject.
- View events for a selected day and remove them when plans change.

### Analytics

- Switch between week, month, and year views.
- See focus totals, average and longest session, streak, focus time by period, subject distribution, and a 12-week activity heatmap.
- View observations derived from your saved sessions.
- Charts and insights remain empty until you record real sessions; Momentum does not add sample activity.

### Notes

- Create, edit, pin, tag, search, and delete notes.
- Note titles, text, and tags save automatically as you edit.
- Markdown syntax can be written as text; rich rendering and image attachments are not currently included.

### Projects

- Create projects with a description, deadline, and status.
- Add tasks and mark them complete. Project progress is calculated from completed tasks.

### Search and settings

- Search saved subjects, notes, projects, goals, and sessions from the workspace. Open search with **Ctrl+K** or **⌘K**.
- Choose a theme and accent color, and set daily, weekly, and monthly focus targets plus Pomodoro duration.
- Export a JSON backup, restore a Momentum backup, or reset the local workspace from Settings.

## Data and privacy

Momentum uses IndexedDB in the browser to store goals, subjects, chapters, sessions, notes, projects, planner events, reflections, check-ins, and settings. The first launch creates no goals, subjects, sessions, notes, projects, or activity history. Only basic preferences such as the initial theme, accent, and timer targets have defaults.

Your workspace is local to the browser profile and website origin you use. It does not require an account or sync data between browsers or devices. Clearing this site’s browser data removes the local workspace, so export a backup from Settings if you want a separate copy.

## Run locally

Requires Node.js and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

## Build and preview

```bash
npm run build
npm run preview
```

## Technology

- React and TypeScript
- Vite
- Zustand for the live application store
- Dexie and IndexedDB for local persistence
- Framer Motion for interface transitions
- Lucide icons and custom responsive CSS

The IndexedDB access is centralized in the workspace data store, keeping persistence separate from page components and leaving a clear path for a future database adapter.
