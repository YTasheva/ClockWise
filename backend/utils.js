// Get today's date with 4 AM boundary (in local timezone)
export function getTodayDate() {
  const now = new Date();
  const hour = now.getHours();
  
  // If before 4 AM, use yesterday's date
  if (hour < 4) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  return now.toISOString().split('T')[0];
}

// Get current time with 4 AM boundary offset
export function getCurrentTimeWithBoundary() {
  const now = new Date();
  const hour = now.getHours();
  
  // If before 4 AM, use yesterday's date
  if (hour < 4) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(4, 0, 0, 0);
    return yesterday;
  }
  
  return now;
}

// Calculate duration in minutes (rounded down, minimum 1 minute)
export function calculateDurationMinutes(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diffMs = end - start;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  return diffMinutes;
}

// Check if duration is valid (must be at least 1 minute)
export function isValidDuration(startTime, endTime) {
  const durationMinutes = calculateDurationMinutes(startTime, endTime);
  return durationMinutes >= 1;
}

// Format minutes as HH:MM
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}
