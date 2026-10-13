// Shared run actions used by more than one component.

// Fired after the runner checks in from anywhere (pop-up, notifications page, Start Run),
// so other parts of the UI can refresh the run's expected end time.
export const RUN_UPDATED_EVENT = "runher:run-updated";

export async function checkInRun(runId, extraMinutes = 10) {
  const res = await fetch(`/api/runs/${runId}/checkin`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ extra_minutes: extraMinutes }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Check-in failed");

  window.dispatchEvent(new CustomEvent(RUN_UPDATED_EVENT, { detail: { runId, end_time: data.end_time } }));
  return data;
}
