import type Phaser from 'phaser'
import { Duck, type HatId, type OutfitId } from './duck'

export type Mood = 'calm'|'curious'|'grumpy'|'playful'
export type Intent = 'idle'|'approach'|'circle'|'splash'

export type Cmd =
  | ['spawnDuck', string, number, number]
  | ['equip', string, HatId]
  | ['move', string, 'up' | 'down' | 'left' | 'right', number]
  | ['say', string, string]
  | ['setMood', string, Mood]
  | ['setIntent', string, Intent, string?]
  | ['outfit', string, OutfitId]
  | ['setOutfitByTempC', string, number]
  | ['adjustOutfitByDeltaC', string, number]

interface Brain { mood: Mood; energy: number; intent: Intent; target?: string }

export class CommandBus {
  scene: Phaser.Scene
  ducks = new Map<string, Duck>()
  tileSize = 16
  queue: Cmd[] = []
  brains = new Map<string, Brain>()

  constructor(scene: Phaser.Scene) { this.scene = scene }

  // Immediate execution (batch)
  run(cmds: Cmd[]): void { for (const c of cmds) this.exec(c) }
  // Queue-based feeding (for AI / timers)
  feed(cmds: Cmd[]): void { this.queue.push(...cmds) }

  tick(dt: number): void {
    // 1) Drain queue
    if (this.queue.length) {
      const items = this.queue.splice(0, this.queue.length)
      for (const c of items) this.exec(c)
    }

    // 2) Placeholder autonomous logic (optional)
    for (const [id, brain] of this.brains) {
      brain.energy = clamp(brain.energy + (brain.intent==='idle'? +0.0008 : -0.0006)*dt, 0, 1)
      if (Math.random() < 0.002 * (0.4 + brain.energy)) {
        const others = [...this.ducks.keys()].filter(o => o !== id)
        if (others.length) {
          brain.target = others[Math.floor(Math.random()*others.length)]
          const intent: Intent = brain.mood==='grumpy' ? 'splash' : brain.mood==='curious'? 'approach' : brain.mood==='playful'? 'circle' : 'idle'
          this.exec(['setIntent', id, intent, brain.target])
        }
      }

      if (brain.intent === 'approach' && brain.target) {
        const me = this.ducks.get(id); const target = this.ducks.get(brain.target)
        if (me && target) {
          const dx = Math.sign((target.x - me.x))
          const dy = Math.sign((target.y - me.y))
          const dir = Math.abs(dx)>Math.abs(dy) ? (dx<0?'left':'right') : (dy<0?'up':'down')
          this.exec(['move', id, dir as any, 1])
        }
      } else if (brain.intent === 'circle' && brain.target) {
        const me = this.ducks.get(id); const target = this.ducks.get(brain.target)
        if (me && target) {
          const dirs: any[] = ['right','down','left','up']
          const dir = dirs[Math.floor(Math.random()*4)]
          this.exec(['move', id, dir as any, 1])
        }
      } else if (brain.intent === 'splash' && brain.target) {
        this.exec(['say', id, 'splash!'])
        brain.intent = 'idle'
      }
    }
  }

  exec(c: Cmd): void {
    switch (c[0]) {
      case 'spawnDuck': {
        const [, id, gx, gy] = c as ['spawnDuck', string, number, number]
        const d = new Duck(this.scene, gx * this.tileSize + 8, gy * this.tileSize + 8)
        this.scene.add.existing(d)
        this.ducks.set(id, d)
        if (!this.brains.has(id)) this.brains.set(id, { mood: 'calm', energy: 0.7, intent: 'idle' })
        break
      }

      case 'equip': {
        const [, id, hat] = c as ['equip', string, HatId]
        this.ducks.get(id)?.setHat(hat)
        break
      }

      case 'outfit': {
        const [, id, outfit] = c as ['outfit', string, OutfitId]
        this.ducks.get(id)?.setOutfit(outfit)
        break
      }

      case 'setOutfitByTempC': {
        const [, id, tempC] = c as ['setOutfitByTempC', string, number]
        const outfit = outfitForTempC(tempC)
        this.exec(['outfit', id, outfit])
        break
      }

      case 'adjustOutfitByDeltaC': {
        const [, id, deltaC] = c as ['adjustOutfitByDeltaC', string, number]
        const duck = this.ducks.get(id); if (!duck) break
        const cur = duck.getOutfit()
        const next = adjustOutfitByDelta(cur, deltaC)
        if (next !== cur) this.exec(['outfit', id, next])
        break
      }

      case 'move': {
        const [, id, dir, tiles] = c as ['move', string, 'up'|'down'|'left'|'right', number]
        const d = this.ducks.get(id); if (!d) break
        const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0
        const dy = dir === 'up'   ? -1 : dir === 'down'  ? 1 : 0
        const nx = d.x + dx * tiles * this.tileSize
        const ny = d.y + dy * tiles * this.tileSize
        this.scene.tweens.add({ targets: d, x: nx, y: ny, duration: Math.max(80, 140 * tiles), ease: 'Linear' })
        break
      }

      case 'say': {
        const [, id, text] = c as ['say', string, string]
        const d = this.ducks.get(id); if (!d) break
        const bubble = this.scene.add.text(d.x, d.y - 24, text, {
          fontFamily: 'monospace', fontSize: '8px', color: '#ffffff', backgroundColor: '#000000'
        }).setOrigin(0.5, 1)
        this.scene.time.delayedCall(1200, () => bubble.destroy())
        break
      }

      case 'setMood': {
        const [, id, mood] = c as ['setMood', string, Mood]
        const b = this.brains.get(id) ?? { mood:'calm', energy:0.7, intent:'idle' as Intent }
        b.mood = mood; this.brains.set(id, b)
        break
      }

      case 'setIntent': {
        const [, id, intent, target] = c as ['setIntent', string, Intent, string?]
        const b = this.brains.get(id) ?? { mood:'calm', energy:0.7, intent:'idle' as Intent }
        b.intent = intent; b.target = target; this.brains.set(id, b)
        break
      }
    }
  }
}

// --- helpers ---
function outfitForTempC(t:number): OutfitId {
  if (t <= 0) return 'parka'
  if (t <= 10) return 'hoodie'
  if (t <= 22) return 'tshirt'
  return 'tube'
}

function adjustOutfitByDelta(cur: OutfitId, deltaC: number): OutfitId {
  // deltaC = latest - earliest. Negative => colder => wear MORE.
  if (deltaC >= 10) return lighter(cur)
  if (deltaC <= -10) return heavier(cur)
  return cur
}

function lighter(cur: OutfitId): OutfitId {
  switch (cur) {
    case 'parka': return 'hoodie'
    case 'hoodie': return 'tshirt'
    case 'tshirt': return 'tube'
    case 'none': return 'tshirt'
    default: return cur
  }
}

function heavier(cur: OutfitId): OutfitId {
  switch (cur) {
    case 'tube': return 'tshirt'
    case 'tshirt': return 'hoodie'
    case 'hoodie': return 'parka'
    case 'none': return 'hoodie'
    default: return cur
  }
}

function clamp(v:number, lo:number, hi:number){ return Math.max(lo, Math.min(hi, v)) }
