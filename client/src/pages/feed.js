import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaRunning } from 'react-icons/fa';
import PostCard from '../components/postCard';

const Feed = () => {
  const [posts, setPosts] = useState(null); // null while loading

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        const res = await fetch('/api/feed', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) setPosts(data);
        else {
          console.error(data.error);
          setPosts([]);
        }
      } catch (err) {
        console.error('Error fetching feed:', err);
        setPosts([]);
      }
    };

    fetchFeed();
  }, []);

  return (
    <div className="rh-page mt-4 mb-5" style={{ maxWidth: 640 }}>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Feed</h2>
        <div className="rh-subtle">Runs from people you follow</div>
      </div>

      <Link to="/start-run" className="rh-card d-flex align-items-center gap-3 mb-4 text-decoration-none">
        <span
          className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
          style={{ width: 44, height: 44, background: 'var(--rh-pink-soft)', color: 'var(--rh-pink)' }}
        >
          <FaRunning />
        </span>
        <span className="flex-grow-1 rh-subtle">Heading out? Start a run and pick who's watching.</span>
        <span className="rh-btn rh-btn-primary">Start run</span>
      </Link>

      {posts === null && <p className="rh-subtle text-center">Loading…</p>}

      {posts?.length === 0 && (
        <div className="rh-card text-center py-5">
          <div style={{ fontSize: '2.5rem' }}>👟</div>
          <div className="rh-card-title mt-2">Your feed is empty</div>
          <p className="rh-subtle mb-3">Follow friends to see their runs here.</p>
          <Link to="/friends" className="rh-btn rh-btn-primary">Find friends</Link>
        </div>
      )}

      {posts?.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
};

export default Feed;
