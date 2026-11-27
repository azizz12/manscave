// MAN'SCAVE — 19-trip.js
// =====================================================================
// 11. LE NIVEAU -3 : le hangar privé « TRIP » et son circuit néon (2,2 km)
// =====================================================================
// On y descend avec l'ascenseur (bouton -3, protégé par un code). Tout est éclairé par des néons :
// pas de vraies lampes (trop coûteuses), seulement des matériaux lumineux et un reflet « néon » sur les voitures.
const debutTrip = scene.children.length;
const mursTrip = [];                                   // les murs qui arrêtent la caméra au niveau -3
const Y0 = TRIP.y;

// Hauteur du sol au niveau -3 : la piste (rampes, pont, virages relevés) si on est dessus, sinon le sol du hangar
function hauteurTrip(x, z, yActuel) {
  if (circuitActif === CIRCUIT_TRIP) {
    const info = trouverPiste(x, yActuel, z);
    if (info && info.dist < info.w + 0.8 && Math.abs(info.y - yActuel) < 2.5) return info.y;
  }
  return TRIP.y;
}

// --- Le tracé : [x, z, hauteur au-dessus du sol, demi-largeur, relevé en degrés]
// L'indice 0 est la ligne de départ, sur la grande ligne droite (on roule vers -Z).
const POINTS_TRIP = [
  [-20, 168, 0, 8], [-20, 110, 0, 8], [-20, 40, 0, 8], [-20, -20, 0, 8], [-20, -60, 0, 8],          // 1. ligne droite des stands (sous le pont)
  [-30, -90, 0, 8, 10], [-55, -105, 0, 8, 14], [-82, -98, 0, 8, 10], [-95, -75, 0, 7.5],             // 2. épingle nord (relevée)
  [-100, -45, 0, 7], [-125, -30, 0, 7], [-150, -45, 0, 7], [-175, -70, 0, 7],                        // 3. les esses
  [-205, -75, 0, 7, 8], [-228, -55, 0, 7.5, 10], [-235, -20, 0, 7.5],
  [-235, 30, 0, 8], [-238, 90, 0, 8],                                                                // 4. LA CAGE THORACIQUE (zone sombre)
  [-225, 130, 0, 7], [-245, 155, 0, 7], [-232, 180, 0, 7.5], [-235, 230, 0, 8],                      //    puis la chicane
  [-228, 275, 0, 8.5, 12], [-205, 305, 0, 8.5, 16], [-170, 315, 0, 8.5, 16], [-138, 300, 0, 8.5, 12], [-120, 270, 0, 8],   // 5. grand virage relevé
  [-112, 235, 0.5, 7.5], [-108, 195, 2, 7.5], [-100, 150, 4, 7.5], [-88, 112, 6, 7.5], [-66, 84, 7.5, 7.5], [-40, 68, 8.5, 7.5],   // 6. la montée
  [-2, 62, 8.5, 7.5], [25, 58, 7, 7.5],                                                              // 7. le pont au-dessus des stands
  [55, 45, 4.5, 7.5], [85, 22, 2, 7.5], [110, -5, 0.5, 7.5],                                         // 8. la descente
  [130, -40, 0, 7.5], [140, -80, 0, 7.5, 10], [160, -100, 0, 8, 14], [185, -85, 0, 8, 14], [190, -50, 0, 8, 10],   // 9. épingle nord-est
  [182, 0, 0, 7.5], [188, 50, 0, 7.5], [175, 90, 0, 7], [192, 115, 0, 7], [180, 140, 0, 7.5],       // 10. ligne est : tremplin + chicane
  [185, 190, 0, 8], [182, 240, 0, 8],
  [172, 280, 0, 8.5, 12], [145, 305, 0, 8.5, 14], [110, 312, 0, 8],                                  // 11. virage sud-est (relevé)
  [70, 308, 0, 8], [40, 295, 0, 7.5], [20, 275, 0, 7.5], [5, 258, 0, 8], [-12, 232, 0, 8], [-19, 200, 0, 8],   // 12. retour aux stands
].map(([x, z, h, w, r]) => [x, z, Y0 + h, w, r]);
// La ligne droite des stands est ouverte côté parking (pas de mur) : on y entre depuis l'ascenseur
const STANDS = { x: -20, z1: 108, z2: 198 };
const CIRCUIT_TRIP = construireCircuit('trip', POINTS_TRIP, {
  ySol: Y0, plancher: true, typeDe: (x, y, z) => (Math.abs(x - STANDS.x) < 4 && z > STANDS.z1 && z < STANDS.z2 ? 'ville' : 'piste'),
});
const LIGNE_TRIP = 168;
// La zone sombre (la « cage thoracique ») sur la ligne ouest : pas d'arches néon, brume rouge, battements de cœur
const ZONE_SOMBRE = { x1: -258, x2: -212, z1: 10, z2: 118 };
const dansZoneSombre = (x, z) => x > ZONE_SOMBRE.x1 && x < ZONE_SOMBRE.x2 && z > ZONE_SOMBRE.z1 && z < ZONE_SOMBRE.z2;
Object.assign(CIRCUIT_TRIP, {
  nom: 'Circuit TRIP',
  places: [[-23, 174], [-17, 180], [-23, 186], [-17, 192]],     // la grille, derrière la ligne (on part vers -Z)
  yGrille: Y0,
  surGrille: p => p.y < Y_TRIP && Math.abs(p.x - STANDS.x) < 8 && p.z > LIGNE_TRIP + 2 && p.z < LIGNE_TRIP + 30,
  couleursCarte: [[7, 'rgba(20,6,40,.92)'], [3.2, '#ff5fd2'], [1.2, '#ffffff']],
});
equiperCircuit(CIRCUIT_TRIP, {
  sauts: [{ x: 187, z: 58, longueur: 20, hauteur: 1.8 }],
  boosts: [{ x: -235, z: 5 }, { x: -108, z: 200 }, { x: 183, z: 15 }, { x: 95, z: 311 }],
});
// À partir d'ici et jusqu'à la fin du fichier, le circuit actif est le TRIP (rubanTrip(), poseSurPiste()… travaillent sur lui)

