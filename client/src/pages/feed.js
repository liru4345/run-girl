import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Feed = () => {
  const [posts, setPosts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch('/api/feed', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setPosts(data);
        else console.error(data.error);
      } catch (err) {
        console.error('Error fetching feed:', err);
      }
    };

    fetchFeed();
  }, []);

  const formatPace = (paceSeconds) => {
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🏃‍♀️ Feed</h2>
        <button className="btn btn-outline-primary" onClick={() => navigate('/friends')}>
          🔍 Find Friends
        </button>
      </div>
      <div className="row">
        {posts.map(post => (
          <div key={post.id} className="col-md-6 mb-4">
            <div className="card shadow-sm">
              {post.image && (
                <img
                  src={`http://localhost:5001${post.image}`}
                  alt="post"
                  className="card-img-top"
                  style={{ objectFit: 'cover', height: '300px' }}
                />
              )}
              <div className="card-body">
                <h5 className="card-title">{post.first_name} {post.last_name}</h5>
                <p className="card-text">{post.content}</p>
                <p className="text-muted small mb-0">
                  🏃 {post.miles} miles | ⏱ {Math.floor(post.duration_seconds / 60)} min
                </p>
                <p className="text-muted small">
                  🏁 Pace: {formatPace(post.pace_seconds_per_mile)} min/mile
                </p>
                <p className="text-muted small">
                  📍 {post.location} | {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && <p className="text-center">No posts from people you follow yet!</p>}
      </div>
    </div>
  );
};

export default Feed;
