import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { trackInteraction, getAnalyticsLog, clearAnalyticsLog } from '../js/telemetry.js';

describe('NFR: Telemetry Simulation', () => {
  let consoleSpy;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    clearAnalyticsLog();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('logs the exact mandated message format to the console on primary actions', () => {
    trackInteraction('Schedule Walk', { dogName: 'Rocky', duration: 30 });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const loggedMessage = consoleSpy.mock.calls[0][0];

    expect(loggedMessage).toContain('[Analytics] User interacted with Static Landing Page');
    expect(loggedMessage).toContain('Action: Schedule Walk');
  });

  it('records structured telemetry metadata for audits', () => {
    trackInteraction('Filter Roster', { status: 'in-progress' });
    trackInteraction('Search Roster', { query: 'Bella' });

    const history = getAnalyticsLog();
    expect(history.length).toBe(2);
    expect(history[0].action).toBe('Filter Roster');
    expect(history[0].details.status).toBe('in-progress');
    expect(history[0].timestamp).toBeDefined();

    expect(history[1].action).toBe('Search Roster');
    expect(history[1].details.query).toBe('Bella');
  });
});
