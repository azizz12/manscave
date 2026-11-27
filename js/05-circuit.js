// MAN'SCAVE — 05-circuit.js
// =====================================================================
// 3d. LE CIRCUIT (3,4 km) : sous-sol, tunnel, sauts, virage relevé, pont, slalom en ville
// =====================================================================
// Le tracé est une liste de points [x, z, hauteur, demi-largeur, relevé en degrés (facultatif)].
// Une courbe lisse (Catmull-Rom) passe par tous ces points : c'est la ligne centrale de la piste.
// Pour modifier le circuit, il suffit de déplacer ces points !
// Chaque point : [x, z, hauteur, demi-largeur, relevé en degrés]
// Le tour commence à la LIGNE D'ARRIVÉE (avenue ouest, juste avant le rond-point) : c'est l'indice 0 de la piste.
const POINTS_CIRCUIT = [
  [0, -75, 0, 7], [0, -58, 0, 7],                                                                          // ligne d'arrivée (avenue nord) → rond-point
  [4.97, -40.69, 0, 7], [19.25, -36.2, 0, 7], [31.4, -26.35, 0, 7], [39, -12.67, 0, 7], [40.84, 3.57, 0, 7],   // le rond-point
  [36.2, 19.25, 0, 7], [26.35, 31.4, 0, 7], [14.02, 38.53, 0, 7], [3.22, 40.87, 0, 7],
  [0, 52, 0, 7], [0, 62, -0.4, 6], [0, 77, -3.5, 6], [0, 92, -6.8, 6], [0, 106, -7, 7], [0, 128, -7, 7],   // rampe → sous-sol
  [0, 150, -7, 7], [0, 172, -7, 6], [0, 200, -7, 6], [0, 228, -7, 6], [0, 246, -3.5, 7], [0, 262, 0, 7],   // grille → tunnel → sortie
  [0, 330, 1, 8], [0, 450, 3.5, 8], [0, 560, 8, 8],                                                       // 1. ligne droite qui monte : boost + saut
  [25, 650, 13, 8], [110, 705, 17, 8],                                                                    // 2. grand gauche en montée
  [200, 690, 19, 7], [265, 735, 21.5, 7], [335, 695, 18, 7], [405, 740, 14, 7], [475, 700, 10.5, 7],      // 3. les esses sur la crête
  [570, 700, 8, 9, 0], [640, 660, 7, 9, 16], [668, 575, 6, 9, 18], [630, 495, 5, 9, 16], [550, 455, 4, 9, 0],   // 4. virage relevé qui descend
  [460, 432, 3, 8], [400, 426, 2.5, 8], [340, 424, 2.5, 8], [280, 423, 2.5, 8], [215, 421, 3, 8],         // 5. quartier des tours (2 passages couverts)
  [140, 420, 7, 8], [70, 420, 11.5, 8], [0, 420, 12.5, 8], [-70, 420, 11, 8], [-140, 422, 6, 8],          // 6. le pont au-dessus de la ligne droite
  [-212, 448, 3, 8], [-258, 500, 2.5, 8], [-272, 580, 3, 8], [-328, 627, 5, 8], [-405, 612, 6, 8],        // 7. tour du parc d'attractions
  [-442, 545, 5, 8], [-432, 470, 3.5, 8], [-402, 412, 3, 7],
  [-452, 372, 4.5, 5.5], [-470, 336, 6, 5.5], [-442, 312, 7.5, 5.5],                                      // 8. LE COL : lacets étroits qui montent
  [-362, 318, 10, 5.5], [-302, 308, 12, 5.5], [-276, 284, 13, 5.5], [-298, 260, 14.5, 5.5],
  [-370, 255, 17, 5.5], [-438, 262, 19, 5.5], [-468, 238, 20, 5.5], [-446, 212, 21.5, 5.5],
  [-380, 205, 23, 5.5], [-322, 200, 22, 6],                                                               //    le sommet
  [-276, 172, 18.5, 7], [-262, 128, 13, 8], [-262, 90, 8.5, 8], [-262, 45, 3.5, 8], [-238, 7, 0.8, 8],    // 9. grande descente + saut n°2
  [-200, 0, 0, 8],                                                                                        // 10. retour en ville par l'avenue ouest
  ...ROUTE_VILLE.map(([x, z]) => [x, z, 0, 7]),                                                          // 11. les rues de la ville et 2 immeubles traversés
];
const dansVille = (x, z) => Math.abs(x) < 177 && Math.abs(z) < 177;
const CASE = 24;                                       // taille des cases de la grille de recherche rapide

