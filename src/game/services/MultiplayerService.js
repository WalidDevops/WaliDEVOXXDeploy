/**
 * MultiplayerService.js
 *
 * Deux modes de transport :
 *
 *  1. BroadcastChannel  – inter-onglets (même navigateur, même origine)
 *                         Fonctionne sans serveur. ← MODE PAR DÉFAUT
 *
 *  2. WebSocket         – inter-navigateurs / inter-machines
 *                         Nécessite `node server/ws-server.js` en arrière-plan.
 *                         Activer en mettant WS_URL = 'ws://localhost:3001'
 *
 * Événements émis vers les scènes :
 *   'connected'       – canal prêt
 *   'playerJoined'    – Player
 *   'playerLeft'      – playerId
 *   'playerMoved'     – { player, oldCol, oldRow }
 *   'playerAttacked'  – { targetId, duration }
 *   'scoreUpdate'     – { playerId, score }
 *   'gameStart'       – partie lancée
 *   'lobbyReady'      – au moins 2 joueurs dans la salle
 */
import { gameState }  from './GameStateService.js';
import { AVATARS }    from '../data/avatars.js';
import { isWalkable, SPAWN_POSITIONS } from '../data/map.js';

// ── Configuration ────────────────────────────────────────────────────────────
/** Mettre 'ws://localhost:3001' pour le mode WebSocket inter-navigateurs */
const WS_URL = 'ws://localhost:3001';
// ─────────────────────────────────────────────────────────────────────────────

class MultiplayerService {
  constructor() {
    this._channel     = null; // BroadcastChannel
    this._ws          = null; // WebSocket
    this._listeners   = {};
    this.connected    = false;
  }

  // ── Connexion ──────────────────────────────────────────────────────────────

  connect(roomId) {
    gameState.roomId = roomId;

    if (WS_URL) {
      this._connectWS(roomId);
    } else {
      this._connectBroadcast(roomId);
    }
  }

  // ── BroadcastChannel (inter-onglets) ──────────────────────────────────────

  _connectBroadcast(roomId) {
    const channelName = `escape_garden_${roomId}`;
    this._channel = new BroadcastChannel(channelName);
    this.connected = true;

    this._channel.onmessage = (evt) => {
      try { this._handleMessage(evt.data); } catch (_) {}
    };

    // Annoncer sa présence aux autres onglets
    this._broadcast({ type: 'player_join', player: gameState.localPlayer.toJSON() });
    // Demander la liste des joueurs déjà présents
    this._broadcast({ type: 'players_request', fromId: gameState.localPlayer.id });

    this._emit('connected');

    // Annoncer le départ à la fermeture de l'onglet
    window.addEventListener('beforeunload', this._onBeforeUnload);
  }

  // ── WebSocket (inter-navigateurs) ─────────────────────────────────────────

  _connectWS(roomId) {
    try {
      this._ws = new WebSocket(`${WS_URL}?room=${encodeURIComponent(roomId)}`);
      this._ws.onopen = () => {
        this.connected = true;
        this._wsSend({ type: 'player_join', player: gameState.localPlayer.toJSON() });
        this._emit('connected');
      };
      this._ws.onmessage = (evt) => {
        try { this._handleMessage(JSON.parse(evt.data)); } catch (_) {}
      };
      this._ws.onclose  = () => { this.connected = false; this._emit('disconnected'); };
      this._ws.onerror  = () => { console.warn('[MP] WS erreur → BroadcastChannel'); this._connectBroadcast(roomId); };
    } catch (_) {
      this._connectBroadcast(roomId);
    }
  }

  // ── Routage des messages entrants ──────────────────────────────────────────

