import Phaser from 'phaser'
import { getKart, KART_CATALOG } from '../config/karts'
import type { UserProfile } from '../types'

export class ProfileScene extends Phaser.Scene {
  private user!: UserProfile

  constructor() {
    super({ key: 'ProfileScene' })
  }

  init(data: { user: UserProfile }) {
    this.user = data.user
  }

  create() {
    const { width } = this.scale
    this.cameras.main.setBackgroundColor('#1a0a2e')

    // Title
    this.add.text(width / 2, 30, 'DRIVER PROFILE', {
      fontSize: '28px', color: '#e879f9', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5)

    // Card background
    this.add.rectangle(width / 2, 260, 500, 360, 0x2d1b4e)
      .setStrokeStyle(2, 0x7c3aed)

    const kart = getKart(this.user.equipped_cart)
    let y = 110

    // Kart sprite
    const preview = this.add.image(width / 2, y, kart.sheet, kart.spriteFrame).setScale(4)
    if (kart.tint) preview.setTint(kart.tint)
    y += 60

    // Driver name
    this._row(y, 'DRIVER', this.user.username)
    y += 40

    // Current kart
    this._row(y, 'KART', kart.name)
    y += 40

    // Kart speed
    this._row(y, 'TOP SPEED', `${kart.speed} px/s`)
    y += 40

    // Fuel tank
    this._row(y, 'FUEL TANK', `${kart.fuelTank.toFixed(1)} units`)
    y += 40

    // Money
    this._row(y, 'WALLET', `$${this.user.money}`)
    y += 40

    // Boosts
    this._row(y, 'BOOSTS', `${this.user.boosts ?? 0}`)
    y += 40

    // Owned karts
    const ownedNames = this.user.owned_carts
      .map(id => KART_CATALOG.find(k => k.id === id)?.name ?? id)
      .join(', ')
    this._row(y, 'OWNED', ownedNames || 'None')

    // Back button
    this._makeButton(width / 2, 480, '← BACK TO MENU', () => {
      this.scene.start('MenuScene', { user: this.user })
    })
  }

  private _row(y: number, label: string, value: string) {
    const { width } = this.scale
    this.add.text(width / 2 - 200, y, label, {
      fontSize: '14px', color: '#a78bfa', fontFamily: 'monospace',
    })
    this.add.text(width / 2 + 50, y, value, {
      fontSize: '14px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 1,
    })
  }

  private _makeButton(x: number, y: number, label: string, onClick: () => void) {
    const bg = this.add.rectangle(x, y, label.length * 11 + 24, 40, 0x2d1b4e)
      .setStrokeStyle(2, 0x7c3aed).setInteractive({ useHandCursor: true })
    const txt = this.add.text(x, y, label, {
      fontSize: '14px', color: '#e879f9', fontFamily: 'monospace',
    }).setOrigin(0.5)
    bg.on('pointerover', () => { bg.setFillStyle(0x4c1d95); txt.setColor('#ffffff') })
    bg.on('pointerout',  () => { bg.setFillStyle(0x2d1b4e); txt.setColor('#e879f9') })
    bg.on('pointerdown', onClick)
  }
}
