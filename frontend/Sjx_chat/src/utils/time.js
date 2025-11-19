/**
 * Lightweight time utilities shared across the screen share feature.
 * Centralizing these helpers avoids duplicating formatting logic in components.
 */

/**
 * Normalize arbitrary input into a valid Date instance.
 * @param {Date|string|number|null|undefined} value
 * @returns {Date|null}
 */
const ensureDate = (value) => {
  if (!value && value !== 0) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const pad = (number) => number.toString().padStart(2, "0");

/**
 * Convert duration in seconds into multiple display styles.
 * @param {number} seconds
 * @param {{ compact?: boolean, showMilliseconds?: boolean }} [options]
 * @returns {string}
 */
export const formatDuration = (
  seconds,
  { compact = false, showMilliseconds = false } = {},
) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) return "0s";

  const ms = seconds < 0 ? 0 : seconds * 1000;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const milliseconds = Math.floor(ms % 1000);

  if (compact) {
    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(secs)}`;
    }
    return `${minutes}:${pad(secs)}`;
  }

  const parts = [];
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  if (showMilliseconds && milliseconds) {
    parts.push(`${milliseconds}ms`);
  }

  return parts.join(" ");
};

/**
 * Convert seconds into an object with hour/min/sec parts.
 * @param {number} seconds
 * @returns {{ hours: number, minutes: number, seconds: number }}
 */
export const secondsToHms = (seconds) => {
  if (typeof seconds !== "number" || Number.isNaN(seconds)) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.max(0, Math.floor(seconds));
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

/**
 * Format a timestamp using Intl.DateTimeFormat with sensible defaults.
 * @param {Date|string|number} value
 * @param {Intl.DateTimeFormatOptions & { locale?: string }} [options]
 * @returns {string}
 */
export const formatTimestamp = (
  value,
  { locale = "en-US", ...options } = {},
) => {
  const date = ensureDate(value);
  if (!date) return "";

  const formatter = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    ...options,
  });

  return formatter.format(date);
};

/**
 * Produce a relative time string (e.g., "2m ago", "in 5h").
 * @param {Date|string|number} value
 * @param {{ base?: Date|string|number, locale?: string }} [options]
 * @returns {string}
 */
export const formatRelativeTime = (
  value,
  { base = Date.now(), locale = "en-US" } = {},
) => {
  const target = ensureDate(value);
  const baseDate = ensureDate(base);
  if (!target || !baseDate) return "";

  const diffMs = target.getTime() - baseDate.getTime();
  const divisions = [
    { amount: 60, unit: "seconds" },
    { amount: 60, unit: "minutes" },
    { amount: 24, unit: "hours" },
    { amount: 7, unit: "days" },
    { amount: 4.34524, unit: "weeks" },
    { amount: 12, unit: "months" },
    { amount: Number.POSITIVE_INFINITY, unit: "years" },
  ];

  let duration = diffMs / 1000;
  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
      return rtf.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return "";
};

export default {
  formatDuration,
  secondsToHms,
  formatTimestamp,
  formatRelativeTime,
};
