// MAN'SCAVE — 06-relief-decor.js
// =====================================================================
// 3e. LE RELIEF : des collines partout, un lac, et le terrain qui épouse la piste
// =====================================================================
const TERRAIN = { x1: -1500, z1: -1308, pas: 12, nx: 268, nz: 268 };   // grille de 12 m (alignée sur les bords de la ville)
const ZONES_PLATES = [                                    // endroits aplanis (rectangles ou cercles) avec une marge en pente douce
  { x: 0, z: 0, dx: 180, dz: 180, y: 0, marge: 70 },               // la ville
  { x: 0, z: 222, dx: 40, dz: 55, y: 0, marge: 60 },              // au-dessus du tunnel et de sa sortie
  { x: -350, z: 525, r: 74, y: 3, marge: 40 },                    // le parc d'attractions (rond)
  { x: 318, z: 424, dx: 160, dz: 75, y: 2.5, marge: 50 },        // le quartier des tours
];
const LAC = { x: 300, z: 1060, r: 170, eau: -1.2 };
const lisse = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function reliefNaturel(x, z) {
  let h = 10 * Math.sin(x * 0.0058 + 1.3) * Math.cos(z * 0.0049 - 0.4)
        + 6 * Math.sin(x * 0.0131 + z * 0.0087 + 0.7)
        + 3 * Math.sin(z * 0.0213 - x * 0.0061 + 2.1)
        + 1.4 * Math.sin(x * 0.047 + 1.1) * Math.sin(z * 0.041);
  h = h * 0.9 + 8;
  // De vraies montagnes au loin (on les devine à l'horizon dans la brume)
  const r = Math.hypot(x - 100, z - 380);
  h += Math.max(0, r - 820) * 0.16 * (0.75 + 0.25 * Math.sin(Math.atan2(z - 380, x - 100) * 5));
  // Le lac : une cuvette
  const dl = Math.hypot(x - LAC.x, z - LAC.z), wl = lisse(LAC.r * 0.55, LAC.r * 1.6, dl);
  h = h * wl + (LAC.eau - 5) * (1 - wl);
  for (const zp of ZONES_PLATES) {                       // on aplanit les zones construites
    const d = zp.r ? Math.hypot(x - zp.x, z - zp.z) - zp.r : Math.max(Math.abs(x - zp.x) - zp.dx, Math.abs(z - zp.z) - zp.dz);
    const w = 1 - lisse(0, zp.marge, d);
    h = h + (zp.y - h) * w;
  }
  return h;
}
const hauteursTerrain = new Float32Array(TERRAIN.nx * TERRAIN.nz);
{
  const R = 75;                                          // distance d'influence de la piste
  for (let iz = 0; iz < TERRAIN.nz; iz++) for (let ix = 0; ix < TERRAIN.nx; ix++) {
    const x = TERRAIN.x1 + ix * TERRAIN.pas, z = TERRAIN.z1 + iz * TERRAIN.pas;
    let h = reliefNaturel(x, z);
    // Influence de la piste : à plat sous elle (et sur ses bas-côtés), puis on rejoint doucement les collines
    const cx = Math.floor(x / CASE), cz = Math.floor(z / CASE);
    let dmin = Infinity, wmin = 8, sousPiste = Infinity, somme = 0, poids = 0;
    for (let a = -3; a <= 3; a++) for (let b = -3; b <= 3; b++) {
      for (const i of grillePiste.get((cx + a) + ',' + (cz + b)) || []) {
        const sp = piste[i];
        if (sp.type !== 'piste' || sp.y < -0.5) continue;
        const dx = x - sp.x, dz = z - sp.z, d = Math.hypot(dx, dz);
        if (d > R) continue;
        const lat = clamp(dx * sp.lx + dz * sp.lz, -sp.w, sp.w);
        const hs = solPiste(sp, lat) - 0.3;
        if (d < sp.w + 14) sousPiste = Math.min(sousPiste, hs);
        if (d < dmin) { dmin = d; wmin = sp.w; }
        const p = 1 / Math.max(1, d * d);
        somme += hs * p; poids += p;
      }
    }
    if (sousPiste < Infinity) h = sousPiste;
    else if (poids > 0) { const t = lisse(wmin + 14, wmin + 62, dmin); h = (somme / poids) * (1 - t) + h * t; }
    hauteursTerrain[iz * TERRAIN.nx + ix] = h;
  }
}
// Hauteur du terrain n'importe où (interpolée exactement comme les triangles affichés)
function hauteurTerrain(x, z) {
  if (Math.abs(x) < 180 && Math.abs(z) < 180) return 0;
  const fx = clamp((x - TERRAIN.x1) / TERRAIN.pas, 0, TERRAIN.nx - 1.001), fz = clamp((z - TERRAIN.z1) / TERRAIN.pas, 0, TERRAIN.nz - 1.001);
  const ix = Math.floor(fx), iz = Math.floor(fz), u = fx - ix, v = fz - iz;
  const H = (i, j) => hauteursTerrain[j * TERRAIN.nx + i];
  if (u + v < 1) return H(ix, iz) + (H(ix + 1, iz) - H(ix, iz)) * u + (H(ix, iz + 1) - H(ix, iz)) * v;
  return H(ix + 1, iz + 1) + (H(ix, iz + 1) - H(ix + 1, iz + 1)) * (1 - u) + (H(ix + 1, iz) - H(ix + 1, iz + 1)) * (1 - v);
}
{
  // Le maillage : couleurs selon la hauteur et la pente (herbe, prairie, roche, sable près du lac, neige en haut)
  const nx = TERRAIN.nx, nz = TERRAIN.nz;
  const pos = new Float32Array(nx * nz * 3), col = new Float32Array(nx * nz * 3);
  const cHerbe = new THREE.Color('#5d8a43'), cHerbe2 = new THREE.Color('#7c9a4c'), cRoche = new THREE.Color('#8a8478'),
        cSable = new THREE.Color('#cdbb8a'), cNeige = new THREE.Color('#eef1f4'), c = new THREE.Color();
  for (let iz = 0; iz < nz; iz++) for (let ix = 0; ix < nx; ix++) {
    const k = iz * nx + ix, x = TERRAIN.x1 + ix * TERRAIN.pas, z = TERRAIN.z1 + iz * TERRAIN.pas, h = hauteursTerrain[k];
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    const hx = hauteursTerrain[iz * nx + Math.min(nx - 1, ix + 1)] - h, hz = hauteursTerrain[Math.min(nz - 1, iz + 1) * nx + ix] - h;
    const pente = Math.hypot(hx, hz) / TERRAIN.pas;
    c.copy(cHerbe).lerp(cHerbe2, 0.5 + 0.5 * Math.sin(x * 0.02 + z * 0.015));
    c.lerp(cRoche, lisse(0.35, 0.8, pente));
    if (Math.hypot(x - LAC.x, z - LAC.z) < LAC.r * 1.6) c.lerp(cSable, 1 - lisse(LAC.eau + 0.3, LAC.eau + 2.2, h));   // plage autour du lac
    c.lerp(cNeige, lisse(70, 110, h));
    col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
  }
  // Triangles (sans la ville ni la tranchée de sortie du tunnel, qui ont leur propre sol)
  const idx = [];
  for (let iz = 0; iz < nz - 1; iz++) for (let ix = 0; ix < nx - 1; ix++) {
    const x = TERRAIN.x1 + (ix + 0.5) * TERRAIN.pas, z = TERRAIN.z1 + (iz + 0.5) * TERRAIN.pas;
    if (Math.abs(x) < 180 && Math.abs(z) < 180) continue;
    if (Math.abs(x) < 12 && z > 228 && z < 264) continue;
    const a = iz * nx + ix, b = a + 1, c2 = a + nx, d = c2 + 1;
    idx.push(a, c2, b, b, c2, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const matTerrain = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.97 });
  matTerrain.polygonOffset = true; matTerrain.polygonOffsetFactor = 2; matTerrain.polygonOffsetUnits = 4;   // l'asphalte passe toujours devant
  const terrain = new THREE.Mesh(geo, matTerrain);
  terrain.receiveShadow = true; scene.add(terrain);
  // Bandes d'herbe le long de la tranchée de sortie du tunnel (la grille est plus large que la tranchée)
  const herbe = std('#5d8a43', 1); herbe.polygonOffset = true; herbe.polygonOffsetFactor = 2; herbe.polygonOffsetUnits = 4;
  for (const [x1, x2, z1, z2] of [[7.6, 12, 228, 264], [-12, -7.6, 228, 264], [-7.6, 7.6, 228, 229.2]]) {
    const m = plat(new THREE.PlaneGeometry(x2 - x1, z2 - z1), herbe, 0);
    m.position.set((x1 + x2) / 2, 0, (z1 + z2) / 2);
  }
  // Le lac
  const eau = new THREE.Mesh(new THREE.CircleGeometry(LAC.r * 1.15, 64),
    new THREE.MeshStandardMaterial({ color: '#3b7fb6', roughness: 0.08, metalness: 0.3, transparent: true, opacity: 0.9 }));
  eau.rotation.x = -Math.PI / 2; eau.position.set(LAC.x, LAC.eau, LAC.z); scene.add(eau);
}

