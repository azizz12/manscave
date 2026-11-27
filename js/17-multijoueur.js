// MAN'SCAVE — 17-multijoueur.js
// =====================================================================
// 9. LE MULTIJOUEUR EN TEMPS RÉEL : on voit les autres joueurs qui ont le jeu ouvert
// =====================================================================
// Chaque joueur envoie sa « présence » (position, voiture, surnom…) environ 15 fois par seconde.
// On reçoit celle des autres et on dessine leur voiture ou leur pilote, en lissant le mouvement.
// Les données reçues viennent d'autres joueurs : on les vérifie toujours avant de s'en servir.
const autresJoueurs = new Map();                       // identifiant du joueur → son avatar
let salle = null, dernierEnvoi = 0;
const nombre = (v, def = 0) => (typeof v === 'number' && isFinite(v) ? v : def);
const texteSur = v => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 16) : '');

function etiquetteJoueur(texte) {                       // surnom au-dessus d'un autre joueur (en orange)
  const t = document.createElement('canvas'); t.width = 512; t.height = 128;
  const c = t.getContext('2d');
  c.font = '700 56px system-ui, sans-serif';
  const nom = texte || 'Joueur';
  const largeur = Math.min(c.measureText(nom).width + 56, 504);
  c.fillStyle = 'rgba(230, 110, 20, 0.9)';
  c.beginPath(); if (c.roundRect) c.roundRect((512 - largeur) / 2, 20, largeur, 88, 44); else c.rect((512 - largeur) / 2, 20, largeur, 88); c.fill();
  c.fillStyle = '#ffffff'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(nom, 256, 66, 460);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(t), depthWrite: false }));
  s.scale.set(1.5, 0.375, 1);
  return s;
}
function creerAvatarPieton() {                         // une copie du pilote, sans mon surnom
  const clone = perso.clone(true);
  const sprites = [];
  clone.traverse(o => { if (o.isSprite) sprites.push(o); });
  sprites.forEach(s => s.parent.remove(s));
  clone.visible = true;
  const ref = { brasG: clone.children[7], brasD: clone.children[8], jambeG: clone.children[9], jambeD: clone.children[10],
                torse: clone.children[1], bandeTorse: clone.children[2], tete: clone.children[6] };
  for (const k of ['brasG', 'brasD', 'jambeG', 'jambeD']) ref[k].bas = ref[k].children[1];
  ref.tete.visible = true;
  return { groupe: clone, ref };
}
function creerAvatarVoiture(nom) {
  const groupe = new THREE.Group();
  const modele = creerVoiture(nom);
  modele.rotation.order = 'YXZ'; modele.rotation.y = -Math.PI / 2;
  groupe.add(modele);
  return { groupe, modele };
}

