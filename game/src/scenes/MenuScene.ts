import Phaser from 'phaser'
import type { UserProfile } from '../types'
import { clearToken } from '../utils/auth'

export class MenuScene extends Phaser.Scene {
  private user!: UserProfile

  constructor() {
    super({ key: 'MenuScene' })
  }

  init(data: { user: UserProfile }) {
    this.user = data.user
  }

  create() {
    const { width, height } = this.scale

    // Desert background
    this.add.rectangle(0, 0, width, height, 0xc2a05a).setOrigin(0)

    // Title
    this.add.text(width / 2, 80, 'DESSERTKART', {
      fontSize: '40px',
      color: '#4a1a7a',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(0.5)

    // User info panel
    const panel = this.add.rectangle(width / 2, 160, 400, 70, 0x2d1b4e, 0.85).setOrigin(0.5)
    panel.setStrokeStyle(2, 0x7c3aed)
    this.add.text(width / 2, 145, `Driver: ${this.user.username}`, {
      fontSize: '16px', color: '#e879f9', fontFamily: 'monospace',
    }).setOrigin(0.5)
    this.add.text(width / 2, 168, `Wallet: $${this.user.money}`, {
      fontSize: '18px', color: '#fbbf24', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)

    // Buttons
    this.createMenuButton(width / 2, 280, 'RACE', 0x7c3aed, () => {
      this.scene.start('RaceScene', { user: this.user })
    })

    this.createMenuButton(width / 2, 360, 'SHOP', 0x059669, () => {
      this.scene.start('ShopScene', { user: this.user })
    })

    this.createMenuButton(width / 2, 440, 'LOGOUT', 0x6b7280, () => {
      clearToken()
      this.scene.start('LoginScene')
    })

    // Footer
    this.add.text(width / 2, height - 20, 'Arrow keys to drive • Beat 3 AI opponents • Earn $$$', {
      fontSize: '11px', color: '#92400e', fontFamily: 'monospace',
    }).setOrigin(0.5)
  }

  private createMenuButton(x: number, y: number, label: string, color: number, onClick: () => void) {
    const btn = this.add.rectangle(x, y, 240, 50, color).setOrigin(0.5).setInteractive({ useHandCursor: true })
    btn.setStrokeStyle(2, 0xffffff)
    const text = this.add.text(x, y, label, {
      fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5)
    btn.on('pointerover', () => { btn.setAlpha(0.85); text.setAlpha(0.85) })
    btn.on('pointerout', () => { btn.setAlpha(1); text.setAlpha(1) })
    btn.on('pointerdown', onClick)
  }
}
