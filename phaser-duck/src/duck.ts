import Phaser from 'phaser'

export type HatId = 'none' | 'top_hat' | 'cowboy' | 'party'

export class Duck extends Phaser.GameObjects.Container {
  bodySprite: Phaser.GameObjects.Sprite
  hatSprite: Phaser.GameObjects.Sprite

  private floatT = 0
  private hatId: HatId = 'none'

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)

    // Create textures once per scene (idempotent)
    ensureGeneratedTextures(scene)

    // Base duck sprite (2-frame "swim" flaps)
    this.bodySprite = scene.add.sprite(0, 0, 'duck_atlas', 0)
    this.bodySprite.setOrigin(0.5, 0.6) // slight lower pivot for hat placement

    // Hat sprite as child; starts invisible
    this.hatSprite = scene.add.sprite(0, -8, 'hat_atlas', 0)
    this.hatSprite.setOrigin(0.5, 0.9)
    this.hatSprite.visible = false

    this.add(this.bodySprite)
    this.add(this.hatSprite)

    // Create simple animation
    const animKey = 'duck:swim'
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: [
          { key: 'duck_atlas', frame: 0 },
          { key: 'duck_atlas', frame: 1 }
        ],
        frameRate: 4,
        repeat: -1
      })
    }
    this.bodySprite.play(animKey)
  }

  setHat(h: HatId) {
    this.hatId = h
    if (h === 'none') {
      this.hatSprite.visible = false
      return
    }
    const frame = ({
      'top_hat': 0,
      'cowboy': 1,
      'party': 2,
    } as const)[h]
    this.hatSprite.setFrame(frame)
    this.hatSprite.visible = true
  }

updateBobbing(delta: number) {
  this.floatT += delta * 0.002
  this.y += Math.sin(this.floatT) * 0.2
}
}

// --- helpers: generate pixel textures programmatically ---
function ensureGeneratedTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('duck_atlas')) {
    const gfx = scene.add.graphics()

    // Frame 0: duck body idle
    gfx.clear()
    gfx.fillStyle(0xffff66, 1)
    gfx.fillEllipse(0, 0, 14, 10)
    gfx.fillStyle(0xffcc33, 1) // head
    gfx.fillEllipse(6, -3, 8, 8)
    gfx.fillStyle(0xff9933, 1) // beak
    gfx.fillRect(10, -2, 4, 3)
    const f0 = gfx.generateTexture('duck_f0', 24, 24)

    // Frame 1: tiny wing change
    gfx.clear()
    gfx.fillStyle(0xffff66, 1)
    gfx.fillEllipse(0, 0, 14, 10)
    gfx.fillStyle(0xffcc33, 1)
    gfx.fillEllipse(6, -3, 8, 8)
    gfx.fillStyle(0xff9933, 1)
    gfx.fillRect(10, -2, 4, 3)
    // wing hint
    gfx.fillStyle(0xffe680, 1)
    gfx.fillEllipse(-2, 0, 6, 3)
    const f1 = gfx.generateTexture('duck_f1', 24, 24)

    gfx.destroy()

    // Build atlas-like frames (simple texture frames)
    const rt = scene.make.renderTexture({ width: 48, height: 24 }, false)
    rt.draw('duck_f0', 0, 0)
    rt.draw('duck_f1', 24, 0)
    rt.saveTexture('duck_atlas')
    rt.destroy()

    // Cleanup temp frames
    scene.textures.remove('duck_f0')
    scene.textures.remove('duck_f1')
  }

  if (!scene.textures.exists('hat_atlas')) {
    const rt = scene.make.renderTexture({ width: 72, height: 24 }, false)

    // top hat (frame 0)
    let g = scene.add.graphics()
    g.fillStyle(0x222222, 1)
    g.fillRect(6, 6, 12, 8) // cylinder
    g.fillRect(2, 12, 20, 3) // brim
    g.generateTexture('hat_top', 24, 24)
    g.destroy()
    rt.draw('hat_top', 0, 0)
    scene.textures.remove('hat_top')

    // cowboy (frame 1)
    g = scene.add.graphics()
    g.fillStyle(0x8b5a2b, 1)
    g.fillEllipse(12, 12, 18, 6)
    g.fillStyle(0x5a3a1b, 1)
    g.fillRect(8, 6, 8, 6)
    g.generateTexture('hat_cowboy', 24, 24)
    g.destroy()
    rt.draw('hat_cowboy', 24, 0)
    scene.textures.remove('hat_cowboy')

    // party (frame 2)
    g = scene.add.graphics()
    g.fillStyle(0xff66cc, 1)
    g.fillTriangle(8, 14, 16, 14, 12, 4)
    g.fillStyle(0xffffff, 1)
    g.fillCircle(12, 3, 2)
    g.generateTexture('hat_party', 24, 24)
    g.destroy()
    rt.draw('hat_party', 48, 0)
    scene.textures.remove('hat_party')

    rt.saveTexture('hat_atlas')
    rt.destroy()
  }
}