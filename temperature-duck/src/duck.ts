import Phaser from 'phaser'

export type HatId = 'none' | 'top_hat' | 'cowboy' | 'party'
export type OutfitId = 'none' | 'parka' | 'hoodie' | 'tshirt' | 'tube'

type WearableHat = Exclude<HatId, 'none'>
const HAT_FRAME: Record<WearableHat, number> = {
  top_hat: 0,
  cowboy: 1,
  party: 2,
} as const

type WearableOutfit = Exclude<OutfitId, 'none'>
const OUTFIT_FRAME: Record<WearableOutfit, number> = {
  parka: 0,
  hoodie: 1,
  tshirt: 2,
  tube: 3,
} as const

export class Duck extends Phaser.GameObjects.Container {
  bodySprite: Phaser.GameObjects.Sprite
  hatSprite: Phaser.GameObjects.Sprite
  outfitSprite: Phaser.GameObjects.Sprite

  private floatT = 0
  private hatId: HatId = 'none'
  private outfitId: OutfitId = 'none'

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y)

    ensureGeneratedTextures(scene)

    // Base duck sprite (2-frame swim)
    this.bodySprite = scene.add.sprite(0, 0, 'duck_atlas', 0)
    this.bodySprite.setOrigin(0.5, 0.6)

    // Outfit overlay
    this.outfitSprite = scene.add.sprite(0, 0, 'outfit_atlas', 0)
    this.outfitSprite.setOrigin(0.5, 0.6)
    this.outfitSprite.visible = false

    // Hat overlay
    this.hatSprite = scene.add.sprite(0, -8, 'hat_atlas', 0)
    this.hatSprite.setOrigin(0.5, 0.9)
    this.hatSprite.visible = false

    this.add([this.bodySprite, this.outfitSprite, this.hatSprite])

    const animKey = 'duck:swim'
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: [
          { key: 'duck_atlas', frame: 0 },
          { key: 'duck_atlas', frame: 1 },
        ],
        frameRate: 4,
        repeat: -1,
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
    this.hatSprite.setFrame(HAT_FRAME[h as WearableHat])
    this.hatSprite.visible = true
  }

  setOutfit(o: OutfitId) {
    if (o === 'none') {
      this.outfitSprite.visible = false
      this.outfitId = o
      return
    }
    this.outfitSprite.setFrame(OUTFIT_FRAME[o as WearableOutfit])
    this.outfitSprite.visible = true
    this.outfitId = o
  }

  getOutfit(): OutfitId { return this.outfitId }

  updateBobbing(delta: number) {
    this.floatT += delta * 0.002
    this.y += Math.sin(this.floatT) * 0.2
  }
}

// --- texture generation ---
function ensureGeneratedTextures(scene: Phaser.Scene) {
  if (!scene.textures.exists('duck_atlas')) {
    // frame 0
    let g = scene.add.graphics()
    g.fillStyle(0xffff66, 1) // body
    g.fillEllipse(12, 16, 16, 10)
    g.fillStyle(0xffcc33, 1) // head
    g.fillEllipse(16, 10, 8, 8)
    g.fillStyle(0xff9933, 1) // beak
    g.fillRect(20, 10, 4, 3)
    g.generateTexture('duck_f0', 24, 24)
    g.destroy()

    // frame 1 (wing hint)
    g = scene.add.graphics()
    g.fillStyle(0xffff66, 1)
    g.fillEllipse(12, 16, 16, 10)
    g.fillStyle(0xffcc33, 1)
    g.fillEllipse(16, 10, 8, 8)
    g.fillStyle(0xff9933, 1)
    g.fillRect(20, 10, 4, 3)
    g.fillStyle(0xffe680, 1)
    g.fillEllipse(9, 16, 6, 3)
    g.generateTexture('duck_f1', 24, 24)
    g.destroy()

    const rt = scene.make.renderTexture({ width: 48, height: 24 }, false)
    rt.draw('duck_f0', 0, 0)
    rt.draw('duck_f1', 24, 0)
    rt.saveTexture('duck_atlas')
    rt.destroy()
    scene.textures.remove('duck_f0')
    scene.textures.remove('duck_f1')
  }

  if (!scene.textures.exists('hat_atlas')) {
    const rt = scene.make.renderTexture({ width: 72, height: 24 }, false)

    // top hat
    let g = scene.add.graphics()
    g.fillStyle(0x222222, 1)
    g.fillRect(6, 9, 12, 8)
    g.fillRect(2, 16, 20, 3)
    g.generateTexture('hat_top', 24, 24)
    g.destroy()
    rt.draw('hat_top', 0, 0)
    scene.textures.remove('hat_top')

    // cowboy
    g = scene.add.graphics()
    g.fillStyle(0x8b5a2b, 1)
    g.fillEllipse(12, 16, 18, 6)
    g.fillStyle(0x5a3a1b, 1)
    g.fillRect(8, 10, 8, 6)
    g.generateTexture('hat_cowboy', 24, 24)
    g.destroy()
    rt.draw('hat_cowboy', 24, 0)
    scene.textures.remove('hat_cowboy')

    // party
    g = scene.add.graphics()
    g.fillStyle(0xff66cc, 1)
    g.fillTriangle(8, 18, 16, 18, 12, 6)
    g.fillStyle(0xffffff, 1)
    g.fillCircle(12, 5, 2)
    g.generateTexture('hat_party', 24, 24)
    g.destroy()
    rt.draw('hat_party', 48, 0)
    scene.textures.remove('hat_party')

    rt.saveTexture('hat_atlas')
    rt.destroy()
  }

  if (!scene.textures.exists('outfit_atlas')) {
    const rt = scene.make.renderTexture({ width: 96, height: 24 }, false)

    // parka
    let g = scene.add.graphics()
    g.fillStyle(0x3377ff, 1)
    g.fillRect(4, 14, 16, 10)
    g.fillRect(8, 10, 8, 6)
    g.generateTexture('outfit_parka', 24, 24)
    g.destroy()
    rt.draw('outfit_parka', 0, 0)
    scene.textures.remove('outfit_parka')

    // hoodie
    g = scene.add.graphics()
    g.fillStyle(0x44aa66, 1)
    g.fillRect(5, 14, 14, 9)
    g.fillTriangle(12, 10, 8, 14, 16, 14)
    g.generateTexture('outfit_hoodie', 24, 24)
    g.destroy()
    rt.draw('outfit_hoodie', 24, 0)
    scene.textures.remove('outfit_hoodie')

    // tshirt
    g = scene.add.graphics()
    g.fillStyle(0xffffff, 1)
    g.fillRect(6, 14, 12, 8)
    g.fillRect(4, 14, 4, 3)
    g.fillRect(16, 14, 4, 3)
    g.generateTexture('outfit_tshirt', 24, 24)
    g.destroy()
    rt.draw('outfit_tshirt', 48, 0)
    scene.textures.remove('outfit_tshirt')

    // tube
    g = scene.add.graphics()
    g.fillStyle(0xffd166, 1)
    g.fillEllipse(12, 20, 18, 8)
    g.fillStyle(0x0e0f12, 1)
    g.fillEllipse(12, 20, 10, 4)
    g.generateTexture('outfit_tube', 24, 24)
    g.destroy()
    rt.draw('outfit_tube', 72, 0)
    scene.textures.remove('outfit_tube')

    rt.saveTexture('outfit_atlas')
    rt.destroy()
  }
}