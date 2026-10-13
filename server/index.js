// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// *****************************************************
// <!-- Section 2 : Connect to DB -->
// *****************************************************
const dbConfig = {
  //host: 'db',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: 5432,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);

const { createNotifier } = require('./notify');
const { startSafetyMonitor, mapLink, trackingLink } = require('./safety');
const notify = createNotifier(db);

const connectToDatabase = async (retries = 5) => {
  while (retries) {
    try {
      await db.connect();
      console.log("✅ Database connection successful");
      startSafetyMonitor(db, notify);
      break;
    } catch (err) {
      console.error("❌ Database connection failed. Retrying...", err.message);
      retries--;
      await new Promise(res => setTimeout(res, 5000)); // wait 5 seconds
    }
  }

  if (!retries) {
    console.error("❌ Could not connect to database after several attempts");
    process.exit(1);
  }
};

connectToDatabase();

// *****************************************************
// <!-- Section 3 : App Settings -->
// *****************************************************
//app.use(cors());
app.use(cors({
  origin: "http://localhost:3000", // your client URL
  credentials: true               // 🔥 allow cookies
}));
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'secret',
    saveUninitialized: false,
    resave: false,
  })
);



// *****************************************************
// <!-- Section 4 : API Routes -->
// *****************************************************
/*
const user = {
  email: undefined,
  password: undefined
};
*/

app.get('/', (req, res) => {
  res.send('Welcome to Run-Girl backend API!');
});

app.get('/api', (req, res) => {
  res.send('API is working!');
});

app.post('/api/register', async (req, res) => {
  const { first_name, last_name, email, phone_number, password } = req.body;
  const created_at = new Date().toISOString();
  const hash = await bcrypt.hash(password, 10);
  try {
    await db.none(
      'INSERT INTO users (first_name, last_name, email, password, phone_number, created_at) VALUES ($1, $2, $3, $4, $5, $6)',
      [first_name, last_name, email, hash, phone_number, created_at]
    );

    console.log(`${first_name} successfully added`);
    res.status(201).send({ message: 'User registered successfully' });

  } catch (err) {
    console.error('❌ Registration error:', err.message);
    if (err.code === '23505') {
      return res.status(409).send({ error: 'An account with that email already exists' });
    }
    if (err.code === '22001') {
      return res.status(400).send({ error: 'Phone number must be 15 characters or fewer' });
    }
    res.status(500).send({ error: 'User registration failed' });
  }
});

/*
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await db.one('SELECT * FROM users WHERE email = $1', [email]);
    const match = await bcrypt.compare(password, user.password);
    if (match) {
      req.session.user = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        profile_picture: user.profile_picture,
        bio: user.bio
      };

      console.log('✅ Session set:', req.session.user); // 🔍 log here

      res.status(200).send({ message: 'Login successful' });
    } else {
      res.status(401).send({ error: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).send({ error: 'Login failed' });
  }
});
*/

app.post('/api/login', async (req, res) => {
  try {
    const emailNorm = req.body.email.trim().toLowerCase();
    const { password } = req.body;

    const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [emailNorm]);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    req.session.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      profile_picture: user.profile_picture,
      bio: user.bio
    };
    console.log('✅ Session set:', req.session.user);

    res.status(200).json({ message: 'Login successful' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});


app.get('/api/profile', async (req, res) => {
  const user = req.session.user;

  if (!user) return res.status(401).send({ error: 'Unauthorized' });

  try {
    const [followersCount, followingCount, contact] = await Promise.all([
      db.one(`SELECT COUNT(*) FROM friends WHERE friend_id = $1 AND status = 'following'`, [user.id]),
      db.one(`SELECT COUNT(*) FROM friends WHERE user_id = $1 AND status = 'following'`, [user.id]),
      db.one(`SELECT phone_number FROM users WHERE id = $1`, [user.id])
    ]);

    res.status(200).send({
      ...user,
      phone_number: contact.phone_number,
      followers_count: parseInt(followersCount.count),
      following_count: parseInt(followingCount.count)
    });
  } catch (err) {
    console.error('❌ Error loading profile with counts:', err);
    res.status(500).send({ error: 'Failed to load profile data' });
  }
});



app.get('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).send({ error: 'Logout failed' });
    res.status(200).send({ message: 'Logged out successfully' });
  });
});

//setting up friends
// Search for users by name or phone number
app.get('/api/friends/search', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  const searchTerm = req.query.query;
  const currentUserId = req.session.user.id;

  try {
    const users = await db.any(`
      SELECT id, first_name, last_name, phone_number
      FROM users
      WHERE (first_name ILIKE $1 OR last_name ILIKE $1 OR phone_number ILIKE $1)
      AND id != $2
    `, [`%${searchTerm}%`, currentUserId]);

    const friendStatuses = await db.any(`
      SELECT friend_id, status
      FROM friends
      WHERE user_id = $1
    `, [currentUserId]);

    const statusMap = {};
    friendStatuses.forEach(row => {
      statusMap[row.friend_id] = row.status;
    });

    const results = users.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      phone: user.phone_number,
      status: statusMap[user.id] || 'none'
    }));

    res.json(results);
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).send({ error: 'Search failed' });
  }
});

