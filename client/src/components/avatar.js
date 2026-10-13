import React, { useState } from "react";

// Round profile picture that falls back to the person's initials when there's no picture
// or the image fails to load.
const Avatar = ({ src, firstName = "", lastName = "", size = 40, className = "" }) => {
  const [failed, setFailed] = useState(false);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "?";
  const style = { width: size, height: size, flexShrink: 0 };

  if (!src || failed) {
    return (
      <div
        className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-semibold text-white ${className}`}
        style={{ ...style, backgroundColor: "#ff69b4", fontSize: size * 0.4 }}
        aria-label={`${firstName} ${lastName}`.trim()}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`${firstName} ${lastName}`.trim()}
      className={`rounded-circle ${className}`}
      style={{ ...style, objectFit: "cover" }}
      onError={() => setFailed(true)}
    />
  );
};

export default Avatar;