// --- Fabrique un circuit à partir de ses points de contrôle (le jeu en a deux : celui du haut et le TRIP au niveau -3).
// Une courbe lisse (Catmull-Rom) passe par tous les points ; on la découpe en échantillons tous les 4 m environ.
//   ySol  : hauteur du sol autour du circuit (le virage relevé et les ponts se calculent par rapport à lui)
//   typeDe(x, y, z) : 'piste' (avec des murs) ou 'ville' (zone ouverte, sans murs, où l'on roule librement)
function construireCircuit(id, points, { ySol = 0, typeDe = () => 'piste' } = {}) {
  const courbe = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[2], p[1])), true, 'centripetal');
  const longueur = courbe.getLength();
  const nb = Math.round(longueur / 4), pas = longueur / nb;
  const ech = [];
  const pts = courbe.getSpacedPoints(nb);
  const moyenne = (x, z, j) => {                       // moyenne des 2 points de contrôle les plus proches
    let a = null, b = null;
    for (const p of points) {
      const d = Math.hypot(p[0] - x, p[1] - z), v = p[j] || 0;
      if (!a || d < a.d) { b = a; a = { d, v }; } else if (!b || d < b.d) b = { d, v };
    }
    return (a.v * b.d + b.v * a.d) / (a.d + b.d + 0.001);
  };
  for (let i = 0; i < nb; i++) {
    const p = pts[i], suivant = pts[(i + 1) % nb], avant = pts[(i - 1 + nb) % nb];
    let tx = suivant.x - avant.x, tz = suivant.z - avant.z;
    const n = Math.hypot(tx, tz); tx /= n; tz /= n;
    ech.push({ x: p.x, y: p.y, z: p.z, tx, tz, lx: -tz, lz: tx, w: moyenne(p.x, p.z, 3), releveDeg: moyenne(p.x, p.z, 4),
               type: typeDe(p.x, p.y, p.z), courbure: 0, releve: 0, bosse: 0, pont: false, kv: 0 });
  }
  for (let i = 0; i < nb; i++) {                       // courbure = à quel point ça tourne (1 / rayon)
    const a = ech[(i - 3 + nb) % nb], b = ech[(i + 3) % nb], s = ech[i];
    const da = Math.atan2(a.tx * b.tz - a.tz * b.tx, a.tx * b.tx + a.tz * b.tz);
    s.courbure = da / (6 * pas);
    // Relevé : le côté extérieur du virage est surélevé (pente latérale)
    s.releve = -Math.sign(s.courbure) * Math.tan(s.releveDeg * Math.PI / 180);
    // Dans le virage relevé, on monte toute la piste : son bord intérieur reste au-dessus du sol
    if (s.releve !== 0 && s.y >= ySol) s.y += Math.abs(s.releve) * (s.w + 0.4) + 0.05;
  }
  // Courbure verticale (sommets de bosse < 0) : sert à faire décoller la voiture sur les crêtes à grande vitesse
  for (let i = 0; i < nb; i++) {
    const a = ech[(i - 2 + nb) % nb], s = ech[i], b = ech[(i + 2) % nb];
    s.kv = ((b.y - s.y) - (s.y - a.y)) / (4 * pas * pas);
  }
  // Grille de recherche rapide : pour trouver vite l'endroit de la piste le plus proche
  const grille = new Map();
  ech.forEach((s, i) => {
    const k = Math.floor(s.x / CASE) + ',' + Math.floor(s.z / CASE);
    if (!grille.has(k)) grille.set(k, []);
    grille.get(k).push(i);
  });
  // Un morceau de piste est « en pont » quand une autre partie de la piste passe nettement plus bas, juste dessous
  for (let i = 0; i < nb; i++) {
    const s = ech[i];
    if (s.type !== 'piste' || s.y < ySol + 3) continue;
    const cx = Math.floor(s.x / CASE), cz = Math.floor(s.z / CASE);
    for (let a = -2; a <= 2 && !s.pont; a++) for (let b = -2; b <= 2 && !s.pont; b++) {
      for (const j of grille.get((cx + a) + ',' + (cz + b)) || []) {
        const ecart = Math.abs(((j - i) % nb + nb + nb / 2) % nb - nb / 2);
        if (ecart < 30) continue;
        const t = ech[j];
        if (t.y < s.y - 4 && Math.hypot(t.x - s.x, t.z - s.z) < s.w + t.w + 16) { s.pont = true; break; }
      }
    }
  }
  return { id, piste: ech, NB: nb, PAS_PISTE: pas, longueur, grillePiste: grille, ySol,
           sauts: [], boosts: [], barrieres: [], pneus: [], checkpoints: [], places: [], caisses: [] };
}

