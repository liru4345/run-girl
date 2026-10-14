import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FaMapMarkerAlt, FaPlus, FaEye, FaFlagCheckered, FaCheck, FaCamera, FaUserFriends, FaBullhorn, FaLock,
} from 'react-icons/fa';
import 'animate.css';
import Avatar from '../components/avatar';
import { checkInRun, RUN_UPDATED_EVENT } from '../runActions';

// How often the runner's position is sent to the server while a run is active.
const LOCATION_PING_MS = 15000;
const DURATION_PRESETS = [15, 30, 45, 60, 90];
const EXTEND_PRESETS = [5, 10, 15, 30];

const formatClock = (totalSeconds) => {
  const sign = totalSeconds < 0 ? '-' : '';
  const abs = Math.abs(totalSeconds);
  const hours = Math.floor(abs / 3600);
  const minutes = Math.floor((abs % 3600) / 60);
  const seconds = abs % 60;
  const pad = (n) => (n < 10 ? `0${n}` : `${n}`);
  return hours > 0
    ? `${sign}${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${sign}${minutes}:${pad(seconds)}`;
};

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const StartRun = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [runTime, setRunTime] = useState(30);
  const [location, setLocation] = useState('');
  const [notice, setNotice] = useState(null); // { text, tone: 'success' | 'error' }
  const [activeRun, setActiveRun] = useState(null); // { id, start_time, end_time, status, watchers }
  const [now, setNow] = useState(Date.now());
  const [locationStatus, setLocationStatus] = useState(null); // { sharing: bool, text }
  const [showRecap, setShowRecap] = useState(false);
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [miles, setMiles] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [showExtend, setShowExtend] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState(10);

  const watchIdRef = useRef(null);
  const latestPositionRef = useRef(null);

  const showNotice = (text, tone = 'success') => setNotice({ text, tone });

  const loadActiveRun = async () => {
    const activeRes = await fetch('/api/runs/active', { credentials: 'include' });
    if (!activeRes.ok) return null;
    const { run } = await activeRes.json();
    return run;
  };

  // Load friends, defaults, and any run that's already in progress (e.g. after a page refresh).
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/start-run', { credentials: 'include' });
        const data = await res.json();
        if (res.ok) {
          setFriends(data.friends || []);
          setRunTime(data.defaults?.duration_min || 30);
          setLocation(data.defaults?.location || '');
        }

        const run = await loadActiveRun();
        if (run) {
          setActiveRun(run);
          setLocation(run.location);
        }
      } catch (err) {
        console.error('❌ API error:', err);
      }
    };
    fetchData();
  }, []);

  // Tick once a second while running so the timer and countdown stay current.
  useEffect(() => {
    if (!activeRun) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeRun]);

  // Live location sharing: watch the device position and send the latest fix every few seconds.
  useEffect(() => {
    if (!activeRun) return undefined;

    if (!navigator.geolocation) {
      setLocationStatus({ sharing: false, text: 'Location not supported' });
      return undefined;
    }

    const sendLocation = () => {
      const position = latestPositionRef.current;
      if (!position) return;
      fetch(`/api/runs/${activeRun.id}/location`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(position),
      }).catch((err) => console.error('❌ Location update failed:', err));
    };

    let sentFirstFix = false;
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        latestPositionRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocationStatus({ sharing: true, text: 'Sharing live location' });
        // Send the first fix right away so watchers see the map immediately; then every 15s.
        if (!sentFirstFix) {
          sentFirstFix = true;
          sendLocation();
        }
      },
      (err) => {
        setLocationStatus({
          sharing: false,
          text: err.code === err.PERMISSION_DENIED ? 'Location off · watchers see your planned spot' : 'Finding your location…',
        });
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

    const pinger = setInterval(sendLocation, LOCATION_PING_MS);

    return () => {
      navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(pinger);
    };
    // Only restart location sharing when a different run starts, not on every check-in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRun?.id]);

  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (durationMinutes = runTime) => {
    try {
      const res = await fetch('/api/start-run', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          duration_minutes: durationMinutes,
          watcher_ids: selectedFriends,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setActiveRun(await loadActiveRun());
        setNow(Date.now());
        showNotice(selectedFriends.length ? 'Run started. Your watchers have been notified.' : 'Run started. Have a great run!');
      } else {
        showNotice(`Couldn't start your run: ${data.error}`, 'error');
      }
    } catch (err) {
      console.error('❌ Submission error:', err);
      showNotice('Something went wrong while starting the run.', 'error');
    }
  };

  const handleCheckIn = useCallback(async () => {
    try {
      await checkInRun(activeRun.id); // the RUN_UPDATED_EVENT listener updates the run
      showNotice("Checked in. Your watchers won't be alerted for another 10 minutes.");
    } catch (err) {
      showNotice(`Check-in failed: ${err.message}`, 'error');
    }
  }, [activeRun]);

  // Keep the countdown in sync when the runner checks in from a pop-up or the notifications page.
  useEffect(() => {
    const onRunUpdated = (e) => {
      setActiveRun((run) =>
        run && run.id === Number(e.detail.runId)
          ? { ...run, end_time: e.detail.end_time, status: 'in_progress' }
          : run
      );
    };
    window.addEventListener(RUN_UPDATED_EVENT, onRunUpdated);
    return () => window.removeEventListener(RUN_UPDATED_EVENT, onRunUpdated);
  }, []);

  // Add time while still running, e.g. when you realize you won't be back on time.
  const handleExtend = async () => {
    try {
      const { end_time } = await checkInRun(activeRun.id, extendMinutes);
      setShowExtend(false);
      showNotice(`Added ${extendMinutes} minutes. You're now expected back by ${formatTime(end_time)}.`);
    } catch (err) {
      showNotice(`Couldn't extend your run: ${err.message}`, 'error');
    }
  };

  const handleFinishRun = () => {
    setFinalSeconds(Math.round((Date.now() - new Date(activeRun.start_time)) / 1000));
    setShowRecap(true);
    setShowExtend(false);
    setNotice(null);
  };

  const handleSubmitRecap = async (action) => {
    const formData = new FormData();
    formData.append('run_id', activeRun.id);
    formData.append('location', location);
    formData.append('duration_seconds', finalSeconds);
    formData.append('miles', miles);
    formData.append('description', description);
    formData.append('action', action);
    if (photo) formData.append('photo', photo);

    try {
      const res = await fetch('/api/runs/finish', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      if (res.ok) {
        setShowRecap(false);
        setActiveRun(null);
        setLocationStatus(null);
        setMiles('');
        setDescription('');
        setPhoto(null);
        setSelectedFriends([]);
        showNotice(action === 'post' ? 'Run posted to your feed! 🎉' : 'Run saved to your profile.');
      } else {
        const body = await res.json().catch(() => ({}));
        showNotice(body.error || 'Failed to save your run. Please try again.', 'error');
      }
    } catch (err) {
      console.error('Error saving run:', err);
      showNotice('Failed to save your run. Please try again.', 'error');
    }
  };

  const elapsedSeconds = activeRun ? Math.max(0, Math.round((now - new Date(activeRun.start_time)) / 1000)) : 0;
  const remainingSeconds = activeRun ? Math.round((new Date(activeRun.end_time) - now) / 1000) : 0;
  const isPastDue = activeRun && remainingSeconds <= 0;
  const pace = miles > 0 && finalSeconds ? formatClock(Math.round(finalSeconds / miles)) : null;

  const noticeBanner = notice && (
    <div className={`rh-notice ${notice.tone} mb-3 d-flex justify-content-between align-items-center`}>
      <span>{notice.text}</span>
      <button className="btn-close btn-sm ms-3" aria-label="Dismiss" onClick={() => setNotice(null)} />
    </div>
  );

  // ---------- Recap after finishing ----------
  if (activeRun && showRecap) {
    return (
      <div className="rh-page mt-4 mb-5" style={{ maxWidth: 620 }}>
        <div className="rh-card">
          <div className="text-center mb-4">
            <div style={{ fontSize: '2.5rem' }}>🏁</div>
            <div className="rh-card-title" style={{ fontSize: '1.5rem' }}>Nice run!</div>
            <div className="rh-subtle">{location}</div>
          </div>

          <div className="rh-stats mb-4">
            <div className="rh-stat">
              <div className="rh-label">Time</div>
              <div className="rh-stat-value">{formatClock(finalSeconds)}</div>
            </div>
            <div className="rh-stat">
              <div className="rh-label">Miles</div>
              <div className="rh-stat-value">{miles || '–'}</div>
            </div>
            <div className="rh-stat">
              <div className="rh-label">Pace</div>
              <div className="rh-stat-value">{pace ? `${pace}/mi` : '–'}</div>
            </div>
          </div>

          <div className="mb-3">
            <label className="rh-label mb-1">Distance (miles)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              className="form-control rh-input"
              value={miles}
              onChange={(e) => setMiles(e.target.value)}
              placeholder="e.g. 3.5"
            />
          </div>

          <div className="mb-3">
            <label className="rh-label mb-1">Caption</label>
            <textarea
              className="form-control rh-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How did your run go?"
            />
          </div>

          <div className="mb-4">
            <label className="rh-upload">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="d-none"
                onChange={(e) => setPhoto(e.target.files[0])}
              />
              <FaCamera className="me-2" />
              {photo ? photo.name : 'Add a photo (optional)'}
            </label>
          </div>

          <div className="d-flex flex-column flex-sm-row gap-2">
            <button className="rh-btn rh-btn-primary flex-fill" onClick={() => handleSubmitRecap('post')}>
              <FaBullhorn /> Post to feed
            </button>
            <button className="rh-btn rh-btn-secondary flex-fill" onClick={() => handleSubmitRecap('save')}>
              <FaLock /> Save privately
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Live run ----------
  if (activeRun) {
    const watchers = activeRun.watchers || [];
    return (
      <div className="rh-page mt-4 mb-5" style={{ maxWidth: 620 }}>
        {noticeBanner}

        <div className={`rh-hero mb-3 ${isPastDue ? 'overdue' : ''}`}>
          <div className="fw-semibold mb-1">
            <span className="rh-live-dot" />
            {isPastDue ? 'Past your planned time' : 'Run in progress'}
          </div>
          <div className="rh-timer">{formatClock(elapsedSeconds)}</div>
          <div className="opacity-75">
            <FaMapMarkerAlt className="me-1" />
            {activeRun.location}
          </div>
        </div>

        {isPastDue && (
          <div className="rh-card mb-3 text-center" style={{ borderColor: '#ffb020' }}>
            <div className="rh-card-title">Are you OK?</div>
            <p className="rh-subtle mb-3">Check in so your watchers know you're safe.</p>
            <button className="rh-btn rh-btn-warning rh-btn-block" onClick={handleCheckIn}>
              <FaCheck /> I'm OK, add 10 minutes
            </button>
          </div>
        )}

        <div className="rh-card mb-3">
          <div className="rh-stats mb-3">
            <div className="rh-stat">
              <div className="rh-label">Time left</div>
              <div className="rh-stat-value" style={isPastDue ? { color: '#f0436b' } : undefined}>
                {isPastDue ? 'Overdue' : formatClock(remainingSeconds)}
              </div>
            </div>
            <div className="rh-stat">
              <div className="rh-label">Back by</div>
              <div className="rh-stat-value">{formatTime(activeRun.end_time)}</div>
            </div>
            <div className="rh-stat">
              <div className="rh-label">Started</div>
              <div className="rh-stat-value">{formatTime(activeRun.start_time)}</div>
            </div>
          </div>

          {showExtend ? (
            <div className="p-3 rounded-4" style={{ background: 'var(--rh-pink-soft)' }}>
              <div className="d-flex justify-content-between align-items-baseline mb-2">
                <span className="fw-semibold">Add time to your run</span>
                <span className="rh-subtle">
                  New time: <strong>{formatTime(new Date(activeRun.end_time).getTime() + extendMinutes * 60000)}</strong>
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2 mb-2">
                {EXTEND_PRESETS.map((m) => (
                  <button
                    key={m}
                    className={`rh-chip ${extendMinutes === m ? 'active' : ''}`}
                    onClick={() => setExtendMinutes(m)}
                  >
                    +{m} min
                  </button>
                ))}
              </div>
              <input
                type="range"
                min={5}
                max={60}
                step={5}
                value={extendMinutes}
                onChange={(e) => setExtendMinutes(Number(e.target.value))}
                className="form-range rh-range mb-2"
                aria-label="Minutes to add"
              />
              <div className="d-flex gap-2">
                <button className="rh-btn rh-btn-primary flex-fill" onClick={handleExtend}>
                  Add {extendMinutes} minutes
                </button>
                <button className="rh-btn rh-btn-ghost" onClick={() => setShowExtend(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column flex-sm-row gap-2">
              {!isPastDue && (
                <button className="rh-btn rh-btn-secondary flex-fill" onClick={() => setShowExtend(true)}>
                  <FaPlus /> Add time
                </button>
              )}
              <Link to={`/track/${activeRun.id}`} className="rh-btn rh-btn-secondary flex-fill">
                <FaEye /> Watcher view
              </Link>
            </div>
          )}

          <button className="rh-btn rh-btn-success rh-btn-block mt-3" onClick={handleFinishRun}>
            <FaFlagCheckered /> Finish run
          </button>
        </div>

        <div className="rh-card d-flex align-items-center justify-content-between flex-wrap gap-3">
          <div className="d-flex align-items-center gap-3">
            {watchers.length > 0 ? (
              <>
                <div className="rh-avatar-stack">
                  {watchers.slice(0, 4).map((w) => (
                    <Avatar key={w.id} src={w.profile_picture} firstName={w.first_name} lastName={w.last_name} size={36} />
                  ))}
                </div>
                <div>
                  <div className="fw-semibold">
                    {watchers.map((w) => w.first_name).join(', ')} {watchers.length === 1 ? 'is' : 'are'} watching
                  </div>
                  <div className="rh-subtle">They'll be alerted if you don't check in</div>
                </div>
              </>
            ) : (
              <div>
                <div className="fw-semibold">No watchers on this run</div>
                <div className="rh-subtle">Next time, pick a friend to keep an eye on you</div>
              </div>
            )}
          </div>
          {locationStatus && (
            <span className={`rh-status-pill ${locationStatus.sharing ? 'on' : 'off'}`}>
              <FaMapMarkerAlt /> {locationStatus.text}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ---------- Plan a run ----------
  return (
    <div className="rh-page mt-4 mb-5">
      {noticeBanner}

      <div className="mb-4">
        <h2 className="fw-bold mb-1">Start a run</h2>
        <div className="rh-subtle">Pick who's watching, set your time, and go.</div>
      </div>

      <div className="row g-4">
        <div className="col-lg-5">
          <div className="rh-card h-100">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <div className="rh-card-title"><FaUserFriends className="me-2 text-primary" />Who's watching?</div>
              {selectedFriends.length > 0 && (
                <span className="badge rounded-pill bg-pink">{selectedFriends.length} selected</span>
              )}
            </div>
            <p className="rh-subtle mb-3">
              Pick from your friends (people you follow who follow you back). They're notified when you head out and alerted if you don't check in on time.
            </p>

            {friends.length === 0 ? (
              <div className="text-center rh-subtle py-4">
                No friends yet. Watchers need to follow each other with you. <Link to="/friends">Find friends</Link> to get started.
              </div>
            ) : (
              <div className="d-flex flex-column gap-1" style={{ maxHeight: 420, overflowY: 'auto' }}>
                {friends.map((friend) => {
                  const selected = selectedFriends.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      type="button"
                      className={`rh-person ${selected ? 'selected' : ''}`}
                      onClick={() => toggleFriend(friend.id)}
                      aria-pressed={selected}
                    >
                      <Avatar
                        src={friend.profile_picture}
                        firstName={friend.first_name}
                        lastName={friend.last_name}
                        size={44}
                      />
                      <span className="rh-person-name">{friend.first_name} {friend.last_name}</span>
                      <span className="rh-check">{selected && <FaCheck />}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="col-lg-7">
          <div className="rh-card h-100 d-flex flex-column">
            <div className="rh-card-title mb-3">Plan your run</div>

            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-end mb-2">
                <span className="rh-label">Expected duration</span>
                <span>
                  <span className="rh-big-number">{runTime}</span>
                  <span className="rh-subtle ms-1">min</span>
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={180}
                step={5}
                value={runTime}
                onChange={(e) => setRunTime(Number(e.target.value))}
                className="form-range rh-range"
                aria-label="Expected duration in minutes"
              />
              <div className="d-flex flex-wrap gap-2 mt-1">
                {DURATION_PRESETS.map((m) => (
                  <button
                    key={m}
                    className={`rh-chip ${runTime === m ? 'active' : ''}`}
                    onClick={() => setRunTime(m)}
                  >
                    {m} min
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="rh-label mb-2" htmlFor="run-location">Where are you running?</label>
              <div className="rh-input-icon">
                <FaMapMarkerAlt />
                <input
                  id="run-location"
                  type="text"
                  className="form-control rh-input"
                  placeholder="e.g. Boulder Creek Path"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-auto">
              <button className="rh-btn rh-btn-primary rh-btn-block" onClick={() => handleSubmit()}>
                Start run
              </button>
              {process.env.NODE_ENV === 'development' && (
                <div className="text-center mt-2">
                  <button className="rh-btn rh-btn-ghost" onClick={() => handleSubmit(2)}>
                    ⏱ 2-min test run
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartRun;
