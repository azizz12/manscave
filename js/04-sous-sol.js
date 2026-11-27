// MAN'SCAVE — 04-sous-sol.js
// =====================================================================
// 3b. LE SOUS-SOL : rampe d'accès, parking souterrain et grille de départ
// =====================================================================
const SOUS_SOL = { x1: -24, x2: 24, z1: 92, z2: 170, y: -7 };   // le grand espace sous la ville
const RAMPE = { z1: 60, z2: 92 };                               // la rampe descend de z = 60 à z = 92

// Hauteur du sol à un endroit donné (dépend de l'étage où l'on se trouve)
function hauteurSol(x, z, yActuel) {
  // L'ascenseur : on est sur la plateforme (ou au-dessus) → sa hauteur ; en dessous → le sol du garage
  if (yActuel < -3 && x > 15.2 && x < 23.8 && z > 131.2 && z < 138.8) return yActuel > ASC.y - 1.5 ? ASC.y : -14;
  if (yActuel < -10.5 && x > -24 && x < 24 && z > 96 && z < 168) return -14;               // le BITCHA Garage (niveau -2)
  if (yActuel < -10.5 && x > -16 && x < 8 && z >= 168 && z < 196) return -14;               // le stand de tir
  if (x > -6 && x < 6 && z > RAMPE.z1 && z < RAMPE.z2) return SOUS_SOL.y * (z - RAMPE.z1) / (RAMPE.z2 - RAMPE.z1);
  if (yActuel < -3 && x > SOUS_SOL.x1 && x < SOUS_SOL.x2 && z >= RAMPE.z2 - 0.5 && z < SOUS_SOL.z2) return SOUS_SOL.y;
  if (yActuel < -3 && Math.abs(x) < 8 && z >= SOUS_SOL.z2 - 0.5 && z < 182) return SOUS_SOL.y;          // début du tunnel
  if (Math.abs(x) < 180 && Math.abs(z) < 180) return 0;                                                   // la ville est plate
  // Dehors : sur la piste (ou un pont) si on est dessus, sinon le relief
  const info = trouverPiste(x, yActuel, z);
  if (info && info.type === 'piste' && info.dist < info.w + 0.8 && Math.abs(info.y - yActuel) < 2.5) return info.y;
  return hauteurTerrain(x, z);
}
const niveauDe = y => (y < -10.5 ? 'garage' : y < -3 ? 'sous-sol' : 'surface');
const memeNiveau = (o, niveau) => o.niveau === 'tous' || (o.niveau || 'surface') === niveau;

const matBeton = std('#8b9097', 0.9);
const matBetonSombre = std('#5b6067', 0.95);
const matPlafond = std('#6f747b', 0.95);
const matLigne = std('#f2f2f2', 0.6);
const matJaune = std('#f2c230', 0.6);

function boite(l, h, p, x, y, z, materiau, niveau, collision = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), materiau);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true;
  scene.add(m); mursCamera.push(m);
  if (collision) obstacles.push({ boite: true, niveau, minX: x - l / 2, maxX: x + l / 2, minZ: z - p / 2, maxZ: z + p / 2 });
  return m;
}
function marquage(l, p, x, y, z, materiau) {          // peinture au sol
  const m = plat(new THREE.PlaneGeometry(l, p), materiau, y);
  m.position.x = x; m.position.z = z;
  return m;
}

