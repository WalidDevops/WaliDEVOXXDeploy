/**
 * AvatarManager.js
 * Gestion des avatars humanisés avec génération de spritesheets
 * et création d'animations directionnelles.
 */
import * as Phaser from 'phaser';
import { SKIN_COLORS, HAIR_COLORS, CLOTHING_COLORS } from '../data/avatars.js';

export class AvatarManager {
  /**
   * Génère les spritesheets pour les avatars homme et femme
   * @param {Phaser.Scene} scene
   */
  static generateSpritesheets(scene) {
    // Dimensions d'une frame
    const frameWidth = 32;
    const frameHeight = 48;
    const framesPerAnim = 4;
    const directions = 4; // down, left, right, up

    // Générer spritesheet homme
    this._generateHumanSpritesheet(scene, 'male', frameWidth, frameHeight, {
      skinColor: 0xfde4c7,
      hairColor: 0x4a2511,
      shirtColor: 0x3498db,
      pantsColor: 0x2c3e50,
    });

    // Générer spritesheet femme
    this._generateHumanSpritesheet(scene, 'female', frameWidth, frameHeight, {
      skinColor: 0xfde4c7,
      hairColor: 0xc0392b,
      shirtColor: 0xe91e63,
      pantsColor: 0x8e44ad,
    });
  }

  /**
   * Génère un spritesheet humanisé complet
   * @private
   */
  static _generateHumanSpritesheet(scene, key, frameW, frameH, colors) {
    const framesPerAnim = 4;
    const directions = 4;
    const totalWidth = frameW * framesPerAnim;
    const totalHeight = frameH * directions;

    // Créer une texture vide
    const texture = scene.textures.createCanvas(
      `${key}_spritesheet`,
      totalWidth,
      totalHeight
    );
    const ctx = texture.getContext();

    // Dessiner chaque direction (down, left, right, up)
    const directionData = [
      { name: 'down', row: 0 },
      { name: 'left', row: 1 },
      { name: 'right', row: 2 },
      { name: 'up', row: 3 },
    ];

    directionData.forEach(({ name, row }) => {
      for (let frame = 0; frame < framesPerAnim; frame++) {
        const x = frame * frameW;
        const y = row * frameH;
        this._drawHumanFrame(ctx, x, y, frameW, frameH, colors, name, frame);
      }
    });

    texture.refresh();

    // Enregistrer comme spritesheet
    scene.textures.addSpriteSheet(key, texture.getSourceImage(), {
      frameWidth: frameW,
      frameHeight: frameH,
    });
  }

