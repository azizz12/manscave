// MAN'SCAVE — 18-adversaires-boucle.js
// =====================================================================
// 10. ADVERSAIRES (pilotés par l'ordinateur) ET BONUS À RAMASSER
// =====================================================================
const L_CIRCUIT = NB * PAS_PISTE;
const modulo = (a, n) => ((a % n) + n) % n;
// Position et orientation sur la piste à une distance « s » de la ligne et à « lat » mètres du centre
function poseSurPiste(s, lat) {
  const u = modulo(s, L_CIRCUIT) / PAS_PISTE;
  const i = Math.floor(u) % NB, f = u - Math.floor(u);
  const a = piste[i], b = piste[(i + 1) % NB];
  const lx = a.lx + (b.lx - a.lx) * f, lz = a.lz + (b.lz - a.lz) * f;
  const tx = a.tx + (b.tx - a.tx) * f, tz = a.tz + (b.tz - a.tz) * f;
  return {
    i, x: a.x + (b.x - a.x) * f + lx * lat, z: a.z + (b.z - a.z) * f + lz * lat,
    y: solPiste(a, lat) + (solPiste(b, lat) - solPiste(a, lat)) * f,
    cap: Math.atan2(-tx, -tz), pente: (solPiste(b, 0) - solPiste(a, 0)) / PAS_PISTE, releve: a.releve, w: a.w + (b.w - a.w) * f,
  };
}
// Vitesse à ne pas dépasser pour passer les virages qui arrivent (en tenant compte du freinage)
function vitesseSure(i, v, sp) {
  let vs = sp.vmax;
  const dist = v * v / (2 * sp.freinage * 0.8) + 20;
  for (let k = 0; k < dist / PAS_PISTE + 3; k++) {
    const s = piste[(i + k) % NB], kap = Math.abs(s.courbure) + 1e-6;
    let vk = sp.vmax; const w = sp.braquage * 0.85;
    for (let it = 0; it < 5; it++) vk = Math.min(sp.vmax, w * (1 - 0.55 * Math.min(1, vk / sp.vmax)) / kap);
    vs = Math.min(vs, Math.sqrt(vk * vk + 2 * sp.freinage * 0.8 * k * PAS_PISTE));
  }
  return vs;
}

// --- Effets : explosion (boule de feu + étincelles + lumière)
const explosions = [];
function exploser(x, y, z) {
  const lumiere = new THREE.PointLight('#ffaa44', 6, 30, 2);
  lumiere.position.set(x, y + 1, z); scene.add(lumiere);
  const boule = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: 0.9 }));
  boule.position.set(x, y + 0.8, z); scene.add(boule);
  explosions.push({ lumiere, boule, vie: 0.6 });
  jaillir(x, y + 0.8, z, 26);
  if (audio) sonChoc(1);
}
function majExplosions(dt) {
  for (let k = explosions.length - 1; k >= 0; k--) {
    const e = explosions[k];
    e.vie -= dt;
    const t = 1 - e.vie / 0.6;
    e.boule.scale.setScalar(0.5 + t * 3.2); e.boule.material.opacity = Math.max(0, 0.9 * (1 - t));
    e.lumiere.intensity = Math.max(0, 6 * (1 - t));
    if (e.vie <= 0) { scene.remove(e.boule, e.lumiere); explosions.splice(k, 1); }
  }
}

// --- Les adversaires
const DEFS_BOTS = [
  { nom: 'Nova', voiture: 'volt', couleur: '#18b6a5', niveau: 0.84 },
  { nom: 'Rex', voiture: 'furia', couleur: '#f2a516', niveau: 0.88 },
  { nom: 'Kiko', voiture: 'sprint', couleur: '#e0408a', niveau: 0.93 },
];
const PLACES_GRILLE = [[-3, 144], [3, 138], [-3, 132], [3, 126]];
let bots = [], botsEnPlace = false, sJoueur = 0, indicePrecedentJoueur = -1;

function bulleBouclier() {
  const m = new THREE.Mesh(new THREE.SphereGeometry(2.6, 24, 16),
    new THREE.MeshStandardMaterial({ color: '#4fd8ff', emissive: '#4fd8ff', emissiveIntensity: 0.6, transparent: true, opacity: 0.22, depthWrite: false }));
  m.scale.set(1.15, 0.65, 1.15); m.position.y = 0.6; m.visible = false;
  return m;
}
function placerBots() {
  retirerBots();
  const nb = clamp(reglages.adversaires ?? 3, 0, 3);
  // Les places libres de la grille (la plus proche du joueur est à lui)
  const libres = PLACES_GRILLE.slice().sort((a, b) =>
    Math.hypot(b[0] - vehicule.position.x, b[1] - vehicule.position.z) - Math.hypot(a[0] - vehicule.position.x, a[1] - vehicule.position.z)).slice(0, 3);
  for (let k = 0; k < nb; k++) {
    const d = DEFS_BOTS[k], [x, z] = libres[k];
    const info = trouverPiste(x, SOUS_SOL.y, z);
    const groupe = new THREE.Group();
    const modeleBot = creerVoiture(d.voiture, d.couleur);
    modeleBot.rotation.order = 'YXZ'; modeleBot.rotation.y = -Math.PI / 2;
    groupe.add(modeleBot);
    const tag = etiquetteJoueur(d.nom); tag.position.y = 2.2; groupe.add(tag);
    const bulle = bulleBouclier(); groupe.add(bulle);
    scene.add(groupe);
    const s0 = info.i * PAS_PISTE + ((x - info.s.x) * info.s.tx + (z - info.s.z) * info.s.tz);
    bots.push({ ...d, specs: SPECS[d.voiture], groupe, modele: modeleBot, bulle, s: s0, lat: info.lat, voie: info.lat, v: 0,
                vrille: 0, angleVrille: 0, bouclier: 0, boost: 0, objet: null, tObjet: 0, fini: false, tempsFin: 0, prochainChangement: 3 });
  }
  botsEnPlace = true;
}
function retirerBots() {
  for (const b of bots) scene.remove(b.groupe);
  bots = []; botsEnPlace = false;
}

