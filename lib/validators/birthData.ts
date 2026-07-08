/**
 * lib/validators/birthData.ts
 *
 * Client-side validation for birth form input.
 * Mirrors the backend Pydantic validators so errors surface before an API call.
 * Returns structured error objects — never throws, never alerts.
 */

import type { BirthDetails } from '../types/chart';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationError {
  field: keyof BirthDetails | 'general';
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ---------------------------------------------------------------------------
// Individual field validators
// ---------------------------------------------------------------------------

/** Name must be non-empty and contain only reasonable characters */
export function validateName(name: string): ValidationError | null {
  const trimmed = name.trim();
  if (!trimmed) return { field: 'name', message: 'Please enter your full name.' };
  if (trimmed.length < 2) return { field: 'name', message: 'Name must be at least 2 characters.' };
  if (trimmed.length > 100) return { field: 'name', message: 'Name is too long.' };
  // Basic injection guard — reject suspicious patterns
  if (/<|>|{|}|\[|]|script/i.test(trimmed)) {
    return { field: 'name', message: 'Name contains invalid characters.' };
  }
  return null;
}

/** Date must be a real calendar date in YYYY-MM-DD format */
export function validateDate(date: string): ValidationError | null {
  if (!date) return { field: 'date', message: 'Please select your date of birth.' };

  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(date)) {
    return { field: 'date', message: 'Date must be in YYYY-MM-DD format.' };
  }

  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return { field: 'date', message: 'Please enter a valid calendar date.' };
  }

  const now = new Date();
  if (parsed > now) {
    return { field: 'date', message: 'Date of birth cannot be in the future.' };
  }

  const minDate = new Date('1900-01-01');
  if (parsed < minDate) {
    return { field: 'date', message: 'Please enter a date after 1900.' };
  }

  return null;
}

/** Time must be HH:mm in 24-hour format */
export function validateTime(time: string, knownTime: boolean): ValidationError | null {
  if (!knownTime) return null; // Time unknown is explicitly allowed

  if (!time) return { field: 'time', message: 'Please enter your time of birth, or mark it as unknown.' };

  const pattern = /^\d{2}:\d{2}$/;
  if (!pattern.test(time)) {
    return { field: 'time', message: 'Time must be in HH:mm format.' };
  }

  const [hours, minutes] = time.split(':').map(Number);
  if (hours < 0 || hours > 23) {
    return { field: 'time', message: 'Hours must be between 00 and 23.' };
  }
  if (minutes < 0 || minutes > 59) {
    return { field: 'time', message: 'Minutes must be between 00 and 59.' };
  }

  return null;
}

/** Place must be non-empty and reasonable */
export function validatePlace(place: string): ValidationError | null {
  const trimmed = place.trim();
  if (!trimmed) return { field: 'place', message: 'Please enter your place of birth.' };
  if (trimmed.length < 2) return { field: 'place', message: 'Place name is too short.' };
  if (trimmed.length > 200) return { field: 'place', message: 'Place name is too long.' };
  if (/<|>|{|}|\[|]|script/i.test(trimmed)) {
    return { field: 'place', message: 'Place contains invalid characters.' };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Full form validator
// ---------------------------------------------------------------------------

export function validateBirthDetails(details: Partial<BirthDetails>): ValidationResult {
  const errors: ValidationError[] = [];

  const nameError = validateName(details.name ?? '');
  if (nameError) errors.push(nameError);

  const dateError = validateDate(details.date ?? '');
  if (dateError) errors.push(dateError);

  const timeError = validateTime(details.time ?? '', details.knownTime ?? true);
  if (timeError) errors.push(timeError);

  const placeError = validatePlace(details.place ?? '');
  if (placeError) errors.push(placeError);

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Sanitize a string before sending to API
// ---------------------------------------------------------------------------

export function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[<>{}[\]]/g, '') // strip potential injection chars
    .slice(0, 500);            // hard cap
}
