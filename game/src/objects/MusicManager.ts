import Phaser from 'phaser'

/**
 * Procedural music & sound effects manager.
 * Creates driving music using Web Audio API oscillators,
 * and plays countdown / finish SFX via Phaser's sound system.
 */

// Bass note pattern (frequencies in Hz) — minor pentatonic vibe
const BASS_PATTERN = [
  65.41, 0, 77.78, 0,   // C2, rest, Eb2, rest
  87.31, 0, 98.00, 87.31, // F2, rest, G2, F2
]

const BPM = 140
const BEAT_INTERVAL = 60 / BPM  // seconds per beat

export class MusicManager {
  private scene: Phaser.Scene
  private ctx: AudioContext | null = null

  // Engine hum
  private engineOsc: OscillatorNode | null = null
  private engineGain: GainNode | null = null

  // Bass music loop
  private bassOsc: OscillatorNode | null = null
  private bassGain: GainNode | null = null
  private beatIndex = 0
  private loopTimer: Phaser.Time.TimerEvent | null = null

  // Hi-hat noise loop
  private hihatTimer: Phaser.Time.TimerEvent | null = null

  private playing = false

  constructor(scene: Phaser.Scene) {
    this.scene = scene
  }

  /** Get or create the AudioContext from Phaser's sound manager. */
  private getContext(): AudioContext | null {
    try {
      // Phaser exposes the underlying WebAudio context
      const sm = this.scene.sound as Phaser.Sound.WebAudioSoundManager
      if (sm?.context) return sm.context as unknown as AudioContext
    } catch { /* fallback */ }
    return null
  }

  // ─── Countdown sounds ───

  playCountdownBeep() {
    this.scene.sound.play('select-a', { volume: 0.6 })
  }

  playGoSound() {
    this.scene.sound.play('coin-a', { volume: 0.8 })
  }

  // ─── Collision sound ───

  playBump() {
    this.scene.sound.play('hurt-a', { volume: 0.5 })
  }

  // ─── Refuel sounds ───

  playRefuelStart() {
    this.scene.sound.play('coin-c', { volume: 0.4 })
  }

  playRefuelDone() {
    this.scene.sound.play('coin-d', { volume: 0.6 })
  }

  // ─── Boost sound ───

  playBoost() {
    this.scene.sound.play('jump-a', { volume: 0.7 })
  }

  // ─── Low fuel warning ───

  playFuelWarning() {
    this.scene.sound.play('error-a', { volume: 0.3 })
  }

  // ─── Engine hum (pitch varies with speed) ───

  startEngine() {
    this.ctx = this.getContext()
    if (!this.ctx) return

    this.engineOsc = this.ctx.createOscillator()
    this.engineGain = this.ctx.createGain()
    this.engineOsc.type = 'sawtooth'
    this.engineOsc.frequency.value = 55
    this.engineGain.gain.value = 0.06
    this.engineOsc.connect(this.engineGain)
    this.engineGain.connect(this.ctx.destination)
    this.engineOsc.start()
  }

  updateEngine(speed: number, maxSpeed: number) {
    if (!this.engineOsc) return
    const ratio = Math.min(Math.abs(speed) / maxSpeed, 1)
    // Pitch from 55 Hz (idle) to 180 Hz (max speed)
    this.engineOsc.frequency.value = 55 + ratio * 125
    // Volume from 0.04 (idle) to 0.08 (max)
    if (this.engineGain) {
      this.engineGain.gain.value = 0.04 + ratio * 0.04
    }
  }

  stopEngine() {
    try { this.engineOsc?.stop() } catch { /* already stopped */ }
    this.engineOsc = null
    this.engineGain = null
  }

  // ─── Driving music (bass synth loop + rhythm) ───

  startDrivingMusic() {
    if (this.playing) return
    this.playing = true
    this.ctx = this.getContext()
    if (!this.ctx) return

    // Bass oscillator (persistent, we modulate frequency)
    this.bassOsc = this.ctx.createOscillator()
    this.bassGain = this.ctx.createGain()
    this.bassOsc.type = 'square'
    this.bassOsc.frequency.value = 0
    this.bassGain.gain.value = 0
    this.bassOsc.connect(this.bassGain)
    this.bassGain.connect(this.ctx.destination)
    this.bassOsc.start()

    this.beatIndex = 0

    // Bass pattern loop
    this.loopTimer = this.scene.time.addEvent({
      delay: BEAT_INTERVAL * 1000,
      loop: true,
      callback: () => {
        if (!this.ctx || !this.bassOsc || !this.bassGain) return
        const freq = BASS_PATTERN[this.beatIndex % BASS_PATTERN.length]
        this.beatIndex++

        if (freq > 0) {
          // Note on with quick attack/decay envelope
          this.bassOsc.frequency.value = freq
          const now = this.ctx.currentTime
          this.bassGain.gain.cancelScheduledValues(now)
          this.bassGain.gain.setValueAtTime(0, now)
          this.bassGain.gain.linearRampToValueAtTime(0.1, now + 0.02)
          this.bassGain.gain.exponentialRampToValueAtTime(0.01, now + BEAT_INTERVAL * 0.9)
        } else {
          // Rest
          this.bassGain.gain.value = 0
        }
      },
    })

    // Hi-hat rhythm (play a short noise burst every half-beat)
    this.hihatTimer = this.scene.time.addEvent({
      delay: (BEAT_INTERVAL / 2) * 1000,
      loop: true,
      callback: () => {
        if (!this.ctx) return
        this._playHihat()
      },
    })
  }

  /** Short noise burst simulating a hi-hat. */
  private _playHihat() {
    if (!this.ctx) return
    const bufferSize = this.ctx.sampleRate * 0.03 // 30ms
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }
    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    // Bandpass filter to make it sound more like a hi-hat
    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.value = 8000

    const gain = this.ctx.createGain()
    const now = this.ctx.currentTime
    gain.gain.setValueAtTime(0.04, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.ctx.destination)
    noise.start()
    noise.stop(now + 0.05)
  }

  stopDrivingMusic() {
    this.playing = false
    this.loopTimer?.destroy()
    this.loopTimer = null
    this.hihatTimer?.destroy()
    this.hihatTimer = null
    try { this.bassOsc?.stop() } catch { /* already stopped */ }
    this.bassOsc = null
    this.bassGain = null
  }

  // ─── Stop everything ───

  stopAll() {
    this.stopEngine()
    this.stopDrivingMusic()
  }
}
