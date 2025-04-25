import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from 'react-router-dom';


function Friends() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState(null);
  

  const handleSearch = useCallback(async () => {
    try {
      const res = await axios.get(`/api/friends/search?query=${searchTerm}`);
      setResults(res.data);
    } catch (err) {
      console.error("Search failed", err);
    }
  }, [searchTerm]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, handleSearch]);

  const handleAction = async (userId, action) => {
    try {
      console.log("▶️ Sending action:", action, "for user:", userId);
      await axios.post(`/api/friends/${action}`, { userId });
      handleSearch();
    } catch (err) {
      console.error("Action failed", err);
    }
  };

  const confirmCancel = (userId) => {
    console.log("⚠️ Prompting cancel for:", userId);
    setPendingCancelId(userId);
    setShowModal(true);
  };

  const cancelRequest = async () => {
    try {
      console.log("🚫 Canceling follow request for:", pendingCancelId);
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

  return (
    <main className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="text-center mb-4">Find Friends</h1>

          <div className="mb-4">
            <input
              type="text"
              className="form-control"
              placeholder="Search by name or phone number"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ul className="list-group">
            {results.map((user) => (
              <li
                key={user.id}
                className="list-group-item d-flex justify-content-between align-items-center"
              >
                <div>
                  <h5 className="mb-1">
                    <Link to={`/profile/${user.id}`} className="text-decoration-none">
                      {user.name}
                    </Link>
                  </h5>
                  <small className="text-muted">{user.phone}</small>
                </div>
                <div>
                  {user.status === "none" && (
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleAction(user.id, "request")}
                    >
                      Follow
                    </button>
                  )}
                  {user.status === "requested" && (
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => confirmCancel(user.id)}
                    >
                      Requested
                    </button>
                  )}
                  {user.status === "following" && (
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleAction(user.id, "unfollow")}
                    >
                      Unfollow
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {showModal && (
        <>
          <div
            className="modal show fade d-block"
            tabIndex="-1"
            role="dialog"
            style={{ display: "block" }}
          >
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Undo Follow Request</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to cancel this follow request?</p>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-danger" onClick={cancelRequest}>
                    Yes, Undo Request
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </main>
  );
}

export default Friends;