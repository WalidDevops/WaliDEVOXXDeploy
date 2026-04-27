/**
 * GameStateService.js
 * Singleton conservant l'état global de la partie
 * (joueurs, paramètres de session, config de salle).
 */
import { Player } from '../models/Player.js';
import { SPAWN_POSITIONS } from '../data/map.js';

class GameStateService {
  constructor() {
    this.reset();
  }

  reset() {
    this.localPlayer  = null;
    /** Map<id, Player> */
    this.players      = new Map();
    this.roomId       = 'room_default';
    this.gameStarted  = false;
    this.gameEnded    = false;
  }

  /**
   * Crée et stocke le joueur local.
   * Persiste nickname + avatarId + avatarConfig dans localStorage.
   */
  setLocalPlayer(nickname, avatarId, avatarConfig = null) {
    const id = 'player_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const spawn = { col: 9, row: 11 };
    this.localPlayer = new Player({ 
      id, 
      nickname, 
      avatarId, 
      avatarConfig,
      isLocal: true, 
      ...spawn 
    });
    this.players.set(id, this.localPlayer);
    localStorage.setItem('eg_nickname', nickname);
    localStorage.setItem('eg_avatarId', String(avatarId));
    if (avatarConfig) {
      localStorage.setItem('eg_avatarConfig', JSON.stringify(avatarConfig));
    }
    return this.localPlayer;
  }

  /**
   * Retourne un index de spawn unique pour un joueur donné.
   * Le joueur local prend toujours l'index 0.
   * Les joueurs distants prennent le prochain index disponible.
   */
  getSpawnForPlayer(playerId) {
    // Si on connaît déjà la position (ex : reçue du réseau), on la garde
    const known = this.players.get(playerId);
    if (known) return { col: known.col, row: known.row };

    // Sinon, on attribue un spawn libre
    const usedIndices = new Set();
    this.players.forEach((p) => {
      const idx = SPAWN_POSITIONS.findIndex(s => s.col === p.col && s.row === p.row);
      if (idx !== -1) usedIndices.add(idx);
    });
    for (let i = 0; i < SPAWN_POSITIONS.length; i++) {
      if (!usedIndices.has(i)) return SPAWN_POSITIONS[i];
    }
    return SPAWN_POSITIONS[0];
  }

  /** Ajoute un joueur distant / bot si absent */
  addPlayer(data) {
    if (this.players.has(data.id)) return this.players.get(data.id);
    // Si pas de position dans les données, attribuer un spawn libre
    if (data.col === undefined || data.row === undefined) {
      const spawn = this.getSpawnForPlayer(data.id);
      data = { ...data, col: spawn.col, row: spawn.row };
    }
    const p = new Player(data);
    this.players.set(p.id, p);
    return p;
  }

  removePlayer(id) {
    this.players.delete(id);
  }

  /** Joueurs triés par score décroissant */
  getPlayersSorted() {
    return Array.from(this.players.values()).sort((a, b) => b.score - a.score);
  }

  getSavedNickname() {
    return localStorage.getItem('eg_nickname') || '';
  }

  getSavedAvatarId() {
    const v = localStorage.getItem('eg_avatarId');
    return v !== null ? parseInt(v, 10) : 0;
  }

  getSavedAvatarConfig() {
    const v = localStorage.getItem('eg_avatarConfig');
    if (v) {
      try {
        return JSON.parse(v);
      } catch (e) {
        return null;
      }
    }
    return null;
  }
}

export const gameState = new GameStateService();
