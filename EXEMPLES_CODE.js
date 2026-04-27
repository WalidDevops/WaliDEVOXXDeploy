/**
 * EXEMPLES D'UTILISATION - Système d'avatars humanisés
 * 
 * Ce fichier contient des exemples commentés pour bien utiliser
 * le nouveau système d'avatars et de déplacement.
 */

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 1 : Créer un avatar personnalisé dans le Preloader
// ═══════════════════════════════════════════════════════════════

import { AvatarManager } from '../managers/AvatarManager.js';

export class Preloader extends Phaser.Scene {
  create() {
    // Générer les spritesheets de base (homme et femme)
    AvatarManager.generateSpritesheets(this);
    
    // Créer les animations
    AvatarManager.createAnimations(this, 'male');
    AvatarManager.createAnimations(this, 'female');
    
    // Les sprites 'male' et 'female' sont maintenant disponibles
    // dans toutes les scènes du jeu
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 2 : Créer un joueur avec PlayerSprite
// ═══════════════════════════════════════════════════════════════

import { PlayerSprite } from '../components/PlayerSprite.js';

export class GameScene extends Phaser.Scene {
  create() {
    // Configuration du joueur
    const playerData = {
      id: 'player_123',
      nickname: 'John Doe',
      score: 0,
      isLocal: true,
      avatarConfig: {
        gender: 'male',
        skinColor: 0,
        hairColor: 2,
        clothingColor: 1,
      },
    };

    // Créer le sprite à la position (400, 300)
    this.playerSprite = new PlayerSprite(this, playerData, 400, 300);
    
    // ⚠️ IMPORTANT : Ajouter les collisions avec les murs
    this.physics.add.collider(
      this.playerSprite.sprite,
      this.wallsGroup
    );
  }

  update() {
    // ⚠️ IMPORTANT : Mettre à jour chaque frame
    this.playerSprite.update();
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 3 : Système de déplacement complet avec normalisation
// ═══════════════════════════════════════════════════════════════

export class GameScene extends Phaser.Scene {
  create() {
    // Configuration du clavier
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.Z,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.Q,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    // Constantes de vitesse
    this.SPEED_NORMAL = 120;
    this.SPEED_SLOWED = 60;
  }

  update() {
    // ─── 1. COLLECTER LES INPUTS ───────────────────────
    let vx = 0;
    let vy = 0;

    // Flèches OU ZQSD
    if (this.cursors.left.isDown || this.wasd.left.isDown) vx = -1;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx = 1;
    if (this.cursors.up.isDown || this.wasd.up.isDown) vy = -1;
    if (this.cursors.down.isDown || this.wasd.down.isDown) vy = 1;

    // ─── 2. DÉTERMINER LA VITESSE ──────────────────────
    const isSlowed = this.player.isSlowed; // État du joueur
    const speed = isSlowed ? this.SPEED_SLOWED : this.SPEED_NORMAL;

    // ─── 3. DÉPLACER AVEC NORMALISATION AUTOMATIQUE ────
    // ✅ La normalisation est gérée dans PlayerSprite.move()
    this.playerSprite.move(vx, vy, speed);

    // ─── 4. METTRE À JOUR LES LABELS ───────────────────
    this.playerSprite.update();

    // ─── 5. SYNCHRONISER LA POSITION ───────────────────
    // Optionnel : si vous avez un modèle séparé
    this.player.x = this.playerSprite.x;
    this.player.y = this.playerSprite.y;
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 4 : Animations manuelles
// ═══════════════════════════════════════════════════════════════

export class CustomScene extends Phaser.Scene {
  create() {
    // Créer un sprite standard
    this.avatar = this.physics.add.sprite(400, 300, 'male');
    
    // ─── Jouer les animations manuellement ─────────────
    
    // Marche vers le bas
    this.avatar.anims.play('male-walk-down', true);
    
    // Marche vers la gauche
    this.avatar.anims.play('male-walk-left', true);
    
    // Marche vers la droite
    this.avatar.anims.play('male-walk-right', true);
    
    // Marche vers le haut
    this.avatar.anims.play('male-walk-up', true);
    
    // Idle (immobile)
    this.avatar.anims.play('male-idle', true);
  }

  update() {
    // ─── Logique d'animation selon vélocité ────────────
    const vx = this.avatar.body.velocity.x;
    const vy = this.avatar.body.velocity.y;

    if (vx === 0 && vy === 0) {
      // Immobile
      this.avatar.anims.play('male-idle', true);
    } else if (Math.abs(vx) > Math.abs(vy)) {
      // Direction horizontale dominante
      if (vx > 0) {
        this.avatar.anims.play('male-walk-right', true);
      } else {
        this.avatar.anims.play('male-walk-left', true);
      }
    } else {
      // Direction verticale dominante
      if (vy > 0) {
        this.avatar.anims.play('male-walk-down', true);
      } else {
        this.avatar.anims.play('male-walk-up', true);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 5 : Effets visuels
// ═══════════════════════════════════════════════════════════════

export class GameScene extends Phaser.Scene {
  // ─── Effet de ralentissement ───────────────────────
  applySlowEffect() {
    this.playerSprite.setSlowEffect(true);
    
    // Retirer l'effet après 3 secondes
    this.time.delayedCall(3000, () => {
      this.playerSprite.setSlowEffect(false);
    });
  }

  // ─── Animation d'attaque subie ─────────────────────
  showAttack() {
    this.playerSprite.showAttackHit();
    // Flash rouge + shake du sprite
  }

  // ─── Points gagnés ─────────────────────────────────
  addPoints(points) {
    this.player.score += points;
    this.playerSprite.updateScore(this.player.score);
    this.playerSprite.showQuizPoint(points);
    // Texte "+50" qui monte et disparaît
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 6 : Collisions et zones
// ═══════════════════════════════════════════════════════════════

export class GameScene extends Phaser.Scene {
  create() {
    // ─── Créer un groupe de murs statiques ─────────────
    this.wallsGroup = this.physics.add.staticGroup();

    // Ajouter des murs (rectangles invisibles)
    for (let i = 0; i < 10; i++) {
      const wall = this.add.rectangle(i * 48, 0, 48, 48);
      this.wallsGroup.add(wall);
    }

    // ─── Ajouter les collisions ────────────────────────
    this.physics.add.collider(
      this.playerSprite.sprite,
      this.wallsGroup
    );

    // ─── Zones de déclenchement (overlap) ───────────────
    this.quizZone = this.physics.add.sprite(200, 200, 'quiz_zone');
    
    this.physics.add.overlap(
      this.playerSprite.sprite,
      this.quizZone,
      this.onQuizZoneEnter,
      null,
      this
    );
  }

  onQuizZoneEnter(player, zone) {
    console.log('Le joueur est entré dans la zone quiz !');
    // Déclencher le quiz, etc.
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 7 : Multijoueur - Synchroniser les joueurs distants
// ═══════════════════════════════════════════════════════════════

export class GameScene extends Phaser.Scene {
  create() {
    // Map des sprites de joueurs
    this.playerSprites = new Map();

    // Écouter les événements réseau
    multiplayer.on('playerMoved', this.onPlayerMoved.bind(this));
    multiplayer.on('playerJoined', this.onPlayerJoined.bind(this));
    multiplayer.on('playerLeft', this.onPlayerLeft.bind(this));
  }

  onPlayerMoved({ playerId, x, y }) {
    const sprite = this.playerSprites.get(playerId);
    if (!sprite) return;

    // ─── Déplacer avec tween pour fluidité ─────────────
    this.tweens.add({
      targets: sprite.sprite,
      x: x,
      y: y,
      duration: 200,
      ease: 'Linear',
    });

    // ─── Calculer la direction pour l'animation ────────
    const dx = x - sprite.x;
    const dy = y - sprite.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      sprite.playAnimation(dx > 0 ? 'walk-right' : 'walk-left');
    } else if (dy !== 0) {
      sprite.playAnimation(dy > 0 ? 'walk-down' : 'walk-up');
    }
  }

  onPlayerJoined(playerData) {
    // Créer un nouveau sprite pour le joueur distant
    const sprite = new PlayerSprite(
      this,
      playerData,
      playerData.x,
      playerData.y
    );
    this.playerSprites.set(playerData.id, sprite);
  }

  onPlayerLeft(playerId) {
    // Retirer le sprite
    const sprite = this.playerSprites.get(playerId);
    if (sprite) {
      sprite.destroy();
      this.playerSprites.delete(playerId);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 8 : Avatar personnalisé à la volée
// ═══════════════════════════════════════════════════════════════

export class AvatarScene extends Phaser.Scene {
  onContinue() {
    // Configuration choisie par l'utilisateur
    const avatarConfig = {
      gender: this.selectedGender, // 'male' ou 'female'
      skinColor: this.selectedSkinColor, // 0-5
      hairColor: this.selectedHairColor, // 0-6
      clothingColor: this.selectedClothingColor, // 0-8
      hairStyle: this.selectedHairStyle, // 0-5
      beardStyle: this.selectedBeardStyle, // 0-4 (homme seulement)
      glassesStyle: this.selectedGlassesStyle, // 0-3
    };

    // ─── Générer le spritesheet personnalisé ────────────
    const customKey = AvatarManager.generateCustomAvatar(
      this,
      avatarConfig
    );

    // ─── Sauvegarder pour utilisation dans GameScene ────
    localStorage.setItem('avatarConfig', JSON.stringify(avatarConfig));
    localStorage.setItem('avatarKey', customKey);

    // Passer à la scène suivante
    this.scene.start('LobbyScene');
  }
}

export class GameScene extends Phaser.Scene {
  create() {
    // ─── Charger la config sauvegardée ──────────────────
    const avatarConfig = JSON.parse(
      localStorage.getItem('avatarConfig')
    );

    const playerData = {
      id: 'player_local',
      nickname: 'John',
      score: 0,
      avatarConfig: avatarConfig, // ← Config personnalisée
      isLocal: true,
    };

    // Le sprite sera créé avec l'avatar personnalisé
    this.playerSprite = new PlayerSprite(this, playerData, 400, 300);
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 9 : Debugging et optimisation
// ═══════════════════════════════════════════════════════════════

export class GameScene extends Phaser.Scene {
  create() {
    // ─── Afficher les FPS ───────────────────────────────
    this.fpsText = this.add.text(10, 10, 'FPS: 0', {
      fontSize: '14px',
      color: '#00ff00',
    }).setScrollFactor(0).setDepth(1000);
  }

  update(time, delta) {
    // ─── Afficher les FPS ───────────────────────────────
    const fps = Math.round(1000 / delta);
    this.fpsText.setText(`FPS: ${fps}`);

    // ─── Logger la position du joueur ───────────────────
    if (this.input.keyboard.addKey('L').isDown) {
      console.log('Position:', {
        x: this.playerSprite.x,
        y: this.playerSprite.y,
        vx: this.playerSprite.body.velocity.x,
        vy: this.playerSprite.body.velocity.y,
      });
    }

    // ─── Vérifier les animations ────────────────────────
    if (this.input.keyboard.addKey('A').isDown) {
      console.log('Animation actuelle:', 
        this.playerSprite.sprite.anims.currentAnim?.key
      );
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// EXEMPLE 10 : Cas d'usage avancés
// ═══════════════════════════════════════════════════════════════

export class GameScene extends Phaser.Scene {
  // ─── Téléportation ──────────────────────────────────
  teleportPlayer(x, y) {
    this.playerSprite.setPosition(x, y);
    this.playerSprite.stop(); // Arrêter le mouvement
    
    // Effet visuel
    const flash = this.add.circle(x, y, 30, 0x00ffff, 0.8);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 500,
      onComplete: () => flash.destroy(),
    });
  }

  // ─── Boost de vitesse temporaire ───────────────────
  applySpeedBoost(duration = 5000) {
    const originalSpeed = this.SPEED_NORMAL;
    this.SPEED_NORMAL = 200; // Double vitesse
    
    this.playerSprite.sprite.setTint(0xffff00); // Teinte jaune
    
    this.time.delayedCall(duration, () => {
      this.SPEED_NORMAL = originalSpeed;
      this.playerSprite.sprite.clearTint();
    });
  }

  // ─── Changer d'avatar en cours de jeu ──────────────
  changeAvatar(newConfig) {
    const oldPos = { x: this.playerSprite.x, y: this.playerSprite.y };
    const oldPlayer = this.playerSprite.player;
    
    // Détruire l'ancien sprite
    this.playerSprite.destroy();
    
    // Créer le nouveau avec la nouvelle config
    oldPlayer.avatarConfig = newConfig;
    this.playerSprite = new PlayerSprite(
      this,
      oldPlayer,
      oldPos.x,
      oldPos.y
    );
    
    // Réappliquer les collisions
    this.physics.add.collider(
      this.playerSprite.sprite,
      this.wallsGroup
    );
  }

  // ─── Freezer le joueur (cutscene, dialogue) ────────
  freezePlayer() {
    this.playerSprite.stop();
    this.playerFrozen = true;
  }

  unfreezePlayer() {
    this.playerFrozen = false;
  }

  update() {
    if (this.playerFrozen) return; // Ignorer les inputs
    
    // ... reste du code de déplacement
  }
}

// ═══════════════════════════════════════════════════════════════
// 📝 NOTES IMPORTANTES
// ═══════════════════════════════════════════════════════════════

/**
 * ✅ BONNES PRATIQUES :
 * 
 * 1. Toujours appeler sprite.update() dans la boucle update()
 * 2. Utiliser sprite.move() au lieu de setVelocity directement
 * 3. Ajouter les collisions APRÈS avoir créé le sprite
 * 4. Détruire les sprites quand ils ne sont plus utilisés
 * 5. Utiliser des constantes pour les vitesses
 * 6. Préférer les tweens pour les mouvements non-joueur
 * 
 * ❌ À ÉVITER :
 * 
 * 1. setPosition() pour le déplacement du joueur
 * 2. Oublier d'appeler sprite.update()
 * 3. Créer des colliders multiples pour le même sprite
 * 4. Modifier directement sprite.sprite.x/y
 * 5. Oublier de normaliser la vélocité
 * 6. Créer des spritesheets dans update()
 */

// ═══════════════════════════════════════════════════════════════
// FIN DES EXEMPLES
// ═══════════════════════════════════════════════════════════════
