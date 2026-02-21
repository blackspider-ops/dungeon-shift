/**
 * AudioManager - Manages game audio (sound effects and music)
 * Uses Web Audio API to generate simple sound effects programmatically
 */
export default class AudioManager {
  constructor(scene) {
    this.scene = scene;
    this.audioContext = null;
    this.masterVolume = 0.3; // Lower default volume
    this.sfxVolume = 0.5;
    this.musicVolume = 0.3;
    this.isMuted = false;
    
    // Initialize Web Audio API
    this.initAudioContext();
  }

  /**
   * Initialize Web Audio API context
   */
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      console.log('AudioManager: Web Audio API initialized');
    } catch (e) {
      console.warn('AudioManager: Web Audio API not supported', e);
    }
  }

  /**
   * Play a movement sound effect
   * Simple blip sound for player movement
   */
  playMovementSound() {
    if (!this.audioContext || this.isMuted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 400; // Frequency in Hz
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Play a spike trap activation sound
   * Sharp, high-pitched sound
   */
  playSpikeSound() {
    if (!this.audioContext || this.isMuted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.15);
  }

  /**
   * Play an arrow trap fire sound
   * Whoosh sound
   */
  playArrowSound() {
    if (!this.audioContext || this.isMuted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.12, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.2);
  }

  /**
   * Play a damage sound
   * Low, harsh sound
   */
  playDamageSound() {
    if (!this.audioContext || this.isMuted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 150;
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.2, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.25);
  }

  /**
   * Play a key collection sound
   * Pleasant chime
   */
  playKeyCollectSound() {
    if (!this.audioContext || this.isMuted) return;

    // Play two notes for a pleasant chime
    const frequencies = [523.25, 659.25]; // C5 and E5
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = this.audioContext.currentTime + (index * 0.05);
      gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.15, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  /**
   * Play a power-up collection sound
   * Ascending notes
   */
  playPowerUpCollectSound() {
    if (!this.audioContext || this.isMuted) return;

    const frequencies = [440, 554.37, 659.25]; // A4, C#5, E5
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = this.audioContext.currentTime + (index * 0.06);
      gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.12, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.25);
    });
  }

  /**
   * Play a shift/rotation sound
   * Sweeping sound effect
   */
  playShiftSound() {
    if (!this.audioContext || this.isMuted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.4);
    oscillator.type = 'triangle';

    gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.15, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.4);
  }

  /**
   * Play a door unlock sound
   * Mechanical click sound
   */
  playDoorUnlockSound() {
    if (!this.audioContext || this.isMuted) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = 250;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.1, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Play a victory sound
   * Triumphant ascending notes
   */
  playVictorySound() {
    if (!this.audioContext || this.isMuted) return;

    const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = this.audioContext.currentTime + (index * 0.1);
      gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.5);
    });
  }

  /**
   * Play a defeat sound
   * Descending notes
   */
  playDefeatSound() {
    if (!this.audioContext || this.isMuted) return;

    const frequencies = [523.25, 392, 329.63, 261.63]; // C5, G4, E4, C4
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = freq;
      oscillator.type = 'sine';

      const startTime = this.audioContext.currentTime + (index * 0.15);
      gainNode.gain.setValueAtTime(this.masterVolume * this.sfxVolume * 0.18, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.6);
    });
  }

  /**
   * Start background music
   * Simple ambient loop
   */
  startBackgroundMusic() {
    if (!this.audioContext || this.isMuted) return;

    // Stop existing music if any
    this.stopBackgroundMusic();

    // Create a simple ambient music loop
    this.musicOscillator = this.audioContext.createOscillator();
    this.musicGain = this.audioContext.createGain();

    this.musicOscillator.connect(this.musicGain);
    this.musicGain.connect(this.audioContext.destination);

    // Very low volume ambient tone
    this.musicOscillator.frequency.value = 110; // A2
    this.musicOscillator.type = 'sine';
    this.musicGain.gain.value = this.masterVolume * this.musicVolume * 0.05;

    this.musicOscillator.start();
    
    console.log('AudioManager: Background music started');
  }

  /**
   * Stop background music
   */
  stopBackgroundMusic() {
    if (this.musicOscillator) {
      try {
        this.musicOscillator.stop();
      } catch (e) {
        // Oscillator may already be stopped
      }
      this.musicOscillator = null;
      this.musicGain = null;
      console.log('AudioManager: Background music stopped');
    }
  }

  /**
   * Toggle mute on/off
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    
    console.log(`AudioManager: Mute ${this.isMuted ? 'ON' : 'OFF'}`);
    return this.isMuted;
  }

  /**
   * Set master volume
   * @param {number} volume - Volume level (0.0 to 1.0)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Update music volume if playing
    if (this.musicGain) {
      this.musicGain.gain.value = this.masterVolume * this.musicVolume * 0.05;
    }
  }

  /**
   * Clean up audio resources
   */
  destroy() {
    this.stopBackgroundMusic();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('AudioManager: Destroyed');
  }
}
