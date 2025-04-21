import React, { useEffect, useState } from 'react';

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/profile', {
          method: 'GET',
          credentials: 'include',
        });

        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error('❌ Error fetching profile:', err);
        window.location.href = '/login';
      }
    };

    fetchProfile();
  }, []);

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow p-4 text-center">
            <div className="d-flex justify-content-center mb-3">
              <img
                src={user.profile_picture || "https://via.placeholder.com/150"}
                alt="Profile"
                className="rounded-circle"
                width={150}
                height={150}
              />
            </div>
            <h3 className="mb-1">{user.first_name} {user.last_name}</h3>
            <p className="text-muted mb-2">@{user.email.split("@")[0]}</p>
            <p className="lead">{user.bio || <em>No bio yet... ✨</em>}</p>

            <div className="d-flex justify-content-center gap-4 my-3">
              <div>
                <strong>{user.followers_count || 0}</strong>
                <div className="text-muted small">Followers</div>
              </div>
              <div>
                <strong>{user.following_count || 0}</strong>
                <div className="text-muted small">Following</div>
              </div>
            </div>

            <hr />

            <div className="d-flex justify-content-center gap-4 mt-3">
              <button className="btn btn-outline-primary">Edit Profile</button>
              <button className="btn btn-outline-secondary">Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