// Send follow request
app.post('/api/friends/request', async (req, res) => {
  const currentUserId = req.session.user?.id;
  const { userId } = req.body;

  if (!currentUserId) return res.status(401).send({ error: 'Unauthorized' });

  try {
    // Insert or update the follow request
    await db.none(`
      INSERT INTO friends (user_id, friend_id, status)
      VALUES ($1, $2, 'requested')
      ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'requested'
    `, [currentUserId, userId]);

    // Insert notification
    const senderName = `${req.session.user.first_name} ${req.session.user.last_name}`;
    const profilePic = req.session.user.profile_picture || null;

    await db.none(`
      INSERT INTO notifications (sender_id, receiver_id, sender_username, profile_icon, message, type)
      VALUES ($1, $2, $3, $4, $5, 'follow_request')
    `, [
      currentUserId,
      userId,
      senderName,
      profilePic,
      `${senderName} requested to follow you.`
    ]);

    res.sendStatus(200);
  } catch (err) {
    console.error("Request follow error:", err);
    res.status(500).send({ error: 'Failed to send request' });
  }
});
// Cancel a follow request (used when user clicks "Requested")
app.post('/api/friends/cancel-request', async (req, res) => {
  console.log("🧨 Cancel button clicked, running in index"); // ✅
  const currentUserId = req.session.user?.id;
  const { userId } = req.body;

  if (!currentUserId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Remove the pending friend request
    await db.none(`
      DELETE FROM friends
      WHERE user_id = $1 AND friend_id = $2 AND status = 'requested'
    `, [currentUserId, userId]);

    // Remove the related notification
    await db.none(`
      DELETE FROM notifications
      WHERE sender_id = $1 AND receiver_id = $2 AND type = 'follow_request'
    `, [currentUserId, userId]);

    res.sendStatus(200);
  } catch (err) {
    console.error("Cancel follow request error:", err);
    res.status(500).json({ error: 'Failed to cancel request' });
  }
});

// Unfollow a user
app.post('/api/friends/unfollow', async (req, res) => {
  const currentUserId = req.session.user?.id;
  const { userId } = req.body;

  if (!currentUserId) return res.status(401).send({ error: 'Unauthorized' });

  try {
    await db.none(`
      DELETE FROM friends WHERE user_id = $1 AND friend_id = $2
    `, [currentUserId, userId]);

    // Step 2: Update counts
    await db.none(`
      UPDATE users SET following_count = GREATEST(COALESCE(following_count, 1) - 1, 0)
      WHERE id = $1
    `, [userId]);

    await db.none(`
      UPDATE users SET followers_count = GREATEST(COALESCE(followers_count, 1) - 1, 0)
      WHERE id = $1
    `, [unfollowUserId]);

    res.sendStatus(200);
  } catch (err) {
    console.error("Unfollow error:", err);
    res.status(500).send({ error: 'Failed to unfollow user' });
  }
});

app.post('/api/follow-request/approve/:id', async (req, res) => {
  const receiverId = req.session.user?.id; // The user approving the request
  const requesterId = parseInt(req.params.id);

  if (!receiverId) return res.status(401).send({ error: 'Unauthorized' });

  try {
    // Step 1: Update friends table
    await db.none(`
      UPDATE friends
      SET status = 'following'
      WHERE user_id = $1 AND friend_id = $2
    `, [requesterId, receiverId]);

    await db.none(`
      UPDATE users SET followers_count = COALESCE(followers_count, 0) + 1 WHERE id = $1
    `, [receiverId]);

    await db.none(`
      UPDATE users SET following_count = COALESCE(following_count, 0) + 1 WHERE id = $1
    `, [requesterId]);

    // Step 2: Delete the original notification
    await db.none(`
      DELETE FROM notifications
      WHERE sender_id = $1 AND receiver_id = $2 AND type = 'follow_request'
    `, [requesterId, receiverId]);

    // Step 3: Send a notification to the requester (who sent the follow request)
    await db.none(`
      INSERT INTO notifications (sender_id, receiver_id, message, type)
      VALUES ($1, $2, $3, 'general')
    `, [receiverId, requesterId, 'accepted your follow request']);

    // Step 4: Create a general notification for the approver
    await db.none(`
      INSERT INTO notifications (sender_id, receiver_id, message, type)
      VALUES ($1, $2, $3, 'general')
    `, [requesterId, receiverId, 'You are now following this user']);

    res.sendStatus(200);
  } catch (err) {
    console.error("Approve follow error:", err);
    res.status(500).send({ error: 'Failed to approve request' });
  }
});


