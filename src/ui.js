/**
 * UI Module
 * Handles rendering the timer, progress ring, history list, toast popups, and playing chimes.
 */

// UI Constant Configuration
const PROGRESS_RING_CIRCUMFERENCE = 552.92; // 2 * PI * r (where r = 88)

// Programmatic Audio Generator
let cachedChimeUri = null;

/**
 * Programmatically generates a 2-tone melodic chime WAV Data URI to avoid external dependencies.
 * Frequencies: C5 (523.25 Hz) decaying and blending with E5 (659.25 Hz).
 * @returns {string}
 */
function getChimeDataUri() {
  if (cachedChimeUri) return cachedChimeUri;

  const sampleRate = 22050;
  const duration = 1.2;
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new Uint8Array(44 + numSamples * 2);

  // Helper local functions to write bytes
  const writeString = (buf, offset, str) => {
    for (let i = 0; i < str.length; i++) {
      buf[offset + i] = str.charCodeAt(i);
    }
  };
  const writeUint32 = (buf, offset, val) => {
    buf[offset] = val & 0xff;
    buf[offset + 1] = (val >> 8) & 0xff;
    buf[offset + 2] = (val >> 16) & 0xff;
    buf[offset + 3] = (val >> 24) & 0xff;
  };
  const writeUint16 = (buf, offset, val) => {
    buf[offset] = val & 0xff;
    buf[offset + 1] = (val >> 8) & 0xff;
  };

  // RIFF WAVE header setup
  writeString(buffer, 0, 'RIFF');
  writeUint32(buffer, 4, 36 + numSamples * 2);
  writeString(buffer, 8, 'WAVE');
  writeString(buffer, 12, 'fmt ');
  writeUint32(buffer, 16, 16);
  writeUint16(buffer, 20, 1); // Audio Format: PCM (1)
  writeUint16(buffer, 22, 1); // Mono
  writeUint32(buffer, 24, sampleRate);
  writeUint32(buffer, 28, sampleRate * 2); // Byte rate (SampleRate * BlockAlign)
  writeUint16(buffer, 32, 2); // Block Align (NumChannels * BitsPerSample/8)
  writeUint16(buffer, 34, 16); // Bits per sample
  writeString(buffer, 36, 'data');
  writeUint32(buffer, 40, numSamples * 2);

  // Fill wave samples
  let idx = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // Fast decay tone combination
    const envelope = Math.exp(-2.5 * t); // Soft envelope decay
    const val = (Math.sin(2 * Math.PI * 523.25 * t) + 0.6 * Math.sin(2 * Math.PI * 659.25 * t)) / 1.6;
    const sample = Math.floor(val * envelope * 32767);

    buffer[idx++] = sample & 0xff;
    buffer[idx++] = (sample >> 8) & 0xff;
  }

  // Convert binary array to base64 string
  let binary = '';
  const len = buffer.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(buffer[i]);
  }

  cachedChimeUri = 'data:audio/wav;base64,' + btoa(binary);
  return cachedChimeUri;
}

export class PomodoroUI {
  constructor() {
    // Select elements
    this.body = document.body;
    this.countdownText = document.getElementById('countdown-text');
    this.progressCircle = document.getElementById('progress-circle');
    this.modeBadge = document.getElementById('mode-badge');
    this.modeText = document.getElementById('mode-text');
    this.timerSubtext = document.getElementById('timer-subtext');
    
    // Control Buttons
    this.btnStart = document.getElementById('btn-start');
    this.btnPause = document.getElementById('btn-pause');
    this.btnResume = document.getElementById('btn-resume');
    this.btnReset = document.getElementById('btn-reset');
    
    // Config Inputs
    this.inputFocus = document.getElementById('input-focus');
    this.inputBreak = document.getElementById('input-break');
    
    // Adjust Buttons
    this.btnFocusDec = document.getElementById('btn-focus-dec');
    this.btnFocusInc = document.getElementById('btn-focus-inc');
    this.btnBreakDec = document.getElementById('btn-break-dec');
    this.btnBreakInc = document.getElementById('btn-break-inc');
    
    // History
    this.historyList = document.getElementById('history-list');
    this.historyEmpty = document.getElementById('history-empty');
    this.btnClearHistory = document.getElementById('btn-clear-history');
    
    // Notification Dialog
    this.toastOverlay = document.getElementById('toast-overlay');
    this.toastTitle = document.getElementById('toast-title');
    this.toastMessage = document.getElementById('toast-message');
    this.btnCloseToast = document.getElementById('btn-close-toast');

    // Initialize progress ring settings
    if (this.progressCircle) {
      this.progressCircle.style.strokeDasharray = PROGRESS_RING_CIRCUMFERENCE;
      this.progressCircle.style.strokeDashoffset = 0;
    }
  }