// --- La rampe : sol incliné + murs de chaque côté
const longueurRampe = Math.hypot(RAMPE.z2 - RAMPE.z1, SOUS_SOL.y);
const solRampe = new THREE.Mesh(new THREE.PlaneGeometry(12, longueurRampe), matBetonSombre);
solRampe.rotation.x = -Math.PI / 2 + Math.atan2(-SOUS_SOL.y, RAMPE.z2 - RAMPE.z1);
solRampe.position.set(0, SOUS_SOL.y / 2, (RAMPE.z1 + RAMPE.z2) / 2);
solRampe.receiveShadow = true;
scene.add(solRampe);
for (const s of [-1, 1]) {
  boite(1, 7.6, RAMPE.z2 - RAMPE.z1, s * 5.5, -3.2, (RAMPE.z1 + RAMPE.z2) / 2, matBeton, 'tous');
  for (let z = RAMPE.z1 + 2; z < RAMPE.z2; z += 4) {                       // bandes jaunes sur les murs
    marquage(0.3, 1.6, s * 4.2, SOUS_SOL.y * (z - RAMPE.z1) / (RAMPE.z2 - RAMPE.z1) + 0.03, z, matJaune);
  }
}
// Garde-corps au bout du trou (en surface) pour ne pas tomber dedans
const garde = boite(12, 0.9, 0.6, 0, 0.45, RAMPE.z2, std('#e0262f', 0.5), 'surface');

// --- Le parking : sol, plafond, murs
const L = SOUS_SOL.x2 - SOUS_SOL.x1, P = SOUS_SOL.z2 - SOUS_SOL.z1;
const cx = (SOUS_SOL.x1 + SOUS_SOL.x2) / 2, cz = (SOUS_SOL.z1 + SOUS_SOL.z2) / 2;
const solParking = (() => {                             // le sol, avec le trou du puits de l'ascenseur
  const f = new THREE.Shape();
  f.moveTo(SOUS_SOL.x1, -SOUS_SOL.z1); f.lineTo(SOUS_SOL.x2, -SOUS_SOL.z1); f.lineTo(SOUS_SOL.x2, -SOUS_SOL.z2); f.lineTo(SOUS_SOL.x1, -SOUS_SOL.z2); f.closePath();
  const t = new THREE.Path();
  t.moveTo(15.2, -131.2); t.lineTo(15.2, -138.8); t.lineTo(23.8, -138.8); t.lineTo(23.8, -131.2); t.closePath();
  f.holes.push(t);
  return plat(new THREE.ShapeGeometry(f), matBetonSombre, SOUS_SOL.y);
})();
const plafond = boite(L + 2, 0.5, P, cx, -0.3, cz, matPlafond, 'aucun', false);   // il fait de l'ombre : le soleil n'entre pas
boite(1, 7, P, SOUS_SOL.x1 - 0.5, -3.5, cz, matBeton, 'sous-sol');                 // mur ouest
boite(1, 7, P, SOUS_SOL.x2 + 0.5, -3.5, cz, matBeton, 'sous-sol');                 // mur est
boite(18, 7, 1, -16, -3.5, SOUS_SOL.z2 + 0.5, matBeton, 'sous-sol');              // mur du fond (gauche)
boite(18, 7, 1, 16, -3.5, SOUS_SOL.z2 + 0.5, matBeton, 'sous-sol');               // mur du fond (droite) : au milieu, le tunnel
boite(18, 7, 1, -15, -3.5, RAMPE.z2 - 0.5, matBeton, 'sous-sol');                  // mur d'entrée (gauche)
boite(18, 7, 1, 15, -3.5, RAMPE.z2 - 0.5, matBeton, 'sous-sol');                   // mur d'entrée (droite)

// Piliers (en laissant une grande allée au milieu)
for (let z = 100; z < SOUS_SOL.z2; z += 14) {
  for (const s of [-1, 1]) {
    boite(1.1, 7, 1.1, s * 12, -3.5, z, matBeton, 'sous-sol');
    marquage(1.5, 1.5, s * 12, SOUS_SOL.y + 0.02, z, matJaune);
  }
}

