// MAN'SCAVE — 08-voitures.js
// =====================================================================
// 4. LES VOITURES PILOTABLES : caractéristiques, plateau et socles d'exposition
// =====================================================================
// --- Caractéristiques de conduite de chaque voiture
// vmax en m/s (km/h ÷ 3,6) · accel = poussée maximale · rapports = vitesse max de chaque rapport
const SPECS = {
  volt: { nom: 'Concept Volt', moteur: 'Électrique', kmh: 300, vmax: 300 / 3.6, accel: 13.5, freinage: 38,
          adherence: 10.5, braquage: 1.85, compteurMax: 320 },
  furia: { nom: 'Furia GT', moteur: 'V8 thermique', kmh: 250, vmax: 250 / 3.6, accel: 10.5, freinage: 33,
           adherence: 8, braquage: 1.75, compteurMax: 280,
           rapports: [62, 102, 140, 178, 216, 250].map(v => v / 3.6), ralenti: 950, zoneRouge: 7800, cylindres: 8 },
  sprint: { nom: 'Sprint RS', moteur: '4 cylindres turbo', kmh: 200, vmax: 200 / 3.6, accel: 7.4, freinage: 29,
            adherence: 9.5, braquage: 2.3, compteurMax: 240,
            rapports: [52, 88, 124, 162, 200].map(v => v / 3.6), ralenti: 850, zoneRouge: 6800, cylindres: 4 },
  toro: { nom: 'Toro V12', moteur: 'V12 atmosphérique', kmh: 340, vmax: 340 / 3.6, accel: 15, freinage: 40,
          adherence: 10.2, braquage: 1.75, compteurMax: 360,
          rapports: [72, 118, 163, 208, 255, 300, 340].map(v => v / 3.6), ralenti: 1000, zoneRouge: 8700, cylindres: 12,
          son: { res: 240, resR: 560, filtre: 900, turbo: 0, drive: 1.25, admission: 1.3 } },
  kaiser: { nom: 'Kaiser 88', moteur: '4 cylindres atmo · 2,3 L', kmh: 235, vmax: 235 / 3.6, accel: 8.6, freinage: 30,
            adherence: 9.3, braquage: 2.1, compteurMax: 260,
            rapports: [62, 104, 148, 192, 235].map(v => v / 3.6), ralenti: 900, zoneRouge: 7800, cylindres: 4,
            son: { res: 210, resR: 420, filtre: 800, turbo: 0, drive: 1.1, admission: 2.4 } },
};

// --- Les voitures pilotables, garées au sous-sol sur des emplacements lumineux
const voitures = [];
function ajouterVoiture(nom, parent, x, y, z, angle) {
  const groupe = new THREE.Group();
  const modele = creerVoiture(nom);
  modele.rotation.order = 'YXZ';                       // x = roulis (penche sur le côté), z = tangage (avant/arrière)
  modele.rotation.y = -Math.PI / 2;                    // l'avant du modèle regarde vers -Z
  groupe.add(modele);
  groupe.position.set(x, y, z); groupe.rotation.y = angle;
  parent.add(groupe);
  const v = { nom, groupe, modele, specs: SPECS[nom],
              auto: { cap: angle, vx: 0, vz: 0, vy: 0, enLair: false, boost: 0, braquage: 0, vitesse: 0, rapport: 0, regime: 0, rpm: 0, changement: 0, gaz: 0 } };
  voitures.push(v);
  return v;
}
function emplacement(x, z, couleur, avecLampe = true) { // emplacement de garage : sol sombre + cadre lumineux
  const d = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.04, 4.6), std('#1d2026', 0.35, 0.4));
  d.position.set(x, SOUS_SOL.y + 0.02, z); d.receiveShadow = true; scene.add(d);
  const matLum = new THREE.MeshStandardMaterial({ color: couleur, emissive: couleur, emissiveIntensity: 2 });
  for (const [l, p, dx, dz] of [[8.6, 0.08, 0, 2.3], [8.6, 0.08, 0, -2.3], [0.08, 4.6, -4.3, 0], [0.08, 4.6, 4.3, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(l, 0.05, p), matLum);
    b.position.set(x + dx, SOUS_SOL.y + 0.05, z + dz); scene.add(b);
  }
  if (avecLampe) {
    const spot = new THREE.PointLight(couleur, 0.6, 9, 2);
    spot.position.set(x, SOUS_SOL.y + 3, z); scene.add(spot);
  }
}
// À gauche (x < 0) les voitures regardent vers +X, à droite vers -X : toujours l'avant vers l'allée
emplacement(-19, 105, '#7f6bff'); const volt = ajouterVoiture('volt', scene, -19, SOUS_SOL.y, 105, -Math.PI / 2);
emplacement(19, 117, '#ff3b47');  ajouterVoiture('furia', scene, 19, SOUS_SOL.y, 117, Math.PI / 2);
emplacement(-19, 141, '#4f8dff'); ajouterVoiture('sprint', scene, -19, SOUS_SOL.y, 141, -Math.PI / 2);
emplacement(-19, 123, '#8fd400', false); ajouterVoiture('toro', scene, -19, SOUS_SOL.y, 123, -Math.PI / 2);     // (sans lampe : plus léger)
emplacement(19, 147, '#ffffff', false); ajouterVoiture('kaiser', scene, 19, SOUS_SOL.y, 147, Math.PI / 2);
let enVoiture = false;
// La voiture conduite en ce moment (on change ces variables quand on monte dans une autre)
let voitureActive = volt, vehicule = volt.groupe, modele = volt.modele, auto = volt.auto, specs = volt.specs;

const debutGarage = scene.children.length;
