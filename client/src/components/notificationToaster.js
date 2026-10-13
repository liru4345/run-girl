import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Avatar from "./avatar";
import { checkInRun } from "../runActions";

// Live alerts: checks for new notifications every few seconds and shows them as pop-ups
// in the app, plus a system notification when the RunHer tab is in the background.
const POLL_MS = 5000;
const TOAST_MS = 10000;
const PROMPT_DISMISSED_KEY = "runher:notification-prompt-dismissed";

export const UNREAD_EVENT = "runher:unread";

// Alerts from RunHer itself (the runner's own check-in reminder) go to the Start Run page;
// alerts about a friend go to that friend's tracking page.
const linkFor = (n) => (n.sender_username === "RunHer" ? "/start-run" : `/track/${n.run_id}`);

const supportsSystemNotifications = () => typeof window !== "undefined" && "Notification" in window;

const readPromptDismissed = () => {
  try {
    return localStorage.getItem(PROMPT_DISMISSED_KEY) === "1";
  } catch (err) {
    return false;
  }
};

const NotificationToaster = () => {
  const [toasts, setToasts] = useState([]);
  const [loggedIn, setLoggedIn] = useState(false);
  const [permission, setPermission] = useState(supportsSystemNotifications() ? Notification.permission : "unsupported");
  const [promptDismissed, setPromptDismissed] = useState(readPromptDismissed);
  const lastIdRef = useRef(null);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  // The runner's check-in reminder checks them in right from the pop-up.
  const handleCheckIn = async (n) => {
    const update = (changes) =>
      setToasts((current) => current.map((t) => (t.id === n.id ? { ...t, ...changes } : t)));
    update({ checkingIn: true });
    try {
      await checkInRun(n.run_id);
      update({ checkingIn: false, resolved: true, type: "run", message: "✅ Checked in. Your watchers won't be alerted for another 10 minutes." });
      setTimeout(() => dismissToast(n.id), 5000);
    } catch (err) {
      update({ checkingIn: false, resolved: true, message: "This run has already ended, so there's nothing to check in to." });
      setTimeout(() => dismissToast(n.id), 5000);
    }
  };

  const showSystemNotification = useCallback((n) => {
    if (permission !== "granted" || !document.hidden) return;
    const title = n.type === "run_alert" ? "⚠️ RunHer alert" : "RunHer";
    const systemNotification = new Notification(title, {
      body: n.sender_username === "RunHer" ? n.message : `${n.sender_username} ${n.message}`,
      icon: n.profile_icon || "/img/runHerLogo.png",
      tag: `runher-${n.id}`,
    });
    systemNotification.onclick = () => {
      window.focus();
      if (n.run_id) navigate(linkFor(n));
      systemNotification.close();
    };
  }, [permission, navigate]);

  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const after = lastIdRef.current;
        const res = await fetch(`/api/notifications/live${after != null ? `?after=${after}` : ""}`, { credentials: "include" });
        if (cancelled) return;

        if (!res.ok) {
          lastIdRef.current = null; // logged out: start fresh on the next login
          setLoggedIn(false);
          return;
        }

        const data = await res.json();
        setLoggedIn(true);
        lastIdRef.current = data.latest_id;
        window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: data.unread_count }));

        for (const n of data.notifications) {
          setToasts((current) => [...current, n]);
          showSystemNotification(n);
          // Urgent alerts stay until closed; everything else fades out.
          if (n.type !== "run_alert") setTimeout(() => dismissToast(n.id), TOAST_MS);
        }
      } catch (err) {
        // Network hiccup: try again on the next tick.
      }
    };

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname, showSystemNotification, dismissToast]);

  const enableSystemNotifications = async () => {
    const result = await Notification.requestPermission();
    setPermission(result);
  };

  const dismissPrompt = () => {
    setPromptDismissed(true);
    try {
      localStorage.setItem(PROMPT_DISMISSED_KEY, "1");
    } catch (err) {
      // Private browsing: the prompt just comes back next visit.
    }
  };

  const showPrompt = loggedIn && permission === "default" && !promptDismissed;

  return (
    <>
      {showPrompt && (
        <div className="container mt-3">
          <div className="alert alert-light border d-flex align-items-center justify-content-between mb-0">
            <span>🔔 Get a pop-up when a friend starts a run or needs help, even when RunHer is in the background.</span>
            <span className="d-flex gap-2 flex-shrink-0 ms-3">
              <button className="btn btn-sm btn-primary" onClick={enableSystemNotifications}>Turn on</button>
              <button className="btn btn-sm btn-link text-muted" onClick={dismissPrompt}>Not now</button>
            </span>
          </div>
        </div>
      )}

      <div
        className="position-fixed end-0 p-3 d-flex flex-column gap-2"
        style={{ top: 64, zIndex: 1080, maxWidth: 380, width: "100%" }}
        aria-live="polite"
      >
        {toasts.map((n) => {
          const urgent = n.type === "run_alert";
          return (
            <div
              key={n.id}
              className={`card shadow animate__animated animate__fadeInRight ${urgent ? "border-danger" : ""}`}
              style={urgent ? { borderWidth: 2 } : undefined}
              role="alert"
            >
              <div className="card-body d-flex align-items-start p-3">
                {n.profile_icon || n.sender_username !== "RunHer" ? (
                  <Avatar
                    src={n.profile_icon}
                    firstName={(n.sender_username || "").split(" ")[0]}
                    lastName={(n.sender_username || "").split(" ")[1]}
                    size={40}
                    className="me-3"
                  />
                ) : (
                  <img src="/img/runHerLogo.png" alt="RunHer" width={40} height={40} className="me-3" style={{ objectFit: "contain" }} />
                )}
                <div className="flex-grow-1">
                  {urgent && <div className="text-danger fw-semibold small mb-1">⚠️ Safety alert</div>}
                  <div>
                    {n.sender_username !== "RunHer" && <strong>{n.sender_username} </strong>}
                    {n.message}
                  </div>
                  {n.run_id && n.sender_username === "RunHer" && !n.resolved && (
                    <button
                      className="btn btn-sm btn-warning mt-2"
                      onClick={() => handleCheckIn(n)}
                      disabled={n.checkingIn}
                    >
                      {n.checkingIn ? "Checking in..." : "I'm OK, add 10 minutes"}
                    </button>
                  )}
                  {n.run_id && n.sender_username !== "RunHer" && (
                    <Link
                      to={linkFor(n)}
                      className={`btn btn-sm mt-2 ${urgent ? "btn-danger" : "btn-outline-primary"}`}
                      onClick={() => dismissToast(n.id)}
                    >
                      {urgent ? "See where they are" : "Track"}
                    </Link>
                  )}
                </div>
                <button className="btn-close ms-2" aria-label="Close" onClick={() => dismissToast(n.id)} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default NotificationToaster;
