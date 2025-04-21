import React, { useEffect, useState } from 'react';

const Notifications = () => {
  const [general, setGeneral] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setGeneral(data.general || []);
        setRequests(data.requests || []);
      });
  }, []);

  const handleFollowAction = async (senderId, action) => {
    try {
      const res = await fetch(`/api/follow-request/${action}/${senderId}`, {
        method: 'POST'
      });
  
      const text = await res.text(); // <-- helpful for debugging
  
      if (!res.ok) {
        console.error(`❌ Failed ${action}:`, text);
        alert(`Action failed: ${text}`);
      } else {
        setRequests((prev) => prev.filter((r) => r.sender_id !== senderId));
      }
    } catch (err) {
      console.error(`❌ Error during ${action}:`, err);
      alert('Something went wrong.');
    }
  };

  const dismissNotification = async (id) => {
    try {
      await fetch(`/api/notifications/dismiss/${id}`, { method: 'POST' });
      setGeneral((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container py-3 mt-5">
      <h3 className="mb-4">Notifications</h3>

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
            All
          </button>
        </li>
        <li className="nav-item">
          <button className={`nav-link ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Requests
          </button>
        </li>
      </ul>

      {/* All Notifications */}
      {activeTab === 'all' && (
        <div>
          {general.map((notif) => (
            <div
              key={notif.id}
              className="card notification-card mb-2 p-3 d-flex justify-content-between align-items-center"
            >
              {/* Left side: user info and message */}
              <div className="d-flex align-items-center">
                <img
                  src={notif.profile_icon || 'https://via.placeholder.com/40'}
                  alt="profile"
                  className="me-3 rounded-circle"
                  width={40}
                  height={40}
                />
                <div>
                  <strong>{notif.sender_username}</strong> {notif.message}
                  <br />
                  <small className="text-muted">{notif.created_at}</small>
                </div>
              </div>

              {/* Right side: dismiss button */}
              <button
                className="btn-close position-absolute top-0 end-0 m-2"
                onClick={() => dismissNotification(notif.id)}
              ></button>
            </div>
          ))}

        </div>
      )}

      {/* Follow Requests */}
      {activeTab === 'requests' && (
        <div>
          {requests.map((req) => (
            <div key={req.request_id} className="card notification-card mb-2 p-3">
              <div className="d-flex justify-content-between align-items-center">
                {/* Left side: profile and text */}
                <div className="d-flex align-items-center">
                  <img
                    src={req.profile_pic || 'https://via.placeholder.com/40'}
                    alt="profile"
                    className="me-3 rounded-circle"
                    width={40}
                    height={40}
                  />
                  <div>
                    <strong>{req.sender_username}</strong> requested to follow you.
                    <br />
                    <small className="text-muted">{req.requested_at}</small>
                  </div>
                </div>

                {/* Right side: action buttons */}
                <div className="d-flex gap-2 ms-3">
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => handleFollowAction(req.sender_id, 'approve')}
                  >
                    Approve
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => handleFollowAction(req.sender_id, 'decline')}
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
