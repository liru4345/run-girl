# RunHer 🏃‍♀️

A social running app for women, built around safety. Before a run you pick trusted friends as **watchers**. They get a text when you head out, can follow your live location, and are alerted automatically if you don't come back or check in on time.

Around that sits a social layer: run recaps with photos, a feed, friend requests, notifications, and a calendar for planning group runs.

## How the safety flow works

1. **Start a run.** Choose a planned duration, a location, and your watchers. Each watcher gets a text with a link to a live tracking page.
2. **Live location.** While the run is active, the browser watches the device's GPS and sends the latest position to the server every 15 seconds. Watchers see it on a map at `/track/:runId`.
3. **Check-in reminder.** When the planned time is up, the runner gets a text and an in-app banner: *"I'm OK, add 10 minutes."*
4. **Overdue alert.** If the runner still hasn't finished or checked in 10 minutes later, the run is marked `overdue` and every watcher is texted the runner's last known location.
5. **Finish.** The runner saves a recap (miles, pace, photo), the run is marked `completed`, and watchers get a "finished safely" text.

```mermaid
stateDiagram-v2
    [*] --> in_progress: start run (watchers texted)
    in_progress --> in_progress: "I'm OK" check-in (+10 min)
    in_progress --> overdue: planned time + 10 min grace, no check-in<br/>(watchers alerted with last location)
    overdue --> in_progress: runner checks in (watchers told they're OK)
    in_progress --> completed: finish run
    overdue --> completed: finish run
```

The overdue check runs on the server every minute (`server/safety.js`), so alerts still go out if the runner's phone dies or the app is closed. Each step claims its runs with a single `UPDATE ... RETURNING` statement, so an alert is sent exactly once even if checks overlap or several server instances are running.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, React Router, Bootstrap, browser Geolocation API |
| Backend | Node.js, Express, express-session, bcrypt, Multer (photo uploads) |
| Database | PostgreSQL 14 (10 tables with foreign keys, unique and check constraints, and indexes) |
| Notifications | Nodemailer through carrier email-to-SMS gateways |
| Infrastructure | Docker Compose (client, server, and database containers) |

```
client (React :3000) ──/api proxy──▶ server (Express :5001) ──▶ PostgreSQL
                                          │
                                          ├── safety monitor (every 60s)
                                          └── SMS via email-to-SMS gateway
```

## Running locally

Requires Docker Desktop.

```bash
docker compose up -d
```

Then open http://localhost:3000.

- On first start the database is created from `init_data/create.sql` and filled with sample data from `init_data/insert.sql`. The demo account logins are listed at the top of that file.
- Texts are **logged instead of sent** by default (`SMS_DRY_RUN=true`). To send real texts, put `EMAIL_USER` and `EMAIL_PASS` in `server/.env` and run `SMS_DRY_RUN=false docker compose up -d`.
- To reset the database: `docker compose down -v && docker compose up -d`.

`server/.env` needs `POSTGRES_HOST=db`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `SESSION_SECRET`, `PORT=5001`, and optionally `EMAIL_USER`, `EMAIL_PASS` and `APP_URL`.

## Key API routes

| Method | Route | Purpose |
|---|---|---|
| `POST` | `/api/start-run` | Start a run with watchers |
| `GET` | `/api/runs/active` | Resume the current run after a refresh |
| `POST` | `/api/runs/:id/location` | Live location update (runner only) |
| `POST` | `/api/runs/:id/checkin` | "I'm OK": extend the run and cancel pending alerts |
| `GET` | `/api/runs/:id/track` | Live status (runner and watchers only) |
| `POST` | `/api/runs/finish` | Save the recap and complete the run |

## Roadmap

- Replace email-to-SMS gateways with Twilio for reliable delivery to any carrier
- Store photos in cloud storage (S3 or GCS) instead of on the server's disk
- Push notifications and a mobile app, so location sharing keeps working in the background
- Automated tests for the safety monitor and API
- Deploy (for example Cloud Run with Cloud SQL)
