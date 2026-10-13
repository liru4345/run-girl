import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaBell } from "react-icons/fa"; // Import bell icon
import { UNREAD_EVENT } from "./notificationToaster";

const Header = () => {
  const [user, setUser] = useState(null);
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

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
      <Link className="navbar-brand" to="/">
      <img 
        src="/img/runHerLogo2.png" 
        alt="runHer Logo" 
        height="40" // Try 60 or 80
        style={{ objectFit: 'contain', maxWidth: '150px' }} 
      />
      </Link>
        <Link to="/start-run" className="btn btn-outline-light btn-sm ms-2">
           Start Run
        </Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto align-items-center">


            {!user ? (
              <>
                <li className="nav-item">
              <Link className="nav-link" to="/">Home</Link>
            </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/register">Register</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/login">Login</Link>
                </li>
              </>
            ) : (
              <>
              <li className="nav-item">
              <Link className="nav-link" to="/feed">Friends</Link>
            </li>
                <li className="nav-item">
                  <Link className="nav-link" to="/profile">{user.first_name}</Link>
                </li>
                {user && (
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
            )}
                <li className="nav-item">
                  <button className="btn btn-outline-light btn-sm ms-2" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Header;
