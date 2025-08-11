import Phaser from 'phaser'
import { CommandBus, type Cmd } from './commands'

const WIDTH = 320
const HEIGHT = 180

class DuckScene extends Phaser.Scene {
  bus!: CommandBus
  water!: Phaser.GameObjects.TileSprite

  preload() {}

  create() {
    // Pixel-art friendly settings
    this.cameras.main.setBackgroundColor(0x223344)

    // Create a simple repeating water texture procedurally
    if (!this.textures.exists('water_tex')) {
      const g = this.add.graphics()
      g.fillStyle(0x3a7bd5, 1)
      g.fillRect(0, 0, 16, 16)
      g.fillStyle(0x2e5fa2, 1)
      g.fillRect(0, 12, 16, 4)
      g.fillRect(0, 5, 16, 2)
      g.generateTexture('water_tex', 16, 16)
      g.destroy()
    }

    // TileSprite makes an infinite tiled background we can scroll for a faux-water effect
    this.water = this.add.tileSprite(0, 0, WIDTH, HEIGHT, 'water_tex').setOrigin(0, 0)

    this.bus = new CommandBus(this)

    // Example: feed some commands to prove the pipeline
    const script: Cmd[] = [
      ['spawnDuck', 'd1', 6, 5],
      ['equip', 'd1', 'top_hat'],
      ['spawnDuck', 'd2', 10, 9],
      ['equip', 'd2', 'party'],
      ['say', 'd1', 'quack!'],
      ['move', 'd1', 'right', 4],
      ['move', 'd2', 'up', 3]
    ]
    this.bus.run(script)

    // Keyboard for quick manual testing
const cursors = this.input.keyboard?.createCursorKeys()

this.input.keyboard?.on('keydown', (evt: KeyboardEvent) => {
  if (evt.key.toLowerCase() === 'h') this.bus.exec(['equip', 'd1', 'cowboy'])
  if (evt.key.toLowerCase() === 't') this.bus.exec(['equip', 'd1', 'top_hat'])
  if (evt.key.toLowerCase() === 'n') this.bus.exec(['equip', 'd1', 'none'])
  if (evt.key.toLowerCase() === 'p') this.bus.exec(['equip', 'd1', 'party'])
})

    this.events.on('update', (_t: number, dt: number) => {
      // Faux water motion: scroll the TileSprite a bit
      this.water.tilePositionX += dt * 0.01
      this.water.tilePositionY += dt * 0.02

      // Move d1 with arrow keys for fun
      const step = 2
      const d1 = this.bus.ducks.get('d1')
      if (!d1) return
        if (cursors!.left?.isDown) d1.x -= step
        if (cursors!.right?.isDown) d1.x += step
        if (cursors!.up?.isDown) d1.y -= step
        if (cursors!.down?.isDown) d1.y += step
    })
  }
}

new Phaser.Game({
  type: Phaser.WEBGL,
  parent: 'app',
  backgroundColor: '#000000',
  scale: {
    width: WIDTH,
    height: HEIGHT,
    zoom: 3,           // integer zoom for crisp pixels
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  render: { pixelArt: true, antialias: false },
  scene: [DuckScene]
})