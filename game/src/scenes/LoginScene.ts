import Phaser from 'phaser'
import { getToken, setToken, clearToken } from '../utils/auth'
import { apiClient } from '../utils/api'
import type { UserProfile } from '../types'

export class LoginScene extends Phaser.Scene {
  private overlay!: HTMLElement
  private errorEl!: HTMLElement
  private usernameEl!: HTMLInputElement
  private passwordEl!: HTMLInputElement

  constructor() {
    super({ key: 'LoginScene' })
  }

  async create() {
    const { width, height } = this.scale

    // Desert background
    this.add.rectangle(0, 0, width, height, 0xc2a05a).setOrigin(0)

    // Try auto-login first
    const token = getToken()
    if (token) {
      try {
        const profile = await apiClient.get('/api/user/profile')
        this.scene.start('MenuScene', { user: profile })
        return
      } catch {
        clearToken()
      }
    }

    // Show login overlay
    this.overlay = document.getElementById('login-overlay')!
    this.errorEl = document.getElementById('login-error')!
    this.usernameEl = document.getElementById('username') as HTMLInputElement
    this.passwordEl = document.getElementById('password') as HTMLInputElement

    this.overlay.classList.remove('hidden')

    document.getElementById('btn-login')!.onclick = () => this.handleLogin()
    document.getElementById('btn-register')!.onclick = () => this.handleRegister()

    this.usernameEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.passwordEl.focus()
    })
    this.passwordEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleLogin()
    })

    this.usernameEl.focus()
  }

  private async handleLogin() {
    const username = this.usernameEl.value.trim()
    const password = this.passwordEl.value
    if (!username || !password) {
      this.showError('Please enter username and password')
      return
    }
    try {
      const data = await apiClient.post<{ token: string; user: UserProfile }>('/api/auth/login', { username, password })
      setToken(data.token)
      this.hideOverlay()
      this.scene.start('MenuScene', { user: data.user })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      this.showError(msg)
    }
  }

  private async handleRegister() {
    const username = this.usernameEl.value.trim()
    const password = this.passwordEl.value
    if (!username || !password) {
      this.showError('Please enter username and password')
      return
    }
    if (password.length < 4) {
      this.showError('Password must be at least 4 characters')
      return
    }
    try {
      const data = await apiClient.post<{ token: string; user: UserProfile }>('/api/auth/register', { username, password })
      setToken(data.token)
      this.hideOverlay()
      this.scene.start('MenuScene', { user: data.user })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed'
      this.showError(msg)
    }
  }

  private showError(msg: string) {
    if (this.errorEl) this.errorEl.textContent = msg
  }

  private hideOverlay() {
    if (this.overlay) this.overlay.classList.add('hidden')
    this.errorEl.textContent = ''
    this.usernameEl.value = ''
    this.passwordEl.value = ''
  }
}