// Places de parking sur les côtés, avec quelques voitures garées
for (let z = 96; z <= 168; z += 6) {
  for (const s of [-1, 1]) if (!(s > 0 && z > 130 && z < 140)) marquage(9, 0.15, s * 19, SOUS_SOL.y + 0.02, z, matLigne);
}
[['furia', '#2a2d33', 1, 159]].forEach(([nom, couleur, s, z]) => {
  const v = creerVoiture(nom, couleur);
  v.position.set(s * 19, SOUS_SOL.y, z);
  v.rotation.y = s > 0 ? 0 : Math.PI;                  // l'avant tourné vers l'allée
  scene.add(v);
  obstacles.push({ x: s * 19, z, rayon: 2.2, niveau: 'sous-sol' });
});

// Néons au plafond et lumières du parking (allumées seulement quand on est en bas)
const matNeon = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e6f2ff', emissiveIntensity: 1.6 });
for (let z = 98; z < SOUS_SOL.z2; z += 9) {
  for (const x of [-18, -5, 5, 18]) {
    const n = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 4), matNeon);
    n.position.set(x, -0.6, z); scene.add(n);
  }
}
const lumieresParking = [];
for (const [x, z] of [[-9, 112], [9, 112], [-9, 150], [9, 150], [0, 98]]) {
  const l = new THREE.PointLight('#eef4ff', 0, 45, 1.6);
  l.position.set(x, -1.6, z); scene.add(l); lumieresParking.push(l);
}

// --- La grille de départ (les voitures regardent vers le tunnel, donc vers +Z)
const LIGNE_DEPART = 150;
{
  const t = document.createElement('canvas'); t.width = 256; t.height = 32;
  const c = t.getContext('2d');
  for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#111' : '#fff'; c.fillRect(i * 16, j * 16, 16, 16); }
  const tex = new THREE.CanvasTexture(t);
  marquage(16, 2, 0, SOUS_SOL.y + 0.03, LIGNE_DEPART, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
}
// Emplacements de la grille (en quinconce, comme en F1)
[[-3, 144], [3, 138], [-3, 132], [3, 126]].forEach(([x, z]) => {
  marquage(3, 0.2, x, SOUS_SOL.y + 0.03, z, matLigne);
  marquage(0.2, 1.6, x - 1.4, SOUS_SOL.y + 0.03, z - 0.7, matLigne);
  marquage(0.2, 1.6, x + 1.4, SOUS_SOL.y + 0.03, z - 0.7, matLigne);
});
// Inscription au sol
{
  const t = document.createElement('canvas'); t.width = 512; t.height = 96;
  const c = t.getContext('2d');
  c.fillStyle = '#ffffff'; c.font = '900 72px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('GRILLE DE DÉPART', 256, 50);
  const m = marquage(12, 2.25, 0, SOUS_SOL.y + 0.03, 118, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(t), transparent: true }));
  m.rotation.z = Math.PI;                             // lisible depuis la grille
}

// =====================================================================
// 3c. LES FEUX DE DÉPART façon Formule 1 (5 colonnes de 2 feux rouges)
// =====================================================================
const matPortique = std('#1c1f24', 0.5, 0.4);
for (const s of [-1, 1]) {
  boite(0.5, 4.8, 0.5, s * 9, SOUS_SOL.y + 2.4, LIGNE_DEPART + 1.5, matPortique, 'sous-sol');
}
boite(18.6, 0.9, 0.7, 0, SOUS_SOL.y + 4.6, LIGNE_DEPART + 1.5, matPortique, 'aucun', false);
const matFeuEteint = new THREE.MeshBasicMaterial({ color: '#3a0f12' });
const matFeuAllume = new THREE.MeshBasicMaterial({ color: '#ff2a2a' });
const colonnesFeux = [];
for (let i = 0; i < 5; i++) {
  const x = (i - 2) * 1.6;
  boite(1.0, 1.8, 0.45, x, SOUS_SOL.y + 3.25, LIGNE_DEPART + 1.5, matPortique, 'aucun', false);
  const feux = [0.42, -0.42].map(dy => {
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.3, 24), matFeuEteint);
    f.position.set(x, SOUS_SOL.y + 3.25 + dy, LIGNE_DEPART + 1.5 - 0.24);   // tournés vers la grille (-Z)
    f.rotation.y = Math.PI;
    scene.add(f);
    return f;
  });
  colonnesFeux.push(feux);
}
function allumerFeux(n) {                              // allume les n premières colonnes
  colonnesFeux.forEach((feux, i) => feux.forEach(f => { f.material = i < n ? matFeuAllume : matFeuEteint; }));
}

