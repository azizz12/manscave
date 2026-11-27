// Serveur multijoueur de MAN'SCAVE
// Il relaie la « présence » de chaque joueur (position, voiture, chat…) aux autres joueurs de la même salle.
// Une salle = un code (ex. K7QX) qu'on met à la fin du lien du jeu : https://.../manscave/#salle-K7QX
const http = require('http');
const crypto = require('crypto');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 10000;
const MAX_JOUEURS_PAR_SALLE = 12;
const MESSAGES_PAR_SECONDE = 40;          // au-delà, les messages d'un joueur sont ignorés (anti-spam)

// Une petite page texte : Render s'en sert pour vérifier que le serveur est vivant
const serveur = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Serveur MAN'SCAVE : OK (${compterJoueurs()} joueur(s) en ligne)\n`);
});

const wss = new WebSocketServer({ server: serveur, maxPayload: 8 * 1024 });
const salles = new Map();                  // code de salle → Map(id du joueur → connexion)

const compterJoueurs = () => [...salles.values()].reduce((n, s) => n + s.size, 0);
function envoyer(ws, message) {
  if (ws.readyState === ws.OPEN) ws.send(typeof message === 'string' ? message : JSON.stringify(message));
}

wss.on('connection', (ws, req) => {
  const adresse = new URL(req.url, 'http://serveur');
  const code = (adresse.searchParams.get('salle') || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12);
  if (!code) { ws.close(1008, 'Code de salle manquant'); return; }
  let salle = salles.get(code);
  if (!salle) { salle = new Map(); salles.set(code, salle); }
  if (salle.size >= MAX_JOUEURS_PAR_SALLE) { ws.close(1013, 'Salle pleine'); return; }

  const id = crypto.randomUUID().slice(0, 8);
  ws.id = id; ws.presence = null; ws.vivant = true; ws.jetons = MESSAGES_PAR_SECONDE;
  salle.set(id, ws);

  // Au nouveau venu : son identifiant + la présence de ceux qui sont déjà là
  envoyer(ws, { t: 'bienvenue', id, pairs: [...salle.values()].filter(a => a !== ws && a.presence).map(a => ({ id: a.id, d: a.presence })) });

  ws.on('pong', () => { ws.vivant = true; });
  ws.on('message', (donnees, binaire) => {
    if (binaire || --ws.jetons < 0) return;
    let m;
    try { m = JSON.parse(donnees); } catch (e) { return; }
    if (!m || m.t !== 'p' || typeof m.d !== 'object' || m.d === null || Array.isArray(m.d)) return;
    ws.presence = m.d;
    const relais = JSON.stringify({ t: 'p', id, d: m.d });
    for (const autre of salle.values()) if (autre !== ws) envoyer(autre, relais);
  });
  ws.on('close', () => {
    salle.delete(id);
    for (const autre of salle.values()) envoyer(autre, { t: 'part', id });
    if (!salle.size) salles.delete(code);
  });
  ws.on('error', () => {});
});

// Toutes les 25 s : on vérifie que chaque joueur répond encore (sinon on libère sa place)
setInterval(() => {
  for (const ws of wss.clients) {
    if (!ws.vivant) { ws.terminate(); continue; }
    ws.vivant = false; ws.ping();
  }
}, 25000);
// Chaque seconde, chacun récupère son « crédit » de messages
setInterval(() => { for (const ws of wss.clients) ws.jetons = MESSAGES_PAR_SECONDE; }, 1000);

serveur.listen(PORT, () => console.log(`Serveur MAN'SCAVE prêt sur le port ${PORT}`));
module.exports = serveur;