// --- Le circuit « actif » : celui de l'étage où l'on se trouve. Tout le jeu (conduite, course, adversaires, objets)
// travaille avec ces variables ; on les échange quand on change de circuit.
let circuitActif = null, piste, NB, PAS_PISTE, grillePiste, L_CIRCUIT;
let SAUTS, BOOSTS, BARRIERES_MOBILES, PILES_PNEUS, CHECKPOINTS, PLACES_GRILLE;
function activerCircuit(c) {
  circuitActif = c;
  ({ piste, NB, PAS_PISTE, grillePiste } = c);
  L_CIRCUIT = NB * PAS_PISTE;
  SAUTS = c.sauts; BOOSTS = c.boosts; BARRIERES_MOBILES = c.barrieres; PILES_PNEUS = c.pneus;
  CHECKPOINTS = c.checkpoints; PLACES_GRILLE = c.places;
}
function indiceProche(x, z) {
  let m = 0, d = Infinity;
  piste.forEach((s, i) => { const e = Math.hypot(s.x - x, s.z - z); if (e < d) { d = e; m = i; } });
  return m;
}
// Les attractions d'un circuit (positions données en x, z ; on retrouve l'endroit de la piste le plus proche)
//   sauts : tremplins · boosts : plaques d'accélération · barrieres : barrières mobiles · pneus : piles de pneus [x, z, lat]
function equiperCircuit(c, { sauts = [], boosts = [], barrieres = [], pneus = [] }) {
  activerCircuit(c);
  c.sauts = sauts.map(saut => ({ ...saut, i0: indiceProche(saut.x, saut.z), n: Math.round(saut.longueur / PAS_PISTE) }));
  for (const saut of c.sauts) for (let k = 0; k <= saut.n; k++) piste[(saut.i0 + k) % NB].bosse = saut.hauteur * Math.pow(k / saut.n, 1.3);
  c.boosts = boosts.map(b => ({ ...b, i: indiceProche(b.x, b.z) }));
  c.barrieres = barrieres.map(b => ({ ...b, i: indiceProche(b.x, b.z), lat: 0 }));
  c.pneus = pneus.map(([x, z, lat]) => ({ i: indiceProche(x, z), lat }));
  c.checkpoints = [0.2, 0.4, 0.6, 0.8].map(f => Math.round(f * NB));   // 4 checkpoints par tour, dans l'ordre
  activerCircuit(c);
}