// Decline a follow request
app.post('/api/follow-request/decline/:id', async (req, res) => {
  const receiverId = req.session.user?.id;
  const requesterId = parseInt(req.params.id);

  if (!receiverId) return res.status(401).send({ error: 'Unauthorized' });

  try {
    // Remove the friend record entirely
    await db.none(`
      DELETE FROM friends
      WHERE user_id = $1 AND friend_id = $2
    `, [requesterId, receiverId]);

    // Optionally: remove the corresponding notification
    await db.none(`
      DELETE FROM notifications
      WHERE sender_id = $1 AND receiver_id = $2 AND type = 'follow_request'
    `, [requesterId, receiverId]);

    res.sendStatus(200);
  } catch (err) {
    console.error("Decline follow error:", err);
    res.status(500).send({ error: 'Failed to decline request' });
  }
});


app.get('/api/notifications', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Everything except follow requests, newest first (includes run alerts).
    const general = await db.any(
      `SELECT * FROM notifications WHERE receiver_id = $1 AND type <> 'follow_request' ORDER BY created_at DESC`,
      [userId]
    );
    const requests = await db.any(
      'SELECT * FROM notifications WHERE receiver_id = $1 AND type = $2',
      [userId, 'follow_request']
    );

    console.log("📬 Notifications fetched for user:", userId);
    //console.log("🔔 General:", general);
    //console.log("🤝 Requests:", requests);

    res.json({ general, requests });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/dismiss/:id', async (req, res) => {
  const userId = req.session.user?.id;
  const notificationId = parseInt(req.params.id);

  if (!userId) {
    return res.status(401).send({ error: 'Unauthorized' });
  }

  try {
    await db.none(
      `DELETE FROM notifications WHERE id = $1 AND receiver_id = $2`,
      [notificationId, userId]
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error dismissing notification:', err);
    res.status(500).send({ error: 'Failed to dismiss notification' });
  }
});

// New notifications since the last one the client has seen, for live pop-ups.
// Without ?after it only returns the latest id, so old notifications don't pop up on page load.
app.get('/api/notifications/live', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const after = Number(req.query.after);
    const [notifications, summary] = await Promise.all([
      Number.isInteger(after)
        ? db.any(`
            SELECT id, sender_username, profile_icon, message, type, run_id, created_at
            FROM notifications
            WHERE receiver_id = $1 AND id > $2
            ORDER BY id
          `, [userId, after])
        : [],
      db.one(`
        SELECT COALESCE(MAX(id), 0) AS latest_id, COUNT(*) FILTER (WHERE NOT is_read) AS unread
        FROM notifications
        WHERE receiver_id = $1
      `, [userId]),
    ]);

    res.json({
      notifications,
      latest_id: summary.latest_id,
      unread_count: parseInt(summary.unread),
    });
  } catch (err) {
    console.error('❌ Error loading live notifications:', err);
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

app.post('/api/notifications/read-all', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    await db.none(`UPDATE notifications SET is_read = TRUE WHERE receiver_id = $1 AND NOT is_read`, [userId]);
    res.sendStatus(200);
  } catch (err) {
    console.error('❌ Error marking notifications read:', err);
    res.status(500).json({ error: 'Failed to mark notifications read' });
  }
});

// *****************************************************
// <!-- Start Run commands -->
// *****************************************************
app.get('/api/start-run', async (req, res) => {
  const userId = req.session.user?.id;

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const friends = await db.any(`
      SELECT u.id, u.first_name, u.last_name, u.profile_picture
      FROM friends f
      JOIN users u ON 
        (u.id = f.friend_id AND f.user_id = $1) OR 
        (u.id = f.user_id AND f.friend_id = $1)
      WHERE f.status = 'following'
    `, [userId]);

    const runDefaults = {
      duration_min: 30,
      location: "Main Campus",
      time_range: {
        min: 5,
        max: 90
      }
    };

    res.status(200).json({
      friends,
      defaults: runDefaults
    });

  } catch (err) {
    console.error("❌ Error in /api/start-run:", err);
    res.status(500).json({ error: "Failed to load start run data" });
  }
});

// *****************************************************
// <!-- Runs: start, live location, check-in, tracking -->
// *****************************************************
async function getRunWatchers(runId) {
  return db.any(`
    SELECT u.id, u.first_name, u.phone_number
    FROM run_watchers rw
    JOIN users u ON u.id = rw.watcher_id
    WHERE rw.run_id = $1
  `, [runId]);
}

