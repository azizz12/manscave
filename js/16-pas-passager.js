// MAN'SCAVE — 16-pas-passager.js
// =====================================================================
// BRUIT DES PAS (selon le sol) + PLACE PASSAGER entre amis
// =====================================================================
function bruitDePas(x, y, z, court, volume = 1) {
  if (!audio || volume <= 0.02) return;
  const t = audio.ctx.currentTime + 0.002, g = (court ? 0.2 : 0.12) * volume, alea = Math.random();
  let sol = 'herbe';
  if (y < -3) sol = dansAscenseur(x, z) ? 'metal' : 'beton';
  else if (Math.abs(x) < 180 && Math.abs(z) < 180) sol = 'beton';
  else { const info = trouverPiste(x, y, z); if (info && info.type === 'piste' && info.dist < info.w + 0.6) sol = 'asphalte'; }
  const echo = y < -3 ? 0.22 : 0;
  if (sol === 'beton' || sol === 'asphalte') {
    sonBruit(t, 0.05, 'lowpass', 240, 1, g * 1.1);                                  // le talon (sourd)
    sonBruit(t + 0.012, 0.06, 'bandpass', (sol === 'beton' ? 1500 : 1000) + alea * 300, 1.3, g * 0.55, { reverb: echo });   // la semelle qui « claque »
    if (court) sonBruit(t + 0.03, 0.04, 'highpass', 3500, 1, g * 0.25);              // petit frottement en courant
  } else if (sol === 'metal') {
    sonBruit(t, 0.05, 'lowpass', 300, 1, g);
    sonMetal(t, [380 + alea * 40, 940, 1630], 0.14, g * 0.45, 0.25);                // la tôle qui résonne
  } else {
    sonBruit(t, 0.15, 'highpass', 1800 + alea * 600, 0.6, g * 0.4);                   // l'herbe qui froisse
    sonBruit(t, 0.05, 'lowpass', 180, 1, g * 0.6);
  }
}
let passager = null, passagerActif = false;               // passager = identifiant de l'ami qui conduit
const monIdSalle = () => { if (!salle) return null; const moi = salle.peers().find(p => p.sameTab); return moi ? moi.peer : null; };
function voitureAmieProche() {
  let meilleur = null;
  for (const [id, a] of autresJoueurs) {
    if (a.mode !== 'v' || !a.auto) continue;
    const d = Math.hypot(a.pos.x - etat.x, a.pos.z - etat.z) + Math.max(0, Math.abs(a.pos.y - etat.y) - 1) * 3;
    if (d < 3.8 && (!meilleur || d < meilleur.d)) meilleur = { id, a, d };
  }
  return meilleur;
}
function monterPassager(id) {
  const a = autresJoueurs.get(id); if (!a) return;
  passager = id; passagerActif = true; angleCamera = 0;
  perso.visible = false; ombre.visible = false;
  annoncer('Passager de ' + (a.nom || 'ton ami'), 'cp'); sonArme('arme');
}
function descendrePassager() {
  const a = passager ? autresJoueurs.get(passager) : null;
  if (a) {                                                // on descend à côté de la voiture, côté passager
    etat.x = a.pos.x - Math.cos(a.cap) * 2.3; etat.z = a.pos.z + Math.sin(a.cap) * 2.3; etat.y = a.pos.y;
  }
  etat.vitesseY = 0; passager = null; passagerActif = false;
  perso.visible = true; ombre.visible = true;
}
function majPassager() {
  const a = autresJoueurs.get(passager);
  if (!a || a.mode !== 'v' || !a.auto) { descendrePassager(); annoncer('Ton ami est descendu', 'cp'); return false; }
  etat.x = a.pos.x; etat.z = a.pos.z; etat.y = a.pos.y; etat.vitesseY = 0;
  perso.visible = false; ombre.visible = false;
  return true;
}
// Un pilote dans le siège passager (casque + buste), créé la première fois qu'on en a besoin
function figurePassager(mod) {
  if (!mod.figurePassager) {
    const g = new THREE.Group();
    const buste = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.42, 0.34), std('#e9ecf2', 0.7)); buste.position.y = -0.38;
    const casque = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), new THREE.MeshPhysicalMaterial({ color: '#3a1aa8', roughness: 0.2, clearcoat: 1 }));
    const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.142, 16, 12, -0.9, 1.8, 1.1, 0.8), std('#0b0d12', 0.1, 0.6)); visiere.rotation.y = -Math.PI / 2;
    g.add(buste, casque, visiere);
    g.position.set(mod.oeil.x, mod.oeil.y - 0.12, -mod.oeil.z);
    g.visible = false; mod.add(g); mod.figurePassager = g;
  }
  return mod.figurePassager;
}
function majPassagers() {
  const monId = monIdSalle();
  const passagersDe = new Set([...autresJoueurs.values()].map(b => b.passagerDe).filter(Boolean));
  for (const v of voitures) {
    const montre = enVoiture && v === voitureActive && monId && passagersDe.has(monId);
    if (montre || v.modele.figurePassager) figurePassager(v.modele).visible = !!montre;
  }
  for (const [id, a] of autresJoueurs) {
    if (!a.auto) continue;
    const montre = passager === id || passagersDe.has(id);
    if (montre || a.auto.modele.figurePassager) figurePassager(a.auto.modele).visible = montre;
  }
  // Indication « monter avec un ami »
  const ind = $('indice-ami');
  const ami = enJeu && !enVoiture && !passager ? voitureAmieProche() : null;
  const local = ami ? voiturePlusProche().distance : Infinity;
  const texte = passager ? '' : ami && ami.d <= local + 1.5 ? `👥 Monter avec ${ami.a.nom || 'ton ami'} · touche E` : '';
  if (ind.textContent !== texte) ind.textContent = texte;
  if (!!texte !== (ind.style.display === 'block')) ind.style.display = texte ? 'block' : 'none';
}
// Ascenseur et porte : quand un joueur les actionne, tout le monde voit la même chose
function commandeAscenseur(niveau) {
  if (!Object.prototype.hasOwnProperty.call(NIVEAUX_ASC, niveau)) return;
  ASC.cible = NIVEAUX_ASC[niveau]; ASC.bouge = Math.abs(ASC.cible - ASC.y) > 0.001;
}

