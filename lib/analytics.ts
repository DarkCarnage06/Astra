/**
 * lib/analytics.ts
 *
 * Analytics event tracking architecture.
 * All events are defined here as typed constants.
 * No analytics service is wired yet — only the architecture is ready.
 *
 * Future: plug in Posthog, Mixpanel, Amplitude, or custom backend
 * by implementing the `send` function below.
 */

// ---------------------------------------------------------------------------
// Event definitions
// ---------------------------------------------------------------------------

export const ANALYTICS_EVENTS = {
  // Onboarding
  FORM_STARTED:         'form_started',
  FORM_SUBMITTED:       'form_submitted',
  FORM_VALIDATION_FAIL: 'form_validation_fail',
  GEOCODE_REQUESTED:    'geocode_requested',
  GEOCODE_SUCCESS:      'geocode_success',
  GEOCODE_FAILED:       'geocode_failed',

  // Chart generation
  CHART_REQUESTED:      'chart_requested',
  CHART_GENERATED:      'chart_generated',
  CHART_FAILED:         'chart_failed',
  CHART_CACHE_HIT:      'chart_cache_hit',

  // AI readings
  READING_STARTED:      'reading_started',
  READING_COMPLETED:    'reading_completed',
  READING_FAILED:       'reading_failed',
  READING_CACHE_HIT:    'reading_cache_hit',
  READING_STREAMING:    'reading_streaming',

  // Performance
  LOADING_DURATION:     'loading_duration',
  PROMPT_LATENCY:       'prompt_latency',
  API_LATENCY:          'api_latency',

  // UI interactions
  DASHBOARD_VIEWED:     'dashboard_viewed',
  CARD_EXPANDED:        'card_expanded',
  SHARE_CLICKED:        'share_clicked',
} as const;

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];

// ---------------------------------------------------------------------------
// Event payload types
// ---------------------------------------------------------------------------

export interface AnalyticsPayload {
  event: AnalyticsEvent;
  properties?: Record<string, string | number | boolean | null>;
  timestamp?: number;
}

// ---------------------------------------------------------------------------
// Tracking function
// ---------------------------------------------------------------------------

/**
 * Track an analytics event.
 * Currently logs to console in development.
 * Replace the body of `send` to wire up a real analytics provider.
 */
function send(payload: AnalyticsPayload): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug('[Analytics]', payload.event, payload.properties ?? {});
  }
  // Wire up an analytics provider here when ready.
  // Example: posthog.capture(payload.event, payload.properties)
  // Example: mixpanel.track(payload.event, payload.properties)
}

export function track(
  event: AnalyticsEvent,
  properties?: Record<string, string | number | boolean | null>,
): void {
  send({ event, properties, timestamp: Date.now() });
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export function trackReadingStarted(theme: string): void {
  track(ANALYTICS_EVENTS.READING_STARTED, { theme });
}

export function trackReadingCompleted(theme: string, latencyMs: number): void {
  track(ANALYTICS_EVENTS.READING_COMPLETED, { theme, latencyMs });
}

export function trackReadingFailed(theme: string, reason: string): void {
  track(ANALYTICS_EVENTS.READING_FAILED, { theme, reason });
}

export function trackChartGenerated(calculationTimeMs: number | null): void {
  track(ANALYTICS_EVENTS.CHART_GENERATED, {
    calculationTimeMs: calculationTimeMs ?? -1,
  });
}

export function trackApiLatency(endpoint: string, latencyMs: number): void {
  track(ANALYTICS_EVENTS.API_LATENCY, { endpoint, latencyMs });
}
