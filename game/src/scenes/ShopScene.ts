import Phaser from 'phaser'
import { KART_CATALOG } from '../config/karts'
import { apiClient } from '../utils/api'
import type { UserProfile } from '../types'

export class ShopScene extends Phaser.Scene {
  user!: UserProfile

  constructor() {
    super({ key: 'ShopScene' })
  }

  init(data: { user: UserProfile }) {
    this.user = data.user
  }

  create() {
    this.cameras.main.setBackgroundColor('#1a0a2e')

    // Title
    this.add.text(400, 20, 'KART SHOP', {
      fontSize: '28px', color: '#e879f9', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5)

    // Money display
    const moneyText = this.add.text(700, 20, `$${this.user.money}`, {
      fontSize: '16px', color: '#22ff88', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0)

    // Kart grid
    KART_CATALOG.forEach((kart, i) => {
      const y = 90 + i * 96
      this._drawKartRow(y, kart, moneyText)
    })

    // Back button
    this._makeButton(100, 560, '← BACK', () => {
      this.scene.start('MenuScene', { user: this.user })
    })
  }

  private _drawKartRow(
    y: number,
    kart: (typeof KART_CATALOG)[0],
    moneyText: Phaser.GameObjects.Text,
  ) {
    const owned    = this.user.owned_carts.includes(kart.id)
    const equipped = this.user.equipped_cart === kart.id

    // Card background
    const card = this.add.rectangle(400, y + 36, 680, 84, 0x2d1b4e)
      .setStrokeStyle(1, equipped ? 0xe879f9 : 0x4c1d95)

    // Sprite preview
    const preview = this.add.image(80, y + 36, kart.sheet, kart.spriteFrame)
      .setScale(2.5)
    if (kart.tint) preview.setTint(kart.tint)

    // Name + stats
    this.add.text(130, y + 12, kart.name, {
      fontSize: '16px', color: '#ffffff', fontFamily: 'monospace', stroke: '#000', strokeThickness: 2,
    })
    this.add.text(130, y + 36, `Speed: ${kart.speed}  Price: $${kart.price}`, {
      fontSize: '13px', color: '#a78bfa', fontFamily: 'monospace',
    })

    // Speed bar
    const barW = 200
    this.add.rectangle(130 + barW / 2, y + 60, barW, 8, 0x1f1035)
    const fill = Math.round((kart.speed / 280) * barW)
    this.add.rectangle(130, y + 60, fill, 8, 0xe879f9).setOrigin(0, 0.5)

    // Status / action buttons
    if (equipped) {
      this.add.text(600, y + 30, 'EQUIPPED', {
        fontSize: '13px', color: '#22ff88', fontFamily: 'monospace', stroke: '#000', strokeThickness: 1,
      }).setOrigin(0.5)
    } else if (owned) {
      this._makeButton(600, y + 30, 'EQUIP', async () => {
        try {
          const resp = await apiClient.post('/api/shop/equip', { cartId: kart.id }) as UserProfile
          this.user.equipped_cart = resp.equipped_cart
          this.scene.restart({ user: this.user })
        } catch (e) {
          console.error('Equip failed', e)
        }
      })
    } else {
      const canAfford = this.user.money >= kart.price
      const btnColor = canAfford ? '#e879f9' : '#555555'
      const btn = this._makeButton(600, y + 30, `BUY $${kart.price}`, async () => {
        if (!canAfford) return
        try {
          const resp = await apiClient.post('/api/shop/buy', { cartId: kart.id }) as UserProfile
          this.user.money = resp.money
          this.user.owned_carts = resp.owned_carts
          moneyText.setText(`$${this.user.money}`)
          this.scene.restart({ user: this.user })
        } catch (e) {
          console.error('Buy failed', e)
        }
      }, btnColor)
      if (!canAfford) btn.setAlpha(0.5)
    }

    void card  // suppress unused warning
  }

  private _makeButton(
    x: number, y: number, label: string,
    onClick: () => void,
    textColor = '#e879f9',
  ): Phaser.GameObjects.Text {
    const bg = this.add.rectangle(x, y, label.length * 11 + 20, 34, 0x2d1b4e)
      .setStrokeStyle(2, 0x7c3aed).setInteractive({ useHandCursor: true })
    const txt = this.add.text(x, y, label, {
      fontSize: '13px', color: textColor, fontFamily: 'monospace',
    }).setOrigin(0.5)

    bg.on('pointerover', () => { bg.setFillStyle(0x4c1d95) })
    bg.on('pointerout',  () => { bg.setFillStyle(0x2d1b4e) })
    bg.on('pointerdown', onClick)
    return txt
  }
}
