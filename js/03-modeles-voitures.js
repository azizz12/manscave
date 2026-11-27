// MAN'SCAVE — 03-modeles-voitures.js
// =====================================================================
// 3a. LES VOITURES : carrosseries sculptées (3 designs originaux)
// =====================================================================
// Une carrosserie est décrite par des SECTIONS (des tranches) de l'avant vers l'arrière :
//   [x, bas, haut, demi-largeur, rondeur, pincement du haut]
// On fait passer une surface lisse par toutes ces tranches (« loft ») : c'est la technique
// des modeleurs 3D. Rondeur grande = section carrée ; petite = section ovale.
// Repère : l'avant de la voiture est vers -X, le haut vers +Y, la largeur sur Z.

function lofter(sections, radial = 32, etapes = 7) {
  const n = sections.length;
  const catmull = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  const val = (k, t, j) => catmull(sections[Math.max(k - 1, 0)][j], sections[k][j], sections[k + 1][j], sections[Math.min(k + 2, n - 1)][j], t);
  const anneaux = [];
  for (let k = 0; k < n - 1; k++) {
    for (let e = 0; e < etapes; e++) {
      const t = e / etapes;
      anneaux.push([0, 1, 2, 3, 4, 5].map(j => val(k, t, j)));
    }
  }
  anneaux.push(sections[n - 1].slice());
  const pos = [], idx = [];
  for (const [x, bas, haut, w, rond, pince] of anneaux) {
    const yc = (bas + haut) / 2, hh = (haut - bas) / 2;
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const c = Math.cos(th), s = Math.sin(th);
      const zz = Math.sign(c) * Math.pow(Math.abs(c), 2 / rond);
      const yy = Math.sign(s) * Math.pow(Math.abs(s), 2 / rond);
      const reduction = yy > 0 ? 1 - pince * yy * yy : 1 - 0.1 * yy * yy;   // haut plus étroit (« tumblehome »)
      pos.push(x, yc + hh * yy, w * zz * reduction);
    }
  }
  const A = anneaux.length;
  for (let a = 0; a < A - 1; a++) {
    for (let j = 0; j < radial; j++) {
      const i0 = a * radial + j, i1 = a * radial + (j + 1) % radial, i2 = (a + 1) * radial + j, i3 = (a + 1) * radial + (j + 1) % radial;
      idx.push(i0, i2, i1, i1, i2, i3);
    }
  }
  // Fermer l'avant et l'arrière
  for (const [a, sens] of [[0, 1], [A - 1, -1]]) {
    const r = anneaux[a];
    const centre = pos.length / 3;
    pos.push(r[0], (r[1] + r[2]) / 2, 0);
    for (let j = 0; j < radial; j++) {
      const i0 = a * radial + j, i1 = a * radial + (j + 1) % radial;
      if (sens > 0) idx.push(centre, i0, i1); else idx.push(centre, i1, i0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// Demi-largeur de la carrosserie à un endroit x (pour placer les détails sur les flancs)
function largeurA(sections, x) {
  for (let k = 0; k < sections.length - 1; k++) {
    const a = sections[k], b = sections[k + 1];
    if (x >= a[0] && x <= b[0]) { const t = (x - a[0]) / (b[0] - a[0]); return a[3] + (b[3] - a[3]) * t; }
  }
  return sections[x < sections[0][0] ? 0 : sections.length - 1][3];
}
function hauteurA(sections, x) {
  for (let k = 0; k < sections.length - 1; k++) {
    const a = sections[k], b = sections[k + 1];
    if (x >= a[0] && x <= b[0]) { const t = (x - a[0]) / (b[0] - a[0]); return a[2] + (b[2] - a[2]) * t; }
  }
  return sections[x < sections[0][0] ? 0 : sections.length - 1][2];
}

const DESIGNS = {
  // Hypercar électrique : très basse, en coin, lisse, barres de lumière, jantes « turbine »
  volt: {
    couleur: '#6a3cff', accent: '#4fd8ff', etrier: '#4fd8ff', oeil: 1.0,
    caisse: [[-2.48, 0.3, 0.44, 0.62, 2.6, 0.2], [-2.36, 0.24, 0.52, 0.84, 3, 0.25], [-2.0, 0.21, 0.6, 0.93, 3.6, 0.3],
             [-1.4, 0.21, 0.69, 0.96, 4, 0.32], [-0.8, 0.21, 0.77, 0.97, 4, 0.34], [-0.2, 0.21, 0.83, 0.96, 4, 0.36],
             [0.5, 0.21, 0.86, 0.98, 4, 0.36], [1.2, 0.22, 0.88, 1.02, 4, 0.34], [1.8, 0.24, 0.9, 1.0, 4, 0.3],
             [2.25, 0.28, 0.9, 0.94, 3.4, 0.25], [2.45, 0.34, 0.86, 0.82, 2.8, 0.2]],
    verriere: [[-1.0, 0.7, 0.74, 0.5, 2.6, 0.3], [-0.6, 0.72, 0.98, 0.6, 2.8, 0.45], [0.0, 0.74, 1.15, 0.62, 2.8, 0.5],
               [0.7, 0.76, 1.14, 0.62, 2.8, 0.5], [1.3, 0.78, 1.04, 0.58, 2.8, 0.45], [1.85, 0.82, 0.88, 0.45, 2.6, 0.35]],
    roues: { avant: -1.5, arriere: 1.52, rayon: 0.41, largeur: 0.36, style: 'turbine' },
  },
  // GT V8 : long capot, habitacle reculé, hanches larges, grand aileron, 4 sorties d'échappement
  furia: {
    couleur: '#c8102e', accent: '#111317', etrier: '#ffcc00', oeil: 1.12,
    caisse: [[-2.52, 0.32, 0.56, 0.66, 2.6, 0.2], [-2.4, 0.28, 0.66, 0.88, 3, 0.25], [-2.0, 0.27, 0.76, 0.95, 3.6, 0.3],
             [-1.3, 0.27, 0.83, 0.97, 4, 0.32], [-0.6, 0.27, 0.89, 0.98, 4, 0.34], [0.2, 0.27, 0.94, 0.97, 4, 0.36],
             [1.0, 0.28, 0.98, 1.05, 4.2, 0.34], [1.7, 0.3, 1.01, 1.06, 4.2, 0.32], [2.25, 0.33, 1.02, 0.98, 3.6, 0.28],
             [2.5, 0.4, 0.98, 0.84, 3, 0.22]],
    verriere: [[-0.6, 0.86, 0.9, 0.56, 2.6, 0.3], [-0.2, 0.88, 1.18, 0.64, 2.8, 0.45], [0.4, 0.9, 1.32, 0.66, 2.8, 0.5],
               [1.1, 0.92, 1.28, 0.64, 2.8, 0.5], [1.8, 0.95, 1.12, 0.58, 2.8, 0.45], [2.3, 0.98, 0.99, 0.42, 2.6, 0.35]],
    roues: { avant: -1.55, arriere: 1.45, rayon: 0.43, largeur: 0.4, style: 'branches5' },
  },
  // Petite sportive turbo : courte, haute, toit plat, hayon presque vertical, becquet de toit
  sprint: {
    couleur: '#f2f4f7', accent: '#1f5fd6', etrier: '#e0262f', oeil: 1.24,
    caisse: [[-2.08, 0.32, 0.62, 0.7, 2.6, 0.2], [-1.96, 0.28, 0.72, 0.86, 3, 0.22], [-1.6, 0.27, 0.8, 0.9, 3.6, 0.26],
             [-1.0, 0.27, 0.87, 0.91, 4, 0.28], [-0.3, 0.27, 0.92, 0.92, 4, 0.3], [0.6, 0.27, 0.94, 0.92, 4, 0.3],
             [1.5, 0.29, 0.96, 0.93, 4, 0.3], [1.95, 0.32, 0.95, 0.88, 3.4, 0.26], [2.08, 0.38, 0.92, 0.78, 2.8, 0.2]],
    verriere: [[-0.95, 0.86, 0.9, 0.6, 2.6, 0.3], [-0.5, 0.88, 1.24, 0.72, 3.2, 0.4], [0.1, 0.9, 1.42, 0.75, 3.4, 0.42],
               [1.3, 0.92, 1.44, 0.76, 3.4, 0.42], [1.82, 0.94, 1.4, 0.72, 3.2, 0.4], [1.98, 0.95, 1.02, 0.66, 3, 0.35]],
    roues: { avant: -1.3, arriere: 1.3, rayon: 0.36, largeur: 0.3, style: 'branches6' },
  },
  // Supercar V12 (design original, en coin) : très basse et large, arêtes vives, verrière en flèche
  toro: {
    couleur: '#8fd400', accent: '#111317', etrier: '#ffcc00', oeil: 1.0,
    caisse: [[-2.45, 0.28, 0.48, 0.74, 7, 0.08], [-2.32, 0.22, 0.58, 0.92, 7, 0.1], [-1.8, 0.2, 0.68, 0.98, 7, 0.14],
             [-1.1, 0.2, 0.75, 1.0, 7, 0.16], [-0.4, 0.2, 0.8, 1.0, 7, 0.18], [0.4, 0.2, 0.85, 1.03, 7, 0.18],
             [1.2, 0.22, 0.89, 1.07, 7, 0.16], [1.9, 0.25, 0.89, 1.05, 7, 0.14], [2.3, 0.3, 0.86, 0.98, 6.5, 0.1],
             [2.42, 0.36, 0.8, 0.9, 6, 0.08]],
    verriere: [[-1.05, 0.72, 0.75, 0.52, 6, 0.3], [-0.6, 0.74, 0.95, 0.6, 6, 0.42], [0.0, 0.76, 1.09, 0.62, 6, 0.5],
               [0.6, 0.78, 1.09, 0.62, 6, 0.5], [1.2, 0.8, 1.0, 0.6, 6, 0.45], [1.9, 0.83, 0.88, 0.5, 6, 0.35]],
    roues: { avant: -1.48, arriere: 1.5, rayon: 0.38, largeur: 0.4, style: 'branches5' },
  },
  // Berline sportive des années 80 (design original) : carrée, ailes élargies, petit aileron, 4 phares ronds
  kaiser: {
    couleur: '#eceae4', accent: '#111317', etrier: '#9aa0a8', oeil: 1.2,
    caisse: [[-2.18, 0.32, 0.72, 0.78, 5, 0.1], [-2.08, 0.27, 0.8, 0.84, 6, 0.12], [-1.6, 0.26, 0.82, 0.87, 6, 0.12],
             [-1.0, 0.26, 0.84, 0.85, 6, 0.12], [-0.3, 0.26, 0.86, 0.84, 6, 0.12], [0.5, 0.26, 0.87, 0.84, 6, 0.12],
             [1.15, 0.26, 0.88, 0.87, 6, 0.12], [1.75, 0.27, 0.9, 0.87, 6, 0.12], [2.1, 0.31, 0.9, 0.82, 5, 0.1],
             [2.18, 0.37, 0.86, 0.78, 4.5, 0.08]],
    verriere: [[-0.95, 0.86, 0.88, 0.7, 5, 0.2], [-0.45, 0.88, 1.28, 0.74, 5.5, 0.3], [0.2, 0.89, 1.36, 0.74, 5.5, 0.32],
               [0.9, 0.9, 1.36, 0.74, 5.5, 0.32], [1.35, 0.9, 1.27, 0.73, 5.5, 0.3], [1.62, 0.9, 0.92, 0.68, 5, 0.2]],
    roues: { avant: -1.3, arriere: 1.27, rayon: 0.34, largeur: 0.27, style: 'branches6' },
  },
};

// Matériaux partagés (créés une seule fois)
const MAT_VOITURE = {
  noir: std('#101216', 0.55, 0.2),
  carbone: std('#1b1d22', 0.3, 0.6),
  chrome: std('#e2e6ec', 0.12, 1),
  metalFrein: std('#8a8f97', 0.35, 0.9),
  pneu: std('#141518', 0.88),
  interieur: std('#22252c', 0.8),
  vitre: new THREE.MeshPhysicalMaterial({ color: '#0c1420', roughness: 0.03, metalness: 0.35, clearcoat: 1, transparent: true, opacity: 0.86, depthWrite: false }),
  phare: new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#eaf4ff', emissiveIntensity: 2.4 }),
  feu: new THREE.MeshStandardMaterial({ color: '#ff2a3a', emissive: '#ff1030', emissiveIntensity: 2.4 }),
  orange: new THREE.MeshStandardMaterial({ color: '#ff9a2e', emissive: '#ff8a10', emissiveIntensity: 1.6 }),
};

// Un pneu arrondi (profil tourné autour de l'axe), une jante détaillée, un disque et un étrier
function creerRoue(r, largeur, style, couleurEtrier, accent, cote) {
  const roue = new THREE.Group();
  const tourne = new THREE.Group();
  const hw = largeur / 2, ri = r * 0.66;
  const profil = [[ri, -hw], [r - 0.05, -hw], [r - 0.012, -hw * 0.82], [r, -hw * 0.45], [r, hw * 0.45], [r - 0.012, hw * 0.82], [r - 0.05, hw], [ri, hw]]
    .map(([a, b]) => new THREE.Vector2(a, b));
  const pneu = new THREE.Mesh(new THREE.LatheGeometry(profil, 40), MAT_VOITURE.pneu);
  pneu.rotation.x = Math.PI / 2;
  tourne.add(pneu);
  const face = cote * (hw - 0.02);                     // côté extérieur de la roue
  // Jante : cuvette sombre + rebord chromé + branches
  const cuvette = new THREE.Mesh(new THREE.CylinderGeometry(ri, ri, largeur * 0.9, 32, 1, true), MAT_VOITURE.noir);
  cuvette.rotation.x = Math.PI / 2; tourne.add(cuvette);
  const rebord = new THREE.Mesh(new THREE.TorusGeometry(ri - 0.012, 0.016, 8, 40), MAT_VOITURE.chrome);
  rebord.position.z = face; tourne.add(rebord);
  const moyeu = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.14, r * 0.16, 0.05, 16), style === 'turbine' ? std(accent, 0.3, 0.6) : MAT_VOITURE.chrome);
  moyeu.rotation.x = Math.PI / 2; moyeu.position.z = face; tourne.add(moyeu);
  const matBranche = style === 'turbine' ? std('#2a2e36', 0.25, 0.9) : MAT_VOITURE.chrome;
  const nb = style === 'turbine' ? 10 : style === 'branches5' ? 5 : 6;
  for (let i = 0; i < nb; i++) {
    const a = (i / nb) * Math.PI * 2;
    const largeurB = style === 'turbine' ? 0.1 : 0.065;
    if (style === 'branches5') {                       // branches doubles
      for (const d of [-0.1, 0.1]) {
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.04, ri * 0.82, 0.03), matBranche);
        b.position.set(Math.cos(a + d) * ri * 0.45, Math.sin(a + d) * ri * 0.45, face); b.rotation.z = a + d - Math.PI / 2; tourne.add(b);
      }
    } else {
      const b = new THREE.Mesh(new THREE.BoxGeometry(largeurB, ri * 0.82, 0.03), matBranche);
      b.position.set(Math.cos(a) * ri * 0.45, Math.sin(a) * ri * 0.45, face);
      b.rotation.z = a - Math.PI / 2 + (style === 'turbine' ? 0.35 : 0);   // la turbine est vrillée
      tourne.add(b);
    }
  }
  if (style === 'turbine') {                           // anneau lumineux de l'électrique
    const anneau = new THREE.Mesh(new THREE.TorusGeometry(ri * 0.72, 0.012, 6, 40),
      new THREE.MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 1.5 }));
    anneau.position.z = face + cote * 0.01; tourne.add(anneau);
  }
  roue.add(tourne);
  // Disque de frein et étrier : ne tournent pas avec la roue
  const disque = new THREE.Mesh(new THREE.CylinderGeometry(ri * 0.82, ri * 0.82, 0.03, 32), MAT_VOITURE.metalFrein);
  disque.rotation.x = Math.PI / 2; disque.position.z = cote * (hw * 0.15); roue.add(disque);
  const etrier = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.08), std(couleurEtrier, 0.35, 0.3));
  etrier.position.set(0.12, ri * 0.62, cote * (hw * 0.3)); roue.add(etrier);
  roue.tourne = tourne;
  return roue;
}

