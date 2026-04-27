/**
 * PlayerSprite.js
 * Composant visuel d'un joueur : personnage humanisé personnalisable,
 * pseudo, score, effets de ralentissement et d'attaque.
 */
import * as Phaser from 'phaser';
import { 
  SKIN_COLORS, HAIR_STYLES, HAIR_COLORS, BEARD_STYLES, 
  GLASSES_STYLES, CLOTHING_COLORS, DEFAULT_AVATAR 
} from '../data/avatars.js';
import { toIso, ISO_TILE_H } from '../data/map.js';

export class PlayerSprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {Player} player
   * @param {number} [depth=10]
   */
  constructor(scene, player, depth = 10) {
    this.scene  = scene;
    this.player = player;

    // Récupérer la config d'avatar (soit personnalisé, soit défaut)
    this.avatarConfig = player.avatarConfig || { ...DEFAULT_AVATAR };
    
    // Position ISO : les "pieds" du personnage au centre du losange
    const { x: ix, y: iy } = toIso(player.col, player.row);
    const px = ix;
    const py = iy + ISO_TILE_H / 2;

    // ── Conteneur principal ──────────────────────────
    this.container = scene.add.container(px, py);
    this.container.setDepth(depth);

    // Conteneur pour les parties du corps (pour animations)
    this.bodyParts = {};

    // Ombre portée
    const shadow = scene.add.ellipse(1, 18, 32, 12, 0x000000, 0.3);

    // Halo ralentissement (invisible par défaut)
    this.slowHalo = scene.add.circle(0, 0, 28, 0x9b59b6, 0);

    // Créer le personnage humanisé
    this._createHumanCharacter();

    // Indicateur joueur local (triangle doré au-dessus)
    this.localArrow = scene.add.triangle(0, -55, 0, 0, -6, 10, 6, 10, 0xffd700);
    this.localArrow.setVisible(player.isLocal);

    // Label pseudo
    this.nameText = scene.add.text(0, -70, player.nickname, {
      fontSize:        '10px',
      fontFamily:      'Arial',
      color:           '#ffffff',
      stroke:          '#000000',
      strokeThickness: 3,
      align:           'center',
    }).setOrigin(0.5);

    // Label score
    this.scoreText = scene.add.text(0, 30, `${player.score}pts`, {
      fontSize:        '9px',
      fontFamily:      'Arial',
      color:           '#ffd700',
      stroke:          '#000000',
      strokeThickness: 2,
      align:           'center',
    }).setOrigin(0.5);

    this.container.add([
      shadow,
      this.slowHalo,
      this.localArrow,
      this.nameText,
      this.scoreText,
    ]);

    this.walkTween = null;
  }

  /**
   * Créer un personnage humanisé avec toutes les parties du corps
   */
  _createHumanCharacter() {
    const cfg = this.avatarConfig;
    const skinColor = SKIN_COLORS[cfg.skinColor]?.color || SKIN_COLORS[0].color;
    const clothingColor = CLOTHING_COLORS[cfg.clothingColor]?.color || CLOTHING_COLORS[1].color;
    const hairColor = HAIR_COLORS[cfg.hairColor]?.color || HAIR_COLORS[0].color;

    // ── JAMBES ──────────────────────────────────────
    // Jambe gauche
    this.bodyParts.legLeft = this.scene.add.container(-5, 10);
    const legL = this.scene.add.rectangle(0, 0, 7, 16, clothingColor);
    const footL = this.scene.add.ellipse(0, 9, 8, 5, 0x333333);
    this.bodyParts.legLeft.add([legL, footL]);
    this.container.add(this.bodyParts.legLeft);

    // Jambe droite
    this.bodyParts.legRight = this.scene.add.container(5, 10);
    const legR = this.scene.add.rectangle(0, 0, 7, 16, clothingColor);
    const footR = this.scene.add.ellipse(0, 9, 8, 5, 0x333333);
    this.bodyParts.legRight.add([legR, footR]);
    this.container.add(this.bodyParts.legRight);

    // ── CORPS ───────────────────────────────────────
    this.bodyParts.torso = this.scene.add.rectangle(0, -5, 20, 22, clothingColor);
    this.bodyParts.torso.setStrokeStyle(1, 0x000000, 0.3);
    this.container.add(this.bodyParts.torso);

    // ── BRAS ────────────────────────────────────────
    // Bras gauche
    this.bodyParts.armLeft = this.scene.add.container(-12, -3);
    const armL = this.scene.add.rectangle(0, 0, 6, 14, clothingColor);
    const handL = this.scene.add.circle(0, 8, 3, skinColor);
    this.bodyParts.armLeft.add([armL, handL]);
    this.container.add(this.bodyParts.armLeft);

    // Bras droit
    this.bodyParts.armRight = this.scene.add.container(12, -3);
    const armR = this.scene.add.rectangle(0, 0, 6, 14, clothingColor);
    const handR = this.scene.add.circle(0, 8, 3, skinColor);
    this.bodyParts.armRight.add([armR, handR]);
    this.container.add(this.bodyParts.armRight);

    // ── COU ─────────────────────────────────────────
    this.bodyParts.neck = this.scene.add.rectangle(0, -17, 6, 4, skinColor);
    this.container.add(this.bodyParts.neck);

    // ── TÊTE ────────────────────────────────────────
    this.bodyParts.head = this.scene.add.circle(0, -25, 10, skinColor);
    this.bodyParts.head.setStrokeStyle(1, 0x000000, 0.2);
    this.container.add(this.bodyParts.head);

    // ── CHEVEUX ─────────────────────────────────────
    this._drawHair(hairColor);

    // ── VISAGE ──────────────────────────────────────
    // Yeux
    const eyeL = this.scene.add.circle(-4, -27, 2.5, 0xffffff);
    const eyeR = this.scene.add.circle(4, -27, 2.5, 0xffffff);
    const pupL = this.scene.add.circle(-3.5, -27, 1.5, 0x111111);
    const pupR = this.scene.add.circle(4.5, -27, 1.5, 0x111111);
    this.container.add([eyeL, eyeR, pupL, pupR]);

    // Sourire
    const smile = this.scene.add.graphics();
    smile.lineStyle(1.5, 0x333333, 1);
    smile.beginPath();
    smile.arc(0, -20, 5, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160));
    smile.strokePath();
    this.container.add(smile);

    // ── BARBE (si homme) ────────────────────────────
    if (cfg.gender === "male" && cfg.beardStyle > 0) {
      this._drawBeard(hairColor);
    }

    // ── LUNETTES ────────────────────────────────────
    if (cfg.glassesStyle > 0) {
      this._drawGlasses();
    }
  }

  _drawHair(hairColor) {
    const cfg = this.avatarConfig;
    const hairStyle = HAIR_STYLES[cfg.hairStyle]?.type || "short";
    
    const hair = this.scene.add.graphics();
    hair.fillStyle(hairColor);

    switch (hairStyle) {
      case "bald":
        // Pas de cheveux
        break;
      case "short":
        // Cheveux courts - demi-cercle sur le haut
        hair.fillCircle(0, -30, 11);
        hair.fillRect(-11, -30, 22, 6);
        break;
      case "medium":
        // Cheveux mi-longs
        hair.fillCircle(0, -30, 12);
        hair.fillRect(-12, -30, 24, 8);
        break;
      case "long":
        // Cheveux longs tombant sur les épaules
        hair.fillCircle(0, -30, 12);
        hair.fillRect(-12, -30, 24, 12);
        hair.fillEllipse(-10, -14, 6, 10);
        hair.fillEllipse(10, -14, 6, 10);
        break;
      case "curly":
        // Cheveux bouclés (plusieurs cercles)
        hair.fillCircle(-8, -32, 6);
        hair.fillCircle(0, -34, 6);
        hair.fillCircle(8, -32, 6);
        hair.fillCircle(-4, -28, 5);
        hair.fillCircle(4, -28, 5);
        break;
      case "ponytail":
        // Queue de cheval
        hair.fillCircle(0, -30, 11);
        hair.fillRect(-11, -30, 22, 6);
        hair.fillEllipse(0, -22, 6, 12);
        break;
    }
    
    this.container.add(hair);
  }

  _drawBeard(hairColor) {
    const cfg = this.avatarConfig;
    const beardStyle = BEARD_STYLES[cfg.beardStyle]?.type || "none";
    
    if (beardStyle === "none") return;

    const beard = this.scene.add.graphics();
    beard.fillStyle(hairColor);

    switch (beardStyle) {
      case "short":
        // Barbe courte - contour du bas de la tête
        beard.fillEllipse(0, -17, 12, 6);
        break;
      case "long":
        // Barbe longue
        beard.fillEllipse(0, -17, 12, 6);
        beard.fillEllipse(0, -14, 10, 8);
        break;
      case "goatee":
        // Bouc - juste au menton
        beard.fillEllipse(0, -17, 6, 6);
        break;
      case "mustache":
        // Moustache
        beard.fillEllipse(-4, -23, 6, 3);
        beard.fillEllipse(4, -23, 6, 3);
        break;
    }
    
    this.container.add(beard);
  }

  _drawGlasses() {
    const cfg = this.avatarConfig;
    const glassesStyle = GLASSES_STYLES[cfg.glassesStyle]?.type || "none";
    
    if (glassesStyle === "none") return;

    const glasses = this.scene.add.graphics();
    
    switch (glassesStyle) {
      case "round":
        // Lunettes rondes
        glasses.lineStyle(2, 0x333333, 1);
        glasses.strokeCircle(-4, -27, 4);
        glasses.strokeCircle(4, -27, 4);
        glasses.lineBetween(-0.5, -27, 0.5, -27);
        break;
      case "rect":
        // Lunettes rectangulaires
        glasses.lineStyle(2, 0x333333, 1);
        glasses.strokeRect(-8, -29, 7, 5);
        glasses.strokeRect(1, -29, 7, 5);
        glasses.lineBetween(-1, -26.5, 1, -26.5);
        break;
      case "sun":
        // Lunettes de soleil (verres noirs)
        glasses.fillStyle(0x111111, 0.8);
        glasses.fillRoundedRect(-8, -29, 7, 5, 2);
        glasses.fillRoundedRect(1, -29, 7, 5, 2);
        glasses.lineStyle(2, 0x333333, 1);
        glasses.strokeRoundedRect(-8, -29, 7, 5, 2);
        glasses.strokeRoundedRect(1, -29, 7, 5, 2);
        glasses.lineBetween(-1, -26.5, 1, -26.5);
        break;
    }
    
    this.container.add(glasses);
  }


  // ─────────────────────────────────────────
  // Déplacement avec tween fluide et animation de marche
  // ─────────────────────────────────────────

  /**
   * @param {number} col
   * @param {number} row
   * @param {number} [duration=180]
   */
  moveTo(col, row, duration = 180) {
    const { x, y } = toIso(col, row);
    const tx = x;
    const ty = y + ISO_TILE_H / 2;
    
    // Déplacement principal
    this.scene.tweens.add({
      targets:  this.container,
      x:        tx,
      y:        ty,
      duration: duration,
      ease:     'Cubic.easeOut',
    });
    
    // Rebond vertical léger (donne l'impression de marcher)
    this.scene.tweens.add({
      targets:  this.container,
      y:        ty - 6,
      duration: duration / 2,
      ease:     'Quad.easeOut',
      yoyo:     true,
    });

    // Animation de marche - balancement des jambes et bras
    this._animateWalk(duration);
  }

  _animateWalk(duration) {
    // Arrêter l'animation précédente si elle existe
    if (this.walkTween) {
      this.walkTween.forEach(t => t.stop());
    }
    this.walkTween = [];

    const steps = 3; // Nombre de pas pendant le déplacement

    // Jambe gauche - mouvement avant/arrière
    this.walkTween.push(
      this.scene.tweens.add({
        targets: this.bodyParts.legLeft,
        y: 8,
        duration: duration / (steps * 2),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: steps - 1,
      })
    );

    // Jambe droite - mouvement opposé
    this.walkTween.push(
      this.scene.tweens.add({
        targets: this.bodyParts.legRight,
        y: 12,
        duration: duration / (steps * 2),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: steps - 1,
      })
    );

    // Bras gauche - balancement
    this.walkTween.push(
      this.scene.tweens.add({
        targets: this.bodyParts.armLeft,
        angle: 15,
        duration: duration / (steps * 2),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: steps - 1,
      })
    );

    // Bras droit - balancement opposé
    this.walkTween.push(
      this.scene.tweens.add({
        targets: this.bodyParts.armRight,
        angle: -15,
        duration: duration / (steps * 2),
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: steps - 1,
      })
    );
  }

  // ─────────────────────────────────────────
  // Mise à jour du score
  // ─────────────────────────────────────────

  updateScore(score) {
    this.scoreText.setText(`${score}pts`);
  }

  // ─────────────────────────────────────────
  // Effets visuels
  // ─────────────────────────────────────────

  setSlowEffect(active) {
    const clothingColor = CLOTHING_COLORS[this.avatarConfig.clothingColor]?.color || CLOTHING_COLORS[1].color;
    this.slowHalo.setAlpha(active ? 0.4 : 0);
    if (this.bodyParts.torso) {
      this.bodyParts.torso.setFillStyle(active ? 0x9b59b6 : clothingColor);
    }
  }

  showAttackHit() {
    // Shake + flash rouge
    this.scene.tweens.add({
      targets:  this.container,
      x:        this.container.x + 5,
      duration: 60,
      ease:     'Linear',
      yoyo:     true,
      repeat:   3,
    });

    const flash = this.scene.add.circle(
      this.container.x,
      this.container.y,
      32, 0xff0000, 0.6,
    ).setDepth(50);
    this.scene.tweens.add({
      targets:  flash,
      alpha:    0,
      scaleX:   2.5,
      scaleY:   2.5,
      duration: 350,
      onComplete: () => flash.destroy(),
    });
  }

  showQuizPoint(points) {
    const txt = this.scene.add.text(
      this.container.x,
      this.container.y - 50,
      `+${points}`,
      { fontSize: '18px', fontFamily: 'Arial Black', color: '#00ff88', stroke: '#000', strokeThickness: 3 },
    ).setOrigin(0.5).setDepth(200);

    this.scene.tweens.add({
      targets:  txt,
      y:        this.container.y - 90,
      alpha:    0,
      duration: 1000,
      ease:     'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  destroy() {
    if (this.walkTween) {
      this.walkTween.forEach(t => t.stop());
    }
    this.container.destroy();
  }

  /** Position pixel X du centre */
  get x() { return this.container.x; }
  /** Position pixel Y du centre */
  get y() { return this.container.y; }
}
