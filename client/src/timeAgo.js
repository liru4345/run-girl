// "just now", "5m ago", "3h ago", "2d ago", then a short date.
export const timeAgo = (timestamp) => {
  const seconds = Math.round((Date.now() - new Date(timestamp)) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(timestamp).toLocaleDateString([], { month: "short", day: "numeric" });
};
