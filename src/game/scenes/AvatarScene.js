/**
 * AvatarScene.js
 * Création d'avatar ultra-rapide : pseudo + genre seulement.
 * L'avatar est généré automatiquement avec des couleurs aléatoires.
 */
import * as Phaser from 'phaser';
import { gameState } from '../services/GameStateService.js';
import { 
  SKIN_COLORS, HAIR_STYLES, HAIR_COLORS, BEARD_STYLES, 
  GLASSES_STYLES, CLOTHING_COLORS, DEFAULT_AVATAR 
} from '../data/avatars.js';

export class AvatarScene extends Phaser.Scene {
  constructor() {
    super('AvatarScene');
    this._nickname = '';
    this._avatarConfig = null;
    this._previewContainer = null;
    this._randomBtnRect = null;
    this._randomBtnText = null;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Récupérer les données sauvegardées ou générer un avatar par défaut
    this._nickname = gameState.getSavedNickname();
    const savedConfig = gameState.getSavedAvatarConfig();
    if (savedConfig) {
      this._avatarConfig = savedConfig;
    } else {
      // Générer un avatar par défaut pour montrer immédiatement un exemple
      const randomGender = Math.random() > 0.5 ? "male" : "female";
      this._avatarConfig = this._generateRandomAvatar(randomGender);
    }

    // ── Fond ────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a2a0a, 0x0a2a0a, 0x0e2a3a, 0x0e2a3a, 1);
    bg.fillRect(0, 0, W, H);

    // ── Titre ───────────────────────────────────────
    this.add.text(W / 2, 30, '🎮 Créer mon personnage', {
      fontSize: '28px', fontFamily: 'Arial Black',
      color: '#4ade80', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // ── Champ pseudo ────────────────────────────────
    this._createNicknameField(W, 70);

    // ── Bouton Générer Avatar (grand et centré) ────
    this._createRandomButton(W / 2, 160);

    // ── Aperçu du personnage (centré et plus bas) ──
    this._createPreview(W / 2, H / 2 + 80);

    // ── Bouton CONTINUER ────────────────────────────
    const btnBg = this.add.rectangle(W / 2, H - 50, 260, 55, 0x16a34a)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(3, 0x4ade80);

    this._btnText = this.add.text(W / 2, H - 50, '🚀  JOUER', {
      fontSize: '24px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    btnBg.on('pointerover',  () => btnBg.setFillStyle(0x22c55e));
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0x16a34a));
    btnBg.on('pointerdown',  () => this._onContinue());

    // ── Retour ──────────────────────────────────────
    const backBtn = this.add.text(60, H - 20, '← Retour', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover',  () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout',   () => backBtn.setColor('#888888'));
    backBtn.on('pointerdown',  () => this.scene.start('MainMenuScene'));

    // ── Bouton Plein écran ──────────────────────────
    this._createFullscreenButton(W - 40, H - 20);
  }

  _createNicknameField(W, y) {
    this.add.text(W / 2, y, 'Ton pseudo', {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#aaaaaa',
    }).setOrigin(0.5);

    const inputBg = this.add.rectangle(W / 2, y + 35, 360, 50, 0x1a3a1a)
      .setStrokeStyle(3, 0x4ade80);

    this._nicknameDisplay = this.add.text(W / 2, y + 35, this._nickname || 'Entre ton pseudo…', {
      fontSize: '20px', fontFamily: 'Arial',
      color: this._nickname ? '#ffffff' : '#666666',
    }).setOrigin(0.5);

    this._cursor = this.add.text(0, y + 35, '|', {
      fontSize: '20px', fontFamily: 'Arial', color: '#4ade80',
    }).setOrigin(0, 0.5);
    this._updateCursorPos();
    this.tweens.add({
      targets: this._cursor, alpha: 0,
      duration: 500, ease: 'Linear', yoyo: true, repeat: -1,
    });

    inputBg.setInteractive({ useHandCursor: true });
    inputBg.on('pointerdown', () => this.game.canvas.focus());

    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Backspace') {
        this._nickname = this._nickname.slice(0, -1);
      } else if (event.key === 'Enter') {
        this._onContinue();
        return;
      } else if (event.key.length === 1 && this._nickname.length < 15) {
        this._nickname += event.key;
      }
      this._nicknameDisplay.setText(this._nickname || 'Entre ton pseudo…');
      this._nicknameDisplay.setColor(this._nickname ? '#ffffff' : '#666666');
      this._updateCursorPos();
    });
  }

  _updateCursorPos() {
    const approxWidth = this._nickname.length * 12;
    this._cursor.setX(this.scale.width / 2 + approxWidth / 2 + 2);
  }

  _createRandomButton(x, y) {
    const btnWidth = 360;
    const btnHeight = 70;

    // Texte au-dessus
    this.add.text(x, y - 30, '✨ Pas content ? Clique encore !', {
      fontSize: '16px', fontFamily: 'Arial', color: '#888888',
      style: { fontStyle: 'italic' }
    }).setOrigin(0.5);

    // Grand bouton unique
    this._randomBtnRect = this.add.rectangle(x, y + 30, btnWidth, btnHeight, 0x6366f1)
      .setStrokeStyle(4, 0x4ade80)
      .setInteractive({ useHandCursor: true });

    this._randomBtnText = this.add.text(x, y + 30, '🎲  GÉNÉRER MON AVATAR', {
      fontSize: '24px', fontFamily: 'Arial Black', color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    // Effets hover
    this._randomBtnRect.on('pointerover', () => {
      this._randomBtnRect.setFillStyle(0x818cf8);
      this._randomBtnRect.setScale(1.05);
      this._randomBtnText.setScale(1.05);
    });
    
    this._randomBtnRect.on('pointerout', () => {
      this._randomBtnRect.setFillStyle(0x6366f1);
      this._randomBtnRect.setScale(1);
      this._randomBtnText.setScale(1);
    });
    
    this._randomBtnRect.on('pointerdown', () => {
      this._generateRandomAvatarFull();
    });
  }

  _generateRandomAvatarFull() {
    // Choisir un genre aléatoire
    const gender = Math.random() > 0.5 ? "male" : "female";
    
    // Générer l'avatar
    this._avatarConfig = this._generateRandomAvatar(gender);
    
    // Animation du bouton
    this.tweens.add({
      targets: [this._randomBtnRect, this._randomBtnText],
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeInOut',
    });
    
    // Mettre à jour l'aperçu avec animation
    this._updatePreview(true);
  }

  _generateRandomAvatar(gender) {
    // Couleurs sympas prédéfinies (éviter les couleurs moches)
    const niceSkinColors = [0, 1, 2]; // Teintes claires et moyennes
    const niceHairColors = [0, 1, 2, 4]; // Brun, noir, blond, roux (pas gris)
    const niceClothingColors = [1, 2, 3, 4, 5]; // Toutes sauf noir pur
    
    const config = {
      gender: gender,
      skinColor: niceSkinColors[Math.floor(Math.random() * niceSkinColors.length)],
      hairStyle: Math.floor(Math.random() * Math.min(HAIR_STYLES.length, 5)),
      hairColor: niceHairColors[Math.floor(Math.random() * niceHairColors.length)],
      beardStyle: 0,
      glassesStyle: Math.random() > 0.7 ? Math.floor(Math.random() * GLASSES_STYLES.length) : 0,
      clothingColor: niceClothingColors[Math.floor(Math.random() * niceClothingColors.length)],
    };
    
    // Pour les hommes, 40% de chance d'avoir une barbe
    if (gender === "male" && Math.random() > 0.6) {
      config.beardStyle = 1 + Math.floor(Math.random() * (BEARD_STYLES.length - 1));
    }
    
    return config;
  }

  _createPreview(x, y) {
    // Conteneur pour le personnage (centré et grand)
    this._previewContainer = this.add.container(x, y);
    
    if (this._avatarConfig) {
      this._updatePreview(false);
    }
  }

  _updatePreview(animate = false) {
    // Nettoyer l'ancien aperçu
    this._previewContainer.removeAll(true);

    if (!this._avatarConfig) return;

    const cfg = this._avatarConfig;
    const skinColor = SKIN_COLORS[cfg.skinColor]?.color || SKIN_COLORS[0].color;
    const clothingColor = CLOTHING_COLORS[cfg.clothingColor]?.color || CLOTHING_COLORS[1].color;
    const hairColor = HAIR_COLORS[cfg.hairColor]?.color || HAIR_COLORS[0].color;

    const scale = 2.5; // Taille optimale pour éviter les chevauchements

    // ═══════════════════════════════════════════════════
    // OMBRE
    // ═══════════════════════════════════════════════════
    const shadow = this.add.ellipse(0, 52, 70, 22, 0x000000, 0.2);
    this._previewContainer.add(shadow);

    // ═══════════════════════════════════════════════════
    // JAMBES (forme plus naturelle)
    // ═══════════════════════════════════════════════════
    const legLeft = this.add.graphics();
    legLeft.fillStyle(clothingColor);
    legLeft.lineStyle(1.5, 0x000000, 0.1);
    legLeft.beginPath();
    legLeft.moveTo(-9 * scale, 0);
    legLeft.lineTo(-11 * scale, 0);
    legLeft.lineTo(-10 * scale, 18 * scale);
    legLeft.lineTo(-6 * scale, 18 * scale);
    legLeft.lineTo(-7 * scale, 0);
    legLeft.closePath();
    legLeft.fillPath();
    legLeft.strokePath();
    this._previewContainer.add(legLeft);

    const legRight = this.add.graphics();
    legRight.fillStyle(clothingColor);
    legRight.lineStyle(1.5, 0x000000, 0.1);
    legRight.beginPath();
    legRight.moveTo(7 * scale, 0);
    legRight.lineTo(11 * scale, 0);
    legRight.lineTo(10 * scale, 18 * scale);
    legRight.lineTo(6 * scale, 18 * scale);
    legRight.lineTo(9 * scale, 0);
    legRight.closePath();
    legRight.fillPath();
    legRight.strokePath();
    this._previewContainer.add(legRight);

    // Pieds avec semelles
    const footLeft = this.add.graphics();
    footLeft.fillStyle(0x1a1a1a);
    footLeft.fillEllipse(-8 * scale, 19 * scale, 14 * scale, 7 * scale);
    footLeft.lineStyle(1.5, 0x000000, 0.3);
    footLeft.strokeEllipse(-8 * scale, 19 * scale, 14 * scale, 7 * scale);
    this._previewContainer.add(footLeft);

    const footRight = this.add.graphics();
    footRight.fillStyle(0x1a1a1a);
    footRight.fillEllipse(8 * scale, 19 * scale, 14 * scale, 7 * scale);
    footRight.lineStyle(1.5, 0x000000, 0.3);
    footRight.strokeEllipse(8 * scale, 19 * scale, 14 * scale, 7 * scale);
    this._previewContainer.add(footRight);

    // ═══════════════════════════════════════════════════
    // TORSE (forme de corps humain)
    // ═══════════════════════════════════════════════════
    const torso = this.add.graphics();
    torso.fillStyle(clothingColor);
    torso.lineStyle(2, 0x000000, 0.12);
    
    // Forme organique du torse avec courbes
    torso.beginPath();
    torso.moveTo(0, -22 * scale); // Haut du torse (cou)
    // Épaule gauche
    torso.lineTo(-8 * scale, -20 * scale);
    torso.lineTo(-12 * scale, -10 * scale);
    torso.lineTo(-11 * scale, 0); // Taille gauche
    torso.lineTo(11 * scale, 0);  // Taille droite
    // Épaule droite
    torso.lineTo(12 * scale, -10 * scale);
    torso.lineTo(8 * scale, -20 * scale);
    torso.lineTo(0, -22 * scale);
    torso.closePath();
    torso.fillPath();
    torso.strokePath();
    this._previewContainer.add(torso);

    // Détails du torse (col et boutons)
    const collar = this.add.graphics();
    collar.lineStyle(2, 0x000000, 0.15);
    collar.beginPath();
    collar.moveTo(-4 * scale, -21 * scale);
    collar.lineTo(-2 * scale, -18 * scale);
    collar.lineTo(2 * scale, -18 * scale);
    collar.lineTo(4 * scale, -21 * scale);
    collar.strokePath();
    this._previewContainer.add(collar);

    // Boutons
    for (let i = 0; i < 3; i++) {
      const btnY = -14 * scale + (i * 5 * scale);
      const btn = this.add.circle(0, btnY, 1.8 * scale, 0xffffff, 0.5);
      btn.setStrokeStyle(0.8, 0x000000, 0.3);
      this._previewContainer.add(btn);
    }

    // ═══════════════════════════════════════════════════
    // BRAS (plus musclés et naturels)
    // ═══════════════════════════════════════════════════
    // Bras gauche
    const armLeft = this.add.graphics();
    armLeft.fillStyle(clothingColor);
    armLeft.lineStyle(1.5, 0x000000, 0.1);
    armLeft.beginPath();
    armLeft.moveTo(-12 * scale, -18 * scale);
    armLeft.lineTo(-18 * scale, -16 * scale);
    armLeft.lineTo(-21 * scale, -8 * scale);
    armLeft.lineTo(-20 * scale, 0);
    armLeft.lineTo(-16 * scale, 0);
    armLeft.lineTo(-17 * scale, -10 * scale);
    armLeft.lineTo(-12 * scale, -15 * scale);
    armLeft.closePath();
    armLeft.fillPath();
    armLeft.strokePath();
    this._previewContainer.add(armLeft);

    // Main gauche
    const handLeft = this.add.graphics();
    handLeft.fillStyle(skinColor);
    handLeft.lineStyle(1.2, 0x000000, 0.08);
    // Paume
    handLeft.fillEllipse(-18 * scale, 2 * scale, 7 * scale, 8 * scale);
    handLeft.strokeEllipse(-18 * scale, 2 * scale, 7 * scale, 8 * scale);
    // Pouce
    handLeft.fillEllipse(-22 * scale, 1 * scale, 3 * scale, 5 * scale);
    this._previewContainer.add(handLeft);

    // Bras droit
    const armRight = this.add.graphics();
    armRight.fillStyle(clothingColor);
    armRight.lineStyle(1.5, 0x000000, 0.1);
    armRight.beginPath();
    armRight.moveTo(12 * scale, -18 * scale);
    armRight.lineTo(18 * scale, -16 * scale);
    armRight.lineTo(21 * scale, -8 * scale);
    armRight.lineTo(20 * scale, 0);
    armRight.lineTo(16 * scale, 0);
    armRight.lineTo(17 * scale, -10 * scale);
    armRight.lineTo(12 * scale, -15 * scale);
    armRight.closePath();
    armRight.fillPath();
    armRight.strokePath();
    this._previewContainer.add(armRight);

    // Main droite
    const handRight = this.add.graphics();
    handRight.fillStyle(skinColor);
    handRight.lineStyle(1.2, 0x000000, 0.08);
    // Paume
    handRight.fillEllipse(18 * scale, 2 * scale, 7 * scale, 8 * scale);
    handRight.strokeEllipse(18 * scale, 2 * scale, 7 * scale, 8 * scale);
    // Pouce
    handRight.fillEllipse(22 * scale, 1 * scale, 3 * scale, 5 * scale);
    this._previewContainer.add(handRight);

    // ═══════════════════════════════════════════════════
    // COU (avec ombrage)
    // ═══════════════════════════════════════════════════
    const neck = this.add.graphics();
    neck.fillStyle(skinColor);
    neck.lineStyle(1, 0x000000, 0.08);
    neck.fillRoundedRect(-4.5 * scale, -25 * scale, 9 * scale, 6 * scale, 2 * scale);
    neck.strokeRoundedRect(-4.5 * scale, -25 * scale, 9 * scale, 6 * scale, 2 * scale);
    this._previewContainer.add(neck);

    // ═══════════════════════════════════════════════════
    // TÊTE (ovale parfait avec ombrage)
    // ═══════════════════════════════════════════════════
    const head = this.add.graphics();
    head.fillStyle(skinColor);
    head.lineStyle(2, 0x000000, 0.12);
    head.fillEllipse(0, -36 * scale, 22 * scale, 24 * scale);
    head.strokeEllipse(0, -36 * scale, 22 * scale, 24 * scale);
    this._previewContainer.add(head);

    // Oreilles (avec détails)
    const earLeft = this.add.graphics();
    earLeft.fillStyle(skinColor);
    earLeft.lineStyle(1.2, 0x000000, 0.1);
    earLeft.fillEllipse(-11 * scale, -36 * scale, 5 * scale, 6 * scale);
    earLeft.strokeEllipse(-11 * scale, -36 * scale, 5 * scale, 6 * scale);
    // Intérieur oreille
    earLeft.fillStyle(skinColor);
    earLeft.fillEllipse(-10.5 * scale, -36 * scale, 2.5 * scale, 3 * scale);
    this._previewContainer.add(earLeft);

    const earRight = this.add.graphics();
    earRight.fillStyle(skinColor);
    earRight.lineStyle(1.2, 0x000000, 0.1);
    earRight.fillEllipse(11 * scale, -36 * scale, 5 * scale, 6 * scale);
    earRight.strokeEllipse(11 * scale, -36 * scale, 5 * scale, 6 * scale);
    // Intérieur oreille
    earRight.fillStyle(skinColor);
    earRight.fillEllipse(10.5 * scale, -36 * scale, 2.5 * scale, 3 * scale);
    this._previewContainer.add(earRight);

    // ═══════════════════════════════════════════════════
    // CHEVEUX
    // ═══════════════════════════════════════════════════
    this._drawPreviewHair(hairColor, scale);

    // ═══════════════════════════════════════════════════
    // VISAGE - YEUX (grands et expressifs)
    // ═══════════════════════════════════════════════════
    // Blanc des yeux
    const eyeLeftWhite = this.add.graphics();
    eyeLeftWhite.fillStyle(0xffffff);
    eyeLeftWhite.lineStyle(2, 0x000000, 0.25);
    eyeLeftWhite.fillEllipse(-5.5 * scale, -37 * scale, 6 * scale, 7 * scale);
    eyeLeftWhite.strokeEllipse(-5.5 * scale, -37 * scale, 6 * scale, 7 * scale);
    this._previewContainer.add(eyeLeftWhite);

    const eyeRightWhite = this.add.graphics();
    eyeRightWhite.fillStyle(0xffffff);
    eyeRightWhite.lineStyle(2, 0x000000, 0.25);
    eyeRightWhite.fillEllipse(5.5 * scale, -37 * scale, 6 * scale, 7 * scale);
    eyeRightWhite.strokeEllipse(5.5 * scale, -37 * scale, 6 * scale, 7 * scale);
    this._previewContainer.add(eyeRightWhite);

    // Iris coloré
    const irisLeft = this.add.circle(-5.5 * scale, -36.5 * scale, 2.8 * scale, 0x4a90e2);
    const irisRight = this.add.circle(5.5 * scale, -36.5 * scale, 2.8 * scale, 0x4a90e2);
    this._previewContainer.add([irisLeft, irisRight]);

    // Pupilles
    const pupLeft = this.add.circle(-5.5 * scale, -36.5 * scale, 2 * scale, 0x0a0a0a);
    const pupRight = this.add.circle(5.5 * scale, -36.5 * scale, 2 * scale, 0x0a0a0a);
    this._previewContainer.add([pupLeft, pupRight]);

    // Reflets (donnent vie au regard)
    const glintLeft = this.add.circle(-4.5 * scale, -38 * scale, 1.2 * scale, 0xffffff, 1);
    const glintRight = this.add.circle(6.5 * scale, -38 * scale, 1.2 * scale, 0xffffff, 1);
    this._previewContainer.add([glintLeft, glintRight]);

    // Petits reflets secondaires
    const glintLeft2 = this.add.circle(-6.5 * scale, -36 * scale, 0.6 * scale, 0xffffff, 0.8);
    const glintRight2 = this.add.circle(4.5 * scale, -36 * scale, 0.6 * scale, 0xffffff, 0.8);
    this._previewContainer.add([glintLeft2, glintRight2]);

    // Cils (petites lignes pour effet féminin optionnel)
    if (cfg.gender === "female") {
      const lashLeft = this.add.graphics();
      lashLeft.lineStyle(1.5, 0x000000, 0.6);
      for (let i = 0; i < 3; i++) {
        const x = -7 * scale + i * 1.5 * scale;
        lashLeft.beginPath();
        lashLeft.moveTo(x, -40 * scale);
        lashLeft.lineTo(x - 0.5 * scale, -41.5 * scale);
        lashLeft.strokePath();
      }
      this._previewContainer.add(lashLeft);

      const lashRight = this.add.graphics();
      lashRight.lineStyle(1.5, 0x000000, 0.6);
      for (let i = 0; i < 3; i++) {
        const x = 4 * scale + i * 1.5 * scale;
        lashRight.beginPath();
        lashRight.moveTo(x, -40 * scale);
        lashRight.lineTo(x + 0.5 * scale, -41.5 * scale);
        lashRight.strokePath();
      }
      this._previewContainer.add(lashRight);
    }

    // Sourcils expressifs
    const browLeft = this.add.graphics();
    browLeft.lineStyle(2.5, hairColor, 0.8);
    browLeft.beginPath();
    browLeft.moveTo(-9 * scale, -43 * scale);
    browLeft.lineTo(-5.5 * scale, -44 * scale);
    browLeft.lineTo(-2 * scale, -43 * scale);
    browLeft.strokePath();
    this._previewContainer.add(browLeft);

    const browRight = this.add.graphics();
    browRight.lineStyle(2.5, hairColor, 0.8);
    browRight.beginPath();
    browRight.moveTo(2 * scale, -43 * scale);
    browRight.lineTo(5.5 * scale, -44 * scale);
    browRight.lineTo(9 * scale, -43 * scale);
    browRight.strokePath();
    this._previewContainer.add(browRight);

    // ═══════════════════════════════════════════════════
    // NEZ (plus réaliste)
    // ═══════════════════════════════════════════════════
    const nose = this.add.graphics();
    nose.lineStyle(1.8, 0x000000, 0.2);
    nose.beginPath();
    nose.moveTo(0, -34 * scale);
    nose.lineTo(-1.5 * scale, -30 * scale);
    nose.moveTo(0, -34 * scale);
    nose.lineTo(1.5 * scale, -30 * scale);
    nose.strokePath();
    // Narines
    nose.fillStyle(0x000000, 0.15);
    nose.fillEllipse(-1.5 * scale, -29.5 * scale, 1.5 * scale, 1 * scale);
    nose.fillEllipse(1.5 * scale, -29.5 * scale, 1.5 * scale, 1 * scale);
    this._previewContainer.add(nose);

    // ═══════════════════════════════════════════════════
    // BOUCHE (sourire charmant)
    // ═══════════════════════════════════════════════════
    const mouth = this.add.graphics();
    mouth.lineStyle(3, 0xd64545, 1);
    mouth.beginPath();
    mouth.arc(0, -26 * scale, 5 * scale, Phaser.Math.DegToRad(25), Phaser.Math.DegToRad(155));
    mouth.strokePath();
    
    // Lèvre supérieure légère
    mouth.lineStyle(1.5, 0xd64545, 0.6);
    mouth.beginPath();
    mouth.moveTo(-4 * scale, -27.5 * scale);
    mouth.lineTo(-2 * scale, -28 * scale);
    mouth.lineTo(0, -28 * scale);
    mouth.lineTo(2 * scale, -28 * scale);
    mouth.lineTo(4 * scale, -27.5 * scale);
    mouth.strokePath();
    this._previewContainer.add(mouth);

    // Dents pour un sourire éclatant
    const teeth = this.add.graphics();
    teeth.fillStyle(0xffffff, 0.9);
    teeth.fillRect(-3 * scale, -27 * scale, 6 * scale, 2 * scale);
    this._previewContainer.add(teeth);

    // ═══════════════════════════════════════════════════
    // JOUES ROSES (blush)
    // ═══════════════════════════════════════════════════
    const blushLeft = this.add.ellipse(-8 * scale, -32 * scale, 5 * scale, 3 * scale, 0xff9999, 0.3);
    const blushRight = this.add.ellipse(8 * scale, -32 * scale, 5 * scale, 3 * scale, 0xff9999, 0.3);
    this._previewContainer.add([blushLeft, blushRight]);

    // ═══════════════════════════════════════════════════
    // BARBE (si homme)
    // ═══════════════════════════════════════════════════
    if (cfg.gender === "male" && cfg.beardStyle > 0) {
      this._drawPreviewBeard(hairColor, scale);
    }

    // ═══════════════════════════════════════════════════
    // LUNETTES
    // ═══════════════════════════════════════════════════
    if (cfg.glassesStyle > 0) {
      this._drawPreviewGlasses(scale);
    }

    // ═══════════════════════════════════════════════════
    // ANIMATION D'APPARITION
    // ═══════════════════════════════════════════════════
    if (animate) {
      this._previewContainer.setScale(0.2);
      this._previewContainer.setAlpha(0);
      this.tweens.add({
        targets: this._previewContainer,
        scale: 1,
        alpha: 1,
        duration: 800,
        ease: 'Elastic.easeOut',
      });
    }
  }

  _drawPreviewHair(hairColor, scale) {
    const hairStyle = HAIR_STYLES[this._avatarConfig.hairStyle]?.type || "short";
    const hair = this.add.graphics();
    hair.fillStyle(hairColor);
    hair.lineStyle(1, 0x000000, 0.2);

    switch (hairStyle) {
      case "bald":
        // Pas de cheveux
        break;
        
      case "short":
        // Cheveux courts classiques
        hair.fillEllipse(0, -46 * scale, 22 * scale, 14 * scale);
        hair.fillRect(-11 * scale, -46 * scale, 22 * scale, 8 * scale);
        break;
        
      case "medium":
        // Cheveux mi-longs
        hair.fillEllipse(0, -46 * scale, 24 * scale, 16 * scale);
        hair.fillRect(-12 * scale, -46 * scale, 24 * scale, 12 * scale);
        // Mèches sur les côtés
        hair.fillEllipse(-12 * scale, -38 * scale, 6 * scale, 8 * scale);
        hair.fillEllipse(12 * scale, -38 * scale, 6 * scale, 8 * scale);
        break;
        
      case "long":
        // Cheveux longs
        hair.fillEllipse(0, -46 * scale, 24 * scale, 16 * scale);
        hair.fillRect(-12 * scale, -46 * scale, 24 * scale, 14 * scale);
        // Mèches longues sur les côtés
        hair.fillEllipse(-13 * scale, -28 * scale, 7 * scale, 14 * scale);
        hair.fillEllipse(13 * scale, -28 * scale, 7 * scale, 14 * scale);
        break;
        
      case "curly":
        // Cheveux bouclés (plusieurs cercles)
        hair.fillCircle(-10 * scale, -50 * scale, 5 * scale);
        hair.fillCircle(-3 * scale, -52 * scale, 5 * scale);
        hair.fillCircle(4 * scale, -52 * scale, 5 * scale);
        hair.fillCircle(11 * scale, -50 * scale, 5 * scale);
        hair.fillCircle(-7 * scale, -45 * scale, 5 * scale);
        hair.fillCircle(0, -47 * scale, 5 * scale);
        hair.fillCircle(7 * scale, -45 * scale, 5 * scale);
        hair.fillCircle(-10 * scale, -40 * scale, 4 * scale);
        hair.fillCircle(10 * scale, -40 * scale, 4 * scale);
        break;
        
      case "ponytail":
        // Queue de cheval
        hair.fillEllipse(0, -46 * scale, 22 * scale, 14 * scale);
        hair.fillRect(-11 * scale, -46 * scale, 22 * scale, 8 * scale);
        // La queue derrière
        hair.fillEllipse(0, -30 * scale, 5 * scale, 14 * scale);
        break;
    }
    
    hair.strokePath();
    this._previewContainer.add(hair);
  }

  _drawPreviewBeard(hairColor, scale) {
    const beardStyle = BEARD_STYLES[this._avatarConfig.beardStyle]?.type || "none";
    if (beardStyle === "none") return;

    const beard = this.add.graphics();
    beard.fillStyle(hairColor);
    beard.lineStyle(1, 0x000000, 0.15);

    switch (beardStyle) {
      case "short":
        // Barbe courte autour du menton
        beard.fillEllipse(0, -23 * scale, 14 * scale, 8 * scale);
        break;
        
      case "long":
        // Barbe longue
        beard.fillEllipse(0, -23 * scale, 14 * scale, 8 * scale);
        beard.fillEllipse(0, -18 * scale, 12 * scale, 10 * scale);
        break;
        
      case "goatee":
        // Bouc (juste sous le menton)
        beard.fillEllipse(0, -23 * scale, 7 * scale, 8 * scale);
        break;
        
      case "mustache":
        // Moustache
        beard.fillEllipse(-5 * scale, -30 * scale, 7 * scale, 4 * scale);
        beard.fillEllipse(5 * scale, -30 * scale, 7 * scale, 4 * scale);
        break;
    }
    
    beard.strokePath();
    this._previewContainer.add(beard);
  }

  _drawPreviewGlasses(scale) {
    const glassesStyle = GLASSES_STYLES[this._avatarConfig.glassesStyle]?.type || "none";
    if (glassesStyle === "none") return;

    const glasses = this.add.graphics();

    switch (glassesStyle) {
      case "round":
        // Lunettes rondes style Harry Potter
        glasses.lineStyle(2.5, 0x2a2a2a, 1);
        glasses.strokeCircle(-5 * scale, -36 * scale, 6 * scale);
        glasses.strokeCircle(5 * scale, -36 * scale, 6 * scale);
        glasses.lineBetween(-1 * scale, -36 * scale, 1 * scale, -36 * scale);
        // Branches
        glasses.lineBetween(-11 * scale, -36 * scale, -14 * scale, -36 * scale);
        glasses.lineBetween(11 * scale, -36 * scale, 14 * scale, -36 * scale);
        break;
      case "rect":
        glasses.lineStyle(2 * scale, 0x333333, 1);
        // Lunettes rondes style Harry Potter
        glasses.lineStyle(2.5, 0x2a2a2a, 1);
        glasses.strokeCircle(-5 * scale, -36 * scale, 6 * scale);
        glasses.strokeCircle(5 * scale, -36 * scale, 6 * scale);
        glasses.lineBetween(-1 * scale, -36 * scale, 1 * scale, -36 * scale);
        // Branches
        glasses.lineBetween(-11 * scale, -36 * scale, -14 * scale, -36 * scale);
        glasses.lineBetween(11 * scale, -36 * scale, 14 * scale, -36 * scale);
        break;
        
      case "rect":
        // Lunettes rectangulaires classiques
        glasses.lineStyle(2.5, 0x2a2a2a, 1);
        glasses.strokeRoundedRect(-11 * scale, -39 * scale, 10 * scale, 7 * scale, 1.5 * scale);
        glasses.strokeRoundedRect(1 * scale, -39 * scale, 10 * scale, 7 * scale, 1.5 * scale);
        glasses.lineBetween(-1 * scale, -36 * scale, 1 * scale, -36 * scale);
        // Branches
        glasses.lineBetween(-11 * scale, -36 * scale, -14 * scale, -36 * scale);
        glasses.lineBetween(11 * scale, -36 * scale, 14 * scale, -36 * scale);
        break;
        
      case "sun":
        // Lunettes de soleil
        glasses.fillStyle(0x1a1a1a, 0.85);
        glasses.fillRoundedRect(-11 * scale, -39 * scale, 10 * scale, 7 * scale, 2 * scale);
        glasses.fillRoundedRect(1 * scale, -39 * scale, 10 * scale, 7 * scale, 2 * scale);
        glasses.lineStyle(2.5, 0x2a2a2a, 1);
        glasses.strokeRoundedRect(-11 * scale, -39 * scale, 10 * scale, 7 * scale, 2 * scale);
        glasses.strokeRoundedRect(1 * scale, -39 * scale, 10 * scale, 7 * scale, 2 * scale);
        glasses.lineBetween(-1 * scale, -36 * scale, 1 * scale, -36 * scale);
        // Branches
        glasses.lineBetween(-11 * scale, -36 * scale, -14 * scale, -36 * scale);
        glasses.lineBetween(11 * scale, -36 * scale, 14 * scale, -36 * scale);
        break;
    }
    this._previewContainer.add(glasses);
  }

  _createFullscreenButton(x, y) {
    const btnBg = this.add.rectangle(x, y, 40, 40, 0x2c3e50, 0.8)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x4ade80);

    const icon = this.add.text(x, y, '⛶', {
      fontSize: '24px', color: '#ffffff',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x34495e));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x2c3e50));
    btnBg.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
  }

  _onContinue() {
    const nick = this._nickname.trim();
    
    // Validation du pseudo
    if (!nick) {
      this._nicknameDisplay.setColor('#ff4444');
      this.tweens.add({
        targets: this._nicknameDisplay, x: this.scale.width / 2 + 6,
        duration: 60, ease: 'Linear', yoyo: true, repeat: 3,
        onComplete: () => { 
          this._nicknameDisplay.setX(this.scale.width / 2); 
          this._nicknameDisplay.setColor('#ff4444'); 
        },
      });
      return;
    }

    // Validation de l'avatar - générer un avatar si pas encore fait
    if (!this._avatarConfig) {
      // Flash sur le bouton pour inciter à cliquer
      this.tweens.add({
        targets: [this._randomBtnRect, this._randomBtnText],
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 100,
        ease: 'Linear',
        yoyo: true,
        repeat: 2,
      });
      return;
    }
    
    // Sauvegarder et continuer
    gameState.setLocalPlayer(nick, 0, this._avatarConfig);
    this.scene.start('LobbyScene');
  }
}
