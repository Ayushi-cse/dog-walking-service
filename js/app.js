/**
 * Dog Walking Service - Main Application Controller
 * High-performance digital operations portal for floor staff & management.
 * 
 * Replaces legacy Excel sheets and paper forms with instant reactive dispatching,
 * resilient edge-case handling, and strict enterprise telemetry.
 */

import {
  initStore,
  getAllWalks,
  addWalk,
  updateWalkStatus,
  deleteWalk,
  exportStructuredData,
} from './store.js';

import {
  renderWalksList,
  setLoadingState,
  renderEmptyState,
} from './ui.js';

import {
  validateWalkInput,
  applyValidationFeedback,
  clearValidationFeedback,
} from './validator.js';

import {
  trackInteraction,
  subscribeToAnalytics,
  clearAnalyticsLog,
} from './telemetry.js';

import {
  toggleSlow3G,
  simulateNetworkDelay,
} from './network.js';

// Application State
const appState = {
  statusFilter: 'all',
  walkerFilter: 'all',
  searchQuery: '',
};

/**
 * Initializes application on DOMContentLoaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  initStore();
  setupEventListeners();
  setupTelemetryInspector();
  refreshRosterView();

  // Set default schedule date to today in YYYY-MM-DD format
  const dateInput = document.getElementById('date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
});

/**
 * Sets up all DOM event listeners for buttons, filters, forms, and dialogs.
 */
