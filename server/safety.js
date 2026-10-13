// Safety monitor: watches in-progress runs and escalates when a runner doesn't finish on time.
//
//   expected end time        -> remind the runner to check in
//   expected end + grace     -> mark the run overdue and alert every watcher with the last known location
//
// Each step "claims" its runs with a single UPDATE ... RETURNING, so a run is only ever
// alerted once, even if the check overlaps with itself or several server instances run it.

const CHECK_INTERVAL_MS = 15 * 1000;
const GRACE_MINUTES = Number(process.env.OVERDUE_GRACE_MINUTES || 10);
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

function mapLink(lat, lng) {
  return `https://maps.google.com/?q=${lat},${lng}`;
}

function trackingLink(runId) {
  return `${APP_URL}/track/${runId}`;
}

async function sendCheckinReminders(db, notify) {
  const runs = await db.any(`
    UPDATE runs r
    SET checkin_sent_at = NOW()
    FROM users u
    WHERE u.id = r.user_id
      AND r.status = 'in_progress'
      AND r.end_time <= NOW()
      AND r.checkin_sent_at IS NULL
    RETURNING r.id, r.user_id, u.first_name, u.phone_number
  `);

  const graceText = `${GRACE_MINUTES} minute${GRACE_MINUTES === 1 ? '' : 's'}`;
  for (const run of runs) {
    await notify({
      to: { id: run.user_id, phone_number: run.phone_number },
      from: null,
      type: 'run_alert',
      runId: run.id,
      message: `Your run is past its planned time. Check in or finish your run, or your watchers will be alerted in ${graceText}.`,
      smsText: `Hi ${run.first_name}, your RunHer run is past its planned time. Open the app to check in or finish your run, ` +
        `or your watchers will be alerted in ${graceText}.`,
    });
  }
  return runs.length;
}

async function sendOverdueAlerts(db, notify) {
  const runs = await db.any(`
    UPDATE runs r
    SET status = 'overdue', overdue_alert_sent_at = NOW()
    FROM users u
    WHERE u.id = r.user_id
      AND r.status = 'in_progress'
      AND r.end_time <= NOW() - ($1 * INTERVAL '1 minute')
      AND r.overdue_alert_sent_at IS NULL
    RETURNING r.id, r.location, r.last_lat, r.last_lng, r.last_location_at,
              u.id AS user_id, u.first_name, u.last_name, u.profile_picture
  `, [GRACE_MINUTES]);

  for (const run of runs) {
    const watchers = await db.any(`
      SELECT u.id, u.first_name, u.phone_number
      FROM run_watchers rw
      JOIN users u ON u.id = rw.watcher_id
      WHERE rw.run_id = $1
    `, [run.id]);

    const runner = { id: run.user_id, first_name: run.first_name, last_name: run.last_name, profile_picture: run.profile_picture };
    const lastSeen = run.last_lat != null
      ? `Last known location: ${mapLink(run.last_lat, run.last_lng)}`
      : `Planned location: ${run.location}`;

    for (const watcher of watchers) {
      await notify({
        to: watcher,
        from: runner,
        type: 'run_alert',
        runId: run.id,
        message: `hasn't finished their run and didn't check in. Please try to reach them.`,
        smsText: `⚠️ ${run.first_name} ${run.last_name} hasn't finished their run and didn't check in. ` +
          `${lastSeen}. Please try to reach them. Live status: ${trackingLink(run.id)}`,
      });
    }
  }
  return runs.length;
}

async function checkRuns(db, notify) {
  try {
    const reminders = await sendCheckinReminders(db, notify);
    const alerts = await sendOverdueAlerts(db, notify);
    if (reminders || alerts) {
      console.log(`🛡️ Safety check: ${reminders} check-in reminder(s), ${alerts} overdue alert(s)`);
    }
  } catch (err) {
    console.error('❌ Safety check failed:', err.message);
  }
}

function startSafetyMonitor(db, notify) {
  checkRuns(db, notify);
  return setInterval(() => checkRuns(db, notify), CHECK_INTERVAL_MS);
}

module.exports = { startSafetyMonitor, checkRuns, mapLink, trackingLink, GRACE_MINUTES };