// --- Matériaux néon : des couleurs pures qui « brillent » (MeshBasic : aucune lumière à calculer)
const NEON = { rose: '#ff2bd6', cyan: '#19e3ff', violet: '#8a4bff', jaune: '#ffe14a', vert: '#7dff4a' };
const neon = (couleur, opacite = 1) => new THREE.MeshBasicMaterial({ color: couleur, transparent: opacite < 1, opacity: opacite,
  blending: opacite < 1 ? THREE.AdditiveBlending : THREE.NormalBlending, depthWrite: opacite === 1, fog: opacite === 1 });
const matTripRose = neon(NEON.rose), matTripCyan = neon(NEON.cyan), matTripViolet = neon(NEON.violet), matTripJaune = neon(NEON.jaune);
const matSombreTrip = new THREE.MeshStandardMaterial({ color: '#2a2140', emissive: '#170a2c', roughness: 0.55, metalness: 0.3, envMapIntensity: 0.8 });

// Ruban qui suit la piste avec des coordonnées de texture (u = distance le long de la piste, en « répétitions »)
function rubanTrip(materiau, garder, coins, longueurMotif = 24) {
  const pos = [], uv = [];
  for (let i = 0; i < NB; i++) {
    const j = (i + 1) % NB;
    if (!garder(i) || !garder(j)) continue;
    const [a1, b1] = coins(piste[i]), [a2, b2] = coins(piste[j]);
    const u1 = i * PAS_PISTE / longueurMotif, u2 = (i + 1) * PAS_PISTE / longueurMotif;
    pos.push(...a1, ...b1, ...a2, ...b1, ...b2, ...a2);
    uv.push(u1, 0, u1, 1, u2, 0, u1, 1, u2, 1, u2, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  materiau.side = THREE.DoubleSide;
  const m = new THREE.Mesh(geo, materiau);
  scene.add(m);
  return m;
}
// Une boîte du hangar : décor + collision (niveau 'trip') + arrêt de la caméra
function boiteTrip(l, h, p, x, y, z, materiau, collision = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), materiau);
  m.position.set(x, y, z); scene.add(m); mursTrip.push(m);
  if (collision) obstacles.push({ boite: true, niveau: 'trip', minX: x - l / 2, maxX: x + l / 2, minZ: z - p / 2, maxZ: z + p / 2 });
  return m;
}
// Réunit plusieurs formes en une seule (1 seul dessin pour la carte graphique au lieu de dizaines)
function fusionnerFormes(geos) {
  const pos = [], nor = [], idx = [];
  let decalage = 0;
  for (const g of geos) {
    const p = g.attributes.position, n = g.attributes.normal;
    for (let k = 0; k < p.count; k++) { pos.push(p.getX(k), p.getY(k), p.getZ(k)); nor.push(n.getX(k), n.getY(k), n.getZ(k)); }
    if (g.index) for (let k = 0; k < g.index.count; k++) idx.push(g.index.getX(k) + decalage);
    else for (let k = 0; k < p.count; k++) idx.push(k + decalage);
    decalage += p.count;
    g.dispose();
  }
  const r = new THREE.BufferGeometry();
  r.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  r.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  r.setIndex(idx);
  return r;
}