function setupEventListeners() {
  // Search input & keyboard shortcuts
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      appState.searchQuery = e.target.value;
      if (clearSearchBtn) {
        if (appState.searchQuery.length > 0) {
          clearSearchBtn.classList.remove('hidden');
        } else {
          clearSearchBtn.classList.add('hidden');
        }
      }
      refreshRosterView();
      trackInteraction('Search Roster', { query: appState.searchQuery });
    });

    // Keyboard shortcut: Press '/' anywhere to focus search box
    window.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== searchInput && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      }
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        appState.searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        searchInput.focus();
        refreshRosterView();
        trackInteraction('Clear Search');
      }
    });
  }

  // Status Filter Tabs
  const statusTabs = document.querySelectorAll('.tab-btn[data-filter-status]');
  statusTabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      statusTabs.forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });

      const target = e.currentTarget;
      target.classList.add('active');
      target.setAttribute('aria-selected', 'true');

      appState.statusFilter = target.getAttribute('data-filter-status');
      refreshRosterView();
      trackInteraction('Filter Status', { status: appState.statusFilter });
    });
  });

  // Walker Dropdown Filter
  const walkerSelect = document.getElementById('filter-walker-select');
  if (walkerSelect) {
    walkerSelect.addEventListener('change', (e) => {
      appState.walkerFilter = e.target.value;
      refreshRosterView();
      trackInteraction('Filter Walker', { walker: appState.walkerFilter });
    });
  }

  // Modals & Dialog Handling
  const scheduleModal = document.getElementById('walk-modal');
  const exportModal = document.getElementById('export-modal');
  const scheduleForm = document.getElementById('schedule-form');

  const btnOpenSchedule = document.getElementById('btn-open-schedule-modal');
  const btnCloseSchedule = document.getElementById('btn-close-schedule-modal');
  const btnCancelSchedule = document.getElementById('btn-cancel-schedule');

  if (btnOpenSchedule && scheduleModal) {
    btnOpenSchedule.addEventListener('click', () => {
      if (scheduleForm) {
        scheduleForm.reset();
        clearValidationFeedback(scheduleForm);
        const dateInput = document.getElementById('date');
        if (dateInput) {
          dateInput.value = new Date().toISOString().split('T')[0];
        }
      }
      scheduleModal.showModal();
      trackInteraction('Open Schedule Modal');
    });
  }

  const closeScheduleModal = () => {
    if (scheduleModal) {
      scheduleModal.close();
      trackInteraction('Close Schedule Modal');
    }
  };

  if (btnCloseSchedule) btnCloseSchedule.addEventListener('click', closeScheduleModal);
  if (btnCancelSchedule) btnCancelSchedule.addEventListener('click', closeScheduleModal);

  // Form Submission & Validation (Unhappy Path handling)
  if (scheduleForm) {
    scheduleForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(scheduleForm);
      const rawData = {
        dogName: formData.get('dogName'),
        breed: formData.get('breed'),
        ownerPhone: formData.get('ownerPhone'),
        walker: formData.get('walker'),
        date: formData.get('date'),
        timeSlot: formData.get('timeSlot'),
        durationMinutes: formData.get('durationMinutes'),
        notes: formData.get('notes'),
      };

      // 1. Validation check
      const validation = validateWalkInput(rawData);

      if (!validation.isValid) {
        // Highlight offending fields in red and show accessible error messages
        applyValidationFeedback(scheduleForm, validation.errors);

        // Focus first offending element for accessibility
        const firstErrorKey = Object.keys(validation.errors)[0];
        const firstInvalidInput = scheduleForm.querySelector(`[name="${firstErrorKey}"]`);
        if (firstInvalidInput) {
          firstInvalidInput.focus();
        }

        trackInteraction('Schedule Form Validation Failed', { errors: validation.errors });
        return;
      }

      // 2. Clear invalid states
      clearValidationFeedback(scheduleForm);

      // 3. Asynchronous dispatch simulation with visual loading indicator (Slow 3G resilient)
      setLoadingState(true, 'Syncing new walk with dispatch server...');

      try {
        await simulateNetworkDelay();

        // 4. Sanitize and persist structured record
        const record = addWalk(rawData);
        trackInteraction('Schedule Walk Success', { id: record.id, dogName: record.dogName });

        // 5. Update UI
        closeScheduleModal();
        refreshRosterView();
      } finally {
        setLoadingState(false);
      }
    });
  }

  // Export Modal Handling
  const btnOpenExport = document.getElementById('btn-open-export-modal');
  const btnCloseExport = document.getElementById('btn-close-export-modal');
  const previewArea = document.getElementById('export-preview-area');
  const btnCopyExport = document.getElementById('btn-copy-export');
  const btnDownloadExport = document.getElementById('btn-download-export');
  const formatRadios = document.querySelectorAll('input[name="export-format"]');

  const updateExportPreview = () => {
    const selectedFormat = document.querySelector('input[name="export-format"]:checked')?.value || 'json';
    const output = exportStructuredData(selectedFormat);
    if (previewArea) {
      previewArea.value = output;
    }
  };

  if (btnOpenExport && exportModal) {
    btnOpenExport.addEventListener('click', () => {
      updateExportPreview();
      exportModal.showModal();
      trackInteraction('Open Export Modal');
    });
  }

  if (btnCloseExport && exportModal) {
    btnCloseExport.addEventListener('click', () => {
      exportModal.close();
      trackInteraction('Close Export Modal');
    });
  }

  formatRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      updateExportPreview();
      trackInteraction('Change Export Format', { format: radio.value });
    });
  });

  if (btnCopyExport && previewArea) {
    btnCopyExport.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(previewArea.value);
        const originalText = btnCopyExport.textContent;
        btnCopyExport.textContent = 'Copied!';
        setTimeout(() => {
          btnCopyExport.textContent = originalText;
        }, 1800);
        trackInteraction('Copy Export Data');
      } catch {
        // Fallback selection
        previewArea.select();
      }
    });
  }

  if (btnDownloadExport && previewArea) {
    btnDownloadExport.addEventListener('click', () => {
      const selectedFormat = document.querySelector('input[name="export-format"]:checked')?.value || 'json';
      const content = previewArea.value;
      const mimeType = selectedFormat === 'json' ? 'application/json' : 'text/csv';
      const filename = `dog-walking-manifest-${new Date().toISOString().split('T')[0]}.${selectedFormat}`;

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      trackInteraction('Download Manifest File', { filename });
    });
  }

  // Network Slow 3G Simulator Toggle
  const networkToggle = document.getElementById('network-toggle');
  const networkText = document.getElementById('network-status-text');
  const statusDot = document.getElementById('status-dot');

  if (networkToggle) {
    networkToggle.addEventListener('change', (e) => {
      const isSlow = toggleSlow3G(e.target.checked);
      networkToggle.setAttribute('aria-checked', isSlow ? 'true' : 'false');

      if (isSlow) {
        if (networkText) networkText.textContent = 'Simulated Slow 3G (1.4s)';
        if (statusDot) statusDot.classList.add('slow-mode');
      } else {
        if (networkText) networkText.textContent = 'Online (Normal)';
        if (statusDot) statusDot.classList.remove('slow-mode');
      }

      trackInteraction('Toggle Network Mode', { simulatedSlow3G: isSlow });
    });
  }
}

/**
 * Filters, searches, and renders the current walks roster and metrics.
 */