function majAvatar(id, presence) {
  let a = autresJoueurs.get(id);
  if (!a) {
    a = { mode: '', voiture: '', pieton: null, auto: null, cible: new THREE.Vector3(), pos: new THREE.Vector3(), cap: 0, capCible: 0,
          tangage: 0, roulis: 0, vitesse: 0, braquage: 0, nom: '', etiquette: null, presence: {} };
    autresJoueurs.set(id, a);
  }
  a.presence = presence;
  const mode = presence.m === 'v' ? 'v' : 'p';
  const voiture = DESIGNS[presence.c] ? presence.c : 'volt';
  const nom = texteSur(presence.n) || 'Joueur';
  // (Re)créer l'avatar si le mode, la voiture ou le surnom a changé
  if (mode !== a.mode || (mode === 'v' && voiture !== a.voiture)) {
    if (a.pieton) scene.remove(a.pieton.groupe);
    if (a.auto) scene.remove(a.auto.groupe);
    a.pieton = mode === 'p' ? creerAvatarPieton() : null;
    a.auto = mode === 'v' ? creerAvatarVoiture(voiture) : null;
    scene.add((a.pieton || a.auto).groupe);
    a.mode = mode; a.voiture = voiture; a.nom = '';
    a.pos.set(nombre(presence.x), nombre(presence.y), nombre(presence.z));
  }
  if (nom !== a.nom || !a.etiquette || a.etiquette.parent !== (a.pieton || a.auto).groupe) {
    if (a.etiquette) a.etiquette.parent?.remove(a.etiquette);
    a.etiquette = etiquetteJoueur(nom);
    a.etiquette.position.y = mode === 'v' ? 2.2 : 2.25;
    (a.pieton || a.auto).groupe.add(a.etiquette);
    a.nom = nom;
  }
  a.cible.set(nombre(presence.x), nombre(presence.y), nombre(presence.z));
  a.capCible = nombre(presence.r);
  a.tangageCible = nombre(presence.p); a.roulisCible = nombre(presence.l);
  a.vitesse = nombre(presence.s); a.braquage = clamp(nombre(presence.b), -1, 1);
  a.enLAir = presence.a === 1;
  // Couleur de sa voiture
  if (a.auto && typeof presence.co === 'string' && /^#[0-9a-fA-F]{6}$/.test(presence.co) && presence.co !== a.couleur) {
    a.couleur = presence.co; a.auto.modele.peinture.color.set(presence.co);
  }
  // Passager : on ne dessine pas son pilote à pied (il est assis dans la voiture de quelqu'un)
  a.passagerDe = mode === 'p' && typeof presence.pa === 'string' ? presence.pa.slice(0, 40) : null;
  (a.pieton || a.auto).groupe.visible = !a.passagerDe;
  // Ascenseur : une nouvelle commande de sa part → on l'applique aussi chez nous
  const asc = Array.isArray(presence.asc) && (presence.asc[0] === '-1' || presence.asc[0] === '-2') && typeof presence.asc[1] === 'number' ? presence.asc : null;
  if (!('ascVu' in a)) a.ascVu = asc ? asc[1] : null;     // à son arrivée : on n'applique pas ses vieilles commandes
  else if (asc && asc[1] !== a.ascVu) { a.ascVu = asc[1]; commandeAscenseur(asc[0]); }
  // Porte du stand : il l'a ouverte → elle s'ouvre chez nous aussi
  const po = typeof presence.po === 'number' ? presence.po : 0;
  if (!('poVu' in a)) a.poVu = po;
  else if (po !== a.poVu) { a.poVu = po; if (po) ouvrirPorte(true); }
}
function retirerAvatar(id) {
  const a = autresJoueurs.get(id);
  if (!a) return;
  if (a.pieton) scene.remove(a.pieton.groupe);
  if (a.auto) scene.remove(a.auto.groupe);
  autresJoueurs.delete(id);
}

// --- Multijoueur hors de Claude (ex. GitHub Pages) : notre propre serveur relais
// Mets ici l'adresse de ton serveur Render (en wss://). Vide = pas de multijoueur hors de Claude.
const SERVEUR_MULTI = 'wss://manscave.onrender.com';
// Le code de salle est à la fin du lien : …/manscave/#salle-K7QX (on en crée un s'il n'y en a pas)
function codeDeSalle() {
  const m = /^#salle-([A-Za-z0-9]{3,12})$/.exec(location.hash);
  if (m) return m[1].toUpperCase();
  const lettres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = ''; for (let k = 0; k < 4; k++) code += lettres[Math.floor(Math.random() * lettres.length)];
  try { history.replaceState(null, '', '#salle-' + code); } catch (e) { location.hash = 'salle-' + code; }
  return code;
}
// Imite exactement la « salle » de Claude (mêmes fonctions), pour que tout le reste du jeu marche pareil
function creerSalleWeb(adresse, code) {
  const moi = {}, pairs = new Map(), ecouteurs = [], ecoutesCo = [];
  let ws = null, monId = 'moi', ouvert = false, attente = 1000;
  const prevenir = change => { for (const f of ecouteurs) try { f(change); } catch (e) {} };
  const liste = () => [...pairs].map(([id, d]) => ({ peer: id, sameTab: false, kind: 'viewer', presence: d }));
  function connecter() {
    try { ws = new WebSocket(adresse.replace(/\/$/, '') + '/?salle=' + encodeURIComponent(code)); } catch (e) { return; }
    ws.onopen = () => { ouvert = true; attente = 1000; if (Object.keys(moi).length) ws.send(JSON.stringify({ t: 'p', d: moi })); ecoutesCo.forEach(f => f(true)); };
    ws.onmessage = e => {
      let m; try { m = JSON.parse(e.data); } catch (err) { return; }
      if (!m || typeof m !== 'object') return;
      if (m.t === 'bienvenue' && Array.isArray(m.pairs)) {
        monId = String(m.id);
        const arrives = [];
        for (const p of m.pairs) if (p && p.d && typeof p.d === 'object') { pairs.set(String(p.id), p.d); arrives.push({ peer: String(p.id), sameTab: false, kind: 'viewer', presence: p.d }); }
        prevenir({ peers: liste(), joined: arrives, left: [], updated: [] });
      } else if (m.t === 'p' && m.d && typeof m.d === 'object') {
        const id = String(m.id), nouveau = !pairs.has(id);
        pairs.set(id, m.d);
        const p = { peer: id, sameTab: false, kind: 'viewer', presence: m.d };
        prevenir({ peers: liste(), joined: nouveau ? [p] : [], left: [], updated: nouveau ? [] : [p] });
      } else if (m.t === 'part') {
        const id = String(m.id);
        if (pairs.delete(id)) prevenir({ peers: liste(), joined: [], left: [{ peer: id }], updated: [] });
      }
    };
    ws.onclose = () => {
      ouvert = false;
      const partis = [...pairs.keys()].map(id => ({ peer: id })); pairs.clear();
      if (partis.length) prevenir({ peers: [], joined: [], left: partis, updated: [] });
      ecoutesCo.forEach(f => f(false));
      setTimeout(connecter, attente); attente = Math.min(15000, attente * 2);   // on réessaie (le serveur gratuit se réveille)
    };
  }
  connecter();
  let dernier = 0, programme = null;
  const envoyer = () => { programme = null; dernier = performance.now(); if (ouvert) ws.send(JSON.stringify({ t: 'p', d: moi })); };
  return {
    code,
    presence(p) {
      Object.assign(moi, p);
      if (!programme) programme = setTimeout(envoyer, Math.max(0, 50 - (performance.now() - dernier)));
      return Promise.resolve();
    },
    peers: () => [{ peer: monId, sameTab: true, kind: 'viewer', presence: moi }, ...liste()],
    onPeers(f) { ecouteurs.push(f); return () => {}; },
    onConnection(f) { ecoutesCo.push(f); return () => {}; },
    connected: () => ouvert,
  };
}
// Le bloc « Jouer avec tes amis » du menu (seulement hors de Claude, avec un serveur)
function majBlocInviter() {
  if (!salle || !salle.code) return;
  $('bloc-inviter').style.display = 'grid';
  $('texte-salle').textContent = 'Salle ' + salle.code + ' · envoie ce lien à tes amis';
  $('lien-invitation').value = location.href.split('#')[0] + '#salle-' + salle.code;
}
$('btn-inviter').addEventListener('click', () => {
  const champ = $('lien-invitation');
  const ok = () => { $('btn-inviter').textContent = 'Lien copié ✓'; setTimeout(() => { $('btn-inviter').textContent = 'Copier le lien d\'invitation'; }, 2000); };
  if (navigator.clipboard) navigator.clipboard.writeText(champ.value).then(ok, () => { champ.select(); });
  else { champ.select(); try { document.execCommand('copy'); ok(); } catch (e) {} }
});
$('lien-invitation').addEventListener('focus', e => e.target.select());