const CIRCUIT_HAUT = construireCircuit('haut', POINTS_CIRCUIT, { typeDe: (x, y, z) => (dansVille(x, z) && y < -0.3 ? 'ville' : 'piste') });
Object.assign(CIRCUIT_HAUT, {
  nom: 'Circuit MAN\'SCAVE',
  places: [[-3, 144], [3, 138], [-3, 132], [3, 126]],   // grille de départ (en quinconce, comme en F1)
  yGrille: SOUS_SOL.y, feux: FEUX_HAUT, console: CONSOLE_HAUT,
  surGrille: p => p.y < -3 && p.y > -10 && Math.abs(p.x) < 8 && p.z < LIGNE_DEPART - 2 && p.z > LIGNE_DEPART - 32,
});
// Sauts : un tremplin qui monte, puis le sol « disparaît » : la voiture s'envole !
// Accélérateurs : des plaques lumineuses qui donnent un coup de boost
// Barrières mobiles : elles glissent d'un côté à l'autre de la piste · Piles de pneus fixes (à éviter) à la sortie de l'épingle
equiperCircuit(CIRCUIT_HAUT, {
  sauts: [{ x: 0, z: 352, longueur: 26, hauteur: 2.3 }, { x: -262, z: 104, longueur: 24, hauteur: 3.2 }],
  boosts: [{ x: 0, z: 300 }, { x: 512, z: 444 }, { x: 165, z: 420 }, { x: -262, z: 150 }, { x: -130, z: 0 }],
  barrieres: [{ x: 350, z: 424, vitesse: 1.25, phase: 0 }, { x: 292, z: 423, vitesse: 1.05, phase: 2.1 }],
  pneus: [[-282, 598, 3.4], [-298, 612, -3.4], [-316, 622, 3.4]],
});

// Hauteur du sol de la piste à une distance « lat » de la ligne centrale
const solPiste = (s, lat) => s.y + s.bosse + lat * s.releve;

const debutDehors = scene.children.length;             // tout ce qui est dehors : piste, relief, décor, quartier, parc
function trouverPiste(x, y, z, indiceConnu = -1) {
  let meilleur = -1, score = Infinity;
  const tester = i => {
    const s = piste[i];
    const sc = Math.hypot(x - s.x, z - s.z) + Math.abs(y - s.y) * 2;   // la hauteur départage le pont et le dessous
    if (sc < score) { score = sc; meilleur = i; }
  };
  if (indiceConnu >= 0) for (let k = -8; k <= 8; k++) tester((indiceConnu + k + NB) % NB);
  if (meilleur < 0 || score > 20) {
    const cx = Math.floor(x / CASE), cz = Math.floor(z / CASE);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) (grillePiste.get((cx + a) + ',' + (cz + b)) || []).forEach(tester);
  }
  if (meilleur < 0) return null;
  // On interpole sur le segment où se trouve vraiment la voiture (avant ou après l'échantillon le plus proche)
  let i0 = meilleur;
  if ((x - piste[meilleur].x) * piste[meilleur].tx + (z - piste[meilleur].z) * piste[meilleur].tz < 0) i0 = (meilleur - 1 + NB) % NB;
  const s = piste[i0], s2 = piste[(i0 + 1) % NB];
  const dx = x - s.x, dz = z - s.z;
  const avance = dx * s.tx + dz * s.tz, lat = dx * s.lx + dz * s.lz;
  const f = clamp(avance / PAS_PISTE, 0, 1);
  const sol = solPiste(s, lat) + (solPiste(s2, lat) - solPiste(s, lat)) * f;
  return { i: meilleur, s, lat, dist: Math.hypot(x - piste[meilleur].x, z - piste[meilleur].z), y: sol, base: s.y + (s2.y - s.y) * f,
           w: s.w + (s2.w - s.w) * f, pente: (solPiste(s2, 0) - solPiste(s, 0)) / PAS_PISTE, releve: s.releve, type: s.type };
}
const surTremplin = i => SAUTS.some(s => { const k = (i - s.i0 + NB) % NB; return k <= s.n; });

