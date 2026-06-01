/**
 * App Module
 * Orchestrates inputs, local storage actions, keyboard hooks, and triggers.
 */

import { loadHistory, addFocusSession, clearHistory } from './storage.js';
import { PomodoroTimer, TIMER_MODES, TIMER_STATES } from './timer.js';
import { PomodoroUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  // Initialize UI layer and Core Timer
  const ui = new PomodoroUI();
  const timer = new PomodoroTimer();

  // Load and display session history
  const historyData = loadHistory();
  ui.renderHistory(historyData.sessions);

  // Sync settings inputs with timer durations on initial load
  function syncDurationsFromInputs() {
    let focusMin = parseInt(ui.inputFocus.value, 10) || 25;
    let breakMin = parseInt(ui.inputBreak.value, 10) || 5;

    // Validate and clamp focus values
    if (focusMin < 1) focusMin = 1;
    if (focusMin > 180) focusMin = 180;
    ui.inputFocus.value = focusMin;

    // Validate and clamp break values
    if (breakMin < 1) breakMin = 1;
    if (breakMin > 60) breakMin = 60;
    ui.inputBreak.value = breakMin;

    timer.setDurations(focusMin, breakMin);
  }

  // Handle updates to settings fields
  ui.inputFocus.addEventListener('change', syncDurationsFromInputs);
  ui.inputBreak.addEventListener('change', syncDurationsFromInputs);

  // Bind settings adjustment buttons (+/-)
  ui.btnFocusDec.addEventListener('click', () => {
    const val = Math.max(1, (parseInt(ui.inputFocus.value, 10) || 25) - 1);
    ui.inputFocus.value = val;
    syncDurationsFromInputs();
  });

  ui.btnFocusInc.addEventListener('click', () => {
    const val = Math.min(180, (parseInt(ui.inputFocus.value, 10) || 25) + 1);
    ui.inputFocus.value = val;
    syncDurationsFromInputs();
  });

  ui.btnBreakDec.addEventListener('click', () => {
    const val = Math.max(1, (parseInt(ui.inputBreak.value, 10) || 5) - 1);
    ui.inputBreak.value = val;
    syncDurationsFromInputs();
  });

  ui.btnBreakInc.addEventListener('click', () => {
    const val = Math.min(60, (parseInt(ui.inputBreak.value, 10) || 5) + 1);
    ui.inputBreak.value = val;
    syncDurationsFromInputs();
  });

  // Setup core timer event callbacks
  timer.onTick = (timeLeft, totalDuration, percentageLeft) => {
    ui.renderTimer(timeLeft, totalDuration, percentageLeft, timer.mode);
  };

  timer.onModeChange = (newMode) => {
    ui.updateTheme(newMode, timer.state);
  };

  timer.onStateChange = (newState) => {
    ui.renderControlsState(newState);
    ui.updateTheme(timer.mode, newState);
  };

  timer.onSessionComplete = (completedMode, durationMinutes) => {
    if (completedMode === TIMER_MODES.FOCUS) {
      // Only log focus sessions to storage
      const sessions = addFocusSession(durationMinutes);
      ui.renderHistory(sessions);
    }
    // Launch notification visual chime + sound
    ui.showCompletionDialog(completedMode);
  };

  // Wire control panel action buttons
  ui.btnStart.addEventListener('click', () => {
    // Sync settings in case typing changes didn't trigger change event yet
    syncDurationsFromInputs();
    timer.start();
  });

  ui.btnPause.addEventListener('click', () => {
    timer.pause();
  });

  ui.btnResume.addEventListener('click', () => {
    timer.resume();
  });

  ui.btnReset.addEventListener('click', () => {
    timer.reset();
  });

  // Toast completion dismiss button
  ui.btnCloseToast.addEventListener('click', () => {
    ui.dismissCompletionDialog();
  });

  // Clear history action button
  ui.btnClearHistory.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear your focus history for today?')) {
      const clearedList = clearHistory();
      ui.renderHistory(clearedList);
    }
  });

  // Keyboard Shortcuts (Space to play/pause, Esc to reset, T to test chime sound)
  window.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable);
    
    // Ignore global keyboard shortcuts when typing in input controls
    if (isInput) return;

    if (e.key === ' ') {
      e.preventDefault(); // Prevent standard page scroll behavior on space
      if (timer.state === TIMER_STATES.IDLE) {
        syncDurationsFromInputs();
        timer.start();
      } else if (timer.state === TIMER_STATES.RUNNING) {
        timer.pause();
      } else if (timer.state === TIMER_STATES.PAUSED) {
        timer.resume();
      }
    } else if (e.key === 'Escape') {
      timer.reset();
    } else if (e.key.toLowerCase() === 't') {
      ui.playNotificationSound();
    }
  });

  // Perform initial bootstrapping display setup
  syncDurationsFromInputs();
  timer.triggerTick();
  ui.renderControlsState(timer.state);
  ui.updateTheme(timer.mode, timer.state);
});
