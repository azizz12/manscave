// MAN'SCAVE — 10-personnage.js
// =====================================================================
// 5. LE PERSONNAGE : un pilote (1,85 m) en combinaison, avec un casque intégral
// =====================================================================
// Le corps est fait de formes « tournées » (comme sur un tour de potier) pour être lisse,
// et les bras et les jambes ont 2 articulations (épaule + coude, hanche + genou).
const perso = new THREE.Group();
const matCombi = new THREE.MeshPhysicalMaterial({ color: '#f1f3f6', roughness: 0.55, sheen: new THREE.Color('#3a3f4a') });
const matSombre = std('#1b1f27', 0.6);
const matAccent = std('#6a3cff', 0.35, 0.3);
const matCasque = new THREE.MeshPhysicalMaterial({ color: '#6a3cff', roughness: 0.15, metalness: 0.35, clearcoat: 1, clearcoatRoughness: 0.04 });
const matVisiere = new THREE.MeshPhysicalMaterial({ color: '#141c2c', roughness: 0.03, metalness: 0.95, clearcoat: 1 });

function tourner(points, materiau, segments = 28) {
  const m = new THREE.Mesh(new THREE.LatheGeometry(points.map(([r, y]) => new THREE.Vector2(r, y)), segments), materiau);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// Gélule (cylindre aux bouts arrondis), dessinée vers le bas depuis son point d'attache
function gelule(rHaut, rBas, longueur, materiau) {
  const pts = [];
  for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; pts.push([Math.sin(a) * rBas, -longueur + rBas - Math.cos(a) * rBas]); }
  for (let i = 6; i >= 0; i--) { const a = (i / 6) * Math.PI / 2; pts.push([Math.sin(a) * rHaut, -rHaut + Math.cos(a) * rHaut]); }
  pts.sort((a, b) => a[1] - b[1]);
  return tourner(pts, materiau, 20);
}

// Bassin et torse
const bassin = tourner([[0.001, -0.12], [0.15, -0.1], [0.18, -0.02], [0.17, 0.06], [0.15, 0.1], [0.001, 0.11]], matCombi);
bassin.scale.z = 0.72; bassin.position.y = 0.98;
const torse = tourner([[0.001, 0], [0.15, 0.02], [0.155, 0.12], [0.17, 0.26], [0.2, 0.4], [0.215, 0.48], [0.2, 0.54], [0.12, 0.58], [0.001, 0.59]], matCombi);
torse.scale.z = 0.64; torse.position.y = 1.0;
const bandeTorse = tourner([[0.172, 0.24], [0.2, 0.36], [0.205, 0.4], [0.176, 0.28]], matAccent);
bandeTorse.scale.z = 0.645; bandeTorse.position.y = 1.0;
const ceinture = tourner([[0.158, -0.02], [0.162, 0.05], [0.158, 0.06], [0.154, -0.01]], matSombre);
ceinture.scale.z = 0.66; ceinture.position.y = 1.0;
const fermeture = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.42, 0.01), matSombre);
fermeture.position.set(0, 1.3, 0.135);
const col = tourner([[0.07, 0], [0.085, 0.05], [0.075, 0.09]], matSombre); col.position.y = 1.57;

// Casque : coque, mentonnière, visière teintée, bande et petit aileron
const tete = new THREE.Group(); tete.position.y = 1.72;
const coque = new THREE.Mesh(new THREE.SphereGeometry(0.155, 32, 24), matCasque); coque.scale.set(0.95, 1.05, 1.08);
const menton = new THREE.Mesh(new THREE.SphereGeometry(0.13, 24, 16, Math.PI / 2 - 1.1, 2.2, 1.7, 1.1), matCasque);
menton.position.set(0, -0.04, 0.02); menton.scale.set(1, 1, 1.15);
const visiere = new THREE.Mesh(new THREE.SphereGeometry(0.158, 32, 20, Math.PI / 2 - 0.95, 1.9, 1.15, 0.6), matVisiere);
visiere.scale.set(0.96, 1.05, 1.1);
const bandeCasque = new THREE.Mesh(new THREE.TorusGeometry(0.157, 0.008, 8, 48), std('#ffffff', 0.4));
bandeCasque.rotation.y = Math.PI / 2; bandeCasque.scale.set(1.05, 1.06, 0.97);
const aileron = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.025, 0.14), matSombre); aileron.position.set(0, 0.15, -0.1); aileron.rotation.x = 0.4;
for (const m of [coque, menton, visiere, bandeCasque, aileron]) { m.castShadow = true; tete.add(m); }

