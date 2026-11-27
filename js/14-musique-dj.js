// MAN'SCAVE — 14-musique-dj.js
// =====================================================================
// LA MUSIQUE : une playlist (gardée dans le navigateur), la musique de course et le DJ du garage
// =====================================================================
const playlist = [];                                    // [{ id, nom, blob, url }]
const musique = new Audio();                            // musique de course (et écoute dans le menu)
let fondu = null, apercuId = null, prochainOrdre = 0;
const baseMusique = (fn) => {                           // IndexedDB : peut être absente, on ne bloque jamais le jeu
  try {
    const req = indexedDB.open('robocam-musique', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('fichiers');
    req.onsuccess = () => { try { fn(req.result.transaction('fichiers', 'readwrite').objectStore('fichiers')); } catch (e) {} };
  } catch (e) {}
};
const sauverPlaylist = () => baseMusique(st => st.put(playlist.map(({ id, nom, blob }) => ({ id, nom, blob })), 'playlist'));
function ajouterALaPlaylist(blob, nom, id) {
  playlist.push({ id: id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7), nom: String(nom).slice(0, 120), blob, url: URL.createObjectURL(blob) });
}
// Au démarrage : on recharge la playlist (et l'ancienne musique unique, si elle existe)
baseMusique(st => {
  const r = st.get('playlist');
  r.onsuccess = () => {
    for (const m of r.result || []) if (m && m.blob) ajouterALaPlaylist(m.blob, m.nom, m.id);
    const r2 = st.get('course');
    r2.onsuccess = () => {
      if (r2.result && r2.result.blob) { ajouterALaPlaylist(r2.result.blob, r2.result.nom); sauverPlaylist(); baseMusique(s2 => s2.delete('course')); }
      afficherPlaylist();
    };
  };
});
const estAudio = f => f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|opus|flac|webm)$/i.test(f.name);
$('fichiers-musique').addEventListener('change', e => {
  const fichiers = [...(e.target.files || [])].filter(estAudio);
  for (const f of fichiers) ajouterALaPlaylist(f, f.name.replace(/\.[a-z0-9]+$/i, ''));
  if (fichiers.length) { sauverPlaylist(); afficherPlaylist(); annoncer(`${fichiers.length} chanson${fichiers.length > 1 ? 's' : ''} ajoutée${fichiers.length > 1 ? 's' : ''}`, 'cp'); }
  e.target.value = '';
});
function arreterApercu() { if (apercuId) { musique.pause(); apercuId = null; afficherPlaylist(); } }
function miniBouton(texte, label, action) {
  const b = document.createElement('button'); b.type = 'button'; b.className = 'mini-btn'; b.textContent = texte; b.setAttribute('aria-label', label);
  b.addEventListener('click', action); return b;
}
// Liste du menu (textContent uniquement : les noms de fichiers restent du texte)
function afficherPlaylist() {
  const ol = $('liste-musique'); ol.textContent = '';
  if (!playlist.length) { const li = document.createElement('li'); li.className = 'vide'; li.textContent = 'Aucune chanson pour l\'instant : clique sur « + Ajouter des chansons ».'; ol.append(li); }
  playlist.forEach((m, k) => {
    const li = document.createElement('li');
    if (apercuId === m.id || dj.id === m.id) li.className = 'joue';
    const num = document.createElement('span'); num.className = 'num'; num.textContent = k + 1;
    const titre = document.createElement('span'); titre.className = 'titre'; titre.textContent = m.nom; titre.title = m.nom;
    li.append(num, titre,
      miniBouton(apercuId === m.id ? '❚❚' : '▶', 'Écouter', () => {
        if (apercuId === m.id) { arreterApercu(); return; }
        clearInterval(fondu); fondu = null;
        musique.src = m.url; musique.volume = parseFloat($('vol-musique').value); musique.currentTime = 0;
        musique.play().then(() => { apercuId = m.id; afficherPlaylist(); }).catch(() => {});
      }),
      miniBouton('↑', 'Monter', () => { if (k > 0) { [playlist[k - 1], playlist[k]] = [playlist[k], playlist[k - 1]]; sauverPlaylist(); afficherPlaylist(); } }),
      miniBouton('↓', 'Descendre', () => { if (k < playlist.length - 1) { [playlist[k + 1], playlist[k]] = [playlist[k], playlist[k + 1]]; sauverPlaylist(); afficherPlaylist(); } }),
      miniBouton('✕', 'Retirer', () => {
        if (apercuId === m.id) arreterApercu();
        if (dj.id === m.id) djStop();
        URL.revokeObjectURL(m.url); playlist.splice(k, 1); sauverPlaylist(); afficherPlaylist();
      }));
    ol.append(li);
  });
  afficherListeDJ();
}
$('vol-musique').addEventListener('input', e => { if (apercuId) musique.volume = parseFloat(e.target.value); });
musique.addEventListener('ended', () => { if (apercuId) { apercuId = null; afficherPlaylist(); } });

