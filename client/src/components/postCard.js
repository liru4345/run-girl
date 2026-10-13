import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaMapMarkerAlt, FaLock } from "react-icons/fa";
import Avatar from "./avatar";
import PostEngagement from "./postEngagement";
import { timeAgo } from "../timeAgo";

// A run post, styled like a social feed card. Used on the feed and on profiles.

const formatDuration = (totalSeconds) => {
  if (!totalSeconds) return "–";
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.round((totalSeconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
};

const formatPace = (paceSeconds) => {
  if (!paceSeconds) return "–";
  const minutes = Math.floor(paceSeconds / 60);
  const seconds = Math.round(paceSeconds % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}/mi`;
};

export { timeAgo } from "../timeAgo";

const PostCard = ({ post, author, showComments = false }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const person = author || post;
  const miles = Number(post.miles);

  return (
    <article className="rh-card rh-post mb-4 p-0 overflow-hidden">
      <header className="d-flex align-items-center gap-3 px-4 pt-4 pb-3">
        <Link to={`/profile/${post.user_id}`} className="text-decoration-none">
          <Avatar src={person.profile_picture} firstName={person.first_name} lastName={person.last_name} size={44} />
        </Link>
        <div className="flex-grow-1">
          <Link to={`/profile/${post.user_id}`} className="rh-person-name text-decoration-none">
            {person.first_name} {person.last_name}
          </Link>
          <div className="rh-subtle small">
            {timeAgo(post.created_at)}
            {post.location && (
              <>
                {" · "}
                <FaMapMarkerAlt className="me-1" style={{ color: "var(--rh-pink)" }} />
                {post.location}
              </>
            )}
          </div>
        </div>
        {post.visibility === "private" && (
          <span className="rh-status-pill off" title="Only you can see this run">
            <FaLock /> Private
          </span>
        )}
      </header>

      {post.content && <p className="px-4 mb-3" style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>}

      {post.image && !imageFailed && (
        <img
          src={post.image}
          alt={`${person.first_name}'s run`}
          className="w-100"
          style={{ maxHeight: 460, objectFit: "cover" }}
          onError={() => setImageFailed(true)}
        />
      )}

      <div className="rh-stats p-4">
        <div className="rh-stat">
          <div className="rh-label">Distance</div>
          <div className="rh-stat-value">{miles ? `${miles} mi` : "–"}</div>
        </div>
        <div className="rh-stat">
          <div className="rh-label">Time</div>
          <div className="rh-stat-value">{formatDuration(post.duration_seconds)}</div>
        </div>
        <div className="rh-stat">
          <div className="rh-label">Pace</div>
          <div className="rh-stat-value">{formatPace(post.pace_seconds_per_mile)}</div>
        </div>
      </div>

      <PostEngagement post={post} startOpen={showComments} />
    </article>
  );
};

export default PostCard;
