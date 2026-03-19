import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload() {
    // Players spritesheet: 24x24 tiles, 1px spacing, 4x4 grid = 16 tiles
    this.load.spritesheet('players', '/assets/PNG/Players/Tilemap/tilemap_packed.png', {
      frameWidth: 24,
      frameHeight: 24,
    })

    // Enemies spritesheet: 24x24 tiles, 1px spacing
    this.load.spritesheet('enemies', '/assets/PNG/Enemies/Tilemap/tilemap_packed.png', {
      frameWidth: 24,
      frameHeight: 24,
    })

    // Terrain tiles: 16x16
    this.load.spritesheet('tiles', '/assets/PNG/Tiles/Tilemap/tilemap_packed.png', {
      frameWidth: 16,
      frameHeight: 16,
    })

    // Interface tiles: 16x16
    this.load.spritesheet('interface', '/assets/PNG/Interface/Tilemap/tilemap_packed.png', {
      frameWidth: 16,
      frameHeight: 16,
    })

    // Sound effects
    this.load.audio('coin-a', '/assets/Sounds/coin-a.ogg')
    this.load.audio('coin-b', '/assets/Sounds/coin-b.ogg')
    this.load.audio('coin-c', '/assets/Sounds/coin-c.ogg')
    this.load.audio('coin-d', '/assets/Sounds/coin-d.ogg')
    this.load.audio('select-a', '/assets/Sounds/select-a.ogg')
    this.load.audio('move-a', '/assets/Sounds/move-a.ogg')
    this.load.audio('move-b', '/assets/Sounds/move-b.ogg')
    this.load.audio('jump-a', '/assets/Sounds/jump-a.ogg')
    this.load.audio('explosion-a', '/assets/Sounds/explosion-a.ogg')
    this.load.audio('lose-a', '/assets/Sounds/lose-a.ogg')
    this.load.audio('lose-b', '/assets/Sounds/lose-b.ogg')
    this.load.audio('shoot-a', '/assets/Sounds/shoot-a.ogg')
    this.load.audio('error-a', '/assets/Sounds/error-a.ogg')
    this.load.audio('hurt-a', '/assets/Sounds/hurt-a.ogg')

    // Loading progress bar
    const { width, height } = this.scale
    const barBg = this.add.rectangle(width / 2, height / 2 + 40, 300, 20, 0x2d1b4e)
    barBg.setStrokeStyle(2, 0x7c3aed)
    const bar = this.add.rectangle(width / 2 - 150, height / 2 + 40, 0, 18, 0xe879f9)
    bar.setOrigin(0, 0.5)

    const titleText = this.add.text(width / 2, height / 2, 'DESSERTKART', {
      fontSize: '32px',
      color: '#e879f9',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    const loadingText = this.add.text(width / 2, height / 2 + 70, 'Loading...', {
      fontSize: '14px',
      color: '#a78bfa',
      fontFamily: 'monospace',
    }).setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      bar.width = 298 * value
      loadingText.setText(`Loading... ${Math.floor(value * 100)}%`)
    })

    void titleText  // referenced in DOM
  }

  create() {
    this.scene.start('LoginScene')
  }
}
