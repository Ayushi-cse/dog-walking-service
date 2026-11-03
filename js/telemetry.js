/**
 * Dog Walking Service - Telemetry Simulation Module
 * Enterprise observability and interaction telemetry
 * 
 * Satisfies TRD NFR: Logs console messages formatted as:
 * "[Analytics] User interacted with Static Landing Page - Action: <action> | Payload: ..."
 */

let analyticsLogBuffer = [];
const subscribers = new Set();

/**
 * Tracks and logs an interaction with the landing page.
 * @param {string} action The action being performed (e.g. 'Schedule Walk', 'Filter Roster')
 * @param {Record<string, unknown>} details Associated metadata
 */
export function trackInteraction(action, details = {}) {
  const timestamp = new Date().toISOString();
  const event = {
    action,
    timestamp,
    details,
  };

  analyticsLogBuffer.push(event);

  // Exact console pattern mandated by TRD specification:
  const logMessage = `[Analytics] User interacted with Static Landing Page - Action: ${action} | Details: ${JSON.stringify(details)}`;
  console.log(logMessage);

  // Notify any active UI debug panels/subscribers
  subscribers.forEach((callback) => {
    try {
      callback(event);
    } catch {
      // Ignore subscriber errors to prevent telemetry disruptions
    }
  });

  return event;
}

/**
 * Returns historical logs recorded during the current session.
 * @returns {Array<{ action: string, timestamp: string, details: Record<string, unknown> }>}
 */
export function getAnalyticsLog() {
  return [...analyticsLogBuffer];
}

/**
 * Clears recorded logs (useful for unit tests and session resets).
 */
export function clearAnalyticsLog() {
  analyticsLogBuffer = [];
}

/**
 * Subscribes an observer to real-time telemetry events.
 * @param {(event: Record<string, unknown>) => void} callback 
 * @returns {() => void} Unsubscribe function
 */
export function subscribeToAnalytics(callback) {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}
