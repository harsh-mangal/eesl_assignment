import { ApiError } from './api-error.js';

const DAY_MS = 24 * 60 * 60 * 1000;

export function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function parseDateOnly(value: string, fieldName: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) throw new ApiError(422, `${fieldName} is invalid.`);
  return date;
}

export function nightsBetween(checkIn: Date, checkOut: Date) {
  return Math.round((checkOut.getTime() - checkIn.getTime()) / DAY_MS);
}

export function dateOnlyKey(value: Date) {
  return value.toISOString().slice(0, 10);
}
