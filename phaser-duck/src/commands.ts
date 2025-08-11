import type Phaser from 'phaser'
import { Duck, type HatId } from './duck'

export type Cmd =
  | ['spawnDuck', string, number, number]
  | ['equip', string, HatId]
  | ['move', string, 'up' | 'down' | 'left' | 'right', number]
  | ['say', string, string]

export class CommandBus {
  scene: Phaser.Scene
  ducks = new Map<string, Duck>()
  tileSize = 16

  constructor(scene: Phaser.Scene) { this.scene = scene }

  run(cmds: Cmd[]) {
    for (const c of cmds) this.exec(c)
  }

  exec(c: Cmd) {
    const [op, ...args] = c
    if (op === 'spawnDuck') {
      const [id, gx, gy] = args as [string, number, number]
      const d = new Duck(this.scene, gx * this.tileSize + 8, gy * this.tileSize + 8)
      this.scene.add.existing(d)
      this.ducks.set(id, d)
      return
    }
    if (op === 'equip') {
      const [id, hat] = args as [string, HatId]
      this.ducks.get(id)?.setHat(hat)
      return
    }
    if (op === 'move') {
      const [id, dir, tiles] = args as [string, 'up'|'down'|'left'|'right', number]
      const d = this.ducks.get(id)
      if (!d) return
      const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
      const dy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0
      const nx = d.x + dx * tiles * this.tileSize
      const ny = d.y + dy * tiles * this.tileSize
      this.scene.tweens.add({ targets: d, x: nx, y: ny, duration: 140 * tiles, ease: 'Linear' })
      return
    }
    if (op === 'say') {
      const [id, text] = args as [string, string]
      const d = this.ducks.get(id)
      if (!d) return
      const bubble = this.scene.add.text(d.x, d.y - 24, text, {
        fontFamily: 'monospace', fontSize: '8px', color: '#ffffff', backgroundColor: '#000000'
      }).setOrigin(0.5, 1)
      this.scene.time.delayedCall(1200, () => bubble.destroy())
      return
    }
  }
}