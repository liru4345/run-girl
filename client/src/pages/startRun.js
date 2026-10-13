import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaRunning, FaMapMarkerAlt } from 'react-icons/fa';
import 'animate.css';
import { checkInRun, RUN_UPDATED_EVENT } from '../runActions';

// How often the runner's position is sent to the server while a run is active.
const LOCATION_PING_MS = 15000;

const formatClock = (totalSeconds) => {
  const sign = totalSeconds < 0 ? '-' : '';
  const abs = Math.abs(totalSeconds);
  const minutes = Math.floor(abs / 60);
  const seconds = abs % 60;
  return `${sign}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const StartRun = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [runTime, setRunTime] = useState(30);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [activeRun, setActiveRun] = useState(null); // { id, start_time, end_time, status }
  const [now, setNow] = useState(Date.now());
  const [locationStatus, setLocationStatus] = useState('');
  const [showRecap, setShowRecap] = useState(false);
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [miles, setMiles] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [showExtend, setShowExtend] = useState(false);
  const [extendMinutes, setExtendMinutes] = useState(10);

  const watchIdRef = useRef(null);
  const latestPositionRef = useRef(null);

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

        const activeRes = await fetch('/api/runs/active', { credentials: 'include' });
        if (activeRes.ok) {
          const { run } = await activeRes.json();
          if (run) {
            setActiveRun(run);
            setLocation(run.location);
          }
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
      setLocationStatus('Location sharing is not supported in this browser.');
      return undefined;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        latestPositionRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setLocationStatus('Sharing live location with your watchers');
      },
      (err) => {
        setLocationStatus(
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Watchers will only see your planned location.'
            : 'Waiting for location...'
        );
      },
      { enableHighAccuracy: true, maximumAge: 10000 }
    );

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
    const pinger = setInterval(sendLocation, LOCATION_PING_MS);

    return () => {
      navigator.geolocation.clearWatch(watchIdRef.current);
      clearInterval(pinger);
    };
  }, [activeRun]);

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
        const activeRes = await fetch('/api/runs/active', { credentials: 'include' });
        const { run } = await activeRes.json();
        setActiveRun(run);
        setNow(Date.now());
        setStatus('✅ Run started!');
      } else {
        setStatus(`❌ Failed to start run: ${data.error}`);
      }
    } catch (err) {
      console.error('❌ Submission error:', err);
      setStatus('❌ Something went wrong while starting the run.');
    }
  };

  const handleCheckIn = useCallback(async () => {
    try {
      await checkInRun(activeRun.id); // the RUN_UPDATED_EVENT listener updates the run
      setStatus('👍 Checked in. Your watchers won\'t be alerted for another 10 minutes.');
    } catch (err) {
      setStatus(`❌ Check-in failed: ${err.message}`);
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
      setStatus(`⏱ Added ${extendMinutes} minutes. You're now expected back by ${new Date(end_time).toLocaleTimeString()}.`);
    } catch (err) {
      setStatus(`❌ Couldn't extend your run: ${err.message}`);
    }
  };

  const handleFinishRun = () => {
    setFinalSeconds(Math.round((Date.now() - new Date(activeRun.start_time)) / 1000));
    setShowRecap(true);
    setStatus('');
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
        alert('✅ Run saved!');
        setShowRecap(false);
        setActiveRun(null);
        setLocationStatus('');
        setMiles('');
        setDescription('');
        setPhoto(null);
      } else {
        alert('❌ Failed to save run');
      }
    } catch (err) {
      console.error('Error saving run:', err);
    }
  };

  const elapsedSeconds = activeRun ? Math.max(0, Math.round((now - new Date(activeRun.start_time)) / 1000)) : 0;
  const remainingSeconds = activeRun ? Math.round((new Date(activeRun.end_time) - now) / 1000) : 0;
  const isPastDue = activeRun && remainingSeconds <= 0;

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Friends Column */}
        <div className="col-md-5 border-end" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <h4>Select Watchers</h4>
          <p className="text-muted small">
            Watchers get a text when you start and finish, and an alert if you don't check in on time.
          </p>
          <ul className="list-group">
            {friends.map((friend) => (
              <li key={friend.id} className="list-group-item d-flex align-items-center">
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={selectedFriends.includes(friend.id)}
                  onChange={() => toggleFriend(friend.id)}
                  disabled={!!activeRun}
                />
                {friend.first_name} {friend.last_name}
              </li>
            ))}
          </ul>
        </div>

        {/* Run Info Column */}
        <div className="col-md-7">
          <h4>Run Details</h4>

          {!activeRun ? (
            <>
              <div className="mb-3">
                <label className="form-label">Duration (Minutes)</label>
                <input
                  type="range"
                  min={5}
                  max={180}
                  value={runTime}
                  onChange={(e) => setRunTime(Number(e.target.value))}
                  className="form-range"
                />
                <p><strong>{runTime} min</strong></p>
              </div>

              <div className="mb-3">
                <label className="form-label">Location</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <button className="btn btn-primary mt-3" onClick={() => handleSubmit()}>
                Begin Run
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button className="btn btn-outline-secondary mt-3 ms-2" onClick={() => handleSubmit(2)}>
                  ⏱ 2-min test run
                </button>
              )}
            </>
          ) : !showRecap && (
            <div className="text-center mt-4">
              <h5>🏃‍♀️ Running...</h5>
              <FaRunning className="text-primary display-1 animate__animated animate__pulse animate__infinite" />
              <h2 className="mt-3">{formatClock(elapsedSeconds)}</h2>

              {isPastDue ? (
                <div className="alert alert-warning mt-3">
                  <strong>You're past your planned time.</strong> Check in so your watchers know you're OK.
                  <div>
                    <button className="btn btn-warning mt-2" onClick={handleCheckIn}>
                      I'm OK, add 10 minutes
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-1">Expected back in {formatClock(remainingSeconds)}</p>
              )}

              {!isPastDue && !showExtend && (
                <button className="btn btn-link btn-sm" onClick={() => setShowExtend(true)}>
                  ⏱ Need more time? Extend run
                </button>
              )}
              {showExtend && (
                <div className="card p-3 my-3 text-start mx-auto" style={{ maxWidth: 360 }}>
                  <label className="form-label mb-1">
                    Add <strong>{extendMinutes} min</strong> to your run
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={60}
                    step={5}
                    value={extendMinutes}
                    onChange={(e) => setExtendMinutes(Number(e.target.value))}
                    className="form-range"
                  />
                  <small className="text-muted mb-2">
                    New expected time: {new Date(new Date(activeRun.end_time).getTime() + extendMinutes * 60000).toLocaleTimeString()}
                  </small>
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={handleExtend}>
                      Add {extendMinutes} minutes
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={() => setShowExtend(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {locationStatus && (
                <p className="small text-muted">
                  <FaMapMarkerAlt className="me-1" />
                  {locationStatus}
                </p>
              )}
              <p className="small">
                <Link to={`/track/${activeRun.id}`}>See what your watchers see</Link>
              </p>

              <button className="btn btn-success mt-2" onClick={handleFinishRun}>
                Run Finished
              </button>
            </div>
          )}

          {status && <p className="mt-3 text-center">{status}</p>}
          {showRecap && (
            <div className="mt-4">
              <h5>🏁 Run Recap</h5>
              <p><strong>Location:</strong> {location}</p>
              <p><strong>Duration:</strong> {formatClock(finalSeconds)}</p>

              <div className="mb-3">
                <label className="form-label">Miles Ran</label>
                <input
                  type="number"
                  className="form-control"
                  value={miles}
                  onChange={(e) => setMiles(e.target.value)}
                  placeholder="e.g. 3.5"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Run Description</label>
                <textarea
                  className="form-control"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="How did your run go?"
                />
              </div>

              <div className="mb-3">
                <label className="form-label">Photo (optional)</label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="form-control"
                  onChange={(e) => setPhoto(e.target.files[0])}
                />
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-success" onClick={() => handleSubmitRecap('post')}>
                  📢 Post Run
                </button>
                <button className="btn btn-secondary" onClick={() => handleSubmitRecap('save')}>
                  💾 Save Only
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StartRun;
