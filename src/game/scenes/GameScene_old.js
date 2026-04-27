/**
 * GameScene.js
 * Scène principale du jeu :
 *   - Rendu de la carte (tuiles, arbres, bâtiments, zones quiz)
 *   - Gestion des joueurs (local + bots via MultiplayerService)
 *   - Déplacement case par case (ZQSD / flèches)
 *   - Zones quiz (ouvre QuizScene en overlay)
 *   - Système d'attaque (ESPACE)
 *   - Timer 3 minutes
 *   - HUD temps réel
 */
import * as Phaser from 'phaser';
import { Scene } from 'phaser';
import {
  TILE_MAP, MAP_COLS, MAP_ROWS,
  QUIZ_ZONES, SPAWN_POSITIONS, isWalkable, getTile,
  toIso, ISO_TILE_W, ISO_TILE_H, ISO_WALL_H, ISO_WORLD_W, ISO_WORLD_H,
} from '../data/map.js';
import { AVATARS }       from '../data/avatars.js';
import { gameState }     from '../services/GameStateService.js';
import { multiplayer }   from '../services/MultiplayerService.js';
import { PlayerSprite }  from '../components/PlayerSprite.js';
import { HUD }           from '../components/HUD.js';

// Durée totale de la partie (secondes)
const GAME_DURATION = 180;
// Portée de l'attaque en cases
const ATTACK_RANGE = 2;
// Délai minimal entre deux déplacements du joueur local (ms)
const MOVE_COOLDOWN = 220;
// Délai minimal si ralenti
const MOVE_COOLDOWN_SLOWED = 500;

export class GameScene extends Scene {
  constructor() {
    super('GameScene');
  }

  // ─────────────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────────────

