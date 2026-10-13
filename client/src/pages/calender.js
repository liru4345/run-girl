import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaChevronLeft, FaChevronRight, FaPlus, FaCheckCircle, FaMapMarkerAlt, FaClock, FaLock, FaUserFriends,
} from "react-icons/fa";
import Avatar from "../components/avatar";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// YYYY-MM-DD in the viewer's local time zone (used to group runs by day).
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const isSameDay = (a, b) => ymd(a) === ymd(b);
const toTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const longDate = (d) => d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

const formatDuration = (s) => {
  if (!s) return null;
  const m = Math.round(s / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m} min`;
};

// The 6-week grid shown for a month, starting on a Sunday.
function getMonthGrid(anchor) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

const EMPTY_FORM = { date: "", time: "07:00", location: "", expected_miles: "3", visibility: "public", notes: "" };

const Calender = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [data, setData] = useState({ completed: [], scheduled: [] });
  const [highlightRunId, setHighlightRunId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [actionError, setActionError] = useState("");

  const today = startOfDay(new Date());
  const grid = useMemo(() => getMonthGrid(anchor), [anchor]);

  const loadCalendar = useCallback(async () => {
    const from = grid[0];
    const to = new Date(grid[41]);
    to.setDate(to.getDate() + 1);
    try {
      const res = await fetch(`/api/calender?from=${from.toISOString()}&to=${to.toISOString()}`, { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load calendar (${res.status})`);
      setData(await res.json());
    } catch (e) {
      console.error(e);
      setData({ completed: [], scheduled: [] });
    }
  }, [grid]);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  // Opened from a notification (/calender?run=12): jump to that run's day and highlight it.
  useEffect(() => {
    const runId = searchParams.get("run");
    if (!runId) return;
    fetch(`/api/scheduled-runs/${runId}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((run) => {
        if (!run) return;
        const day = new Date(run.start_time);
        setAnchor(new Date(day.getFullYear(), day.getMonth(), 1));
        setSelected(startOfDay(day));
        setHighlightRunId(run.id);
      })
      .finally(() => setSearchParams({}, { replace: true }));
  }, [searchParams, setSearchParams]);

  // Group everything by local day.
  const byDay = useMemo(() => {
    const map = new Map();
    const add = (key, field, item) => {
      if (!map.has(key)) map.set(key, { completed: [], scheduled: [] });
      map.get(key)[field].push(item);
    };
    data.completed.forEach((p) => add(ymd(new Date(p.created_at)), "completed", p));
    data.scheduled.forEach((r) => add(ymd(new Date(r.start_time)), "scheduled", r));
    return map;
  }, [data]);

  const selectedItems = byDay.get(ymd(selected)) || { completed: [], scheduled: [] };
  const selectedIsFuture = selected >= today;

  const goMonth = (delta) => setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + delta, 1));
  const goToday = () => {
    setAnchor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today);
  };
  const selectDay = (day) => {
    setSelected(startOfDay(day));
    setHighlightRunId(null);
    setConfirmCancelId(null);
    setActionError("");
  };

  const openForm = (day = selected) => {
    const date = day >= today ? day : today;
    setForm({ ...EMPTY_FORM, date: ymd(date) });
    setFormError("");
    setShowForm(true);
  };

  const submitForm = async (e) => {
    e.preventDefault();
    setFormError("");
    const start = new Date(`${form.date}T${form.time}`);
    if (isNaN(start) || start <= new Date()) {
      setFormError("Pick a date and time in the future.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/scheduled-runs", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, start_time: start.toISOString() }),
      });
      const body = await res.json();
      if (!res.ok) {
        setFormError(body.error || "Couldn't schedule the run.");
        return;
      }
      setShowForm(false);
      setAnchor(new Date(start.getFullYear(), start.getMonth(), 1));
      setSelected(startOfDay(start));
      setHighlightRunId(body.id);
      await loadCalendar();
    } catch (err) {
      setFormError("Couldn't schedule the run.");
    } finally {
      setSaving(false);
    }
  };

  const runAction = async (runId, method, path) => {
    setActionError("");
    try {
      const res = await fetch(`/api/scheduled-runs/${runId}${path}`, { method, credentials: "include" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setActionError(body.error || "Something went wrong.");
        return;
      }
      setConfirmCancelId(null);
      await loadCalendar();
    } catch (err) {
      setActionError("Something went wrong.");
    }
  };

  return (
    <div className="rh-page mt-4 mb-5" style={{ maxWidth: 1120 }}>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-3">
        <div>
          <h2 className="fw-bold mb-1">Calendar</h2>
          <div className="rh-subtle">Your runs, plans, and group runs with friends</div>
        </div>
        <button className="rh-btn rh-btn-primary" onClick={() => openForm(selectedIsFuture ? selected : today)}>
          <FaPlus /> Schedule a run
        </button>
      </div>

      <div className="row g-4">
        {/* Month grid */}
        <div className="col-lg-8">
          <div className="rh-card">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h4 className="fw-bold mb-0">{MONTHS[anchor.getMonth()]} {anchor.getFullYear()}</h4>
              <div className="d-flex gap-2">
                <button className="rh-icon-btn" onClick={() => goMonth(-1)} aria-label="Previous month"><FaChevronLeft /></button>
                <button className="rh-chip" onClick={goToday}>Today</button>
                <button className="rh-icon-btn" onClick={() => goMonth(1)} aria-label="Next month"><FaChevronRight /></button>
              </div>
            </div>

            <div className="rh-cal-grid mb-1">
              {WEEKDAYS.map((w) => (
                <div key={w} className="rh-label text-center">{w}</div>
              ))}
            </div>

            <div className="rh-cal-grid">
              {grid.map((day) => {
                const items = byDay.get(ymd(day)) || { completed: [], scheduled: [] };
                const inMonth = day.getMonth() === anchor.getMonth();
                const classes = [
                  "rh-cal-cell",
                  !inMonth && "outside",
                  isSameDay(day, today) && "today",
                  isSameDay(day, selected) && "selected",
                ].filter(Boolean).join(" ");
                const chips = [
                  ...items.completed.map((p) => ({ key: `c${p.post_id}`, kind: "done", label: p.miles ? `${Number(p.miles)} mi` : "Run" })),
                  ...items.scheduled.map((r) => ({
                    key: `s${r.id}`,
                    kind: r.role === "friend" ? "friend" : "planned",
                    label: toTime(r.start_time),
                  })),
                ];

                return (
                  <button key={day.toISOString()} className={classes} onClick={() => selectDay(day)} aria-label={longDate(day)}>
                    <span className="rh-cal-daynum">{day.getDate()}</span>
                    <span className="d-flex flex-column gap-1 mt-1 w-100">
                      {chips.slice(0, 2).map((c) => (
                        <span key={c.key} className={`rh-cal-chip ${c.kind}`}>
                          {c.kind === "done" && <FaCheckCircle />} {c.label}
                        </span>
                      ))}
                      {chips.length > 2 && <span className="rh-subtle" style={{ fontSize: 11 }}>+{chips.length - 2} more</span>}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="d-flex flex-wrap gap-3 mt-3 rh-subtle small">
              <span><span className="rh-cal-dot done" /> Completed run</span>
              <span><span className="rh-cal-dot planned" /> Your plans</span>
              <span><span className="rh-cal-dot friend" /> Friends' runs you can join</span>
            </div>
          </div>
        </div>

        {/* Selected day */}
        <div className="col-lg-4">
          <div className="rh-card">
            <div className="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div className="rh-label">{isSameDay(selected, today) ? "Today" : selected < today ? "Past" : "Upcoming"}</div>
                <h5 className="fw-bold mb-0">{longDate(selected)}</h5>
              </div>
            </div>

            {actionError && <div className="rh-notice error mb-3">{actionError}</div>}

            {selectedItems.completed.length === 0 && selectedItems.scheduled.length === 0 && (
              <div className="text-center rh-subtle py-4">
                {selectedIsFuture ? "Nothing planned yet." : "No runs this day."}
              </div>
            )}

            {/* Completed runs */}
            {selectedItems.completed.map((p) => (
              <div key={p.post_id} className="rh-cal-item done mb-2">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="fw-semibold"><FaCheckCircle className="me-1" style={{ color: "#1f9d6b" }} />
                      {p.miles ? `${Number(p.miles)} mile run` : "Run"}
                    </div>
                    <div className="rh-subtle small">
                      {toTime(p.created_at)}
                      {formatDuration(p.duration_seconds) && ` · ${formatDuration(p.duration_seconds)}`}
                      {p.location && ` · ${p.location}`}
                    </div>
                    {p.content && <div className="small mt-1 text-truncate" style={{ maxWidth: 240 }}>“{p.content}”</div>}
                  </div>
                  {p.visibility === "private" && <FaLock className="rh-subtle" title="Private" />}
                </div>
                <Link to={`/post/${p.post_id}`} className="rh-btn rh-btn-secondary w-100 mt-2" style={{ padding: "6px 12px" }}>
                  View post
                </Link>
              </div>
            ))}

            {/* Scheduled runs */}
            {selectedItems.scheduled.map((r) => {
              const isOrganizer = r.role === "organizer";
              const going = r.attendees.length;
              return (
                <div
                  key={r.id}
                  className={`rh-cal-item ${r.role === "friend" ? "friend" : "planned"} mb-2 ${highlightRunId === r.id ? "highlight" : ""}`}
                >
                  <div className="d-flex align-items-center gap-2 mb-2">
                    <Avatar src={r.profile_picture} firstName={r.first_name} lastName={r.last_name} size={32} />
                    <div className="flex-grow-1 small">
                      <span className="fw-semibold">{isOrganizer ? "Your run" : `${r.first_name}'s run`}</span>
                      {r.role === "attendee" && <span className="rh-status-pill on ms-2" style={{ padding: "2px 8px" }}>Joined</span>}
                    </div>
                    <span className="rh-subtle small" title={r.visibility === "public" ? "Friends can join" : "Only you"}>
                      {r.visibility === "public" ? <FaUserFriends /> : <FaLock />}
                    </span>
                  </div>

                  <div className="small">
                    <div><FaClock className="me-2 rh-subtle" />{toTime(r.start_time)} · {Number(r.expected_miles)} mi</div>
                    <div><FaMapMarkerAlt className="me-2 rh-subtle" />{r.location}</div>
                    {r.notes && <div className="rh-subtle mt-1">{r.notes}</div>}
                  </div>

                  {r.visibility === "public" && (
                    <div className="d-flex align-items-center gap-2 mt-2">
                      {going > 0 && (
                        <span className="rh-avatar-stack">
                          {r.attendees.slice(0, 4).map((a) => (
                            <Avatar key={a.id} src={a.profile_picture} firstName={a.first_name} lastName={a.last_name} size={24} />
                          ))}
                        </span>
                      )}
                      <span className="rh-subtle small">
                        {going === 0 ? "No one has joined yet" : `${going} ${going === 1 ? "friend" : "friends"} going`}
                      </span>
                    </div>
                  )}

                  {!r.is_past && (
                    <div className="mt-2">
                      {r.role === "friend" && (
                        <button className="rh-btn rh-btn-primary w-100" style={{ padding: "6px 12px" }} onClick={() => runAction(r.id, "POST", "/join")}>
                          <FaPlus /> Join run
                        </button>
                      )}
                      {r.role === "attendee" && (
                        <button className="rh-btn rh-btn-secondary w-100" style={{ padding: "6px 12px" }} onClick={() => runAction(r.id, "POST", "/leave")}>
                          Can't make it
                        </button>
                      )}
                      {isOrganizer && confirmCancelId !== r.id && (
                        <button className="rh-btn rh-btn-ghost w-100" style={{ padding: "6px 12px" }} onClick={() => setConfirmCancelId(r.id)}>
                          Cancel run
                        </button>
                      )}
                      {isOrganizer && confirmCancelId === r.id && (
                        <div className="d-flex gap-2 align-items-center">
                          <span className="small flex-grow-1">{going > 0 ? "Everyone who joined will be notified." : "Cancel this run?"}</span>
                          <button className="rh-btn rh-btn-secondary" style={{ padding: "6px 12px" }} onClick={() => setConfirmCancelId(null)}>Keep</button>
                          <button className="rh-btn rh-btn-primary" style={{ padding: "6px 12px" }} onClick={() => runAction(r.id, "DELETE", "")}>Cancel it</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {selectedIsFuture && (
              <button className="rh-btn rh-btn-secondary w-100 mt-2" onClick={() => openForm(selected)}>
                <FaPlus /> Schedule a run this day
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Schedule a run */}
      {showForm && (
        <div className="modal d-block" tabIndex="-1" role="dialog" style={{ background: "rgba(31, 31, 41, 0.45)" }}>
          <div className="modal-dialog modal-dialog-centered" role="document">
            <form className="modal-content" style={{ borderRadius: "var(--rh-radius)", border: "none" }} onSubmit={submitForm}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Schedule a run</h5>
                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowForm(false)} />
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-7">
                    <label className="rh-label mb-1" htmlFor="sr-date">Date</label>
                    <input id="sr-date" type="date" className="form-control rh-input" min={ymd(today)} required
                      value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="col-5">
                    <label className="rh-label mb-1" htmlFor="sr-time">Time</label>
                    <input id="sr-time" type="time" className="form-control rh-input" required
                      value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
                  </div>
                  <div className="col-8">
                    <label className="rh-label mb-1" htmlFor="sr-location">Where</label>
                    <div className="rh-input-icon">
                      <FaMapMarkerAlt />
                      <input id="sr-location" type="text" className="form-control rh-input" placeholder="e.g. Boulder Creek Path" required
                        value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                    </div>
                  </div>
                  <div className="col-4">
                    <label className="rh-label mb-1" htmlFor="sr-miles">Miles</label>
                    <input id="sr-miles" type="number" min="0.5" step="0.5" className="form-control rh-input" required
                      value={form.expected_miles} onChange={(e) => setForm({ ...form, expected_miles: e.target.value })} />
                  </div>
                  <div className="col-12">
                    <label className="rh-label mb-2">Who can see it</label>
                    <div className="row g-2">
                      {[
                        { value: "public", icon: <FaUserFriends />, title: "Friends can join", text: "Followers see it and get an invite" },
                        { value: "private", icon: <FaLock />, title: "Just me", text: "Only on your calendar" },
                      ].map((opt) => (
                        <div key={opt.value} className="col-6">
                          <button
                            type="button"
                            className={`rh-option w-100 ${form.visibility === opt.value ? "selected" : ""}`}
                            onClick={() => setForm({ ...form, visibility: opt.value })}
                            aria-pressed={form.visibility === opt.value}
                          >
                            <span className="fw-semibold d-flex align-items-center gap-2">{opt.icon} {opt.title}</span>
                            <span className="rh-subtle small">{opt.text}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-12">
                    <label className="rh-label mb-1" htmlFor="sr-notes">Notes (optional)</label>
                    <textarea id="sr-notes" rows={2} className="form-control rh-input" placeholder="Pace, meeting spot, plans after…"
                      value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>
                {formError && <div className="rh-notice error mt-3">{formError}</div>}
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="rh-btn rh-btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="rh-btn rh-btn-primary" disabled={saving}>
                  {saving ? "Scheduling…" : form.visibility === "public" ? "Schedule & invite friends" : "Schedule run"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calender;
