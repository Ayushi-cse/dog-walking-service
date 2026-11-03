/**
 * Dog Walking Service - UI Rendering Module
 * Accessible DOM views, Empty states, and Visual loading indicators
 */

import { sanitizeText } from './sanitize.js';

/**
 * Sets the visibility and text of the visual loading indicator.
 * Helps floor staff clearly observe asynchronous operations during slow 3G connectivity.
 * @param {boolean} isLoading 
 * @param {string} message 
 */
export function setLoadingState(isLoading, message = 'Syncing operations...') {
  const indicator = document.getElementById('loading-indicator');
  const textEl = document.getElementById('loading-text');

  if (!indicator) return;

  if (isLoading) {
    if (textEl) textEl.textContent = message;
    indicator.classList.remove('hidden');
    indicator.setAttribute('aria-busy', 'true');
  } else {
    indicator.classList.add('hidden');
    indicator.setAttribute('aria-busy', 'false');
  }
}

/**
 * Renders a user-friendly empty state into the specified container.
 * Satisfies TRD Unhappy Path: "If a list or search result is empty, do not show a blank screen.
 * Display a user-friendly 'No data found' message."
 * @param {HTMLElement} container 
 * @param {string} customMessage 
 */
export function renderEmptyState(container, customMessage = 'No data found.') {
  if (!container) return;

  container.innerHTML = `
    <div class="empty-state" role="status" aria-live="polite">
      <div class="empty-state-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      </div>
      <h3 class="empty-state-title">No data found</h3>
      <p class="empty-state-desc">${sanitizeText(customMessage)}</p>
      <button type="button" class="btn btn-secondary btn-reset-filters" aria-label="Reset active search and filters">
        Reset Search / Filters
      </button>
    </div>
  `;
}

/**
 * Renders the roster of walk cards or the empty state if none exist.
 * @param {Array<object>} walks 
 * @param {HTMLElement} container 
 * @param {{ onStatusChange?: (id: string, status: string) => void, onDelete?: (id: string) => void }} callbacks 
 */
export function renderWalksList(walks, container, callbacks = {}) {
  if (!container) return;

  if (!Array.isArray(walks) || walks.length === 0) {
    renderEmptyState(container, 'No walks match your current view or filter selection.');
    return;
  }

  const cardsHtml = walks
    .map((walk) => {
      const statusClass = `status-${walk.status.toLowerCase()}`;
      const statusLabel = walk.status.replace('-', ' ').toUpperCase();

      return `
        <article class="walk-card" data-walk-id="${walk.id}" aria-labelledby="title-${walk.id}">
          <header class="walk-card-header">
            <div>
              <span class="badge ${statusClass}" role="status">${statusLabel}</span>
              <h3 class="walk-dog-name" id="title-${walk.id}">${walk.dogName}</h3>
              <p class="walk-breed">${walk.breed}</p>
            </div>
            <div class="walk-time-badge" aria-label="Scheduled for ${walk.timeSlot}, duration ${walk.durationMinutes} minutes">
              <span class="time-slot">${walk.timeSlot}</span>
              <span class="duration-tag">${walk.durationMinutes}m</span>
            </div>
          </header>

          <div class="walk-details-grid">
            <div class="detail-item">
              <span class="detail-label">Assigned Walker</span>
              <span class="detail-val font-medium">${walk.walker}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Owner Contact</span>
              <a href="tel:${walk.ownerPhone}" class="detail-val link-tel" aria-label="Call owner of ${walk.dogName} at ${walk.ownerPhone}">${walk.ownerPhone}</a>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date</span>
              <span class="detail-val">${walk.date}</span>
            </div>
            ${
              walk.notes
                ? `<div class="detail-item full-width">
                    <span class="detail-label">Floor Notes</span>
                    <p class="walk-notes">${walk.notes}</p>
                   </div>`
                : ''
            }
          </div>

          <footer class="walk-card-actions">
            ${
              walk.status === 'scheduled'
                ? `<button type="button" class="btn btn-primary btn-start" data-action="start" data-id="${walk.id}" aria-label="Start walk for ${walk.dogName}">
                    Start Walk
                   </button>`
                : ''
            }
            ${
              walk.status === 'in-progress'
                ? `<button type="button" class="btn btn-primary btn-complete" data-action="complete" data-id="${walk.id}" aria-label="Mark walk for ${walk.dogName} as completed">
                    Mark Completed
                   </button>`
                : ''
            }
            ${
              walk.status !== 'completed' && walk.status !== 'cancelled'
                ? `<button type="button" class="btn btn-secondary btn-cancel" data-action="cancel" data-id="${walk.id}" aria-label="Cancel walk for ${walk.dogName}">
                    Cancel
                   </button>`
                : ''
            }
            <button type="button" class="btn btn-ghost btn-delete" data-action="delete" data-id="${walk.id}" aria-label="Remove ${walk.dogName} from manifest">
              Remove
            </button>
          </footer>
        </article>
      `;
    })
    .join('');

  container.innerHTML = `<div class="walks-grid">${cardsHtml}</div>`;

  // Attach event listeners for card actions
  const buttons = container.querySelectorAll('[data-action]');
  buttons.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const action = e.currentTarget.getAttribute('data-action');
      const id = e.currentTarget.getAttribute('data-id');

      if (action === 'start' && callbacks.onStatusChange) {
        callbacks.onStatusChange(id, 'in-progress');
      } else if (action === 'complete' && callbacks.onStatusChange) {
        callbacks.onStatusChange(id, 'completed');
      } else if (action === 'cancel' && callbacks.onStatusChange) {
        callbacks.onStatusChange(id, 'cancelled');
      } else if (action === 'delete' && callbacks.onDelete) {
        callbacks.onDelete(id);
      }
    });
  });
}
