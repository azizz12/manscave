// MAN'SCAVE — 07-quartier-parc.js
// =====================================================================
// 3f. LE QUARTIER DES TOURS (avec 2 passages DANS les bâtiments), LE PARC D'ATTRACTIONS ET L'ARRIVÉE
// =====================================================================
// Trois styles de façades : verre bleu, béton clair, brique
function texFenetres(fond, vitre, vitre2, allume, colonnes, lignes) {
  const t = document.createElement('canvas'); t.width = t.height = 128;
  const c = t.getContext('2d');
  c.fillStyle = fond; c.fillRect(0, 0, 128, 128);
  const lw = 128 / colonnes, lh = 128 / lignes;
  for (let y = 0; y < lignes; y++) for (let x = 0; x < colonnes; x++) {
    c.fillStyle = hasard() < 0.2 ? allume : (hasard() < 0.5 ? vitre : vitre2);
    c.fillRect(x * lw + 2, y * lh + 2, lw - 4, lh - 4);
  }
  const tex = new THREE.CanvasTexture(t); tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
const FACADES = [
  texFenetres('#1d2b3f', '#3f6a96', '#2f5680', '#ffe2a6', 4, 8),
  texFenetres('#cfc8bc', '#4a5868', '#3d4a58', '#ffd48a', 3, 6),
  texFenetres('#8a4a36', '#2d3742', '#38434f', '#ffcf8a', 4, 6),
].map(tex => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.35, metalness: 0.25, emissive: '#ffcf8a', emissiveMap: tex, emissiveIntensity: 0.1 }));
const matToitPlat = std('#7d848d', 0.85);
// Une boîte avec des fenêtres de taille constante (les coordonnées de texture suivent la taille)
function boiteImmeuble(l, h, p, mat, matsSpeciaux = {}) {
  const geo = new THREE.BoxGeometry(l, h, p);
  const uv = geo.attributes.uv;
  for (let k = 0; k < uv.count; k++) {
    const face = Math.floor(k / 4);                       // 0,1 = ±x (largeur p) ; 4,5 = ±z (largeur l)
    const largeur = face < 2 ? p : l;
    uv.setXY(k, uv.getX(k) * largeur / 9, uv.getY(k) * h / 9);
  }
  const m = [0, 1, 2, 3, 4, 5].map(f => matsSpeciaux[f] || (f === 2 || f === 3 ? matToitPlat : mat));
  const mesh = new THREE.Mesh(geo, m);
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}
// Repère local d'un endroit de la piste : x = vers la droite, z = dans le sens de la course
function repereSurPiste(x, z) {
  const s = piste[indiceProche(x, z)];
  const g = new THREE.Group();
  g.position.set(s.x, s.y, s.z); g.rotation.y = Math.atan2(s.tx, s.tz);
  scene.add(g);
  return { g, s };
}
function panneauLumineux(texte, fond, encre, l, h) {
  const t = document.createElement('canvas'); t.width = 1024; t.height = 256;
  const c = t.getContext('2d');
  c.fillStyle = fond; c.fillRect(0, 0, 1024, 256);
  c.fillStyle = encre; c.font = 'italic 900 150px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(texte, 512, 136);
  const tex = new THREE.CanvasTexture(t);
  return new THREE.Mesh(new THREE.PlaneGeometry(l, h), new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.9 }));
}
const matIntBeton = std('#3a3f47', 0.9);
const matNeonBlanc = new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e9f4ff', emissiveIntensity: 2.2 });
const matNeonRose = new THREE.MeshStandardMaterial({ color: '#ff5fd2', emissive: '#ff5fd2', emissiveIntensity: 2 });
const matNeonCyan = new THREE.MeshStandardMaterial({ color: '#4fd8ff', emissive: '#4fd8ff', emissiveIntensity: 2 });