  create() {
    // ── 1. Fond de ciel pour la vue isométrique ────────
    this.add.rectangle(ISO_WORLD_W / 2, ISO_WORLD_H / 2, ISO_WORLD_W, ISO_WORLD_H, 0x87ceeb).setDepth(-1);

    // ── 2. Dessin de la carte isométrique 3D ───────────
    this._buildMapIso();

    // ── 3. Marqueurs quiz ──────────────────────────────
    this._quizMarkers = {};
    this._buildQuizMarkers();

    // ── 3. Sprites joueurs ─────────────────────────────
    /** @type {Map<string, PlayerSprite>} */
    this._sprites = new Map();

    // Joueur local – position de spawn 0
    const local   = gameState.localPlayer;
    const spawnL  = SPAWN_POSITIONS[0];
    local.col = spawnL.col;
    local.row = spawnL.row;
    this._addSprite(local);

    // Joueurs déjà dans la partie (bots)
    gameState.players.forEach((p) => {
      if (!p.isLocal) this._addSprite(p);
    });

    // ── 4. Caméra ──────────────────────────────────────
    this.cameras.main.setBounds(0, 0, ISO_WORLD_W, ISO_WORLD_H);
    this.cameras.main.startFollow(this._sprites.get(local.id).container, true, 0.1, 0.1);

    // ── 5. Clavier ─────────────────────────────────────
    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd    = this.input.keyboard.addKeys({
      up:    Phaser.Input.Keyboard.KeyCodes.Z,
      down:  Phaser.Input.Keyboard.KeyCodes.S,
      left:  Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this._lastMoveTime = 0;
    this._lastAttackTime = 0;

    // ── 6. HUD ─────────────────────────────────────────
    this._hud = new HUD(this, local.nickname);
    this._hud.updateScore(local.score);
    this._hud.updateRanking(gameState.getPlayersSorted());

    // ── 7. Timer ───────────────────────────────────────
    this._timeLeft = GAME_DURATION;
    this._timerEvent = this.time.addEvent({
      delay:    1000,
      repeat:   GAME_DURATION - 1,
      callback: this._onTimerTick,
      callbackScope: this,
    });

    // ── 8. Événements multijoueur ──────────────────────
    this._onPlayerMoved   = ({ player, oldCol, oldRow }) => this._handleRemoteMove(player);
    this._onPlayerAttacked = ({ targetId }) => this._handleAttacked(targetId);
    this._onPlayerJoined  = (p) => { this._addSprite(p); };
    this._onPlayerLeft    = (id) => { this._removeSprite(id); };
    this._onScoreUpdate   = ({ playerId, score }) => {
      const sp = this._sprites.get(playerId);
      if (sp) sp.updateScore(score);
      this._hud.updateRanking(gameState.getPlayersSorted());
    };

    multiplayer.on('playerMoved',    this._onPlayerMoved);
    multiplayer.on('playerAttacked', this._onPlayerAttacked);
    multiplayer.on('playerJoined',   this._onPlayerJoined);
    multiplayer.on('playerLeft',     this._onPlayerLeft);
    multiplayer.on('scoreUpdate',    this._onScoreUpdate);

    // Lance le mouvement des bots
    multiplayer.startBotMovement();

    // ── 9. Message de départ ───────────────────────────
    this._hud.showMessage('🌿 La partie commence !', '#4ade80', 2500);

    // ── 10. Reprise après quiz (signal envoyé par QuizScene) ──
    this.events.on('quizAnswered', this._onQuizAnswered, this);

    gameState.gameStarted = true;
  }

  // ─────────────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────────────

  update(time) {
    if (!gameState.gameStarted || gameState.gameEnded) return;

    this._handleMovement(time);
    this._handleAttack(time);
    this._updateSlowEffects();
  }

  // ─────────────────────────────────────────────────────
  // Carte isométrique 3D – algorithme du peintre (back→front)
  // ─────────────────────────────────────────────────────

  _buildMapIso() {
    // Couche sol (herbe/chemin/quiz) — un seul Graphics, depth 0
    const floor = this.add.graphics().setDepth(0);

    // Bandes diagonales d → profondeur croissante (arrière → avant)
    for (let d = 0; d <= MAP_COLS + MAP_ROWS - 2; d++) {
      const rowMin = Math.max(0, d - MAP_COLS + 1);
      const rowMax = Math.min(d, MAP_ROWS - 1);

      for (let row = rowMin; row <= rowMax; row++) {
        const col  = d - row;
        if (col < 0 || col >= MAP_COLS) continue;
        const tile  = getTile(col, row);
        const depth = d * 10; // profondeur iso pour objets de cette bande

        // Sol plat (même Graphics)
        switch (tile) {
          case 0: case 4: this._drawIsoGrass(floor, col, row);     break;
          case 1:          this._drawIsoPath(floor, col, row);      break;
          case 2: case 3:  this._drawIsoGrass(floor, col, row);    break;
          case 5:          this._drawIsoQuizFloor(floor, col, row); break;
        }

        // Objets 3D en hauteur (Graphics individuels avec depth correcte)
        if (tile === 2 || tile === 3) this._drawIsoBuilding(col, row, depth + 5);
        else if (tile === 4)          this._drawIsoTree(col, row, depth + 7);
      }
    }
  }

  // ── Primitives isométriques ──────────────────────────

  /** Remplit un quadrilatère (chemin polygonal fermé) */
  _fillQuad(g, x0, y0, x1, y1, x2, y2, x3, y3) {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.lineTo(x2, y2);
    g.lineTo(x3, y3);
    g.closePath();
    g.fillPath();
  }

  /** Remplit le losange d'une tuile iso */
  _fillIsoDiamond(g, x, y) {
    const hw = ISO_TILE_W / 2, hh = ISO_TILE_H / 2;
    this._fillQuad(g, x, y,  x + hw, y + hh,  x, y + ISO_TILE_H,  x - hw, y + hh);
  }

  _drawIsoGrass(g, col, row) {
    const { x, y } = toIso(col, row);
    g.fillStyle((col + row) % 2 === 0 ? 0x50b450 : 0x48a848);
    this._fillIsoDiamond(g, x, y);
    // Légère arête visible
    g.lineStyle(0.6, 0x000000, 0.08);
    const hw = ISO_TILE_W / 2, hh = ISO_TILE_H / 2;
    g.beginPath(); g.moveTo(x, y + ISO_TILE_H); g.lineTo(x + hw, y + hh); g.strokePath();
    g.beginPath(); g.moveTo(x, y + ISO_TILE_H); g.lineTo(x - hw, y + hh); g.strokePath();
  }

  _drawIsoPath(g, col, row) {
    const { x, y } = toIso(col, row);
    g.fillStyle(0xd4b896);
    this._fillIsoDiamond(g, x, y);
    // Motif de chemin (losange intérieur plus clair)
    const hw = ISO_TILE_W / 2, hh = ISO_TILE_H / 2;
    g.fillStyle(0xe0c9a8, 0.5);
    this._fillQuad(g,
      x,        y + ISO_TILE_H * 0.2,
      x + hw * 0.6, y + hh,
      x,        y + ISO_TILE_H * 0.8,
      x - hw * 0.6, y + hh,
    );
  }

  _drawIsoQuizFloor(g, col, row) {
    const { x, y } = toIso(col, row);
    g.fillStyle(0x1a4aaa);
    this._fillIsoDiamond(g, x, y);
    // Losange intérieur lumineux
    const hw = ISO_TILE_W / 2, hh = ISO_TILE_H / 2;
    g.fillStyle(0x4488ff, 0.55);
    this._fillQuad(g,
      x,        y + hh * 0.4,
      x + hw * 0.6, y + hh,
      x,        y + hh * 1.6,
      x - hw * 0.6, y + hh,
    );
  }

  /** Bâtiment 3D : face du toit + mur gauche + mur droit */
  _drawIsoBuilding(col, row, depth) {
    const { x, y } = toIso(col, row);
    const hw = ISO_TILE_W / 2, hh = ISO_TILE_H / 2;
    const wh = ISO_WALL_H;
    const g  = this.add.graphics().setDepth(depth);

    // ── Toit (losange élevé de wh) ──
    g.fillStyle(0xa89880);
    this._fillQuad(g,
      x,       y - wh,
      x + hw,  y + hh - wh,
      x,       y + ISO_TILE_H - wh,
      x - hw,  y + hh - wh,
    );

    // ── Mur gauche/Ouest (face claire) ──
    g.fillStyle(0x7a6a58);
    this._fillQuad(g,
      x - hw, y + hh - wh,
      x,      y + ISO_TILE_H - wh,
      x,      y + ISO_TILE_H,
      x - hw, y + hh,
    );

    // ── Mur droit/Sud (face sombre) ──
    g.fillStyle(0x58483a);
    this._fillQuad(g,
      x,      y + ISO_TILE_H - wh,
      x + hw, y + hh - wh,
      x + hw, y + hh,
      x,      y + ISO_TILE_H,
    );

    // ── Fenêtres ──
    g.fillStyle(0x88d8f0, 0.85);
    g.fillRect(x + hw * 0.2,  y + hh - wh * 0.75, 10, 7);   // mur droit
    g.fillStyle(0x66b8d8, 0.7);
    g.fillRect(x - hw * 0.8,  y + hh - wh * 0.55, 10, 7);   // mur gauche

    // ── Contours ──
    g.lineStyle(1, 0x000000, 0.28);
    g.lineBetween(x - hw, y + hh - wh, x - hw, y + hh);
    g.lineBetween(x + hw, y + hh - wh, x + hw, y + hh);
    g.lineBetween(x,      y + ISO_TILE_H - wh, x, y + ISO_TILE_H);
    g.beginPath();
    g.moveTo(x, y - wh); g.lineTo(x + hw, y + hh - wh);
    g.lineTo(x, y + ISO_TILE_H - wh); g.lineTo(x - hw, y + hh - wh);
    g.closePath(); g.strokePath();
  }

  /** Arbre 3D (tronc + feuillage sphérique) */
  _drawIsoTree(col, row, depth) {
    const { x, y } = toIso(col, row);
    const g    = this.add.graphics().setDepth(depth);
    const base = y + ISO_TILE_H / 2;

    // Tronc
    g.fillStyle(0x7a5230);
    g.fillRect(x - 3, base - ISO_WALL_H + 8, 6, ISO_WALL_H - 6);

    // Ombre du feuillage
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(x + 2, base - ISO_WALL_H + 10, 28, 11);

    // Feuillage (couches du bas vers le haut)
    g.fillStyle(0x1a5e1a); g.fillCircle(x,     base - ISO_WALL_H + 6,  20);
    g.fillStyle(0x2d7a2d); g.fillCircle(x,     base - ISO_WALL_H,       17);
    g.fillStyle(0x3d9a3d); g.fillCircle(x - 1, base - ISO_WALL_H - 7,  13);
    g.fillStyle(0x52b852); g.fillCircle(x,     base - ISO_WALL_H - 13,  9);
    g.fillStyle(0x7acc7a, 0.45); g.fillCircle(x - 4, base - ISO_WALL_H - 16, 5);
  }

  // ─────────────────────────────────────────────────────
  // Marqueurs quiz (symbole ?) en iso
  // ─────────────────────────────────────────────────────

  _buildQuizMarkers() {
    QUIZ_ZONES.forEach((zone) => {
      const { x, y } = toIso(zone.col, zone.row);
      const mx    = x;
      const my    = y + ISO_TILE_H / 2 - 20;
      const depth = (zone.col + zone.row) * 10 + 9;

      const mark = this.add.text(mx, my, '?', {
        fontSize: '22px', fontFamily: 'Arial Black',
        color: '#ffffff', stroke: '#1144aa', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(depth);

      // Flottement vertical
      this.tweens.add({
        targets: mark, y: my - 8,
        duration: 750, ease: 'Sine.easeInOut', yoyo: true, repeat: -1,
      });

      this._quizMarkers[`${zone.col}_${zone.row}`] = mark;
    });
  }

  // ─────────────────────────────────────────────────────
  // Sprites
  // ─────────────────────────────────────────────────────

  _addSprite(player) {
    if (this._sprites.has(player.id)) return;
    const depth = (player.col + player.row) * 10 + 8;
    const sp = new PlayerSprite(this, player, depth);
    this._sprites.set(player.id, sp);
  }

  _removeSprite(playerId) {
    const sp = this._sprites.get(playerId);
    if (sp) { sp.destroy(); this._sprites.delete(playerId); }
  }

  // ─────────────────────────────────────────────────────
  // Déplacement joueur local
  // ─────────────────────────────────────────────────────

  _handleMovement(time) {
    const local    = gameState.localPlayer;
    const cooldown = local.isSlowed ? MOVE_COOLDOWN_SLOWED : MOVE_COOLDOWN;
    if (time - this._lastMoveTime < cooldown) return;

    let dc = 0, dr = 0;
    const c = this._cursors;
    const w = this._wasd;

    if      (Phaser.Input.Keyboard.JustDown(c.left)  || Phaser.Input.Keyboard.JustDown(w.left))  dc = -1;
    else if (Phaser.Input.Keyboard.JustDown(c.right) || Phaser.Input.Keyboard.JustDown(w.right)) dc =  1;
    else if (Phaser.Input.Keyboard.JustDown(c.up)    || Phaser.Input.Keyboard.JustDown(w.up))    dr = -1;
    else if (Phaser.Input.Keyboard.JustDown(c.down)  || Phaser.Input.Keyboard.JustDown(w.down))  dr =  1;
    // Maintien touche (movement continu)
    else if (c.left.isDown  || w.left.isDown)   dc = -1;
    else if (c.right.isDown || w.right.isDown)  dc =  1;
    else if (c.up.isDown    || w.up.isDown)     dr = -1;
    else if (c.down.isDown  || w.down.isDown)   dr =  1;

    if (dc === 0 && dr === 0) return;

    const nc = local.col + dc;
    const nr = local.row + dr;

    if (!isWalkable(nc, nr)) return;

    // Déplacement valide
    local.col = nc;
    local.row = nr;
    this._lastMoveTime = time;

    const sp = this._sprites.get(local.id);
    if (sp) {
      sp.moveTo(nc, nr);
      sp.container.setDepth((nc + nr) * 10 + 8);
    }

    multiplayer.sendMove(nc, nr);

    // Vérification zone quiz
    this._checkQuizZone(nc, nr);
  }

  // ─────────────────────────────────────────────────────
  // Attaque
  // ─────────────────────────────────────────────────────

  _handleAttack(time) {
    if (time - this._lastAttackTime < 1500) return;
    if (!Phaser.Input.Keyboard.JustDown(this._spaceKey)) return;

    this._lastAttackTime = time;
    const local = gameState.localPlayer;

    let hit = false;
    gameState.players.forEach((target) => {
      if (target.id === local.id) return;
      const dist = Math.abs(target.col - local.col) + Math.abs(target.row - local.row);
      if (dist <= ATTACK_RANGE) {
        target.applySlowEffect(3000);
        multiplayer.sendAttack(target.id);
        this._handleAttacked(target.id);
        hit = true;
      }
    });

    if (hit) {
      // Effet d'attaque sur le joueur local
      const sp = this._sprites.get(local.id);
      if (sp) {
        this.tweens.add({
          targets: sp.container, scaleX: 1.25, scaleY: 1.25,
          duration: 100, ease: 'Linear', yoyo: true,
        });
      }
      this._hud.showMessage('⚔️  Attaque !', '#ffaa00', 800);
    }
  }

  _handleAttacked(targetId) {
    const sp = this._sprites.get(targetId);
    if (sp) {
      sp.showAttackHit();
      sp.setSlowEffect(true);
      // Retire l'effet après 3s
      this.time.delayedCall(3000, () => {
        const target = gameState.players.get(targetId);
        if (target && !target.isSlowed) sp.setSlowEffect(false);
      });
    }
    if (targetId === gameState.localPlayer.id) {
      this._hud.showMessage('💜 Vous êtes ralenti !', '#9b59b6', 2000);
      this._hud.setSlowWarning(true);
    }
  }

  // ─────────────────────────────────────────────────────
  // Mise à jour effets ralentissement
  // ─────────────────────────────────────────────────────

  _updateSlowEffects() {
    gameState.players.forEach((p) => {
      const sp = this._sprites.get(p.id);
      if (!sp) return;
      sp.setSlowEffect(p.isSlowed);
    });
  }

  // ─────────────────────────────────────────────────────
  // Déplacement distant (bots / réseau)
  // ─────────────────────────────────────────────────────

  _handleRemoteMove(player) {
    const sp = this._sprites.get(player.id);
    if (sp) {
      sp.moveTo(player.col, player.row);
      sp.container.setDepth((player.col + player.row) * 10 + 8);
    }

    // Bots : vérification quiz
    if (player.isBot) this._checkBotQuiz(player);
  }

  _checkBotQuiz(player) {
    const zone = QUIZ_ZONES.find(z => z.col === player.col && z.row === player.row);
    if (!zone) return;
    if (player.answeredQuizzes.has(zone.questionId)) return;
    player.answeredQuizzes.add(zone.questionId);
    // Les bots répondent correctement 60% du temps
    if (Math.random() < 0.6) {
      player.addScore(100);
      const sp = this._sprites.get(player.id);
      if (sp) sp.showQuizPoint(100);
      this._hud.updateRanking(gameState.getPlayersSorted());
    }
  }

  // ─────────────────────────────────────────────────────
  // Zone quiz
  // ─────────────────────────────────────────────────────

  _checkQuizZone(col, row) {
    const zone = QUIZ_ZONES.find(z => z.col === col && z.row === row);
    if (!zone) return;

    const local = gameState.localPlayer;
    if (local.answeredQuizzes.has(zone.questionId)) {
      this._hud.showMessage('✅ Déjà répondu !', '#888888', 1000);
      return;
    }

    // Pause du jeu → ouvre QuizScene en overlay
    gameState.gameStarted = false;
    this.scene.launch('QuizScene', {
      questionId: zone.questionId,
      zoneKey: `${col}_${row}`,
    });
    this.scene.pause('GameScene');
  }

  _onQuizAnswered({ questionId, correct, points }) {
    const local = gameState.localPlayer;
    local.answeredQuizzes.add(questionId);

    if (correct) {
      local.addScore(points);
      const sp = this._sprites.get(local.id);
      if (sp) sp.showQuizPoint(points);
      this._hud.updateScore(local.score);
      this._hud.updateRanking(gameState.getPlayersSorted());
      multiplayer.sendQuizResult(questionId, true, points);
    } else {
      this._hud.showMessage('❌ Mauvaise réponse…', '#ff4444', 1500);
    }

    // Cacher le marqueur quiz (déjà répondu par joueur local)
    const key = QUIZ_ZONES.find(z => z.questionId === questionId);
    if (key) {
      const marker = this._quizMarkers[`${key.col}_${key.row}`];
      if (marker) marker.setAlpha(0.3);
    }

    gameState.gameStarted = true;
  }

  // ─────────────────────────────────────────────────────
  // Timer
  // ─────────────────────────────────────────────────────

  _onTimerTick() {
    this._timeLeft--;
    this._hud.updateTimer(this._timeLeft);

    if (this._timeLeft <= 0) {
      this._endGame();
    }
  }

  _endGame() {
    gameState.gameEnded   = true;
    gameState.gameStarted = false;
    multiplayer.stopBotMovement();
    this._timerEvent.remove(false);

    this._hud.showMessage('🏁 Fin de la partie !', '#ffd700', 2000);
    this.time.delayedCall(2200, () => {
      this.scene.stop('GameScene');
      this.scene.start('LeaderboardScene');
    });
  }

  // ─────────────────────────────────────────────────────
  // Nettoyage
  // ─────────────────────────────────────────────────────

  shutdown() {
    multiplayer.off('playerMoved',    this._onPlayerMoved);
    multiplayer.off('playerAttacked', this._onPlayerAttacked);
    multiplayer.off('playerJoined',   this._onPlayerJoined);
    multiplayer.off('playerLeft',     this._onPlayerLeft);
    multiplayer.off('scoreUpdate',    this._onScoreUpdate);
    multiplayer.stopBotMovement();
  }
}