  _handleMessage(msg) {
    const local = gameState.localPlayer;
    if (!local) return;

    switch (msg.type) {

      // Un joueur annonce son arrivée
      case 'player_join': {
        if (msg.player.id === local.id) return;
        if (!gameState.players.has(msg.player.id)) {
          const p = gameState.addPlayer(msg.player);
          this._emit('playerJoined', p);
          // Répondre avec nos propres données pour qu'il nous voie
          this._broadcast({ type: 'player_welcome', player: local.toJSON() });
          this._checkLobbyReady();
        }
        break;
      }

      // Réponse à player_join / players_request
      case 'player_welcome': {
        if (msg.player.id === local.id) return;
        if (!gameState.players.has(msg.player.id)) {
          const p = gameState.addPlayer(msg.player);
          this._emit('playerJoined', p);
          this._checkLobbyReady();
        }
        break;
      }

      // Un nouvel onglet demande la liste des joueurs
      case 'players_request': {
        if (msg.fromId === local.id) return;
        this._broadcast({ type: 'player_welcome', player: local.toJSON() });
        break;
      }

      // Mouvement d'un joueur distant
      case 'player_move': {
        if (msg.playerId === local.id) return;
        const mover = gameState.players.get(msg.playerId);
        if (mover) {
          const oldCol = mover.col;
          const oldRow = mover.row;
          mover.col = msg.col;
          mover.row = msg.row;
          this._emit('playerMoved', { player: mover, oldCol, oldRow });
        }
        break;
      }

      // Attaque reçue : ralentit la cible si c'est nous
      case 'player_attack': {
        if (msg.attackerId === local.id) return;
        const target = gameState.players.get(msg.targetId);
        if (target) {
          target.applySlowEffect(3000);
          this._emit('playerAttacked', { targetId: msg.targetId, duration: 3000 });
        }
        break;
      }

      // Mise à jour du score d'un autre joueur
      case 'score_update': {
        if (msg.playerId === local.id) return;
        const scorer = gameState.players.get(msg.playerId);
        if (scorer) scorer.score = msg.score;
        this._emit('scoreUpdate', { playerId: msg.playerId, score: msg.score });
        break;
      }

      // Démarrage de partie (diffusé par le host)
      case 'game_start': {
        if (!gameState.gameStarted) {
          gameState.gameStarted = true;
          this._emit('gameStart');
        }
        break;
      }

      // Un joueur quitte
      case 'player_leave': {
        if (msg.playerId === local.id) return;
        gameState.removePlayer(msg.playerId);
        this._emit('playerLeft', msg.playerId);
        break;
      }
    }
  }

  // ── API publique ───────────────────────────────────────────────────────────

  sendMove(col, row) {
    this._broadcast({ type: 'player_move', playerId: gameState.localPlayer.id, col, row });
  }

  sendAttack(targetId) {
    this._broadcast({ type: 'player_attack', attackerId: gameState.localPlayer.id, targetId });
  }

  sendQuizResult(questionId, correct, points) {
    if (correct) {
      const local = gameState.localPlayer;
      this._broadcast({ type: 'score_update', playerId: local.id, score: local.score });
    }
  }

  startGame() {
    this._broadcast({ type: 'game_start' });
    gameState.gameStarted = true;
    this._emit('gameStart');
  }

  // ── Gestionnaire d'événements ──────────────────────────────────────────────

  on(event, cb) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(cb);
  }

  off(event, cb) {
    if (cb && this._listeners[event]) {
      this._listeners[event] = this._listeners[event].filter((f) => f !== cb);
    } else {
      // off(event) sans callback → retire tous les listeners
      this._listeners[event] = [];
    }
  }

  _emit(event, data) {
    (this._listeners[event] || []).forEach((cb) => { try { cb(data); } catch (_) {} });
  }

  // ── Helpers internes ───────────────────────────────────────────────────────

  _broadcast(msg) {
    if (this._channel) this._channel.postMessage(msg);
    else if (this._ws && this._ws.readyState === WebSocket.OPEN) this._wsSend(msg);
  }

  _wsSend(data) {
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      this._ws.send(JSON.stringify(data));
    }
  }

  _checkLobbyReady() {
    if (gameState.players.size >= 2) {
      if (this._lonelyTimer) { clearTimeout(this._lonelyTimer); this._lonelyTimer = null; }
      this._emit('lobbyReady');
    }
  }

  _onBeforeUnload = () => {
    this._broadcast({ type: 'player_leave', playerId: gameState.localPlayer?.id });
  };

  disconnect() {
    window.removeEventListener('beforeunload', this._onBeforeUnload);

    if (gameState.localPlayer) {
      this._broadcast({ type: 'player_leave', playerId: gameState.localPlayer.id });
    }
    if (this._channel) { this._channel.close(); this._channel = null; }
    if (this._ws)      { this._ws.close();      this._ws      = null; }

    this.connected  = false;
    this._listeners = {};
  }
}

export const multiplayer = new MultiplayerService();

