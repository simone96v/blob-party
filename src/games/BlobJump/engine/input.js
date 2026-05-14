import { PHYSICS } from './physics'

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas
    this.direction = 0 // -1 left, 0 neutral, +1 right
    this.useTilt = false
    this.tiltGamma = 0
    this._cleanup = []
  }

  async init() {
    this._setupKeyboard()
    this._setupTouch()
    await this._setupTilt()
  }

  getVelocityX() {
    if (this.useTilt) {
      const deadZone = 3
      const gamma = this.tiltGamma || 0
      if (Math.abs(gamma) < deadZone) return 0
      const clamped = Math.max(-45, Math.min(45, gamma))
      return (clamped / 45) * PHYSICS.TILT_SENSITIVITY
    }
    return this.direction * PHYSICS.MOVE_SPEED
  }

  _setupKeyboard() {
    const onDown = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') this.direction = -1
      if (e.key === 'ArrowRight' || e.key === 'd') this.direction = 1
    }
    const onUp = (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        if (this.direction === -1) this.direction = 0
      }
      if (e.key === 'ArrowRight' || e.key === 'd') {
        if (this.direction === 1) this.direction = 0
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    this._cleanup.push(() => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    })
  }

  _setupTouch() {
    const el = this.canvas
    const onStart = (e) => {
      e.preventDefault()
      const x = e.touches[0].clientX
      const rect = el.getBoundingClientRect()
      const mid = rect.left + rect.width / 2
      this.direction = x < mid ? -1 : 1
    }
    const onMove = (e) => {
      e.preventDefault()
      const x = e.touches[0].clientX
      const rect = el.getBoundingClientRect()
      const mid = rect.left + rect.width / 2
      this.direction = x < mid ? -1 : 1
    }
    const onEnd = () => {
      this.direction = 0
    }

    el.addEventListener('touchstart', onStart, { passive: false })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
    this._cleanup.push(() => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
    })
  }

  async _setupTilt() {
    if (typeof DeviceOrientationEvent === 'undefined') return

    const listen = () => {
      this.useTilt = true
      const onOrient = (e) => {
        this.tiltGamma = e.gamma || 0
      }
      window.addEventListener('deviceorientation', onOrient)
      this._cleanup.push(() => window.removeEventListener('deviceorientation', onOrient))
    }

    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission()
        if (res === 'granted') listen()
      } catch {
        // permission denied — fall back to touch
      }
    } else {
      listen()
    }
  }

  destroy() {
    this._cleanup.forEach((fn) => fn())
    this._cleanup = []
  }
}
