// MAN'SCAVE — 02-ville.js
// =====================================================================
// 3. LA MAP : une ville moderne (place, route en anneau, avenues, tours)
// =====================================================================
const debutVille = scene.children.length;             // (pour cacher la ville quand on est au garage)
// Le circuit EN VILLE : il entre par l'avenue ouest, remonte une rue, traverse 2 immeubles,
// puis redescend l'avenue nord jusqu'à la ligne d'arrivée, juste devant le rond-point.
const ROUTE_VILLE = [[-150, 0], [-128, 0], [-113, -7], [-105, -22], [-105, -45], [-105, -80], [-100, -97], [-86, -105],
                     [-60, -105], [-30, -105], [-13, -101], [-3, -90]];
const PASSAGES_VILLE = [{ x: -105, z: -60, longueur: 34 }, { x: -46, z: -105, longueur: 34 }];
function distRouteVille(x, z) {                          // distance au tracé en ville (segments droits)
  let d = Infinity;
  for (let k = 0; k < ROUTE_VILLE.length - 1; k++) {
    const [ax, az] = ROUTE_VILLE[k], [bx, bz] = ROUTE_VILLE[k + 1];
    const vx = bx - ax, vz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / (vx * vx + vz * vz)));
    d = Math.min(d, Math.hypot(x - ax - vx * t, z - az - vz * t));
  }
  return d;
}
const TAILLE_MAP = 360;                                // 3 fois plus grande qu'avant
const LIMITE = TAILLE_MAP / 2 - 4;
const obstacles = [];                                  // cercles et boîtes qu'on ne peut pas traverser
const mursCamera = [];                                 // murs, piliers, plafonds… que la caméra ne doit pas traverser
const animations = [];                                 // petites fonctions appelées à chaque image

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const std = (couleur, rugosite = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ color: couleur, roughness: rugosite, metalness: metal });
function plat(geo, materiau, y) {                      // pose une forme à plat sur le sol
  const m = new THREE.Mesh(geo, materiau);
  m.rotation.x = -Math.PI / 2; m.position.y = y; m.receiveShadow = true;
  scene.add(m); return m;
}

// Pseudo-hasard « fixe » : la ville est la même à chaque partie
let graine = 11;
const hasard = () => (graine = (graine * 16807) % 2147483647) / 2147483647;

// Sol de base (herbe), place centrale, route en anneau (futur circuit) et avenues
// Le sol a un « trou » rectangulaire : l'entrée de la rampe qui descend au sous-sol
const TROU = { x1: -6, x2: 6, z1: 60, z2: 92 };
function solAvecTrou(x1, z1, x2, z2, materiau, y) {
  const forme = new THREE.Shape();                       // dessinée à plat (x, -z)
  forme.moveTo(x1, -z1); forme.lineTo(x2, -z1); forme.lineTo(x2, -z2); forme.lineTo(x1, -z2); forme.closePath();
  const trou = new THREE.Path();
  trou.moveTo(TROU.x1, -TROU.z1); trou.lineTo(TROU.x1, -TROU.z2); trou.lineTo(TROU.x2, -TROU.z2); trou.lineTo(TROU.x2, -TROU.z1); trou.closePath();
  forme.holes.push(trou);
  return plat(new THREE.ShapeGeometry(forme), materiau, y);
}
const herbeVille = std('#567f3f', 1);
herbeVille.polygonOffset = true; herbeVille.polygonOffsetFactor = 2; herbeVille.polygonOffsetUnits = 4;
solAvecTrou(-TAILLE_MAP / 2, -TAILLE_MAP / 2, TAILLE_MAP / 2, TAILLE_MAP / 2, herbeVille, 0);
plat(new THREE.CircleGeometry(33, 64), std('#c7c9cc', 0.9), 0.02);                 // place en béton clair
const matRoute = std('#34373d', 0.95);
plat(new THREE.RingGeometry(34, 48, 96), matRoute, 0.03);                         // route en anneau
plat(new THREE.RingGeometry(33, 34, 96), std('#e9e9e9', 0.7), 0.035);             // trottoir intérieur
plat(new THREE.RingGeometry(48, 49, 96), std('#e9e9e9', 0.7), 0.035);             // trottoir extérieur
for (let i = 0; i < 48; i++) {                                                     // pointillés blancs au milieu
  const a = (i / 48) * Math.PI * 2;
  const tiret = plat(new THREE.PlaneGeometry(0.35, 3), std('#f4f4f4', 0.6), 0.04);
  tiret.position.set(Math.cos(a) * 41, 0.04, Math.sin(a) * 41);
  tiret.rotation.z = -a;
}
const longAvenue = TAILLE_MAP / 2 - 47;                                            // 4 avenues partent de l'anneau
solAvecTrou(-7, 47, 7, TAILLE_MAP / 2, matRoute, 0.025);                           // avenue sud (avec l'entrée du sous-sol)
for (const [dx, dz] of [[1, 0], [-1, 0], [0, -1]]) {
  const av = plat(new THREE.PlaneGeometry(dx ? longAvenue : 14, dz ? longAvenue : 14), matRoute, 0.025);
  av.position.set(dx * (47 + longAvenue / 2), 0.025, dz * (47 + longAvenue / 2));
}

