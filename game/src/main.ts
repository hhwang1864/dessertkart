import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { LoginScene } from './scenes/LoginScene'
import { MenuScene } from './scenes/MenuScene'
import { RaceScene } from './scenes/RaceScene'
import { ResultsScene } from './scenes/ResultsScene'
import { ShopScene } from './scenes/ShopScene'

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 608,
  backgroundColor: '#c2a05a',
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
    },
  },
  scene: [BootScene, LoginScene, MenuScene, RaceScene, ResultsScene, ShopScene],
}

new Phaser.Game(config)
