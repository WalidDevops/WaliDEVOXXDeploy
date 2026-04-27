/**
 * PlayerSprite.js
 * Sprite de joueur avec Arcade Physics et animations directionnelles.
 * Gère le mouvement fluide, les animations de marche et les effets visuels.
 */
import * as Phaser from 'phaser';
import { AvatarManager } from '../managers/AvatarManager.js';

export class PlayerSprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {Player} player
   * @param {number} x - Position X initiale
   * @param {number} y - Position Y initiale
   */
  constructor(scene, player, x, y) {
    this.scene = scene;
    this.player = player;

    // Générer le spritesheet personnalisé si config disponible
    let spriteKey = 'male'; // Par défaut
    if (player.avatarConfig) {
      spriteKey = AvatarManager.generateCustomAvatar(scene, player.avatarConfig);
    } else if (player.avatarId !== undefined) {
      // Utiliser l'avatarId pour déterminer male/female
      spriteKey = player.avatarId % 2 === 0 ? 'male' : 'female';
    }

    this.spriteKey = spriteKey;

    // ── Créer le sprite avec physique ──────────────────
    this.sprite = scene.physics.add.sprite(x, y, spriteKey, 0);
    this.sprite.setDepth(10);
    this.sprite.setCollideWorldBounds(true);
    
    // Ajuster la hitbox (collision au niveau des pieds)
    this.sprite.body.setSize(24, 16);
    this.sprite.body.setOffset(4, 32);

    // ── Labels (pseudo et score) ────────────────────────
    this._createLabels();

    // ── Indicateur joueur local ─────────────────────────
    if (player.isLocal) {
      this.localIndicator = scene.add.triangle(0, -30, 0, 0, -6, 10, 6, 10, 0xffd700);
      this.localIndicator.setDepth(11);
    }

    // ── Effets visuels ──────────────────────────────────
    this.slowEffect = scene.add.circle(0, 0, 20, 0x9b59b6, 0);
    this.slowEffect.setDepth(9);

    // État d'animation
    this.currentAnim = 'idle';
    this.lastDirection = 'down';

    // Jouer l'animation idle par défaut
    this.playAnimation('idle');
  }

  /**
   * Crée les labels de texte (pseudo et score)
   * @private
   */
  _createLabels() {
    // Pseudo
    this.nameText = this.scene.add.text(0, -40, this.player.nickname, {
      fontSize: '10px',
      fontFamily: 'Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
      align: 'center',
    }).setOrigin(0.5).setDepth(12);

    // Score
    this.scoreText = this.scene.add.text(0, 20, `${this.player.score}pts`, {
      fontSize: '9px',
      fontFamily: 'Arial',
      color: '#ffd700',
      stroke: '#000000',
      strokeThickness: 2,
      align: 'center',
    }).setOrigin(0.5).setDepth(12);
  }

  /**
   * Met à jour la position des éléments UI
   * Appelé chaque frame
   */
  update() {
    // Synchroniser les labels avec le sprite
    this.nameText.setPosition(this.sprite.x, this.sprite.y - 40);
    this.scoreText.setPosition(this.sprite.x, this.sprite.y + 20);
    
    if (this.localIndicator) {
      this.localIndicator.setPosition(this.sprite.x, this.sprite.y - 30);
    }
    
    if (this.slowEffect) {
      this.slowEffect.setPosition(this.sprite.x, this.sprite.y);
    }
  }

  /**
   * Déplace le joueur avec vélocité normalisée
   * @param {number} vx - Vélocité X (-1 à 1)
   * @param {number} vy - Vélocité Y (-1 à 1)
   * @param {number} speed - Vitesse de déplacement
   */
  move(vx, vy, speed) {
    // Normaliser le vecteur de déplacement
    const length = Math.sqrt(vx * vx + vy * vy);
    if (length > 0) {
      vx /= length;
      vy /= length;
    }

    // Appliquer la vélocité
    this.sprite.setVelocity(vx * speed, vy * speed);

    // Déterminer l'animation à jouer
    if (vx === 0 && vy === 0) {
      this.playAnimation('idle');
    } else {
      // Déterminer la direction dominante
      let direction;
      if (Math.abs(vx) > Math.abs(vy)) {
        direction = vx > 0 ? 'right' : 'left';
      } else {
        direction = vy > 0 ? 'down' : 'up';
      }
      this.lastDirection = direction;
      this.playAnimation(`walk-${direction}`);
    }
  }

  /**
   * Arrête le mouvement du joueur
   */
  stop() {
    this.sprite.setVelocity(0, 0);
    this.playAnimation('idle');
  }

  /**
   * Joue une animation si elle est différente de l'actuelle
   * @param {string} animName - Nom de l'animation sans le préfixe du sprite
   */
  playAnimation(animName) {
    const fullAnimKey = `${this.spriteKey}-${animName}`;
    
    // Ne jouer que si l'animation est différente
    if (this.currentAnim !== animName) {
      if (this.scene.anims.exists(fullAnimKey)) {
        this.sprite.anims.play(fullAnimKey, true);
        this.currentAnim = animName;
      }
    }
  }

  /**
   * Met à jour le score affiché
   * @param {number} score
   */
  updateScore(score) {
    this.scoreText.setText(`${score}pts`);
  }

  /**
   * Active/désactive l'effet de ralentissement
   * @param {boolean} active
   */
  setSlowEffect(active) {
    this.slowEffect.setAlpha(active ? 0.4 : 0);
    if (active) {
      this.sprite.setTint(0x9b59b6);
    } else {
      this.sprite.clearTint();
    }
  }

  /**
   * Affiche un effet visuel d'attaque subie
   */
  showAttackHit() {
    // Shake du sprite
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + 5,
      duration: 60,
      ease: 'Linear',
      yoyo: true,
      repeat: 3,
    });

    // Flash rouge
    const flash = this.scene.add.circle(
      this.sprite.x,
      this.sprite.y,
      32,
      0xff0000,
      0.6
    ).setDepth(50);

    this.scene.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 2.5,
      scaleY: 2.5,
      duration: 350,
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Affiche un texte flottant de points gagnés
   * @param {number} points
   */
  showQuizPoint(points) {
    const txt = this.scene.add.text(
      this.sprite.x,
      this.sprite.y - 30,
      `+${points}`,
      {
        fontSize: '18px',
        fontFamily: 'Arial Black',
        color: '#00ff88',
        stroke: '#000',
        strokeThickness: 3,
      }
    ).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets: txt,
      y: this.sprite.y - 70,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  /**
   * Détruit le sprite et tous ses éléments
   */
  destroy() {
    if (this.sprite) this.sprite.destroy();
    if (this.nameText) this.nameText.destroy();
    if (this.scoreText) this.scoreText.destroy();
    if (this.localIndicator) this.localIndicator.destroy();
    if (this.slowEffect) this.slowEffect.destroy();
  }

  /** Position X du sprite */
  get x() { return this.sprite.x; }
  
  /** Position Y du sprite */
  get y() { return this.sprite.y; }

  /** Body physique pour les collisions */
  get body() { return this.sprite.body; }

  /** Définir la position */
  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }
}
