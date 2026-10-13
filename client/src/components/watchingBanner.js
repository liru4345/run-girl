import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import Avatar from "./avatar";

// Shows a banner on every page while a friend you're watching is out on a run.
const REFRESH_MS = 15000;

const WatchingBanner = () => {
  const [runs, setRuns] = useState([]);
  const { pathname } = useLocation();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/runs/watching", { credentials: "include" });
        setRuns(res.ok ? (await res.json()).runs : []);
      } catch (err) {
        setRuns([]);
      }
    };

    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [pathname]);

  const visible = runs.filter((run) => pathname !== `/track/${run.id}`);
  if (visible.length === 0) return null;

  return (
    <div className="container mt-3">
      {visible.map((run) => {
        const overdue = run.status === "overdue";
        return (
          <div
            key={run.id}
            className={`alert ${overdue ? "alert-danger" : "alert-info"} d-flex justify-content-between align-items-center mb-2`}
          >
            <span className="d-flex align-items-center">
              <Avatar
                src={run.profile_picture}
                firstName={run.first_name}
                lastName={run.last_name}
                size={36}
                className={`me-2 ${overdue ? "border border-2 border-danger" : ""}`}
              />
              <span>
                {overdue && "⚠️ "}
                <strong>{run.first_name} {run.last_name}</strong>{" "}
                {overdue
                  ? "is overdue and hasn't checked in."
                  : `is on a run at ${run.location}. Expected back by ${new Date(run.end_time).toLocaleTimeString()}.`}
              </span>
            </span>
            <Link to={`/track/${run.id}`} className={`btn btn-sm ${overdue ? "btn-danger" : "btn-outline-primary"}`}>
              Track
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default WatchingBanner;
