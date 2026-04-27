/**
 * MainMenuScene.js
 * Écran titre : logo animé, bouton Jouer, crédits.
 */
import * as Phaser from 'phaser';
import { Scene } from 'phaser';

export class MainMenuScene extends Scene {
  constructor() {
    super('MainMenuScene');
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Fond dégradé ────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0a2a0a, 0x0a2a0a, 0x1a4a1a, 0x1a4a1a, 1);
    bg.fillRect(0, 0, W, H);

    // Étoiles décoratives
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const r = Math.random() * 1.5 + 0.5;
      this.add.circle(x, y, r, 0xffffff, Math.random() * 0.6 + 0.2);
    }

    // Arbres décoratifs (gauche & droite)
    this._drawDecoTree(80, H - 100, 50);
    this._drawDecoTree(160, H - 130, 40);
    this._drawDecoTree(W - 80, H - 100, 50);
    this._drawDecoTree(W - 160, H - 130, 40);
    this._drawDecoTree(50, 200, 35);
    this._drawDecoTree(W - 50, 200, 35);

    // ── Titre ───────────────────────────────────────
    const title = this.add.text(W / 2, 160, '🌿 Escape Garden', {
      fontSize: '52px', fontFamily: 'Arial Black',
      color: '#4ade80', stroke: '#003300', strokeThickness: 6,
    }).setOrigin(0.5);

    const sub = this.add.text(W / 2, 225, 'Le jeu éducatif multijoueur', {
      fontSize: '20px', fontFamily: 'Arial',
      color: '#a8e6a8', stroke: '#003300', strokeThickness: 3,
    }).setOrigin(0.5);

    // Pulse du titre
    this.tweens.add({
      targets: title, scaleX: 1.04, scaleY: 1.04,
      duration: 1400, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
    });

    // ── Description ─────────────────────────────────
    this.add.text(W / 2, 295,
      '🏃 Déplacez-vous dans le jardin\n❓ Répondez aux quiz pour gagner des points\n⚔️  Ralentissez vos adversaires\n🏆 Finissez sur le podium !', {
        fontSize: '16px', fontFamily: 'Arial',
        color: '#d4f7d4', stroke: '#003300', strokeThickness: 2,
        align: 'center', lineSpacing: 6,
      }).setOrigin(0.5);

    // ── Bouton JOUER ────────────────────────────────
    const btnBg = this.add.rectangle(W / 2, 460, 240, 64, 0x16a34a)
      .setInteractive({ useHandCursor: true });
    btnBg.setStrokeStyle(3, 0x4ade80);

    const btnTxt = this.add.text(W / 2, 460, '▶  JOUER', {
      fontSize: '26px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    // Hover
    btnBg.on('pointerover',  () => { btnBg.setFillStyle(0x22c55e); });
    btnBg.on('pointerout',   () => { btnBg.setFillStyle(0x16a34a); });
    btnBg.on('pointerdown',  () => {
      this.tweens.add({
        targets: [btnBg, btnTxt], scaleX: 0.95, scaleY: 0.95,
        duration: 80, yoyo: true,
        onComplete: () => this.scene.start('AvatarScene'),
      });
    });

    // ── Version ─────────────────────────────────────
    this.add.text(W / 2, H - 24, 'v1.0  •  DEVOXX 2026', {
      fontSize: '11px', fontFamily: 'Arial', color: '#5a7a5a',
    }).setOrigin(0.5);

    // ── Bouton Plein écran ──────────────────────────
    this._createFullscreenButton(W - 50, 50);
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
        icon.setText('⛶');
      } else {
        this.scale.startFullscreen();
        icon.setText('⛶');
      }
    });
  }

  _drawDecoTree(x, y, size) {
    const g = this.add.graphics();
    g.fillStyle(0x5c3317); g.fillRect(x - 4, y, 8, size * 0.4);
    g.fillStyle(0x1a6b1a); g.fillCircle(x, y - size * 0.3, size * 0.55);
    g.fillStyle(0x2a8a2a); g.fillCircle(x, y - size * 0.5, size * 0.4);
    g.fillStyle(0x44aa44); g.fillCircle(x - 4, y - size * 0.65, size * 0.25);
  }
}