// --- Fabrication des « rubans » qui suivent la piste (asphalte, lignes, murs…)
function ruban(materiau, garder, coins, couleurs) {
  // coins(s) renvoie 2 points [x, y, z] (gauche et droite) pour chaque échantillon
  const pos = [], col = [];
  for (let i = 0; i < NB; i++) {
    const j = (i + 1) % NB;
    if (!garder(i) || !garder(j)) continue;
    const [a1, b1] = coins(piste[i], i), [a2, b2] = coins(piste[j], j);
    pos.push(...a1, ...b1, ...a2, ...b1, ...b2, ...a2);
    if (couleurs) { const c = couleurs(i); for (let k = 0; k < 6; k++) col.push(c.r, c.g, c.b); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (couleurs) geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  materiau.side = THREE.DoubleSide;
  const m = new THREE.Mesh(geo, materiau);
  m.receiveShadow = true;
  scene.add(m);
  return m;
}
const surPisteExt = i => piste[i].type === 'piste';
const auSol = (s, lat, dy) => [s.x + s.lx * lat, solPiste(s, lat) + dy, s.z + s.lz * lat];

// Asphalte (avec une texture de grain pour le réalisme)
const texAsphalte = (() => {
  const t = document.createElement('canvas'); t.width = t.height = 128;
  const c = t.getContext('2d');
  c.fillStyle = '#3b3e45'; c.fillRect(0, 0, 128, 128);
  for (let k = 0; k < 2200; k++) { const g = 40 + Math.random() * 50; c.fillStyle = `rgb(${g},${g + 2},${g + 6})`; c.fillRect(Math.random() * 128, Math.random() * 128, 1.5, 1.5); }
  const tex = new THREE.CanvasTexture(t); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
})();
{
  const m = ruban(new THREE.MeshStandardMaterial({ color: '#ffffff', map: texAsphalte, roughness: 0.92 }), surPisteExt,
                  s => [auSol(s, -s.w - 0.3, 0.03), auSol(s, s.w + 0.3, 0.03)]);
  // Coordonnées de texture : le grain se répète tous les 4 m
  const pos = m.geometry.attributes.position, uv = [];
  for (let k = 0; k < pos.count; k++) uv.push(pos.getX(k) / 4, pos.getZ(k) / 4);
  m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
}
// Lignes blanches sur les bords et pointillés au centre
const matLigneBlanche = new THREE.MeshStandardMaterial({ color: '#f4f4f4', roughness: 0.6 });
for (const c of [-1, 1]) ruban(matLigneBlanche, surPisteExt, s => [auSol(s, c * (s.w - 0.75), 0.045), auSol(s, c * (s.w - 0.5), 0.045)]);
ruban(matLigneBlanche, i => surPisteExt(i) && Math.floor(i / 2) % 2 === 0 && !surTremplin(i), s => [auSol(s, -0.12, 0.045), auSol(s, 0.12, 0.045)]);
// Vibreurs rouges et blancs dans les virages (là où la courbure est forte)
const rouge = new THREE.Color('#d8262f'), blanc = new THREE.Color('#f2f2f2'), jaune = new THREE.Color('#ffc21a'), noirC = new THREE.Color('#15161a');
const virage = i => surPisteExt(i) && Math.abs(piste[i].courbure) > 1 / 160;
for (const c of [-1, 1]) {
  ruban(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), virage,
        s => [auSol(s, c * (s.w - 0.45), 0.06), auSol(s, c * (s.w + 0.25), 0.06)], i => (i % 2 ? rouge : blanc));
}
// Murs de chaque côté : gris, avec une bande rouge et blanche en haut.
// Sous terre, ils montent jusqu'au niveau du sol ; sur le pont, ils cachent l'épaisseur du tablier.
const matMurPiste = new THREE.MeshStandardMaterial({ color: '#cfd3d8', roughness: 0.8 });
for (const c of [-1, 1]) {
  const lat = s => c * (s.w + 0.35);
  const bas = s => (s.pont ? solPiste(s, lat(s)) - 0.9 : s.y < -0.5 ? solPiste(s, lat(s)) : solPiste(s, lat(s)) - 1.5);
  const haut = s => (s.y < -0.5 ? 0.6 : solPiste(s, lat(s)) + 0.85);
  mursCamera.push(ruban(matMurPiste, surPisteExt, s => [[s.x + s.lx * lat(s), bas(s), s.z + s.lz * lat(s)], [s.x + s.lx * lat(s), haut(s), s.z + s.lz * lat(s)]]));
  ruban(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), surPisteExt,
        s => [[s.x + s.lx * lat(s) * 1.001, haut(s), s.z + s.lz * lat(s) * 1.001], [s.x + s.lx * lat(s) * 1.001, haut(s) + 0.25, s.z + s.lz * lat(s) * 1.001]],
        i => (Math.floor(i / 2) % 2 ? rouge : blanc));
}