const debutDecor = scene.children.length;
// --- Décor : forêt, rochers, villages, éoliennes, panneaux publicitaires, tribunes
// Les arbres sont rangés par « paquets » de 400 m : l'ordinateur ne dessine que les paquets visibles,
// et pour chaque paquet tous les arbres partent en une seule fois (instanciation).
function fusionner(morceaux) {                            // colle plusieurs formes colorées en une seule
  const pos = [], nor = [], col = [];
  for (const [geo, couleur] of morceaux) {
    const g = geo.index ? geo.toNonIndexed() : geo;
    const c = new THREE.Color(couleur);
    pos.push(...g.attributes.position.array); nor.push(...g.attributes.normal.array);
    for (let k = 0; k < g.attributes.position.count; k++) col.push(c.r, c.g, c.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return geo;
}
const pres = (geo, x, y, z) => { geo.translate(x, y, z); return geo; };
const GEO_FEUILLU = fusionner([[pres(new THREE.CylinderGeometry(0.25, 0.38, 3, 6), 0, 1.5, 0), '#6b4a32'],
                               [pres(new THREE.IcosahedronGeometry(2.3, 1), 0, 4.4, 0), '#ffffff']]);
const GEO_SAPIN = fusionner([[pres(new THREE.CylinderGeometry(0.2, 0.3, 2.2, 6), 0, 1.1, 0), '#5a3d28'],
                             [pres(new THREE.ConeGeometry(2.2, 4.2, 8), 0, 3.6, 0), '#ffffff'],
                             [pres(new THREE.ConeGeometry(1.6, 3.4, 8), 0, 5.9, 0), '#ffffff']]);
const GEO_ROCHER = fusionner([[new THREE.DodecahedronGeometry(1.6, 0), '#ffffff']]);
const MAT_VEGETAL = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 });
// Une place est libre si elle n'est ni en ville, ni dans le parc, ni dans le quartier, ni dans le lac, ni trop près de la piste
function placeLibre(x, z, margePiste) {
  if (Math.abs(x) < 195 && Math.abs(z) < 195) return false;
  if (Math.abs(x) < 50 && z > 170 && z < 290) return false;
  if (Math.hypot(x + 350, z - 525) < 78) return false;
  if (Math.abs(x - 318) < 175 && Math.abs(z - 424) < 90) return false;
  if (Math.hypot(x - LAC.x, z - LAC.z) < LAC.r * 1.3) return false;
  for (const zl of ZONES_LIBRES) if (Math.hypot(x - zl[0], z - zl[1]) < zl[2]) return false;
  const cx = Math.floor(x / CASE), cz = Math.floor(z / CASE);
  for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++)
    for (const i of grillePiste.get((cx + a) + ',' + (cz + b)) || [])
      if (Math.hypot(piste[i].x - x, piste[i].z - z) < piste[i].w + margePiste) return false;
  return true;
}
const ZONES_LIBRES = [];                                  // villages, éoliennes, tribunes… (remplie plus bas, avant de planter)
const VILLAGES = [[720, 230], [-700, 760], [880, 860], [-180, 1000], [-760, 40]];
for (const [x, z] of VILLAGES) ZONES_LIBRES.push([x, z, 70]);
const EOLIENNES = [[-880, 280], [-920, 430], [-860, 580], [1060, 180], [1110, 340], [1020, 520], [560, 1350], [80, 1380]];
for (const [x, z] of EOLIENNES) ZONES_LIBRES.push([x, z, 14]);
ZONES_LIBRES.push([-32, 520, 70], [720, 580, 80], [-205, 560, 50]);   // tribunes

