-- Insert sample users
INSERT INTO users (first_name, last_name, email, password, phone_number, profile_picture, bio)
VALUES
  ('Elizabeth', 'Ruff', 'lizzie@run-girl.com', '$2a$10$hashedpass1', '111-111-1111', NULL, 'Lover of code and coffee ☕'),
  ('Sarah', 'Miles', 'sarah@run-girl.com', '$2a$10$hashedpass2', '222-222-2222', NULL, 'Running for change 🏃‍♀️'),
  ('Jamie', 'Wells', 'jamie@run-girl.com', '$2a$10$hashedpass3', '333-333-3333', NULL, 'Code. Coffee. Repeat.'),
  ('Nina', 'Brown', 'nina@run-girl.com', '$2a$10$hashedpass4', '444-444-4444', NULL, 'UI/UX enthusiast 🌈'),
  ('Tina', 'Nguyen', 'tina@run-girl.com', '$2a$10$hashedpass5', '555-555-5555', NULL, 'Dreaming big & running fast.'),
  ('Alexa', 'Lopez', 'alexa@run-girl.com', '$2a$10$hashedpass6', '666-666-6666', NULL, 'Marathon mindset 🥇');

-- Optionally: simulate some friendships
-- Elizabeth (id = 1) requested Sarah (id = 2), is following Jamie (id = 3)
INSERT INTO friends (user_id, friend_id, status)
VALUES
  (1, 2, 'pending'),
  (1, 3, 'following'),
  (3, 1, 'following'), -- Jamie follows Elizabeth back
  (2, 4, 'pending');   -- Sarah requested Nina