function refreshRosterView() {
  const container = document.getElementById('walks-container');
  const recordsBadge = document.getElementById('records-count');
  const allWalks = getAllWalks();

  // 1. Apply status & staff filter
  let filtered = allWalks;
  if (appState.statusFilter !== 'all') {
    filtered = filtered.filter((w) => w.status === appState.statusFilter);
  }
  if (appState.walkerFilter !== 'all') {
    filtered = filtered.filter((w) => w.walker === appState.walkerFilter);
  }

  // 2. Apply text search
  if (appState.searchQuery.trim()) {
    const q = appState.searchQuery.toLowerCase().trim();
    filtered = filtered.filter((w) => {
      return (
        (w.dogName || '').toLowerCase().includes(q) ||
        (w.breed || '').toLowerCase().includes(q) ||
        (w.walker || '').toLowerCase().includes(q) ||
        (w.ownerPhone || '').toLowerCase().includes(q) ||
        (w.notes || '').toLowerCase().includes(q)
      );
    });
  }

  // 3. Update records count badge
  if (recordsBadge) {
    recordsBadge.textContent = `Showing ${filtered.length} of ${allWalks.length} walks`;
  }

  // 4. Update metrics banner
  updateMetricsRibbon(allWalks);

  // 5. Render cards or empty state
  if (filtered.length === 0) {
    const emptyMsg = appState.searchQuery.trim()
      ? `No walks match "${appState.searchQuery}". Try clearing search or resetting filters.`
      : 'No walks match your current filter selection.';
    renderEmptyState(container, emptyMsg);

    // Wire up reset button inside empty state
    const resetBtn = container.querySelector('.btn-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        resetFiltersAndSearch();
      });
    }
  } else {
    renderWalksList(filtered, container, {
      onStatusChange: async (id, newStatus) => {
        setLoadingState(true, `Updating walk status to ${newStatus}...`);
        try {
          await simulateNetworkDelay();
          updateWalkStatus(id, newStatus);
          trackInteraction('Update Walk Status', { id, status: newStatus });
          refreshRosterView();
        } finally {
          setLoadingState(false);
        }
      },
      onDelete: (id) => {
        const confirmed = window.confirm('Are you sure you want to remove this walk from the manifest?');
        if (confirmed) {
          deleteWalk(id);
          trackInteraction('Delete Walk', { id });
          refreshRosterView();
        }
      },
    });
  }
}

/**
 * Resets search queries and status filters.
 */
function resetFiltersAndSearch() {
  appState.searchQuery = '';
  appState.statusFilter = 'all';
  appState.walkerFilter = 'all';

  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('btn-clear-search');
  if (searchInput) searchInput.value = '';
  if (clearSearchBtn) clearSearchBtn.classList.add('hidden');

  const statusTabs = document.querySelectorAll('.tab-btn[data-filter-status]');
  statusTabs.forEach((tab) => {
    const isAll = tab.getAttribute('data-filter-status') === 'all';
    tab.classList.toggle('active', isAll);
    tab.setAttribute('aria-selected', isAll ? 'true' : 'false');
  });

  const walkerSelect = document.getElementById('filter-walker-select');
  if (walkerSelect) walkerSelect.value = 'all';

  trackInteraction('Reset All Filters');
  refreshRosterView();
}

/**
 * Updates the top corporate metrics ribbon.
 * @param {Array<object>} walks 
 */
function updateMetricsRibbon(walks) {
  const totalEl = document.getElementById('metric-total-walks');
  const activeEl = document.getElementById('metric-active-walks');
  const completedEl = document.getElementById('metric-completed-walks');
  const walkersEl = document.getElementById('metric-walkers-count');

  if (totalEl) totalEl.textContent = walks.length;
  if (activeEl) {
    const inProgressCount = walks.filter((w) => w.status === 'in-progress').length;
    activeEl.textContent = inProgressCount;
  }
  if (completedEl) {
    const completedCount = walks.filter((w) => w.status === 'completed').length;
    completedEl.textContent = completedCount;
  }
  if (walkersEl) {
    const uniqueWalkers = new Set(walks.map((w) => w.walker).filter(Boolean));
    walkersEl.textContent = uniqueWalkers.size || 3;
  }
}

/**
 * Wires the real-time telemetry inspector drawer.
 */
function setupTelemetryInspector() {
  const drawer = document.getElementById('telemetry-drawer');
  const btnToggle = document.getElementById('btn-toggle-telemetry');
  const btnClose = document.getElementById('btn-close-telemetry');
  const btnClear = document.getElementById('btn-clear-telemetry');
  const entriesList = document.getElementById('telemetry-entries-list');

  if (!drawer || !btnToggle) return;

  const toggleDrawer = () => {
    const isHidden = drawer.classList.contains('hidden');
    if (isHidden) {
      drawer.classList.remove('hidden');
      btnToggle.setAttribute('aria-expanded', 'true');
    } else {
      drawer.classList.add('hidden');
      btnToggle.setAttribute('aria-expanded', 'false');
    }
  };

  btnToggle.addEventListener('click', toggleDrawer);
  if (btnClose) btnClose.addEventListener('click', toggleDrawer);

  if (btnClear && entriesList) {
    btnClear.addEventListener('click', () => {
      clearAnalyticsLog();
      entriesList.innerHTML = '<div class="telemetry-empty">Telemetry log cleared.</div>';
    });
  }

  // Subscribe to live telemetry pings
  subscribeToAnalytics((event) => {
    if (!entriesList) return;

    const entryEl = document.createElement('div');
    entryEl.className = 'telemetry-item';
    const timeFormatted = new Date(event.timestamp).toLocaleTimeString();

    entryEl.innerHTML = `
      <div class="telemetry-item-action">[Analytics] ${event.action}</div>
      <div class="telemetry-item-time">${timeFormatted}</div>
      <div class="telemetry-item-payload">${JSON.stringify(event.details)}</div>
    `;

    entriesList.prepend(entryEl);
  });
}