function planterParPaquets(geo, liste, taillePaquet, ombre) {
  const paquets = new Map();
  for (const it of liste) {
    const k = Math.floor(it.x / taillePaquet) + ',' + Math.floor(it.z / taillePaquet);
    if (!paquets.has(k)) paquets.set(k, []);
    paquets.get(k).push(it);
  }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Vector3(), p = new THREE.Vector3(), axeY = new THREE.Vector3(0, 1, 0);
  for (const items of paquets.values()) {
    const g = geo.clone();
    let cx = 0, cy = 0, cz = 0;
    for (const it of items) { cx += it.x; cy += it.y; cz += it.z; }
    cx /= items.length; cy /= items.length; cz /= items.length;
    let r = 0;
    for (const it of items) r = Math.max(r, Math.hypot(it.x - cx, it.y - cy, it.z - cz));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), r + 14);   // pour que l'ordinateur sache quand le paquet est visible
    const im = new THREE.InstancedMesh(g, MAT_VEGETAL, items.length);
    items.forEach((it, n) => {
      q.setFromAxisAngle(axeY, it.rot); e.set(it.s, it.s * (it.sy || 1), it.s);
      m4.compose(p.set(it.x, it.y, it.z), q, e); im.setMatrixAt(n, m4);
      im.setColorAt(n, it.couleur);
    });
    im.castShadow = ombre; im.receiveShadow = true;
    scene.add(im);
  }
}
{
  const arbres = [], sapins = [], rochers = [];
  let essais = 0;
  const verts = ['#3d7a37', '#4b8a3f', '#356f33', '#5a8f3a', '#6b9a3e'].map(c => new THREE.Color(c));
  const vertsSapin = ['#2f5f34', '#2a5530', '#3a6b3a'].map(c => new THREE.Color(c));
  const automne = ['#c8862f', '#b8572c', '#d6a33a'].map(c => new THREE.Color(c));
  while (arbres.length + sapins.length < 3800 && essais < 90000) {
    essais++;
    // Plus d'arbres près du circuit (c'est là qu'on les voit), moins au loin
    const loin = hasard() < 0.35;
    const x = loin ? -1300 + hasard() * 2800 : -600 + hasard() * 1400;
    const z = loin ? -1000 + hasard() * 2700 : -150 + hasard() * 1050;
    if (!placeLibre(x, z, 11)) continue;
    const y = hauteurTerrain(x, z);
    if (y < LAC.eau + 1) continue;
    const sapin = y > 16 || hasard() < 0.25;              // les sapins sur les hauteurs
    const it = { x, y: y - 0.2, z, s: 0.75 + hasard() * 0.75, sy: 0.9 + hasard() * 0.35, rot: hasard() * 6.3 };
    if (sapin) { it.couleur = vertsSapin[Math.floor(hasard() * 3)]; sapins.push(it); }
    else { it.couleur = hasard() < 0.12 ? automne[Math.floor(hasard() * 3)] : verts[Math.floor(hasard() * 5)]; arbres.push(it); }
  }
  for (let k = 0; k < 420; k++) {
    const x = -1200 + hasard() * 2600, z = -900 + hasard() * 2500;
    if (!placeLibre(x, z, 12)) continue;
    const y = hauteurTerrain(x, z);
    rochers.push({ x, y: y - 0.3, z, s: 0.6 + hasard() * 2.2, sy: 0.6 + hasard() * 0.5, rot: hasard() * 6.3,
                   couleur: new THREE.Color().setHSL(0.08, 0.06, 0.42 + hasard() * 0.18) });
  }
  planterParPaquets(GEO_FEUILLU, arbres, 400, true);
  planterParPaquets(GEO_SAPIN, sapins, 400, true);
  planterParPaquets(GEO_ROCHER, rochers, 600, false);
}
// --- Villages : petites maisons aux toits de couleur
{
  const murs = new THREE.BoxGeometry(8, 5, 6); murs.translate(0, 2.5, 0);
  const toit = new THREE.CylinderGeometry(0.01, 5.2, 3, 4, 1); toit.rotateY(Math.PI / 4); toit.scale(1.08, 1, 0.8); toit.translate(0, 6.5, 0);
  const GEO_MAISON = fusionner([[murs, '#ffffff'], [toit, '#b44a33']]);
  const teintes = ['#f1e6d2', '#e9dcc4', '#f6f1e8', '#dfe6ea', '#f0d9c0'].map(c => new THREE.Color(c));
  const maisons = [];
  for (const [vx, vz] of VILLAGES) {
    for (let k = 0; k < 16; k++) {
      const a = hasard() * Math.PI * 2, d = 10 + hasard() * 52;
      const x = vx + Math.cos(a) * d, z = vz + Math.sin(a) * d;
      if (maisons.some(m => Math.hypot(m.x - x, m.z - z) < 12)) continue;
      maisons.push({ x, z, y: hauteurTerrain(x, z) - 0.4, s: 0.85 + hasard() * 0.5, sy: 1, rot: Math.round(hasard() * 4) * Math.PI / 2 + (hasard() - 0.5) * 0.3,
                     couleur: teintes[Math.floor(hasard() * 5)] });
    }
    // Un clocher au milieu de chaque village
    const y0 = hauteurTerrain(vx, vz);
    const tour = new THREE.Mesh(new THREE.BoxGeometry(4, 16, 4), std('#e9e2d4', 0.8)); tour.position.set(vx, y0 + 8, vz);
    const fleche = new THREE.Mesh(new THREE.ConeGeometry(3.1, 7, 4), std('#5b6470', 0.6)); fleche.position.set(vx, y0 + 19.5, vz); fleche.rotation.y = Math.PI / 4;
    tour.castShadow = fleche.castShadow = true; scene.add(tour, fleche);
  }
  planterParPaquets(GEO_MAISON, maisons, 500, true);
}
// --- Éoliennes sur les collines (les pales tournent)
{
  const matBlanc = std('#f2f4f6', 0.45, 0.1);
  for (const [x, z] of EOLIENNES) {
    const y = hauteurTerrain(x, z);
    const mat = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.6, 48, 12), matBlanc); mat.position.set(x, y + 24, z);
    const nacelle = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.2, 6), matBlanc); nacelle.position.set(x, y + 48.5, z);
    const rotor = new THREE.Group(); rotor.position.set(x, y + 48.5, z + 3.2);
    for (let k = 0; k < 3; k++) {
      const pale = new THREE.Mesh(new THREE.BoxGeometry(1.1, 22, 0.25), matBlanc);
      pale.position.y = 11; const bras = new THREE.Group(); bras.add(pale); bras.rotation.z = k * Math.PI * 2 / 3; rotor.add(bras);
    }
    const vitesse = 0.6 + hasard() * 0.4;
    animations.push(dt => { rotor.rotation.z += dt * vitesse; });
    mat.castShadow = true; scene.add(mat, nacelle, rotor);
  }
}
// --- Panneaux publicitaires le long de la piste
{
  const pubs = [['BITCHA GARAGE', '#141B34', '#FFD23F'], ['ROBOCAM', '#d8262f', '#ffffff'], ['YNOV RACING', '#1d6fe0', '#ffffff'],
                ['TURBO FUEL', '#16171a', '#3ef08a'], ['LUNA PARK →', '#ff5fd2', '#ffffff'], ['FULL GAS', '#ff8a1e', '#141B34']];
  const mats = pubs.map(([texte, fond, encre]) => {
    const t = document.createElement('canvas'); t.width = 512; t.height = 128;
    const c = t.getContext('2d');
    c.fillStyle = fond; c.fillRect(0, 0, 512, 128);
    c.fillStyle = encre; c.font = 'italic 900 64px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(texte, 256, 68);
    return new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(t), roughness: 0.5, side: THREE.DoubleSide });
  });
  const matPied = std('#2b2f36', 0.5, 0.5);
  let n = 0;
  for (let i = 30; i < NB; i += 37) {
    const s = piste[i];
    if (s.type !== 'piste' || s.pont || s.y < -0.5 || Math.abs(s.courbure) > 1 / 90 || dansVille(s.x, s.z)) continue;
    const cote = n % 2 ? 1 : -1, lat = cote * (s.w + 4);
    const x = s.x + s.lx * lat, z = s.z + s.lz * lat, y = solPiste(s, cote * s.w);
    const panneau = new THREE.Mesh(new THREE.PlaneGeometry(9, 2.25), mats[n % mats.length]);
    panneau.position.set(x, y + 3.4, z); panneau.rotation.y = Math.atan2(s.lx, s.lz) + (cote > 0 ? Math.PI : 0);
    scene.add(panneau);
    for (const d of [-3.6, 3.6]) {
      const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 6, 6), matPied);
      pied.position.set(x + s.tx * d, y + 1.2, z + s.tz * d); scene.add(pied);
    }
    n++;
  }
}
function tribune(x, z, longueur, angle) {
  const g = new THREE.Group();
  const couleurs = ['#2f6fdf', '#e8eaee', '#d8262f'];
  for (let k = 0; k < 6; k++) {
    const marche = new THREE.Mesh(new THREE.BoxGeometry(longueur, 1, 2), std(couleurs[k % 3], 0.7));
    marche.position.set(0, 0.5 + k, k * 2); marche.castShadow = marche.receiveShadow = true; g.add(marche);
  }
  const toit = new THREE.Mesh(new THREE.BoxGeometry(longueur + 2, 0.4, 14), std('#d9dce0', 0.5, 0.3));
  toit.position.set(0, 9.5, 5); toit.castShadow = true; g.add(toit);
  g.position.set(x, hauteurTerrain(x, z) - 0.3, z); g.rotation.y = angle; scene.add(g);
}
tribune(-32, 520, 90, -Math.PI / 2);                    // le long de la ligne droite (après le pont)
tribune(708, 580, 110, Math.PI / 2);                    // à l'extérieur du virage relevé
tribune(-222, 560, 70, Math.PI / 2);                    // face au tour du parc d'attractions
// Panneaux de virage (chevrons) sur le mur extérieur des virages serrés
{
  const t = document.createElement('canvas'); t.width = 128; t.height = 64;
  const c = t.getContext('2d');
  c.fillStyle = '#d8262f'; c.fillRect(0, 0, 128, 64);
  c.strokeStyle = '#fff'; c.lineWidth = 10; c.lineJoin = 'miter';
  for (const x of [28, 64, 100]) { c.beginPath(); c.moveTo(x - 12, 12); c.lineTo(x + 8, 32); c.lineTo(x - 12, 52); c.stroke(); }
  const tex = new THREE.CanvasTexture(t);
  const matDroite = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const texG = tex.clone(); texG.needsUpdate = true; texG.wrapS = THREE.RepeatWrapping; texG.repeat.x = -1;
  const matGauche = new THREE.MeshBasicMaterial({ map: texG, side: THREE.DoubleSide });
  for (let i = 0; i < NB; i += 4) {
    const s = piste[i];
    if (s.type !== 'piste' || Math.abs(s.courbure) < 1 / 70) continue;
    const c2 = -Math.sign(s.courbure);                 // côté extérieur du virage
    const lat = c2 * (s.w + 0.3);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), s.courbure > 0 ? matGauche : matDroite);
    p.position.set(s.x + s.lx * lat, solPiste(s, lat) + 1.7, s.z + s.lz * lat);
    p.rotation.y = Math.atan2(s.lx, s.lz);
    scene.add(p);
  }
}
// Arche « RoboCam Circuit » au-dessus de la sortie du tunnel
{
  const s = piste[indiceProche(0, 275)];
  const g = new THREE.Group();
  for (const c of [-1, 1]) {
    const pied = new THREE.Mesh(new THREE.BoxGeometry(0.8, 7, 0.8), std('#1c1f24', 0.4, 0.6));
    pied.position.set(c * (s.w + 1.2), 3.5, 0); pied.castShadow = true; g.add(pied);
  }
  const t = document.createElement('canvas'); t.width = 1024; t.height = 128;
  const c = t.getContext('2d');
  c.fillStyle = '#141B34'; c.fillRect(0, 0, 1024, 128);
  c.fillStyle = '#FFD23F'; c.font = '900 84px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('ROBOCAM CIRCUIT', 512, 68);
  const bandeau = new THREE.Mesh(new THREE.BoxGeometry(2 * s.w + 3.2, 1.6, 0.5),
    [std('#141B34'), std('#141B34'), std('#141B34'), std('#141B34'), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(t), emissive: '#ffffff', emissiveMap: new THREE.CanvasTexture(t), emissiveIntensity: 0.6 }), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(t) })]);
  bandeau.position.y = 7.2; bandeau.castShadow = true; g.add(bandeau);
  g.position.set(s.x, s.y, s.z); g.rotation.y = Math.atan2(s.tx, s.tz) + Math.PI;
  scene.add(g);
}
