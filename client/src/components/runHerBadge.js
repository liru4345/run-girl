import React from "react";
import { FaRunning } from "react-icons/fa";

// Round pink badge used as the "avatar" for messages from RunHer itself.
const RunHerBadge = ({ size = 44 }) => (
  <span
    className="d-inline-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
    style={{ width: size, height: size, background: "var(--rh-pink)", color: "#fff", fontSize: size * 0.45 }}
    aria-label="RunHer"
  >
    <FaRunning />
  </span>
);

export default RunHerBadge;