// Bande décorative qui suit le dessus de la carrosserie puis le toit (un « loft » très plat)
function bandeSculptee(caisse, verriere, demiLargeur) {
  const xs = [];
  for (let x = caisse[0][0] + 0.12; x <= caisse[caisse.length - 1][0] - 0.06; x += 0.12) xs.push(x);
  const sections = xs.map(x => {
    const dansVerriere = x > verriere[0][0] + 0.15 && x < verriere[verriere.length - 1][0] - 0.1;
    const h = dansVerriere ? Math.max(hauteurA(caisse, x), hauteurA(verriere, x)) : hauteurA(caisse, x);
    return [x, h - 0.03, h + 0.01, demiLargeur, 6, 0];
  });
  return lofter(sections, 16, 2);
}

function creerVoiture(nom, couleur) {
  const d = DESIGNS[nom];
  const voiture = new THREE.Group();
  const peinture = new THREE.MeshPhysicalMaterial({ color: couleur || d.couleur, roughness: 0.2, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.05 });
  const M = MAT_VOITURE;
  const ajouter = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); voiture.add(m); return m;
  };
  const boiteV = (l, h, p, x, y, z, mat, rz = 0) => ajouter(new THREE.BoxGeometry(l, h, p), mat, x, y, z, 0, 0, rz);
  const C = d.caisse, W = x => largeurA(C, x), H = x => hauteurA(C, x);

  // Carrosserie et verrière sculptées
  ajouter(lofter(C, 36, 8), peinture, 0, 0, 0);
  const verriere = ajouter(lofter(d.verriere, 32, 7), M.vitre, 0, 0, 0);
  verriere.renderOrder = 2;
  // Bas de caisse sombre (donne de l'épaisseur visuelle sous les portes)
  ajouter(lofter(C.map(s => [s[0], s[1] - 0.02, s[1] + 0.09, s[3] + 0.012, 4, 0]), 24, 4), M.carbone, 0, 0, 0);

  // Intérieur visible à travers la verrière : sièges, tableau de bord, volant
  const xSiege = (d.verriere[2][0] + d.verriere[3][0]) / 2;
  const yPlancher = d.verriere[0][1] - 0.12;
  const hautDossier = hauteurA(d.verriere, xSiege + 0.3) - 0.1;                // le dossier reste sous le toit
  const hDossier = hautDossier - yPlancher - 0.1;
  for (const z of [-0.33, 0.33]) {
    boiteV(0.5, 0.12, 0.42, xSiege + 0.05, yPlancher + 0.06, z, M.interieur);                   // assise
    boiteV(0.12, hDossier, 0.42, xSiege + 0.3, yPlancher + 0.1 + hDossier / 2, z, M.interieur, -0.2);   // dossier
  }
  boiteV(0.3, 0.16, 1.2, d.verriere[1][0] + 0.12, d.verriere[1][1] + 0.02, 0, M.interieur);    // tableau de bord
  const volant = new THREE.Group();
  const jante = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.022, 8, 24), M.noir);
  const centreVolant = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12), M.carbone);
  centreVolant.rotation.x = Math.PI / 2;
  volant.add(jante, centreVolant);
  volant.position.set(d.verriere[1][0] + 0.38, d.verriere[1][1] + 0.12, 0.33);
  volant.rotation.y = Math.PI / 2; volant.rotation.order = 'YXZ'; volant.rotation.x = -0.35;
  voiture.add(volant);
  voiture.volant = volant;
  voiture.oeil = new THREE.Vector3(xSiege + 0.12, d.oeil, 0.33);   // position des yeux du pilote (vue cockpit)

  // Rétroviseurs (coque arrondie sur un petit bras)
  for (const s of [-1, 1]) {
    const x = d.verriere[1][0] + 0.12, z = s * (d.verriere[1][3] + 0.12);
    boiteV(0.06, 0.025, 0.1, x + 0.02, d.verriere[1][1] + 0.04, s * (d.verriere[1][3] + 0.05), M.carbone);
    const coque = ajouter(new THREE.SphereGeometry(0.065, 16, 12), peinture, x, d.verriere[1][1] + 0.07, z);
    coque.scale.set(1.3, 0.75, 1.0);
  }

  // Roues + ailes au-dessus (les roues dépassent un peu de la caisse, comme sur les vraies sportives)
  const r = d.roues;
  voiture.roues = [];
  for (const x of [r.avant, r.arriere]) {
    for (const s of [-1, 1]) {
      const voie = W(x) - r.largeur / 2 + 0.015;
      const roue = creerRoue(r.rayon, r.largeur, r.style, d.etrier, d.accent, s);
      roue.position.set(x, r.rayon, s * voie);
      roue.avant = x < 0; roue.rayon = r.rayon;
      voiture.add(roue); voiture.roues.push(roue);
      // Passage de roue : un jonc noir en arc sur le flanc + un fond sombre derrière la roue
      const jonc = new THREE.Mesh(new THREE.TorusGeometry(r.rayon + 0.05, 0.028, 8, 32, Math.PI), M.noir);
      jonc.position.set(x, r.rayon, s * (W(x) + 0.004));
      voiture.add(jonc);
      const fond = new THREE.Mesh(new THREE.CircleGeometry(r.rayon + 0.04, 32), M.noir);
      fond.position.set(x, r.rayon, s * (voie - r.largeur / 2 - 0.01)); if (s < 0) fond.rotation.y = Math.PI;
      voiture.add(fond);
    }
  }
  peinture.side = THREE.DoubleSide;

  // ---------- Détails propres à chaque voiture ----------
  const avant = C[0][0], arriere = C[C.length - 1][0];
  if (nom === 'volt') {
    const accent = new THREE.MeshStandardMaterial({ color: d.accent, emissive: d.accent, emissiveIntensity: 1.8 });
    boiteV(0.05, 0.035, 1.36, avant + 0.13, 0.46, 0, M.phare);                       // barre de lumière avant
    for (const s of [-1, 1]) boiteV(0.18, 0.05, 0.24, avant + 0.2, 0.47, s * 0.6, M.phare);   // phares fins
    boiteV(0.05, 0.05, 1.5, arriere - 0.03, 0.78, 0, M.feu);                          // barre de feux arrière
    boiteV(0.5, 0.03, 1.5, avant + 0.25, 0.235, 0, M.carbone);                        // lame avant
    boiteV(0.4, 0.14, 1.5, arriere - 0.15, 0.33, 0, M.carbone);                       // diffuseur
    for (let k = -2; k <= 2; k++) boiteV(0.35, 0.12, 0.02, arriere - 0.12, 0.33, k * 0.28, M.noir);  // ailettes du diffuseur
    for (const s of [-1, 1]) {
      boiteV(0.9, 0.2, 0.03, 0.55, 0.5, s * (W(0.55) - 0.005), M.noir);              // prise d'air latérale
      boiteV(2.2, 0.018, 0.02, 0, 0.27, s * (W(0) + 0.01), accent);                   // liseré lumineux
    }
    const queue = new THREE.Shape(); queue.moveTo(0, 0); queue.lineTo(0.45, 0.02); queue.lineTo(0.5, 0.09); queue.lineTo(0, 0.04); queue.closePath();
    const geoQ = new THREE.ExtrudeGeometry(queue, { depth: 1.6, bevelEnabled: false }); geoQ.translate(0, 0, -0.8);
    ajouter(geoQ, M.carbone, arriere - 0.6, 0.88, 0);                                  // petit becquet intégré
  }
  if (nom === 'furia') {
    voiture.bande = ajouter(bandeSculptee(C, d.verriere, 0.24), M.noir, 0, 0, 0);     // bande noire centrale
    // Phares en amande et calandre
    for (const s of [-1, 1]) {
      const oeil = ajouter(new THREE.SphereGeometry(0.16, 20, 12), M.noir, avant + 0.2, 0.6, s * 0.62); oeil.scale.set(0.5, 0.35, 1.1);
      const led = ajouter(new THREE.SphereGeometry(0.14, 20, 12), M.phare, avant + 0.17, 0.6, s * 0.62); led.scale.set(0.45, 0.22, 0.95);
    }
    boiteV(0.06, 0.18, 0.9, avant + 0.06, 0.42, 0, M.noir);                            // calandre
    for (let k = -3; k <= 3; k++) boiteV(0.065, 0.02, 0.86, avant + 0.055, 0.36 + (k + 3) * 0.022, 0, M.carbone);
    boiteV(0.5, 0.035, 1.75, avant + 0.2, 0.28, 0, M.carbone);                         // lame avant
    // Grand aileron profilé (forme d'aile d'avion) sur 2 pieds, avec dérives
    const profilAile = new THREE.Shape();
    profilAile.moveTo(0, 0); profilAile.quadraticCurveTo(0.12, 0.09, 0.55, 0.03); profilAile.lineTo(0.55, 0.0); profilAile.quadraticCurveTo(0.2, -0.02, 0, 0);
    const geoAile = new THREE.ExtrudeGeometry(profilAile, { depth: 2.05, bevelEnabled: false }); geoAile.translate(0, 0, -1.025);
    ajouter(geoAile, M.carbone, arriere - 0.62, 1.38, 0);
    for (const s of [-1, 1]) {
      boiteV(0.14, 0.36, 0.05, arriere - 0.38, 1.2, s * 0.55, M.carbone);
      boiteV(0.62, 0.22, 0.03, arriere - 0.36, 1.38, s * 1.03, M.carbone);
    }
    // 4 feux ronds + 4 sorties d'échappement (avec le trou noir au milieu)
    for (const z of [-0.7, -0.42, 0.42, 0.7]) {
      const f = ajouter(new THREE.CircleGeometry(0.095, 24), M.feu, arriere + 0.005, 0.8, z, 0, Math.PI / 2, 0);
      const anneauF = ajouter(new THREE.TorusGeometry(0.1, 0.012, 6, 24), M.chrome, arriere + 0.006, 0.8, z, 0, Math.PI / 2, 0);
    }
    for (const z of [-0.6, -0.4, 0.4, 0.6]) {
      ajouter(new THREE.CylinderGeometry(0.065, 0.07, 0.22, 16, 1, true), M.chrome, arriere + 0.02, 0.4, z, 0, 0, Math.PI / 2);
      ajouter(new THREE.CircleGeometry(0.055, 16), M.noir, arriere + 0.1, 0.4, z, 0, Math.PI / 2, 0);
    }
    voiture.echappements = [-0.6, -0.4, 0.4, 0.6].map(z => new THREE.Vector3(arriere + 0.13, 0.4, z));
    boiteV(0.35, 0.14, 1.0, arriere - 0.12, 0.36, 0, M.carbone);                       // diffuseur
    for (const s of [-1, 1]) boiteV(2.0, 0.08, 0.04, 0, 0.32, s * (W(0) + 0.02), M.carbone);   // bas de caisse
  }
  if (nom === 'sprint') {
    const bleu = std(d.accent, 0.3, 0.3);
    voiture.bande = ajouter(bandeSculptee(C, d.verriere, 0.2), bleu, 0, 0, 0);        // bande bleue centrale
    // Becquet de toit profilé
    const profilB = new THREE.Shape(); profilB.moveTo(0, 0); profilB.lineTo(0.38, -0.02); profilB.lineTo(0.42, 0.05); profilB.lineTo(0.02, 0.06); profilB.closePath();
    const geoB = new THREE.ExtrudeGeometry(profilB, { depth: 1.42, bevelEnabled: false }); geoB.translate(0, 0, -0.71);
    ajouter(geoB, M.noir, arriere - 0.42, 1.44, 0);
    boiteV(0.05, 0.22, 1.15, avant + 0.04, 0.48, 0, M.noir);                           // calandre nid d'abeille
    for (let k = -4; k <= 4; k++) boiteV(0.055, 0.2, 0.02, avant + 0.035, 0.48, k * 0.12, M.carbone);
    for (const s of [-1, 1]) {
      boiteV(0.08, 0.12, 0.36, avant + 0.09, 0.66, s * 0.58, M.noir);                  // boîtier de phare
      boiteV(0.04, 0.08, 0.3, avant + 0.06, 0.66, s * 0.58, M.phare);                  // phare
      boiteV(0.04, 0.06, 0.14, avant + 0.05, 0.36, s * 0.62, M.orange);                // antibrouillard
      boiteV(0.05, 0.3, 0.14, arriere + 0.0, 0.72, s * 0.74, M.feu);                   // feux verticaux
      boiteV(1.2, 0.16, 0.025, 0.15, 0.46, s * (W(0.15) + 0.004), M.noir);             // baguette latérale
    }
    for (const z of [-0.13, 0.13]) {                    // double sortie centrale
      ajouter(new THREE.CylinderGeometry(0.07, 0.075, 0.2, 16, 1, true), M.chrome, arriere + 0.03, 0.36, z, 0, 0, Math.PI / 2);
      ajouter(new THREE.CircleGeometry(0.06, 16), M.noir, arriere + 0.12, 0.36, z, 0, Math.PI / 2, 0);
    }
    voiture.echappements = [-0.13, 0.13].map(z => new THREE.Vector3(arriere + 0.14, 0.36, z));
    boiteV(0.3, 0.12, 1.1, arriere - 0.1, 0.36, 0, M.carbone);
  }

  if (nom === 'toro') {
    // Phares en flèche (deux traits lumineux en Y), grandes prises d'air, capot moteur à lames, échappements centraux hexagonaux
    for (const s of [-1, 1]) {
      boiteV(0.04, 0.03, 0.42, avant + 0.32, 0.5, s * 0.66, M.phare, 0); const b2 = boiteV(0.04, 0.03, 0.22, avant + 0.36, 0.46, s * 0.5, M.phare); b2.rotation.x = s * 0.6;
      boiteV(0.3, 0.22, 0.03, -1.9, 0.33, s * (W(-1.9) - 0.03), M.noir);             // prise d'air avant
      const prise = boiteV(1.0, 0.34, 0.04, 0.9, 0.52, s * (W(0.9) - 0.01), M.noir); prise.rotation.x = s * 0.12;   // grande prise latérale
      boiteV(0.05, 0.06, 0.5, arriere - 0.03, 0.74, s * 0.66, M.feu); const f2 = boiteV(0.05, 0.05, 0.3, arriere - 0.04, 0.66, s * 0.5, M.feu); f2.rotation.x = -s * 0.6;
    }
    for (let k = 0; k < 6; k++) boiteV(0.06, 0.02, 1.0, 1.55 + k * 0.13, 0.9, 0, M.noir);   // lames du capot moteur
    boiteV(0.5, 0.03, 1.7, avant + 0.28, 0.22, 0, M.carbone);                          // lame avant
    boiteV(0.45, 0.16, 1.7, arriere - 0.2, 0.36, 0, M.carbone);                        // diffuseur
    for (let k = -3; k <= 3; k++) boiteV(0.42, 0.15, 0.02, arriere - 0.18, 0.36, k * 0.22, M.noir);
    const aile = new THREE.Shape(); aile.moveTo(0, 0); aile.quadraticCurveTo(0.12, 0.07, 0.42, 0.03); aile.lineTo(0.42, 0); aile.quadraticCurveTo(0.2, -0.02, 0, 0);
    const geoA = new THREE.ExtrudeGeometry(aile, { depth: 1.8, bevelEnabled: false }); geoA.translate(0, 0, -0.9);
    ajouter(geoA, M.carbone, arriere - 0.5, 0.95, 0);                                  // aileron arrière
    for (const s of [-1, 1]) boiteV(0.1, 0.1, 0.04, arriere - 0.3, 0.9, s * 0.7, M.carbone);
    for (const z of [-0.11, 0.11]) {                                                    // 2 sorties d'échappement hexagonales, au centre
      ajouter(new THREE.CylinderGeometry(0.075, 0.075, 0.2, 6, 1, true), M.chrome, arriere + 0.02, 0.55, z, 0, 0, Math.PI / 2);
      ajouter(new THREE.CircleGeometry(0.065, 6), M.noir, arriere + 0.11, 0.55, z, 0, Math.PI / 2, 0);
    }
    voiture.echappements = [-0.11, 0.11].map(z => new THREE.Vector3(arriere + 0.13, 0.55, z));
  }
  if (nom === 'kaiser') {
    // Calandre noire avec 4 phares ronds, pare-chocs épais, ailes « carrées », petit aileron de coffre, feux larges
    boiteV(0.04, 0.2, 1.5, avant + 0.02, 0.58, 0, M.noir);                             // calandre
    for (const z of [-0.6, -0.36, 0.36, 0.6]) {
      ajouter(new THREE.CircleGeometry(0.085, 24), M.phare, avant + 0.0, 0.58, z, 0, -Math.PI / 2, 0);
      ajouter(new THREE.TorusGeometry(0.088, 0.012, 6, 24), M.chrome, avant + 0.005, 0.58, z, 0, Math.PI / 2, 0);
    }
    boiteV(0.12, 0.17, 1.72, avant + 0.04, 0.36, 0, M.noir);                           // pare-chocs avant
    boiteV(0.14, 0.17, 1.72, arriere - 0.05, 0.38, 0, M.noir);                         // pare-chocs arrière
    boiteV(0.04, 0.16, 1.5, arriere - 0.0, 0.72, 0, M.feu);                             // feux arrière larges
    boiteV(0.045, 0.05, 0.4, arriere + 0.002, 0.68, 0, M.noir);
    for (const s of [-1, 1]) boiteV(3.2, 0.1, 0.03, 0.05, 0.42, s * (W(0.05) + 0.01), M.noir);   // baguette latérale
    const bec = new THREE.Shape(); bec.moveTo(0, 0); bec.lineTo(0.3, 0); bec.lineTo(0.34, 0.07); bec.lineTo(0.04, 0.06); bec.closePath();
    const geoB = new THREE.ExtrudeGeometry(bec, { depth: 1.4, bevelEnabled: false }); geoB.translate(0, 0, -0.7);
    ajouter(geoB, M.noir, arriere - 0.42, 0.9, 0);                                     // aileron de coffre
    for (const z of [-0.5, -0.38]) {                                                    // double sortie à gauche
      ajouter(new THREE.CylinderGeometry(0.04, 0.045, 0.18, 14, 1, true), M.chrome, arriere + 0.02, 0.3, z, 0, 0, Math.PI / 2);
      ajouter(new THREE.CircleGeometry(0.035, 14), M.noir, arriere + 0.1, 0.3, z, 0, Math.PI / 2, 0);
    }
    voiture.echappements = [-0.5, -0.38].map(z => new THREE.Vector3(arriere + 0.12, 0.3, z));
  }
  voiture.traverse(o => { if (o.isMesh && o.material !== M.vitre) { o.castShadow = true; o.receiveShadow = true; } });
  voiture.peinture = peinture;
  return voiture;
}
