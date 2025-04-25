import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBell } from "react-icons/fa"; // Import bell icon

const Header = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (err) {
        setUser(null); // Not logged in
      }
    };

    fetchUser();
  }, []);

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
                <Link className="nav-link" to="/notifications">
                  <FaBell /> {/* Bell icon */}
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