// =====================================================================
// Le hangar : sol à grille lumineuse, murs, plafond à poutres néon
// =====================================================================
{
  const L = TRIP.x2 - TRIP.x1, P = TRIP.z2 - TRIP.z1, H = TRIP.plafond - Y0;
  const cx = (TRIP.x1 + TRIP.x2) / 2, cz = (TRIP.z1 + TRIP.z2) / 2;
  // Le sol : béton sombre et brillant, avec une grille violette (style « synthwave »)
  const t = document.createElement('canvas'); t.width = t.height = 256;
  const c = t.getContext('2d');
  c.fillStyle = '#000'; c.fillRect(0, 0, 256, 256);
  c.strokeStyle = '#7b3cff'; c.lineWidth = 3; c.strokeRect(0, 0, 256, 256);
  c.strokeStyle = 'rgba(123,60,255,.35)'; c.lineWidth = 1; c.beginPath(); c.moveTo(128, 0); c.lineTo(128, 256); c.moveTo(0, 128); c.lineTo(256, 128); c.stroke();
  const tex = new THREE.CanvasTexture(t); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(L / 16, P / 16);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(L, P), new THREE.MeshStandardMaterial({
    color: '#1a1428', roughness: 0.3, metalness: 0.35, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.9, envMapIntensity: 0.7 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set(cx, Y0, cz); scene.add(sol);
  // Les murs : un muret sombre de 3 m (le reste, au-dessus, c'est l'univers : voir 20-trip-decor.js)
  const matMur = new THREE.MeshStandardMaterial({ color: '#1e1830', emissive: '#12081f', roughness: 0.8, metalness: 0.2, envMapIntensity: 0.5 });
  boiteTrip(L + 2, 3, 1, cx, Y0 + 1.5, TRIP.z1 - 0.5, matMur);
  boiteTrip(L + 2, 3, 1, cx, Y0 + 1.5, TRIP.z2 + 0.5, matMur);
  boiteTrip(1, 3, P, TRIP.x1 - 0.5, Y0 + 1.5, cz, matMur);
  boiteTrip(1, 3, P, TRIP.x2 + 0.5, Y0 + 1.5, cz, matMur);
  scene.add(new THREE.Mesh(fusionnerFormes([[L, 0.14, 0.1, cx, TRIP.z1 + 0.05], [L, 0.14, 0.1, cx, TRIP.z2 - 0.05], [0.1, 0.14, P, TRIP.x1 + 0.05, cz], [0.1, 0.14, P, TRIP.x2 - 0.05, cz]]
    .map(([l, h, p, x, z]) => new THREE.BoxGeometry(l, h, p).translate(x, Y0 + 3, z))), matTripCyan));
  // Une plinthe lumineuse tout autour du hangar
  const plinthe = [[L, 0.12, 0.1, cx, TRIP.z1 + 0.1], [L, 0.12, 0.1, cx, TRIP.z2 - 0.1], [0.1, 0.12, P, TRIP.x1 + 0.1, cz], [0.1, 0.12, P, TRIP.x2 - 0.1, cz]]
    .map(([l, h, p, x, z]) => new THREE.BoxGeometry(l, h, p).translate(x, Y0 + 0.5, z));
  scene.add(new THREE.Mesh(fusionnerFormes(plinthe), matTripViolet));
}

// =====================================================================
// La piste : asphalte sombre, lignes néon, vibreurs, murs avec une bande de couleurs qui défile
// =====================================================================
const auSolT = (s, lat, dy) => [s.x + s.lx * lat, solPiste(s, lat) + dy, s.z + s.lz * lat];
const murPiste = i => piste[i].type === 'piste';
{
  const texA = texAsphalte.clone(); texA.needsUpdate = true;
  const m = rubanTrip(new THREE.MeshStandardMaterial({ color: '#a29cbd', map: texA, roughness: 0.45, metalness: 0.15, envMapIntensity: 1 }),
    () => true, s => [auSolT(s, -s.w - 0.3, 0.03), auSolT(s, s.w + 0.3, 0.03)]);
  const pos = m.geometry.attributes.position, uv = [];
  for (let k = 0; k < pos.count; k++) uv.push(pos.getX(k) / 4, pos.getZ(k) / 4);   // le grain se répète tous les 4 m
  m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  m.receiveShadow = true;
  // Bords : cyan à gauche, rose à droite · pointillés violets au centre
  rubanTrip(matTripCyan, () => true, s => [auSolT(s, -(s.w - 0.75), 0.05), auSolT(s, -(s.w - 0.45), 0.05)]);
  rubanTrip(matTripRose, () => true, s => [auSolT(s, s.w - 0.45, 0.05), auSolT(s, s.w - 0.75, 0.05)]);
  rubanTrip(matTripViolet, i => Math.floor(i / 2) % 2 === 0 && !surTremplin(i), s => [auSolT(s, -0.14, 0.05), auSolT(s, 0.14, 0.05)]);
  // Vibreurs dans les virages : rose et blanc
  const tv = document.createElement('canvas'); tv.width = 64; tv.height = 8;
  const cv = tv.getContext('2d'); cv.fillStyle = '#ff2bd6'; cv.fillRect(0, 0, 32, 8); cv.fillStyle = '#f2ecff'; cv.fillRect(32, 0, 32, 8);
  const texV = new THREE.CanvasTexture(tv); texV.wrapS = THREE.RepeatWrapping;
  const virageT = i => Math.abs(piste[i].courbure) > 1 / 120;
  for (const c of [-1, 1]) rubanTrip(new THREE.MeshBasicMaterial({ map: texV }), virageT,
    s => [auSolT(s, c * (s.w - 0.4), 0.06), auSolT(s, c * (s.w + 0.25), 0.06)], 8);
}
// Les murs : sombres, posés sur le sol (sur le pont, ils cachent l'épaisseur du tablier) ; en haut, une bande arc-en-ciel animée
const texArcEnCiel = (() => {
  const t = document.createElement('canvas'); t.width = 256; t.height = 4;
  const c = t.getContext('2d');
  const g = c.createLinearGradient(0, 0, 256, 0);
  ['#ff2bd6', '#8a4bff', '#19e3ff', '#7dff4a', '#ffe14a', '#ff2bd6'].forEach((col, k, l) => g.addColorStop(k / (l.length - 1), col));
  c.fillStyle = g; c.fillRect(0, 0, 256, 4);
  const tex = new THREE.CanvasTexture(t); tex.wrapS = THREE.RepeatWrapping; return tex;
})();
const matBandeMur = new THREE.MeshBasicMaterial({ map: texArcEnCiel });
for (const c of [-1, 1]) {
  const lat = s => c * (s.w + 0.35);
  const bas = s => (s.pont ? solPiste(s, lat(s)) - 0.9 : Y0);
  const haut = s => solPiste(s, lat(s)) + 0.85;
  mursTrip.push(rubanTrip(matSombreTrip, murPiste, s => [[s.x + s.lx * lat(s), bas(s), s.z + s.lz * lat(s)], [s.x + s.lx * lat(s), haut(s), s.z + s.lz * lat(s)]]));
  const lat2 = s => lat(s) * 1.002;
  rubanTrip(matBandeMur, murPiste, s => [[s.x + s.lx * lat2(s), haut(s), s.z + s.lz * lat2(s)], [s.x + s.lx * lat2(s), haut(s) + 0.22, s.z + s.lz * lat2(s)]], 60);
  // Sur les rampes, des lignes lumineuses tous les 1,5 m de hauteur, côté extérieur
  const lat3 = s => c * (s.w + 0.42);
  for (let h = 1.5; h < 9; h += 1.5) {
    const garder = i => murPiste(i) && !piste[i].pont && solPiste(piste[i], lat(piste[i])) - Y0 > h + 0.6;
    rubanTrip(c > 0 ? matTripViolet : matTripCyan, garder, s => [[s.x + s.lx * lat3(s), Y0 + h, s.z + s.lz * lat3(s)], [s.x + s.lx * lat3(s), Y0 + h + 0.12, s.z + s.lz * lat3(s)]]);
  }
}
animations.push(dt => { texArcEnCiel.offset.x -= dt * 0.35; });

// Le dessous du pont et ses piliers (pas de pilier au milieu de la route qui passe dessous)
rubanTrip(matSombreTrip, i => piste[i].pont, s => [auSolT(s, s.w + 0.35, -0.9), auSolT(s, -s.w - 0.35, -0.9)]);
{
  const routeDessous = (x, z, yHaut) => {
    const cx = Math.floor(x / CASE), cz = Math.floor(z / CASE);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++)
      for (const j of grillePiste.get((cx + a) + ',' + (cz + b)) || []) {
        const t = piste[j];
        if (t.y < yHaut - 4 && Math.hypot(t.x - x, t.z - z) < t.w + 2.5) return true;
      }
    return false;
  };
  const piliers = [], anneaux = [];
  for (let i = 0; i < NB; i += 4) {
    const s = piste[i];
    if (s.type !== 'piste' || s.y < Y0 + 2.5) continue;
    for (const c of [-1, 1]) {
      const x = s.x + s.lx * c * (s.w - 1.2), z = s.z + s.lz * c * (s.w - 1.2);
      if (routeDessous(x, z, s.y)) continue;
      const h = s.y - 0.9 - Y0;
      piliers.push(new THREE.BoxGeometry(1.3, h, 1.3).translate(x, Y0 + h / 2, z));
      anneaux.push(new THREE.BoxGeometry(1.45, 0.14, 1.45).translate(x, Y0 + h * 0.5, z));
    }
  }
  if (piliers.length) { const p = new THREE.Mesh(fusionnerFormes(piliers), matSombreTrip); scene.add(p); mursTrip.push(p); }
  if (anneaux.length) scene.add(new THREE.Mesh(fusionnerFormes(anneaux), matTripCyan));
}
// Les tremplins et les accélérateurs (même style que là-haut)
for (const saut of SAUTS) {
  rubanTrip(new THREE.MeshBasicMaterial({ color: NEON.jaune }), i => { const k = (i - saut.i0 + NB) % NB; return k < saut.n && k % 2 === 0; },
    s => [auSolT(s, -s.w + 0.6, 0.07), auSolT(s, s.w - 0.6, 0.07)]);
  const s = piste[(saut.i0 + saut.n) % NB];
  const a = auSolT(s, -s.w - 0.3, 0.03), b = auSolT(s, s.w + 0.3, 0.03);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, a[0], s.y, a[2], ...b, b[0], s.y, b[2], a[0], s.y, a[2]], 3));
  g.computeVertexNormals();
  scene.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: '#2a1840', side: THREE.DoubleSide })));
}
for (const b of BOOSTS) {
  const m = rubanTrip(matBoost, i => { const k = (i - b.i + NB) % NB; return k <= 3; }, s => [auSolT(s, -s.w * 0.55, 0.075), auSolT(s, s.w * 0.55, 0.075)]);
  const pos = m.geometry.attributes.position, uv = [];
  for (let k = 0; k < pos.count; k++) {
    const dx = pos.getX(k) - piste[b.i].x, dz = pos.getZ(k) - piste[b.i].z;
    uv.push((dx * piste[b.i].lx + dz * piste[b.i].lz) / 8 + 0.5, (dx * piste[b.i].tx + dz * piste[b.i].tz) / 6);
  }
  m.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
}