// Bordure de la map : un muret moderne tout autour
const matMuret = std('#d9dce0', 0.6);
// (le mur ouest a une ouverture au bout de l'avenue ouest : c'est là que le circuit rentre dans la ville)
const M = LIMITE + 1, demiOuverture = 8, longPan = (TAILLE_MAP - 2 * demiOuverture) / 2;
for (const [x, z, l, p] of [[0, -M, TAILLE_MAP, 1], [0, M, TAILLE_MAP, 1], [M, 0, 1, TAILLE_MAP],
                            [-M, -(demiOuverture + longPan / 2), 1, longPan], [-M, demiOuverture + longPan / 2, 1, longPan]]) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, 1.2, p), matMuret);
  m.position.set(x, 0.6, z); m.castShadow = m.receiveShadow = true; scene.add(m); mursCamera.push(m);
  obstacles.push({ boite: true, minX: x - l / 2, maxX: x + l / 2, minZ: z - p / 2, maxZ: z + p / 2 });
}

// Texture des façades : une grille de fenêtres, certaines allumées
const toileFacade = document.createElement('canvas');
toileFacade.width = 128; toileFacade.height = 128;
{
  const c = toileFacade.getContext('2d');
  c.fillStyle = '#28354a'; c.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 4; x++) {
    const allume = hasard() < 0.22;
    c.fillStyle = allume ? '#ffd79a' : (hasard() < 0.5 ? '#5d7898' : '#46607f');
    c.fillRect(x * 32 + 3, y * 16 + 3, 26, 11);
  }
}
const texFacade = new THREE.CanvasTexture(toileFacade);
texFacade.wrapS = texFacade.wrapT = THREE.RepeatWrapping;
const matFacade = new THREE.MeshStandardMaterial({ map: texFacade, roughness: 0.25, metalness: 0.4,
  emissive: '#ffcf8a', emissiveMap: texFacade, emissiveIntensity: 0.12 });
const matToit = std('#9aa1aa', 0.8);
const matTrottoir = std('#bfc2c6', 0.9);

function creerTour(x, z, largeur, profondeur, hauteur) {
  const geo = new THREE.BoxGeometry(largeur, hauteur, profondeur);
  // On étire les coordonnées de texture pour que les fenêtres gardent la même taille
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.max(largeur, profondeur) / 8, uv.getY(i) * hauteur / 8);
  const tour = new THREE.Mesh(geo, [matFacade, matFacade, matToit, matToit, matFacade, matFacade]);
  mursCamera.push(tour);
  tour.position.set(x, hauteur / 2, z);
  tour.castShadow = tour.receiveShadow = true;
  scene.add(tour);
  const socle = plat(new THREE.PlaneGeometry(largeur + 6, profondeur + 6), matTrottoir, 0.05);
  socle.position.set(x, 0.05, z);
  obstacles.push({ boite: true, minX: x - largeur / 2, maxX: x + largeur / 2, minZ: z - profondeur / 2, maxZ: z + profondeur / 2 });
}