// Musique de course : démarre à l'extinction des feux
function demarrerMusique() {
  const mode = reglages.modeMusique || 'hasard';
  if (!playlist.length || mode === 'aucune') return;
  const m = mode === 'ordre' ? playlist[prochainOrdre++ % playlist.length] : playlist[Math.floor(Math.random() * playlist.length)];
  clearInterval(fondu); fondu = null; apercuId = null;
  musique.src = m.url; musique.currentTime = 0; musique.volume = reglages.volMusique ?? 0.7;
  musique.play().catch(() => {});
  annoncer('♪ ' + m.nom, 'cp');
}
function arreterMusique(duree) {                        // baisse le son petit à petit, puis s'arrête
  if (musique.paused || fondu) return;
  const v0 = musique.volume, debut = performance.now();
  fondu = setInterval(() => {
    const t = (performance.now() - debut) / 1000 / duree;
    if (t >= 1) { musique.pause(); clearInterval(fondu); fondu = null; return; }
    musique.volume = v0 * (1 - t);
  }, 50);
}

// --- Le DJ du garage : le son sort VRAIMENT des 2 enceintes (son en 3D : plus fort de près, du bon côté)
const dj = { el: new Audio(), id: null, ouvert: false, branche: false, basses: 0, aigus: 0, panneaux: [], filtre: null, sortie: null, analyse: null, donnees: null };
dj.el.addEventListener('ended', () => djSuivant(1));
function brancherDJ() {                                  // on relie le lecteur aux enceintes (une seule fois)
  initAudio();
  if (!audio || dj.branche) return;
  const ctx = audio.ctx;
  try {
    const src = ctx.createMediaElementSource(dj.el);
    dj.analyse = ctx.createAnalyser(); dj.analyse.fftSize = 512; dj.donnees = new Uint8Array(dj.analyse.frequencyBinCount);
    dj.filtre = ctx.createBiquadFilter(); dj.filtre.type = 'lowpass'; dj.filtre.frequency.value = 20000;
    dj.sortie = ctx.createGain(); dj.sortie.gain.value = 0;
    src.connect(dj.analyse); src.connect(dj.filtre);
    for (const p of POSITIONS_ENCEINTES) {
      const pan = ctx.createPanner();
      pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = 5; pan.maxDistance = 300; pan.rolloffFactor = 1.2;
      if (pan.positionX) { pan.positionX.value = p[0]; pan.positionY.value = p[1]; pan.positionZ.value = p[2]; } else pan.setPosition(p[0], p[1], p[2]);
      dj.filtre.connect(pan); pan.connect(dj.sortie); dj.panneaux.push(pan);
    }
    dj.sortie.connect(ctx.destination);
    dj.branche = true;
  } catch (e) {}
}
function djJouer(k) {
  const m = playlist[k]; if (!m) return;
  brancherDJ();
  dj.el.src = m.url; dj.id = m.id; dj.el.currentTime = 0;
  dj.el.play().catch(() => {});
  afficherPlaylist(); majPanneauDJ();
}
function djSuivant(sens) {
  if (!playlist.length) return;
  const k = playlist.findIndex(m => m.id === dj.id);
  djJouer(((k < 0 ? 0 : k + sens) % playlist.length + playlist.length) % playlist.length);
}
function djPlayPause() {
  if (!dj.id) { if (playlist.length) djJouer(0); return; }
  if (dj.el.paused) dj.el.play().catch(() => {}); else dj.el.pause();
  majPanneauDJ();
}
function djStop() { dj.el.pause(); dj.el.currentTime = 0; dj.id = null; afficherPlaylist(); majPanneauDJ(); }
function afficherListeDJ() {
  const ol = $('dj-liste'); ol.textContent = '';
  if (!playlist.length) { const li = document.createElement('li'); li.className = 'vide'; li.textContent = 'La playlist est vide : ajoute des chansons ci-dessous.'; ol.append(li); return; }
  playlist.forEach((m, k) => {
    const li = document.createElement('li'); if (dj.id === m.id) li.className = 'joue';
    const b = document.createElement('button'); b.type = 'button'; b.textContent = (dj.id === m.id ? '♪ ' : '') + m.nom; b.title = m.nom;
    b.addEventListener('click', () => djJouer(k));
    li.append(b); ol.append(li);
  });
}
function majPanneauDJ() {
  const m = playlist.find(x => x.id === dj.id);
  $('dj-titre').textContent = m ? m.nom : 'Rien pour l\'instant';
  $('dj-play').textContent = dj.id && !dj.el.paused ? '❚❚' : '▶';
}
const presDJ = () => !enVoiture && etat.y < -10.5 && Math.hypot(etat.x - DJ.x - (-1.4), etat.z - DJ.z) < 2.6;
function ouvrirDJ() {
  dj.ouvert = true; $('panneau-dj').classList.add('ouvert');
  if (document.pointerLockElement) { liberationVoulue = true; document.exitPointerLock(); }
  for (const k in touches) touches[k] = false;
  brancherDJ(); afficherListeDJ(); majPanneauDJ();
}
function fermerDJ() { dj.ouvert = false; $('panneau-dj').classList.remove('ouvert'); capturerSouris(); }
$('dj-fermer').addEventListener('click', fermerDJ);
$('dj-play').addEventListener('click', djPlayPause);
$('dj-suiv').addEventListener('click', () => djSuivant(1));
$('dj-prec').addEventListener('click', () => djSuivant(-1));
$('dj-stop').addEventListener('click', djStop);
$('panneau-dj').addEventListener('keydown', e => e.stopPropagation());   // les touches du panneau ne pilotent pas le jeu

