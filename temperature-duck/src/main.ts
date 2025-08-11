import Phaser from 'phaser'
import { CommandBus, type Cmd } from './commands'

const WIDTH = 320
const HEIGHT = 180

class DuckScene extends Phaser.Scene {
  bus!: CommandBus
  water!: Phaser.GameObjects.TileSprite
  debugText!: Phaser.GameObjects.Text

  // debug state
  private tempBuffer: number[] = [] // oldest -> latest
  private lastDelta: number | null = null
  private lastTemp: number | null = null

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

    // Debug HUD (top-left)
    this.debugText = this.add.text(4, 4, '', {
      fontFamily: 'monospace', fontSize: '10px', color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.35)'
    })
    this.debugText.setDepth(999).setScrollFactor(0)

    // Spawn a couple ducks
    const script: Cmd[] = [
      ['spawnDuck', 'd1', 6, 5],
      ['spawnDuck', 'd2', 10, 9]
    ]
    this.bus.run(script)

    // Listen for outfit changes to refresh HUD and log
    this.events.on('outfitChanged', (id: string, outfit: string) => {
      console.log(`[OutfitChanged] ${id} -> ${outfit}`)
      this.refreshHUD()
    })

    // Temperature tracker — keeps last 3 samples (oldest → latest).
    const SAMPLE_MS = import.meta.env.DEV ? 60_000 : 3_600_000 // 1 min in dev, 1 hour in prod

    const sampleOnce = async () => {
      const temp = await getCurrentTempC()
      if (temp == null) return

      this.lastTemp = temp
      console.log(`[TempSample] ${new Date().toLocaleString()} temp=${temp.toFixed(1)}°C`)

      this.tempBuffer.push(temp)
      if (this.tempBuffer.length > 3) this.tempBuffer.shift()

      // On first sample, dress ducks to current temp.
      if (this.tempBuffer.length === 1) {
        for (const id of this.bus.ducks.keys()) this.bus.exec(['setOutfitByTempC', id, temp])
      }

      // When we have 3 samples, check delta and adjust one step if ≥ 10 °C
      if (this.tempBuffer.length === 3) {
        const earliest = this.tempBuffer[0]
        const latest = this.tempBuffer[2]
        const delta = latest - earliest // negative means colder
        this.lastDelta = delta
        console.log(`[TempBuffer] earliest=${earliest.toFixed(1)} latest=${latest.toFixed(1)} Δ=${delta.toFixed(1)}°C`)
        if (Math.abs(delta) >= 10) {
          for (const id of this.bus.ducks.keys()) this.bus.exec(['adjustOutfitByDeltaC', id, delta])
        }
      }

      this.refreshHUD()
    }

    // Kick off sampling now and on an interval
    sampleOnce()
    setInterval(sampleOnce, SAMPLE_MS)

    // Expose for quick console testing
    ;(window as any).bus = this.bus

    // Scene update loop
    const cursors = this.input.keyboard?.createCursorKeys()
    this.events.on('update', (_t: number, dt: number) => {
      // Faux water motion: scroll the TileSprite a bit
      this.water.tilePositionX += dt * 0.01
      this.water.tilePositionY += dt * 0.02

      // Process queued commands and placeholder brains
      this.bus.tick(dt)

      // Bob all ducks smoothly
      this.bus.ducks.forEach(duck => duck.updateBobbing(dt))

      // Optional: allow arrow-key nudging in dev
      if (import.meta.env.DEV) {
        const step = 2
        const d1 = this.bus.ducks.get('d1')
        if (d1 && cursors) {
          if (cursors.left?.isDown) d1.x -= step
          if (cursors.right?.isDown) d1.x += step
          if (cursors.up?.isDown) d1.y -= step
          if (cursors.down?.isDown) d1.y += step
        }
      }
    })

    // Initial HUD paint
    this.refreshHUD()
  }

  private refreshHUD() {
    const b = this.tempBuffer
    const bufStr = b.length ? `[${b.map(v => v.toFixed(1)).join(', ')}]` : '[]'
    const deltaStr = this.lastDelta == null ? '—' : `${this.lastDelta.toFixed(1)}°C`
    const tempStr = this.lastTemp == null ? '—' : `${this.lastTemp.toFixed(1)}°C`

    const outfits = [...this.bus.ducks.entries()].map(([id, d]) => `${id}:${d.getOutfit()}`).join('  ')

    this.debugText.setText(
      `Temp: ${tempStr}\n` +
      `Buffer: ${bufStr}\n` +
      `Delta: ${deltaStr}\n` +
      `Outfits: ${outfits}`
    )
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

// --- helpers ---
async function getCurrentTempC(): Promise<number | null> {
  try {
    const { coords } = await getPosition()
    const lat = coords?.latitude ?? 43.651070 // Toronto fallback
    const lon = coords?.longitude ?? -79.347015
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=celsius`
    const res = await fetch(url)
    const data = await res.json()
    const t = data?.current?.temperature_2m
    return (typeof t === 'number') ? t : null
  } catch {
    return null
  }
}

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) { reject(new Error('no geo')); return }
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, maximumAge: 5*60_000, timeout: 10_000 })
  })
}