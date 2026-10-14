import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaPhoneAlt, FaCommentDots, FaMapMarkerAlt, FaExternalLinkAlt, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import Avatar from '../components/avatar';

// Live status page for a run, shown to the runner and their watchers.
const REFRESH_MS = 5000;

const STATUS = {
  in_progress: { label: 'Out running', hero: '', icon: null },
  overdue: { label: "Overdue · hasn't checked in", hero: 'overdue', icon: <FaExclamationTriangle /> },
  completed: { label: 'Finished safely', hero: 'done', icon: <FaCheckCircle /> },
};

// Google's keyless map embed (OpenStreetMap's tile servers were unreliable to embed).
const mapEmbedUrl = (lat, lng) => `https://maps.google.com/maps?q=${lat},${lng}&z=16&output=embed`;

const timeAgo = (timestamp) => {
  const seconds = Math.round((Date.now() - new Date(timestamp)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)} min ago`;
};

const formatTime = (timestamp) =>
  new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

const minutesBetween = (from, to) => Math.max(0, Math.round((new Date(to) - new Date(from)) / 60000));

const TrackRun = () => {
  const { id } = useParams();
  const [run, setRun] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/runs/${id}/track`, { credentials: 'include' });
        const data = await res.json();
        if (res.ok) {
          setRun(data);
          setError('');
        } else {
          setError(data.error || 'Could not load this run');
        }
      } catch (err) {
        setError('Could not load this run');
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [id]);

  if (error) {
    return (
      <div className="rh-page mt-5" style={{ maxWidth: 520 }}>
        <div className="rh-card text-center py-5">
          <div className="rh-card-title">{error}</div>
          <p className="rh-subtle mb-0">Only the runner and their watchers can see a run.</p>
        </div>
      </div>
    );
  }
  if (!run) return <p className="rh-subtle text-center mt-5">Loading…</p>;

  const status = STATUS[run.status] || STATUS.in_progress;
  const hasLocation = run.last_lat != null;
  const finished = run.status === 'completed';
  const overdue = run.status === 'overdue';
  const phoneDigits = run.phone_number ? run.phone_number.replace(/[^0-9+]/g, '') : null;

  return (
    <div className="rh-page mt-4 mb-5" style={{ maxWidth: 640 }}>
      <div className={`rh-hero mb-3 ${status.hero}`}>
        <div className="rh-avatar-ring mb-2" style={{ borderColor: 'rgba(255,255,255,0.85)' }}>
          <Avatar src={run.profile_picture} firstName={run.first_name} lastName={run.last_name} size={84} />
        </div>
        <h3 className="fw-bold mb-2">{run.first_name} {run.last_name}</h3>
        <span className="rh-status-pill" style={{ background: 'rgba(255,255,255,0.22)', color: '#fff' }}>
          {status.icon || <span className="rh-live-dot me-0" />}
          {status.label}
        </span>
        <div className="mt-2 opacity-75">
          <FaMapMarkerAlt className="me-1" />
          {run.location}
        </div>
      </div>

      <div className="rh-card mb-3">
        <div className="rh-stats">
          <div className="rh-stat">
            <div className="rh-label">Started</div>
            <div className="rh-stat-value">{formatTime(run.start_time)}</div>
          </div>
          <div className="rh-stat">
            <div className="rh-label">{finished ? 'Finished' : 'Back by'}</div>
            <div className="rh-stat-value" style={overdue ? { color: '#f0436b' } : undefined}>
              {formatTime(finished ? run.finished_at : run.end_time)}
            </div>
          </div>
          <div className="rh-stat">
            <div className="rh-label">{finished ? 'Run time' : 'Out for'}</div>
            <div className="rh-stat-value">
              {minutesBetween(run.start_time, finished ? run.finished_at : Date.now())} min
            </div>
          </div>
        </div>
      </div>

      {phoneDigits && !finished && (
        <div className="rh-card mb-3" style={overdue ? { borderColor: '#f0436b', borderWidth: 2 } : undefined}>
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
            <div>
              <div className="fw-semibold">
                {overdue ? `Try to reach ${run.first_name}` : `Contact ${run.first_name}`}
              </div>
              <div className="rh-subtle">{run.phone_number}</div>
            </div>
            <div className="d-flex gap-2">
              <a href={`tel:${phoneDigits}`} className={`rh-btn ${overdue ? 'rh-btn-primary' : 'rh-btn-secondary'}`}>
                <FaPhoneAlt /> Call
              </a>
              <a href={`sms:${phoneDigits}`} className="rh-btn rh-btn-secondary">
                <FaCommentDots /> Text
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="rh-card p-0 overflow-hidden">
        <div className="d-flex justify-content-between align-items-center px-4 py-3">
          <div>
            <div className="fw-semibold">{finished ? 'Last known location' : 'Live location'}</div>
            <div className="rh-subtle small">
              {hasLocation ? `Updated ${timeAgo(run.last_location_at)}` : 'Updates every few seconds while sharing'}
            </div>
          </div>
          {hasLocation && (
            <a href={run.map_link} target="_blank" rel="noreferrer" className="rh-btn rh-btn-secondary">
              <FaExternalLinkAlt /> Google Maps
            </a>
          )}
        </div>
        {hasLocation ? (
          <iframe
            title="Runner location"
            src={mapEmbedUrl(run.last_lat, run.last_lng)}
            style={{ width: '100%', height: 340, border: 0, display: 'block' }}
          />
        ) : (
          <div className="text-center py-5" style={{ background: '#fafafd' }}>
            <FaMapMarkerAlt style={{ fontSize: '1.8rem', color: 'var(--rh-pink)' }} />
            <div className="fw-semibold mt-2">No live location shared yet</div>
            <div className="rh-subtle">Planned location: {run.location}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackRun;
