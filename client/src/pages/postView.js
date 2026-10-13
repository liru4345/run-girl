import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import PostCard from '../components/postCard';

// A single run post, opened from the calendar.
const PostView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/posts/item/${id}`, { credentials: 'include' })
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) setPost(data);
        else setError(data.error || 'Post not found');
      })
      .catch(() => setError('Post not found'));
  }, [id]);

  return (
    <div className="rh-page mt-4 mb-5" style={{ maxWidth: 640 }}>
      <button className="rh-btn rh-btn-ghost mb-3 px-0" onClick={() => navigate(-1)}>
        <FaArrowLeft /> Back
      </button>
      {error && (
        <div className="rh-card text-center py-5">
          <div className="rh-card-title">{error}</div>
          <p className="rh-subtle mb-0">It may be private or deleted.</p>
        </div>
      )}
      {!post && !error && <p className="rh-subtle text-center">Loading…</p>}
      {post && <PostCard post={post} />}
    </div>
  );
};

export default PostView;