// Bras et jambes articulés
function membre(rHaut, rMilieu, rBas, l1, l2, materiau, bout) {
  const haut = new THREE.Group();
  haut.add(gelule(rHaut, rMilieu, l1, materiau));
  const bas = new THREE.Group(); bas.position.y = -l1 + rMilieu * 0.6;
  bas.add(gelule(rMilieu, rBas, l2, materiau));
  if (bout) { bout.position.y = -l2 + rBas * 0.4; bas.add(bout); }
  haut.add(bas);
  haut.bas = bas;
  return haut;
}
const gant = () => {
  const g = new THREE.Group();
  const paume = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), matSombre); paume.scale.set(0.8, 1.1, 0.6);
  const pouce = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), matSombre); pouce.position.set(0.04, 0.01, 0.02); pouce.scale.set(1, 1.6, 1);
  g.add(paume, pouce); g.traverse(o => { o.castShadow = true; }); return g;
};
const botte = () => {
  const g = new THREE.Group();
  const pied = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 10), matSombre); pied.scale.set(0.85, 0.55, 1.6); pied.position.set(0, 0.0, 0.05);
  const semelle = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.025, 0.25), std('#e9ecf2', 0.6)); semelle.position.set(0, -0.035, 0.05);
  g.add(pied, semelle); g.traverse(o => { o.castShadow = true; }); return g;
};
const brasG = membre(0.058, 0.048, 0.042, 0.3, 0.28, matCombi, gant()); brasG.position.set(-0.235, 1.5, 0);
const brasD = membre(0.058, 0.048, 0.042, 0.3, 0.28, matCombi, gant()); brasD.position.set(0.235, 1.5, 0);
const jambeG = membre(0.085, 0.065, 0.055, 0.45, 0.45, matCombi, botte()); jambeG.position.set(-0.095, 0.95, 0);
const jambeD = membre(0.085, 0.065, 0.055, 0.45, 0.45, matCombi, botte()); jambeD.position.set(0.095, 0.95, 0);
for (const b of [brasG, brasD]) {                      // bande violette sur les manches
  const brassard = tourner([[0.05, -0.2], [0.052, -0.14], [0.05, -0.13]], matAccent, 16);
  b.add(brassard);
}
perso.add(bassin, torse, bandeTorse, ceinture, fermeture, col, tete, brasG, brasD, jambeG, jambeD);
scene.add(perso);

// Petite ombre ronde sous le personnage (aide à voir le saut)
const ombre = new THREE.Mesh(new THREE.CircleGeometry(0.42, 24),
  new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: 0.22, depthWrite: false }));
ombre.rotation.x = -Math.PI / 2; ombre.position.y = 0.06;
scene.add(ombre);

// Pose du personnage selon le mouvement : marche, course, saut, respiration au repos
const refsPerso = { brasG, brasD, jambeG, jambeD, torse, bandeTorse, tete };
function animerPerso(pas, vitesse, enLAir, temps, ref = refsPerso) {
  const { brasG, brasD, jambeG, jambeD, torse, bandeTorse, tete } = ref;
  const f = Math.min(1, vitesse / 7);                  // 0 = arrêté, 1 = course
  const s = Math.sin(pas), c = Math.cos(pas);
  const amp = 0.35 + 0.45 * f;
  if (enLAir) {
    jambeG.rotation.x = -0.6; jambeG.bas.rotation.x = 1.0;
    jambeD.rotation.x = 0.25; jambeD.bas.rotation.x = 0.5;
    brasG.rotation.x = -2.4; brasD.rotation.x = -2.2; brasG.bas.rotation.x = brasD.bas.rotation.x = -0.3;
    brasG.rotation.z = -0.25; brasD.rotation.z = 0.25;
    torse.rotation.x = 0; return;
  }
  const marche = Math.min(1, vitesse / 1.5);
  jambeG.rotation.x = s * amp * marche;  jambeD.rotation.x = -s * amp * marche;
  jambeG.bas.rotation.x = Math.max(0, -c) * (0.5 + 0.9 * f) * marche + 0.05;   // le genou plie quand la jambe revient
  jambeD.bas.rotation.x = Math.max(0, c) * (0.5 + 0.9 * f) * marche + 0.05;
  brasG.rotation.x = -s * amp * 0.9 * marche; brasD.rotation.x = s * amp * 0.9 * marche;
  brasG.bas.rotation.x = brasD.bas.rotation.x = -(0.2 + 0.9 * f) * marche - 0.12;
  brasG.rotation.z = -0.08; brasD.rotation.z = 0.08;
  const respire = Math.sin(temps * 2.2) * 0.012 * (1 - marche);
  torse.scale.y = 1 + respire; bandeTorse.scale.y = 1 + respire;
  torse.rotation.x = 0.12 * f;                         // on se penche en avant quand on court
  tete.rotation.x = -0.05 * f;
}

// État du personnage : il apparaît au sous-sol, près de la console de course
const etat = { x: -6, z: 120, y: -7, vitesseY: 0, angle: -Math.PI / 2, auSol: true, pas: 0 };
