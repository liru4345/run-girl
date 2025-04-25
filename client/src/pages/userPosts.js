import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const UserPosts = () => {
  const [activeTab, setActiveTab] = useState('public');
  const [posts, setPosts] = useState([]);
  const { id } = useParams(); // 🔥 Get user ID from URL

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        let endpoint;
        if (id) {
          // 🔥 Viewing another user's posts → fetch public posts only
          endpoint = `/api/posts/user/${id}`;
        } else {
          // 🔥 Viewing your own posts → fetch by activeTab (public/private)
          endpoint = `/api/posts/${activeTab}`;
        }
  
        const res = await fetch(endpoint, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setPosts(data);
        else console.error(data.error);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };
  
    fetchPosts();
  }, [activeTab, id]);  // 🔥 Depend on both activeTab and id
  

  const formatPace = (paceSeconds) => {
    const minutes = Math.floor(paceSeconds / 60);
    const seconds = Math.round(paceSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">{id ? '📸 Posts' : '📸 Your Posts'}</h2>

      {/* 🔥 Only show tabs if viewing your own posts */}
      {!id && (
        <ul className="nav nav-tabs justify-content-center mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'public' ? 'active' : ''}`}
              onClick={() => setActiveTab('public')}
            >
              Public
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'private' ? 'active' : ''}`}
              onClick={() => setActiveTab('private')}
            >
              Private
            </button>
          </li>
        </ul>
      )}

      {/* Posts */}
      <div className="row">
        {posts.map((post) => (
          <div key={post.id} className="col-md-6 mb-4">
            <div className="card shadow-sm">
              {post.image && (
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}${post.image}`}
                  alt="post"
                  className="card-img-top"
                  style={{ height: '300px', objectFit: 'cover', width: '100%' }}
                />
              )}
              <div className="card-body">
                <p className="card-text">{post.content}</p>
                <p className="text-muted small mb-0">🏃 {post.miles} miles | ⏱ {Math.floor(post.duration_seconds / 60)} min</p>
                <p className="text-muted small">🏁 Pace: {formatPace(post.pace_seconds_per_mile)} min/mile</p>
                <p className="text-muted small">📅 {formatDate(post.created_at)} | 📍 {post.location}</p>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-center">
            No {id ? 'public' : activeTab} posts yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default UserPosts;
