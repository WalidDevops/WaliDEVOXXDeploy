/**
 * Preloader.js
 * Génère toutes les textures du jeu programmatiquement (Graphics → generateTexture).
 * Génère les spritesheets d'avatars humanisés.
 * Affiche un écran de chargement animé, puis démarre MainMenuScene.
 *
 * Textures générées :
 *   grass, grass2, path, building_wall, building_interior,
 *   tree, quiz_zone, attack_icon, male, female (spritesheets)
 */
import { Scene } from 'phaser';
import { AvatarManager } from '../managers/AvatarManager.js';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Fond ────────────────────────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a2a1a);
    this.add.text(W / 2, H / 2 - 60, '🌿 Escape Garden', {
      fontSize: '38px', fontFamily: 'Arial Black', color: '#4ade80',
      stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, H / 2 - 10, 'Chargement…', {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Barre de progression décorative
    const barBg = this.add.rectangle(W / 2, H / 2 + 30, 340, 16, 0x333333);
    const bar   = this.add.rectangle(W / 2 - 170, H / 2 + 30, 4, 12, 0x4ade80).setOrigin(0, 0.5);

    // ── Génération textures ──────────────────────────────
    const TASKS = [
      () => this._makeGrass(),
      () => this._makePath(),
      () => this._makeBuildingWall(),
      () => this._makeBuildingInterior(),
      () => this._makeTree(),
      () => this._makeQuizZone(),
      () => this._makeAvatarSprites(),
    ];

    let done = 0;
    const total = TASKS.length;

    const runNext = () => {
      if (done >= total) {
        this.time.delayedCall(400, () => this.scene.start('MainMenuScene'));
        return;
      }
      TASKS[done]();
      done++;
      bar.width = (done / total) * 336;
      this.time.delayedCall(60, runNext);
    };

    this.time.delayedCall(100, runNext);
  }

  // ── Génération des spritesheets d'avatars ────────────
  _makeAvatarSprites() {
    // Générer les spritesheets pour homme et femme
    AvatarManager.generateSpritesheets(this);
    
    // Créer les animations
    AvatarManager.createAnimations(this, 'male');
    AvatarManager.createAnimations(this, 'female');
  }

  // ── Helpers texture ──────────────────────────────────

  _gfx() {
    return this.make.graphics({ x: 0, y: 0, add: false });
  }

  /** Herbe claire */
  _makeGrass() {
    const g = this._gfx();
    g.fillStyle(0x5aad5a); g.fillRect(0, 0, 48, 48);
    g.fillStyle(0x4fa44f, 0.4);
    [[6,10],[22,4],[35,20],[10,34],[40,38]].forEach(([x,y]) => g.fillRect(x, y, 3, 8));
    g.generateTexture('grass', 48, 48);
    g.destroy();
  }

  /** Herbe sombre (damier) */
  _makePath() {
    const g = this._gfx();
    g.fillStyle(0xd4b896); g.fillRect(0, 0, 48, 48);
    g.fillStyle(0xc8a87e, 0.5);
    g.fillRect(0, 0, 24, 24); g.fillRect(24, 24, 24, 24);
    g.generateTexture('path', 48, 48);
    g.destroy();
  }

  /** Mur de bâtiment */
  _makeBuildingWall() {
    const g = this._gfx();
    // Fond mur
    g.fillStyle(0x8b7355); g.fillRect(0, 0, 48, 48);
    // Briques
    g.lineStyle(1, 0x6b5335, 0.6);
    for (let r = 0; r < 48; r += 12) {
      const offset = (r / 12 % 2) * 12;
      for (let c = -12 + offset; c < 48; c += 24) {
        g.strokeRect(c, r, 24, 12);
      }
    }
    g.generateTexture('building_wall', 48, 48);
    g.destroy();
  }

  /** Intérieur de bâtiment */
  _makeBuildingInterior() {
    const g = this._gfx();
    g.fillStyle(0x5c4a3a); g.fillRect(0, 0, 48, 48);
    g.fillStyle(0x4a3a2a, 0.6);
    g.fillRect(0, 0, 24, 24); g.fillRect(24, 24, 24, 24);
    g.generateTexture('building_interior', 48, 48);
    g.destroy();
  }

  /** Arbre (vue top-down) */
  _makeTree() {
    const g = this._gfx();
    // Tronc
    g.fillStyle(0x6b4226); g.fillRect(20, 28, 8, 20);
    // Feuillage – 3 cercles superposés
    g.fillStyle(0x2d6a2d); g.fillCircle(24, 20, 20);
    g.fillStyle(0x3a8a3a); g.fillCircle(24, 16, 16);
    g.fillStyle(0x4aaa4a); g.fillCircle(24, 12, 11);
    // Reflet
    g.fillStyle(0x6acc6a, 0.35); g.fillCircle(18, 10, 6);
    g.generateTexture('tree', 48, 48);
    g.destroy();
  }

  /** Zone quiz */
  _makeQuizZone() {
    const g = this._gfx();
    g.fillStyle(0x1a4a8a); g.fillRect(0, 0, 48, 48);
    g.fillStyle(0x2266cc, 0.6); g.fillCircle(24, 24, 20);
    g.lineStyle(2, 0x55aaff, 0.8); g.strokeCircle(24, 24, 20);
    g.generateTexture('quiz_zone_base', 48, 48);
    g.destroy();
  }
}

