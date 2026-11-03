/**
 * Dog Walking Service - Data Store Module
 * Consistent Structured Schema & Persistence Management
 * 
 * Satisfies Manager Story: Consistent structured schema for floor staff operations
 * and reliable export formats (JSON / CSV) for management reviews.
 */

import { sanitizeWalkPayload } from './sanitize.js';

const STORAGE_KEY = 'k9_dog_walking_roster_v1';

// Initial seed data representing a busy day at the dog walking center
export const DEFAULT_INITIAL_WALKS = [
  {
    id: 'walk-101',
    dogName: 'Barnaby',
    breed: 'Golden Retriever',
    ownerPhone: '(555) 234-8901',
    walker: 'Alex Chen',
    date: '2026-11-04',
    timeSlot: '08:30',
    durationMinutes: 45,
    notes: 'Loves retrieving tennis balls; pull slightly at start of walk.',
    status: 'scheduled',
    createdAt: '2026-11-03T08:00:00.000Z',
    updatedAt: '2026-11-03T08:00:00.000Z',
  },
  {
    id: 'walk-102',
    dogName: 'Bella',
    breed: 'French Bulldog',
    ownerPhone: '(555) 876-5432',
    walker: 'Sarah Jenkins',
    date: '2026-11-04',
    timeSlot: '09:30',
    durationMinutes: 30,
    notes: 'Prone to overheating, stick to shaded park paths.',
    status: 'in-progress',
    createdAt: '2026-11-03T08:15:00.000Z',
    updatedAt: '2026-11-03T09:30:00.000Z',
  },
  {
    id: 'walk-103',
    dogName: 'Cooper',
    breed: 'Australian Shepherd',
    ownerPhone: '(555) 432-1098',
    walker: 'David Ross',
    date: '2026-11-04',
    timeSlot: '11:00',
    durationMinutes: 60,
    notes: 'Very energetic agility dog. Agility harness located in locker 4.',
    status: 'scheduled',
    createdAt: '2026-11-03T08:30:00.000Z',
    updatedAt: '2026-11-03T08:30:00.000Z',
  },
  {
    id: 'walk-104',
    dogName: 'Luna',
    breed: 'Siberian Husky',
    ownerPhone: '(555) 654-3210',
    walker: 'Alex Chen',
    date: '2026-11-04',
    timeSlot: '07:30',
    durationMinutes: 60,
    notes: 'Morning run completed. Fresh water bowl provided.',
    status: 'completed',
    createdAt: '2026-11-03T07:00:00.000Z',
    updatedAt: '2026-11-03T08:30:00.000Z',
  },
];

let inMemoryStore = [];

/**
 * Initializes the store from localStorage or default seed data.
 * @param {Array<object> | null} customInitialData 
 */
export function initStore(customInitialData = null) {
  if (customInitialData !== null) {
    inMemoryStore = [...customInitialData];
    persist();
    return;
  }

  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        inMemoryStore = parsed;
        return;
      }
    }
  } catch {
    // If parsing fails or localStorage is blocked, fall back to defaults
  }

  inMemoryStore = [...DEFAULT_INITIAL_WALKS];
  persist();
}

/**
 * Persists the current in-memory store to localStorage safely.
 */
function persist() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryStore));
    }
  } catch {
    // Fall back to memory silently in restricted environments
  }
}

/**
 * Returns a defensive copy of all walks.
 * @returns {Array<object>}
 */
export function getAllWalks() {
  return inMemoryStore.map((walk) => ({ ...walk }));
}

/**
 * Adds a new walk record with strict schema enforcement and sanitization.
 * @param {object} payload 
 * @returns {object} The created structured walk record
 */
export function addWalk(payload) {
  const sanitized = sanitizeWalkPayload(payload);
  const now = new Date().toISOString();

  const newRecord = {
    id: sanitized.id || `walk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    dogName: sanitized.dogName,
    breed: sanitized.breed,
    ownerPhone: sanitized.ownerPhone,
    walker: sanitized.walker,
    date: sanitized.date,
    timeSlot: sanitized.timeSlot,
    durationMinutes: Number(sanitized.durationMinutes) || 30,
    notes: sanitized.notes || '',
    status: sanitized.status || 'scheduled',
    createdAt: now,
    updatedAt: now,
  };

  inMemoryStore.unshift(newRecord);
  persist();
  return { ...newRecord };
}

/**
 * Updates the status of an existing walk record.
 * @param {string} id 
 * @param {'scheduled' | 'in-progress' | 'completed' | 'cancelled'} newStatus 
 * @returns {object | null}
 */
export function updateWalkStatus(id, newStatus) {
  const index = inMemoryStore.findIndex((w) => w.id === id);
  if (index === -1) return null;

  inMemoryStore[index].status = newStatus;
  inMemoryStore[index].updatedAt = new Date().toISOString();
  persist();

  return { ...inMemoryStore[index] };
}

/**
 * Deletes a walk record by ID.
 * @param {string} id 
 * @returns {boolean}
 */
export function deleteWalk(id) {
  const initialLength = inMemoryStore.length;
  inMemoryStore = inMemoryStore.filter((w) => w.id !== id);
  const removed = inMemoryStore.length < initialLength;
  if (removed) persist();
  return removed;
}

/**
 * Filters walks by status, walker, or date.
 * @param {{ status?: string, walker?: string, date?: string }} criteria 
 * @returns {Array<object>}
 */
export function filterWalks(criteria = {}) {
  return inMemoryStore.filter((walk) => {
    if (criteria.status && criteria.status !== 'all' && walk.status !== criteria.status) {
      return false;
    }
    if (criteria.walker && criteria.walker !== 'all' && walk.walker !== criteria.walker) {
      return false;
    }
    if (criteria.date && walk.date !== criteria.date) {
      return false;
    }
    return true;
  });
}

/**
 * Searches walks matching a text query across multiple fields.
 * @param {string} query 
 * @returns {Array<object>}
 */
export function searchWalks(query = '') {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return getAllWalks();
  }

  return inMemoryStore.filter((walk) => {
    const dog = (walk.dogName || '').toLowerCase();
    const breed = (walk.breed || '').toLowerCase();
    const walker = (walk.walker || '').toLowerCase();
    const phone = (walk.ownerPhone || '').toLowerCase();
    const notes = (walk.notes || '').toLowerCase();

    return (
      dog.includes(cleanQuery) ||
      breed.includes(cleanQuery) ||
      walker.includes(cleanQuery) ||
      phone.includes(cleanQuery) ||
      notes.includes(cleanQuery)
    );
  });
}

/**
 * Exports data in structured JSON or CSV format for manager audit and reporting.
 * @param {'json' | 'csv'} format 
 * @returns {string}
 */
export function exportStructuredData(format = 'json') {
  if (format === 'csv') {
    const headers = ['ID', 'Dog Name', 'Breed', 'Owner Phone', 'Walker', 'Date', 'Time', 'Duration (Min)', 'Status', 'Notes'];
    const rows = inMemoryStore.map((w) => [
      `"${w.id}"`,
      `"${w.dogName}"`,
      `"${w.breed}"`,
      `"${w.ownerPhone}"`,
      `"${w.walker}"`,
      `"${w.date}"`,
      `"${w.timeSlot}"`,
      w.durationMinutes,
      `"${w.status}"`,
      `"${(w.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  return JSON.stringify(
    {
      schemaVersion: '1.0.0',
      system: 'Dog Walking Service Digital Roster',
      exportedAt: new Date().toISOString(),
      totalCount: inMemoryStore.length,
      records: inMemoryStore,
    },
    null,
    2
  );
}
