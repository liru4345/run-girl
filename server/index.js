// *****************************************************
// <!-- Section 1 : Import Dependencies -->
// *****************************************************
const express = require('express');
const app = express();
const path = require('path');
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



const connectToDatabase = async (retries = 5) => {
  while (retries) {
    try {
      await db.connect();
      console.log("✅ Database connection successful");
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
    res.status(500).send({ error: 'User registration failed' });
  }
});

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


app.get('/api/profile', async (req, res) => {
  if (!req.session.user) return res.status(401).send({ error: 'Unauthorized' });

  try {
    const user = await db.one(`
      SELECT id, first_name, last_name, email, profile_picture, bio, followers_count, following_count
      FROM users WHERE id = $1
    `, [req.session.user.id]);

    res.status(200).send(user);
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).send({ error: 'Profile fetch failed' });
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
    const general = await db.any(
      'SELECT * FROM notifications WHERE receiver_id = $1 AND type = $2',
      [userId, 'general']
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

app.post('/api/start-run', async (req, res) => {
  console.log("📥 Received run:", req.body); // Add this line
  const userId = req.session.user?.id;
  const { duration_minutes, location, watcher_ids } = req.body;
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + duration_minutes * 60000); // Add minutes

  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  try {
    // Step 1: Insert the run and return the ID
    const run = await await db.one(`
    INSERT INTO runs (user_id, location, duration_minutes, start_time, end_time)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [userId, location, duration_minutes, startTime, endTime]);

    const runId = run.id;

    // Step 2: Insert watchers into the run_watchers table
    const inserts = watcher_ids.map(watcherId =>
      db.none(
        `INSERT INTO run_watchers (run_id, watcher_id) VALUES ($1, $2)`,
        [runId, watcherId]
      )
    );

    await Promise.all(inserts);

    res.status(201).json({ message: 'Run started successfully', runId });

  } catch (err) {
    console.error('❌ Error starting run:', err);
    res.status(500).json({ error: 'Something went wrong when starting the run' });
  }
});




// *****************************************************
// <!-- Dev Route: Create Test Friends and Requests -->
// *****************************************************
// http://localhost:5001/dev/create-friends-and-requests
app.get('/dev/create-friends-and-requests', async (req, res) => {
  try {
    const confirmedFriends = [
      { user_id: 7, friend_id: 2 },
      { user_id: 7, friend_id: 3 },
      { user_id: 7, friend_id: 4 }
    ];

    const followRequests = [
      { user_id: 5, friend_id: 7 },
      { user_id: 6, friend_id: 7 },
      { user_id: 1, friend_id: 7 }
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
// <!-- Section 5 : Start Server -->
// *****************************************************
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});