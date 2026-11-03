/**
 * Dog Walking Service - Validation Module
 * Form verification & accessible field error highlighting
 * 
 * Enforces corporate schema integrity and visual feedback on malformed inputs.
 */

// Phone regex allowing standard formats: (555) 123-4567, 555-123-4567, 5551234567, +1 555-123-4567
const PHONE_REGEX = /^(?:\+?1[-.\s]*)?(?:\(?\d{3}\)?[-.\s]*)?\d{3}[-.\s]*\d{4}$/;

/**
 * Validates a dog walk schedule submission.
 * @param {Record<string, unknown>} data 
 * @returns {{ isValid: boolean, errors: Record<string, string> }}
 */
export function validateWalkInput(data) {
  const errors = {};

  // Dog Name check
  const dogName = typeof data.dogName === 'string' ? data.dogName.trim() : '';
  if (!dogName) {
    errors.dogName = 'Dog name is required.';
  } else if (dogName.length < 2) {
    errors.dogName = 'Dog name must be at least 2 characters.';
  }

  // Breed check
  const breed = typeof data.breed === 'string' ? data.breed.trim() : '';
  if (!breed) {
    errors.breed = 'Breed is required.';
  }

  // Owner Phone check
  const ownerPhone = typeof data.ownerPhone === 'string' ? data.ownerPhone.trim() : '';
  if (!ownerPhone) {
    errors.ownerPhone = 'Owner phone number is required.';
  } else {
    // Strip non-digits to verify at least 10 digits
    const digitsOnly = ownerPhone.replace(/\D/g, '');
    if (digitsOnly.length < 10 || !PHONE_REGEX.test(ownerPhone)) {
      errors.ownerPhone = 'Please provide a valid 10-digit phone number (e.g. 555-019-2834).';
    }
  }

  // Staff Walker check
  const walker = typeof data.walker === 'string' ? data.walker.trim() : '';
  if (!walker) {
    errors.walker = 'Please assign a staff walker.';
  }

  // Scheduled Date check
  const date = typeof data.date === 'string' ? data.date.trim() : '';
  if (!date) {
    errors.date = 'Walk date is required.';
  }

  // Scheduled Time Slot check
  const timeSlot = typeof data.timeSlot === 'string' ? data.timeSlot.trim() : '';
  if (!timeSlot) {
    errors.timeSlot = 'Scheduled time slot is required.';
  }

  // Duration check
  const duration = Number(data.durationMinutes);
  if (!duration || isNaN(duration) || duration <= 0) {
    errors.durationMinutes = 'Please select a valid walk duration.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Highlights offending fields in red and populates accessible error text.
 * @param {HTMLFormElement} formElement 
 * @param {Record<string, string>} errors 
 */
export function applyValidationFeedback(formElement, errors) {
  if (!formElement) return;

  // First clear previous validation states
  clearValidationFeedback(formElement);

  for (const [fieldKey, errorMessage] of Object.entries(errors)) {
    const input = formElement.querySelector(`[name="${fieldKey}"], #${fieldKey}`);
    const errorContainer = formElement.querySelector(`#${fieldKey}-error, [data-error-for="${fieldKey}"]`);

    if (input) {
      input.classList.add('input-invalid');
      input.setAttribute('aria-invalid', 'true');
    }

    if (errorContainer) {
      errorContainer.textContent = errorMessage;
      errorContainer.classList.add('visible');
    }
  }
}

/**
 * Clears error styles and accessible attributes from the form.
 * @param {HTMLFormElement} formElement 
 */
export function clearValidationFeedback(formElement) {
  if (!formElement) return;

  const inputs = formElement.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    input.classList.remove('input-invalid');
    input.setAttribute('aria-invalid', 'false');
  });

  const errorContainers = formElement.querySelectorAll('.field-error');
  errorContainers.forEach((container) => {
    container.textContent = '';
    container.classList.remove('visible');
  });
}
