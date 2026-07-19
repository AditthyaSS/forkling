/**
 * Date utilities for Forkling.
 *
 * All calculations are performed in UTC to avoid timezone-related
 * off-by-one errors where a local midnight could land on the previous
 * calendar day depending on the user's offset.
 */

/**
 * Returns a date string in ISO `YYYY-MM-DD` format representing
 * today (UTC) minus the given number of calendar months.
 *
 * Handles all edge cases correctly:
 * - Month and year rollover  (e.g. January − 1 month → December of the prior year)
 * - Leap years              (e.g. Feb 29 − 12 months → Feb 28 on a non-leap year)
 * - Varying month lengths   (e.g. Mar 31 − 1 month → Feb 28/29, not Mar 3)
 *
 * @param {number} monthsAgo - Number of calendar months to subtract (must be >= 0).
 * @returns {string} Date string in `YYYY-MM-DD` format.
 */
export function getDateMonthsAgo(monthsAgo) {
  const now = new Date();

  // Work in UTC throughout to avoid local-timezone day shifts.
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth(); // 0-indexed
  const day = now.getUTCDate();

  // Subtract months. The Date constructor normalises overflow automatically,
  // but we need to handle day-clamping ourselves (e.g. Mar 31 − 1 month
  // must give Feb 28/29, not the auto-normalised Mar 2/3).
  const targetMonth = month - monthsAgo;

  // Determine the last valid day of the target month in UTC.
  // Date(year, targetMonth + 1, 0) gives the last day of targetMonth
  // because day 0 of the *next* month is the last day of this month.
  // The Date constructor normalises negative months automatically.
  const lastDayOfTargetMonth = new Date(
    Date.UTC(year, targetMonth + 1, 0)
  ).getUTCDate();

  // Clamp the day to the last valid day of the target month.
  const clampedDay = Math.min(day, lastDayOfTargetMonth);

  const result = new Date(Date.UTC(year, targetMonth, clampedDay));

  // Return ISO date portion only (YYYY-MM-DD), no time component.
  return result.toISOString().split('T')[0];
}
