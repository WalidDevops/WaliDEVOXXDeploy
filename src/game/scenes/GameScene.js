/**
 * GameScene.js
 * Scène principale du jeu avec déplacement fluide et animations.
 * Vue top-down avec Arcade Physics pour un gameplay naturel.
 */
import * as Phaser from 'phaser';
import {
  TILE_MAP, MAP_COLS, MAP_ROWS, TILE_SIZE,
  QUIZ_ZONES, SPAWN_POSITIONS, isWalkable, getTile,
} from '../data/map.js';
import { gameState }     from '../services/GameStateService.js';
import { multiplayer }   from '../services/MultiplayerService.js';
import { PlayerSprite }  from '../components/PlayerSprite.js';
import { HUD }           from '../components/HUD.js';

// Configuration du gameplay
const GAME_DURATION = 180; // secondes
const PLAYER_SPEED = 120; // pixels par seconde
const PLAYER_SPEED_SLOWED = 60; // vitesse ralentie
const ATTACK_RANGE = 80; // pixels
const ATTACK_COOLDOWN = 1000; // ms

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  // ═══════════════════════════════════════════════════════
  // CREATE
  // ═══════════════════════════════════════════════════════

  create() {
    const mapW = MAP_COLS * TILE_SIZE;
    const mapH = MAP_ROWS * TILE_SIZE;

    // ── 1. Activer la physique Arcade ──────────────────
    this.physics.world.setBounds(0, 0, mapW, mapH);

    // ── 2. Créer la carte top-down ─────────────────────
    this._buildTopDownMap();

    // ── 3. Groupes de collision ────────────────────────
    this.wallsGroup = this.physics.add.staticGroup();
    this._createCollisionWalls();

    // ── 4. Marqueurs de quiz ───────────────────────────
    this._quizMarkers = {};
    this._buildQuizMarkers();

    // ── 5. Joueurs ─────────────────────────────────────
    /** @type {Map<string, PlayerSprite>} */
    this._sprites = new Map();

    // Créer le joueur local
    const local = gameState.localPlayer;
    const spawnPos = this._getSpawnPosition(0);
    local.col = Math.floor(spawnPos.x / TILE_SIZE);
    local.row = Math.floor(spawnPos.y / TILE_SIZE);
    const localSprite = this._addPlayerSprite(local, spawnPos.x, spawnPos.y);

    // Créer les autres joueurs (bots)
    let spawnIndex = 1;
    gameState.players.forEach((p) => {
      if (!p.isLocal) {
        const pos = this._getSpawnPosition(spawnIndex++);
        this._addPlayerSprite(p, pos.x, pos.y);
      }
    });

    // Collisions joueur avec murs
    this.physics.add.collider(localSprite.sprite, this.wallsGroup);

    // ── 6. Caméra ──────────────────────────────────────
    this.cameras.main.setBounds(0, 0, mapW, mapH);
    this.cameras.main.startFollow(localSprite.sprite, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.5); // Zoom pour mieux voir

    // ── 7. Input (Clavier) ─────────────────────────────
    this._setupInput();

    // ── 8. HUD ─────────────────────────────────────────
    this._hud = new HUD(this, local.nickname);
    this._hud.updateScore(local.score);
    this._hud.updateRanking(gameState.getPlayersSorted());

    // ── 9. Timer ───────────────────────────────────────
    this._timeLeft = GAME_DURATION;
    this._timerEvent = this.time.addEvent({
      delay: 1000,
      repeat: GAME_DURATION - 1,
      callback: this._onTimerTick,
      callbackScope: this,
    });

    // ── 10. Événements multijoueur ─────────────────────
    this._setupMultiplayerEvents();

    // ── 11. Démarrage ──────────────────────────────────
    gameState.gameStarted = true;
    this._hud.showMessage('🌿 La partie commence !', '#4ade80', 2500);

    // Événement de reprise après quiz
    this.events.on('quizAnswered', this._onQuizAnswered, this);

    // Variables d'état
    this._lastAttackTime = 0;
  }

  // ═══════════════════════════════════════════════════════
  // UPDATE - Boucle principale
  // ═══════════════════════════════════════════════════════

  update(time, delta) {
    if (!gameState.gameStarted || gameState.gameEnded) return;

    // Mettre à jour tous les sprites
    this._sprites.forEach(sprite => sprite.update());

    // Gérer le déplacement du joueur local
    this._handlePlayerMovement();

    // Gérer l'attaque
    this._handleAttack(time);

    // Vérifier les zones de quiz
    this._checkQuizZones();

    // Mettre à jour les effets de ralentissement
    this._updateSlowEffects();
  }

  // ═══════════════════════════════════════════════════════
  // CONSTRUCTION DE LA CARTE
  // ═══════════════════════════════════════════════════════

  /**
   * Construit la carte en vue top-down avec tuiles
   * @private
   */
  _buildTopDownMap() {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const x = col * TILE_SIZE + TILE_SIZE / 2;
        const y = row * TILE_SIZE + TILE_SIZE / 2;
        const tile = getTile(col, row);

        // Dessiner la tuile appropriée
        switch (tile) {
          case 0: // Herbe
            this.add.image(x, y, 'grass').setDepth(0);
            break;
          case 1: // Chemin
            this.add.image(x, y, 'path').setDepth(0);
            break;
          case 2: // Mur bâtiment
            this.add.image(x, y, 'building_wall').setDepth(1);
            break;
          case 3: // Intérieur bâtiment
            this.add.image(x, y, 'building_interior').setDepth(0);
            break;
          case 4: // Arbre
            this.add.image(x, y, 'grass').setDepth(0);
            this.add.image(x, y, 'tree').setDepth(2);
            break;
          case 5: // Zone quiz
            this.add.image(x, y, 'grass').setDepth(0);
            break;
        }
      }
    }
  }

  /**
   * Crée les murs de collision invisibles
   * @private
   */
  _createCollisionWalls() {
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        if (!isWalkable(col, row)) {
          const x = col * TILE_SIZE + TILE_SIZE / 2;
          const y = row * TILE_SIZE + TILE_SIZE / 2;
          const wall = this.add.rectangle(x, y, TILE_SIZE, TILE_SIZE);
          this.wallsGroup.add(wall);
        }
      }
    }
  }

  /**
   * Crée les marqueurs visuels des zones de quiz
   * @private
   */
  _buildQuizMarkers() {
    QUIZ_ZONES.forEach((zone) => {
      const x = zone.col * TILE_SIZE + TILE_SIZE / 2;
      const y = zone.row * TILE_SIZE + TILE_SIZE / 2;

      const marker = this.add.image(x, y, 'quiz_zone');
      marker.setDepth(1);
      marker.setAlpha(0.8);

      // Animation de pulsation
      this.tweens.add({
        targets: marker,
        scaleX: 1.1,
        scaleY: 1.1,
        alpha: 1,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1,
      });

      this._quizMarkers[zone.questionId] = marker;
    });
  }

  // ═══════════════════════════════════════════════════════
  // GESTION DES JOUEURS
  // ═══════════════════════════════════════════════════════

  /**
   * Ajoute un sprite de joueur
   * @private
   */
  _addPlayerSprite(player, x, y) {
    const sprite = new PlayerSprite(this, player, x, y);
    this._sprites.set(player.id, sprite);
    return sprite;
  }

  /**
   * Retire un sprite de joueur
   * @private
   */
  _removePlayerSprite(playerId) {
    const sprite = this._sprites.get(playerId);
    if (sprite) {
      sprite.destroy();
      this._sprites.delete(playerId);
    }
  }

  /**
   * Obtient une position de spawn
   * @private
   */
  _getSpawnPosition(index) {
    const spawn = SPAWN_POSITIONS[index % SPAWN_POSITIONS.length];
    return {
      x: spawn.col * TILE_SIZE + TILE_SIZE / 2,
      y: spawn.row * TILE_SIZE + TILE_SIZE / 2,
    };
  }

  // ═══════════════════════════════════════════════════════
  // INPUT ET DÉPLACEMENT
  // ═══════════════════════════════════════════════════════

  /**
   * Configure les contrôles clavier
   * @private
   */
  _setupInput() {
    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });
    this._spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  /**
   * Gère le déplacement du joueur local avec normalisation
   * @private
   */
  _handlePlayerMovement() {
    const local = gameState.localPlayer;
    const sprite = this._sprites.get(local.id);
    if (!sprite) return;

    // Collecter les inputs
    let vx = 0;
    let vy = 0;

    if (this._cursors.left.isDown || this._wasd.left.isDown) vx = -1;
    if (this._cursors.right.isDown || this._wasd.right.isDown) vx = 1;
    if (this._cursors.up.isDown || this._wasd.up.isDown) vy = -1;
    if (this._cursors.down.isDown || this._wasd.down.isDown) vy = 1;

    // Vitesse selon l'état du joueur
    const speed = local.isSlowed ? PLAYER_SPEED_SLOWED : PLAYER_SPEED;

    // Déplacer le sprite (la normalisation est gérée dans PlayerSprite.move)
    sprite.move(vx, vy, speed);

    // Synchroniser la position avec le modèle
    local.col = Math.floor(sprite.x / TILE_SIZE);
    local.row = Math.floor(sprite.y / TILE_SIZE);

    // Envoyer la position aux autres joueurs
    if (vx !== 0 || vy !== 0) {
      multiplayer.sendMove(local.col, local.row);
    }
  }

  /**
   * Gère l'attaque (ESPACE)
   * @private
   */
  _handleAttack(time) {
    if (!this._spaceKey.isDown) return;
    if (time - this._lastAttackTime < ATTACK_COOLDOWN) return;

    this._lastAttackTime = time;
    const local = gameState.localPlayer;
    const localSprite = this._sprites.get(local.id);
    if (!localSprite) return;

    // Trouver les joueurs à portée
    this._sprites.forEach((sprite, playerId) => {
      if (playerId === local.id) return;

      const dist = Phaser.Math.Distance.Between(
        localSprite.x, localSprite.y,
        sprite.x, sprite.y
      );

      if (dist <= ATTACK_RANGE) {
        // Appliquer l'effet de ralentissement
        const player = gameState.players.get(playerId);
        if (player) {
          player.applySlowEffect(3000);
          sprite.setSlowEffect(true);
          sprite.showAttackHit();
          multiplayer.sendAttack(playerId);
        }
      }
    });

    // Feedback visuel
    this._hud.showMessage('⚔️  Attaque !', '#ff4444', 800);
  }

  // ═══════════════════════════════════════════════════════
  // QUIZ
  // ═══════════════════════════════════════════════════════

  /**
   * Vérifie si le joueur est sur une zone de quiz
   * @private
   */
  _checkQuizZones() {
    const local = gameState.localPlayer;
    const localSprite = this._sprites.get(local.id);
    if (!localSprite) return;

    QUIZ_ZONES.forEach((zone) => {
      if (local.answeredQuizzes.has(zone.questionId)) return;

      const zoneX = zone.col * TILE_SIZE + TILE_SIZE / 2;
      const zoneY = zone.row * TILE_SIZE + TILE_SIZE / 2;
      const dist = Phaser.Math.Distance.Between(
        localSprite.x, localSprite.y,
        zoneX, zoneY
      );

      if (dist < TILE_SIZE) {
        // Déclencher le quiz
        this._openQuiz(zone.questionId);
      }
    });
  }

  /**
   * Ouvre l'interface de quiz
   * @private
   */
  _openQuiz(questionId) {
    const local = gameState.localPlayer;
    local.answeredQuizzes.add(questionId);
    
    // Arrêter le joueur
    const localSprite = this._sprites.get(local.id);
    if (localSprite) {
      localSprite.stop();
    }

    // Ouvrir la scène de quiz en overlay
    this.scene.pause();
    this.scene.launch('QuizScene', { questionId });
  }

  /**
   * Callback après réponse au quiz
   * @private
   */
  _onQuizAnswered({ correct, points }) {
    const local = gameState.localPlayer;
    const localSprite = this._sprites.get(local.id);

    if (correct) {
      local.addScore(points);
      if (localSprite) {
        localSprite.updateScore(local.score);
        localSprite.showQuizPoint(points);
      }
      this._hud.updateScore(local.score);
      // Le score est envoyé automatiquement via les événements
    }

    this._hud.updateRanking(gameState.getPlayersSorted());
    this.scene.resume();
  }

  // ═══════════════════════════════════════════════════════
  // EFFETS ET MISE À JOUR
  // ═══════════════════════════════════════════════════════

  /**
   * Met à jour les effets de ralentissement
   * @private
   */
  _updateSlowEffects() {
    this._sprites.forEach((sprite, playerId) => {
      const player = gameState.players.get(playerId);
      if (player && sprite) {
        sprite.setSlowEffect(player.isSlowed);
      }
    });
  }

  /**
   * Callback du timer
   * @private
   */
  _onTimerTick() {
    this._timeLeft--;
    this._hud.updateTimer(this._timeLeft);

    if (this._timeLeft <= 0) {
      this._endGame();
    }
  }

  /**
   * Termine la partie
   * @private
   */
  _endGame() {
    gameState.gameEnded = true;
    this._timerEvent.remove();
    // Pas besoin d'envoyer endGame au serveur
    this.scene.start('LeaderboardScene');
  }

  // ═══════════════════════════════════════════════════════
  // MULTIJOUEUR
  // ═══════════════════════════════════════════════════════

  /**
   * Configure les événements multijoueur
   * @private
   */
  _setupMultiplayerEvents() {
    this._onPlayerMoved = ({ player }) => {
      const sprite = this._sprites.get(player.id);
      if (sprite && !player.isLocal) {
        const targetX = player.col * TILE_SIZE + TILE_SIZE / 2;
        const targetY = player.row * TILE_SIZE + TILE_SIZE / 2;
        
        // Déplacer avec tween pour fluidité
        this.tweens.add({
          targets: sprite.sprite,
          x: targetX,
          y: targetY,
          duration: 200,
          ease: 'Linear',
        });
      }
    };

    this._onPlayerAttacked = ({ targetId }) => {
      const sprite = this._sprites.get(targetId);
      if (sprite) sprite.showAttackHit();
    };

    this._onPlayerJoined = (player) => {
      const pos = this._getSpawnPosition(this._sprites.size);
      this._addPlayerSprite(player, pos.x, pos.y);
    };

    this._onPlayerLeft = (id) => {
      this._removePlayerSprite(id);
    };

    this._onScoreUpdate = ({ playerId, score }) => {
      const sprite = this._sprites.get(playerId);
      if (sprite) sprite.updateScore(score);
      this._hud.updateRanking(gameState.getPlayersSorted());
    };

    multiplayer.on('playerMoved', this._onPlayerMoved);
    multiplayer.on('playerAttacked', this._onPlayerAttacked);
    multiplayer.on('playerJoined', this._onPlayerJoined);
    multiplayer.on('playerLeft', this._onPlayerLeft);
    multiplayer.on('scoreUpdate', this._onScoreUpdate);
  }

  // ═══════════════════════════════════════════════════════
  // CLEANUP
  // ═══════════════════════════════════════════════════════

  shutdown() {
    multiplayer.off('playerMoved', this._onPlayerMoved);
    multiplayer.off('playerAttacked', this._onPlayerAttacked);
    multiplayer.off('playerJoined', this._onPlayerJoined);
    multiplayer.off('playerLeft', this._onPlayerLeft);
    multiplayer.off('scoreUpdate', this._onScoreUpdate);
    this.events.off('quizAnswered', this._onQuizAnswered);
  }
}
