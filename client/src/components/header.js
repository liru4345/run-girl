import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaBell, FaHome, FaUserFriends, FaRunning, FaUser, FaCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import Avatar from "./avatar";
import { UNREAD_EVENT } from "./notificationToaster";

const Header = () => {
  const [user, setUser] = useState(undefined); // undefined until we know whether someone is logged in
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // The notification poller broadcasts the unread count; show it on the bell.
  useEffect(() => {
    const onUnread = (e) => setUnreadCount(e.detail);
    window.addEventListener(UNREAD_EVENT, onUnread);
    return () => window.removeEventListener(UNREAD_EVENT, onUnread);
  }, []);

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
    setMenuOpen(false);
    window.addEventListener("focus", fetchUser);
    return () => window.removeEventListener("focus", fetchUser);
  }, [pathname]);

  // Close the profile menu when clicking anywhere else.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const handleLogout = async () => {
    await fetch("/api/logout", { credentials: 'include' });
    setUser(null);
    setMenuOpen(false);
    navigate("/login");
  };

  const logo = (
    <Link to={user ? "/feed" : "/"} aria-label="RunHer home">
      <img src="/img/runHerLogo2.png" alt="RunHer" className="rh-logo-pink" />
    </Link>
  );

  // Logged-out visitors: logo plus Log in / Get started.
  if (!user) {
    return (
      <nav className="rh-nav">
        <div className="container d-flex align-items-center justify-content-between">
          {logo}
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

  const navClass = ({ isActive }) => `rh-nav-link ${isActive ? "active" : ""}`;

  return (
    <nav className="rh-nav">
      <div className="container d-flex align-items-center gap-3">
        {logo}

        <div className="d-flex align-items-center gap-1 ms-md-3">
          <NavLink to="/feed" className={navClass}>
            <FaHome /> <span className="d-none d-md-inline">Feed</span>
          </NavLink>
          <NavLink to="/friends" className={navClass}>
            <FaUserFriends /> <span className="d-none d-md-inline">Friends</span>
          </NavLink>
        </div>

        <div className="d-flex align-items-center gap-2 ms-auto">
          <Link to="/start-run" className="rh-btn rh-btn-primary" style={{ padding: "8px 18px" }}>
            <FaRunning /> <span className="d-none d-sm-inline">Start run</span>
          </Link>

          <NavLink
            to="/notifications"
            className={({ isActive }) => `rh-icon-btn position-relative ${isActive ? "active" : ""}`}
            aria-label={`Notifications (${unreadCount} unread)`}
          >
            <FaBell />
            {unreadCount > 0 && <span className="rh-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
          </NavLink>

          <div className="position-relative" ref={menuRef}>
            <button
              type="button"
              className="rh-avatar-btn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Account menu"
            >
              <Avatar src={user.profile_picture} firstName={user.first_name} lastName={user.last_name} size={38} />
            </button>

            {menuOpen && (
              <div className="rh-menu" role="menu">
                <div className="px-3 py-2 border-bottom mb-1">
                  <div className="fw-semibold">{user.first_name} {user.last_name}</div>
                  <div className="rh-subtle small text-truncate">{user.email}</div>
                </div>
                <Link to="/profile" className="rh-menu-item" role="menuitem"><FaUser /> Your profile</Link>
                <Link to="/calender" className="rh-menu-item" role="menuitem"><FaCalendarAlt /> Calendar</Link>
                <button type="button" className="rh-menu-item" role="menuitem" onClick={handleLogout}>
                  <FaSignOutAlt /> Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Header;
