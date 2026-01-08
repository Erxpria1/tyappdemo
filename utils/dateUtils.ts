/**
 * Date utility functions to avoid code duplication
 */

/**
 * Get today's date as YYYY-MM-DD string
 * @returns Today's date in ISO format (YYYY-MM-DD)
 */
export const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format a Date object as YYYY-MM-DD string
 * @param date - Date to format
 * @returns Date in ISO format (YYYY-MM-DD)
 */
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * Format a date string or Date object as YYYY-MM-DD
 * @param date - Date string or Date object
 * @returns Date in ISO format (YYYY-MM-DD)
 */
export const formatDateInput = (date: string | Date): string => {
  if (typeof date === 'string') {
    return date.split('T')[0];
  }
  return date.toISOString().split('T')[0];
};

/**
 * Validate if a string is a valid date format (YYYY-MM-DD)
 * @param dateStr - Date string to validate
 * @returns true if valid date format
 */
export const isValidDateString = (dateStr: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
};

/**
 * Check if a date is in the past
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns true if date is before today
 */
export const isPastDate = (dateStr: string): boolean => {
  const today = getTodayString();
  return dateStr < today;
};

/**
 * Check if a date is today
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns true if date is today
 */
export const isToday = (dateStr: string): boolean => {
  return dateStr === getTodayString();
};

/**
 * Format date for display (e.g., "15 Ocak 2025")
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date string
 */
export const formatDisplayDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Get the start of a date range (today + offset days)
 * @param daysOffset - Number of days to add (default: 0)
 * @returns Date string in YYYY-MM-DD format
 */
export const getDateWithOffset = (daysOffset: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toISOString().split('T')[0];
};