// Un bâtiment que la piste traverse : deux ailes, un toit au-dessus de la piste, et l'intérieur éclairé
function batimentTraverse(x, z, longueur, hauteur, profondeur, mat, nom, couleurNeon) {
  const { g, s } = repereSurPiste(x, z);
  const ouverture = s.w + 1.6, hPlafond = 7.5;
  for (const c of [-1, 1]) {
    const aile = boiteImmeuble(profondeur, hauteur, longueur, mat, c < 0 ? { 0: matIntBeton } : { 1: matIntBeton });
    aile.position.set(c * (ouverture + profondeur / 2), hauteur / 2 - 1, 0);
    g.add(aile); mursCamera.push(aile);
    // Bandes lumineuses le long des murs intérieurs
    for (const yb of [1.1, 5.6]) {
      const bande = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, longueur - 1), yb < 2 ? couleurNeon : matNeonBlanc);
      bande.position.set(c * (ouverture - 0.05), yb, 0); g.add(bande);
    }
  }
  const toit = boiteImmeuble(2 * ouverture, hauteur - hPlafond, longueur, mat, { 3: matIntBeton });
  toit.position.set(0, hPlafond + (hauteur - hPlafond) / 2 - 1, 0);
  g.add(toit); mursCamera.push(toit);
  for (let zz = -longueur / 2 + 3; zz < longueur / 2; zz += 5) {      // néons au plafond
    const n = new THREE.Mesh(new THREE.BoxGeometry(2 * ouverture - 2, 0.08, 0.45), matNeonBlanc);
    n.position.set(0, hPlafond - 1.05, zz); g.add(n);
  }
  for (const c of [-1, 1]) {                                          // enseigne au-dessus de chaque entrée
    const p = panneauLumineux(nom, '#141B34', '#FFD23F', 2 * ouverture - 2, (2 * ouverture - 2) / 4);
    p.position.set(0, hPlafond + 1.8, c * (longueur / 2 + 0.06)); if (c < 0) p.rotation.y = Math.PI;
    g.add(p);
  }
}
batimentTraverse(396, 425, 46, 34, 24, FACADES[0], 'SKY TOWER', matNeonCyan);
batimentTraverse(232, 422, 42, 20, 30, FACADES[1], 'ROBO MALL', matNeonRose);
{
  // Une grande tour sur le toit de la Sky Tower
  const { g } = repereSurPiste(396, 425);
  const tour = boiteImmeuble(26, 52, 26, FACADES[0]); tour.position.set(0, 34 + 26 - 1, 0); g.add(tour);
  const antenne = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.4, 14, 8), std('#cfd3d8', 0.4, 0.6)); antenne.position.set(0, 34 + 52 + 6, 0); g.add(antenne);
}
// Les autres immeubles du quartier, de chaque côté de la piste
{
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(312, 100), std('#9a9ea4', 0.92));
  sol.material.polygonOffset = true; sol.material.polygonOffsetFactor = 1; sol.material.polygonOffsetUnits = 2;
  sol.rotation.x = -Math.PI / 2; sol.position.set(320, 2.5, 424); sol.receiveShadow = true; scene.add(sol);
  for (let x = 168; x < 476; x += 26 + hasard() * 10) {
    if (Math.abs(x - 396) < 30 || Math.abs(x - 232) < 32) continue;  // la place des bâtiments traversés
    for (const c of [-1, 1]) {
      if (hasard() < 0.12) continue;
      const l = 16 + hasard() * 8, p = 16 + hasard() * 14;
      const h = 12 + hasard() * hasard() * 75;
      const zc = 424 + c * (15 + p / 2);
      const b = boiteImmeuble(l, h, p, FACADES[Math.floor(hasard() * 3)]);
      b.position.set(x, hauteurTerrain(x, zc) - 0.5 + h / 2, zc); scene.add(b); mursCamera.push(b);
      if (h > 50 && hasard() < 0.6) {                                   // quelques toits avec un panneau lumineux
        const pl = panneauLumineux(['BITCHA', 'NEON', 'RS', 'GT'][Math.floor(hasard() * 4)], '#141B34', '#ff5fd2', l * 0.8, l * 0.2);
        pl.position.set(x, b.position.y + h / 2 + l * 0.12, zc - c * (p / 2 - 1)); pl.rotation.y = c > 0 ? Math.PI : 0; scene.add(pl);
      }
    }
  }
  // Lampadaires le long de la rue
  const matPoteauQ = std('#2b2f36', 0.4, 0.6);
  for (let x = 180; x < 470; x += 22) {
    if (Math.abs(x - 396) < 26 || Math.abs(x - 232) < 24) continue;
    for (const c of [-1, 1]) {
      const s = piste[indiceProche(x, 424)], lat = c * (s.w + 2.2);
      const px = s.x + s.lx * lat, pz = s.z + s.lz * lat, y = solPiste(s, c * s.w);
      const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 7, 8), matPoteauQ); pied.position.set(px, y + 3.5, pz); scene.add(pied);
      const tete = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.15, 1.6), matLampe); tete.position.set(px - s.lx * c * 0.7, y + 7, pz - s.lz * c * 0.7);
      tete.rotation.y = Math.atan2(s.lx, s.lz); scene.add(tete);
    }
  }
}