app.post('/api/start-run', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { duration_minutes, location } = req.body;
  const watcherIds = Array.isArray(req.body.watcher_ids) ? req.body.watcher_ids : [];
  const minutes = Number(duration_minutes);
  // Short runs are allowed outside production so the safety flow can be tested quickly.
  const minMinutes = process.env.NODE_ENV === 'production' ? 5 : 1;
  if (!location || !Number.isInteger(minutes) || minutes < minMinutes || minutes > 180) {
    return res.status(400).json({ error: `A location and a duration between ${minMinutes} and 180 minutes are required` });
  }

  try {
    const active = await db.oneOrNone(
      `SELECT id FROM runs WHERE user_id = $1 AND status IN ('in_progress', 'overdue')`, [userId]
    );
    if (active) return res.status(409).json({ error: 'You already have a run in progress', runId: active.id });

    // Create the run and its watchers together so we never end up with a run missing its watchers.
    const runId = await db.tx(async t => {
      const run = await t.one(`
        INSERT INTO runs (user_id, location, duration_minutes, start_time, end_time)
        VALUES ($1, $2, $3, NOW(), NOW() + ($3 * INTERVAL '1 minute'))
        RETURNING id
      `, [userId, location, minutes]);

      await t.batch(watcherIds.map(watcherId =>
        t.none(`INSERT INTO run_watchers (run_id, watcher_id) VALUES ($1, $2)`, [run.id, watcherId])
      ));
      return run.id;
    });

    const runner = req.session.user;
    const watchers = await getRunWatchers(runId);
    for (const watcher of watchers) {
      await notify({
        to: watcher,
        from: runner,
        runId,
        message: `started a run at ${location} and should be back in about ${minutes} minutes.`,
        smsText: `${runner.first_name} ${runner.last_name} just started a run at ${location} and should be back in about ` +
          `${minutes} minutes. Follow along: ${trackingLink(runId)}`,
      });
    }

    res.status(201).json({ message: 'Run started and watchers notified!', runId });
  } catch (err) {
    console.error('❌ Error starting run:', err);
    res.status(500).json({ error: 'Something went wrong when starting the run' });
  }
});

// The runner's current run, so the Start Run page can resume after a refresh.
app.get('/api/runs/active', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const run = await db.oneOrNone(`
      SELECT id, location, duration_minutes, start_time, end_time, status
      FROM runs
      WHERE user_id = $1 AND status IN ('in_progress', 'overdue')
      ORDER BY start_time DESC
      LIMIT 1
    `, [userId]);

    if (run) {
      run.watchers = await db.any(`
        SELECT u.id, u.first_name, u.last_name, u.profile_picture
        FROM run_watchers rw
        JOIN users u ON u.id = rw.watcher_id
        WHERE rw.run_id = $1
        ORDER BY u.first_name
      `, [run.id]);
    }
    res.json({ run });
  } catch (err) {
    console.error('❌ Error loading active run:', err);
    res.status(500).json({ error: 'Failed to load active run' });
  }
});

// Live location ping from the runner's browser.
app.post('/api/runs/:id/location', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }

  try {
    const result = await db.result(`
      UPDATE runs
      SET last_lat = $3, last_lng = $4, last_location_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status IN ('in_progress', 'overdue')
    `, [req.params.id, userId, lat, lng]);

    if (result.rowCount === 0) return res.status(404).json({ error: 'No active run found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('❌ Error saving location:', err);
    res.status(500).json({ error: 'Failed to save location' });
  }
});

// Check in or extend a run. Adds time to whatever is left (or to now, if the run is already
// past its planned end), cancels any pending alert, and keeps watchers in the loop.
app.post('/api/runs/:id/checkin', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const extraMinutes = Number(req.body.extra_minutes || 10);
  if (!Number.isInteger(extraMinutes) || extraMinutes < 1 || extraMinutes > 120) {
    return res.status(400).json({ error: 'extra_minutes must be between 1 and 120' });
  }

  try {
    const run = await db.oneOrNone(`
      UPDATE runs r
      SET end_time = GREATEST(old.end_time, NOW()) + ($3 * INTERVAL '1 minute'),
          status = 'in_progress',
          checkin_sent_at = NULL,
          overdue_alert_sent_at = NULL
      FROM runs old
      WHERE r.id = old.id AND r.id = $1 AND r.user_id = $2 AND r.status IN ('in_progress', 'overdue')
      RETURNING r.end_time, old.status AS previous_status, old.end_time > NOW() AS was_on_time
    `, [req.params.id, userId, extraMinutes]);

    if (!run) return res.status(404).json({ error: 'No active run found' });

    // If watchers were already alerted, let them know the runner is OK.
    // If the runner extended ahead of time, let them know to expect them later.
    const runner = req.session.user;
    let update = null;
    if (run.previous_status === 'overdue') {
      update = { message: 'checked in and is OK.', smsText: `✅ ${runner.first_name} checked in and is OK.` };
    } else if (run.was_on_time) {
      update = {
        message: `added ${extraMinutes} minutes to their run.`,
        smsText: `${runner.first_name} added ${extraMinutes} minutes to their run.`,
      };
    }

    if (update) {
      const watchers = await getRunWatchers(req.params.id);
      for (const watcher of watchers) {
        await notify({ to: watcher, from: runner, runId: Number(req.params.id), ...update });
      }
    }

    res.json({ end_time: run.end_time });
  } catch (err) {
    console.error('❌ Error checking in:', err);
    res.status(500).json({ error: 'Failed to check in' });
  }
});

