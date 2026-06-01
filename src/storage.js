/**
 * Storage Module
 * Handles loading, saving, and resetting focus session history in localStorage.
 */

const STORAGE_KEY = 'pomodoro_daily_history';

/**
 * Returns today's date in YYYY-MM-DD format (local time).
 * @returns {string}
 */
export function getTodayDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Loads the history from localStorage.
 * If the stored date is not today, clears the history and returns a fresh object.
 * @returns {{date: string, sessions: Array<{duration: number, completedAt: string}>}}
 */
export function loadHistory() {
  const todayStr = getTodayDateString();
  const storedData = localStorage.getItem(STORAGE_KEY);

  if (storedData) {
    try {
      const parsed = JSON.parse(storedData);
      // Verify if the storage is for today
      if (parsed && parsed.date === todayStr) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing stored history, resetting...', e);
    }
  }

  // Clear previous history and return a fresh structure if date changed or parsing failed
  const freshData = {
    date: todayStr,
    sessions: []
  };
  saveHistory(freshData);
  return freshData;
}

/**
 * Saves the history object back to localStorage.
 * @param {{date: string, sessions: Array<{duration: number, completedAt: string}>}} data
 */
export function saveHistory(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Adds a new completed focus session to the daily history.
 * @param {number} durationMinutes - Focus duration in minutes.
 * @returns {Array<{duration: number, completedAt: string}>} The updated session list.
 */
export function addFocusSession(durationMinutes) {
  const history = loadHistory(); // Automatically handles new day clearing
  
  // Format completedAt time as h:mm AM/PM (e.g. 3:42 PM)
  const now = new Date();
  const completedAt = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const newSession = {
    duration: durationMinutes,
    completedAt: completedAt
  };

  history.sessions.push(newSession);
  saveHistory(history);
  return history.sessions;
}

/**
 * Manually resets/clears today's history if needed.
 */
export function clearHistory() {
  const freshData = {
    date: getTodayDateString(),
    sessions: []
  };
  saveHistory(freshData);
  return freshData.sessions;
}
