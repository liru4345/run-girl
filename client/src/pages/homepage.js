import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaUserFriends, FaMapMarkerAlt, FaBell, FaRunning, FaCheckCircle, FaPhoneAlt, FaCamera,
} from "react-icons/fa";

const FEATURES = [
  {
    icon: <FaUserFriends />,
    title: "Pick your watchers",
    text: "Choose friends to keep an eye on you. They're notified the moment you head out.",
  },
  {
    icon: <FaMapMarkerAlt />,
    title: "Share your live location",
    text: "Watchers follow your route on a live map, updated every few seconds while you run.",
  },
  {
    icon: <FaBell />,
    title: "Automatic check-ins",
    text: "Running late? Add time with a tap. If you don't check in, your watchers are alerted with your last location.",
  },
  {
    icon: <FaCamera />,
    title: "Share the run",
    text: "Post your distance, pace, and a photo to your feed, and cheer on your friends' runs.",
  },
];

const STEPS = [
  { title: "Plan", text: "Set how long you'll be out and where you're running." },
  { title: "Run", text: "Your watchers can follow along and call or text you in one tap." },
  { title: "Check in", text: "Finish, or add time. Miss a check-in and your watchers are alerted." },
];

const Homepage = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch("/api/profile", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="rh-page mt-4 mb-5">
      {/* Hero */}
      <section className="row align-items-center g-5 mb-5 pt-lg-4">
        <div className="col-lg-6">
          <span className="rh-status-pill mb-3" style={{ background: "var(--rh-pink-soft)", color: "var(--rh-pink-dark)" }}>
            <FaRunning /> Safety-first social running
          </span>
          <h1 className="rh-hero-title mb-3">
            Run your way.<br />
            <span style={{ color: "var(--rh-pink)" }}>Never alone.</span>
          </h1>
          <p className="lead rh-subtle mb-4">
            RunHer lets trusted friends follow your run, and alerts them automatically if you don't
            make it back on time.
          </p>

          {user ? (
            <div className="d-flex flex-wrap gap-2">
              <Link to="/start-run" className="rh-btn rh-btn-primary" style={{ padding: "14px 28px" }}>Start a run</Link>
              <Link to="/feed" className="rh-btn rh-btn-secondary" style={{ padding: "14px 28px" }}>Go to your feed</Link>
            </div>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              <Link to="/register" className="rh-btn rh-btn-primary" style={{ padding: "14px 28px" }}>Get started</Link>
              <Link to="/login" className="rh-btn rh-btn-secondary" style={{ padding: "14px 28px" }}>Log in</Link>
            </div>
          )}
        </div>

        <div className="col-lg-6">
          <div className="rh-hero-visual">
            <img src="/img/hero-runner.jpg" alt="A smiling woman running on a trail at sunset" className="rh-hero-photo" style={{ objectPosition: "52% 30%" }} />

            <div className="rh-float-card" style={{ top: 24, left: -12 }}>
              <span className="rh-live-dot" style={{ background: "var(--rh-pink)" }} />
              <div>
                <div className="fw-semibold small">Run in progress</div>
                <div className="rh-subtle small">Back by 7:30 AM</div>
              </div>
            </div>

            <div className="rh-float-card" style={{ bottom: 70, right: -12 }}>
              <span className="rh-float-icon" style={{ background: "#e7f8f0", color: "#18865a" }}><FaCheckCircle /></span>
              <div>
                <div className="fw-semibold small">Alex is watching</div>
                <div className="rh-subtle small">Live location shared</div>
              </div>
            </div>

            <div className="rh-float-card" style={{ bottom: 12, left: 24 }}>
              <span className="rh-float-icon"><FaPhoneAlt /></span>
              <div className="fw-semibold small">Call or text in one tap</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mb-5">
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1">Everything you need to run with confidence</h2>
          <p className="rh-subtle mb-0">Safety tools and a community, in one app.</p>
        </div>
        <div className="row g-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="col-md-6 col-lg-3">
              <div className="rh-card h-100">
                <span className="rh-feature-icon mb-3">{f.icon}</span>
                <div className="rh-card-title">{f.title}</div>
                <p className="rh-subtle mb-0">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="rh-card mb-5 p-4 p-md-5">
        <h2 className="fw-bold text-center mb-4">How it works</h2>
        <div className="row g-4">
          {STEPS.map((step, i) => (
            <div key={step.title} className="col-md-4 text-center">
              <div className="rh-step-number mx-auto mb-3">{i + 1}</div>
              <div className="rh-card-title">{step.title}</div>
              <p className="rh-subtle mb-0">{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to action */}
      {!user && (
        <section className="rh-hero text-center p-5">
          <h2 className="fw-bold mb-2">Your next run, with backup.</h2>
          <p className="mb-4 opacity-75">Create a free account and invite the friends you trust.</p>
          <Link to="/register" className="rh-btn" style={{ background: "#fff", color: "var(--rh-pink-dark)", padding: "14px 28px" }}>
            Create your account
          </Link>
        </section>
      )}
    </div>
  );
};

export default Homepage;
