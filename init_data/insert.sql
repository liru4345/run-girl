-- USERS
-- Demo accounts: every sample user's password is "runher-demo" (stored as a bcrypt hash)
INSERT INTO users (first_name, last_name, email, password, phone_number, profile_picture, bio, followers_count, following_count)
VALUES
('Kylie', 'Small', 'kylie@example.com', '$2b$10$4A1Ujmol9D4gT1Fu0LSCFumYficdRkddi.496kR1GwrrNCZL0y5Gy', '555-123-4567', '/images/lizzie.png', 'Runner & CS student at CU Boulder.', 2, 3),
('Alex', 'Johnson', 'alexj@example.com', '$2b$10$4A1Ujmol9D4gT1Fu0LSCFumYficdRkddi.496kR1GwrrNCZL0y5Gy', '555-234-5678', '/images/alex.jpg', 'Marathoner & coffee lover.', 1, 2),
('Maria', 'Lopez', 'maria.lopez@example.com', '$2b$10$4A1Ujmol9D4gT1Fu0LSCFumYficdRkddi.496kR1GwrrNCZL0y5Gy', '555-345-6789', '/images/maria.png', 'Trail runner and data scientist.', 3, 1),
('James', 'Lee', 'james.lee@example.com', '$2b$10$4A1Ujmol9D4gT1Fu0LSCFumYficdRkddi.496kR1GwrrNCZL0y5Gy', '555-456-7890', '/images/james.png', 'Training for my first half marathon.', 1, 2),
('Sophia', 'Chen', 'sophia.chen@example.com', '$2b$10$4A1Ujmol9D4gT1Fu0LSCFumYficdRkddi.496kR1GwrrNCZL0y5Gy', '555-567-8901', '/images/sophia.jpg', 'Night runner 🌙. Love hiking too.', 0, 1);

-- FRIENDS
INSERT INTO friends (user_id, friend_id, status)
VALUES
(1, 2, 'following'),
(1, 3, 'following'),
(2, 3, 'requested'),
(3, 4, 'following'),
(4, 5, 'requested');

-- POSTS
INSERT INTO posts (user_id, content, image, miles, duration_seconds, location, visibility, pace_seconds_per_mile)
VALUES
(1, 'Great 5k run this morning!', '/runs/run1.png', 3.10, 1620, 'Boulder, CO', 'public', 522.58),
(2, '10 miles felt amazing today.', '/runs/run2.jpg', 10.00, 5400, 'Seattle, WA', 'public', 540.00),
(3, 'Trail run with friends 🌲', '/runs/run3.png', 6.50, 3900, 'Rocky Mountain NP', 'private', 600.00),
(4, 'First time running at night!', NULL, 2.00, 1200, 'Austin, TX', 'public', 600.00),
(5, 'Quick morning jog before work.', '/runs/run4.jpg', 1.80, 960, 'San Francisco, CA', 'private', 533.33);

-- COMMENTS
INSERT INTO comments (post_id, user_id, content)
VALUES
(1, 2, 'Nice pace! Keep it up!'),
(1, 3, 'Love early morning runs.'),
(2, 1, '10 miles wow, respect 👏'),
(3, 4, 'Trail running is the best!'),
(4, 5, 'Night running sounds fun but scary!');

-- LIKES
INSERT INTO likes (post_id, user_id)
VALUES
(1, 2),
(1, 3),
(2, 1),
(2, 3),
(3, 1),
(4, 2);

-- NOTIFICATIONS
INSERT INTO notifications (sender_id, receiver_id, sender_username, profile_icon, message, type, is_read)
VALUES
(2, 1, 'AlexJ', '/images/alex.jpg', 'Alex sent you a follow request.', 'follow_request', FALSE),
(3, 1, 'MariaL', '/images/maria.png', 'Maria liked your post.', 'general', TRUE),
(1, 2, 'LizzieR', '/images/lizzie.png', 'Lizzie accepted your friend request.', 'general', FALSE),
(4, 3, 'JamesL', '/images/james.png', 'James commented on your post.', 'general', TRUE);

-- RUNS
INSERT INTO runs (user_id, location, duration_minutes, start_time, end_time, status)
VALUES
(1, 'Boulder, CO', 30, '2025-09-20 07:00:00', '2025-09-20 07:30:00', 'completed'),
(2, 'Seattle, WA', 60, '2025-09-21 08:00:00', '2025-09-21 09:00:00', 'completed'),
(3, 'Rocky Mountain NP', 45, '2025-09-22 06:30:00', '2025-09-22 07:15:00', 'completed'),
(4, 'Austin, TX', 20, '2025-09-22 21:00:00', '2025-09-22 21:20:00', 'completed'),
(5, 'San Francisco, CA', 15, '2025-09-23 06:45:00', '2025-09-23 07:00:00', 'completed');

-- RUN WATCHERS
INSERT INTO run_watchers (run_id, watcher_id)
VALUES
(1, 2),
(1, 3),
(2, 1),
(3, 4),
(4, 5);
