import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaCheck, FaTimes, FaBell, FaUserFriends } from 'react-icons/fa';
import Avatar from '../components/avatar';
import RunHerBadge from '../components/runHerBadge';
import { timeAgo } from '../components/postCard';
import { UNREAD_EVENT } from '../components/notificationToaster';
import { checkInRun } from '../runActions';

const Notifications = () => {
  const [general, setGeneral] = useState(null); // null while loading
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
      })
      .catch(() => setGeneral([]));

    // Opening this page counts as reading everything.
    fetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' })
      .then(() => window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: 0 })))
      .catch(() => {});
  }, []);

  const handleFollowAction = async (senderId, action) => {
    try {
      const res = await fetch(`/api/follow-request/${action}/${senderId}`, { method: 'POST' });
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r.sender_id !== senderId));
      } else {
        console.error(`❌ Failed ${action}:`, await res.text());
      }
    } catch (err) {
      console.error(`❌ Error during ${action}:`, err);
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

  const splitName = (name = '') => name.split(' ');

  return (
    <div className="rh-page mt-4 mb-5" style={{ maxWidth: 640 }}>
      <div className="mb-3">
        <h2 className="fw-bold mb-1">Notifications</h2>
        <div className="rh-subtle">Run updates, safety alerts, and follow requests</div>
      </div>

      <div className="d-flex gap-2 mb-3">
        <button className={`rh-chip ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All
        </button>
        <button className={`rh-chip ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
          Follow requests
          {requests.length > 0 && (
            <span className="badge rounded-pill ms-2" style={{ background: activeTab === 'requests' ? '#fff' : 'var(--rh-pink)', color: activeTab === 'requests' ? 'var(--rh-pink)' : '#fff' }}>
              {requests.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'all' && (
        <div className="rh-card p-2">
          {general === null && <p className="rh-subtle text-center my-4">Loading…</p>}

          {general?.length === 0 && (
            <div className="text-center py-5">
              <FaBell style={{ fontSize: '1.8rem', color: 'var(--rh-pink)' }} />
              <div className="fw-semibold mt-2">You're all caught up</div>
              <div className="rh-subtle">Run updates from friends will show up here.</div>
            </div>
          )}

          {general?.map((notif, i) => {
            const fromRunHer = notif.sender_username === 'RunHer';
            const urgent = notif.type === 'run_alert';
            const [firstName, lastName] = splitName(notif.sender_username);
            return (
              <div
                key={notif.id}
                className="rh-notif d-flex align-items-start gap-3 p-3 position-relative"
                style={{
                  borderTop: i > 0 ? '1px solid var(--rh-line)' : undefined,
                  borderLeft: urgent ? '4px solid #f0436b' : '4px solid transparent',
                  background: notif.is_read ? undefined : 'var(--rh-pink-soft)',
                  borderRadius: 12,
                }}
              >
                {fromRunHer ? (
                  <RunHerBadge size={44} />
                ) : (
                  <Avatar src={notif.profile_icon} firstName={firstName} lastName={lastName} size={44} />
                )}

                <div className="flex-grow-1 pe-4">
                  {urgent && <div className="text-danger fw-semibold small mb-1">⚠️ Safety alert</div>}
                  <div>
                    {!fromRunHer && <strong>{notif.sender_username} </strong>}
                    {notif.message}
                  </div>
                  <div className="rh-subtle small mt-1">{timeAgo(notif.created_at)}</div>

                  {notif.run_id && fromRunHer && notif.run_active && (
                    <div className="mt-2">
                      {checkInResults[notif.id] ? (
                        <span className="rh-subtle small">{checkInResults[notif.id]}</span>
                      ) : (
                        <button className="rh-btn rh-btn-warning" style={{ padding: '6px 14px' }} onClick={() => handleCheckIn(notif)}>
                          <FaCheck /> I'm OK, add 10 minutes
                        </button>
                      )}
                    </div>
                  )}
                  {notif.post_id && (
                    <Link to={`/post/${notif.post_id}`} className="rh-btn rh-btn-secondary mt-2" style={{ padding: '6px 14px' }}>
                      View post
                    </Link>
                  )}
                  {notif.scheduled_run_id && (
                    <Link
                      to={`/calender?run=${notif.scheduled_run_id}`}
                      className="rh-btn rh-btn-secondary mt-2"
                      style={{ padding: '6px 14px' }}
                    >
                      View in calendar
                    </Link>
                  )}
                  {notif.run_id && !fromRunHer && (
                    <Link
                      to={`/track/${notif.run_id}`}
                      className={`rh-btn ${urgent ? 'rh-btn-primary' : 'rh-btn-secondary'} mt-2`}
                      style={{ padding: '6px 14px' }}
                    >
                      {urgent ? 'See where they are' : 'View run'}
                    </Link>
                  )}
                </div>

                <button
                  className="btn-close position-absolute"
                  style={{ top: 16, right: 16, fontSize: '0.7rem' }}
                  aria-label="Dismiss notification"
                  onClick={() => dismissNotification(notif.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="rh-card p-2">
          {requests.length === 0 && (
            <div className="text-center py-5">
              <FaUserFriends style={{ fontSize: '1.8rem', color: 'var(--rh-pink)' }} />
              <div className="fw-semibold mt-2">No follow requests</div>
              <div className="rh-subtle">When someone asks to follow you, you'll see it here.</div>
            </div>
          )}

          {requests.map((req, i) => {
            const [firstName, lastName] = splitName(req.sender_username);
            return (
              <div
                key={req.request_id || req.id}
                className="d-flex align-items-center gap-3 p-3 flex-wrap"
                style={i > 0 ? { borderTop: '1px solid var(--rh-line)' } : undefined}
              >
                <Link to={`/profile/${req.sender_id}`}>
                  <Avatar src={req.profile_icon} firstName={firstName} lastName={lastName} size={44} />
                </Link>
                <div className="flex-grow-1">
                  <Link to={`/profile/${req.sender_id}`} className="rh-person-name text-decoration-none">
                    {req.sender_username}
                  </Link>
                  <div className="rh-subtle small">wants to follow you</div>
                </div>
                <div className="d-flex gap-2">
                  <button className="rh-btn rh-btn-primary" style={{ padding: '6px 16px' }} onClick={() => handleFollowAction(req.sender_id, 'approve')}>
                    <FaCheck /> Accept
                  </button>
                  <button className="rh-btn rh-btn-secondary" style={{ padding: '6px 16px' }} onClick={() => handleFollowAction(req.sender_id, 'decline')}>
                    <FaTimes /> Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Notifications;
