/**
 * main.js — Configuration Phaser et point d'entrée du jeu.
 *
 * Scènes enregistrées (ordre = ordre de démarrage possible) :
 *   Boot → Preloader → MainMenuScene → AvatarScene → LobbyScene
 *   → GameScene (+ QuizScene en overlay) → LeaderboardScene
 */
import { Boot }              from './scenes/Boot.js';
import { Preloader }         from './scenes/Preloader.js';
import { MainMenuScene }     from './scenes/MainMenuScene.js';
import { AvatarScene }       from './scenes/AvatarScene.js';
import { LobbyScene }        from './scenes/LobbyScene.js';
import { GameScene }         from './scenes/GameScene.js';
import { QuizScene }         from './scenes/QuizScene.js';
import { LeaderboardScene }  from './scenes/LeaderboardScene.js';
import { AUTO, Scale, Game } from 'phaser';

const config = {
  type:            AUTO,
  width:           1024,
  height:          768,
  backgroundColor: '#1a2a1a',
  scale: {
    mode:       Scale.FIT,
    autoCenter: Scale.CENTER_BOTH,
    width:      '100%',
    height:     '100%',
    fullscreenTarget: 'game-container',
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false, // Mettre à true pour voir les hitboxes
    },
  },
  scene: [
    Boot,
    Preloader,
    MainMenuScene,
    AvatarScene,
    LobbyScene,
    GameScene,
    QuizScene,
    LeaderboardScene,
  ],
};

const StartGame = (parent) => new Game({ ...config, parent });

export default StartGame;
