import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';
import { FaSearch, FaUserPlus, FaUserCheck, FaUserTimes, FaClock } from "react-icons/fa";
import Avatar from "../components/avatar";

function Friends() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState(null); // null while loading
  const [showModal, setShowModal] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState(null);

  // An empty search lists everyone, so the page doubles as "discover runners".
  const handleSearch = useCallback(async () => {
    try {
      const res = await axios.get(`/api/friends/search`, { params: { query: searchTerm.trim() } });
      setResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
      setResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounce = setTimeout(handleSearch, 250);
    return () => clearTimeout(delayDebounce);
  }, [handleSearch]);

  const handleAction = async (userId, action) => {
    try {
      await axios.post(`/api/friends/${action}`, { userId });
      handleSearch();
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const confirmCancel = (userId) => {
    setPendingCancelId(userId);
    setShowModal(true);
  };

  const cancelRequest = async () => {
    try {
      const res = await axios.post("/api/friends/cancel-request", {
        userId: pendingCancelId,
      });

      if (res.status === 200) {
        setShowModal(false);
        setPendingCancelId(null);
        handleSearch();
      }
    } catch (err) {
      console.error("❌ Cancel request failed:", err);
    }
  };

  useEffect(() => {
    document.body.style.overflow = showModal ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [showModal]);

  const searching = searchTerm.trim().length > 0;

  return (
    <div className="rh-page mt-4 mb-5" style={{ maxWidth: 640 }}>
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Find friends</h2>
        <div className="rh-subtle">Follow runners you know, then pick them as watchers on your runs.</div>
      </div>

      <div className="rh-input-icon mb-4">
        <FaSearch />
        <input
          type="search"
          className="form-control rh-input"
          placeholder="Search by name or phone number"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search runners"
          autoFocus
        />
      </div>

      <div className="rh-label mb-2">{searching ? "Results" : "Runners on RunHer"}</div>

      <div className="rh-card p-2">
        {results === null && <p className="rh-subtle text-center my-4">Loading…</p>}

        {results?.length === 0 && (
          <div className="text-center py-5">
            <div style={{ fontSize: "2rem" }}>🔍</div>
            <div className="fw-semibold mt-2">No runners found</div>
            <div className="rh-subtle">Try a different name or phone number.</div>
          </div>
        )}

        {results?.map((user, i) => (
          <div
            key={user.id}
            className="d-flex align-items-center gap-3 p-3"
            style={i > 0 ? { borderTop: "1px solid var(--rh-line)" } : undefined}
          >
            <Link to={`/profile/${user.id}`}>
              <Avatar src={user.profile_picture} firstName={user.first_name} lastName={user.last_name} size={48} />
            </Link>
            <div className="flex-grow-1" style={{ minWidth: 0 }}>
              <Link to={`/profile/${user.id}`} className="rh-person-name text-decoration-none">
                {user.name}
              </Link>
              {user.follows_you && (
                <span className="rh-status-pill off ms-2" style={{ padding: "2px 8px", fontSize: "0.72rem" }}>Follows you</span>
              )}
              {user.bio && <div className="rh-subtle small text-truncate">{user.bio}</div>}
            </div>

            {user.status === "none" && (
              <button className="rh-btn rh-btn-primary" onClick={() => handleAction(user.id, "request")}>
                <FaUserPlus /> {user.follows_you ? "Follow back" : "Follow"}
              </button>
            )}
            {user.status === "requested" && (
              <button className="rh-btn rh-btn-secondary" onClick={() => confirmCancel(user.id)}>
                <FaClock /> Requested
              </button>
            )}
            {user.status === "following" && (
              <button
                className="rh-btn rh-btn-secondary rh-unfollow"
                onClick={() => handleAction(user.id, "unfollow")}
                aria-label={`Unfollow ${user.name}`}
              >
                <span className="rh-when-idle"><FaUserCheck /> Following</span>
                <span className="rh-when-hover"><FaUserTimes /> Unfollow</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(31, 31, 41, 0.45)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <div className="modal-content" style={{ borderRadius: "var(--rh-radius)", border: "none" }}>
              <div className="modal-body p-4 text-center">
                <h5 className="fw-bold">Cancel follow request?</h5>
                <p className="rh-subtle">You can always send another one later.</p>
                <div className="d-flex justify-content-center gap-2">
                  <button className="rh-btn rh-btn-secondary" onClick={() => setShowModal(false)}>Keep request</button>
                  <button className="rh-btn rh-btn-primary" onClick={cancelRequest}>Cancel request</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Friends;