// Les quartiers : une grille de tours autour de la place, sans toucher aux routes
for (let gx = -150; gx <= 150; gx += 30) {
  for (let gz = -150; gz <= 150; gz += 30) {
    if (Math.abs(gx) < 20 || Math.abs(gz) < 20) continue;          // on laisse les avenues libres
    if (Math.hypot(gx, gz) < 70) continue;                          // on laisse la place et l'anneau libres
    if (hasard() < 0.18) continue;                                  // quelques trous = petits parcs
    const l = 12 + hasard() * 9, p = 12 + hasard() * 9;
    const h = 14 + hasard() * hasard() * 80;                        // surtout des tours moyennes, quelques très hautes
    const tx = gx + (hasard() - 0.5) * 4, tz = gz + (hasard() - 0.5) * 4;
    if (distRouteVille(tx, tz) < 12 + Math.max(l, p) * 0.6) continue;   // la rue du circuit passe ici
    if (PASSAGES_VILLE.some(pv => Math.hypot(tx - pv.x, tz - pv.z) < 48)) continue;
    creerTour(tx, tz, l, p, h);
  }
}

// Arbres modernes (feuillage arrondi) et lampadaires
const matTronc = std('#6b4a32', 0.9);
const matFeuillage = ['#3f7d3a', '#4b8a3f', '#356f33'].map(c => std(c, 0.85));
function creerArbre(x, z) {
  const t = 0.8 + hasard() * 0.6;
  const tronc = new THREE.Mesh(new THREE.CylinderGeometry(0.18 * t, 0.25 * t, 2.4 * t, 8), matTronc);
  tronc.position.set(x, 1.2 * t, z);
  const feuilles = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * t, 1), matFeuillage[Math.floor(hasard() * 3)]);
  feuilles.position.set(x, 3.1 * t, z);
  for (const m of [tronc, feuilles]) { m.castShadow = true; scene.add(m); }
  obstacles.push({ x, z, rayon: 0.5 });
}
const matPoteau = std('#2b2f36', 0.4, 0.6);
const matLampe = new THREE.MeshStandardMaterial({ color: '#fff3d6', emissive: '#ffe2a8', emissiveIntensity: 1.2 });
function creerLampadaire(x, z, angle) {
  const p = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 6, 8), matPoteau);
  p.position.set(x, 3, z); p.castShadow = true; scene.add(p);
  const tete = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.15, 0.35), matLampe);
  tete.position.set(x - Math.cos(angle) * 0.6, 6, z - Math.sin(angle) * 0.6);
  tete.rotation.y = -angle; scene.add(tete);
  obstacles.push({ x, z, rayon: 0.3 });
}
for (let i = 0; i < 20; i++) {                                     // autour de la route en anneau
  const a = (i / 20) * Math.PI * 2 + 0.08;
  const presAvenue = Math.abs(Math.sin(2 * a)) < 0.35;            // pas de lampadaire au débouché des avenues
  if (!presAvenue) creerLampadaire(Math.cos(a) * 49.8, Math.sin(a) * 49.8, a);
  creerArbre(Math.cos(a + 0.16) * 30, Math.sin(a + 0.16) * 30);
}
for (let d = 62; d < LIMITE - 4; d += 16) {                         // le long des avenues
  for (const s of [-1, 1]) {
    for (const [ax, az] of [[9.5 * s, d], [9.5 * s, -d], [d, 9.5 * s], [-d, 9.5 * s]]) if (distRouteVille(ax, az) > 9) creerArbre(ax, az);
  }
}

const finVille = scene.children.length;