function majBots(dt) {
  // Les adversaires arrivent sur la grille quand les feux s'allument, et repartent à la fin
  if (depart.etat === 'sequence' && !botsEnPlace) placerBots();
  if (depart.etat === 'attente' && botsEnPlace) retirerBots();
  // Distance parcourue par le joueur depuis le départ (pour le classement)
  if (depart.etat === 'course' && enVoiture) {
    const idx = auto.indicePiste ?? 0;
    if (indicePrecedentJoueur < 0) { indicePrecedentJoueur = idx; sJoueur = idx * PAS_PISTE; }
    let d = idx - indicePrecedentJoueur;
    if (d > NB / 2) d -= NB; if (d < -NB / 2) d += NB;
    sJoueur += d * PAS_PISTE; indicePrecedentJoueur = idx;
  } else if (depart.etat !== 'arrivee') indicePrecedentJoueur = -1;

  const enCourse = depart.etat === 'course' || depart.etat === 'arrivee';
  for (const b of bots) {
    const { i } = poseSurPiste(b.s, b.lat);
    if (b.vrille > 0) {                                 // touché : la voiture tourne sur elle-même
      b.vrille -= dt; b.angleVrille += dt * 13; b.v *= 1 - Math.min(1, dt * 2.5);
    } else if (enCourse) {
      const vs = vitesseSure(i, b.v, b.specs) * b.niveau * (b.fini ? 0.6 : 1);
      if (b.v < vs) b.v += (b.specs.accel * 0.9 * (1 - Math.pow(Math.min(1, b.v / b.specs.vmax), 8)) + (b.boost > 0 ? 16 : 0)) * dt;
      else b.v -= b.specs.freinage * 0.8 * dt;
      b.v -= 9 * (b.pose ? b.pose.pente : 0) * dt;         // ça ralentit en montée, ça accélère en descente
      b.v = clamp(b.v, 0, b.specs.vmax * (b.boost > 0 ? 1.18 : 1));
      b.angleVrille *= 1 - Math.min(1, dt * 6);
    }
    b.boost = Math.max(0, b.boost - dt); b.bouclier = Math.max(0, b.bouclier - dt);
    // Choix de la trajectoire : change de voie de temps en temps, évite pneus et barrières
    b.prochainChangement -= dt;
    if (b.prochainChangement < 0) { b.voie = (Math.random() - 0.5) * 6; b.prochainChangement = 2 + Math.random() * 4; }
    let cibleLat = b.voie;
    for (const p of PILES_PNEUS) if (modulo(p.i - i, NB) < 10) cibleLat = -Math.sign(p.lat) * 3.4;
    for (const br of BARRIERES_MOBILES) if (modulo(br.i - i, NB) < 16) cibleLat = -Math.sign(br.lat || 1) * (piste[br.i].w - 2.3);
    for (const bo of BOOSTS) { const k = modulo(bo.i - i, NB); if (k < 12) cibleLat = 0; if (k <= 3 && Math.abs(b.lat) < piste[bo.i].w * 0.55 && b.boost <= 0) b.boost = 1.6; }
    const w = piste[i].w;
    b.lat += clamp(cibleLat - b.lat, -5 * dt, 5 * dt);
    b.lat = clamp(b.lat, -w + 1.4, w - 1.4);
    b.s += b.v * dt;
    // Le joueur peut pousser un adversaire
    const pose = poseSurPiste(b.s, b.lat);
    if (enVoiture) {
      const dx = pose.x - vehicule.position.x, dz = pose.z - vehicule.position.z;
      if (Math.hypot(dx, dz) < 3.6 && Math.abs(pose.y - vehicule.position.y) < 2) {
        const p = piste[i]; b.lat += Math.sign(dx * p.lx + dz * p.lz || 1) * 2 * dt; b.v *= 1 - dt * 0.6;
      }
    }
    // Arrivée
    if (!b.fini && enCourse && b.s >= NB_TOURS * L_CIRCUIT) { b.fini = true; b.tempsFin = depart.chrono; }
    // Position à l'écran
    b.groupe.position.set(pose.x, pose.y, pose.z);
    b.groupe.rotation.set(Math.atan(pose.pente), pose.cap, Math.atan(pose.releve * 0.9), 'YXZ');
    b.modele.rotation.y = -Math.PI / 2 + b.angleVrille;
    for (const r of b.modele.roues) r.tourne.rotation.z += b.v * dt / r.rayon;
    b.bulle.visible = b.bouclier > 0;
    b.pose = pose;
    // Les adversaires utilisent leurs objets
    if (b.objet && enCourse) {
      b.tObjet += dt;
      if (b.tObjet > 1.5 && Math.random() < dt * 0.6) { utiliserObjet(b.objet, b); b.objet = null; }
    }
  }
}

// Classement : tous les pilotes, du premier au dernier
function classement() {
  const liste = [{ nom: reglages.surnom || 'Toi', moi: true, s: sJoueur, fini: depart.etat === 'arrivee', temps: depart.chrono }];
  for (const b of bots) liste.push({ nom: b.nom, moi: false, s: b.s, fini: b.fini, temps: b.tempsFin });
  return liste.sort((a, b) => (a.fini && b.fini ? a.temps - b.temps : a.fini ? -1 : b.fini ? 1 : b.s - a.s));
}
function positionJoueur() { return classement().findIndex(p => p.moi) + 1; }

