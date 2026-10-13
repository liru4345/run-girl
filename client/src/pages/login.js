import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock } from "react-icons/fa";
import AuthLayout from "../components/authLayout";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        navigate("/feed");
      } else {
        setError(data.error === "Invalid credentials" ? "That email and password don't match." : data.error || "Login failed");
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to see your friends' runs and start your own.">
      <form onSubmit={handleSubmit} noValidate={false}>
        <div className="mb-3">
          <label className="rh-label mb-1" htmlFor="login-email">Email</label>
          <div className="rh-input-icon">
            <FaEnvelope />
            <input
              id="login-email"
              type="email"
              name="email"
              className="form-control rh-input"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="rh-label mb-1" htmlFor="login-password">Password</label>
          <div className="rh-input-icon">
            <FaLock />
            <input
              id="login-password"
              type="password"
              name="password"
              className="form-control rh-input"
              placeholder="Your password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>
        </div>

        {error && <div className="rh-notice error mb-3" role="alert">{error}</div>}

        <button type="submit" className="rh-btn rh-btn-primary rh-btn-block" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="text-center rh-subtle mt-4 mb-0">
        New to RunHer?{" "}
        <Link to="/register" className="fw-semibold" style={{ color: "var(--rh-pink-dark)" }}>
          Create an account
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Login;