// Connexion à la « salle » : tous ceux qui ont le jeu ouvert en même temps
(async () => {
  try { salle = window.claude && window.claude.use ? await window.claude.use('room') : null; } catch (e) { salle = null; }
  if (!salle && SERVEUR_MULTI) { salle = creerSalleWeb(SERVEUR_MULTI, codeDeSalle()); majBlocInviter(); }
  if (!salle) { majStatutMulti(); return; }
  salle.onPeers(change => {
    for (const p of change.left) retirerAvatar(p.peer);
    for (const p of [...change.joined, ...change.updated]) {
      if (p.sameTab || p.kind !== 'viewer') continue;
      if (p.presence && typeof p.presence.x === 'number') majAvatar(p.peer, p.presence);
    }
    majStatutMulti();
  }, () => { salle = null; majStatutMulti(); });
  salle.onConnection(() => majStatutMulti());
})();

function majStatutMulti() {
  const el = $('multi');
  if (!salle) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  const n = autresJoueurs.size;
  const enLigne = salle.connected();
  el.textContent = !enLigne ? (salle.code ? 'Multijoueur : réveil du serveur… (jusqu\'à 1 min)' : 'Multijoueur : connexion…')
    : n === 0 ? 'Multijoueur : seul pour l\'instant'
    : `Multijoueur : ${n + 1} joueurs en ligne`;
}