// Les tremplins : peints en jaune et noir, avec leur face arrière verticale
for (const saut of SAUTS) {
  ruban(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5 }), i => { const k = (i - saut.i0 + NB) % NB; return k < saut.n; },
        s => [auSol(s, -s.w + 0.6, 0.07), auSol(s, s.w - 0.6, 0.07)], i => ((i - saut.i0) % 2 ? jaune : noirC));
  const s = piste[(saut.i0 + saut.n) % NB];
  const g = new THREE.BufferGeometry();
  const a = auSol(s, -s.w - 0.3, 0.03), b = auSol(s, s.w + 0.3, 0.03);
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, a[0], s.y, a[2], ...b, b[0], s.y, b[2], a[0], s.y, a[2]], 3));
  g.computeVertexNormals();
  const face = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#2a2c31', side: THREE.DoubleSide }));
  scene.add(face);
}
// Les accélérateurs : plaques à chevrons lumineux qui défilent
const texBoost = (() => {
  const t = document.createElement('canvas'); t.width = 64; t.height = 128;
  const c = t.getContext('2d');
  c.fillStyle = '#063a4a'; c.fillRect(0, 0, 64, 128);
  c.strokeStyle = '#7fe8ff'; c.lineWidth = 10; c.lineCap = 'round';
  for (const y of [28, 92]) { c.beginPath(); c.moveTo(8, y + 18); c.lineTo(32, y - 6); c.lineTo(56, y + 18); c.stroke(); }
  const tex = new THREE.CanvasTexture(t); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; return tex;
})();
const matBoost = new THREE.MeshStandardMaterial({ map: texBoost, emissive: '#ffffff', emissiveMap: texBoost, emissiveIntensity: 1.3, roughness: 0.4 });
for (const b of BOOSTS) {
  const m = ruban(matBoost, i => { const k = (i - b.i + NB) % NB; return k <= 3; },
                  s => [auSol(s, -s.w * 0.55, 0.075), auSol(s, s.w * 0.55, 0.075)]);
  const pos = m.geometry.attributes.position, uv = [];
  for (let k = 0; k < pos.count; k++) {
    const dx = pos.getX(k) - piste[b.i].x, dz = pos.getZ(k) - piste[b.i].z;
    uv.push((dx * piste[b.i].lx + dz * piste[b.i].lz) / 8 + 0.5, (dx * piste[b.i].tx + dz * piste[b.i].tz) / 6);
  }
  m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
}
animations.push(dt => { texBoost.offset.y -= dt * 1.8; });