// --- En VILLE : deux immeubles que la piste traverse, et des immeubles serrés le long des rues du circuit
batimentTraverse(PASSAGES_VILLE[0].x, PASSAGES_VILLE[0].z, PASSAGES_VILLE[0].longueur, 48, 18, FACADES[2], 'NEON CENTER', matNeonRose);
batimentTraverse(PASSAGES_VILLE[1].x, PASSAGES_VILLE[1].z, PASSAGES_VILLE[1].longueur, 30, 20, FACADES[0], 'BITCHA TOWER', matNeonCyan);
{
  const { g } = repereSurPiste(PASSAGES_VILLE[1].x, PASSAGES_VILLE[1].z);
  const tour = boiteImmeuble(24, 60, 24, FACADES[0]); tour.position.set(0, 30 + 30 - 1, 0); g.add(tour); mursCamera.push(tour);
  const couronne = new THREE.Mesh(new THREE.BoxGeometry(25, 1.2, 25), matNeonCyan); couronne.position.set(0, 89.6, 0); g.add(couronne);
}
{
  const places = [];                                    // immeubles déjà posés (pour ne pas les superposer)
  const libre = (x, z, r, demiProf) => {
    if (Math.abs(x) > 168 || Math.abs(z) > 168 || Math.hypot(x, z) < 78) return false;
    if (PASSAGES_VILLE.some(pv => Math.hypot(x - pv.x, z - pv.z) < 34 + r)) return false;
    if (places.some(pl => Math.hypot(x - pl.x, z - pl.z) < pl.r + r + 2)) return false;
    for (const o of obstacles) if (o.boite && (o.niveau || 'surface') === 'surface' && x + r > o.minX && x - r < o.maxX && z + r > o.minZ && z - r < o.maxZ) return false;
    for (const sp of piste) if (sp.type === 'piste' && sp.y > -0.5 && Math.hypot(sp.x - x, sp.z - z) < sp.w + 2.5 + demiProf) return false;
    return true;
  };
  for (let i = 0; i < NB; i += 5) {
    const s = piste[i];
    if (s.type !== 'piste' || !dansVille(s.x, s.z) || s.y < -0.5) continue;
    for (const c of [-1, 1]) {
      const longueur = 16 + hasard() * 8, prof = 14 + hasard() * 8, h = 16 + hasard() * hasard() * 70;
      const lat = c * (s.w + 4.5 + prof / 2), x = s.x + s.lx * lat, z = s.z + s.lz * lat;
      const r = Math.hypot(longueur, prof) / 2;
      if (!libre(x, z, r * 0.7, prof / 2)) continue;
      const b = boiteImmeuble(prof, h, longueur, FACADES[Math.floor(hasard() * 3)]);
      b.position.set(x, h / 2 - 0.2, z); b.rotation.y = Math.atan2(s.tx, s.tz);
      scene.add(b); mursCamera.push(b); places.push({ x, z, r: r * 0.7 });
      obstacles.push({ x, z, rayon: Math.min(longueur, prof) / 2 });
      // Trottoir clair au pied
      const trottoir = new THREE.Mesh(new THREE.PlaneGeometry(prof + 4, longueur + 4), matTrottoir);
      trottoir.rotation.x = -Math.PI / 2; trottoir.rotation.z = Math.atan2(s.tx, s.tz); trottoir.position.set(x, 0.05, z); scene.add(trottoir);
    }
  }
}

