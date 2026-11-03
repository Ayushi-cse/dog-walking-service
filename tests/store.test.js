import { describe, it, expect, beforeEach } from 'vitest';
import {
  initStore,
  getAllWalks,
  addWalk,
  updateWalkStatus,
  deleteWalk,
  filterWalks,
  searchWalks,
  exportStructuredData,
} from '../js/store.js';

describe('Data Architecture: Consistent Structured Schema & Operations', () => {
  beforeEach(() => {
    localStorage.clear();
    initStore([]);
  });

  it('adds a walk and enforces strict, consistent data schema', () => {
    const rawWalk = {
      dogName: 'Luna',
      breed: 'Siberian Husky',
      ownerPhone: '(555) 987-6543',
      walker: 'Sarah Jenkins',
      date: '2026-11-04',
      timeSlot: '11:00',
      durationMinutes: 60,
      notes: 'High energy, needs hydration break',
    };

    const newRecord = addWalk(rawWalk);

    expect(newRecord.id).toBeDefined();
    expect(newRecord.dogName).toBe('Luna');
    expect(newRecord.status).toBe('scheduled');
    expect(newRecord.createdAt).toBeDefined();
    expect(newRecord.updatedAt).toBeDefined();

    const all = getAllWalks();
    expect(all.length).toBe(1);
    expect(all[0].id).toBe(newRecord.id);
  });

  it('updates walk status predictably across lifecycle', () => {
    const record = addWalk({
      dogName: 'Max',
      breed: 'German Shepherd',
      ownerPhone: '(555) 111-2233',
      walker: 'David Ross',
      date: '2026-11-04',
      timeSlot: '15:00',
      durationMinutes: 30,
    });

    const updated = updateWalkStatus(record.id, 'in-progress');
    expect(updated.status).toBe('in-progress');

    const completed = updateWalkStatus(record.id, 'completed');
    expect(completed.status).toBe('completed');
  });

  it('filters walks accurately by status and walker', () => {
    addWalk({
      dogName: 'Daisy',
      breed: 'Poodle',
      ownerPhone: '(555) 222-3344',
      walker: 'Sarah Jenkins',
      date: '2026-11-04',
      timeSlot: '10:00',
      durationMinutes: 30,
    });

    const walk2 = addWalk({
      dogName: 'Bailey',
      breed: 'Beagle',
      ownerPhone: '(555) 333-4455',
      walker: 'David Ross',
      date: '2026-11-04',
      timeSlot: '12:00',
      durationMinutes: 45,
    });
    updateWalkStatus(walk2.id, 'completed');

    expect(filterWalks({ status: 'completed' }).length).toBe(1);
    expect(filterWalks({ status: 'scheduled' }).length).toBe(1);
    expect(filterWalks({ walker: 'Sarah Jenkins' }).length).toBe(1);
    expect(filterWalks({ walker: 'NonExistent' }).length).toBe(0);
  });

  it('searches walks case-insensitively across dog name, breed, walker, or phone', () => {
    addWalk({
      dogName: 'Barnaby',
      breed: 'Basset Hound',
      ownerPhone: '(555) 888-9999',
      walker: 'Alex Chen',
      date: '2026-11-04',
      timeSlot: '13:00',
      durationMinutes: 30,
    });

    expect(searchWalks('barna').length).toBe(1);
    expect(searchWalks('hound').length).toBe(1);
    expect(searchWalks('alex').length).toBe(1);
    expect(searchWalks('888').length).toBe(1);
    expect(searchWalks('unknown-term').length).toBe(0);
  });

  it('deletes a walk by ID correctly', () => {
    const walk = addWalk({
      dogName: 'Oliver',
      breed: 'French Bulldog',
      ownerPhone: '(555) 777-1122',
      walker: 'Alex Chen',
      date: '2026-11-04',
      timeSlot: '14:00',
      durationMinutes: 30,
    });

    expect(getAllWalks().length).toBe(1);
    const deleted = deleteWalk(walk.id);
    expect(deleted).toBe(true);
    expect(getAllWalks().length).toBe(0);
  });

  it('exports structured JSON matching the manager requirements', () => {
    addWalk({
      dogName: 'Zeus',
      breed: 'Rottweiler',
      ownerPhone: '(555) 444-5566',
      walker: 'Sarah Jenkins',
      date: '2026-11-04',
      timeSlot: '16:00',
      durationMinutes: 60,
    });

    const exported = exportStructuredData('json');
    const parsed = JSON.parse(exported);

    expect(parsed.totalCount).toBe(1);
    expect(Array.isArray(parsed.records)).toBe(true);
    expect(parsed.records[0].dogName).toBe('Zeus');
    expect(parsed.exportedAt).toBeDefined();
  });
});
