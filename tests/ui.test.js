import { describe, it, expect, beforeEach } from 'vitest';
import {
  renderWalksList,
  setLoadingState,
  renderEmptyState,
} from '../js/ui.js';

describe('Unhappy Path & A11y: Empty States and Bad Connectivity Indicator', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="loading-indicator" class="loading-indicator hidden" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true"></span>
        <span id="loading-text">Loading...</span>
      </div>
      <div id="walks-container" role="region" aria-label="Walks Schedule Roster"></div>
    `;
  });

  it('displays user-friendly "No data found" empty state instead of blank screen when list is empty', () => {
    const container = document.getElementById('walks-container');
    renderWalksList([], container);

    const emptyStateEl = container.querySelector('.empty-state');
    expect(emptyStateEl).not.toBeNull();
    expect(emptyStateEl.textContent).toContain('No data found');
    expect(emptyStateEl.getAttribute('role')).toBe('status');
  });

  it('renders custom empty message when search query produces no results', () => {
    const container = document.getElementById('walks-container');
    renderEmptyState(container, 'No dogs or walks matched your search criteria.');

    const emptyStateEl = container.querySelector('.empty-state');
    expect(emptyStateEl.textContent).toContain('No dogs or walks matched your search criteria.');
  });

  it('controls the visual loading indicator for slow 3G network simulation', () => {
    const indicator = document.getElementById('loading-indicator');
    const textEl = document.getElementById('loading-text');

    setLoadingState(true, 'Syncing with dispatch server over slow 3G...');

    expect(indicator.classList.contains('hidden')).toBe(false);
    expect(textEl.textContent).toBe('Syncing with dispatch server over slow 3G...');

    setLoadingState(false);
    expect(indicator.classList.contains('hidden')).toBe(true);
  });

  it('renders walk cards with accessible buttons and ARIA labels', () => {
    const container = document.getElementById('walks-container');
    const mockWalks = [
      {
        id: 'walk-123',
        dogName: 'Bella',
        breed: 'Labrador',
        ownerPhone: '(555) 777-8899',
        walker: 'Alex Chen',
        date: '2026-11-04',
        timeSlot: '08:30',
        durationMinutes: 30,
        status: 'scheduled',
      },
    ];

    renderWalksList(mockWalks, container);

    const card = container.querySelector('[data-walk-id="walk-123"]');
    expect(card).not.toBeNull();

    const startBtn = card.querySelector('.btn-start');
    expect(startBtn).not.toBeNull();
    expect(startBtn.getAttribute('aria-label')).toContain('Start walk for Bella');
  });
});