// --- La ligne de départ, la grille et le muret qui sépare la ligne droite du reste du hangar
{
  const t = document.createElement('canvas'); t.width = 256; t.height = 32;
  const c = t.getContext('2d');
  for (let i = 0; i < 16; i++) for (let j = 0; j < 2; j++) { c.fillStyle = (i + j) % 2 ? '#120a20' : '#ffffff'; c.fillRect(i * 16, j * 16, 16, 16); }
  marquage(16, 2, STANDS.x, Y0 + 0.07, LIGNE_TRIP, new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(t) }));
  for (const [x, z] of CIRCUIT_TRIP.places) {
    marquage(3, 0.2, x, Y0 + 0.07, z, matTripJaune);
    marquage(0.2, 1.6, x - 1.4, Y0 + 0.07, z + 0.7, matTripJaune);
    marquage(0.2, 1.6, x + 1.4, Y0 + 0.07, z + 0.7, matTripJaune);
  }
  // Muret ouest de la ligne droite (le côté est reste ouvert : c'est l'entrée des stands)
  boiteTrip(0.6, 1.1, STANDS.z2 - STANDS.z1, STANDS.x - 8.7, Y0 + 0.55, (STANDS.z1 + STANDS.z2) / 2, matSombreTrip);
  boiteTrip(0.62, 0.16, STANDS.z2 - STANDS.z1, STANDS.x - 8.7, Y0 + 1.15, (STANDS.z1 + STANDS.z2) / 2, matBandeMur, false);
}
const FEUX_TRIP = creerFeux({ x: STANDS.x, y: Y0, z: LIGNE_TRIP - 1.5, rotY: Math.PI, niveau: 'trip', murs: mursTrip,
  matCadre: new THREE.MeshStandardMaterial({ color: '#1a1228', emissive: NEON.violet, emissiveIntensity: 0.35, roughness: 0.4, metalness: 0.5 }) });