// --- La course : départ façon F1, puis 3 tours avec 4 checkpoints par tour
let NB_TOURS = 3;
const depart = { arme: false, etat: 'attente', t: 0, attenteGo: 0, chrono: 0, tour: 0, tempsTour: 0, cpSuivant: 0, dernierIndice: 0, tours: [] };
let records = {};
try { records = JSON.parse(localStorage.getItem('monde3d-records')) || {}; } catch (e) {}

function formatTemps(t) {                               // 85.4 → « 1:25.40 »
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s < 10 ? '0' : ''}${s.toFixed(2)}`;
}
const surLaGrille = () => enVoiture && circuitActif.surGrille(vehicule.position);
// Les records sont gardés par voiture, et par circuit (le circuit du haut garde les anciens noms)
const cleRecord = nom => (circuitActif.id === 'haut' ? nom : circuitActif.id + ':' + nom);
function annoncer(texte, style) {
  const el = $('annonce');
  el.textContent = texte; el.className = 'hud ' + style;
  void el.offsetWidth; el.classList.add('pop');
}
function remettreCones() {
  for (const c of cones) {
    Object.assign(c, { x: c.x0, z: c.z0, y: 0, vx: 0, vy: 0, vz: 0, chute: 0, touche: false });
    c.g.position.set(c.x0, 0, c.z0); c.g.rotation.set(0, 0, 0);
  }
}
// A-t-on franchi la position « cible » en avançant, entre l'image précédente et celle-ci ?
const franchi = (avant, apres, cible) => avant < cible && apres >= cible && apres - avant < NB * 0.1;

function majDepart(dt) {
  const { feux, console: pupitre } = circuitActif;
  const allumerFeux = n => feux.allumer(n);
  const arrete = Math.abs(auto.vitesse) < 0.5;
  const idx = auto.indicePiste ?? 0;
  if (depart.etat === 'attente') {
    allumerFeux(0);
    depart.t = depart.arme && surLaGrille() && arrete ? depart.t + dt : 0;
    if (depart.t > 1) {                                 // arrêté 1 seconde sur la grille : c'est parti
      depart.etat = 'sequence'; depart.t = 0;
      depart.attenteGo = 0.4 + Math.random() * 2.2;     // délai secret avant l'extinction, comme en F1
      remettreCones();
    }
  } else if (depart.etat === 'sequence') {
    depart.t += dt;
    allumerFeux(Math.min(5, Math.floor(depart.t) + 1)); // une colonne de plus chaque seconde
    if (Math.abs(auto.vitesse) > 1.2 || !enVoiture) {   // la voiture bouge avant l'extinction
      annoncer('Faux départ !', 'faux');
      depart.etat = 'penalite'; depart.t = 0;
    } else if (depart.t >= 5 + depart.attenteGo) {
      allumerFeux(0);                                   // tous les feux s'éteignent : GO !
      annoncer('GO !', 'go');
      demarrerMusique();
      Object.assign(depart, { etat: 'course', chrono: 0, tour: 1, tempsTour: 0, cpSuivant: 0, dernierIndice: idx, tours: [] });
    }
  } else if (depart.etat === 'penalite') {
    allumerFeux(Math.floor(depart.t * 4) % 2 ? 5 : 0); // les feux clignotent
    depart.t += dt;
    if (depart.t > 2.5) depart.etat = 'attente';
  } else if (depart.etat === 'course') {
    depart.chrono += dt; depart.tempsTour += dt;
    // Checkpoints : il faut tous les passer dans l'ordre (pas de raccourci !)
    if (depart.cpSuivant < CHECKPOINTS.length && franchi(depart.dernierIndice, idx, CHECKPOINTS[depart.cpSuivant])) {
      depart.cpSuivant++;
      annoncer(`Checkpoint ${depart.cpSuivant}/${CHECKPOINTS.length}`, 'cp');
    }
    // Ligne d'arrivée : on passe de la fin de la piste au début
    if (depart.dernierIndice > NB * 0.85 && idx < NB * 0.15) {
      if (depart.cpSuivant === CHECKPOINTS.length) {
        const temps = depart.tempsTour;
        depart.tours.push(temps);
        const cle = cleRecord(voitureActive.nom);
        const record = depart.tour > 1 && (!records[cle] || temps < records[cle]);   // le 1er tour part de la grille : plus court
        if (record) { records[cle] = temps; try { localStorage.setItem('monde3d-records', JSON.stringify(records)); } catch (e) {} }
        if (depart.tour >= NB_TOURS) {
          depart.etat = 'arrivee'; depart.t = 0; depart.arme = false;
          arreterMusique(7);
          const pos = positionJoueur();
          annoncer(bots.length ? (pos === 1 ? 'Victoire !' : `Arrivée : ${pos}e`) : 'Arrivée !', 'go');
        } else {
          annoncer(`${record ? 'Record ! ' : ''}${formatTemps(temps)}`, record ? 'go' : 'cp');
          depart.tour++;
        }
        depart.tempsTour = 0; depart.cpSuivant = 0;
      }
    }
    depart.dernierIndice = idx;
    if (!enVoiture) { depart.etat = 'attente'; depart.arme = false; arreterMusique(1.5); }   // on est descendu de la voiture : course annulée
  } else if (depart.etat === 'arrivee') {
    depart.t += dt;
    if (depart.t > 10 || (surLaGrille() && depart.t > 3)) depart.etat = 'attente';
  }

  // Écran de la console et bouton (rouge = en attente, vert = course prête)
  pupitre.bouton.material = depart.arme || depart.etat === 'course' ? matBoutonOn : matBoutonOff;
  if (depart.etat === 'course') pupitre.ecran(`TOUR ${depart.tour}/${NB_TOURS}`, formatTemps(depart.tempsTour), '#ffd23f');
  else if (depart.etat === 'sequence') pupitre.ecran('FEUX…', 'Attends l\'extinction', '#ff4a55');
  else if (depart.arme) pupitre.ecran('PRÊT', 'Arrête-toi sur la grille', '#30ff8a');
  else pupitre.ecran('COURSE', 'Appuie sur E', '#ff4a55');

  // Affichage de la course en haut de l'écran
  const el = $('course');
  if (depart.etat === 'course' || depart.etat === 'arrivee') {
    el.style.display = 'block';
    const meilleur = records[cleRecord(voitureActive.nom)];
    const echap = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const pos = positionJoueur(), total = bots.length + 1;
    const posTexte = total > 1 ? `<span>P${pos}/${total}</span>` : '';
    const lignes = depart.etat === 'arrivee'
      ? [`<b>Arrivée · ${total > 1 ? pos + (pos === 1 ? 'er' : 'e') + ' · ' : ''}${formatTemps(depart.tours.reduce((a, b) => a + b, 0))}</b>`,
         total > 1 ? classement().map((p, i) => `${i + 1}. ${echap(p.nom)}${p.fini ? ' ' + formatTemps(p.temps) : ''}`).join(' · ')
                   : depart.tours.map((t, i) => `Tour ${i + 1} : ${formatTemps(t)}`).join(' · ')]
      : [`${posTexte}<span>Tour ${depart.tour}/${NB_TOURS}</span><b>${formatTemps(depart.tempsTour)}</b><span>CP ${depart.cpSuivant}/${CHECKPOINTS.length}</span>`,
         `Total ${formatTemps(depart.chrono)}${meilleur ? ' · Meilleur tour ' + formatTemps(meilleur) : ''}`];
    el.innerHTML = lignes.map(l => `<div>${l}</div>`).join('');
  } else el.style.display = 'none';
}

// --- La mini-carte : le tracé vu de haut, avec la position des voitures
const carte = $('carte'), ctxCarte = carte.getContext('2d');
const TAILLE_CARTE = 200, MARGE_CARTE = 12;
carte.width = TAILLE_CARTE * 2; carte.height = TAILLE_CARTE * 2;
// Chaque circuit a son propre fond de carte (dessiné une seule fois, la première fois qu'on y roule)
let fondCarte, bornes, echelleCarte;
const versCarte = (x, z) => [MARGE_CARTE + (x - bornes.x1) * echelleCarte, MARGE_CARTE + (z - bornes.z1) * echelleCarte];
function preparerCarte(circuit) {
  if (!circuit.carte) {
    const b = { x1: Infinity, x2: -Infinity, z1: Infinity, z2: -Infinity };
    for (const s of circuit.piste) { b.x1 = Math.min(b.x1, s.x); b.x2 = Math.max(b.x2, s.x); b.z1 = Math.min(b.z1, s.z); b.z2 = Math.max(b.z2, s.z); }
    const fond = document.createElement('canvas'); fond.width = fond.height = TAILLE_CARTE * 2;
    circuit.carte = { fond, bornes: b, echelle: (TAILLE_CARTE - 2 * MARGE_CARTE) / Math.max(b.x2 - b.x1, b.z2 - b.z1) };
    ({ fond: fondCarte, bornes, echelle: echelleCarte } = circuit.carte);
    const c = fond.getContext('2d');
    c.scale(2, 2);
    if (circuit.id === 'haut') {                       // la ville
      const [vx, vz] = versCarte(-177, -177);
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(vx, vz, 354 * echelleCarte, 354 * echelleCarte);
    }
    const p = circuit.piste;
    c.lineJoin = 'round'; c.lineCap = 'round';
    for (const [largeur, couleur] of circuit.couleursCarte || [[6, 'rgba(14,20,32,.9)'], [3, '#e9ecf2']]) {
      c.strokeStyle = couleur; c.lineWidth = largeur; c.beginPath();
      p.forEach((s, i) => { const [x, z] = versCarte(s.x, s.z); i ? c.lineTo(x, z) : c.moveTo(x, z); });
      c.closePath(); c.stroke();
    }
    c.strokeStyle = '#6b7385'; c.lineWidth = 2; c.setLineDash([3, 3]); c.beginPath();   // parties souterraines / sous un pont
    p.forEach((s, i) => { if (s.y < circuit.ySol - 1) { const [x, z] = versCarte(s.x, s.z); c.moveTo(x, z); c.lineTo(x + 0.1, z); } });
    c.stroke(); c.setLineDash([]);
    const [lx, lz] = versCarte(p[0].x, p[0].z);        // ligne de départ
    c.fillStyle = '#ffffff'; c.fillRect(lx - 4, lz - 1.5, 8, 3);
    circuit.checkpoints.forEach(i => { const [x, z] = versCarte(p[i].x, p[i].z); c.fillStyle = '#ffb02e'; c.beginPath(); c.arc(x, z, 2.5, 0, 7); c.fill(); });
  }
  ({ fond: fondCarte, bornes, echelle: echelleCarte } = circuit.carte);
}
preparerCarte(CIRCUIT_HAUT);
function majCarte() {
  ctxCarte.setTransform(1, 0, 0, 1, 0, 0);
  ctxCarte.clearRect(0, 0, carte.width, carte.height);
  ctxCarte.drawImage(fondCarte, 0, 0);
  ctxCarte.setTransform(2, 0, 0, 2, 0, 0);
  for (const v of voitures) {                          // les autres voitures : petits points
    if (enVoiture && v === voitureActive) continue;
    const p = new THREE.Vector3(); v.groupe.getWorldPosition(p);
    if ((p.y < Y_TRIP) !== (circuitActif.id === 'trip')) continue;   // une voiture d'un autre étage
    const [x, z] = versCarte(p.x, p.z);
    ctxCarte.fillStyle = '#9aa3b5'; ctxCarte.beginPath(); ctxCarte.arc(x, z, 2.5, 0, 7); ctxCarte.fill();
  }
  for (const b of bots) {                               // les adversaires : points de leur couleur
    if (!b.pose) continue;
    const [x, z] = versCarte(b.pose.x, b.pose.z);
    ctxCarte.fillStyle = b.couleur; ctxCarte.strokeStyle = '#ffffff'; ctxCarte.lineWidth = 1;
    ctxCarte.beginPath(); ctxCarte.arc(x, z, 3.5, 0, 7); ctxCarte.fill(); ctxCarte.stroke();
  }
  for (const a of autresJoueurs.values()) {            // les autres joueurs : points orange
    if (!memeCircuit(a)) continue;
    const [x, z] = versCarte(a.pos.x, a.pos.z);
    ctxCarte.fillStyle = '#ff8a1e'; ctxCarte.strokeStyle = '#141B34'; ctxCarte.lineWidth = 1.5;
    ctxCarte.beginPath(); ctxCarte.arc(x, z, 4, 0, 7); ctxCarte.fill(); ctxCarte.stroke();
  }
  // Le joueur : une flèche jaune
  const px = enVoiture ? vehicule.position.x : etat.x, pz = enVoiture ? vehicule.position.z : etat.z;
  const cap = enVoiture ? auto.cap : etat.angle + Math.PI;
  const [x, z] = versCarte(px, pz);
  ctxCarte.save(); ctxCarte.translate(x, z); ctxCarte.rotate(-cap);
  ctxCarte.fillStyle = '#FFD23F'; ctxCarte.strokeStyle = '#141B34'; ctxCarte.lineWidth = 1.5;
  ctxCarte.beginPath(); ctxCarte.moveTo(0, -7); ctxCarte.lineTo(5, 5); ctxCarte.lineTo(0, 2.5); ctxCarte.lineTo(-5, 5); ctxCarte.closePath();
  ctxCarte.fill(); ctxCarte.stroke(); ctxCarte.restore();
}

// --- Ambiance : plus sombre au sous-sol (le soleil baisse, les néons s'allument)
let sousSol = 0;
const brumeDehors = new THREE.Color(COULEUR_HORIZON), brumeDedans = new THREE.Color('#2b2e34');
let dehors = 0;
const hemiCiel = hemi.color.clone(), hemiSolCouleur = hemi.groundColor.clone();
const hemiTrip = new THREE.Color('#c9b4ff'), hemiSolTrip = new THREE.Color('#3a2060'), brumeTrip = new THREE.Color('#150b26');
function majAmbiance(cible, dt) {
  const y = cible.y;
  majVisibilite(y, cible.z);
  if (y < Y_TRIP) {                                     // le hangar TRIP : ni soleil ni ciel, des néons et une brume violette
    soleil.intensity = 0; hemi.intensity = 1.15;
    hemi.color.copy(hemiTrip); hemi.groundColor.copy(hemiSolTrip);
    for (const l of lumieresParking) l.intensity = 0;
    scene.fog.color.copy(brumeTrip); scene.fog.near = 90; scene.fog.far = 420;
    scene.environment = envTrip;
    sousSol = 1;
    return;
  }
  scene.environment = envCiel;
  hemi.color.copy(hemiCiel); hemi.groundColor.copy(hemiSolCouleur);
  sousSol += ((y < -2.5 ? 1 : 0) - sousSol) * Math.min(1, dt * 3);
  dehors += ((Math.abs(cible.x) > 190 || Math.abs(cible.z) > 190 ? 1 : 0) - dehors) * Math.min(1, dt * 1.5);
  soleil.intensity = 1.25 * (1 - sousSol) + 0.1 * sousSol;
  hemi.intensity = 0.55 * (1 - sousSol) + 0.32 * sousSol;
  const auGarage = y < -10.5;
  for (const l of lumieresParking) { l.intensity = (auGarage ? 1.1 : 1.3) * sousSol; l.position.y = auGarage ? -8.4 : -1.6; }
  hemi.intensity = auGarage ? 0.5 : hemi.intensity;
  scene.fog.color.copy(brumeDehors).lerp(brumeDedans, sousSol);
  scene.fog.near = (90 + 110 * dehors) * (1 - sousSol) + 20 * sousSol;
  scene.fog.far = (340 + 560 * dehors) * (1 - sousSol) + 110 * sousSol;
}