// Active runs the logged-in user is watching (powers the in-app "on a run" banner).
app.get('/api/runs/watching', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const runs = await db.any(`
      SELECT r.id, r.status, r.location, r.end_time, u.first_name, u.last_name, u.profile_picture, u.phone_number
      FROM run_watchers rw
      JOIN runs r ON r.id = rw.run_id
      JOIN users u ON u.id = r.user_id
      WHERE rw.watcher_id = $1 AND r.status IN ('in_progress', 'overdue')
      ORDER BY (r.status = 'overdue') DESC, r.start_time DESC
    `, [userId]);
    res.json({ runs });
  } catch (err) {
    console.error('❌ Error loading watched runs:', err);
    res.status(500).json({ error: 'Failed to load watched runs' });
  }
});

// Live status for the runner and their watchers.
app.get('/api/runs/:id/track', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const run = await db.oneOrNone(`
      SELECT r.id, r.user_id, r.location, r.start_time, r.end_time, r.finished_at, r.status,
             r.last_lat, r.last_lng, r.last_location_at, u.first_name, u.last_name, u.profile_picture,
             u.phone_number
      FROM runs r
      JOIN users u ON u.id = r.user_id
      WHERE r.id = $1
        AND (r.user_id = $2 OR EXISTS (
          SELECT 1 FROM run_watchers rw WHERE rw.run_id = r.id AND rw.watcher_id = $2
        ))
    `, [req.params.id, userId]);

    if (!run) return res.status(404).json({ error: 'Run not found' });

    // Only watchers get the runner's phone number, so they can call if something's wrong.
    const { phone_number, ...runInfo } = run;
    const isWatcher = run.user_id !== userId;
    res.json({
      ...runInfo,
      phone_number: isWatcher ? phone_number : null,
      map_link: run.last_lat != null ? mapLink(run.last_lat, run.last_lng) : null,
    });
  } catch (err) {
    console.error('❌ Error loading run status:', err);
    res.status(500).json({ error: 'Failed to load run' });
  }
});

// *****************************************************
// <!-- End Run and making posts -->
// *****************************************************
// Backend: Add a POST endpoint to create a new post with run recap


