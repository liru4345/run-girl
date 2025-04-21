import React, { useState, useEffect } from 'react';
import { FaRunning } from 'react-icons/fa';

const StartRun = () => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [runTime, setRunTime] = useState(30);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

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
      } catch (err) {
        console.error('❌ API error:', err);
      }
    };

    fetchData();
  }, []);

  // Timer effect
  useEffect(() => {
    let timer;
    if (isRunning) {
      timer = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const handleSubmit = async () => {
    try {
      const res = await fetch('/api/start-run', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          duration_minutes: runTime,
          watcher_ids: selectedFriends
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatus('✅ Run started!');
        setIsRunning(true);
      } else {
        setStatus(`❌ Failed to start run: ${data.error}`);
      }
    } catch (err) {
      console.error('❌ Submission error:', err);
      setStatus('❌ Something went wrong while starting the run.');
    }
  };

  const handleFinishRun = () => {
    setIsRunning(false);
    setStatus('🎉 Run completed!');
  };

  const formatTime = () => {
    const minutes = Math.floor(secondsElapsed / 60);
    const seconds = secondsElapsed % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="container mt-5">
      <div className="row">
        {/* Friends Column */}
        <div className="col-md-5 border-end" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          <h4>Select Friends</h4>
          <ul className="list-group">
            {friends.map((friend) => (
              <li key={friend.id} className="list-group-item d-flex align-items-center">
                <input
                  type="checkbox"
                  className="form-check-input me-2"
                  checked={selectedFriends.includes(friend.id)}
                  onChange={() => toggleFriend(friend.id)}
                />
                {friend.first_name} {friend.last_name}
              </li>
            ))}
          </ul>
        </div>

        {/* Run Info Column */}
        <div className="col-md-7">
          <h4>Run Details</h4>

          {!isRunning ? (
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

              <button className="btn btn-primary mt-3" onClick={handleSubmit}>
                Begin Run
              </button>
            </>
          ) : (
            <div className="text-center mt-4">
              <h5>🏃‍♀️ Running...</h5>
              <FaRunning className="text-primary display-1 animate__animated animate__pulse animate__infinite" />
              <h2 className="mt-3">{formatTime()}</h2>
              <button className="btn btn-success mt-3" onClick={handleFinishRun}>
                Run Finished
              </button>
            </div>
          )}

          {status && <p className="mt-3">{status}</p>}
        </div>
      </div>
    </div>
  );
};

export default StartRun;
