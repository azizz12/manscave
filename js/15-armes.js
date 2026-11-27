// MAN'SCAVE — 15-armes.js
// =====================================================================
// LES ARMES (test) : un pistolet à prendre dans le casier du stand de tir
// Clic gauche = tirer · clic droit = viser · R = recharger · E au casier = prendre / ranger
// =====================================================================
const ARME = { type: 'pistolet', nom: 'Pistolet BT-9', capacite: 12, reserveMax: 60, cadence: 0.16, degats: 1 };
const arme = { equipee: false, chargeur: 0, reserve: 0, attente: 0, recharge: 0, recul: 0, tirs: 0, touches: 0, score: 0 };
let reculVue = 0;
const armeEnMain = () => arme.equipee && !enVoiture && !passagerActif;
// Le modèle du pistolet (glissière, carcasse, poignée, pontet, canon) — on le crée deux fois : dans la main et dans le casier
function creerPistolet() {
  const g = new THREE.Group();
  const acier = std('#22252b', 0.35, 0.75), noirP = std('#121316', 0.7), accent = new THREE.MeshStandardMaterial({ color: '#ff3fb4', emissive: '#ff3fb4', emissiveIntensity: 0.6 });
  const glissiere = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.036, 0.2), acier); glissiere.position.set(0, 0.03, 0.02);
  const carcasse = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.024, 0.17), noirP); carcasse.position.set(0, 0.0, 0.03);
  const poignee = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.1, 0.045), noirP); poignee.position.set(0, -0.05, -0.045); poignee.rotation.x = -0.25;
  const pontet = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.004, 6, 12, Math.PI), noirP); pontet.position.set(0, -0.012, 0.015); pontet.rotation.set(Math.PI, Math.PI / 2, 0);
  const canon = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.02, 10), acier); canon.rotation.x = Math.PI / 2; canon.position.set(0, 0.03, 0.125);
  const ligne = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.004, 0.12), accent); ligne.position.set(0, 0.04, 0.03);
  // Organes de visée : un guidon à l'avant, une hausse (deux petites dents) à l'arrière, avec des points lumineux
  const blanc = new THREE.MeshBasicMaterial({ color: '#d9ffe6' });
  const guidon = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.008, 0.006), noirP); guidon.position.set(0, 0.052, 0.11);
  const pointG = new THREE.Mesh(new THREE.BoxGeometry(0.0025, 0.0025, 0.001), blanc); pointG.position.set(0, 0.054, 0.107);
  glissiere.add(guidon.clone()); g.add(guidon, pointG);
  for (const sx of [-1, 1]) {
    const dent = new THREE.Mesh(new THREE.BoxGeometry(0.0045, 0.008, 0.006), noirP); dent.position.set(sx * 0.0055, 0.052, -0.07);
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.0022, 0.0022, 0.001), blanc); p.position.set(sx * 0.0055, 0.053, -0.0735);
    g.add(dent, p);
  }
  g.add(glissiere, carcasse, poignee, pontet, canon, ligne);
  g.glissiere = glissiere;
  g.bouche = new THREE.Object3D(); g.bouche.position.set(0, 0.03, 0.14); g.add(g.bouche);   // le bout du canon
  g.ejection = new THREE.Object3D(); g.ejection.position.set(0.02, 0.04, 0.0); g.add(g.ejection);
  return g;
}
// Dans la main droite du personnage (le canon suit l'axe du bras)
const pistoletMain = creerPistolet();
pistoletMain.scale.setScalar(1.25);
pistoletMain.rotation.x = Math.PI / 2; pistoletMain.position.set(0, -0.3, 0.02);
pistoletMain.visible = false;
refsPerso.brasG.bas.add(pistoletMain);               // (brasG est le bras droit du personnage, vu de dos)
// Vue à la 1re personne (clic droit) : le pistolet tenu à deux mains, accroché à la caméra
scene.add(camera);
const vueArme = new THREE.Group(); vueArme.visible = false; camera.add(vueArme);
const pistoletVue = creerPistolet();
pistoletVue.rotation.y = Math.PI;                          // le canon regarde vers l'avant de la caméra
vueArme.add(pistoletVue);
{
  const gantMat = std('#1c1d22', 0.6), manche = std('#e9ecf2', 0.7);
  const mainD = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), gantMat); mainD.scale.set(0.9, 1.4, 1.2); mainD.position.set(0.004, -0.058, 0.045);
  const mainG = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), gantMat); mainG.scale.set(1.0, 1.2, 1.3); mainG.position.set(-0.026, -0.058, 0.035);
  const avantBrasD = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.4, 12), manche); avantBrasD.position.set(0.05, -0.14, 0.24); avantBrasD.rotation.x = 1.15; avantBrasD.rotation.z = -0.2;
  const avantBrasG = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.036, 0.4, 12), manche); avantBrasG.position.set(-0.08, -0.14, 0.23); avantBrasG.rotation.x = 1.15; avantBrasG.rotation.z = 0.35;
  for (const m of [mainD, mainG, avantBrasD, avantBrasG]) vueArme.add(m);
}
// Le guidon et la hausse (à 5,3 cm au-dessus de l'axe) tombent pile au centre de l'écran
const POSE_VUE = new THREE.Vector3(0, -0.053, -0.46);
vueArme.position.copy(POSE_VUE);
const viseePremiere = () => armeEnMain() && viser && arme.recharge <= 0;
// 3 pistolets exposés dans le casier
for (let k = 0; k < 3; k++) {
  const p = creerPistolet(); p.scale.setScalar(1.5); p.rotation.set(0, Math.PI / 2, 0); p.position.set(-0.55 + k * 0.55, 1.45, 0.3);
  casier.groupe.add(p); casier.pistolets.push(p);
}
const presCasier = () => !enVoiture && etat.y < -10.5 && Math.hypot(etat.x - casier.x, etat.z - casier.z) < 2.4;
function prendreOuRangerArme() {
  if (!arme.equipee) {
    Object.assign(arme, { equipee: true, chargeur: ARME.capacite, reserve: ARME.reserveMax, recharge: 0 });
    hauteurCamera = 0.02;                                // la vue se met à l'horizontale, prête à viser
    casier.pistolets[0].visible = false;
    banniereArme('ARMED', 'Clic gauche : tirer · clic droit : viser · [R] : recharger');
    sonArme('arme');
  } else {
    arme.equipee = false; casier.pistolets[0].visible = true;
    annoncer('Pistolet rangé', 'cp'); sonArme('arme');
  }
  majHudArme();
}
function banniereArme(titre, astuce) {
  const el = $('banniere');
  el.style.setProperty('--c', '#ff3a3a');
  el.querySelector('.b-titre').textContent = titre;
  const a = el.querySelector('.b-astuce'); a.style.display = 'inline-block'; a.textContent = '';
  astuce.split('[R]').forEach((m, k, tout) => { a.append(document.createTextNode(m)); if (k < tout.length - 1) { const kb = document.createElement('kbd'); kb.textContent = 'R'; a.append(kb); } });
  el.classList.remove('montre', 'court'); void el.offsetWidth; el.classList.add('montre');
}
function recharger() {
  if (!armeEnMain() || arme.recharge > 0 || arme.chargeur === ARME.capacite || arme.reserve <= 0) return;
  arme.recharge = 1.6; sonArme('recharge');
}

