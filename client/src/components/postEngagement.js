import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { FaHeart, FaRegHeart, FaRegComment, FaTrashAlt } from "react-icons/fa";
import Avatar from "./avatar";
import { timeAgo } from "../timeAgo";

// Like button, comment count, and the comment thread at the bottom of a post card.
const PostEngagement = ({ post, startOpen = false }) => {
  const [liked, setLiked] = useState(Boolean(post.liked_by_me));
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [showComments, setShowComments] = useState(startOpen);
  const [comments, setComments] = useState(null); // null until loaded
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) {
        setComments(data);
        setCommentCount(data.length);
      }
    } catch (err) {
      setComments([]);
    }
  }, [post.id]);

  useEffect(() => {
    if (showComments && comments === null) loadComments();
  }, [showComments, comments, loadComments]);

  // Update the heart immediately, then sync with the server's answer.
  const toggleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((n) => n + (wasLiked ? -1 : 1));
    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.like_count);
    } catch (err) {
      setLiked(wasLiked);
      setLikeCount((n) => n + (wasLiked ? 1 : -1));
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setPosting(true);
    setError("");
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Couldn't post your comment.");
        return;
      }
      setComments((list) => [...(list || []), data]);
      setCommentCount((n) => n + 1);
      setDraft("");
    } catch (err) {
      setError("Couldn't post your comment.");
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (id) => {
    try {
      const res = await fetch(`/api/comments/${id}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setComments((list) => list.filter((c) => c.id !== id));
        setCommentCount((n) => n - 1);
      }
    } catch (err) {
      // Leave the comment in place if the delete didn't go through.
    }
  };

  return (
    <div className="px-4 pb-3">
      <div className="d-flex align-items-center gap-1 rh-engagement">
        <button
          type="button"
          className={`rh-engage-btn ${liked ? "liked" : ""}`}
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? "Unlike" : "Like"}
        >
          {liked ? <FaHeart /> : <FaRegHeart />}
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          className={`rh-engage-btn ${showComments ? "active" : ""}`}
          onClick={() => setShowComments((open) => !open)}
          aria-expanded={showComments}
          aria-label="Comments"
        >
          <FaRegComment />
          <span>{commentCount}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-2">
          {comments === null && <div className="rh-subtle small py-2">Loading comments…</div>}

          {comments?.length === 0 && <div className="rh-subtle small py-2">No comments yet. Be the first!</div>}

          {comments?.map((c) => (
            <div key={c.id} className="d-flex gap-2 py-2 rh-comment">
              <Link to={`/profile/${c.user_id}`}>
                <Avatar src={c.profile_picture} firstName={c.first_name} lastName={c.last_name} size={32} />
              </Link>
              <div className="flex-grow-1 rh-comment-bubble">
                <div className="d-flex justify-content-between align-items-baseline gap-2">
                  <Link to={`/profile/${c.user_id}`} className="rh-person-name small text-decoration-none">
                    {c.first_name} {c.last_name}
                  </Link>
                  <span className="rh-subtle" style={{ fontSize: 12 }}>{timeAgo(c.created_at)}</span>
                </div>
                <div className="small" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{c.content}</div>
              </div>
              {c.can_delete && (
                <button
                  type="button"
                  className="rh-icon-btn flex-shrink-0"
                  style={{ width: 30, height: 30, fontSize: "0.8rem" }}
                  onClick={() => deleteComment(c.id)}
                  aria-label="Delete comment"
                  title="Delete comment"
                >
                  <FaTrashAlt />
                </button>
              )}
            </div>
          ))}

          <form className="d-flex gap-2 mt-2" onSubmit={submitComment}>
            <input
              type="text"
              className="form-control rh-input"
              style={{ padding: "8px 14px" }}
              placeholder="Add a comment…"
              maxLength={500}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Add a comment"
            />
            <button type="submit" className="rh-btn rh-btn-primary" style={{ padding: "8px 16px" }} disabled={posting || !draft.trim()}>
              Post
            </button>
          </form>
          {error && <div className="rh-notice error mt-2 small">{error}</div>}
        </div>
      )}
    </div>
  );
};

export default PostEngagement;
