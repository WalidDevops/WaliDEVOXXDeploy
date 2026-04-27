/**
 * LobbyScene.js
 * Salon d'attente : affiche les joueurs connectés (joueur local + bots),
 * permet de lancer la partie.
 */
import * as Phaser from 'phaser';
import { gameState }  from '../services/GameStateService.js';
import { multiplayer } from '../services/MultiplayerService.js';
import { AVATARS }     from '../data/avatars.js';

export class LobbyScene extends Phaser.Scene {
  constructor() {
    super('LobbyScene');
    this._playerCards = [];
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // ── Fond ─────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1b2a, 0x0d1b2a, 0x1a2a3a, 0x1a2a3a, 1);
    bg.fillRect(0, 0, W, H);

    // ── Titre ────────────────────────────────────────
    this.add.text(W / 2, 40, '🏠 Salon de jeu', {
      fontSize: '32px', fontFamily: 'Arial Black',
      color: '#7fdbff', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(W / 2, 85, `Salle : ${gameState.roomId}`, {
      fontSize: '14px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5);

    // ── Zone joueurs ──────────────────────────────────
    this.add.text(W / 2, 120, 'Joueurs connectés', {
      fontSize: '16px', fontFamily: 'Arial Black', color: '#aaaaaa',
    }).setOrigin(0.5);

    this._cardsContainer = this.add.container(0, 0);
    this._refreshCards();

    // ── Bouton START ──────────────────────────────────
    this._startBtn = this.add.rectangle(W / 2, H - 90, 260, 58, 0x1d4ed8)
      .setStrokeStyle(2, 0x60a5fa)
      .setInteractive({ useHandCursor: true });
    this._startBtnTxt = this.add.text(W / 2, H - 90, '🚀  DÉMARRER', {
      fontSize: '24px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    this._startBtn.on('pointerover',  () => this._startBtn.setFillStyle(0x2563eb));
    this._startBtn.on('pointerout',   () => this._startBtn.setFillStyle(0x1d4ed8));
    this._startBtn.on('pointerdown',  () => this._onStart());

    // Tip
    this.add.text(W / 2, H - 45, 'Tous les joueurs sont prêts — appuyez sur Démarrer !', {
      fontSize: '12px', fontFamily: 'Arial', color: '#666666',
    }).setOrigin(0.5);

    // ── Retour ────────────────────────────────────────
    const back = this.add.text(60, H - 24, '← Retour', {
      fontSize: '13px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    back.on('pointerover',  () => back.setColor('#ffffff'));
    back.on('pointerout',   () => back.setColor('#888888'));
    back.on('pointerdown',  () => this.scene.start('AvatarScene'));

    // ── Bouton Plein écran ────────────────────────────
    this._createFullscreenButton(W - 40, 40);

    // ── Connexion multijoueur ─────────────────────────
    multiplayer.disconnect(); // reset propre
    multiplayer.on('playerJoined', (p) => {
      this._refreshCards();
    });
    multiplayer.on('lobbyReady', () => {
      this._refreshCards();
      this.add.text(W / 2, H - 130, '✅ Joueurs prêts !', {
        fontSize: '14px', fontFamily: 'Arial', color: '#4ade80',
      }).setOrigin(0.5);
    });
    multiplayer.connect(gameState.roomId);
  }

  shutdown() {
    multiplayer.off('playerJoined');
    multiplayer.off('lobbyReady');
  }

  // ── Affichage des cartes joueurs ─────────────────────

  _refreshCards() {
    this._cardsContainer.removeAll(true);

    const W      = this.scale.width;
    const players = Array.from(gameState.players.values());
    const cardW   = 180;
    const cardH   = 130;
    const cols    = 4;
    const spacingX = cardW + 20;
    const spacingY = cardH + 20;
    const totalW   = Math.min(players.length, cols) * spacingX - 20;
    const startX   = (W - totalW) / 2 + cardW / 2;
    const startY   = 160;

    players.forEach((player, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx  = startX + col * spacingX;
      const cy  = startY + row * spacingY;
      this._drawPlayerCard(cx, cy, player);
    });
  }

  _drawPlayerCard(cx, cy, player) {
    const av = AVATARS[player.avatarId] || AVATARS[0];

    // Fond carte
    const bg = this.add.rectangle(cx, cy, 175, 120, 0x1a2a3a)
      .setStrokeStyle(2, player.isLocal ? 0xffd700 : 0x336699);
    this._cardsContainer.add(bg);

    // Mini avatar
    this._drawMiniAv(cx, cy - 20, av);

    // Pseudo
    const nameText = this.add.text(cx, cy + 18, player.nickname, {
      fontSize: '14px', fontFamily: 'Arial Black',
      color: player.isLocal ? '#ffd700' : '#ffffff',
    }).setOrigin(0.5);
    this._cardsContainer.add(nameText);

    // Badge
    const badge = player.isLocal ? '⭐ Vous' : '🧑 Joueur';
    const badgeText = this.add.text(cx, cy + 38, badge, {
      fontSize: '11px', fontFamily: 'Arial', color: '#aaaaaa',
    }).setOrigin(0.5);
    this._cardsContainer.add(badgeText);

    // Indicateur "Prêt"
    const ready = this.add.text(cx, cy + 52, '✅ Prêt', {
      fontSize: '11px', fontFamily: 'Arial', color: '#4ade80',
    }).setOrigin(0.5);
    this._cardsContainer.add(ready);
  }

  _drawMiniAv(x, y, av) {
    const g = this.add.graphics();
    g.fillStyle(av.color); g.fillCircle(x, y, 20);
    g.lineStyle(2, 0xffffff, 0.8); g.strokeCircle(x, y, 20);
    g.fillStyle(0xffffff); g.fillCircle(x - 6, y - 4, 4); g.fillCircle(x + 6, y - 4, 4);
    g.fillStyle(0x111111); g.fillCircle(x - 5, y - 4, 2); g.fillCircle(x + 7, y - 4, 2);
    g.fillStyle(av.dark);  g.fillRect(x - 12, y - 24, 24, 4);
    g.fillStyle(av.hat);   g.fillRect(x - 7,  y - 34, 14, 12);
    this._cardsContainer.add(g);
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

  _onStart() {
    this.tweens.add({
      targets: [this._startBtn, this._startBtnTxt],
      scaleX: 0.92, scaleY: 0.92, duration: 80, yoyo: true,
      onComplete: () => {
        multiplayer.startGame();
        this.scene.start('GameScene');
      },
    });
  }
}
