/**
 * server/ws-server.js
 * Serveur WebSocket simple pour le multijoueur inter-navigateurs.
 *
 * Lancer avec :  node server/ws-server.js
 * (dans le dossier WaliDEVOXXDeploy)
 *
 * Puis dans MultiplayerService.js, mettre :
 *   const WS_URL = 'ws://localhost:3001';
 */
import { WebSocketServer } from 'ws';

const PORT = 3001;
const wss  = new WebSocketServer({ port: PORT });

/** rooms : Map<roomId, Set<WebSocket>> */
const rooms = new Map();

wss.on('connection', (ws, req) => {
  const url    = new URL(req.url, 'http://localhost');
  const roomId = url.searchParams.get('room') || 'room_default';

  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  const room = rooms.get(roomId);
  room.add(ws);

  console.log(`[WS] Connexion room="${roomId}" — ${room.size} joueur(s)`);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // Diffuser le message à tous les autres membres de la salle
    room.forEach((client) => {
      if (client !== ws && client.readyState === 1 /* OPEN */) {
        client.send(JSON.stringify(msg));
      }
    });
  });

  ws.on('close', () => {
    room.delete(ws);
    console.log(`[WS] Déconnexion room="${roomId}" — ${room.size} joueur(s)`);
    if (room.size === 0) rooms.delete(roomId);
  });
});

console.log(`🌐 Serveur WebSocket démarré sur ws://localhost:${PORT}`);
console.log(`   Ouvrez le jeu dans plusieurs navigateurs sur http://localhost:8080`);