// --- La console de course : un gros bouton à presser (touche E) pour préparer le départ
const CONSOLE = { x: -9.5, z: 124 };
const console3D = new THREE.Group();
{
  const socleC = new THREE.Mesh(new THREE.BoxGeometry(1.1, 1.0, 0.8), std('#1c1f24', 0.4, 0.6));
  socleC.position.y = 0.5; socleC.castShadow = true;
  const pupitre = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.95), std('#2a2e36', 0.35, 0.5));
  pupitre.position.set(0, 1.06, 0); pupitre.rotation.x = -0.35;
  const liseret = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.04, 0.82), new THREE.MeshStandardMaterial({ color: '#7fe8ff', emissive: '#4fd8ff', emissiveIntensity: 1.6 }));
  liseret.position.set(0, 0.3, 0);
  console3D.add(socleC, pupitre, liseret);
}
const matBoutonOff = new THREE.MeshStandardMaterial({ color: '#d8262f', emissive: '#ff2030', emissiveIntensity: 0.9, roughness: 0.3 });
const matBoutonOn = new THREE.MeshStandardMaterial({ color: '#2fd17a', emissive: '#30ff8a', emissiveIntensity: 1.4, roughness: 0.3 });
const boutonCourse = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.12, 32), matBoutonOff);
boutonCourse.position.set(0, 1.16, 0.05); boutonCourse.rotation.x = -0.35;
const bague = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 8, 32), std('#e2e6ec', 0.15, 1));
bague.position.copy(boutonCourse.position); bague.rotation.x = Math.PI / 2 - 0.35;
console3D.add(boutonCourse, bague);
// Écran au-dessus de la console
const toileEcran = document.createElement('canvas'); toileEcran.width = 512; toileEcran.height = 192;
const texEcran = new THREE.CanvasTexture(toileEcran);
const ecran = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.72), new THREE.MeshBasicMaterial({ map: texEcran }));
ecran.position.set(0, 2.05, -0.2);
const cadreEcran = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.82, 0.08), std('#1c1f24', 0.4, 0.6));
cadreEcran.position.set(0, 2.05, -0.25);
const piedEcran = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), std('#1c1f24', 0.4, 0.6));
piedEcran.position.set(0, 1.2, -0.28);
console3D.add(cadreEcran, ecran, piedEcran);
console3D.position.set(CONSOLE.x, SOUS_SOL.y, CONSOLE.z);
console3D.rotation.y = Math.PI / 2;                    // tournée vers l'allée
scene.add(console3D);
obstacles.push({ x: CONSOLE.x, z: CONSOLE.z, rayon: 0.8, niveau: 'sous-sol' });
let texteEcran = '';
function majEcran(titre, ligne, couleur) {
  const cle = titre + ligne + couleur;
  if (cle === texteEcran) return;
  texteEcran = cle;
  const c = toileEcran.getContext('2d');
  c.fillStyle = '#0b1020'; c.fillRect(0, 0, 512, 192);
  c.fillStyle = couleur; c.font = '900 64px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(titre, 256, 72);
  c.fillStyle = '#cfd8e8'; c.font = '600 28px system-ui, sans-serif';
  c.fillText(ligne, 256, 140);
  texEcran.needsUpdate = true;
}
majEcran('COURSE', 'Appuie sur E', '#ff4a55');

// Panneau en surface pour trouver le sous-sol
const panneauSousSol = creerPanneau('Sous-sol ↓', 'Grille de départ · circuit 7 km');
panneauSousSol.position.set(0, 7.5, RAMPE.z1 - 2);
scene.add(panneauSousSol);
