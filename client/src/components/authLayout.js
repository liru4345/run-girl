import React from "react";
import { FaMapMarkerAlt, FaBell, FaUserFriends } from "react-icons/fa";

// Split screen used by Log in and Register: brand panel on the left, form on the right.
const AuthLayout = ({ title, subtitle, children }) => (
  <div className="rh-page mt-4 mb-5">
    <div className="rh-card p-0 overflow-hidden">
      <div className="row g-0">
        <div className="col-lg-5 d-none d-lg-flex rh-auth-panel flex-column justify-content-between p-5">
          <img src="/img/runHerLogo2.png" alt="RunHer" style={{ height: 44, objectFit: "contain", alignSelf: "flex-start" }} />
          <div>
            <h2 className="fw-bold mb-3">Run your way.<br />Never alone.</h2>
            <ul className="list-unstyled mb-0 rh-auth-points">
              <li><FaUserFriends /> Pick friends to watch over your run</li>
              <li><FaMapMarkerAlt /> Share your live location while you're out</li>
              <li><FaBell /> They're alerted if you don't check in</li>
            </ul>
          </div>
          <div className="small opacity-75">Built for women who run.</div>
        </div>

        <div className="col-lg-7 p-4 p-md-5">
          <div className="mx-auto" style={{ maxWidth: 420 }}>
            <h2 className="fw-bold mb-1">{title}</h2>
            <p className="rh-subtle mb-4">{subtitle}</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AuthLayout;