// Barrières mobiles (rayées) et piles de pneus
const matRayure = (() => {
  const t = document.createElement('canvas'); t.width = 128; t.height = 32;
  const c = t.getContext('2d');
  for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#15161a' : '#ffc21a'; c.beginPath(); c.moveTo(k * 16, 32); c.lineTo(k * 16 + 16, 0); c.lineTo(k * 16 + 32, 0); c.lineTo(k * 16 + 16, 32); c.fill(); }
  return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(t), roughness: 0.5 });
})();
for (const b of BARRIERES_MOBILES) {
  b.mesh = new THREE.Mesh(new THREE.BoxGeometry(3.4, 1.0, 0.8), matRayure);
  b.mesh.castShadow = true; scene.add(b.mesh);
  const s = piste[b.i];
  b.mesh.rotation.y = Math.atan2(s.lx, s.lz) + Math.PI / 2;
}
let tempsJeu = 0;
animations.push(dt => {
  tempsJeu += dt;
  for (const b of BARRIERES_MOBILES) {
    const s = piste[b.i];
    b.lat = Math.sin(tempsJeu * b.vitesse + b.phase) * (s.w - 2.4);
    b.mesh.position.set(s.x + s.lx * b.lat, solPiste(s, b.lat) + 0.5, s.z + s.lz * b.lat);
  }
});
const matPneuPile = std('#16171a', 0.85), matBandePneu = std('#f2f2f2', 0.6);
for (const p of PILES_PNEUS) {
  const s = piste[p.i];
  p.x = s.x + s.lx * p.lat; p.z = s.z + s.lz * p.lat;
  for (let k = 0; k < 4; k++) {
    const pneu = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.2, 10, 20), k === 3 ? matBandePneu : matPneuPile);
    pneu.rotation.x = Math.PI / 2; pneu.position.set(p.x, solPiste(s, p.lat) + 0.2 + k * 0.36, p.z);
    pneu.castShadow = true; scene.add(pneu);
  }
}
// Les obstacles de la piste (pour les collisions) : barrières mobiles + piles de pneus
function obstaclesPiste() {
  const liste = PILES_PNEUS.map(p => ({ x: p.x, z: p.z, rayon: 0.65 }));
  for (const b of BARRIERES_MOBILES) {
    const s = piste[b.i];
    for (const k of [-1.1, 0, 1.1]) {
      const lat = b.lat + k;
      liste.push({ x: s.x + s.lx * lat, z: s.z + s.lz * lat, rayon: 0.6 });
    }
  }
  return liste;
}

// Le dessous du pont et ses piliers
ruban(std('#7d838b', 0.9), i => surPisteExt(i) && piste[i].pont, s => [auSol(s, s.w + 0.35, -0.9), auSol(s, -s.w - 0.35, -0.9)]);
const matPilier = std('#9aa0a8', 0.85);
for (let i = 0; i < NB; i += 6) {
  const s = piste[i];
  if (s.type !== 'piste' || !s.pont) continue;
  for (const c of [-1, 1]) {
    const x = s.x + s.lx * c * (s.w - 1.2), z = s.z + s.lz * c * (s.w - 1.2);
    const dessous = trouverPiste(x, 0, z);             // pas de pilier au milieu de la route qui passe dessous !
    if (dessous && dessous.base < 1 && dessous.dist < dessous.w + 2) continue;
    const h = 24;                                     // le pilier s'enfonce dans le sol
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.4, h, 1.4), matPilier); mursCamera.push(p);
    p.position.set(x, s.y - 0.9 - h / 2, z); p.castShadow = p.receiveShadow = true; scene.add(p);
  }
}

// Le tunnel sous la ville (plafond + néons), là où la piste est à -7 m
const enTunnel = i => surPisteExt(i) && piste[i].y < -6.5;
mursCamera[mursCamera.length] = ruban(new THREE.MeshStandardMaterial({ color: '#6f747b', roughness: 0.95 }), enTunnel,
      s => [auSol(s, -s.w - 0.4, 0), auSol(s, s.w + 0.4, 0)].map(p => [p[0], -0.35, p[2]]));
for (let i = 0; i < NB; i += 3) {
  if (!enTunnel(i)) continue;
  const s = piste[i];
  const n = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 3), matNeon);
  n.position.set(s.x, -0.5, s.z); n.rotation.y = Math.atan2(s.tx, s.tz); scene.add(n);
}
boite(1, 7, 8, -7.5, -3.5, 174, matBeton, 'sous-sol');   // morceau de tunnel encore sous la ville
boite(1, 7, 8, 7.5, -3.5, 174, matBeton, 'sous-sol');
boite(16, 0.5, 8, 0, -0.3, 174, matPlafond, 'aucun', false);
