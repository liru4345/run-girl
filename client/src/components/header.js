import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBell } from "react-icons/fa"; // Import bell icon
import { UNREAD_EVENT } from "./notificationToaster";

const Header = () => {
  const [user, setUser] = useState(undefined); // undefined until we know whether someone is logged in
  const [unreadCount, setUnreadCount] = useState(0);

  // The notification poller broadcasts the unread count; show it on the bell.
  useEffect(() => {
    const onUnread = (e) => setUnreadCount(e.detail);
    window.addEventListener(UNREAD_EVENT, onUnread);
    return () => window.removeEventListener(UNREAD_EVENT, onUnread);
  }, []);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // Re-check who is logged in on every page change and whenever the tab regains focus,
  // so the header never shows a stale user after logging in or out (including in another tab).
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: 'include' });
        setUser(res.ok ? await res.json() : null);
      } catch (err) {
        setUser(null); // Not logged in
      }
    };

    fetchUser();
    window.addEventListener("focus", fetchUser);
    return () => window.removeEventListener("focus", fetchUser);
  }, [pathname]);

  const handleLogout = async () => {
    await fetch("/api/logout", { credentials: 'include' });
    setUser(null);
    navigate("/login");
  };

  // Logged-out visitors get a light, minimal bar; the pink app bar is for people using the app.
  if (!user) {
    return (
      <nav className="rh-public-nav">
        <div className="container d-flex align-items-center justify-content-between">
          <Link to="/" aria-label="RunHer home">
            <img src="/img/runHerLogo2.png" alt="RunHer" className="rh-logo-pink" />
          </Link>
          {user === null && (
            <div className="d-flex align-items-center gap-2">
              {pathname !== "/login" && (
                <Link to="/login" className="rh-btn rh-btn-ghost">Log in</Link>
              )}
              {pathname !== "/register" && (
                <Link to="/register" className="rh-btn rh-btn-primary" style={{ padding: "8px 18px" }}>Get started</Link>
              )}
            </div>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/">
          <img
            src="/img/runHerLogo2.png"
            alt="RunHer"
            height="40"
            style={{ objectFit: 'contain', maxWidth: '150px' }}
          />
        </Link>
        <Link to="/start-run" className="btn btn-outline-light btn-sm ms-2">
          Start Run
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto align-items-center">
            <li className="nav-item">
              <Link className="nav-link" to="/feed">Friends</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/profile">{user.first_name}</Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link position-relative" to="/notifications" aria-label={`Notifications (${unreadCount} unread)`}>
                <FaBell />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: "0.65rem" }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
            </li>
            <li className="nav-item">
              <button className="btn btn-outline-light btn-sm ms-2" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