// Get public or private posts
app.get('/api/posts/:visibility', async (req, res) => {
  const userId = req.session.user?.id;
  const { visibility } = req.params;

  if (!userId || !['public', 'private'].includes(visibility)) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const posts = await db.any(
      `SELECT * FROM posts WHERE user_id = $1 AND visibility = $2 ORDER BY created_at DESC`,
      [userId, visibility]
    );
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get posts for a specific user (only public)
// Get public posts for a specific user
app.get('/api/posts/user/:id', async (req, res) => {
  const profileUserId = parseInt(req.params.id);

  if (isNaN(profileUserId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const posts = await db.any(
      `SELECT * FROM posts 
       WHERE user_id = $1 
       AND visibility = 'public' 
       ORDER BY created_at DESC`,
      [profileUserId]
    );

    res.json(posts);
  } catch (err) {
    console.error('Error fetching public posts:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Create uploads directory if needed

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
// Only accept image formats every browser can display (e.g. iPhone HEIC photos won't show in Chrome).
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => cb(null, ALLOWED_IMAGE_TYPES.includes(file.mimetype)),
});

// Finish a run: save the recap post, close out the run, and tell that run's watchers.
app.post('/api/runs/finish', upload.single('photo'), async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const {
    run_id,
    location,
    duration_seconds,
    miles,
    description,
    action // "post" or "save"
  } = req.body;

  const visibility = action === 'post' ? 'public' : 'private';
  const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
  const pace = miles && duration_seconds ? duration_seconds / miles : null;

  try {
    const runId = await db.tx(async t => {
      await t.none(
        `INSERT INTO posts (user_id, content, image, miles, duration_seconds, location, visibility, pace_seconds_per_mile)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [userId, description, imagePath, miles || null, duration_seconds, location, visibility, pace]
      );

      const run = await t.oneOrNone(`
        UPDATE runs
        SET status = 'completed', finished_at = NOW()
        WHERE id = $1 AND user_id = $2 AND status IN ('in_progress', 'overdue')
        RETURNING id
      `, [run_id, userId]);
      return run?.id;
    });

    if (runId) {
      const watchers = await getRunWatchers(runId);
      for (const watcher of watchers) {
        await notify({
          to: watcher,
          from: req.session.user,
          runId,
          message: `safely finished their run at ${location}! ✅`,
          smsText: `✅ ${req.session.user.first_name} just safely finished their run at ${location}!`,
        });
      }
    }

    res.status(201).json({ message: '✅ Run recap saved successfully!' });
  } catch (err) {
    console.error('❌ Error saving run recap:', err);
    res.status(500).json({ error: 'Failed to save run recap' });
  }
});

// Profile update endpoint
app.post('/api/profile/update', upload.single('profile_picture'), async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const { first_name, last_name, email, phone_number, bio } = req.body;
  const profile_picture = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    // Update query (only update profile_picture if a new one is uploaded)
    const updateFields = [
      'first_name = $1',
      'last_name = $2',
      'email = $3',
      // Never blank out the phone number: watchers' safety alerts depend on it.
      "phone_number = COALESCE(NULLIF($4, ''), phone_number)",
      'bio = $5'
    ];
    const updateValues = [first_name, last_name, email, phone_number, bio];

    if (profile_picture) {
      updateFields.push('profile_picture = $6');
      updateValues.push(profile_picture);
    }

    await db.none(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${updateValues.length + 1}`,
      [...updateValues, userId]
    );

    // Fetch updated user info + follower/following counts
    const updatedUser = await db.one(`
      SELECT 
        u.id, u.email, u.first_name, u.last_name, u.profile_picture, u.bio,
        (SELECT COUNT(*) FROM friends WHERE friend_id = u.id AND status = 'following') AS followers_count,
        (SELECT COUNT(*) FROM friends WHERE user_id = u.id AND status = 'following') AS following_count
      FROM users u
      WHERE u.id = $1
    `, [userId]);

    // Update session
    req.session.user = {
      id: updatedUser.id,
      email: updatedUser.email,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      profile_picture: updatedUser.profile_picture,
      bio: updatedUser.bio,
      followers_count: parseInt(updatedUser.followers_count),
      following_count: parseInt(updatedUser.following_count)
    };

    res.status(200).json({ message: 'Profile updated successfully', user: req.session.user });
  } catch (err) {
    console.error('❌ Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get public profile info for any user by ID
app.get('/api/users/:id', async (req, res) => {
  const userId = parseInt(req.params.id);
  const loggedInUserId = req.session.user?.id;

  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const user = await db.oneOrNone(
      `SELECT id, first_name, last_name, bio, profile_picture 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Optional: add followers/following counts for display
    const [followersCount, followingCount] = await Promise.all([
      db.one(`SELECT COUNT(*) FROM friends WHERE friend_id = $1 AND status = 'following'`, [userId]),
      db.one(`SELECT COUNT(*) FROM friends WHERE user_id = $1 AND status = 'following'`, [userId]),
    ]);

     // 🔥 Add friendship status (between logged-in user and this profile user)
     let status = 'none';
     if (loggedInUserId && loggedInUserId != userId) {
       const relation = await db.oneOrNone(`
         SELECT status FROM friends 
         WHERE user_id = $1 AND friend_id = $2
       `, [loggedInUserId, userId]);
 
       if (relation) status = relation.status; // e.g., 'requested' or 'following'
     }
 

    res.json({
      ...user,
      followers_count: parseInt(followersCount.count),
      following_count: parseInt(followingCount.count),
      status,
    });
  } catch (err) {
    console.error('❌ Error fetching user profile:', err);
    res.status(500).json({ error: 'Server error' });
  }
});



// *****************************************************
// <!-- Friend Feed -->
// *****************************************************

app.get('/api/feed', async (req, res) => {
  const userId = req.session.user?.id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const posts = await db.any(`
      SELECT 
        posts.*, 
        users.first_name, 
        users.last_name, 
        users.profile_picture
      FROM posts
      JOIN users ON posts.user_id = users.id
      WHERE posts.visibility = 'public' 
        AND posts.user_id IN (
          SELECT friend_id FROM friends WHERE user_id = $1 AND status = 'following'
        )
      ORDER BY posts.created_at DESC
    `, [userId]);

    res.json(posts);
  } catch (err) {
    console.error('❌ Error fetching feed:', err);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});


// *****************************************************
// <!-- Calender Creation-->
// *****************************************************

app.get('/api/calender', async (req, res) => {
  const me = req.session.user?.id;
  if (!me) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { from, to } = req.query;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const fromISO = from ? new Date(from).toISOString() : monthStart.toISOString();
    const toISO   = to   ? new Date(to).toISOString()   : monthEnd.toISOString();

    // ===========================
    // Get ALL scheduled runs visible to this user
    // ===========================
    const rows = await db.any(
      `
      WITH my_followed AS (
        SELECT friend_id AS friend
        FROM friends
        WHERE user_id = $1 AND status = 'following'
      )
      SELECT
        sr.id,
        sr.organizer_id,
        sr.start_time,
        sr.location,
        sr.expected_miles,
        sr.visibility,
        sr.notes,
        u.first_name,
        u.last_name,
        u.profile_picture,
        CASE
          WHEN sr.organizer_id = $1 THEN 'organizer'
          WHEN sra.user_id IS NOT NULL THEN 'attendee'
          WHEN sr.visibility = 'public' AND sr.organizer_id IN (SELECT friend FROM my_followed) THEN 'friend_public'
          ELSE 'other'
        END AS role
      FROM scheduled_runs sr
      JOIN users u ON u.id = sr.organizer_id
      
      -- check if the current user has joined
      LEFT JOIN scheduled_run_attendees sra
        ON sra.scheduled_run_id = sr.id
       AND sra.user_id = $1
       AND sra.status IN ('going','maybe','invited')
      
      WHERE sr.start_time >= $2
        AND sr.start_time <  $3
        
        AND (
          sr.organizer_id = $1                   -- your runs
          OR sra.user_id IS NOT NULL            -- runs you joined
          OR (sr.visibility = 'public' AND sr.organizer_id IN (SELECT friend FROM my_followed)) -- public friend runs
        )
      
      ORDER BY sr.start_time ASC;
      `,
      [me, fromISO, toISO]
    );

    res.json(rows);
  } catch (err) {
    console.error('❌ Error fetching calendar:', err);
    res.status(500).json({ error: 'Failed to fetch calendar' });
  }
});








// *****************************************************
// <!-- Dev Route: Create Test Friends and Requests -->
// *****************************************************
// http://localhost:5001/dev/create-friends-and-requests
app.get('/dev/create-friends-and-requests', async (req, res) => {
  try {
    const confirmedFriends = [
      { user_id: 6, friend_id: 2 },
      { user_id: 6, friend_id: 3 },
      { user_id: 6, friend_id: 4 }
    ];

    const followRequests = [
      { user_id: 5, friend_id: 6 },
      { user_id: 4, friend_id: 6 },
      { user_id: 1, friend_id: 6 }
    ];

    for (const { user_id, friend_id } of confirmedFriends) {
      await db.none(
        `INSERT INTO friends (user_id, friend_id, status, created_at)
         VALUES ($1, $2, 'following', CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, friend_id) DO NOTHING`,
        [user_id, friend_id]
      );

      const sender = await db.oneOrNone(
        `SELECT first_name, last_name, profile_picture FROM users WHERE id = $1`,
        [friend_id]
      );

      if (sender) {
        const senderName = `${sender.first_name} ${sender.last_name}`;
        const profileIcon = sender.profile_picture || null;

        await db.none(
          `INSERT INTO notifications (sender_id, receiver_id, sender_username, profile_icon, message, type)
           VALUES ($1, $2, $3, $4, $5, 'general')`,
          [
            friend_id,
            user_id,
            senderName,
            profileIcon,
            `${senderName} accepted your follow request.`
          ]
        );
      }
    }

    for (const { user_id, friend_id } of followRequests) {
      await db.none(
        `INSERT INTO friends (user_id, friend_id, status, created_at)
         VALUES ($1, $2, 'requested', CURRENT_TIMESTAMP)
         ON CONFLICT (user_id, friend_id) DO UPDATE SET status = 'requested'`,
        [user_id, friend_id]
      );

      const sender = await db.oneOrNone(
        `SELECT first_name, last_name, profile_picture FROM users WHERE id = $1`,
        [user_id]
      );

      if (sender) {
        const senderName = `${sender.first_name} ${sender.last_name}`;
        const profileIcon = sender.profile_picture || null;

        await db.none(
          `INSERT INTO notifications (sender_id, receiver_id, sender_username, profile_icon, message, type)
           VALUES ($1, $2, $3, $4, $5, 'follow_request')`,
          [
            user_id,
            friend_id,
            senderName,
            profileIcon,
            `${senderName} requested to follow you.`
          ]
        );
      }
    }

    res.send('✅ Test friends and follow requests with correct notification types created.');
  } catch (err) {
    console.error('❌ Error creating test data:', err);
    res.status(500).send('Server error');
  }
});


// *****************************************************
// <!-- Dev Route: Create Test Scheduled Runs (+ attendees) -->
// *****************************************************
// http://localhost:5001/dev/create-scheduled-runs
app.get('/dev/create-scheduled-runs', async (req, res) => {
  // Change this if your logged-in dev user is a different ID
  const ME = 6;

  // Helper: date builder -> ISO at specific hour/min, daysFromNow offset
  const isoAt = (daysFromNow, hour = 7, minute = 0) => {
    const now = new Date();
    const d = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysFromNow,
      hour,
      minute,
      0,
      0
    );
    return d.toISOString(); // UTC ISO
  };

  // Seed data (tweak as you like)
  const seedRuns = [
    // --- Organizer = me (id=6) ---
    {
      organizer_id: ME,
      start_time: isoAt(1, 7, 0),
      location: "Boulder Creek Path",
      expected_miles: 3.5,
      visibility: "public",
      notes: "Easy shakeout"
    },
    {
      organizer_id: ME,
      start_time: isoAt(3, 18, 15),
      location: "CU Rec Center Track",
      expected_miles: 4.0,
      visibility: "private",
      notes: "Evening tempo — meet by gate"
    },
    {
      organizer_id: ME,
      start_time: isoAt(6, 8, 0),
      location: "Chautauqua Bluebell Road",
      expected_miles: 5.2,
      visibility: "public",
      notes: "Hilly route"
    },

    // --- Friends organize public runs ---
    {
      organizer_id: 2,
      start_time: isoAt(2, 7, 30),
      location: "Valmont Bike Park Loop",
      expected_miles: 3.0,
      visibility: "public",
      notes: "Soft surface; relaxed pace"
    },
    {
      organizer_id: 3,
      start_time: isoAt(4, 18, 0),
      location: "Boulder Reservoir",
      expected_miles: 6.0,
      visibility: "public",
      notes: "Sunset loop"
    },
    {
      organizer_id: 4,
      start_time: isoAt(9, 7, 0),
      location: "Wonderland Lake Path",
      expected_miles: 4.5,
      visibility: "public",
      notes: "Shoes test day"
    },

    // --- Friend organizes a private run (should only show if you join) ---
    {
      organizer_id: 4,
      start_time: isoAt(10, 8, 0),
      location: "Marshall Mesa",
      expected_miles: 5.0,
      visibility: "private",
      notes: "Trail; watch mud conditions"
    }
  ];

  // Optional attendees to test joins/roles
  // (We’ll add ME to some friend public runs; and a friend to my public runs)
  const seedAttendees = [
    // I join friend public runs
    { join_on: "Valmont Bike Park Loop", user_id: ME, status: "going" },
    { join_on: "Boulder Reservoir", user_id: ME, status: "maybe" },

    // Friend joins one of my public runs
    { join_on: "Chautauqua Bluebell Road", user_id: 2, status: "going" },

    // I also join a friend's private run so it shows up for me
    { join_on: "Marshall Mesa", user_id: ME, status: "invited" }
  ];

  try {
    // Ensure tables exist (no-op if already created)
    await db.none(`
      CREATE TABLE IF NOT EXISTS scheduled_runs (
        id SERIAL PRIMARY KEY,
        organizer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        start_time TIMESTAMP NOT NULL,
        location TEXT NOT NULL,
        expected_miles NUMERIC(5,2) NOT NULL CHECK (expected_miles > 0),
        visibility VARCHAR(10) NOT NULL DEFAULT 'private' CHECK (visibility IN ('private','public')),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS scheduled_run_attendees (
        id SERIAL PRIMARY KEY,
        scheduled_run_id INTEGER NOT NULL REFERENCES scheduled_runs(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(12) NOT NULL DEFAULT 'going' CHECK (status IN ('going','maybe','declined','invited')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_attendee UNIQUE (scheduled_run_id, user_id)
      );
    `);

    // Insert runs
    const inserted = [];
    for (const r of seedRuns) {
      const row = await db.one(
        `
        INSERT INTO scheduled_runs (organizer_id, start_time, location, expected_miles, visibility, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, organizer_id, start_time, location, expected_miles, visibility
        `,
        [
          r.organizer_id,
          r.start_time,
          r.location,
          r.expected_miles,
          r.visibility,
          r.notes || null
        ]
      );
      inserted.push(row);
    }

    // Build a map from location -> run_id for quick attendee linking (dev convenience)
    const byLocation = new Map(inserted.map((r) => [r.location, r.id]));

    // Insert attendees
    const attendeeRows = [];
    for (const a of seedAttendees) {
      const runId = byLocation.get(a.join_on);
      if (!runId) continue; // skip if not found
      try {
        const ar = await db.one(
          `
          INSERT INTO scheduled_run_attendees (scheduled_run_id, user_id, status)
          VALUES ($1, $2, $3)
          ON CONFLICT (scheduled_run_id, user_id) DO UPDATE SET status = EXCLUDED.status
          RETURNING id, scheduled_run_id, user_id, status
          `,
          [runId, a.user_id, a.status]
        );
        attendeeRows.push(ar);
      } catch (e) {
        // ignore duplicate issues, continue seeding
        console.warn("Attendee insert warning:", e.message);
      }
    }

    res.json({
      ok: true,
      inserted_runs: inserted.length,
      inserted_attendees: attendeeRows.length,
      sample: {
        runs: inserted.slice(0, 3),
        attendees: attendeeRows.slice(0, 3)
      }
    });
  } catch (err) {
    console.error("❌ Error creating scheduled runs:", err);
    res.status(500).send("Server error creating scheduled runs");
  }
});




// *****************************************************
// <!-- Section 5 : Start Server -->
// *****************************************************
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});