// --- Les caisses mystère
const caisses = [];
{
  const t = document.createElement('canvas'); t.width = t.height = 128;
  const c = t.getContext('2d');
  const g = c.createLinearGradient(0, 0, 128, 128); g.addColorStop(0, '#ff5fd2'); g.addColorStop(0.5, '#ffd23f'); g.addColorStop(1, '#4fd8ff');
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 8; c.strokeRect(6, 6, 116, 116);
  c.fillStyle = '#ffffff'; c.font = '900 92px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('?', 64, 70);
  const tex = new THREE.CanvasTexture(t);
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.55, transparent: true, opacity: 0.92, roughness: 0.25 });
  const geo = new THREE.BoxGeometry(1.25, 1.25, 1.25);
  const valide = i => piste[i].type === 'piste' && !surTremplin(i) && piste[i].y > -1 && !piste[i].pont && Math.abs(piste[i].courbure) < 1 / 60
    && !BOOSTS.some(b => Math.abs(modulo(i - b.i + NB / 2, NB) - NB / 2) < 6) && !BARRIERES_MOBILES.some(b => Math.abs(modulo(i - b.i + NB / 2, NB) - NB / 2) < 10);
  for (const f of [0.1, 0.24, 0.39, 0.53, 0.66, 0.8]) {
    let i = Math.round(f * NB);
    while (!valide(i)) i = (i + 1) % NB;
    for (const k of [-0.45, 0, 0.45]) {
      const lat = k * piste[i].w;
      const m = new THREE.Mesh(geo, mat); m.castShadow = true; scene.add(m);
      const p = poseSurPiste(i * PAS_PISTE, lat);
      caisses.push({ mesh: m, x: p.x, y: p.y, z: p.z, actif: true, t: 0, phase: Math.random() * 6 });
    }
  }
}
function majCaisses(dt) {
  for (const c of caisses) {
    if (!c.actif) { c.t -= dt; if (c.t <= 0) { c.actif = true; c.mesh.visible = true; } continue; }
    c.mesh.position.set(c.x, c.y + 1.1 + Math.sin(tempsJeu * 2.5 + c.phase) * 0.18, c.z);
    c.mesh.rotation.set(tempsJeu * 0.8 + c.phase, tempsJeu * 1.3 + c.phase, 0);
    // Ramassage par le joueur
    if (enVoiture && Math.hypot(c.x - vehicule.position.x, c.z - vehicule.position.z) < 2.3 && Math.abs(c.y - vehicule.position.y) < 2.5) {
      prendreCaisse(c);
      if (!objetJoueur) { objetJoueur = tirerObjet(positionJoueur()); majAffichageObjet(); banniereObjet(objetJoueur); sonClic(); }
      continue;
    }
    for (const b of bots) {
      if (b.pose && Math.hypot(c.x - b.pose.x, c.z - b.pose.z) < 2.3) {
        prendreCaisse(c);
        if (!b.objet) { b.objet = tirerObjet(1 + bots.indexOf(b)); b.tObjet = 0; }
        break;
      }
    }
  }
}
function prendreCaisse(c) { c.actif = false; c.t = 5; c.mesh.visible = false; jaillir(c.x, c.y + 1, c.z, 10); }

// --- Les objets
const OBJETS = {
  missile: { nom: 'Missile', couleur: '#ff4a3a' },
  mine: { nom: 'Mine', couleur: '#ffb02e' },
  bouclier: { nom: 'Bouclier', couleur: '#4fd8ff' },
  turbo: { nom: 'Turbo', couleur: '#3ef08a' },
};
function tirerObjet(position) {                         // les derniers reçoivent plus souvent des objets puissants
  const r = Math.random(), retard = clamp((position - 1) / 3, 0, 1);
  if (r < 0.25 + retard * 0.2) return 'missile';
  if (r < 0.5 + retard * 0.15) return 'turbo';
  if (r < 0.75 + retard * 0.05) return 'mine';
  return 'bouclier';
}
let objetJoueur = null, bouclierJoueur = 0;
const bulleJoueur = bulleBouclier();
const projectiles = [];                                 // missiles et mines sur la piste

// Les grands titres quand on ramasse ou qu'on utilise un objet
const BANNIERES = {
  missile: { titre: 'READY TO FIRE', astuce: 'Missile armé · vise la voiture devant toi et appuie sur [F]', tir: 'MISSILE AWAY!' },
  mine: { titre: 'MINE ARMED', astuce: 'Pose-la juste avant un virage avec [F] : ceux qui suivent vont la prendre', tir: 'MINE DROPPED' },
  bouclier: { titre: 'SHIELD READY', astuce: 'Garde-le et active-le avec [F] quand un missile arrive sur toi', tir: 'SHIELD ON' },
  turbo: { titre: 'BOOST READY', astuce: 'Garde-le pour une ligne droite ou une sortie de virage · [F]', tir: 'BOOST!' },
};
function banniereObjet(type, utilise) {
  const b = BANNIERES[type]; if (!b) return;
  const el = $('banniere');
  el.style.setProperty('--c', OBJETS[type].couleur);
  el.querySelector('.b-titre').textContent = utilise ? b.tir : b.titre;
  const astuce = el.querySelector('.b-astuce');
  astuce.style.display = utilise ? 'none' : 'inline-block';
  astuce.textContent = '';
  // on construit l'astuce sans innerHTML : le texte reste du texte, et la touche est dans une étiquette <kbd>
  const morceaux = b.astuce.split('[F]');
  morceaux.forEach((m, k) => {
    astuce.append(document.createTextNode(m));
    if (k < morceaux.length - 1) { const kb = document.createElement('kbd'); kb.textContent = nomTouche(reglages.touches.utiliser); astuce.append(kb); }
  });
  el.classList.remove('montre', 'court'); void el.offsetWidth;
  el.classList.add(utilise ? 'court' : 'montre');
}
function majAffichageObjet() {
  const el = $('objet');
  if (!objetJoueur) { el.classList.add('vide'); $('objet-nom').textContent = 'Aucun objet'; $('objet-icone').style.background = ''; return; }
  el.classList.remove('vide');
  $('objet-nom').textContent = OBJETS[objetJoueur].nom;
  $('objet-icone').style.background = OBJETS[objetJoueur].couleur;
  $('objet-icone').dataset.type = objetJoueur;
}
function creerMissile() {
  const g = new THREE.Group();
  const corps = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.9, 12), std('#e8eaee', 0.3, 0.4));
  const pointe = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.32, 12), std('#d8262f', 0.35));
  pointe.position.y = 0.61;
  const flamme = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.5, 10), new THREE.MeshBasicMaterial({ color: '#ffb347' }));
  flamme.position.y = -0.7; flamme.rotation.x = Math.PI;
  g.add(corps, pointe, flamme);
  for (let k = 0; k < 4; k++) {
    const aile = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.22, 0.22), std('#d8262f', 0.35));
    aile.position.set(Math.cos(k * Math.PI / 2) * 0.13, -0.32, Math.sin(k * Math.PI / 2) * 0.13); aile.rotation.y = -k * Math.PI / 2; g.add(aile);
  }
  const conteneur = new THREE.Group(); g.rotation.x = -Math.PI / 2; conteneur.add(g);   // pointe vers -Z (l'avant)
  scene.add(conteneur);
  return conteneur;
}
function creerMine() {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), std('#2a2e36', 0.35, 0.8));
  g.add(dome);
  for (let k = 0; k < 8; k++) {
    const pic = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.25, 6), std('#c9ced6', 0.3, 0.9));
    const a = (k / 8) * Math.PI * 2; pic.position.set(Math.cos(a) * 0.4, 0.25, Math.sin(a) * 0.4); pic.lookAt(Math.cos(a) * 2, 1, Math.sin(a) * 2); pic.rotateX(Math.PI / 2); g.add(pic);
  }
  const voyant = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), new THREE.MeshBasicMaterial({ color: '#ff2a2a' }));
  voyant.position.y = 0.52; g.add(voyant); g.voyant = voyant;
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  scene.add(g);
  return g;
}