function envoyerPresence() {
  if (!salle) return;
  const maintenant = performance.now();
  if (maintenant - dernierEnvoi < 66) return;           // environ 15 fois par seconde
  dernierEnvoi = maintenant;
  const r2 = v => Math.round(v * 100) / 100;
  const sequence = depart.etat === 'sequence' ? Math.max(0, 5 + depart.attenteGo - depart.t) : -1;
  const p = enVoiture
    ? { m: 'v', c: voitureActive.nom, x: r2(vehicule.position.x), y: r2(vehicule.position.y), z: r2(vehicule.position.z),
        r: r2(auto.cap), p: r2(vehicule.rotation.x), l: r2(vehicule.rotation.z), s: r2(auto.vitesse), b: r2(auto.braquage), a: auto.enLair ? 1 : 0,
        fu: r2(auto.fumee || 0), bu: auto.burnout ? 1 : 0, fl: flammesEnvoyees,
        co: '#' + voitureActive.modele.peinture.color.getHexString() }
    : { m: 'p', c: '', x: r2(etat.x), y: r2(perso.position.y), z: r2(etat.z), r: r2(etat.angle), p: 0, l: 0,
        s: r2(etat.vitesseMarche || 0), b: 0, a: etat.auSol ? 0 : 1 };
  p.n = reglages.surnom || 'Joueur';
  p.pa = passager || null;                              // dans la voiture d'un ami (son identifiant)
  p.asc = ASC.commande || null;                         // dernière commande d'ascenseur
  p.po = porte.commande || 0;                           // dernière ouverture de la porte du stand
  p.go = r2(sequence);                                  // temps avant l'extinction des feux (départ groupé)
  p.t = depart.etat === 'course' ? depart.tour : 0;
  p.pr = presenceObjets();
  p.coup = coupEnvoye;
  salle.presence(p).catch(() => {});
}

// Départ groupé : si un autre joueur a lancé les feux et que je suis prêt sur la grille, je pars avec lui
function departGroupe() {
  if (!salle || depart.etat !== 'attente' || !depart.arme || !surLaGrille()) return;
  for (const a of autresJoueurs.values()) {
    const reste = nombre(a.presence.go, -1);
    if (reste > 0.3 && reste < 6.5) {
      depart.etat = 'sequence';
      depart.attenteGo = Math.max(0.0001, reste - 5);   // l'extinction aura lieu au même moment que chez lui
      depart.t = Math.max(0, 5 + depart.attenteGo - reste);
      remettreCones();
      annoncer('Départ groupé !', 'cp');
      return;
    }
  }
}

function majMultijoueur(dt) {
  envoyerPresence();
  majPassagers();
  departGroupe();
  const f = Math.min(1, dt * 10);
  for (const a of autresJoueurs.values()) {
    const g = (a.pieton || a.auto).groupe;
    if (a.pos.distanceTo(a.cible) > 40) a.pos.copy(a.cible); else a.pos.lerp(a.cible, f);   // téléportation si trop loin
    let d = a.capCible - a.cap; d = Math.atan2(Math.sin(d), Math.cos(d)); a.cap += d * f;
    a.tangage += ((a.tangageCible || 0) - a.tangage) * f; a.roulis += ((a.roulisCible || 0) - a.roulis) * f;
    g.position.copy(a.pos);
    if (a.auto) {
      g.rotation.set(a.tangage, a.cap, a.roulis, 'YXZ');
      const burnoutDistant = a.presence.bu === 1;
      for (const r of a.auto.modele.roues) {
        r.tourne.rotation.z += (burnoutDistant && !r.avant ? 48 : a.vitesse) * dt / r.rayon;
        if (r.avant) r.rotation.y = -a.braquage * 0.45;
      }
      const fl = nombre(a.presence.fl);                    // ses détonations d'anti-lag
      if (a.flPrec === undefined || fl < a.flPrec) a.flPrec = fl;
      if (fl > a.flPrec) {
        a.flPrec = fl;
        declencherFlamme(a.auto.modele, 0.8);
        const d = a.pos.distanceTo(camera.position);
        if (d < 90) sonBang(0.7, (1 - d / 90) * 0.8);
      }
      const fumeeDistante = clamp(nombre(a.presence.fu), 0, 1);
      if (fumeeDistante > 0.02) emettreFumee(a.auto.modele, fumeeDistante, dt, -Math.sin(a.cap) * a.vitesse, -Math.cos(a.cap) * a.vitesse);
      if (a.auto.modele.volant) a.auto.modele.volant.rotation.z = -a.braquage * 1.6;
    } else {
      g.rotation.y = a.cap;
      a.pas = (a.pas || 0) + dt * (2.2 + a.vitesse * 1.15) * (a.vitesse > 0.2 ? 1 : 0);
      const piedA = Math.sin(a.pas) >= 0;                 // ses pas, qu'on entend s'il est près de nous
      if (piedA !== a.piedPrec && a.vitesse > 0.3 && !a.enLAir && !a.passagerDe) {
        const d = a.pos.distanceTo(camera.position);
        if (d < 18) bruitDePas(a.pos.x, a.pos.y, a.pos.z, a.vitesse > 5, 1 - d / 18);
      }
      a.piedPrec = piedA;
      animerPerso(a.pas, a.vitesse, a.enLAir, tempsJeu, a.pieton.ref);
    }
  }
}
