/**
 * HUD.js
 * Interface utilisateur fixée à l'écran :
 *   - Barre supérieure : score, timer, pseudo
 *   - Panneau classement (droite)
 *   - Barre inférieure : contrôles
 *   - Messages flottants
 */
export class HUD {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} playerName
   */
  constructor(scene, playerName) {
    this.scene  = scene;
    this.W      = scene.scale.width;
    this.H      = scene.scale.height;

    // ─── Barre supérieure ──────────────────────
    const topBg = scene.add.rectangle(0, 0, this.W, 48, 0x0d1b2a, 0.92)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    this.scoreText = scene.add.text(14, 10, '⭐ Score : 0', {
      fontSize: '17px', fontFamily: 'Arial Black', color: '#ffd700',
      stroke: '#000', strokeThickness: 2,
    }).setScrollFactor(0).setDepth(101);

    this.timerText = scene.add.text(this.W / 2, 10, '⏱ 03:00', {
      fontSize: '17px', fontFamily: 'Arial Black', color: '#ffffff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

    this.nameText = scene.add.text(this.W - 54, 10, `👤 ${playerName}`, {
      fontSize: '13px', fontFamily: 'Arial', color: '#7fdbff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101);

    // ─── Bouton plein écran ────────────────────
    this._createFullscreenButton(scene);

    // ─── Panneau classement (droite, sous barre) ──
    const rankBg = scene.add.rectangle(this.W - 158, 54, 152, 112, 0x0d1b2a, 0.85)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    scene.add.text(this.W - 82, 60, '🏆 Classement', {
      fontSize: '10px', fontFamily: 'Arial Black', color: '#ffd700',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101);

    this.rankLines = [];
    for (let i = 0; i < 4; i++) {
      const t = scene.add.text(this.W - 152, 76 + i * 22, '', {
        fontSize: '10px', fontFamily: 'Arial', color: '#ffffff',
      }).setScrollFactor(0).setDepth(101);
      this.rankLines.push(t);
    }

    // ─── Barre de contrôles (bas) ──────────────
    const botBg = scene.add.rectangle(0, this.H - 32, this.W, 32, 0x0d1b2a, 0.88)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(100);

    scene.add.text(this.W / 2, this.H - 16,
      '🎮  ZQSD / ↑↓←→ : Déplacer   |   ESPACE : Attaquer', {
        fontSize: '10px', fontFamily: 'Arial', color: '#aaaaaa',
      }).setOrigin(0.5).setScrollFactor(0).setDepth(101);

    // ─── Indicateur de ralentissement ──────────
    this.slowWarn = scene.add.text(this.W / 2, 64, '🐢 RALENTI !', {
      fontSize: '22px', fontFamily: 'Arial Black',
      color: '#9b59b6', stroke: '#fff', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102).setAlpha(0);
  }

  _createFullscreenButton(scene) {
    const btnBg = scene.add.rectangle(this.W - 20, 24, 32, 32, 0x2c3e50, 0.9)
      .setScrollFactor(0)
      .setDepth(101)
      .setInteractive({ useHandCursor: true })
      .setStrokeStyle(1, 0x4ade80);

    this.fsIcon = scene.add.text(this.W - 20, 24, '⛶', {
      fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(102);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0x34495e));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x2c3e50));
    btnBg.on('pointerdown', () => {
      if (scene.scale.isFullscreen) {
        scene.scale.stopFullscreen();
      } else {
        scene.scale.startFullscreen();
      }
    });
  }

  // ─────────────────────────────────────────
  // Mise à jour
  // ─────────────────────────────────────────

  updateScore(score) {
    this.scoreText.setText(`⭐ Score : ${score}`);
  }

  updateTimer(seconds) {
    const m  = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s  = String(seconds % 60).padStart(2, '0');
    const urgent = seconds <= 30;
    this.timerText
      .setText(`⏱ ${m}:${s}`)
      .setColor(urgent ? '#ff4444' : '#ffffff');
  }

  updateRanking(players) {
    const medals = ['🥇', '🥈', '🥉', '4.'];
    players.slice(0, 4).forEach((p, i) => {
      this.rankLines[i].setText(`${medals[i]} ${p.nickname.slice(0, 9)}: ${p.score}`);
    });
  }

  setSlowWarning(visible) {
    if (visible) {
      this.scene.tweens.add({
        targets: this.slowWarn, alpha: 1,
        duration: 250, yoyo: true, repeat: 5,
        onComplete: () => this.slowWarn.setAlpha(0),
      });
    } else {
      this.slowWarn.setAlpha(0);
    }
  }

  /**
   * Affiche un message flottant au centre de l'écran.
   * @param {string} text
   * @param {string} [color='#ffffff']
   * @param {number} [duration=2000]
   */
  showMessage(text, color = '#ffffff', duration = 2000) {
    const msg = this.scene.add.text(this.W / 2, this.H / 2 - 60, text, {
      fontSize: '26px', fontFamily: 'Arial Black',
      color, stroke: '#000000', strokeThickness: 5,
      align: 'center',
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200);

    this.scene.tweens.add({
      targets:  msg,
      y:        this.H / 2 - 110,
      alpha:    0,
      duration: duration,
      ease:     'Quad.easeOut',
      onComplete: () => msg.destroy(),
    });
  }
}