// Position et distance sur la piste d'un pilote (joueur, adversaire ou autre joueur en ligne)
function infosPilote(p) {
  if (p.type === 'joueur') return { s: (auto.indicePiste ?? 0) * PAS_PISTE, x: vehicule.position.x, y: vehicule.position.y, z: vehicule.position.z };
  if (p.type === 'bot') return { s: modulo(p.bot.s, L_CIRCUIT), x: p.bot.pose.x, y: p.bot.pose.y, z: p.bot.pose.z, lat: p.bot.lat };
  const info = trouverPiste(p.av.pos.x, p.av.pos.y, p.av.pos.z);
  return { s: info ? info.i * PAS_PISTE : 0, x: p.av.pos.x, y: p.av.pos.y, z: p.av.pos.z };
}
function pilotesEnPiste() {
  const liste = [];
  if (enVoiture) liste.push({ type: 'joueur' });
  for (const b of bots) if (b.pose) liste.push({ type: 'bot', bot: b });
  for (const [id, av] of autresJoueurs) if (av.mode === 'v') liste.push({ type: 'distant', id, av });
  return liste;
}
const memePilote = (a, b) => a && b && a.type === b.type && (a.bot === b.bot) && (a.id === b.id);

function utiliserObjet(type, bot) {
  const lanceur = bot ? { type: 'bot', bot } : { type: 'joueur' };
  const info = bot ? { s: modulo(bot.s, L_CIRCUIT), lat: bot.lat, y: bot.pose.y }
    : (() => { const t = trouverPiste(vehicule.position.x, vehicule.position.y, vehicule.position.z, auto.indicePiste ?? -1); return { s: t.i * PAS_PISTE, lat: t.lat, y: vehicule.position.y }; })();
  if (type === 'turbo') {
    if (bot) bot.boost = 2.2; else { auto.boost = 2.2; sonBoost(); }
  } else if (type === 'bouclier') {
    if (bot) bot.bouclier = 7; else bouclierJoueur = 7;
  } else if (type === 'missile') {
    // Cible : le pilote juste devant (moins de 320 m)
    let cible = null, meilleur = 320;
    for (const p of pilotesEnPiste()) {
      if (memePilote(p, lanceur)) continue;
      const d = modulo(infosPilote(p).s - info.s, L_CIRCUIT);
      if (d > 2 && d < meilleur) { meilleur = d; cible = p; }
    }
    projectiles.push({ type: 'missile', mesh: creerMissile(), s: info.s + 3, lat: info.lat, vie: 4.5, cible, lanceur, id: Math.random().toString(36).slice(2, 8) });
    if (audio) sonBoost();
  } else if (type === 'mine') {
    const p = { type: 'mine', mesh: creerMine(), s: info.s - 5, lat: info.lat, vie: 30, lanceur, protection: 1.5, id: Math.random().toString(36).slice(2, 8) };
    const pose = poseSurPiste(p.s, p.lat); p.x = pose.x; p.y = pose.y; p.z = pose.z;
    p.mesh.position.set(p.x, p.y, p.z);
    projectiles.push(p);
  }
  if (!bot) { objetJoueur = null; majAffichageObjet(); }
}
function utiliserObjetJoueur() {
  if (!enJeu || !enVoiture || !objetJoueur || (auto.vrille || 0) > 0) return;
  banniereObjet(objetJoueur, true);
  utiliserObjet(objetJoueur, null);
}

// Toucher un pilote : il part en vrille (sauf s'il a un bouclier)
let compteurCoups = 0, coupEnvoye = null;
function toucher(p) {
  if (p.type === 'joueur') {
    if (bouclierJoueur > 0) { bouclierJoueur = 0; annoncer('Bouclier brisé !', 'cp'); jaillir(vehicule.position.x, vehicule.position.y + 1, vehicule.position.z, 20); return; }
    auto.vx *= 0.15; auto.vz *= 0.15; auto.vrille = 1.3; auto.angleVrille = 0;
    exploser(vehicule.position.x, vehicule.position.y, vehicule.position.z);
    secousse = 0.9; annoncer('Touché !', 'faux');
  } else if (p.type === 'bot') {
    const b = p.bot;
    if (b.bouclier > 0) { b.bouclier = 0; jaillir(b.pose.x, b.pose.y + 1, b.pose.z, 20); return; }
    b.vrille = 1.3; b.v *= 0.25;
    exploser(b.pose.x, b.pose.y, b.pose.z);
  } else if (p.type === 'distant') {
    exploser(p.av.pos.x, p.av.pos.y, p.av.pos.z);
    compteurCoups++; coupEnvoye = { c: p.id, n: compteurCoups };   // le joueur touché le verra dans ma présence
  }
}

