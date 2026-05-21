import React, { useEffect, useMemo, useState } from "react";

/** ====== Bootstrap Calendar (no Tailwind) ====== */

/* Utility */
const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];
const WEEKDAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function getMonthMatrix(anchor) {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startOffset = first.getDay(); // 0=Sun
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - startOffset);

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }
  return days;
}

const Calender = () => {
  // helper: YYYY-MM-DD
  const ymd = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;

  // helper: show time like 7:15 AM
  const toTime = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // Anchor month (shown month)
  const [anchor, setAnchor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  const [events, setEvents] = useState([]); // scheduled runs for visible month

  const year = anchor.getFullYear();
  const monthIndex = anchor.getMonth();
  const today = new Date();
  const grid = useMemo(() => getMonthMatrix(anchor), [anchor]);

  // fetch all visible scheduled runs for the month
  useEffect(() => {
    const from = ymd(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    const to = ymd(new Date(anchor.getFullYear(), anchor.getMonth() + 1, 1)); // exclusive
    (async () => {
      try {
        const res = await fetch(`/api/calender?from=${from}&to=${to}`);
        if (!res.ok) throw new Error(`Failed to load calendar (${res.status})`);
        const data = await res.json();
        setEvents(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setEvents([]); // fail safe
      }
    })();
  }, [anchor]); // refetch when month changes

  // group events by YYYY-MM-DD
  const runsByDay = useMemo(() => {
    const m = new Map();
    for (const ev of events) {
      const key = (ev.start_time || "").slice(0, 10);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(ev);
    }
    // sort each day's events by start time ascending
    for (const [k, arr] of m.entries()) {
      arr.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
      m.set(k, arr);
    }
    return m;
  }, [events]);

  const goPrev = () =>
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() - 1, 1));
  const goNext = () =>
    setAnchor((a) => new Date(a.getFullYear(), a.getMonth() + 1, 1));
  const goToday = () => {
    const t = new Date();
    setAnchor(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelected(t);
  };

  const openDay = (day) => {
    setSelected(day);      // keep your selected logic
    setShowModal(true);    // show modal
  };

  return (
    <div className="container my-4">
      {/* Local CSS for a neat 7-column grid and square-ish cells */}
      <style>{`
        .rgc-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: .5rem;
        }
        .rgc-cell {
          min-height: 90px;
          border-radius: .75rem;
          border: 1px solid rgba(255,105,180,0.075);
          background-color: #fff;
          padding: .5rem;
          transition: box-shadow .15s, transform .05s, border-color .15s, background-color .15s;
        }
        .rgc-cell:hover {
          background-color: #f8f9fa;
          border-color: rgba(255,105,180,0.25);
          box-shadow: 0 .125rem .25rem rgba(255,105,180,0.25);
        }
        .rgc-outside {
          background-color: #f8f9fa;
          color: #6c757d;
        }
        .rgc-today {
          outline: 2px solid #ff69b4;
          outline-offset: 2px;
        }
        .rgc-selected {
          box-shadow: 0 0 0 .2rem rgba(255,105,180,0.25);
        }
        .rgc-daynum {
          font-weight: 600;
        }
        /* tiny pink bubbles inside day cells */
        .run-pill {
          display: inline-flex;
          align-items: center;
          gap: .25rem;
          font-size: 11px;
          line-height: 1;
          padding: .2rem .5rem;
          border-radius: 999px;
          border: 1px solid rgba(255,105,180,.6);
          color: #ff69b4;
          background: rgba(255,105,180,.08);
          white-space: nowrap;
          width: fit-content;
        }
        .run-more {
          font-size: 11px;
          color: #6c757d;
        }
        @media (max-width: 576px) {
          .rgc-cell { min-height: 72px; }
        }
        /* Pink helpers */
        .btn-outline-pink {
          color: #ff69b4; border: 1px solid #ff69b4; background: transparent;
        }
        .btn-outline-pink:hover { background: #ff69b4; color: #fff; }
        .bg-pink { background-color: #ff69b4 !important; color: #fff !important; }
      `}</style>

      {/* Header */}
      <div className="d-flex align-items-center justify-content-between gap-2">
        <div className="btn-group" role="group" aria-label="Month navigation">
          <button className="btn btn-outline-secondary" onClick={goPrev} aria-label="Previous month">◀</button>
          <button className="btn btn-outline-pink" onClick={goToday}>Today</button>
          <button className="btn btn-outline-secondary" onClick={goNext} aria-label="Next month">▶</button>
        </div>

        <h1 className="h3 mb-0">{MONTHS[monthIndex]} {year}</h1>

        <div className="d-none d-sm-block text-muted small">
          Click a day to select it
        </div>
      </div>

      {/* Weekday headings */}
      <div className="rgc-grid mt-3">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-muted fw-semibold">{w}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="card mt-2">
        <div className="card-body">
          <div className="rgc-grid">
            {grid.map((day) => {
              const inMonth = day.getMonth() === monthIndex;
              const isTodayDay = isSameDay(day, today);
              const isSelected = isSameDay(day, selected);

              const classes = [
                "rgc-cell",
                !inMonth && "rgc-outside",
                isTodayDay && "rgc-today",
                isSelected && "rgc-selected"
              ]
                .filter(Boolean)
                .join(" ");

              // events for this day
              const key = ymd(day);
              const items = runsByDay.get(key) || [];
              const shown = items.slice(0, 3);

              return (
                <button
                  key={day.toDateString()}
                  className={classes}
                  onClick={() => openDay(day)}
                  title={day.toDateString()}
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="rgc-daynum">{day.getDate()}</span>
                    {isTodayDay && (
                      <span className="badge bg-pink">today</span>
                    )}
                  </div>

                  {/* pink time bubbles */}
                  {shown.length > 0 && (
                    <div className="mt-2 d-flex flex-column gap-1">
                      {shown.map((ev) => (
                        <span key={ev.id} className="run-pill">
                          {toTime(ev.start_time)}
                          {ev.expected_miles ? ` · ${Number(ev.expected_miles)}mi` : ""}
                        </span>
                      ))}
                      {items.length > 3 && (
                        <span className="run-more">+{items.length - 3} more</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected summary */}
      <div className="card mt-4">
        <div className="card-body">
          <h2 className="h5 mb-1">
            Selected: {MONTHS[selected.getMonth()]} {selected.getDate()}, {selected.getFullYear()}
          </h2>
          <p className="text-muted mb-0">Click any day to open the modal.</p>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {MONTHS[selected.getMonth()]} {selected.getDate()}, {selected.getFullYear()}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    aria-label="Close"
                    onClick={() => setShowModal(false)}
                  />
                </div>
                <div className="modal-body">
                  <p className="mb-0 text-muted">Modal opened from clicking a day.</p>
                  
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Close
                  </button>
                  <button className="btn btn-outline-pink" onClick={() => alert('Schedule flow here')}>
                    Schedule Run
                  </button>
                </div>
              </div>
            </div>
          </div>
          {/* Backdrop */}
          <div className="modal-backdrop show" onClick={() => setShowModal(false)} />
        </>
      )}
    </div>
  );
};

export default Calender;