// --- Le parc d'attractions « LUNA PARK »
const PARC = { x: -350, z: 525, y: 3 };
{
  const sol = new THREE.Mesh(new THREE.CircleGeometry(72, 64), std('#d9c9a8', 0.95));
  sol.material.polygonOffset = true; sol.material.polygonOffsetFactor = 1; sol.material.polygonOffsetUnits = 2;
  sol.rotation.x = -Math.PI / 2; sol.position.set(PARC.x, PARC.y + 0.02, PARC.z); sol.receiveShadow = true; scene.add(sol);
  const matRouge = std('#e23b3b', 0.5, 0.2), matBlancP = std('#f4f1ea', 0.5), matAcier = std('#c9ced6', 0.35, 0.7);

  // 1. La grande roue (45 m)
  {
    const cx = -345, cz = 548, h = PARC.y + 26, R = 23;
    for (const c of [-1, 1]) for (const d of [-1, 1]) {               // pieds en A
      const pied = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, Math.hypot(h, 12), 10), matAcier);
      pied.position.set(cx + d * 6, h / 2 + PARC.y / 2, cz + c * 3.2);
      pied.rotation.z = -d * Math.atan2(12, h); pied.castShadow = true; scene.add(pied);
    }
    const roue = new THREE.Group(); roue.position.set(cx, h, cz); scene.add(roue);
    const matJante = new THREE.MeshStandardMaterial({ color: '#ff5fd2', emissive: '#ff5fd2', emissiveIntensity: 0.9, roughness: 0.4 });
    for (const c of [-1.4, 1.4]) {
      const jante = new THREE.Mesh(new THREE.TorusGeometry(R, 0.35, 8, 64), matJante); jante.position.z = c; roue.add(jante);
      const jante2 = new THREE.Mesh(new THREE.TorusGeometry(R * 0.55, 0.2, 6, 48), matAcier); jante2.position.z = c; roue.add(jante2);
    }
    const moyeu = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 4, 16), matAcier); moyeu.rotation.x = Math.PI / 2; roue.add(moyeu);
    const cabines = [];
    const couleursCab = ['#ffd23f', '#4fd8ff', '#ff5fd2', '#3ef08a'];
    for (let k = 0; k < 16; k++) {
      const a = k / 16 * Math.PI * 2;
      for (const c of [-1.4, 1.4]) {
        const rayon = new THREE.Mesh(new THREE.BoxGeometry(0.18, R, 0.18), matAcier);
        rayon.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, c); rayon.rotation.z = a - Math.PI / 2; roue.add(rayon);
      }
      const cab = new THREE.Group();
      const corps = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.1, 2, 12), std(couleursCab[k % 4], 0.4, 0.2)); corps.position.y = -1.6;
      const toitCab = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.8, 12), matBlancP); toitCab.position.y = -0.3;
      cab.add(corps, toitCab); cab.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); roue.add(cab); cabines.push(cab);
    }
    animations.push(dt => {
      roue.rotation.z += dt * 0.12;
      for (const cab of cabines) cab.rotation.z = -roue.rotation.z;  // les cabines restent droites
    });
  }
  // 2. Le carrousel
  {
    const cx = -398, cz = 492;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(9, 9.4, 0.7, 40), matBlancP); base.position.set(cx, PARC.y + 0.35, cz); scene.add(base);
    const t = document.createElement('canvas'); t.width = 256; t.height = 16;
    const c = t.getContext('2d'); for (let k = 0; k < 16; k++) { c.fillStyle = k % 2 ? '#e23b3b' : '#f4f1ea'; c.fillRect(k * 16, 0, 16, 16); }
    const toit = new THREE.Mesh(new THREE.ConeGeometry(10.5, 4.5, 32, 1), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(t), roughness: 0.6 }));
    const manege = new THREE.Group(); manege.position.set(cx, PARC.y + 0.7, cz); scene.add(manege);
    toit.position.y = 7.6; manege.add(toit);
    const axe = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 5.5, 16), std('#ffd23f', 0.4, 0.3)); axe.position.y = 2.75; manege.add(axe);
    const chevaux = [];
    const couleurs = ['#f4f1ea', '#ffd23f', '#4fd8ff', '#ff5fd2'];
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2;
      const barre = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 5.4, 6), matAcier); barre.position.set(Math.cos(a) * 6.5, 2.7, Math.sin(a) * 6.5); manege.add(barre);
      const cheval = new THREE.Group();
      const corps = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.8, 1.9), std(couleurs[k % 4], 0.45));
      const cou = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1, 0.5), corps.material); cou.position.set(0, 0.7, 0.8); cou.rotation.x = -0.4;
      const tete = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.9), corps.material); tete.position.set(0, 1.2, 1.15);
      cheval.add(corps, cou, tete);
      cheval.position.set(Math.cos(a) * 6.5, 1.8, Math.sin(a) * 6.5); cheval.rotation.y = -a;
      manege.add(cheval); chevaux.push({ cheval, phase: k * 1.3 });
    }
    animations.push(dt => {
      manege.rotation.y += dt * 0.55;
      for (const ch of chevaux) ch.cheval.position.y = 1.8 + Math.sin(tempsJeu * 2.4 + ch.phase) * 0.45;
    });
  }
  // 3. La tour de chute libre (55 m)
  {
    const cx = -300, cz = 482;
    const t = document.createElement('canvas'); t.width = 16; t.height = 256;
    const c = t.getContext('2d'); for (let k = 0; k < 16; k++) { c.fillStyle = k % 2 ? '#e23b3b' : '#f4f1ea'; c.fillRect(0, k * 16, 16, 16); }
    const colonne = new THREE.Mesh(new THREE.BoxGeometry(3, 56, 3), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(t), roughness: 0.5 }));
    colonne.position.set(cx, PARC.y + 28, cz); colonne.castShadow = true; scene.add(colonne);
    const sommet = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 2, 16), matNeonCyan); sommet.position.set(cx, PARC.y + 57, cz); scene.add(sommet);
    const anneau = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.2, 1.6, 24, 1, true), new THREE.MeshStandardMaterial({ color: '#ffd23f', side: THREE.DoubleSide, roughness: 0.4 }));
    anneau.position.set(cx, PARC.y + 4, cz); scene.add(anneau);
    let cycle = 0;
    animations.push(dt => {
      cycle = (cycle + dt) % 14;
      // monte lentement (9 s), attend (2 s), chute (1,2 s), se pose
      const hMax = 50, hMin = 4;
      const y = cycle < 9 ? hMin + (hMax - hMin) * (cycle / 9) : cycle < 11 ? hMax
              : cycle < 12.2 ? hMax - (hMax - hMin) * Math.pow((cycle - 11) / 1.2, 2) : hMin;
      anneau.position.y = PARC.y + y;
    });
  }
  // 4. Les montagnes russes (avec un petit train qui roule)
  {
    const pts = [[-400, 565, 7], [-388, 590, 17], [-352, 600, 24], [-312, 588, 15], [-292, 560, 9], [-300, 528, 19],
                 [-326, 510, 12], [-360, 508, 7], [-392, 528, 11]].map(([x, z, y]) => new THREE.Vector3(x, PARC.y + y, z));
    const courbe = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    const rail = new THREE.Mesh(new THREE.TubeGeometry(courbe, 240, 0.45, 8, true), std('#e23b3b', 0.4, 0.4));
    rail.castShadow = true; scene.add(rail);
    for (let k = 0; k < 40; k++) {                                      // poteaux de soutien
      const p = courbe.getPointAt(k / 40);
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, p.y - PARC.y, 6), matAcier);
      pot.position.set(p.x, (p.y + PARC.y) / 2, p.z); scene.add(pot);
    }
    const wagons = [];
    for (let k = 0; k < 4; k++) {
      const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 2.4), std(['#ffd23f', '#4fd8ff', '#3ef08a', '#ff5fd2'][k], 0.4, 0.3));
      scene.add(w); wagons.push(w);
    }
    let u = 0;
    const cible = new THREE.Vector3();
    animations.push(dt => {
      const p = courbe.getPointAt(u), tg = courbe.getTangentAt(u);
      u = (u + dt * (0.035 + Math.max(0, -tg.y) * 0.09)) % 1;          // plus vite dans les descentes
      wagons.forEach((w, k) => {
        const uu = (u - k * 0.012 + 1) % 1;
        w.position.copy(courbe.getPointAt(uu)); w.position.y += 0.9;
        cible.copy(courbe.getPointAt((uu + 0.004) % 1)); cible.y += 0.9;
        w.lookAt(cible);
      });
    });
  }
  // 5. Stands colorés, et l'entrée
  const couleursStand = ['#e23b3b', '#4fd8ff', '#ffd23f', '#3ef08a', '#ff5fd2'];
  for (let k = 0; k < 10; k++) {
    const a = k / 10 * Math.PI * 2 + 0.3, d = 52 + (k % 2) * 8;
    const x = PARC.x + Math.cos(a) * d, z = PARC.z + Math.sin(a) * d;
    const stand = new THREE.Mesh(new THREE.BoxGeometry(4.5, 2.6, 3.2), matBlancP); stand.position.set(x, PARC.y + 1.3, z);
    const toit = new THREE.Mesh(new THREE.ConeGeometry(3.6, 2.2, 4), std(couleursStand[k % 5], 0.6)); toit.position.set(x, PARC.y + 3.7, z); toit.rotation.y = Math.PI / 4;
    stand.rotation.y = toit.rotation.y = -a; stand.castShadow = toit.castShadow = true; scene.add(stand, toit);
  }
  {
    const g = new THREE.Group(); g.position.set(-283, PARC.y, 520); g.rotation.y = -Math.PI / 2; scene.add(g);
    for (const c of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 9, 12), matNeonRose); p.position.set(c * 7, 4.5, 0); g.add(p); }
    const enseigne = panneauLumineux('LUNA PARK', '#141B34', '#ff5fd2', 16, 4); enseigne.position.y = 9.5; g.add(enseigne);
    const dos = enseigne.clone(); dos.rotation.y = Math.PI; dos.position.z = -0.05; g.add(dos);
  }
}