  /**
   * Formats seconds into mm:ss format.
   * @param {number} totalSeconds 
   * @returns {string}
   */
  formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  /**
   * Updates countdown digits, progress ring, and browser tab title.
   * @param {number} timeLeft - Remaining time in seconds.
   * @param {number} totalDuration - Initial total time in seconds.
   * @param {number} percentageLeft - Ratio of time remaining (0.0 to 1.0).
   * @param {string} currentMode - 'focus' or 'break'.
   */
  renderTimer(timeLeft, totalDuration, percentageLeft, currentMode) {
    const timeStr = this.formatTime(timeLeft);
    
    // Update timer text inside the ring
    if (this.countdownText) {
      this.countdownText.textContent = timeStr;
    }

    // Update SVG progress offset
    if (this.progressCircle) {
      // Offset starts at 0 (full circle) and reaches CIRCUMFERENCE (empty circle)
      const offset = PROGRESS_RING_CIRCUMFERENCE * (1 - percentageLeft);
      this.progressCircle.style.strokeDashoffset = offset;
    }

    // Update browser tab title for premium UX
    const capitalizedMode = currentMode.charAt(0).toUpperCase() + currentMode.slice(1);
    document.title = `[${timeStr}] ${capitalizedMode} | Aura Pomodoro`;
  }

  /**
   * Manages buttons visibility according to active state.
   * States: 'idle', 'running', 'paused'
   * @param {string} state 
   */
  renderControlsState(state) {
    // Hide all first
    this.btnStart.classList.add('hidden');
    this.btnPause.classList.add('hidden');
    this.btnResume.classList.add('hidden');
    this.btnReset.classList.add('hidden');

    switch (state) {
      case 'idle':
        this.btnStart.classList.remove('hidden');
        break;
      case 'running':
        this.btnPause.classList.remove('hidden');
        this.btnReset.classList.remove('hidden');
        break;
      case 'paused':
        this.btnResume.classList.remove('hidden');
        this.btnReset.classList.remove('hidden');
        break;
    }
  }

  /**
   * Switches full page color theme matching timer mode and state.
   * @param {string} mode - 'focus' or 'break'
   * @param {string} state - 'idle', 'running', 'paused'
   */
  updateTheme(mode, state) {
    // Clear classes
    this.body.classList.remove('theme-focus', 'theme-break', 'theme-paused');
    this.modeBadge.classList.remove('focus-mode', 'break-mode', 'paused-mode');

    if (state === 'paused') {
      this.body.classList.add('theme-paused');
      this.modeBadge.classList.add('paused-mode');
      this.modeText.textContent = 'Paused';
      if (this.timerSubtext) this.timerSubtext.textContent = 'Timer paused';
    } else if (mode === 'focus') {
      this.body.classList.add('theme-focus');
      this.modeBadge.classList.add('focus-mode');
      this.modeText.textContent = 'Focus Mode';
      if (this.timerSubtext) this.timerSubtext.textContent = 'Stay focused';
    } else {
      this.body.classList.add('theme-break');
      this.modeBadge.classList.add('break-mode');
      this.modeText.textContent = 'Break Mode';
      if (this.timerSubtext) this.timerSubtext.textContent = 'Take a breather';
    }
  }

  /**
   * Redraws the completed focus sessions feed.
   * Expected item format: ✓ 25:00 Focus — 3:42 PM
   * @param {Array<{duration: number, completedAt: string}>} sessions 
   */
  renderHistory(sessions) {
    if (!this.historyList) return;

    this.historyList.innerHTML = '';

    if (!sessions || sessions.length === 0) {
      this.historyEmpty.classList.remove('hidden');
      this.btnClearHistory.classList.add('hidden');
      return;
    }

    this.historyEmpty.classList.add('hidden');
    this.btnClearHistory.classList.remove('hidden');

    sessions.forEach(session => {
      const li = document.createElement('li');
      li.className = 'history-item';
      
      li.innerHTML = `
        <span class="history-item-check" aria-hidden="true">✓</span>
        <span class="history-item-content">${session.duration}:00 Focus</span>
        <span class="history-item-time" aria-label="Completed at ${session.completedAt}">— ${session.completedAt}</span>
      `;
      this.historyList.appendChild(li);
    });
  }

  /**
   * Opens the success dialog on session complete. Plays notification sound.
   * @param {string} completedMode - The mode that just finished ('focus' or 'break')
   */
  showCompletionDialog(completedMode) {
    this.playNotificationSound();

    if (completedMode === 'focus') {
      this.toastTitle.textContent = 'Focus Session Complete!';
      this.toastMessage.textContent = 'Time for a break.';
    } else {
      this.toastTitle.textContent = 'Break Complete!';
      this.toastMessage.textContent = 'Back to focus.';
    }

    this.toastOverlay.classList.remove('hidden');
    
    // Focus close button for accessibility
    this.btnCloseToast.focus();

    // Auto dismiss after 5 seconds to not disturb the flow
    if (this.toastTimeoutId) clearTimeout(this.toastTimeoutId);
    this.toastTimeoutId = setTimeout(() => {
      this.dismissCompletionDialog();
    }, 5000);
  }

  /**
   * Closes the overlay dialog
   */
  dismissCompletionDialog() {
    this.toastOverlay.classList.add('hidden');
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
      this.toastTimeoutId = null;
    }
  }

  /**
   * Triggers the synthesized notification chime
   */
  playNotificationSound() {
    try {
      const audioUri = getChimeDataUri();
      const sound = new Audio(audioUri);
      sound.volume = 0.8;
      
      const playPromise = sound.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Audio play failed or was blocked by browser autoplay policy:', error);
        });
      }
    } catch (e) {
      console.error('Failed playing audio notification:', e);
    }
  }
}
