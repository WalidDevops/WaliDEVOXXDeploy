/**
 * QuizScene.js
 * Overlay affiché au-dessus de GameScene quand le joueur marche sur une case quiz.
 * Affiche la question, 3 réponses, feedback immédiat, puis reprend la partie.
 *
 * Données reçues via scene.launch(data) :
 *   { questionId: number, zoneKey: string }
 *
 * Émet l'événement 'quizAnswered' vers GameScene :
 *   { questionId, correct, points }
 */
import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import { QUESTIONS } from '../data/questions.js';

const ANSWER_TIMEOUT = 15; // secondes pour répondre

export class QuizScene extends Scene {
  constructor() {
    super('QuizScene');
  }

  init(data) {
    this._questionId = data.questionId ?? 0;
    this._zoneKey    = data.zoneKey ?? '';
  }

  create() {
    const W  = this.scale.width;
    const H  = this.scale.height;
    const q  = QUESTIONS[this._questionId];
    if (!q) { this._close(false); return; }

    this._answered   = false;
    this._timeLeft   = ANSWER_TIMEOUT;

    // ── Fond semi-transparent ─────────────────────────
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(0);

    // ── Panneau principal ─────────────────────────────
    const panelW = 640;
    const panelH = 380;
    const panel  = this.add.rectangle(W / 2, H / 2, panelW, panelH, 0x0d1b2a)
      .setStrokeStyle(3, 0x3498db).setDepth(1);

    // En-tête
    this.add.text(W / 2, H / 2 - panelH / 2 + 26, '❓ Question', {
      fontSize: '18px', fontFamily: 'Arial Black', color: '#3498db',
    }).setOrigin(0.5).setDepth(2);

    // ── Timer ─────────────────────────────────────────
    this._timerText = this.add.text(W / 2 + panelW / 2 - 20, H / 2 - panelH / 2 + 24, `${ANSWER_TIMEOUT}s`, {
      fontSize: '14px', fontFamily: 'Arial Black', color: '#ffd700',
    }).setOrigin(1, 0.5).setDepth(2);

    this._timerBar = this.add.rectangle(
      W / 2 - panelW / 2 + 10,
      H / 2 - panelH / 2 + 44,
      panelW - 20, 6, 0x3498db,
    ).setOrigin(0, 0.5).setDepth(2);

    // ── Question ──────────────────────────────────────
    this.add.text(W / 2, H / 2 - 90, q.text, {
      fontSize: '20px', fontFamily: 'Arial',
      color: '#ffffff', stroke: '#000', strokeThickness: 2,
      align: 'center', wordWrap: { width: panelW - 40 },
    }).setOrigin(0.5).setDepth(2);

    // ── Réponses ──────────────────────────────────────
    const btnColors = [0x16a34a, 0x1d4ed8, 0xc2410c];
    this._answerBtns = [];

    q.options.forEach((option, i) => {
      const btnY = H / 2 + 20 + i * 68;
      const btn  = this.add.rectangle(W / 2, btnY, panelW - 40, 54, btnColors[i])
        .setStrokeStyle(2, 0xffffff, 0.4)
        .setInteractive({ useHandCursor: true })
        .setDepth(2);

      const txt = this.add.text(W / 2, btnY, `${['A', 'B', 'C'][i]}.  ${option}`, {
        fontSize: '17px', fontFamily: 'Arial', color: '#ffffff',
        align: 'center',
      }).setOrigin(0.5).setDepth(3);

      btn.on('pointerover',  () => { if (!this._answered) btn.setAlpha(0.8); });
      btn.on('pointerout',   () => { if (!this._answered) btn.setAlpha(1); });
      btn.on('pointerdown',  () => this._onAnswer(i, q, btn, txt));

      this._answerBtns.push({ btn, txt });
    });

    // ── Clavier (1/2/3) ───────────────────────────────
    this.input.keyboard.on('keydown-ONE',   () => this._onAnswer(0, q, ...this._getBtnTxt(0)));
    this.input.keyboard.on('keydown-TWO',   () => this._onAnswer(1, q, ...this._getBtnTxt(1)));
    this.input.keyboard.on('keydown-THREE', () => this._onAnswer(2, q, ...this._getBtnTxt(2)));

    // ── Timer countdown ───────────────────────────────
    this._timerEvent = this.time.addEvent({
      delay:    1000,
      repeat:   ANSWER_TIMEOUT - 1,
      callback: this._onTimerTick,
      callbackScope: this,
    });
  }

  // ── Helpers ───────────────────────────────────────────

  _getBtnTxt(i) {
    return [this._answerBtns[i]?.btn, this._answerBtns[i]?.txt];
  }

  _onTimerTick() {
    this._timeLeft--;
    this._timerText.setText(`${this._timeLeft}s`);
    const ratio = this._timeLeft / ANSWER_TIMEOUT;
    this._timerBar.width = (this.scale.width - 40 - 60 + 40) * ratio; // approximate
    this._timerBar.setFillStyle(ratio > 0.4 ? 0x3498db : 0xff4444);

    if (this._timeLeft <= 0 && !this._answered) {
      this._showFeedback(false, -1);
      this.time.delayedCall(1500, () => this._close(false));
    }
  }

  _onAnswer(index, question, btn, txt) {
    if (this._answered) return;
    this._answered = true;
    this._timerEvent.remove(false);

    const correct = index === question.correct;
    this._showFeedback(correct, index, question.correct);

    // Griser les autres boutons
    this._answerBtns.forEach(({ btn: b }, i) => {
      if (i !== index && i !== question.correct) b.setAlpha(0.3);
    });

    this.time.delayedCall(1800, () => this._close(correct, question));
  }

  _showFeedback(correct, chosenIndex, correctIndex) {
    const W = this.scale.width;
    const H = this.scale.height;

    // Coloration des boutons
    if (chosenIndex >= 0 && this._answerBtns[chosenIndex]) {
      this._answerBtns[chosenIndex].btn.setFillStyle(correct ? 0x22c55e : 0xef4444);
    }
    if (!correct && correctIndex >= 0 && this._answerBtns[correctIndex]) {
      this._answerBtns[correctIndex].btn.setFillStyle(0x22c55e);
    }

    // Feedback texte
    const msg = correct ? '✅  Bonne réponse ! +100 pts' : '❌  Mauvaise réponse…';
    const col = correct ? '#4ade80' : '#ff6b6b';

    this.add.text(W / 2, H / 2 - 140, msg, {
      fontSize: '22px', fontFamily: 'Arial Black',
      color: col, stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(10);

    // Animation particules (optionnel, confettis simples)
    if (correct) {
      for (let i = 0; i < 20; i++) {
        const cx = Phaser.Math.Between(W / 2 - 200, W / 2 + 200);
        const cy = H / 2 - 160;
        const star = this.add.text(cx, cy, '⭐', { fontSize: '14px' }).setDepth(10);
        this.tweens.add({
          targets: star, y: cy - Phaser.Math.Between(40, 120),
          alpha: 0, duration: 900, ease: 'Quad.easeOut',
          delay: i * 40,
          onComplete: () => star.destroy(),
        });
      }
    }
  }

  _close(correct, question) {
    // Reprend GameScene
    const gameScene = this.scene.get('GameScene');
    if (gameScene) {
      gameScene.events.emit('quizAnswered', {
        questionId: this._questionId,
        correct,
        points: question?.points ?? 0,
      });
    }
    this.scene.stop('QuizScene');
    this.scene.resume('GameScene');
  }
}
