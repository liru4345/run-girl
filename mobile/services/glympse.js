// Glympse integration is disabled for now — the SDK's new-architecture
// branch isn't fully working yet (see header-resolution issues during
// the iOS native build). These are no-op stubs so the rest of the app
// runs without it. Re-enable by restoring the real implementation once
// the SDK is fixed upstream.

export function initGlympse() {}

export function startGlympse() {}

export function shareRunLocation() {
  return Promise.reject(new Error('Glympse live-location sharing is currently disabled.'));
}
