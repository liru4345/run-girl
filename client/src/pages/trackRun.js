import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Avatar from '../components/avatar';

// Live status page for a run, shown to the runner and their watchers.
const REFRESH_MS = 15000;

const STATUS_STYLES = {
  in_progress: { label: 'Running', className: 'bg-primary' },
  overdue: { label: 'Overdue: hasn\'t checked in', className: 'bg-danger' },
  completed: { label: 'Finished safely', className: 'bg-success' },
};

const mapEmbedUrl = (lat, lng) => {
  const d = 0.004;
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
};

const timeAgo = (timestamp) => {
  const seconds = Math.round((Date.now() - new Date(timestamp)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.round(seconds / 60)} min ago`;
};

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

  if (error) return <p className="mt-5 text-center">{error}</p>;
  if (!run) return <p className="mt-5 text-center">Loading...</p>;

  const statusStyle = STATUS_STYLES[run.status] || STATUS_STYLES.in_progress;
  const hasLocation = run.last_lat != null;

  return (
    <div className="container mt-5" style={{ maxWidth: 720 }}>
      <div className="d-flex align-items-center mb-3">
        <Avatar
          src={run.profile_picture}
          firstName={run.first_name}
          lastName={run.last_name}
          size={64}
          className="me-3"
        />
        <div>
          <h3 className="mb-1">{run.first_name} {run.last_name}'s run</h3>
          <span className={`badge ${statusStyle.className}`}>{statusStyle.label}</span>
        </div>
      </div>

      <ul className="list-unstyled">
        <li><strong>Planned location:</strong> {run.location}</li>
        <li><strong>Started:</strong> {new Date(run.start_time).toLocaleTimeString()}</li>
        {run.status === 'completed' ? (
          <li><strong>Finished:</strong> {new Date(run.finished_at).toLocaleTimeString()}</li>
        ) : (
          <li><strong>Expected back by:</strong> {new Date(run.end_time).toLocaleTimeString()}</li>
        )}
      </ul>

      {run.phone_number && (
        <div className={`card p-3 mb-3 ${run.status === 'overdue' ? 'border-danger' : ''}`}>
          <div className="d-flex flex-wrap align-items-center gap-2">
            <span className="me-auto">
              <strong>Contact {run.first_name}:</strong> {run.phone_number}
            </span>
            <a
              href={`tel:${run.phone_number.replace(/[^0-9+]/g, '')}`}
              className={`btn btn-sm ${run.status === 'overdue' ? 'btn-danger' : 'btn-outline-primary'}`}
            >
              📞 Call
            </a>
            <a
              href={`sms:${run.phone_number.replace(/[^0-9+]/g, '')}`}
              className="btn btn-sm btn-outline-secondary"
            >
              💬 Text
            </a>
          </div>
        </div>
      )}

      {hasLocation ? (
        <>
          <p className="text-muted small mb-1">
            Last location update {timeAgo(run.last_location_at)}.{' '}
            <a href={run.map_link} target="_blank" rel="noreferrer">Open in Google Maps</a>
          </p>
          <iframe
            title="Runner location"
            src={mapEmbedUrl(run.last_lat, run.last_lng)}
            style={{ width: '100%', height: 360, border: 0, borderRadius: 8 }}
          />
        </>
      ) : (
        <p className="text-muted">No live location shared yet.</p>
      )}
    </div>
  );
};

export default TrackRun;
