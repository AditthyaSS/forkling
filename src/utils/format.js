/**
 * Shared formatting utilities for consistent UI formatting across the application.
 * These functions are pure, defensive, and handle edge cases gracefully.
 */

const THOUSAND = 1000;
const MILLION = 1000000;
const BILLION = 1000000000;

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Formats a number into a compact, human-readable string.
 * 
 * @param {number|null|undefined} n - The number to format
 * @returns {string} Formatted number (e.g., "999", "1.2K", "15K", "1.2M", "5B")
 * 
 * Examples:
 * - 999 -> "999"
 * - 1000 -> "1K"
 * - 1250 -> "1.3K"
 * - 12000 -> "12K"
 * - 15400 -> "15.4K"
 * - 1200000 -> "1.2M"
 * - 5000000000 -> "5B"
 */
export function formatNumber(n) {
  // Handle null/undefined/invalid input
  if (n === null || n === undefined || isNaN(n)) return '0';
  
  // Handle negative numbers
  const num = Number(n);
  if (num < 0) return '-' + formatNumber(-num);
  
  // Return numbers below 1000 unchanged
  if (num < THOUSAND) return Math.floor(num).toString();
  
  // Format with K, M, B suffixes
  if (num >= BILLION) {
    const value = num / BILLION;
    return value % 1 === 0 ? `${Math.floor(value)}B` : `${value.toFixed(1)}B`;
  }
  
  if (num >= MILLION) {
    const value = num / MILLION;
    return value % 1 === 0 ? `${Math.floor(value)}M` : `${value.toFixed(1)}M`;
  }
  
  if (num >= THOUSAND) {
    const value = num / THOUSAND;
    return value % 1 === 0 ? `${Math.floor(value)}K` : `${value.toFixed(1)}K`;
  }
  
  return Math.floor(num).toString();
}

/**
 * Formats a date/time into a relative "time ago" string.
 * 
 * @param {Date|string|number|null|undefined} date - The date to format (Date object, timestamp, or ISO string)
 * @returns {string} Relative time string (e.g., "just now", "4m ago", "2h ago", "yesterday", "4d ago", "2w ago", "8mo ago", "2y ago")
 * 
 * Examples:
 * - 20 seconds ago -> "just now"
 * - 4 minutes ago -> "4m ago"
 * - 2 hours ago -> "2h ago"
 * - 1 day ago -> "yesterday"
 * - 4 days ago -> "4d ago"
 * - 2 weeks ago -> "2w ago"
 * - 8 months ago -> "8mo ago"
 * - 2 years ago -> "2y ago"
 */
export function timeAgo(date) {
  // Handle null/undefined/invalid input
  if (!date) return '';
  
  let timestamp;
  try {
    // Parse different input types
    if (date instanceof Date) {
      timestamp = date.getTime();
    } else if (typeof date === 'number') {
      timestamp = date;
    } else if (typeof date === 'string') {
      timestamp = new Date(date).getTime();
    } else {
      return '';
    }
    
    // Check if parsing failed
    if (isNaN(timestamp)) return '';
  } catch {
    return '';
  }
  
  const now = Date.now();
  const diff = now - timestamp;
  
  // Handle future dates
  if (diff < 0) return '';
  
  // Less than a minute
  if (diff < MINUTE) return 'just now';
  
  // Minutes
  if (diff < HOUR) {
    const minutes = Math.floor(diff / MINUTE);
    return `${minutes}m ago`;
  }
  
  // Hours
  if (diff < DAY) {
    const hours = Math.floor(diff / HOUR);
    return `${hours}h ago`;
  }
  
  // Days
  if (diff < DAY * 2) return 'yesterday';
  
  if (diff < WEEK) {
    const days = Math.floor(diff / DAY);
    return `${days}d ago`;
  }
  
  // Weeks
  if (diff < MONTH) {
    const weeks = Math.floor(diff / WEEK);
    return `${weeks}w ago`;
  }
  
  // Months
  if (diff < YEAR) {
    const months = Math.floor(diff / MONTH);
    return `${months}mo ago`;
  }
  
  // Years
  const years = Math.floor(diff / YEAR);
  return `${years}y ago`;
}