// =====================================================================
// Les arches néon au-dessus de la piste (plus serrées par endroits : effet tunnel)
// =====================================================================
{
  const RAYON = 9.5;                                    // les arches sont redimensionnées à la largeur de la piste
  const geo = new THREE.TorusGeometry(RAYON, 0.16, 6, 28, Math.PI);
  const TUNNELS = [[170, 200, -20, 30], [60, 140, 296, 320], [-240, -220, 175, 235]];   // [x1, x2, z1, z2]
  const dansTunnel = s => TUNNELS.some(([x1, x2, z1, z2]) => s.x > x1 && s.x < x2 && s.z > z1 && s.z < z2);
  const pontAuDessus = s => piste.some(t => t.pont && t.y > s.y + 4 && Math.hypot(t.x - s.x, t.z - s.z) < 26);
  const prochesPortiques = s => Math.hypot(s.x - STANDS.x, s.z - LIGNE_TRIP) < 14 || Math.hypot(s.x + 15, s.z - 207) < 14;
  const choisis = [];
  for (let i = 0, dernier = -99; i < NB; i++) {
    const s = piste[i], ecart = dansTunnel(s) ? 2 : 11;
    if (i - dernier < ecart || s.type !== 'piste' || s.y > Y0 + 2 || pontAuDessus(s) || prochesPortiques(s) || dansZoneSombre(s.x, s.z)) continue;
    choisis.push(i); dernier = i;
  }
  const couleurs = [NEON.rose, NEON.cyan, NEON.violet];
  const groupes = couleurs.map(c => new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: c }), Math.ceil(choisis.length / 3)));
  const compte = [0, 0, 0], mat = new THREE.Matrix4(), X = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3();
  choisis.forEach((i, n) => {
    const s = piste[i], k = n % 3, e = (s.w + 1.1) / RAYON;
    X.set(s.lx, 0, s.lz); Z.set(-s.tx, 0, -s.tz);
    mat.makeBasis(X, Y, Z).scale(new THREE.Vector3(e, e, 1)).setPosition(s.x, s.y, s.z);
    groupes[k].setMatrixAt(compte[k]++, mat);
  });
  groupes.forEach((g, k) => { g.count = compte[k]; g.instanceMatrix.needsUpdate = true; g.frustumCulled = false; scene.add(g); });
  // Sous chaque arche, la lumière « tombe » sur la piste : une tache colorée (transparente, sans calcul de lumière)
  const tt = document.createElement('canvas'); tt.width = tt.height = 64;
  const ct = tt.getContext('2d'), rg = ct.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, 'rgba(255,255,255,.9)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); ct.fillStyle = rg; ct.fillRect(0, 0, 64, 64);
  const texHalo = new THREE.CanvasTexture(tt);
  const geoHalo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const halos = groupes.map(g => new THREE.InstancedMesh(geoHalo, new THREE.MeshBasicMaterial({ map: texHalo, color: g.material.color, transparent: true,
    opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false }), g.count));
  const compte2 = [0, 0, 0];
  choisis.forEach((i, n) => {
    const s = piste[i], k = n % 3, e = (s.w + 4) * 2;
    if (Math.abs(s.releve) > 0.01) return;             // (pas sur un virage relevé : la tache plate traverserait la piste penchée)
    mat.makeRotationY(Math.atan2(s.tx, s.tz)).scale(new THREE.Vector3(e, 1, 9)).setPosition(s.x, solPiste(s, 0) + 0.09, s.z);
    halos[k].setMatrixAt(compte2[k]++, mat);
  });
  halos.forEach((h, k) => { h.count = compte2[k]; h.instanceMatrix.needsUpdate = true; h.frustumCulled = false; h.renderOrder = 1; scene.add(h); });
  // Les couleurs des arches tournent doucement (l'effet « TRIP »)
  const hsl = couleurs.map(c => { const o = {}; new THREE.Color(c).getHSL(o); return o; });
  animations.push(() => {
    if (zoneVisible.slice(0, 4) !== 'trip') return;
    const t = performance.now() / 1000;
    groupes.forEach((g, k) => g.material.color.setHSL((hsl[k].h + t * 0.05) % 1, 1, 0.55 + 0.08 * Math.sin(t * 3 + k * 2)));
  });
}

