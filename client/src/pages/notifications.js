import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/avatar';
import { UNREAD_EVENT } from '../components/notificationToaster';
import { checkInRun } from '../runActions';

const Notifications = () => {
  const [general, setGeneral] = useState([]);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [checkInResults, setCheckInResults] = useState({}); // notification id -> result message

  const handleCheckIn = async (notif) => {
    try {
      await checkInRun(notif.run_id);
      setCheckInResults((r) => ({ ...r, [notif.id]: "✅ Checked in. Your watchers won't be alerted for another 10 minutes." }));
    } catch (err) {
      setCheckInResults((r) => ({ ...r, [notif.id]: 'This run has already ended.' }));
    }
  };

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        setGeneral(data.general || []);
        setRequests(data.requests || []);
      });

    // Opening this page counts as reading everything.
    fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' })
      .then(() => window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: 0 })))
      .catch(() => {});
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
          {general.length === 0 && <p className="text-muted">No notifications yet.</p>}
          {general.map((notif) => {
            const fromRunHer = notif.sender_username === 'RunHer';
            const urgent = notif.type === 'run_alert';
            const [firstName = '', lastName = ''] = (notif.sender_username || '').split(' ');
            return (
              <div
                key={notif.id}
                className={`card notification-card mb-2 p-3 position-relative ${urgent ? 'border-danger' : ''} ${notif.is_read ? '' : 'bg-light'}`}
              >
                <div className="d-flex align-items-start">
                  {fromRunHer ? (
                    <img src="/img/runHerLogo.png" alt="RunHer" width={40} height={40} className="me-3" style={{ objectFit: 'contain' }} />
                  ) : (
                    <Avatar src={notif.profile_icon} firstName={firstName} lastName={lastName} size={40} className="me-3" />
                  )}
                  <div className="flex-grow-1 text-start">
                    {urgent && <span className="text-danger fw-semibold">⚠️ </span>}
                    {!fromRunHer && <strong>{notif.sender_username} </strong>}
                    {notif.message}
                    <br />
                    <small className="text-muted">{new Date(notif.created_at).toLocaleString()}</small>
                    {notif.run_id && fromRunHer && (
                      <div className="mt-2">
                        {checkInResults[notif.id] ? (
                          <small>{checkInResults[notif.id]}</small>
                        ) : (
                          <button className="btn btn-sm btn-warning" onClick={() => handleCheckIn(notif)}>
                            I'm OK, add 10 minutes
                          </button>
                        )}
                      </div>
                    )}
                    {notif.run_id && !fromRunHer && (
                      <div>
                        <Link
                          to={`/track/${notif.run_id}`}
                          className={`btn btn-sm mt-2 ${urgent ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                        >
                          View run
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  className="btn-close position-absolute top-0 end-0 m-2"
                  onClick={() => dismissNotification(notif.id)}
                ></button>
              </div>
            );
          })}

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
                  <Avatar
                    src={req.profile_icon}
                    firstName={(req.sender_username || '').split(' ')[0]}
                    lastName={(req.sender_username || '').split(' ')[1]}
                    size={40}
                    className="me-3"
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
