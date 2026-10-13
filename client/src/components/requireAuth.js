import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

// Wraps the in-app pages: logged-out visitors are sent to log in, then brought back here.
const RequireAuth = () => {
  const [status, setStatus] = useState("checking"); // checking | in | out
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/profile", { credentials: "include" })
      .then((res) => !cancelled && setStatus(res.ok ? "in" : "out"))
      .catch(() => !cancelled && setStatus("out"));
    return () => { cancelled = true; };
  }, [location.pathname]);

  if (status === "checking") return null;
  if (status === "out") {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return <Outlet />;
};

export default RequireAuth;