function majProjectiles(dt) {
  for (let k = projectiles.length - 1; k >= 0; k--) {
    const p = projectiles[k];
    p.vie -= dt;
    let detruire = p.vie <= 0, aTouche = false;
    if (p.type === 'missile') {
      p.s += 98 * dt;
      if (p.cible) {                                    // tête chercheuse : se rapproche de la trajectoire de la cible
        const ic = infosPilote(p.cible);
        const t = trouverPiste(ic.x, ic.y, ic.z);
        if (t) p.lat += clamp(t.lat - p.lat, -10 * dt, 10 * dt);
        const ecart = modulo(ic.s - p.s + L_CIRCUIT / 2, L_CIRCUIT) - L_CIRCUIT / 2;
        const pose = poseSurPiste(p.s, p.lat);
        if (Math.abs(ecart) < 4 && Math.hypot(pose.x - ic.x, pose.z - ic.z) < 3.2) { toucher(p.cible); detruire = true; aTouche = true; }
      }
      const pose = poseSurPiste(p.s, p.lat);
      p.mesh.position.set(pose.x, pose.y + 0.7, pose.z); p.mesh.rotation.y = pose.cap;
      p.x = pose.x; p.y = pose.y; p.z = pose.z;
      if (Math.random() < 0.7) jaillir(pose.x, pose.y + 0.7, pose.z, 1);   // traînée
      // un missile qui touche un mur ou une pile de pneus explose
      if (Math.abs(p.lat) > pose.w - 0.4) detruire = true;
      if (detruire && !aTouche) exploser(pose.x, pose.y, pose.z);
    } else if (p.type === 'mine') {
      p.protection -= dt;
      p.mesh.voyant.visible = Math.floor(tempsJeu * 4) % 2 === 0;
      for (const cible of pilotesEnPiste()) {
        if (cible.type === 'distant') continue;          // l'autre joueur gère lui-même ses collisions
        if (memePilote(cible, p.lanceur) && p.protection > 0) continue;
        const ic = infosPilote(cible);
        if (Math.hypot(ic.x - p.x, ic.z - p.z) < 1.9 && Math.abs(ic.y - p.y) < 2) { toucher(cible); detruire = true; break; }
      }
    }
    if (detruire) { scene.remove(p.mesh); projectiles.splice(k, 1); }
  }
  // Bouclier du joueur
  bouclierJoueur = Math.max(0, bouclierJoueur - dt);
  if (enVoiture && bulleJoueur.parent !== vehicule) vehicule.add(bulleJoueur);
  bulleJoueur.visible = enVoiture && bouclierJoueur > 0;
  bulleJoueur.material.opacity = 0.18 + Math.sin(tempsJeu * 8) * 0.05;
}

// Multijoueur : mes missiles et mines sont visibles chez les autres ; leurs mines peuvent me toucher
const objetsDistants = new Map();                       // id → maillage
const minesDejaTouchees = new Set();
function presenceObjets() {
  return projectiles.slice(0, 6).map(p => [p.type === 'missile' ? 1 : 2, Math.round(p.x * 10) / 10 || 0, Math.round(p.y * 10) / 10 || 0, Math.round(p.z * 10) / 10 || 0, p.id]);
}
function majObjetsDistants(monPeer) {
  const vus = new Set();
  for (const [id, a] of autresJoueurs) {
    const liste = Array.isArray(a.presence.pr) ? a.presence.pr.slice(0, 6) : [];
    for (const o of liste) {
      if (!Array.isArray(o) || o.length < 5) continue;
      const cle = id + ':' + texteSur(String(o[4]));
      const x = nombre(o[1]), y = nombre(o[2]), z = nombre(o[3]);
      vus.add(cle);
      let m = objetsDistants.get(cle);
      if (!m) { m = o[0] === 1 ? creerMissile() : creerMine(); objetsDistants.set(cle, m); }
      m.position.set(x, y + (o[0] === 1 ? 0.7 : 0), z);
      // Une mine de l'autre joueur sous mes roues ?
      if (o[0] === 2 && enVoiture && !minesDejaTouchees.has(cle) && Math.hypot(x - vehicule.position.x, z - vehicule.position.z) < 1.9) {
        minesDejaTouchees.add(cle); toucher({ type: 'joueur' });
      }
    }
    // Un autre joueur m'a touché avec un missile ?
    const coup = a.presence.coup;
    if (coup && typeof coup === 'object' && coup.c === monPeer && nombre(coup.n) > (a.dernierCoup || 0)) {
      a.dernierCoup = nombre(coup.n);
      if (enVoiture) toucher({ type: 'joueur' });
    }
  }
  for (const [cle, m] of objetsDistants) if (!vus.has(cle)) { scene.remove(m); objetsDistants.delete(cle); }
}

function majCourseEtObjets(dt) {
  majBots(dt);
  majCaisses(dt);
  majProjectiles(dt);
  majExplosions(dt);
  let monPeer = null;
  if (salle) { const moi = salle.peers().find(p => p.sameTab); monPeer = moi ? moi.peer : null; }
  majObjetsDistants(monPeer);
  // Vrille du joueur : la voiture tourne sur elle-même un instant
  if (enVoiture) {
    if ((auto.vrille || 0) > 0) { auto.vrille -= dt; auto.angleVrille = (auto.angleVrille || 0) + dt * 13; }
    else auto.angleVrille = (auto.angleVrille || 0) * (1 - Math.min(1, dt * 6));
    modele.rotation.y = -Math.PI / 2 + (auto.angleVrille || 0);
  }
  $('objet').style.display = enVoiture ? 'flex' : 'none';
}

// --- Le chat du multijoueur : touche T (ou bouton Chat), on écrit, Entrée pour envoyer
// Chaque message voyage dans la « présence » du joueur avec un numéro : un nouveau numéro = un nouveau message.
let numeroMessage = 0, monMessage = null;
const messagesVus = new Map();                         // joueur → dernier numéro de message affiché
const champChat = $('chat-champ'), boiteChat = $('chat-saisie');
const chatOuvert = () => boiteChat.classList.contains('ouvert');

