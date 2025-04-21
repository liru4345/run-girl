import React, { useState } from "react";

const Register = () => {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        alert(data.message);
        // You could also navigate to login:
        // window.location.href = '/login';
      } else {
        alert(data.error || "Registration failed");
      }
    } catch (err) {
      console.error("❌ Submission Error:", err);
      alert("Something went wrong");
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow p-4">
            <h2 className="text-center mb-4 text-primary">Sign Up</h2>
            <form onSubmit={handleSubmit}>
              {/* First Name */}
              <div className="mb-3">
                <label className="form-label">First Name</label>
                <input
                  name="first_name"
                  type="text"
                  className="form-control"
                  placeholder="Enter your first name"
                  required
                  value={form.first_name}
                  onChange={handleChange}
                />
              </div>

              {/* Last Name */}
              <div className="mb-3">
                <label className="form-label">Last Name</label>
                <input
                  name="last_name"
                  type="text"
                  className="form-control"
                  placeholder="Enter your last name"
                  required
                  value={form.last_name}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="Enter email"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              {/* Phone Number */}
              <div className="mb-3">
                <label className="form-label">Phone Number</label>
                <input
                  name="phone_number"
                  type="tel"
                  className="form-control"
                  placeholder="Enter Phone Number"
                  required
                  pattern="^(\+?\d{1,2}\s?)?(\(?\d{3}\)?[\s-]?)?\d{3}[\s-]?\d{4}$"
                  title="Enter a valid phone number (e.g. 123-456-7890 or (123) 456-7890)"
                  value={form.phone_number}
                  onChange={handleChange}
                />
              </div>

              {/* Password */}
              <div className="mb-3">
                <label className="form-label">Password</label>
                <input
                  name="password"
                  type="password"
                  className="form-control"
                  placeholder="Enter password"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              {/* Terms & Conditions */}
              <div className="mb-3 form-check">
                <input type="checkbox" className="form-check-input" id="terms" required />
                <label className="form-check-label" htmlFor="terms">
                  I agree to the Terms & Conditions
                </label>
              </div>

              <button type="submit" className="btn btn-primary w-100">Sign Up</button>
            </form>

            <p className="text-center mt-3">
              Already have an account? <a href="/login" className="text-primary">Login</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