// --- L'arrivée : une arche à damier sur l'avenue ouest, juste avant le rond-point
{
  const s = piste[0];
  const g = new THREE.Group(); g.position.set(s.x, 0, s.z); g.rotation.y = Math.atan2(s.tx, s.tz); scene.add(g);
  const t = document.createElement('canvas'); t.width = 256; t.height = 32;
  const c = t.getContext('2d');
  for (let y = 0; y < 2; y++) for (let x = 0; x < 16; x++) { c.fillStyle = (x + y) % 2 ? '#111' : '#fff'; c.fillRect(x * 16, y * 16, 16, 16); }
  const texDamier = new THREE.CanvasTexture(t); texDamier.magFilter = THREE.NearestFilter;
  const ligne = new THREE.Mesh(new THREE.PlaneGeometry(2 * s.w, 1.8), new THREE.MeshStandardMaterial({ map: texDamier, roughness: 0.7 }));
  ligne.rotation.x = -Math.PI / 2; ligne.position.y = 0.07; g.add(ligne);
  for (const c2 of [-1, 1]) {
    const pied = new THREE.Mesh(new THREE.BoxGeometry(0.9, 8, 0.9), std('#1c1f24', 0.4, 0.6));
    pied.position.set(c2 * (s.w + 1.4), 4, 0); pied.castShadow = true; g.add(pied);
  }
  const bandeau = panneauLumineux('ROBOCAM', '#141B34', '#FFD23F', 2 * s.w + 3.6, 2.4);
  bandeau.position.y = 8.6; g.add(bandeau);
  const dos = panneauLumineux('FINISH', '#141B34', '#ffffff', 2 * s.w + 3.6, 2.4);
  dos.position.set(0, 8.6, -0.06); dos.rotation.y = Math.PI; g.add(dos);
  for (const c2 of [-1, 1]) {
    const damier = new THREE.Mesh(new THREE.PlaneGeometry(2 * s.w + 3.6, 0.6), new THREE.MeshBasicMaterial({ map: texDamier, side: THREE.DoubleSide }));
    damier.position.set(0, 8.6 + c2 * 1.5, 0.03); g.add(damier);
  }
}

const finDehors = scene.children.length;