// =====================================================================
// Les formes 3D lumineuses qui flottent dans le hangar
// =====================================================================
const formesTrip = [];
{
  const modeles = [
    () => new THREE.IcosahedronGeometry(3.2, 0), () => new THREE.OctahedronGeometry(3.4, 0), () => new THREE.TorusGeometry(3, 0.9, 8, 18),
    () => new THREE.TetrahedronGeometry(3.6, 0), () => new THREE.TorusKnotGeometry(2.2, 0.55, 64, 8), () => new THREE.DodecahedronGeometry(3, 0),
  ];
  const places = [[-160, 60, 13], [-150, 230, 12], [-60, -40, 13], [-170, -10, 12], [120, 60, 13], [100, 200, 12], [140, -60, 14],
                  [-60, 250, 13], [40, -60, 12], [150, 130, 14], [-190, 150, 12], [60, 120, 14]];
  const couleurs = Object.values(NEON);
  places.forEach(([x, z, h], k) => {
    const geo = modeles[k % modeles.length]();
    const couleur = couleurs[k % couleurs.length];
    const g = new THREE.Group();
    g.add(new THREE.Mesh(geo, neon(couleur, 0.18)));
    g.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo, 20), new THREE.LineBasicMaterial({ color: couleur })));
    g.position.set(x, Y0 + h, z); g.rotation.set(k, k * 2, 0);
    scene.add(g);
    formesTrip.push({ g, y: Y0 + h, v: 0.2 + (k % 4) * 0.08, phase: k });
  });
  animations.push(dt => {
    if (zoneVisible.slice(0, 4) !== 'trip') return;
    const t = performance.now() / 1000;
    for (const f of formesTrip) {
      f.g.rotation.y += dt * f.v; f.g.rotation.x += dt * f.v * 0.6;
      f.g.position.y = f.y + Math.sin(t * 0.7 + f.phase) * 0.8;
    }
  });
}

