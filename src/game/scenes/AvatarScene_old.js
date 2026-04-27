/**
 * AvatarScene.js
 * Saisie du pseudo + sélection d'avatar (6 presets colorés).
 * Stocke les données via GameStateService → localStorage.
 */
import { Scene } from 'phaser';
import { gameState } from '../services/GameStateService.js';
import { AVATARS } from '../data/avatars.js';

export class AvatarScene extends Scene {
  constructor() {
    super('AvatarScene');
    this._selectedAvatar = 0;
    this._nickname = '';
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._selectedAvatar = gameState.getSavedAvatarId();
    this._nickname       = gameState.getSavedNickname();

    // ── Fond ────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a2a0a, 0x0a2a0a, 0x0e2a3a, 0x0e2a3a, 1);
    bg.fillRect(0, 0, W, H);

    // ── Titre ───────────────────────────────────────
    this.add.text(W / 2, 50, '👤 Créez votre personnage', {
      fontSize: '30px', fontFamily: 'Arial Black',
      color: '#4ade80', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    // ── Champ pseudo (DOM) ───────────────────────────
    this.add.text(W / 2, 115, 'Votre pseudo', {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    // Fond champ texte simulé
    const inputBg = this.add.rectangle(W / 2, 155, 320, 44, 0x1a3a1a)
      .setStrokeStyle(2, 0x4ade80);

    this._nicknameDisplay = this.add.text(W / 2, 155, this._nickname || 'Votre pseudo…', {
      fontSize: '18px', fontFamily: 'Arial',
      color: this._nickname ? '#ffffff' : '#666666',
    }).setOrigin(0.5);

    // Curseur clignotant
    this._cursor = this.add.text(0, 155, '|', {
      fontSize: '18px', fontFamily: 'Arial', color: '#4ade80',
    }).setOrigin(0, 0.5);
    this._updateCursorPos();
    this.tweens.add({
      targets: this._cursor, alpha: 0,
      duration: 500, ease: 'Linear', yoyo: true, repeat: -1,
    });

    // Clic sur le champ
    inputBg.setInteractive({ useHandCursor: true });
    inputBg.on('pointerdown', () => this._openKeyboard());

    // Clavier natif (input invisible)
    this._setupKeyboardInput();

    // ── Grille d'avatars ─────────────────────────────
    this.add.text(W / 2, 218, 'Choisissez votre avatar', {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);

    this._avatarContainers = [];
    this._selectionBorder  = null;

    const cols = 3;
    const spacing = 140;
    const startX = W / 2 - spacing * (cols - 1) / 2;
    const startY = 290;

    AVATARS.forEach((av, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx  = startX + col * spacing;
      const cy  = startY + row * 110;

      // Fond de case
      const caseBg = this.add.rectangle(cx, cy, 100, 90, 0x1a3a1a)
        .setStrokeStyle(2, 0x336633)
        .setInteractive({ useHandCursor: true });

      // Mini avatar dessiné
      this._drawMiniAvatar(cx, cy - 10, av);

      // Nom de l'avatar
      this.add.text(cx, cy + 32, av.name, {
        fontSize: '12px', fontFamily: 'Arial Black', color: '#cccccc',
      }).setOrigin(0.5);

      caseBg.on('pointerover',  () => { if (this._selectedAvatar !== i) caseBg.setStrokeStyle(2, 0x4ade80); });
      caseBg.on('pointerout',   () => { if (this._selectedAvatar !== i) caseBg.setStrokeStyle(2, 0x336633); });
      caseBg.on('pointerdown',  () => this._selectAvatar(i));

      this._avatarContainers.push({ caseBg, index: i, cx, cy });
    });

    this._selectionBorder = this.add.rectangle(0, 0, 108, 98, 0x000000, 0)
      .setStrokeStyle(3, 0xffd700);

    this._highlightAvatar(this._selectedAvatar);

    // ── Bouton CONTINUER ─────────────────────────────
    const btnBg = this.add.rectangle(W / 2, H - 70, 240, 54, 0x16a34a)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(2, 0x4ade80);

    this._btnText = this.add.text(W / 2, H - 70, '➡  CONTINUER', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    btnBg.on('pointerover',  () => btnBg.setFillStyle(0x22c55e));
    btnBg.on('pointerout',   () => btnBg.setFillStyle(0x16a34a));
    btnBg.on('pointerdown',  () => this._onContinue());

    // ── Retour ───────────────────────────────────────
    const backBtn = this.add.text(60, H - 30, '← Retour', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    backBtn.on('pointerover',  () => backBtn.setColor('#ffffff'));
    backBtn.on('pointerout',   () => backBtn.setColor('#888888'));
    backBtn.on('pointerdown',  () => this.scene.start('MainMenuScene'));
  }

  // ── Helpers ──────────────────────────────────────────

  _drawMiniAvatar(x, y, av) {
    const g = this.add.graphics();
    // Corps
    g.fillStyle(av.color); g.fillCircle(x, y, 18);
    g.lineStyle(2, 0xffffff, 0.8); g.strokeCircle(x, y, 18);
    // Yeux
    g.fillStyle(0xffffff); g.fillCircle(x - 6, y - 4, 4); g.fillCircle(x + 6, y - 4, 4);
    g.fillStyle(0x111111); g.fillCircle(x - 5, y - 4, 2); g.fillCircle(x + 7, y - 4, 2);
    // Chapeau
    g.fillStyle(av.dark);  g.fillRect(x - 11, y - 22, 22, 4);
    g.fillStyle(av.hat);   g.fillRect(x - 7,  y - 32, 14, 12);
  }

  _selectAvatar(index) {
    this._selectedAvatar = index;
    this._highlightAvatar(index);
  }

  _highlightAvatar(index) {
    const item = this._avatarContainers[index];
    if (item && this._selectionBorder) {
      this._selectionBorder.setPosition(item.cx, item.cy);
      this._avatarContainers.forEach(({ caseBg, index: i }) => {
        caseBg.setStrokeStyle(2, i === index ? 0xffd700 : 0x336633);
        caseBg.setFillStyle(i === index ? 0x1a5a1a : 0x1a3a1a);
      });
    }
  }

  _setupKeyboardInput() {
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === 'Backspace') {
        this._nickname = this._nickname.slice(0, -1);
      } else if (event.key.length === 1 && this._nickname.length < 15) {
        this._nickname += event.key;
      }
      this._nicknameDisplay.setText(this._nickname || 'Votre pseudo…');
      this._nicknameDisplay.setColor(this._nickname ? '#ffffff' : '#666666');
      this._updateCursorPos();
    });
  }

  _openKeyboard() {
    // Focus sur le jeu pour recevoir les événements clavier
    this.game.canvas.focus();
  }

  _updateCursorPos() {
    const approxWidth = this._nickname.length * 10;
    this._cursor.setX(this.scale.width / 2 + approxWidth / 2 + 2);
  }

  _onContinue() {
    const nick = this._nickname.trim();
    if (!nick) {
      this._nicknameDisplay.setColor('#ff4444');
      this.tweens.add({
        targets: this._nicknameDisplay, x: this.scale.width / 2 + 6,
        duration: 60, ease: 'Linear', yoyo: true, repeat: 3,
        onComplete: () => { this._nicknameDisplay.setX(this.scale.width / 2); this._nicknameDisplay.setColor('#ff4444'); },
      });
      return;
    }
    gameState.setLocalPlayer(nick, this._selectedAvatar);
    this.scene.start('LobbyScene');
  }
}