// À chaque image : l'oreille suit la caméra, le son est étouffé à l'étage du dessus, les enceintes battent
const vAvantCam = new THREE.Vector3();
function majDJ(dt) {
  const pres = enJeu && !dj.ouvert && presDJ();
  const el = $('indice-dj');
  if (pres !== (el.style.display === 'block')) el.style.display = pres ? 'block' : 'none';
  if (dj.ouvert && dj.el.duration) $('dj-progression').style.width = (100 * dj.el.currentTime / dj.el.duration).toFixed(1) + '%';
  if (!dj.branche || !audio) { dj.basses *= 0.9; return; }
  const ctx = audio.ctx, t = ctx.currentTime, L = ctx.listener;
  camera.getWorldDirection(vAvantCam);
  const p = camera.position;
  if (L.positionX) {
    L.positionX.setTargetAtTime(p.x, t, 0.03); L.positionY.setTargetAtTime(p.y, t, 0.03); L.positionZ.setTargetAtTime(p.z, t, 0.03);
    L.forwardX.setTargetAtTime(vAvantCam.x, t, 0.03); L.forwardY.setTargetAtTime(vAvantCam.y, t, 0.03); L.forwardZ.setTargetAtTime(vAvantCam.z, t, 0.03);
    L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
  } else { L.setPosition(p.x, p.y, p.z); L.setOrientation(vAvantCam.x, vAvantCam.y, vAvantCam.z, 0, 1, 0); }
  const y = enVoiture ? vehicule.position.y : etat.y;
  const auGarage = y < -10.5 && y > Y_TRIP, auParking = y < -3 && y > -10.5;   // (au niveau -3, on n'entend plus le DJ)
  const volume = parseFloat($('dj-volume').value) * (reglages.volMusique ?? 0.7) * 1.4;
  dj.sortie.gain.setTargetAtTime(auGarage ? volume : auParking ? volume * 0.35 : 0, t, 0.2);
  dj.filtre.frequency.setTargetAtTime(auGarage ? 20000 : 380, t, 0.2);   // à travers le plafond, on n'entend que les basses
  // Analyse du son : les basses font bouger les haut-parleurs et clignoter la piste de danse
  if (!dj.el.paused) {
    dj.analyse.getByteFrequencyData(dj.donnees);
    let b = 0, a = 0;
    for (let k = 1; k < 8; k++) b += dj.donnees[k];
    for (let k = 40; k < 120; k++) a += dj.donnees[k];
    dj.basses += (b / 7 / 255 - dj.basses) * Math.min(1, dt * 20);
    dj.aigus += (a / 80 / 255 - dj.aigus) * Math.min(1, dt * 20);
  } else { dj.basses *= 0.9; dj.aigus *= 0.9; }
}