function ajouterMessageChat(auteur, texte, moi) {
  const ligne = document.createElement('div');
  ligne.className = 'chat-ligne' + (moi ? ' moi' : '');
  const nom = document.createElement('b'); nom.textContent = auteur;          // textContent : jamais de HTML venu d'un autre joueur
  const corps = document.createElement('span'); corps.textContent = texte;
  ligne.append(nom, corps);
  const liste = $('chat-messages');
  liste.append(ligne);
  while (liste.children.length > 7) liste.firstChild.remove();
  setTimeout(() => ligne.classList.add('efface'), 14000);  // les messages s'effacent doucement
  if (!moi) sonClic();
}
function ouvrirChat() {
  if (!enJeu || !salle) { if (enJeu && !salle) annoncer('Chat : multijoueur non connecté', 'faux'); return; }
  if (document.pointerLockElement) { liberationVoulue = true; document.exitPointerLock(); }
  for (const k in touches) touches[k] = false;           // la voiture s'arrête d'accélérer pendant qu'on écrit
  boiteChat.classList.add('ouvert');
  champChat.value = '';
  setTimeout(() => champChat.focus(), 0);
}
function fermerChat(envoyer) {
  const texte = champChat.value.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u2028-\u202e\u2060-\u206f]/g, '').trim().slice(0, 120);
  boiteChat.classList.remove('ouvert');
  champChat.blur();
  if (envoyer && texte && salle) {
    numeroMessage++;
    monMessage = { i: numeroMessage, t: texte };
    salle.presence({ msg: monMessage }).catch(() => {});
    ajouterMessageChat(reglages.surnom || 'Moi', texte, true);
  }
  capturerSouris();
}
champChat.addEventListener('keydown', e => {
  e.stopPropagation();                                 // les touches tapées ne pilotent pas la voiture
  if (e.key === 'Enter') { e.preventDefault(); fermerChat(true); }
  if (e.key === 'Escape') { e.preventDefault(); fermerChat(false); }
});
$('chat-envoyer').addEventListener('click', () => fermerChat(true));
$('btn-chat').addEventListener('pointerdown', e => { e.stopPropagation(); chatOuvert() ? fermerChat(true) : ouvrirChat(); });
// Lire les nouveaux messages des autres joueurs
function lireMessagesChat() {
  for (const [id, a] of autresJoueurs) {
    const m = a.presence.msg;
    const ok = m && typeof m === 'object';
    const n = ok ? nombre(m.i) : 0, texte = ok && typeof m.t === 'string' ? m.t.slice(0, 120) : '';
    const deja = messagesVus.get(id);
    if (deja === undefined) { messagesVus.set(id, n); continue; }   // message d'avant mon arrivée : on ne l'affiche pas
    if (n > deja && texte) { messagesVus.set(id, n); ajouterMessageChat(a.nom || 'Joueur', texte, false); }
  }
}

const rayonCamera = new THREE.Raycaster();
const horloge = new THREE.Clock();
const camPos = new THREE.Vector3(-1, -4.5, 120);
let angleArriere = 0, angleLisse = 0, hauteurLisse = 0.45;   // angles de caméra lissés (rotation fluide)
let dernierIndice = '';

// Compteur d'images par seconde, et baisse automatique de la qualité si l'ordinateur n'arrive pas à suivre
const mesureFps = { images: 0, t: 0, lent: 0 };
function majFps(dtReel) {
  mesureFps.images++; mesureFps.t += dtReel;
  if (mesureFps.t < 0.5) return;
  const fps = mesureFps.images / mesureFps.t;
  mesureFps.images = 0; mesureFps.t = 0;
  const el = $('fps');
  el.textContent = Math.round(fps) + ' FPS';
  el.className = 'hud' + (fps < 30 ? ' faible' : fps < 50 ? ' moyen' : '');
  if (!enJeu || reglages.qualiteAuto === false || document.hidden) { mesureFps.lent = 0; return; }
  mesureFps.lent = fps < 38 ? mesureFps.lent + 0.5 : 0;
  if (mesureFps.lent >= 4 && reglages.qualite !== 'basse') {          // 4 secondes de suite sous 38 FPS
    reglages.qualite = reglages.qualite === 'haute' ? 'moyenne' : 'basse';
    appliquerQualite(); sauverReglages();
    annoncer('Qualité ' + (reglages.qualite === 'moyenne' ? 'moyenne' : 'basse') + ' (plus fluide)', 'cp');
    mesureFps.lent = 0;
  }
}