// =====================================================================
// Les enseignes « TRIP » en tubes néon (en vraie 3D)
// =====================================================================
// Les traits de chaque lettre (hauteur 1) ; chaque trait est une liste de points [x, y]
const LETTRES = (() => {
  const boucle = (x0) => {                              // la boucle du R et du P
    const pts = [[x0, 1], [x0 + 0.36, 1]];
    for (let k = 1; k < 12; k++) { const a = Math.PI / 2 - Math.PI * k / 12; pts.push([x0 + 0.36 + Math.cos(a) * 0.25, 0.75 + Math.sin(a) * 0.25]); }
    pts.push([x0 + 0.36, 0.5], [x0, 0.5]);
    return pts;
  };
  return [
    { largeur: 0.66, traits: [[[0, 1], [0.66, 1]], [[0.33, 1], [0.33, 0]]] },                                    // T
    { largeur: 0.62, traits: [[[0, 0], [0, 1]], boucle(0), [[0.26, 0.5], [0.62, 0]]] },                           // R
    { largeur: 0, traits: [[[0, 0], [0, 1]]] },                                                                   // I
    { largeur: 0.62, traits: [[[0, 0], [0, 1]], boucle(0)] },                                                     // P
  ];
})();
const ESPACE_LETTRES = 0.3;
const largeurMot = LETTRES.reduce((s, l) => s + l.largeur, 0) + ESPACE_LETTRES * (LETTRES.length - 1);
// Fabrique le mot « TRIP » : un tube clair (le cœur du néon) + un tube plus gros et transparent (le halo)
function enseigneTrip(hauteur, couleurHalo, couleurCoeur = '#ffe6fb') {
  const coeur = [], halo = [];
  let x = -largeurMot / 2;
  for (const l of LETTRES) {
    for (const trait of l.traits) {
      const pts = trait.map(([px, py]) => new THREE.Vector3((x + px) * hauteur, (py - 0.5) * hauteur, 0));
      const courbe = pts.length === 2 ? new THREE.LineCurve3(pts[0], pts[1]) : new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.1);
      const n = pts.length === 2 ? 2 : 40;
      coeur.push(new THREE.TubeGeometry(courbe, n, hauteur * 0.035, 8, false));
      halo.push(new THREE.TubeGeometry(courbe, n, hauteur * 0.085, 8, false));
      for (const p of [pts[0], pts[pts.length - 1]]) {   // des bouts arrondis
        coeur.push(new THREE.SphereGeometry(hauteur * 0.035, 8, 6).translate(p.x, p.y, p.z));
        halo.push(new THREE.SphereGeometry(hauteur * 0.085, 8, 6).translate(p.x, p.y, p.z));
      }
    }
    x += l.largeur + ESPACE_LETTRES;
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(fusionnerFormes(coeur), new THREE.MeshBasicMaterial({ color: couleurCoeur, fog: false })));
  g.add(new THREE.Mesh(fusionnerFormes(halo), neon(couleurHalo, 0.32)));
  return g;
}
// 1. Le grand portique juste avant la grille de départ (on le voit en sortant du dernier virage)
{
  const s = piste[indiceProche(-15, 207)];
  const g = new THREE.Group();
  const H = 4.6, bas = 5.6, demi = s.w + 2;
  const largeur = largeurMot * H + 3;
  for (const c of [-1, 1]) {
    const poteau = new THREE.Mesh(new THREE.BoxGeometry(0.7, bas + H + 1.6, 0.7), matSombreTrip); poteau.position.set(c * demi, (bas + H + 1.6) / 2, 0); g.add(poteau);
    const filet = new THREE.Mesh(new THREE.BoxGeometry(0.12, bas + H + 1.6, 0.74), matTripCyan); filet.position.set(c * (demi - 0.3), (bas + H + 1.6) / 2, 0); g.add(filet);
  }
  const panneau = new THREE.Mesh(new THREE.BoxGeometry(Math.max(largeur, 2 * demi + 0.7), H + 1.6, 0.4), new THREE.MeshStandardMaterial({ color: '#0b0814', roughness: 0.5, metalness: 0.4 }));
  panneau.position.set(0, bas + (H + 1.6) / 2, -0.3); g.add(panneau);
  const cadre = new THREE.Mesh(new THREE.BoxGeometry(Math.max(largeur, 2 * demi + 0.7) + 0.2, H + 1.8, 0.3), matTripRose); cadre.position.set(0, bas + (H + 1.6) / 2, -0.4); g.add(cadre);
  const mot = enseigneTrip(H, NEON.rose); mot.position.set(0, bas + (H + 1.6) / 2, 0.15); g.add(mot);
  const mot2 = enseigneTrip(H * 0.8, NEON.cyan); mot2.position.set(0, bas + (H + 1.6) / 2, -0.75); mot2.rotation.y = Math.PI; g.add(mot2);   // lisible de l'autre côté aussi
  g.position.set(s.x, s.y, s.z); g.rotation.y = Math.atan2(-s.lz, s.lx);
  scene.add(g); mursTrip.push(panneau);
  for (const c of [-1, 1]) obstacles.push({ x: s.x + s.lx * c * demi, z: s.z + s.lz * c * demi, rayon: 0.5, niveau: 'trip' });
}
// 2. L'immense enseigne sur le mur du fond : on la voit pendant toute la ligne droite
{
  const mot = enseigneTrip(14, NEON.violet, '#f4e8ff');
  mot.position.set(STANDS.x, Y0 + 10, TRIP.z1 + 1.6); scene.add(mot);
  const sous = enseigneTrip(2.4, NEON.cyan);           // un petit « TRIP » cyan en dessous
  sous.position.set(STANDS.x, Y0 + 1.6, TRIP.z1 + 1.2); scene.add(sous);
}

