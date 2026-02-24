/**
 * batchUtils.js
 * Central utility for all batch scheduling logic.
 * Now supports dynamic configuration from database settings.
 *
 * Default Batch Schedule:
 * Batch 1: Week 1 → Mon/Tue/Wed | Week 2 → Thu/Fri
 * Batch 2: Week 1 → Thu/Fri     | Week 2 → Mon/Tue/Wed
 */

const db = require('../config/db');

// Cache for settings to avoid repeated DB calls
let settingsCache = null;
let cacheTimestamp = null;
const CACHE_TTL = 60000; // 1 minute cache

// Get all settings from database
async function getSettings() {
  const now = Date.now();
  
  // Return cached settings if still valid
  if (settingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_TTL) {
    return settingsCache;
  }
  
  try {
    const result = await db.query('SELECT key, value FROM system_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    settingsCache = settings;
    cacheTimestamp = now;
    
    return settings;
  } catch (err) {
    console.error('Error fetching settings:', err);
    // Return default settings on error
    return getDefaultSettings();
  }
}

// Get default settings
function getDefaultSettings() {
  return {
    designated_seat_count: '40',
    floater_seat_count: '10',
    zone_a_name: 'Zone A — Designated Seats',
    zone_b_name: 'Zone B — Floater Seats',
    floater_booking_hour: '15',
    batch1_week1_days: '1,2,3',
    batch1_week2_days: '4,5',
    batch2_week1_days: '4,5',
    batch2_week2_days: '1,2,3',
    company_name: 'WorkSpace',
    app_subtitle: 'Seat Booking'
  };
}

// Clear settings cache (call after updating settings)
function clearSettingsCache() {
  settingsCache = null;
  cacheTimestamp = null;
}

// Parse comma-separated days string to array
function parseDaysString(daysStr) {
  if (!daysStr) return [];
  return daysStr.split(',').map(d => parseInt(d.trim(), 10)).filter(d => !isNaN(d));
}

// Returns array of day-of-week numbers (1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri)
// Now uses dynamic settings from database
async function getBatchDays(batch, weekNumber) {
  const settings = await getSettings();
  
  if (batch === 1) {
    return weekNumber === 1 
      ? parseDaysString(settings.batch1_week1_days)
      : parseDaysString(settings.batch1_week2_days);
  } else if (batch === 2) {
    return weekNumber === 1 
      ? parseDaysString(settings.batch2_week1_days)
      : parseDaysString(settings.batch2_week2_days);
  }
  
  // Default fallback
  return weekNumber === 1 ? [1, 2, 3] : [4, 5];
}

// Synchronous version - uses default values (for use before DB is ready)
function getBatchDaysSync(batch, weekNumber) {
  const defaults = getDefaultSettings();
  
  if (batch === 1) {
    return weekNumber === 1 
      ? parseDaysString(defaults.batch1_week1_days)
      : parseDaysString(defaults.batch1_week2_days);
  } else if (batch === 2) {
    return weekNumber === 1 
      ? parseDaysString(defaults.batch2_week1_days)
      : parseDaysString(defaults.batch2_week2_days);
  }
  
  return weekNumber === 1 ? [1, 2, 3] : [4, 5];
}

// Returns which week number (1 or 2) a date falls in
// Week 1 = odd ISO weeks, Week 2 = even ISO weeks (alternating)
function getWeekNumber(date) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const weekOfYear = Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
  return weekOfYear % 2 === 1 ? 1 : 2;
}

// Is a given date a designated office day for this user's batch?
async function isDesignatedDay(batch, date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon...6=Sat
  const weekNumber = getWeekNumber(date);
  const batchDays = await getBatchDays(batch, weekNumber);
  return batchDays.includes(dayOfWeek);
}

// Synchronous version
function isDesignatedDaySync(batch, date) {
  const d = new Date(date);
  const dayOfWeek = d.getDay();
  const weekNumber = getWeekNumber(date);
  const batchDays = getBatchDaysSync(batch, weekNumber);
  return batchDays.includes(dayOfWeek);
}

// Is a given date a weekend?
function isWeekend(date) {
  const day = new Date(date).getDay();
  return day === 0 || day === 6;
}

// Get next business day (skip weekends)
function getNextBusinessDay() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  // skip weekends
  while (isWeekend(tomorrow)) {
    tomorrow.setDate(tomorrow.getDate() + 1);
  }
  return tomorrow;
}

// Get floater booking hour from settings
async function getFloaterBookingHour() {
  const settings = await getSettings();
  return parseInt(settings.floater_booking_hour, 10) || 15;
}

// Synchronous version
function getFloaterBookingHourSync() {
  return 15; // Default
}

// Is the current time past the configured floater booking time?
async function isAfterFloaterTime() {
  const hour = await getFloaterBookingHour();
  return new Date().getHours() >= hour;
}

// Synchronous version
function isAfterFloaterTimeSync() {
  return new Date().getHours() >= 15;
}

// Get all office dates for a batch in a given week (by week start date)
async function getWeekDatesForBatch(batch, weekStartDate) {
  const weekNum = getWeekNumber(weekStartDate);
  const batchDayNums = await getBatchDays(batch, weekNum);
  const start = new Date(weekStartDate);
  // Ensure start is Monday
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(start.setDate(diff));

  return batchDayNums.map((dayNum) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + (dayNum - 1));
    return d.toISOString().split('T')[0];
  });
}

// Get seat counts
async function getSeatCounts() {
  const settings = await getSettings();
  return {
    designated: parseInt(settings.designated_seat_count, 10) || 40,
    floater: parseInt(settings.floater_seat_count, 10) || 10
  };
}

// Get zone names
async function getZoneNames() {
  const settings = await getSettings();
  return {
    zoneA: settings.zone_a_name || 'Zone A — Designated Seats',
    zoneB: settings.zone_b_name || 'Zone B — Floater Seats'
  };
}

// Get company info
async function getCompanyInfo() {
  const settings = await getSettings();
  return {
    name: settings.company_name || 'WorkSpace',
    subtitle: settings.app_subtitle || 'Seat Booking'
  };
}

module.exports = {
  getSettings,
  getDefaultSettings,
  clearSettingsCache,
  getBatchDays,
  getBatchDaysSync,
  getWeekNumber,
  isDesignatedDay,
  isDesignatedDaySync,
  isWeekend,
  getNextBusinessDay,
  getFloaterBookingHour,
  getFloaterBookingHourSync,
  isAfterFloaterTime,
  isAfterFloaterTimeSync,
  getWeekDatesForBatch,
  getSeatCounts,
  getZoneNames,
  getCompanyInfo
};
