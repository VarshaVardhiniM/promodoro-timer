/**
 * Timer Module
 * Handles Start, Pause, Resume, Reset, Countdown, and Focus/Break transitions.
 */

export const TIMER_MODES = {
  FOCUS: 'focus',
  BREAK: 'break'
};

export const TIMER_STATES = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused'
};

export class PomodoroTimer {
  /**
   * @param {number} defaultFocusMin - Default focus duration in minutes (e.g., 25).
   * @param {number} defaultBreakMin - Default break duration in minutes (e.g., 5).
   */
  constructor(defaultFocusMin = 25, defaultBreakMin = 5) {
    this.focusDuration = defaultFocusMin * 60; // stored in seconds
    this.breakDuration = defaultBreakMin * 60; // stored in seconds

    this.mode = TIMER_MODES.FOCUS;
    this.state = TIMER_STATES.IDLE;
    
    this.timeLeft = this.focusDuration;
    this.timerId = null;

    // Callbacks for UI bindings
    this.onTick = null; // function(timeLeft, totalDuration, percentageLeft)
    this.onModeChange = null; // function(mode)
    this.onStateChange = null; // function(state)
    this.onSessionComplete = null; // function(completedMode, durationMinutes)
  }

  /**
   * Updates configurations for focus and break duration.
   * If the timer is idle, resets timeLeft to reflect the new configurations.
   * @param {number} focusMin
   * @param {number} breakMin
   */
  setDurations(focusMin, breakMin) {
    this.focusDuration = focusMin * 60;
    this.breakDuration = breakMin * 60;

    if (this.state === TIMER_STATES.IDLE) {
      this.timeLeft = this.mode === TIMER_MODES.FOCUS ? this.focusDuration : this.breakDuration;
      this.triggerTick();
    }
  }

  /**
   * Helper to get total duration for current mode
   * @returns {number} duration in seconds
   */
  getCurrentDuration() {
    return this.mode === TIMER_MODES.FOCUS ? this.focusDuration : this.breakDuration;
  }

  /**
   * Starts the countdown
   */
  start() {
    if (this.state === TIMER_STATES.RUNNING) return;

    this.changeState(TIMER_STATES.RUNNING);
    this.runTicker();
  }

  /**
   * Pauses the countdown
   */
  pause() {
    if (this.state !== TIMER_STATES.RUNNING) return;

    this.clearTicker();
    this.changeState(TIMER_STATES.PAUSED);
  }

  /**
   * Resumes the paused countdown
   */
  resume() {
    if (this.state !== TIMER_STATES.PAUSED) return;

    this.start();
  }

  /**
   * Resets the timer to current mode's start duration and returns to IDLE state
   */
  reset() {
    this.clearTicker();
    this.changeState(TIMER_STATES.IDLE);
    this.timeLeft = this.getCurrentDuration();
    this.triggerTick();
  }

  /**
   * Switches mode and resets countdown time
   * @param {string} newMode 
   */
  changeMode(newMode) {
    if (newMode !== TIMER_MODES.FOCUS && newMode !== TIMER_MODES.BREAK) return;
    
    this.mode = newMode;
    this.timeLeft = this.getCurrentDuration();
    
    if (this.onModeChange) {
      this.onModeChange(this.mode);
    }
    
    this.triggerTick();
  }

  /**
   * Private internal ticker helper
   */
  runTicker() {
    this.clearTicker();
    
    // Use an exact timestamp comparison to avoid interval drift
    let expected = Date.now() + 1000;
    
    const step = () => {
      if (this.state !== TIMER_STATES.RUNNING) return;

      this.timeLeft--;

      if (this.timeLeft <= 0) {
        this.handleSessionCompletion();
      } else {
        this.triggerTick();
        
        // Compensate for drift
        const dt = Date.now() - expected;
        expected += 1000;
        this.timerId = setTimeout(step, Math.max(0, 1000 - dt));
      }
    };

    this.timerId = setTimeout(step, 1000);
    this.triggerTick();
  }

  /**
   * Clears the interval/timeout
   */
  clearTicker() {
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Handles transitioning modes and saving sessions on completion
   */
  handleSessionCompletion() {
    this.clearTicker();
    
    const completedMode = this.mode;
    const durationMinutes = Math.round(this.getCurrentDuration() / 60);

    // Swap modes
    const nextMode = this.mode === TIMER_MODES.FOCUS ? TIMER_MODES.BREAK : TIMER_MODES.FOCUS;
    this.mode = nextMode;
    this.timeLeft = this.getCurrentDuration();
    this.state = TIMER_STATES.IDLE; // Reset state back to idle before auto-starting or waiting

    // Call transition callbacks
    if (this.onSessionComplete) {
      this.onSessionComplete(completedMode, durationMinutes);
    }

    if (this.onModeChange) {
      this.onModeChange(this.mode);
    }

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }

    // Auto-start next session
    this.start();
  }

  /**
   * Helper to trigger the callback mapping time remaining
   */
  triggerTick() {
    if (this.onTick) {
      const total = this.getCurrentDuration();
      const pct = total > 0 ? (this.timeLeft / total) : 0;
      this.onTick(this.timeLeft, total, pct);
    }
  }

  /**
   * Internal state change notifier
   * @param {string} newState 
   */
  changeState(newState) {
    this.state = newState;
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }
}