// =====================================================================
// Le parking TRIP (autour de l'ascenseur), sa console et ses voitures « édition TRIP »
// =====================================================================
const PARKING_TRIP = { x1: -9, x2: 45, z1: 108, z2: 198 };
{
  const { x1, x2, z1, z2 } = PARKING_TRIP;
  // Clôtures basses (nord, sud, est) : le côté ouest est ouvert sur la ligne droite
  boiteTrip(x2 - x1, 1.0, 0.5, (x1 + x2) / 2, Y0 + 0.5, z1, matSombreTrip);
  boiteTrip(x2 - x1, 1.0, 0.5, (x1 + x2) / 2, Y0 + 0.5, z2, matSombreTrip);
  boiteTrip(0.5, 1.0, z2 - z1, x2, Y0 + 0.5, (z1 + z2) / 2, matSombreTrip);
  scene.add(new THREE.Mesh(fusionnerFormes([
    new THREE.BoxGeometry(x2 - x1, 0.12, 0.52).translate((x1 + x2) / 2, Y0 + 1.04, z1),
    new THREE.BoxGeometry(x2 - x1, 0.12, 0.52).translate((x1 + x2) / 2, Y0 + 1.04, z2),
    new THREE.BoxGeometry(0.52, 0.12, z2 - z1).translate(x2, Y0 + 1.04, (z1 + z2) / 2),
  ]), matTripCyan));
  // Le sol du parking, un peu plus clair, et une allée lumineuse de l'ascenseur à la piste
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), new THREE.MeshStandardMaterial({ color: '#1a1526', roughness: 0.45, metalness: 0.3, envMapIntensity: 0.5 }));
  sol.rotation.x = -Math.PI / 2; sol.position.set((x1 + x2) / 2, Y0 + 0.015, (z1 + z2) / 2); scene.add(sol);
  const fleches = [];
  for (let x = 12; x > -6; x -= 3) fleches.push(new THREE.PlaneGeometry(1.6, 0.3).rotateX(-Math.PI / 2).translate(x, Y0 + 0.03, 135));
  scene.add(new THREE.Mesh(fusionnerFormes(fleches), matTripJaune));
}
// Le puits de l'ascenseur au niveau -3 (murs du -3 jusqu'au sol du garage) et son cadre lumineux
{
  const l = ASC.x2 - ASC.x1, h = GARAGE.y - Y0, yc = Y0 + h / 2, xc = (ASC.x1 + ASC.x2) / 2;
  const matPuitsT = new THREE.MeshStandardMaterial({ color: '#1c1826', roughness: 0.8, metalness: 0.2 });
  for (const z of [ASC.z1 - 0.3, ASC.z2 + 0.3]) boiteTrip(l + 0.6, h, 0.6, xc, yc, z, matPuitsT);
  boiteTrip(0.6, h, ASC.z2 - ASC.z1 + 1.2, ASC.x2 + 0.3, yc, (ASC.z1 + ASC.z2) / 2, matPuitsT);
  boiteTrip(0.7, h - 5.5, ASC.z2 - ASC.z1 + 1.2, ASC.x1 - 0.35, Y0 + 5.5 + (h - 5.5) / 2, (ASC.z1 + ASC.z2) / 2, matPuitsT, false);   // linteau
  scene.add(new THREE.Mesh(fusionnerFormes([
    new THREE.BoxGeometry(0.16, 5.5, 0.16).translate(ASC.x1 - 0.1, Y0 + 2.75, ASC.z1 - 0.05),
    new THREE.BoxGeometry(0.16, 5.5, 0.16).translate(ASC.x1 - 0.1, Y0 + 2.75, ASC.z2 + 0.05),
    new THREE.BoxGeometry(0.16, 0.16, ASC.z2 - ASC.z1 + 0.3).translate(ASC.x1 - 0.1, Y0 + 5.5, (ASC.z1 + ASC.z2) / 2),
  ]), matTripRose));
  const panneau = creerPanneau('Niveau -3 · TRIP', 'Ascenseur ↑ touches 1 · 2');
  panneau.position.set(ASC.x1 - 1, Y0 + 6.6, (ASC.z1 + ASC.z2) / 2); scene.add(panneau);
}
const CONSOLE_TRIP = creerConsole({ x: -5, y: Y0, z: 128, couleurLiseret: NEON.rose, niveau: 'trip' });
Object.assign(CIRCUIT_TRIP, { feux: FEUX_TRIP, console: CONSOLE_TRIP });
// Les emplacements (cadre néon au sol) et les voitures exposées
const VOITURES_TRIP = [['toro', NEON.rose, 114], ['kaiser', NEON.cyan, 121], ['furia', '#b6ff00', 149], ['volt', NEON.violet, 156]];
for (const [nom, couleur, z] of VOITURES_TRIP) {
  const x = 6;
  const d = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.04, 4.6), new THREE.MeshStandardMaterial({ color: '#0c0914', roughness: 0.3, metalness: 0.5 }));
  d.position.set(x, Y0 + 0.03, z); scene.add(d);
  scene.add(new THREE.Mesh(fusionnerFormes([[8.6, 0.08, 0, 2.3], [8.6, 0.08, 0, -2.3], [0.08, 4.6, 4.3, 0]]
    .map(([l, p, dx, dz]) => new THREE.BoxGeometry(l, 0.05, p).translate(x + dx, Y0 + 0.06, z + dz))), neon(couleur)));
  const v = ajouterVoiture(nom, scene, x, Y0, z, Math.PI / 2);   // l'avant tourné vers la piste (-X)
  v.couleurFixe = couleur; v.modele.peinture.color.set(couleur);
  const p = creerPanneau(v.specs.nom, 'Édition TRIP'); p.position.set(x, Y0 + 3.6, z); p.scale.multiplyScalar(0.75);
  scene.add(p); v.panneau = p;
}

// =====================================================================
// Les garde-corps du puits : quand la plateforme n'est pas à un étage, une barrière ferme le trou (on ne peut pas tomber)
// =====================================================================
const gardeCorps = [SOUS_SOL.y, GARAGE.y, Y0].map(y => {
  const niveau = niveauDe(y + 0.5);
  const m = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.0, ASC.z2 - ASC.z1), matRayure);
  m.position.set(ASC.x1 - 0.55, y + 0.5, (ASC.z1 + ASC.z2) / 2); m.visible = false; scene.add(m);
  return { m, y, obstacle: { boite: true, niveau, minX: ASC.x1 - 0.7, maxX: ASC.x1 - 0.4, minZ: ASC.z1, maxZ: ASC.z2 } };
});
function majGardeCorps() {
  for (const g of gardeCorps) {
    const ferme = Math.abs(ASC.y - g.y) > 0.05;
    if (ferme === g.m.visible) continue;
    g.m.visible = ferme;
    const k = obstacles.indexOf(g.obstacle);
    if (ferme && k < 0) obstacles.push(g.obstacle); else if (!ferme && k >= 0) obstacles.splice(k, 1);
  }
}

// --- Les caisses mystère du TRIP, puis on remet le circuit du haut comme circuit actif
CIRCUIT_TRIP.caisses = creerCaisses([0.12, 0.3, 0.46, 0.62, 0.78, 0.9]);
for (const c of CIRCUIT_TRIP.caisses) c.mesh.visible = false;
activerCircuit(CIRCUIT_HAUT);
