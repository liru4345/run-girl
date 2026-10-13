import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEnvelope, FaLock, FaPhoneAlt } from "react-icons/fa";
import AuthLayout from "../components/authLayout";

const Register = () => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
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
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }

      // Log straight in so new runners land in the app instead of back on a login form.
      const loginRes = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      navigate(loginRes.ok ? "/friends" : "/login");
    } catch (err) {
      console.error("❌ Submission Error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout title="Create your account" subtitle="Join RunHer and never run without backup.">
      <form onSubmit={handleSubmit}>
        <div className="row g-3 mb-3">
          <div className="col-6">
            <label className="rh-label mb-1" htmlFor="reg-first">First name</label>
            <input
              id="reg-first"
              name="first_name"
              type="text"
              className="form-control rh-input"
              placeholder="First"
              autoComplete="given-name"
              required
              value={form.first_name}
              onChange={handleChange}
            />
          </div>
          <div className="col-6">
            <label className="rh-label mb-1" htmlFor="reg-last">Last name</label>
            <input
              id="reg-last"
              name="last_name"
              type="text"
              className="form-control rh-input"
              placeholder="Last"
              autoComplete="family-name"
              required
              value={form.last_name}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="rh-label mb-1" htmlFor="reg-email">Email</label>
          <div className="rh-input-icon">
            <FaEnvelope />
            <input
              id="reg-email"
              name="email"
              type="email"
              className="form-control rh-input"
              placeholder="you@example.com"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="rh-label mb-1" htmlFor="reg-phone">Phone number</label>
          <div className="rh-input-icon">
            <FaPhoneAlt />
            <input
              id="reg-phone"
              name="phone_number"
              type="tel"
              className="form-control rh-input"
              placeholder="303-555-0123"
              autoComplete="tel"
              required
              pattern="^(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}$"
              title="Enter a valid phone number (e.g. 123-456-7890 or (123) 456-7890)"
              value={form.phone_number}
              onChange={handleChange}
            />
          </div>
          <small className="rh-subtle">Only shown to friends you pick as watchers, so they can call you.</small>
        </div>

        <div className="mb-3">
          <label className="rh-label mb-1" htmlFor="reg-password">Password</label>
          <div className="rh-input-icon">
            <FaLock />
            <input
              id="reg-password"
              name="password"
              type="password"
              className="form-control rh-input"
              placeholder="At least 8 characters"
              autoComplete="new-password"
              minLength={8}
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mb-4 form-check">
          <input type="checkbox" className="form-check-input" id="terms" required />
          <label className="form-check-label rh-subtle" htmlFor="terms">
            I agree to the Terms &amp; Conditions
          </label>
        </div>

        {error && <div className="rh-notice error mb-3" role="alert">{error}</div>}

        <button type="submit" className="rh-btn rh-btn-primary rh-btn-block" disabled={submitting}>
          {submitting ? "Creating your account…" : "Create account"}
        </button>
      </form>

      <p className="text-center rh-subtle mt-4 mb-0">
        Already have an account?{" "}
        <Link to="/login" className="fw-semibold" style={{ color: "var(--rh-pink-dark)" }}>
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