// --- Effets : flash, traçante, douilles, trous, poussière
const texTrou = (() => {
  const t = document.createElement('canvas'); t.width = t.height = 32;
  const c = t.getContext('2d');
  const g = c.createRadialGradient(16, 16, 1, 16, 16, 15); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.35, 'rgba(10,10,10,.95)'); g.addColorStop(0.55, 'rgba(60,50,40,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(t);
})();
const MAT_TROU = new THREE.MeshBasicMaterial({ map: texTrou, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
const GEO_TROU = new THREE.PlaneGeometry(0.06, 0.06);
const trousMurs = [];
const MAT_FLASH = new THREE.SpriteMaterial({ map: texFumee, color: '#ffc46b', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
const flash = new THREE.Sprite(MAT_FLASH); flash.visible = false; scene.add(flash);
const flashEtoile = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: (() => {
  const t = document.createElement('canvas'); t.width = t.height = 64; const c = t.getContext('2d');
  c.translate(32, 32); c.fillStyle = '#fff2c4';
  for (let k = 0; k < 5; k++) { c.rotate(Math.PI * 2 / 5); c.beginPath(); c.moveTo(0, 0); c.lineTo(5, 0); c.lineTo(0, -30); c.lineTo(-5, 0); c.fill(); }
  return new THREE.CanvasTexture(t);
})(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
flashEtoile.visible = false; scene.add(flashEtoile);
const tracante = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
  new THREE.LineBasicMaterial({ color: '#ffe7a8', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending }));
tracante.visible = false; tracante.frustumCulled = false; scene.add(tracante);
let tFlash = 0;
const douilles = [];
const GEO_DOUILLE = new THREE.CylinderGeometry(0.006, 0.006, 0.02, 8), MAT_DOUILLE = std('#c9a227', 0.25, 0.9);
const rayonTir = new THREE.Raycaster(), centreEcran = new THREE.Vector2(0, 0);
const vTmp = new THREE.Vector3(), vTmp2 = new THREE.Vector3();

function tirer() {
  if (!armeEnMain() || !enJeu) return;
  if (arme.recharge > 0 || arme.attente > 0) return;
  if (arme.chargeur <= 0) { sonArme('vide'); annoncer(arme.reserve > 0 ? 'Chargeur vide : R pour recharger' : 'Plus de munitions : retourne au casier', 'faux'); arme.attente = 0.25; return; }
  arme.chargeur--; arme.tirs++; arme.attente = ARME.cadence;
  // Le rayon part du centre de l'écran (le viseur), avec une petite dispersion qui grandit si on tire vite
  const dispersion = (viseePremiere() ? 0.0025 : 0.012) + arme.recul * (viseePremiere() ? 0.012 : 0.03);
  rayonTir.setFromCamera(centreEcran, camera);
  rayonTir.ray.direction.x += (Math.random() - 0.5) * dispersion; rayonTir.ray.direction.y += (Math.random() - 0.5) * dispersion; rayonTir.ray.direction.normalize();
  rayonTir.far = 120;
  const objets = [...cibles.map(c => c.papier), ...surfacesTir, ...objetsGarage];
  const impact = rayonTir.intersectObjects(objets, true).find(h => h.distance > 1.2);
  // Effets au bout du canon
  const pistoletActif = viseePremiere() ? pistoletVue : pistoletMain;
  pistoletActif.updateMatrixWorld(true);
  pistoletActif.bouche.getWorldPosition(vTmp);
  flash.position.copy(vTmp); flash.scale.setScalar((viseePremiere() ? 0.12 : 0.35) + Math.random() * 0.1); flash.visible = true;
  flashEtoile.scale.setScalar(viseePremiere() ? 0.35 : 1);
  flashEtoile.position.copy(vTmp); flashEtoile.lookAt(camera.position); flashEtoile.rotateZ(Math.random() * 6); flashEtoile.visible = true;
  tFlash = 0.05;
  const fin = impact ? impact.point : vTmp2.copy(rayonTir.ray.origin).addScaledVector(rayonTir.ray.direction, 80);
  tracante.geometry.setFromPoints([vTmp.clone(), fin.clone()]); tracante.visible = true;
  // Recul : l'arme et la vue remontent un peu
  arme.recul = Math.min(1, arme.recul + 0.45);
  hauteurCamera = Math.max(-0.45, hauteurCamera - 0.012); reculVue += 0.12;
  secousse = Math.max(secousse, 0.05);
  sonArme('tir');
  ejecterDouille();
  if (impact) toucherSurface(impact);
  majHudArme();
}
function toucherSurface(h) {
  const n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : rayonTir.ray.direction.clone().negate();
  const cible = cibles.find(c => c.papier === h.object);
  const trou = new THREE.Mesh(GEO_TROU, MAT_TROU);
  if (cible) {
    // Score : distance au centre des anneaux (le centre est à 150 px sur 352 depuis le haut du papier)
    const local = cible.papier.worldToLocal(h.point.clone());
    const cy = 1.1 / 2 - (150 / 352) * 1.1;
    const d = Math.hypot(local.x, local.y - cy);
    const anneau = Math.max(0, 10 - Math.floor(d / (11.5 / 256 * 0.8)));
    trou.position.set(local.x, local.y, 0.002); cible.papier.add(trou); cible.trous.push(trou);
    if (cible.trous.length > 40) cible.papier.remove(cible.trous.shift());
    cible.vitesse += 1.6;                                  // la cible se balance sous l'impact
    arme.touches++; arme.score += anneau;
    afficherPoints(anneau);
    sonArme('papier');
  } else {
    trou.position.copy(h.point).addScaledVector(n, 0.004); trou.lookAt(vTmp2.copy(h.point).add(n));
    scene.add(trou); trousMurs.push(trou);
    if (trousMurs.length > 80) scene.remove(trousMurs.shift());
    jaillir(h.point.x, h.point.y, h.point.z, 6);
    sonArme('ricochet');
  }
  // Petite bouffée de poussière
  for (let k = 0; k < 3; k++) {
    const p = fumees[indexFumee]; indexFumee = (indexFumee + 1) % MAX_FUMEE;
    p.m.position.copy(h.point).addScaledVector(n, 0.05);
    p.vx = n.x * 0.8 + (Math.random() - 0.5) * 0.4; p.vy = n.y * 0.8 + 0.2; p.vz = n.z * 0.8 + (Math.random() - 0.5) * 0.4;
    p.duree = p.vie = 0.6 + Math.random() * 0.4; p.taille = 0.12; p.opa = 0.35; p.m.visible = true;
  }
}
function ejecterDouille() {
  (viseePremiere() ? pistoletVue : pistoletMain).ejection.getWorldPosition(vTmp);
  const m = new THREE.Mesh(GEO_DOUILLE, MAT_DOUILLE); m.position.copy(vTmp); scene.add(m);
  const droite = new THREE.Vector3(Math.cos(angleLisse), 0, -Math.sin(angleLisse));
  douilles.push({ m, vx: droite.x * 1.8 + (Math.random() - 0.5) * 0.4, vy: 2.2 + Math.random(), vz: droite.z * 1.8 + (Math.random() - 0.5) * 0.4, vie: 5, rebonds: 0 });
  if (douilles.length > 40) scene.remove(douilles.shift().m);
}
function afficherPoints(n) {
  const el = $('points-tir');
  el.textContent = n > 0 ? '+' + n : 'Raté';
  el.className = n >= 9 ? 'top' : n > 0 ? '' : 'rate';
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
}
function majHudArme() {
  const el = $('hud-arme'), v = $('viseur');
  const montre = armeEnMain() && enJeu;
  el.style.display = montre ? 'block' : 'none';
  v.style.display = montre && !viseePremiere() ? 'block' : 'none';   // en visée réelle, on vise avec les organes de visée
  if (!montre) return;
  $('munitions').textContent = arme.chargeur;
  $('reserve').textContent = '/ ' + arme.reserve;
  $('munitions').className = arme.chargeur === 0 ? 'vide' : arme.chargeur <= 3 ? 'bas' : '';
  const precision = arme.tirs ? Math.round(100 * arme.touches / arme.tirs) : 0;
  $('score-tir').textContent = `Score ${arme.score} · ${arme.tirs} tir${arme.tirs > 1 ? 's' : ''} · précision ${precision} %`;
}
// --- Les sons du pistolet (fabriqués avec Web Audio) : détonation + écho de la salle, mécanique, douilles
let reverbTir = null;
function salleReverb(ctx) {                               // une « empreinte » de pièce en béton : bruit qui s'éteint en ~1,3 s
  if (reverbTir) return reverbTir;
  const duree = 1.3, n = Math.floor(ctx.sampleRate * duree);
  const ir = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < n; i++) {
      const t = i / ctx.sampleRate;
      const echo = (Math.abs(t - 0.018 - c * 0.004) < 0.002 || Math.abs(t - 0.043 + c * 0.003) < 0.002) ? 0.6 : 0;   // premières réflexions (murs proches)
      d[i] = ((Math.random() * 2 - 1) * Math.exp(-t * 5.2) + echo * (Math.random() * 2 - 1)) * (t < 0.004 ? t / 0.004 : 1);
    }
  }
  const conv = ctx.createConvolver(); conv.buffer = ir;
  const retour = ctx.createGain(); retour.gain.value = 0.42;
  const filtre = ctx.createBiquadFilter(); filtre.type = 'lowpass'; filtre.frequency.value = 4200;
  conv.connect(filtre); filtre.connect(retour); retour.connect(audio.master);
  reverbTir = conv;
  return conv;
}
// Briques de son
function sonBruit(t, duree, type, freq, q, gain, { vers = null, vitesse = 1, finFreq = null, reverb = 0, attaque = 0.0015 } = {}) {
  const ctx = audio.ctx;
  const src = ctx.createBufferSource(); src.buffer = audio.bruit; src.playbackRate.value = vitesse;
  const f = ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
  if (finFreq) f.frequency.exponentialRampToValueAtTime(finFreq, t + duree);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gain, t + attaque); g.gain.exponentialRampToValueAtTime(0.0001, t + duree);
  src.connect(f); f.connect(g); g.connect(vers || audio.master);
  if (reverb) { const r = ctx.createGain(); r.gain.value = reverb; g.connect(r); r.connect(salleReverb(ctx)); }
  src.start(t, Math.random() * 0.3); src.stop(t + duree + 0.05);
}
function sonMetal(t, freqs, duree, gain, reverb = 0) {      // un « ting » métallique : plusieurs notes inharmoniques qui s'éteignent vite
  const ctx = audio.ctx;
  for (const [k, fr] of freqs.entries()) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr * (1 + (Math.random() - 0.5) * 0.02);
    const g = ctx.createGain(); const gk = gain / (1 + k * 0.6);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(gk, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + duree * (1 - k * 0.12));
    o.connect(g); g.connect(audio.master);
    if (reverb) { const r = ctx.createGain(); r.gain.value = reverb; g.connect(r); r.connect(salleReverb(ctx)); }
    o.start(t); o.stop(t + duree + 0.02);
  }
}
function sonDeclic(t, freq, gain, reverb = 0.15) { sonBruit(t, 0.025, 'bandpass', freq, 6, gain, { vitesse: 1.6, reverb }); sonMetal(t, [freq * 1.3, freq * 2.1], 0.05, gain * 0.25); }
function sonArme(nom, volume = 1) {
  if (!audio) return;
  const ctx = audio.ctx, t = ctx.currentTime + 0.005;
  if (nom === 'tir') {
    const dist = ctx.createWaveShaper(); dist.curve = audio.courbe;
    const sortie = ctx.createGain(); sortie.gain.value = 0.9;
    dist.connect(sortie); sortie.connect(audio.master);
    const envoi = ctx.createGain(); envoi.gain.value = 0.55; sortie.connect(envoi); envoi.connect(salleReverb(ctx));
    // 1. le « crack » supersonique : très court et très aigu
    sonBruit(t, 0.03, 'highpass', 2500, 0.7, 1.0, { vers: dist, vitesse: 1.8, attaque: 0.0005 });
    // 2. le corps de la détonation (les gaz qui sortent du canon)
    sonBruit(t, 0.16, 'bandpass', 1100, 0.8, 0.9, { vers: dist, finFreq: 420, attaque: 0.001 });
    // 3. le coup sourd dans la poitrine
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.11);
    const go = ctx.createGain(); go.gain.setValueAtTime(0.0001, t); go.gain.exponentialRampToValueAtTime(1.0, t + 0.002); go.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(go); go.connect(dist); o.start(t); o.stop(t + 0.22);
    // 4. la culasse qui recule et revient (mécanique)
    sonDeclic(t + 0.028, 3400, 0.22, 0.1);
    sonDeclic(t + 0.062, 2700, 0.3, 0.1);
    sonMetal(t + 0.064, [2850, 4410, 6230], 0.09, 0.05);
  } else if (nom === 'vide') {                              // tir à vide : le chien qui claque sur rien
    sonDeclic(t, 2900, 0.35, 0.2); sonMetal(t, [3100, 5200], 0.06, 0.06);
  } else if (nom === 'recharge') {                          // tout le rechargement, en vrai (environ 1,6 s)
    sonDeclic(t, 2400, 0.22);                                 // bouton d'éjection du chargeur
    sonBruit(t + 0.06, 0.18, 'bandpass', 700, 2, 0.18, { finFreq: 1600 });       // le chargeur glisse hors de la poignée
    sonBruit(t + 0.34, 0.07, 'lowpass', 500, 1, 0.3, { reverb: 0.3 });           // il tombe par terre (petit choc sourd)
    sonMetal(t + 0.345, [1450, 2320], 0.08, 0.05, 0.2);
    sonBruit(t + 0.72, 0.14, 'bandpass', 900, 2, 0.16, { finFreq: 600 });        // le nouveau chargeur entre…
    sonDeclic(t + 0.86, 1900, 0.5, 0.25); sonBruit(t + 0.86, 0.06, 'lowpass', 300, 1, 0.35);   // … et se verrouille : « clac »
    sonBruit(t + 1.18, 0.11, 'bandpass', 2400, 3, 0.16, { finFreq: 1500 });      // on tire la culasse en arrière
    sonDeclic(t + 1.29, 3000, 0.28);
    sonDeclic(t + 1.4, 2200, 0.55, 0.3); sonMetal(t + 1.4, [2600, 3900, 5700], 0.14, 0.08, 0.25);   // elle repart en avant
  } else if (nom === 'douille') {                           // une douille en laiton qui rebondit sur le béton
    const v = 0.07 * volume;
    sonMetal(t, [4200 + Math.random() * 900, 6100 + Math.random() * 900, 8300 + Math.random() * 900], 0.12 + Math.random() * 0.08, v, 0.15);
    sonBruit(t, 0.012, 'highpass', 5000, 1, v * 0.8);
  } else if (nom === 'arme') {                              // sortir le pistolet : frottement + vérification de la culasse
    sonBruit(t, 0.18, 'bandpass', 1500, 1.5, 0.12, { finFreq: 2600 });
    sonDeclic(t + 0.25, 2600, 0.25); sonDeclic(t + 0.36, 2200, 0.32);
  } else if (nom === 'papier') sonBruit(t, 0.03, 'highpass', 2600, 1, 0.14);
  else if (nom === 'ricochet') {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.setValueAtTime(3200 + Math.random() * 1500, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.25);
    const g = ctx.createGain(); g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
    o.connect(g); g.connect(audio.master); o.start(t); o.stop(t + 0.26);
    sonBruit(t, 0.05, 'bandpass', 1800, 1, 0.2, { reverb: 0.3 });
  } else if (nom === 'bip') sonMetal(t, [1320], 0.08, 0.12);
  else if (nom === 'erreur') { sonMetal(t, [220, 233], 0.35, 0.15); }
  else if (nom === 'porte') sonBruit(t, 1.1, 'lowpass', 500, 1.5, 0.25, { finFreq: 900, attaque: 0.15 });
}
// --- À chaque image
const dirCamArme = new THREE.Vector3();
function majArmes(dt) {
  // L'arme ne sort pas du garage : en remontant, on la remet au casier
  if (arme.equipee && (enVoiture ? vehicule.position.y : etat.y) > -10.5) { arme.equipee = false; casier.pistolets[0].visible = true; annoncer('Pistolet remis au casier', 'cp'); }
  pistoletMain.visible = armeEnMain();
  arme.attente = Math.max(0, arme.attente - dt);
  arme.recul = Math.max(0, arme.recul - dt * 3.2);
  reculVue *= Math.max(0, 1 - dt * 9);
  if (arme.recharge > 0) {
    arme.recharge -= dt;
    if (arme.recharge <= 0) { const n = Math.min(ARME.capacite - arme.chargeur, arme.reserve); arme.chargeur += n; arme.reserve -= n; majHudArme(); }
  }
  // Le personnage regarde là où vise la caméra, bras tendus, l'arme dans l'axe
  if (armeEnMain()) {
    const cible = angleLisse + Math.PI;
    etat.angle += Math.atan2(Math.sin(cible - etat.angle), Math.cos(cible - etat.angle)) * Math.min(1, dt * 14);
    perso.rotation.y = etat.angle;
    camera.getWorldDirection(dirCamArme);
    const tangage = Math.asin(clamp(dirCamArme.y, -1, 1));
    const { brasD, brasG } = refsPerso;
    const rechargeAnim = arme.recharge > 0 ? Math.sin((1.6 - arme.recharge) / 1.6 * Math.PI) * 0.7 : 0;
    brasG.rotation.set(-Math.PI / 2 - tangage + arme.recul * 0.35 + rechargeAnim, 0, 0.1); brasG.bas.rotation.x = -0.05 - rechargeAnim * 0.6;   // le bras qui tient l'arme
    brasD.rotation.set(-Math.PI / 2 - tangage + arme.recul * 0.25 + rechargeAnim * 0.3, 0, -0.5); brasD.bas.rotation.x = -0.3;               // l'autre main soutient
    pistoletMain.glissiere.position.z = 0.02 - (arme.attente > ARME.cadence - 0.06 ? 0.03 : 0);   // la glissière recule au tir
  }
  // Visée à la 1re personne : arme devant les yeux, elle recule et se relève à chaque tir
  const ads = viseePremiere();
  vueArme.visible = ads;
  if (!passagerActif) perso.visible = !ads;
  if (ads) {
    vueArme.position.set(POSE_VUE.x, POSE_VUE.y - arme.recul * 0.012, POSE_VUE.z + arme.recul * 0.05);
    vueArme.rotation.set(arme.recul * 0.22, 0, 0);
    pistoletVue.glissiere.position.z = 0.02 - (arme.attente > ARME.cadence - 0.06 ? 0.03 : 0);
  }
  // Viseur : il s'écarte quand on tire vite, se resserre quand on vise
  const ecart = 8 + arme.recul * 22 + (viser ? -3 : 4);
  $('viseur').style.setProperty('--e', ecart.toFixed(1) + 'px');
  // Effets
  if (tFlash > 0) { tFlash -= dt; if (tFlash <= 0) { flash.visible = false; flashEtoile.visible = false; tracante.visible = false; } }
  for (let k = douilles.length - 1; k >= 0; k--) {
    const d = douilles[k];
    d.vy -= 9.8 * dt; d.m.position.x += d.vx * dt; d.m.position.y += d.vy * dt; d.m.position.z += d.vz * dt;
    d.m.rotation.x += dt * 14; d.m.rotation.z += dt * 9;
    const sol = hauteurSol(d.m.position.x, d.m.position.z, d.m.position.y + 0.5);
    if (d.m.position.y < sol + 0.006) {
      d.m.position.y = sol + 0.006;
      if (d.vy < -0.5 && d.rebonds < 4) {
        const loin = d.m.position.distanceTo(camera.position);
        sonArme('douille', Math.max(0, 1 - loin / 14) / (1 + d.rebonds * 0.9));
        d.vy *= -0.38; d.vx *= 0.55; d.vz *= 0.55; d.rebonds++;
      }
      else { d.vx = d.vy = d.vz = 0; }
    }
    d.vie -= dt;
    if (d.vie <= 0) { scene.remove(d.m); douilles.splice(k, 1); }
  }
  for (const c of cibles) {                                 // les cibles se balancent puis se calment
    c.vitesse += -c.balancement * 18 * dt; c.vitesse *= Math.max(0, 1 - dt * 2.5);
    c.balancement += c.vitesse * dt;
    c.support.rotation.x = c.balancement * 0.35;
  }
  // Petite indication « E » devant le casier
  const pres = enJeu && presCasier();
  const ind = $('indice-casier');
  if (pres) ind.textContent = arme.equipee ? '🔫 Ranger le pistolet · touche E' : '🔫 Prendre le pistolet · touche E';
  if (pres !== (ind.style.display === 'block')) ind.style.display = pres ? 'block' : 'none';
  majHudArme();
}
