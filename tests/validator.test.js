import { describe, it, expect, beforeEach } from 'vitest';
import { validateWalkInput, applyValidationFeedback, clearValidationFeedback } from '../js/validator.js';

describe('Unhappy Path: Form Validation & Red Highlight Feedback', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form id="walk-form">
        <div class="form-group">
          <label for="dogName">Dog Name</label>
          <input type="text" id="dogName" name="dogName" />
          <span class="field-error" id="dogName-error"></span>
        </div>
        <div class="form-group">
          <label for="breed">Breed</label>
          <input type="text" id="breed" name="breed" />
          <span class="field-error" id="breed-error"></span>
        </div>
        <div class="form-group">
          <label for="ownerPhone">Owner Phone</label>
          <input type="tel" id="ownerPhone" name="ownerPhone" />
          <span class="field-error" id="ownerPhone-error"></span>
        </div>
        <div class="form-group">
          <label for="walker">Assigned Walker</label>
          <select id="walker" name="walker">
            <option value="">Select walker</option>
            <option value="Alex Chen">Alex Chen</option>
          </select>
          <span class="field-error" id="walker-error"></span>
        </div>
        <div class="form-group">
          <label for="date">Date</label>
          <input type="date" id="date" name="date" />
          <span class="field-error" id="date-error"></span>
        </div>
        <div class="form-group">
          <label for="timeSlot">Time</label>
          <input type="time" id="timeSlot" name="timeSlot" />
          <span class="field-error" id="timeSlot-error"></span>
        </div>
        <div class="form-group">
          <label for="durationMinutes">Duration</label>
          <select id="durationMinutes" name="durationMinutes">
            <option value="30">30 min</option>
          </select>
          <span class="field-error" id="durationMinutes-error"></span>
        </div>
      </form>
    `;
  });

  it('fails validation when mandatory fields are missing', () => {
    const emptyPayload = {
      dogName: '',
      breed: '',
      ownerPhone: '',
      walker: '',
      date: '',
      timeSlot: '',
      durationMinutes: '',
    };

    const result = validateWalkInput(emptyPayload);
    expect(result.isValid).toBe(false);
    expect(result.errors.dogName).toBe('Dog name is required.');
    expect(result.errors.breed).toBe('Breed is required.');
    expect(result.errors.ownerPhone).toBe('Owner phone number is required.');
    expect(result.errors.walker).toBe('Please assign a staff walker.');
    expect(result.errors.date).toBe('Walk date is required.');
    expect(result.errors.timeSlot).toBe('Scheduled time slot is required.');
  });

  it('detects malformed phone numbers with less than 10 digits', () => {
    const invalidPhonePayload = {
      dogName: 'Cooper',
      breed: 'Beagle',
      ownerPhone: '123-abc',
      walker: 'Alex Chen',
      date: '2026-11-05',
      timeSlot: '10:00',
      durationMinutes: 30,
    };

    const result = validateWalkInput(invalidPhonePayload);
    expect(result.isValid).toBe(false);
    expect(result.errors.ownerPhone).toContain('valid 10-digit phone number');
  });

  it('applies red highlight class and aria-invalid="true" to offending fields in DOM', () => {
    const form = document.getElementById('walk-form');
    const mockErrors = {
      dogName: 'Dog name is required.',
      ownerPhone: 'Please provide a valid phone number.',
    };

    applyValidationFeedback(form, mockErrors);

    const dogNameInput = document.getElementById('dogName');
    const ownerPhoneInput = document.getElementById('ownerPhone');
    const dogNameError = document.getElementById('dogName-error');
    const ownerPhoneError = document.getElementById('ownerPhone-error');

    expect(dogNameInput.classList.contains('input-invalid')).toBe(true);
    expect(dogNameInput.getAttribute('aria-invalid')).toBe('true');
    expect(dogNameError.textContent).toBe('Dog name is required.');

    expect(ownerPhoneInput.classList.contains('input-invalid')).toBe(true);
    expect(ownerPhoneInput.getAttribute('aria-invalid')).toBe('true');
    expect(ownerPhoneError.textContent).toBe('Please provide a valid phone number.');
  });

  it('clears red highlight and error messages on successful re-validation or reset', () => {
    const form = document.getElementById('walk-form');
    const dogNameInput = document.getElementById('dogName');
    const dogNameError = document.getElementById('dogName-error');

    dogNameInput.classList.add('input-invalid');
    dogNameInput.setAttribute('aria-invalid', 'true');
    dogNameError.textContent = 'Error';

    clearValidationFeedback(form);

    expect(dogNameInput.classList.contains('input-invalid')).toBe(false);
    expect(dogNameInput.getAttribute('aria-invalid')).toBe('false');
    expect(dogNameError.textContent).toBe('');
  });

  it('passes validation when all fields are properly formatted', () => {
    const validPayload = {
      dogName: 'Milo',
      breed: 'Golden Doodle',
      ownerPhone: '(555) 234-5678',
      walker: 'Alex Chen',
      date: '2026-11-04',
      timeSlot: '14:30',
      durationMinutes: 45,
    };

    const result = validateWalkInput(validPayload);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors).length).toBe(0);
  });
});