function boucle() {
  const dtReel = horloge.getDelta();
  const dt = Math.min(dtReel, 0.05);                 // temps écoulé depuis l'image précédente
  majFps(dtReel);
  for (const anim of animations) anim(dt);            // plateau tournant, etc.

  // --- a. Lire les commandes (clavier ou joystick)
  let avant = 0, cote = 0;
  if (appuye('avancer') || touches.arrowup) avant += 1;
  if (appuye('reculer') || touches.arrowdown) avant -= 1;
  if (appuye('gauche') || touches.arrowleft) cote -= 1;
  if (appuye('droite') || touches.arrowright) cote += 1;
  if (joystick.id !== null) { avant = -joystick.y; cote = joystick.x; }
  if (!enJeu) { avant = 0; cote = 0; }
  if (enVoiture && (auto.vrille || 0) > 0) { avant = 0; cote = 0; }   // en vrille : plus de contrôle

  let cibleCamera, angleVue, distance, hauteurVise;

  if (enVoiture) {
    // --- b1. En voiture
    const freinMain = enJeu && (appuye('freinMain') || freinTactile);
    const lesDeux = enJeu && (appuye('avancer') || touches.arrowup) && (appuye('reculer') || touches.arrowdown);
    const burnout = lesDeux && Math.abs(auto.vitesse || 0) < 6;            // Z + S à l'arrêt : burnout
    conduire(dt, Math.max(0, avant), lesDeux && !burnout ? 1 : Math.max(0, -avant), cote, freinMain, burnout);
    majAntiLag(dt);   // en roulant : on freine d'abord
    if (!glisse && !regardArriere) angleCamera *= 1 - Math.min(1, dt * 2);   // la caméra revient derrière la voiture
    hauteurCamera = Math.max(0.15, hauteurCamera);
    angleArriere += ((regardArriere ? Math.PI : 0) - angleArriere) * Math.min(1, dt * 11);   // clic droit : on regarde derrière
    angleVue = auto.cap + angleCamera + angleArriere;
    distance = 10.5 + Math.abs(auto.vitesse) * 0.035; hauteurVise = 1.1;   // la caméra recule un peu avec la vitesse
    cibleCamera = vehicule.position;
    majCompteur(dt);
  } else if (passager && majPassager()) {
    // --- b3. Passager dans la voiture d'un ami : la caméra suit sa voiture
    const a = autresJoueurs.get(passager);
    if (!glisse) angleCamera *= 1 - Math.min(1, dt * 2);
    hauteurCamera = Math.max(0.15, hauteurCamera);
    angleVue = a.cap + angleCamera; distance = 10.5 + Math.abs(a.vitesse) * 0.035; hauteurVise = 1.1;
    cibleCamera = a.pos.clone();
  } else {
    // --- b2. À pied
    const force = Math.min(1, Math.hypot(avant, cote));
    const court = appuye('courir') || force > 0.95 && joystick.id !== null;
    const vitesse = (court ? 7 : 3.2) * force;

    if (force > 0.05) {
      const direction = Math.atan2(-cote, avant) + angleCamera;   // gauche = vers la gauche de l'écran
      let nx = etat.x - Math.sin(direction) * vitesse * dt;
      let nz = etat.z - Math.cos(direction) * vitesse * dt;

      const R = 0.4;
      const liste = obstacles.concat(voitures.map(v => {
        const p = new THREE.Vector3(); v.groupe.getWorldPosition(p);
        return { x: p.x, z: p.z, rayon: 2.1, niveau: niveauDe(p.y) };   // les voitures garées bloquent aussi
      }));
      const nivPerso = niveauDe(etat.y);
      for (const o of liste) {
        if (!memeNiveau(o, nivPerso)) continue;
        if (o.boite) {
          if (nx > o.minX - R && nx < o.maxX + R && nz > o.minZ - R && nz < o.maxZ + R) {
            const sorties = [nx - (o.minX - R), (o.maxX + R) - nx, nz - (o.minZ - R), (o.maxZ + R) - nz];
            const m = Math.min(...sorties);
            if (m === sorties[0]) nx = o.minX - R; else if (m === sorties[1]) nx = o.maxX + R;
            else if (m === sorties[2]) nz = o.minZ - R; else nz = o.maxZ + R;
          }
        } else {
          const dx = nx - o.x, dz = nz - o.z, d = Math.hypot(dx, dz), min = o.rayon + R;
          if (d < min && d > 0) { nx = o.x + dx / d * min; nz = o.z + dz / d * min; }
        }
      }
      etat.x = clamp(nx, -1500, 2600);
      etat.z = clamp(nz, -1400, 2900);

      let diff = (direction + Math.PI) - etat.angle;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      if (!armeEnMain()) etat.angle += diff * Math.min(1, dt * 12);   // avec une arme, on garde le regard vers la visée
      etat.pas += dt * (2.2 + vitesse * 1.15);
    } else {
      etat.pas *= 0.8;
    }

    // Gravité et saut (le sol peut être en pente : la rampe)
    const sol = hauteurSol(etat.x, etat.z, etat.y);
    if (etat.auSol && etat.vitesseY <= 0 && etat.y - sol < 0.7) {
      etat.y = sol; etat.vitesseY = 0;                  // on « colle » au sol en descendant la rampe
    } else {
      etat.vitesseY -= 20 * dt;
      etat.y += etat.vitesseY * dt;
      if (etat.y <= sol) { etat.y = sol; etat.vitesseY = 0; etat.auSol = true; } else etat.auSol = false;
    }

    // Animation : marche, course, saut, respiration
    etat.vitesseMarche = force > 0.05 ? vitesse : 0;
    animerPerso(etat.pas, etat.vitesseMarche, !etat.auSol, tempsJeu);
    // Bruit des pas : un son chaque fois qu'un pied se pose (au rythme de l'animation)
    const pied = Math.sin(etat.pas) >= 0;
    if (pied !== etat.piedPrec && etat.auSol && etat.vitesseMarche > 0.3) bruitDePas(etat.x, etat.y, etat.z, court);
    if (etat.auSol && !etat.etaitAuSol) bruitDePas(etat.x, etat.y, etat.z, true, 1.4);   // réception d'un saut
    etat.piedPrec = pied; etat.etaitAuSol = etat.auSol;
    const rebond = Math.abs(Math.sin(etat.pas)) * 0.035 * Math.min(1, vitesse / 3);
    perso.position.set(etat.x, etat.y + rebond, etat.z);
    perso.rotation.y = etat.angle;
    ombre.position.set(etat.x, hauteurSol(etat.x, etat.z, etat.y) + 0.06, etat.z);
    ombre.scale.setScalar(1 - Math.min(0.5, (etat.y - sol) / 6));

    angleLisse += Math.atan2(Math.sin(angleCamera - angleLisse), Math.cos(angleCamera - angleLisse)) * Math.min(1, dt * 16);
    hauteurLisse += (hauteurCamera - hauteurLisse) * Math.min(1, dt * 16);
    angleVue = angleLisse; distance = armeEnMain() ? (viser ? 2.3 : 3.6) : 5.8; hauteurVise = armeEnMain() ? 1.55 : 1.25;
    cibleCamera = new THREE.Vector3(etat.x, etat.y, etat.z);
  }

  majEffets(dt);
  majFumee(dt);
  majFlammes(dt);
  majAscenseur(dt);
  majDJ(dt);
  majArmes(dt);
  majPorte(dt);
  majSon(dt);
  majDepart(dt);
  // Effet de vitesse : le champ de vision s'élargit quand on va vite
  const fovCible = viseePremiere() ? 44 : (vuePremiere ? 70 : 55) + (enVoiture ? Math.min(22, Math.abs(auto.vitesse) * 3.6 * 0.075) : 0);
  if (Math.abs(camera.fov - fovCible) > 0.05) { camera.fov += (fovCible - camera.fov) * Math.min(1, dt * 4); camera.updateProjectionMatrix(); }
  majAmbiance(cibleCamera, dt);
  majMultijoueur(dt);
  lireMessagesChat();
  majCourseEtObjets(dt);
  majCarte();

  // --- c. Indications à l'écran
  const tactile = matchMedia('(pointer: coarse)').matches;
  const pres = !enVoiture && distanceVoiture() < 6;
  const nomE = tactile ? 'le bouton Monter' : nomTouche(reglages.touches.entrer);
  const surGrilleEnAttente = surLaGrille() && depart.etat === 'attente';
  const indice = presConsole() ? (depart.arme ? `${nomTouche(reglages.touches.entrer)} : annuler la course` : `Appuie sur ${tactile ? 'le bouton E' : nomTouche(reglages.touches.entrer)} pour préparer la course`)
    : surGrilleEnAttente && !depart.arme ? 'Presse d\'abord le bouton de la console (à gauche de la grille)'
    : surGrilleEnAttente ? 'Arrête-toi sur la grille : le départ va se lancer'
    : enVoiture && depart.etat === 'sequence' ? 'Attends l\'extinction des feux…'
    : enVoiture
    ? (tactile ? 'Bouton Sortir pour descendre' : `${nomTouche(reglages.touches.entrer)} : sortir · ${nomTouche(reglages.touches.freinMain)} : frein à main · ${nomTouche(reglages.touches.avancer)}+${nomTouche(reglages.touches.reculer)} à l'arrêt : burnout`)
    : (pres ? `Appuie sur ${nomE} pour monter dans la ${voiturePlusProche().voiture.specs.nom}` : '');
  if (indice !== dernierIndice) {
    $('indice').textContent = indice; $('indice').style.display = 'none';   // indications masquées (les commandes sont dans le menu)
    dernierIndice = indice;
  }
  $('compteur').style.display = enVoiture ? 'block' : 'none';
  $('btn-e').style.display = tactile && (enVoiture || pres || presConsole()) ? 'block' : 'none';
  $('btn-e').textContent = enVoiture ? 'Sortir' : presConsole() ? 'Bouton' : 'Monter';
  btnSaut.textContent = enVoiture ? 'Frein' : 'Saut';
  $('btn-objet').style.display = tactile && enVoiture && objetJoueur ? 'block' : 'none';
  $('btn-chat').style.display = tactile && enJeu && salle ? 'block' : 'none';

  // --- d. La caméra : à la 3e personne elle suit en douceur ; à la 1re personne elle est dans les yeux du pilote
  tete.visible = !(vuePremiere && !enVoiture);
  for (const v of voitures) if (v.modele.bande) v.modele.bande.visible = !(vuePremiere && enVoiture && v === voitureActive);
  etiquette.visible = reglages.surnom.length > 0 && !vuePremiere;
  if (vuePremiere && enVoiture) {
    // Dans le cockpit : la caméra est attachée à la voiture, à la place des yeux du pilote
    modele.updateMatrixWorld();
    const oeil = modele.localToWorld(modele.oeil.clone());
    const aC = angleCamera + angleArriere;
    const regard = modele.localToWorld(new THREE.Vector3(modele.oeil.x - 10 * Math.cos(aC), modele.oeil.y - 0.9, modele.oeil.z - 10 * Math.sin(aC)));
    camera.position.copy(oeil);
    camPos.copy(oeil);
    camera.lookAt(regard);
  } else if (viseePremiere()) {
    // Visée à la 1re personne : la caméra dans les yeux, dans l'axe du pistolet
    const oeil = new THREE.Vector3(etat.x, perso.position.y + 1.62, etat.z);
    const tangage = -hauteurLisse + reculVue * 0.12;
    camera.position.copy(oeil); camPos.copy(oeil);
    camera.lookAt(oeil.x - Math.sin(angleLisse) * Math.cos(tangage) * 10, oeil.y + Math.sin(tangage) * 10, oeil.z - Math.cos(angleLisse) * Math.cos(tangage) * 10);
  } else if (vuePremiere && !passagerActif) {
    // À pied : la caméra est dans le casque ; on regarde où l'on veut en glissant
    const oeil = new THREE.Vector3(etat.x, perso.position.y + 1.68, etat.z);
    const tangage = (0.45 - hauteurCamera) * 1.3;
    camera.position.copy(oeil); camPos.copy(oeil);
    camera.lookAt(oeil.x - Math.sin(angleVue) * Math.cos(tangage) * 10, oeil.y + Math.sin(tangage) * 10, oeil.z - Math.cos(angleVue) * Math.cos(tangage) * 10);
  } else {
    const modeVoiture = enVoiture || passagerActif;
    const hauteurCam = modeVoiture ? 1.5 : armeEnMain() ? hauteurVise : 1.0;   // avec une arme, on pivote à hauteur d'épaule : la visée est droite
    const h = modeVoiture ? hauteurCamera : hauteurLisse;
    // Avec une arme, la caméra passe au-dessus de l'épaule droite (comme dans les jeux de tir)
    const epaule = !enVoiture && armeEnMain() ? (viser ? 0.75 : 0.6) : 0;
    const dX = Math.cos(angleVue) * epaule, dZ = -Math.sin(angleVue) * epaule;
    const cible = new THREE.Vector3(
      cibleCamera.x + Math.sin(angleVue) * distance * Math.cos(h) + dX,
      cibleCamera.y + hauteurCam + Math.sin(h) * distance,
      cibleCamera.z + Math.cos(angleVue) * distance * Math.cos(h) + dZ
    );
    if (modeVoiture) camPos.lerp(cible, Math.min(1, dt * 8));
    else camPos.copy(cible);                            // à pied : déjà lissé par les angles → la caméra tourne en orbite
    // Un mur entre le joueur et la caméra ? On rapproche la caméra juste devant le mur
    const vise = new THREE.Vector3(cibleCamera.x + dX, cibleCamera.y + hauteurVise, cibleCamera.z + dZ);
    const versCamera = camPos.clone().sub(vise);
    const longueur = versCamera.length();
    if (longueur > 0.01) {
      rayonCamera.set(vise, versCamera.divideScalar(longueur));
      rayonCamera.far = longueur + 0.3;
      const touche = rayonCamera.intersectObjects(mursCamera, false)[0];
      if (touche) camPos.copy(vise).addScaledVector(versCamera, Math.max(0.5, touche.distance - 0.35));
    }
    camera.position.copy(camPos);
    // Au sous-sol, la caméra reste sous le plafond
    if (cibleCamera.y < -3 && camera.position.z > RAMPE.z2 - 1 && camera.position.z < 178) camera.position.y = Math.min(camera.position.y, -1);
    if (!modeVoiture) camera.position.y = Math.max(camera.position.y, hauteurSol(camera.position.x, camera.position.z, cibleCamera.y) + 0.25);   // jamais sous le sol
    if (cibleCamera.y < -10.5) camera.position.y = Math.min(camera.position.y, GARAGE.plafond - 0.3);                // ni dans le plafond du garage
    camera.lookAt(vise.x, vise.y + (armeEnMain() ? reculVue : 0), vise.z);
  }
  if (secousse > 0) {                                   // petite secousse lors d'un choc ou d'un atterrissage
    camera.position.x += (Math.random() - 0.5) * secousse * 0.5;
    camera.position.y += (Math.random() - 0.5) * secousse * 0.35;
  }

  // Le soleil suit le joueur pour que les ombres restent nettes autour de lui
  soleil.position.set(cibleCamera.x + 70, 55, cibleCamera.z + 35);
  soleil.target.position.set(cibleCamera.x, 0, cibleCamera.z);
  ciel.position.copy(camera.position);

  renderer.render(scene, camera);
  requestAnimationFrame(boucle);
}

appliquerCouleurs();
NB_TOURS = reglages.tours || 3;
document.getElementById('fps').style.display = reglages.fps !== false ? 'block' : 'none';
majSurnom();
ouvrirMenu();
boucle();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
