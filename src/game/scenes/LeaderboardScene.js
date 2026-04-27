/**
 * LeaderboardScene.js
 * Écran de fin de partie :
 *   - Podium visuel Top 3 (or, argent, bronze)
 *   - Liste complète des scores
 *   - Bouton Rejouer
 */
import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { gameState }  from '../services/GameStateService.js';
import { multiplayer } from '../services/MultiplayerService.js';
import { AVATARS }     from '../data/avatars.js';

export class LeaderboardScene extends Scene {
  constructor() {
    super('LeaderboardScene');
  }

  create() {
    const W       = this.scale.width;
    const H       = this.scale.height;
    const players = gameState.getPlayersSorted();

    // ── Fond ─────────────────────────────────────────
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d1b2a, 0x1a2a3a, 0x0d1b2a, 0x1a2a3a, 1);
    bg.fillRect(0, 0, W, H);

    // Étoiles de fond
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      this.add.circle(x, y, Math.random() * 1.5 + 0.5, 0xffffff, Math.random() * 0.5 + 0.1);
    }

    // ── Titre ─────────────────────────────────────────
    this.add.text(W / 2, 42, '🏆 Classement Final', {
      fontSize: '38px', fontFamily: 'Arial Black',
      color: '#ffd700', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5);

    // ── Podium ────────────────────────────────────────
    const podiumData = [
      { rank: 2, x: W / 2 - 170, h: 100, color: 0xaaaaaa, medal: '🥈', offsetY: 30 },
      { rank: 1, x: W / 2,       h: 140, color: 0xffd700, medal: '🥇', offsetY: 0  },
      { rank: 3, x: W / 2 + 170, h: 70,  color: 0xcd7f32, medal: '🥉', offsetY: 55 },
    ];

    const podiumBaseY = 320;

    podiumData.forEach(({ rank, x, h, color, medal, offsetY }) => {
      const player = players[rank - 1];
      if (!player) return;

      // Colonne podium
      const col = this.add.rectangle(x, podiumBaseY - h / 2, 120, h, color, 0.85)
        .setStrokeStyle(2, 0xffffff, 0.3);

      // Numéro de rang
      this.add.text(x, podiumBaseY - h + 14, String(rank), {
        fontSize: '22px', fontFamily: 'Arial Black', color: '#ffffff',
        stroke: '#000', strokeThickness: 3,
      }).setOrigin(0.5);

      // Avatar mini
      const av = AVATARS[player.avatarId] || AVATARS[0];
      this._drawPodiumAvatar(x, podiumBaseY - h - 44, av, player.isLocal);

      // Médaille
      this.add.text(x, podiumBaseY - h - 82, medal, {
        fontSize: '28px',
      }).setOrigin(0.5);

      // Pseudo
      this.add.text(x, podiumBaseY - h - 20, player.nickname, {
        fontSize: '13px', fontFamily: 'Arial Black',
        color: player.isLocal ? '#ffd700' : '#ffffff',
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0.5);

      // Score
      this.add.text(x, podiumBaseY + h / 2 - 10, `${player.score} pts`, {
        fontSize: '14px', fontFamily: 'Arial Black',
        color: '#ffffff',
      }).setOrigin(0.5, 1);

      // Animation d'entrée
      this.tweens.add({
        targets: col, scaleY: 0, scaleX: 1,
        duration: 0,
        onComplete: () => {
          this.tweens.add({
            targets: col, scaleY: 1,
            duration: 600, ease: 'Back.easeOut',
            delay: (3 - rank) * 200,
          });
        },
      });
    });

    // ── Liste complète ────────────────────────────────
    this.add.text(W / 2, podiumBaseY + 60, 'Classement complet', {
      fontSize: '14px', fontFamily: 'Arial', color: '#888888',
    }).setOrigin(0.5);

    players.forEach((p, i) => {
      const y = podiumBaseY + 90 + i * 28;
      const av = AVATARS[p.avatarId] || AVATARS[0];
      const col = p.isLocal ? '#ffd700' : '#ffffff';
      const medal = ['🥇 ', '🥈 ', '🥉 '][i] || `${i + 1}. `;
      this.add.text(W / 2 - 160, y, `${medal}${p.nickname}`, {
        fontSize: '14px', fontFamily: 'Arial', color: col,
        stroke: '#000', strokeThickness: 2,
      }).setOrigin(0, 0.5);

      this.add.text(W / 2 + 160, y, `${p.score} pts`, {
        fontSize: '14px', fontFamily: 'Arial Black', color: '#ffd700',
      }).setOrigin(1, 0.5);

      // Mini barre de score
      const maxScore = players[0]?.score || 1;
      const barW = Math.max(4, ((p.score / maxScore) * 180));
      this.add.rectangle(W / 2 - 50 + barW / 2, y, barW, 8, av.color, 0.7).setOrigin(0.5);
    });

    // ── Bouton Rejouer ────────────────────────────────
    const replayY = H - 70;
    const replayBtn = this.add.rectangle(W / 2, replayY, 240, 54, 0x16a34a)
      .setStrokeStyle(2, 0x4ade80)
      .setInteractive({ useHandCursor: true });

    this.add.text(W / 2, replayY, '🔄  REJOUER', {
      fontSize: '22px', fontFamily: 'Arial Black', color: '#ffffff',
    }).setOrigin(0.5);

    replayBtn.on('pointerover',  () => replayBtn.setFillStyle(0x22c55e));
    replayBtn.on('pointerout',   () => replayBtn.setFillStyle(0x16a34a));
    replayBtn.on('pointerdown',  () => {
      // Réinitialisation de la session
      multiplayer.disconnect();
      gameState.reset();
      this.scene.start('AvatarScene');
    });

    // ── Animation confettis ────────────────────────────
    this._launchConfetti(W, H);

    // ── Message de victoire joueur local ──────────────
    const rank = players.findIndex(p => p.isLocal) + 1;
    let msg = rank === 1 ? '🎉 Bravo, vous êtes 1er !' :
              rank === 2 ? '👏 Super, 2ème place !' :
              rank === 3 ? '😊 3ème place, bien joué !' :
              `Vous finissez ${rank}ème. Bonne chance la prochaine fois !`;

    this.add.text(W / 2, H - 110, msg, {
      fontSize: '16px', fontFamily: 'Arial', color: '#aaffaa',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
  }

  _drawPodiumAvatar(x, y, av, isLocal) {
    const g = this.add.graphics();
    if (isLocal) {
      g.fillStyle(0xffd700, 0.3); g.fillCircle(x, y, 28);
    }
    g.fillStyle(av.color); g.fillCircle(x, y, 22);
    g.lineStyle(3, 0xffffff, 0.8); g.strokeCircle(x, y, 22);
    g.fillStyle(0xffffff); g.fillCircle(x - 7, y - 5, 5); g.fillCircle(x + 7, y - 5, 5);
    g.fillStyle(0x111111); g.fillCircle(x - 6, y - 5, 2.5); g.fillCircle(x + 8, y - 5, 2.5);
    g.fillStyle(av.dark);  g.fillRect(x - 14, y - 28, 28, 5);
    g.fillStyle(av.hat);   g.fillRect(x - 9,  y - 40, 18, 14);
  }

  _launchConfetti(W, H) {
    const colors = [0xffd700, 0xff6b6b, 0x4ade80, 0x60a5fa, 0xf472b6, 0xfbbf24];
    for (let i = 0; i < 60; i++) {
      const x    = Phaser.Math.Between(0, W);
      const col  = colors[Phaser.Math.Between(0, colors.length - 1)];
      const size = Phaser.Math.Between(4, 10);
      const rect = this.add.rectangle(x, -20, size, size, col).setDepth(50);
      this.tweens.add({
        targets:  rect,
        y:        H + 20,
        x:        x + Phaser.Math.Between(-80, 80),
        angle:    Phaser.Math.Between(-360, 360),
        alpha:    { from: 1, to: 0 },
        duration: Phaser.Math.Between(1500, 3000),
        delay:    i * 60,
        ease:     'Quad.easeIn',
        onComplete: () => rect.destroy(),
      });
    }
  }
}