  /**
   * Dessine une frame d'animation d'un personnage
   * @private
   */
  static _drawHumanFrame(ctx, x, y, w, h, colors, direction, frame) {
    const centerX = x + w / 2;
    const centerY = y + h / 2;

    // Animation de marche (décalage vertical pour simuler le pas)
    const walkOffset = frame % 2 === 0 ? 0 : 2;
    const legOffset = frame === 1 ? -2 : frame === 3 ? 2 : 0;

    // ─── OMBRE ──────────────────────────────────────
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(centerX, y + h - 4, 8, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // ─── JAMBES ─────────────────────────────────────
    ctx.fillStyle = this._colorToHex(colors.pantsColor);
    
    // Jambe gauche
    ctx.fillRect(
      centerX - 6,
      centerY + 6 + walkOffset + (frame === 1 ? legOffset : 0),
      5,
      14
    );
    // Pied gauche
    ctx.fillStyle = '#333333';
    ctx.fillRect(
      centerX - 6,
      centerY + 19 + walkOffset + (frame === 1 ? legOffset : 0),
      5,
      4
    );

    // Jambe droite
    ctx.fillStyle = this._colorToHex(colors.pantsColor);
    ctx.fillRect(
      centerX + 1,
      centerY + 6 + walkOffset + (frame === 3 ? legOffset : 0),
      5,
      14
    );
    // Pied droit
    ctx.fillStyle = '#333333';
    ctx.fillRect(
      centerX + 1,
      centerY + 19 + walkOffset + (frame === 3 ? legOffset : 0),
      5,
      4
    );

    // ─── CORPS ──────────────────────────────────────
    ctx.fillStyle = this._colorToHex(colors.shirtColor);
    ctx.fillRect(centerX - 8, centerY - 2 + walkOffset, 16, 16);

    // ─── BRAS ───────────────────────────────────────
    const armSwing = frame === 1 ? 2 : frame === 3 ? -2 : 0;

    // Bras gauche
    ctx.fillStyle = this._colorToHex(colors.shirtColor);
    ctx.fillRect(
      centerX - 11,
      centerY + walkOffset + armSwing,
      4,
      12
    );
    // Main gauche
    ctx.fillStyle = this._colorToHex(colors.skinColor);
    ctx.beginPath();
    ctx.arc(centerX - 9, centerY + 12 + walkOffset + armSwing, 2, 0, Math.PI * 2);
    ctx.fill();

    // Bras droit
    ctx.fillStyle = this._colorToHex(colors.shirtColor);
    ctx.fillRect(
      centerX + 7,
      centerY + walkOffset - armSwing,
      4,
      12
    );
    // Main droite
    ctx.fillStyle = this._colorToHex(colors.skinColor);
    ctx.beginPath();
    ctx.arc(centerX + 9, centerY + 12 + walkOffset - armSwing, 2, 0, Math.PI * 2);
    ctx.fill();

    // ─── COU ────────────────────────────────────────
    ctx.fillStyle = this._colorToHex(colors.skinColor);
    ctx.fillRect(centerX - 3, centerY - 8 + walkOffset, 6, 4);

    // ─── TÊTE ───────────────────────────────────────
    ctx.fillStyle = this._colorToHex(colors.skinColor);
    ctx.beginPath();
    ctx.arc(centerX, centerY - 12 + walkOffset, 7, 0, Math.PI * 2);
    ctx.fill();

    // ─── CHEVEUX ────────────────────────────────────
    ctx.fillStyle = this._colorToHex(colors.hairColor);
    
    if (direction === 'up') {
      // Vue de dos - cheveux visibles
      ctx.fillRect(centerX - 7, centerY - 19 + walkOffset, 14, 8);
    } else if (direction === 'down') {
      // Vue de face - cheveux au-dessus
      ctx.fillRect(centerX - 7, centerY - 19 + walkOffset, 14, 6);
    } else {
      // Vue de profil
      if (direction === 'left') {
        ctx.fillRect(centerX - 7, centerY - 19 + walkOffset, 10, 8);
      } else {
        ctx.fillRect(centerX - 3, centerY - 19 + walkOffset, 10, 8);
      }
    }

    // ─── VISAGE ─────────────────────────────────────
    if (direction === 'down') {
      // Yeux (vue de face)
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX - 3, centerY - 13 + walkOffset, 1.5, 0, Math.PI * 2);
      ctx.arc(centerX + 3, centerY - 13 + walkOffset, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Bouche
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY - 9 + walkOffset, 2, 0, Math.PI);
      ctx.stroke();
    } else if (direction === 'left' || direction === 'right') {
      // Œil (vue de profil)
      const eyeX = direction === 'left' ? centerX - 2 : centerX + 2;
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(eyeX, centerY - 13 + walkOffset, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /**
   * Crée les animations pour un avatar
   * @param {Phaser.Scene} scene
   * @param {string} key - 'male' ou 'female'
   */
  static createAnimations(scene, key) {
    const animationConfig = [
      { name: 'idle', start: 0, end: 0, frameRate: 1, repeat: -1 },
      { name: 'walk-down', start: 0, end: 3, frameRate: 8, repeat: -1 },
      { name: 'walk-left', start: 4, end: 7, frameRate: 8, repeat: -1 },
      { name: 'walk-right', start: 8, end: 11, frameRate: 8, repeat: -1 },
      { name: 'walk-up', start: 12, end: 15, frameRate: 8, repeat: -1 },
    ];

    animationConfig.forEach(({ name, start, end, frameRate, repeat }) => {
      const animKey = `${key}-${name}`;
      
      // Vérifier si l'animation existe déjà
      if (!scene.anims.exists(animKey)) {
        scene.anims.create({
          key: animKey,
          frames: scene.anims.generateFrameNumbers(key, { start, end }),
          frameRate,
          repeat,
        });
      }
    });
  }

  /**
   * Convertit une couleur hexa en string CSS
   * @private
   */
  static _colorToHex(color) {
    return '#' + color.toString(16).padStart(6, '0');
  }

  /**
   * Personnalise les couleurs d'un avatar selon la config
   * @param {Phaser.Scene} scene
   * @param {object} config - Configuration de l'avatar
   * @returns {string} clé du spritesheet généré
   */
  static generateCustomAvatar(scene, config) {
    const key = `avatar_${Date.now()}`;
    const frameW = 32;
    const frameH = 48;

    // Déterminer les couleurs selon la config
    const colors = this._getColorsFromConfig(config);

    // Générer le spritesheet personnalisé
    this._generateHumanSpritesheet(scene, key, frameW, frameH, colors);

    // Créer les animations
    this.createAnimations(scene, key);

    return key;
  }

  /**
   * Obtient les couleurs à partir de la configuration d'avatar
   * @private
   */
  static _getColorsFromConfig(config) {
    return {
      skinColor: SKIN_COLORS[config.skinColor]?.color || 0xfde4c7,
      hairColor: HAIR_COLORS[config.hairColor]?.color || 0x4a2511,
      shirtColor: CLOTHING_COLORS[config.clothingColor]?.color || 0x3498db,
      pantsColor: config.gender === 'female' ? 0x8e44ad : 0x2c3e50,
    };
  }
}
