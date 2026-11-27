// MAN'SCAVE — 09-garage.js
// =====================================================================
// 4b. LE « BITCHA GARAGE » (niveau -2, sous la grille de départ) ET L'ASCENSEUR À VOITURES
// =====================================================================
const GARAGE = { x1: -24, x2: 24, z1: 96, z2: 168, y: -14, plafond: -7.6 };
// L'ascenseur : une grande plateforme qui va du niveau -1 (parking) au niveau -2 (garage) et au niveau -3 (TRIP, avec un code)
const ASC = { x1: 15.2, x2: 23.8, z1: 131.2, z2: 138.8, y: SOUS_SOL.y, cible: SOUS_SOL.y, bouge: false, tripAutorise: false };
const NIVEAUX_ASC = { '-1': SOUS_SOL.y, '-2': GARAGE.y, '-3': TRIP.y };
const niveauHauteur = y => (y > (SOUS_SOL.y + GARAGE.y) / 2 ? '-1' : y > (GARAGE.y + TRIP.y) / 2 ? '-2' : '-3');
const dansAscenseur = (x, z) => x > ASC.x1 && x < ASC.x2 && z > ASC.z1 && z < ASC.z2;
{
  const H = GARAGE.plafond - GARAGE.y, yc = GARAGE.y + H / 2;
  const matSolGarage = new THREE.MeshStandardMaterial({ color: '#25282e', roughness: 0.5, metalness: 0.1 });   // résine brillante
  // Le sol, en 4 morceaux autour du puits de l'ascenseur (la plateforme descend plus bas, jusqu'au niveau -3)
  for (const [x1, x2, z1, z2] of [[GARAGE.x1, GARAGE.x2, GARAGE.z1, ASC.z1], [GARAGE.x1, GARAGE.x2, ASC.z2, GARAGE.z2],
                                  [GARAGE.x1, ASC.x1, ASC.z1, ASC.z2], [ASC.x2, GARAGE.x2, ASC.z1, ASC.z2]]) {
    const solG = new THREE.Mesh(new THREE.PlaneGeometry(x2 - x1, z2 - z1), matSolGarage);
    solG.rotation.x = -Math.PI / 2; solG.position.set((x1 + x2) / 2, GARAGE.y, (z1 + z2) / 2); solG.receiveShadow = true; scene.add(solG);
  }
  // Plafond (avec le trou de l'ascenseur) et murs
  const matPlafondG = std('#1b1d22', 0.9);
  const ep = 0.5, yp = GARAGE.plafond + ep / 2;
  const X1 = GARAGE.x1 - 1, X2 = GARAGE.x2 + 1, Z1 = GARAGE.z1 - 1, Z2 = GARAGE.z2 + 1;
  boite(X2 - X1, ep, ASC.z1 - Z1, 0, yp, (Z1 + ASC.z1) / 2, matPlafondG, 'aucun', false);
  boite(X2 - X1, ep, Z2 - ASC.z2, 0, yp, (ASC.z2 + Z2) / 2, matPlafondG, 'aucun', false);
  boite(ASC.x1 - X1, ep, ASC.z2 - ASC.z1, (X1 + ASC.x1) / 2, yp, (ASC.z1 + ASC.z2) / 2, matPlafondG, 'aucun', false);
  boite(X2 - ASC.x2, ep, ASC.z2 - ASC.z1, (ASC.x2 + X2) / 2, yp, (ASC.z1 + ASC.z2) / 2, matPlafondG, 'aucun', false);
  const matMurG = std('#2c3036', 0.85);
  boite(1, H, GARAGE.z2 - GARAGE.z1 + 2, GARAGE.x1 - 0.5, yc, (GARAGE.z1 + GARAGE.z2) / 2, matMurG, 'garage');
  boite(1, H, GARAGE.z2 - GARAGE.z1 + 2, GARAGE.x2 + 0.5, yc, (GARAGE.z1 + GARAGE.z2) / 2, matMurG, 'garage');
  boite(GARAGE.x2 - GARAGE.x1, H, 1, 0, yc, GARAGE.z1 - 0.5, matMurG, 'garage');
  boite(-15.5 - GARAGE.x1, H, 1, (GARAGE.x1 - 15.5) / 2, yc, GARAGE.z2 + 0.5, matMurG, 'garage');          // mur du fond, avec la porte
  boite(GARAGE.x2 + 11.5, H, 1, (GARAGE.x2 - 11.5) / 2, yc, GARAGE.z2 + 0.5, matMurG, 'garage');           // du stand de tir (x de -15,5 à -11,5)
  boite(4, H - 3, 1, -13.5, GARAGE.y + 3 + (H - 3) / 2, GARAGE.z2 + 0.5, matMurG, 'aucun', false);         // linteau au-dessus de la porte
  // Bandeaux LED au plafond et le long des murs (pas de vraies lampes : c'est plus léger pour l'ordinateur)
  for (let z = 100; z < GARAGE.z2; z += 8) {
    for (const x of [-16, -4, 8]) {
      if (dansAscenseur(x, z)) continue;
      const led = new THREE.Mesh(new THREE.BoxGeometry(6, 0.06, 0.3), matNeon); led.position.set(x, GARAGE.plafond - 0.05, z); scene.add(led);
    }
  }
  const matRgbRose = new THREE.MeshStandardMaterial({ color: '#ff3fb4', emissive: '#ff3fb4', emissiveIntensity: 2 });
  const matRgbCyan = new THREE.MeshStandardMaterial({ color: '#35d6ff', emissive: '#35d6ff', emissiveIntensity: 2 });
  for (const [x, z, l, p, m] of [[GARAGE.x1 + 0.06, 132, 0.08, 72, matRgbCyan], [GARAGE.x2 - 0.06, 132, 0.08, 72, matRgbRose],
                                 [0, GARAGE.z1 + 0.06, 48, 0.08, matRgbRose], [0, GARAGE.z2 - 0.06, 48, 0.08, matRgbCyan]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(l, 0.1, p), m); b.position.set(x, GARAGE.plafond - 0.35, z); scene.add(b);
  }
  // Grande enseigne néon « BITCHA GARAGE » sur le mur du fond (on la voit en sortant de l'ascenseur)
  {
    const t = document.createElement('canvas'); t.width = 1024; t.height = 256;
    const c = t.getContext('2d');
    c.fillStyle = '#000'; c.fillRect(0, 0, 1024, 256);
    c.font = 'italic 900 132px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ff3fb4'; c.shadowBlur = 28; c.fillStyle = '#ffd0ee'; c.fillText('BITCHA', 512, 104);
    c.font = '800 54px system-ui, sans-serif'; c.shadowColor = '#35d6ff'; c.fillStyle = '#d6f6ff'; c.letterSpacing = '18px'; c.fillText('G A R A G E', 512, 200);
    const tex = new THREE.CanvasTexture(t);
    const enseigne = new THREE.Mesh(new THREE.PlaneGeometry(14, 3.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending }));
    enseigne.position.set(-2, GARAGE.y + 4, GARAGE.z1 + 0.1); scene.add(enseigne);
    const enseigne2 = enseigne.clone(); enseigne2.position.set(-2, GARAGE.y + 4, GARAGE.z2 - 0.1); enseigne2.rotation.y = Math.PI; scene.add(enseigne2);
  }
  // Allée peinte au sol pour rejoindre l'ascenseur
  for (let x = -6; x < 14; x += 2.4) {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.25), matJaune); f.rotation.x = -Math.PI / 2; f.position.set(x, GARAGE.y + 0.02, 135); scene.add(f);
  }
}

// --- L'ascenseur
const plateformeAsc = new THREE.Group();
{
  // Tôle « larmée » (texture de petits reliefs) avec des bandes de sécurité jaunes et noires
  const t = document.createElement('canvas'); t.width = t.height = 64;
  const c = t.getContext('2d');
  c.fillStyle = '#8d939b'; c.fillRect(0, 0, 64, 64);
  c.strokeStyle = '#b9bfc7'; c.lineWidth = 3; c.lineCap = 'round';
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) {
    const a = (x + y) % 2 ? 0.7 : -0.7, cx = x * 16 + 8, cy = y * 16 + 8;
    c.beginPath(); c.moveTo(cx - Math.cos(a) * 5, cy - Math.sin(a) * 5); c.lineTo(cx + Math.cos(a) * 5, cy + Math.sin(a) * 5); c.stroke();
  }
  const tex = new THREE.CanvasTexture(t); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(5, 5);
  const l = ASC.x2 - ASC.x1, p = ASC.z2 - ASC.z1;
  const plaque = new THREE.Mesh(new THREE.BoxGeometry(l, 0.3, p), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.45, metalness: 0.7 }));
  plaque.position.y = -0.15; plaque.receiveShadow = true; plateformeAsc.add(plaque);
  const rayures = matRayure.clone(); rayures.map = matRayure.map.clone(); rayures.map.needsUpdate = true;
  rayures.map.wrapS = THREE.RepeatWrapping; rayures.map.repeat.set(6, 1);
  for (const c2 of [-1, 1]) {
    const bord = new THREE.Mesh(new THREE.BoxGeometry(l, 0.04, 0.4), rayures); bord.position.set(0, 0.02, c2 * (p / 2 - 0.2)); plateformeAsc.add(bord);
  }
  plateformeAsc.position.set((ASC.x1 + ASC.x2) / 2, ASC.y, (ASC.z1 + ASC.z2) / 2);
  scene.add(plateformeAsc);
  // Le puits : murs des deux côtés et au fond, sur les deux niveaux, avec des montants jaunes
  const matPuits = std('#3a3f47', 0.85);
  for (const z of [ASC.z1 - 0.3, ASC.z2 + 0.3]) {
    boite(l + 0.6, 7 - 0.3, 0.6, (ASC.x1 + ASC.x2) / 2, SOUS_SOL.y + 3.35, z, matPuits, 'sous-sol');
    boite(l + 0.6, GARAGE.plafond - GARAGE.y + 0.6, 0.6, (ASC.x1 + ASC.x2) / 2, (GARAGE.y + GARAGE.plafond + 0.6) / 2, z, matPuits, 'garage');
  }
  const matMontant = std('#f2c230', 0.5, 0.2);
  for (const z of [ASC.z1 + 0.1, ASC.z2 - 0.1]) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.35, -0.3 - GARAGE.y, 0.35), matMontant);
    m.position.set(ASC.x1 + 0.15, (GARAGE.y - 0.3) / 2, z); scene.add(m);
  }
  // Panneau de commande (il voyage avec la plateforme) : bouton -1 et bouton -2
  const poteau = new THREE.Mesh(new THREE.BoxGeometry(0.25, 1.4, 0.25), std('#1c1f24', 0.4, 0.6)); poteau.position.set(l / 2 - 0.5, 0.7, -p / 2 + 0.6);
  const boitier = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.9, 0.6), std('#2a2e36', 0.35, 0.5)); boitier.position.set(l / 2 - 0.62, 1.5, -p / 2 + 0.6);
  plateformeAsc.add(poteau, boitier);
  ASC.boutons = {};
  for (const [nom, dy] of [['-1', 0.27], ['-2', 0], ['-3', -0.27]]) {
    const tb = document.createElement('canvas'); tb.width = tb.height = 64;
    const cb = tb.getContext('2d'); cb.fillStyle = '#fff'; cb.font = '800 30px system-ui'; cb.textAlign = 'center'; cb.textBaseline = 'middle'; cb.fillText(nom, 32, 34);
    const m = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(tb), color: '#888', emissive: '#30ff8a', emissiveIntensity: 0 });
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.11, 24), m);
    b.position.set(l / 2 - 0.73, 1.5 + dy, -p / 2 + 0.6); b.rotation.y = -Math.PI / 2;
    plateformeAsc.add(b); ASC.boutons[nom] = m;
  }
}
const niveauAscenseur = () => niveauHauteur(ASC.y);
// Est-on sur la plateforme, ou juste devant la porte de l'ascenseur ?
function presAscenseur() {
  const p = enVoiture ? vehicule.position : { x: etat.x, y: etat.y, z: etat.z };
  if (p.y > -3) return false;
  return p.x > ASC.x1 - 7 && p.x < ASC.x2 && p.z > ASC.z1 - 3 && p.z < ASC.z2 + 3;
}
function appelerAscenseur(niveau, codeBon = false) {
  if (!presAscenseur() || ASC.bouge || !(niveau in NIVEAUX_ASC)) return;
  if (NIVEAUX_ASC[niveau] === ASC.y) { annoncer(`Tu es déjà au niveau ${niveau}`, 'cp'); return; }
  // Le niveau -3 est privé : il faut le code (une seule fois par partie)
  if (niveau === '-3' && !ASC.tripAutorise && !codeBon) { ouvrirClavier('trip'); return; }
  if (codeBon) ASC.tripAutorise = true;
  ASC.cible = NIVEAUX_ASC[niveau]; ASC.bouge = true;
  ASC.commande = [niveau, Date.now()];                   // envoyée aux autres joueurs
  sonClic();
  annoncer({ '-1': '↑ Niveau -1 · départ', '-2': (ASC.y > GARAGE.y ? '↓' : '↑') + ' BITCHA Garage', '-3': '↓ Niveau -3 · TRIP' }[niveau], 'cp');
}
let sonAsc = null;
function majAscenseur(dt) {
  if (ASC.bouge) {
    // Plus vite sur les longs trajets (vers le -3), et on ralentit en arrivant
    const d = ASC.cible - ASC.y, vMax = clamp(Math.abs(d) * 0.6, 1.7, 5.5);
    const pas = Math.sign(d) * Math.min(Math.abs(d), vMax * dt * Math.min(1, 0.25 + Math.abs(d) * 0.4));
    ASC.y += pas;
    if (Math.abs(ASC.cible - ASC.y) < 0.001) {
      ASC.y = ASC.cible; ASC.bouge = false;
      if (audio) {                                        // « ding » à l'arrivée
        const t = audio.ctx.currentTime;
        for (const [f, d0] of [[880, 0], [660, 0.18]]) {
          const o = audio.ctx.createOscillator(), g = audio.ctx.createGain(); o.type = 'sine'; o.frequency.value = f;
          g.gain.setValueAtTime(0.0001, t + d0); g.gain.exponentialRampToValueAtTime(0.2, t + d0 + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + d0 + 0.6);
          o.connect(g); g.connect(audio.master); o.start(t + d0); o.stop(t + d0 + 0.65);
        }
      }
    }
  }
  plateformeAsc.position.y = ASC.y;
  // Ronronnement du moteur de l'ascenseur
  if (audio) {
    if (!sonAsc) {
      const o = audio.ctx.createOscillator(), g = audio.ctx.createGain(); o.type = 'sawtooth'; o.frequency.value = 62;
      const f = audio.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 240;
      g.gain.value = 0; o.connect(f); f.connect(g); g.connect(audio.master); o.start(); sonAsc = g;
    }
    sonAsc.gain.setTargetAtTime(ASC.bouge ? 0.06 : 0, audio.ctx.currentTime, 0.15);
  }
  // Boutons allumés (le niveau où on va / où on est)
  const actuel = niveauHauteur(ASC.bouge ? ASC.cible : ASC.y);
  majGardeCorps();
  for (const n in ASC.boutons) ASC.boutons[n].emissiveIntensity = n === actuel ? 1.6 : 0.05;
  // Le petit panneau à l'écran avec les boutons
  const pres = enJeu && presAscenseur();
  const el = $('ascenseur');
  if (pres !== (el.style.display === 'flex')) el.style.display = pres ? 'flex' : 'none';
  if (pres) for (const b of el.querySelectorAll('button')) b.classList.toggle('actif', b.dataset.niveau === actuel);
}

// --- Les voitures du BITCHA Garage (pilotables : on les prend et on remonte avec l'ascenseur)
const VOITURES_GARAGE = [['volt', '#121216', 104], ['furia', '#d9a520', 118], ['sprint', '#ff4fa3', 146], ['furia', '#f4f4f6', 160]];
for (const [nom, couleur, z] of VOITURES_GARAGE) {
  const x = -17.5;
  const v = ajouterVoiture(nom, scene, x, GARAGE.y, z, -Math.PI / 2);
  v.couleurFixe = couleur; v.modele.peinture.color.set(couleur);
  // Socle d'exposition : dalle sombre + contour lumineux (sans vraie lampe)
  const d = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.05, 4.6), std('#111317', 0.25, 0.4));
  d.position.set(x, GARAGE.y + 0.025, z); d.receiveShadow = true; scene.add(d);
  const lum = new THREE.MeshStandardMaterial({ color: couleur === '#121216' ? '#ffffff' : couleur, emissive: couleur === '#121216' ? '#ffffff' : couleur, emissiveIntensity: 1.8 });
  for (const [l, p, dx, dz] of [[8.4, 0.08, 0, 2.3], [8.4, 0.08, 0, -2.3], [0.08, 4.6, -4.2, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(l, 0.06, p), lum); b.position.set(x + dx, GARAGE.y + 0.06, z + dz); scene.add(b);
  }
}

// --- Le coin détente : lit, télé, canapé, bancs, bar, jeux…
{
  const Y = GARAGE.y;
  const meuble = (l, h, p, x, y, z, mat, collision = true, rotY = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(l, h, p), mat);
    m.position.set(x, Y + y, z); m.rotation.y = rotY; m.receiveShadow = true; scene.add(m);
    if (collision) {
      const ex = rotY ? p : l, ez = rotY ? l : p;
      obstacles.push({ boite: true, niveau: 'garage', minX: x - ex / 2, maxX: x + ex / 2, minZ: z - ez / 2, maxZ: z + ez / 2 });
    }
    return m;
  };
  const bois = std('#6e4a2f', 0.6), boisClair = std('#a87b52', 0.55), noirMat = std('#17181c', 0.6), cuir = std('#2b2b30', 0.55),
        tissu = std('#5f6670', 0.95), blancD = std('#e9e7e2', 0.8), acier = std('#c9ced6', 0.3, 0.8), verre = std('#9fd8ff', 0.05, 0.2);
  const lumiere = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 2 });

  // Mur en lames de bois derrière le lit et la télé
  {
    const t = document.createElement('canvas'); t.width = 128; t.height = 8;
    const c = t.getContext('2d');
    for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#6e4a2f' : '#a87b52'; c.fillRect(k * 16, 0, 13, 8); c.fillStyle = '#1b1d22'; c.fillRect(k * 16 + 13, 0, 3, 8); }
    const tex = new THREE.CanvasTexture(t); tex.wrapS = THREE.RepeatWrapping; tex.repeat.set(31 / 4.4, 1);
    const lames = new THREE.Mesh(new THREE.PlaneGeometry(31, 6), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }));
    lames.position.set(GARAGE.x2 - 0.08, Y + 3, 112.5); lames.rotation.y = -Math.PI / 2; scene.add(lames);
  }
  // Tapis
  const tapis = new THREE.Mesh(new THREE.PlaneGeometry(10, 9), std('#3b3f4a', 1)); tapis.rotation.x = -Math.PI / 2; tapis.position.set(16, Y + 0.02, 115); scene.add(tapis);

  // 1. Le lit (moderne, bas, avec tête de lit lumineuse)
  meuble(2.4, 0.35, 2.3, 21.8, 0.18, 101.5, noirMat);                    // sommier
  meuble(2.2, 0.28, 2.1, 21.8, 0.49, 101.5, blancD, false);              // matelas
  meuble(1.6, 0.12, 2.15, 21.4, 0.68, 101.5, std('#2f4a6b', 0.95), false);   // couette
  for (const dz of [-0.5, 0.5]) meuble(0.45, 0.2, 0.75, 22.6, 0.74, 101.5 + dz, blancD, false);   // oreillers
  meuble(0.15, 1.3, 2.7, 23.05, 0.95, 101.5, cuir, false);               // tête de lit
  meuble(0.05, 0.06, 2.7, 23.2, 1.62, 101.5, lumiere('#35d6ff'), false); // LED derrière
  for (const dz of [-1.75, 1.75]) {                                       // tables de nuit + lampes
    meuble(0.6, 0.5, 0.6, 22.6, 0.25, 101.5 + dz * 1.0, bois);
    meuble(0.18, 0.35, 0.18, 22.6, 0.68, 101.5 + dz * 1.0, lumiere('#ffd79a'), false);
  }

  // 2. La télé géante (l'écran passe en boucle les meilleurs moments du circuit, en dessin animé)
  const toileTV = document.createElement('canvas'); toileTV.width = 512; toileTV.height = 288;
  const texTV = new THREE.CanvasTexture(toileTV);
  meuble(0.18, 2.7, 4.9, GARAGE.x2 - 0.25, 2.8, 116, noirMat, false);
  const ecranTV = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 2.55), new THREE.MeshBasicMaterial({ map: texTV }));
  ecranTV.position.set(GARAGE.x2 - 0.35, Y + 2.8, 116); ecranTV.rotation.y = -Math.PI / 2; scene.add(ecranTV);
  meuble(0.7, 0.5, 4.2, GARAGE.x2 - 0.6, 0.25, 116, noirMat);           // meuble télé
  meuble(0.3, 0.6, 0.3, GARAGE.x2 - 0.6, 0.8, 114.4, noirMat, false);   // enceintes
  meuble(0.3, 0.6, 0.3, GARAGE.x2 - 0.6, 0.8, 117.6, noirMat, false);
  let tTV = 0;
  animations.push(dt => {
    if (!enVoiture && etat.y > -10) return;              // on ne dessine la télé que si on est au garage
    if (enVoiture && vehicule.position.y > -10) return;
    tTV += dt;
    const c = toileTV.getContext('2d');
    const g = c.createLinearGradient(0, 0, 0, 288); g.addColorStop(0, '#1a2a6c'); g.addColorStop(1, '#b21f6a');
    c.fillStyle = g; c.fillRect(0, 0, 512, 288);
    c.strokeStyle = '#ffffff'; c.lineWidth = 10; c.beginPath();                      // une piste qui défile
    for (let x = 0; x <= 512; x += 8) { const y = 200 + Math.sin((x + tTV * 160) * 0.02) * 40; x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    const vx = (tTV * 120) % 600 - 40, vy = 200 + Math.sin((vx + tTV * 160) * 0.02) * 40;
    c.fillStyle = '#FFD23F'; c.fillRect(vx - 18, vy - 22, 36, 14);
    c.fillStyle = '#fff'; c.font = 'italic 900 46px system-ui'; c.textAlign = 'center'; c.fillText('BITCHA TV', 256, 70);
    c.font = '700 22px system-ui'; c.fillText('ROBOCAM CIRCUIT · EN DIRECT', 256, 105);
    texTV.needsUpdate = true;
  });

  // 3. Canapé d'angle + table basse + 2 bancs
  meuble(1.1, 0.45, 5.4, 12.6, 0.23, 116, tissu);                       // assise
  meuble(0.35, 0.95, 5.4, 12.1, 0.6, 116, tissu, false);                // dossier
  meuble(2.6, 0.45, 1.1, 14.4, 0.23, 113.8, tissu);                     // retour (méridienne)
  for (const dz of [-2.5, 2.5]) meuble(1.1, 0.7, 0.35, 12.6, 0.5, 116 + dz * 1.08, tissu, false);   // accoudoirs
  for (const dz of [-1.5, 0, 1.5]) meuble(0.25, 0.4, 0.8, 12.35, 0.85, 116 + dz, std('#8c96a3', 0.95), false);   // coussins
  meuble(1.4, 0.06, 2.4, 16.8, 0.42, 116.4, verre, false);              // table basse en verre
  meuble(1.2, 0.38, 2.2, 16.8, 0.19, 116.4, bois);
  for (const [x, z] of [[17, 108.5], [17, 123.5]]) {                    // bancs modernes (bois + acier)
    meuble(3.2, 0.1, 0.8, x, 0.48, z, boisClair);
    for (const dx of [-1.4, 1.4]) meuble(0.08, 0.45, 0.7, x + dx, 0.22, z, acier, false);
  }

  // 4. Le bar avec ses tabourets, et le frigo
  meuble(1.0, 1.1, 11, 21.6, 0.55, 151, noirMat);                       // comptoir
  meuble(1.2, 0.08, 11.2, 21.6, 1.14, 151, std('#d8d4cc', 0.25, 0.1), false);   // plateau en marbre
  meuble(0.04, 0.06, 11, 21.05, 0.95, 151, lumiere('#ff3fb4'), false);  // LED sous le plateau
  for (let z = 147; z <= 155; z += 2.6) {                               // tabourets
    meuble(0.1, 0.8, 0.1, 20.1, 0.4, z, acier, false);
    const assise = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), cuir); assise.position.set(20.1, Y + 0.85, z); scene.add(assise);
  }
  for (const yb of [1.6, 2.4]) meuble(0.35, 0.05, 9, GARAGE.x2 - 0.25, yb, 151, verre, false);   // étagères
  for (let k = 0; k < 18; k++) {                                        // bouteilles lumineuses
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.36, 8), lumiere(['#ff3fb4', '#35d6ff', '#ffd23f', '#3ef08a'][k % 4]));
    b.position.set(GARAGE.x2 - 0.25, Y + (k < 9 ? 1.81 : 2.61), 147 + (k % 9) * 1.0); scene.add(b);
  }
  meuble(0.9, 2.1, 1.0, GARAGE.x2 - 0.6, 1.05, 143.5, acier);           // frigo

  // 5. Simulateur de course (siège baquet + 3 écrans) et borne d'arcade
  meuble(1.6, 0.1, 1.0, 16, 0.6, 163.5, noirMat);
  const ecransSim = new THREE.MeshStandardMaterial({ color: '#000', emissive: '#4fd8ff', emissiveIntensity: 0.7 });
  for (const [dx, ry] of [[-1.05, 0.5], [0, 0], [1.05, -0.5]]) {
    const e = meuble(1.0, 0.6, 0.05, 16 + dx, 1.35, 165.6 + Math.abs(dx) * -0.25, ecransSim, false); e.rotation.y = ry;
  }
  meuble(0.7, 0.55, 0.6, 16, 0.4, 162.4, std('#d8262f', 0.45));         // baquet rouge
  meuble(0.7, 0.9, 0.15, 16, 0.85, 162.05, std('#d8262f', 0.45), false);
  const borne = meuble(0.9, 1.9, 0.9, 7.5, 0.95, 166.4, std('#4b2a8a', 0.5));
  meuble(0.7, 0.5, 0.05, 7.5, 1.45, 165.93, new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ff5fd2', emissiveIntensity: 0.9 }), false);

  // 6. Billard et sac de frappe
  meuble(2.6, 0.12, 1.5, 10.5, 0.85, 153, std('#1f7a4a', 0.95));
  meuble(2.8, 0.15, 1.7, 10.5, 0.78, 153, bois, false);
  for (const [dx, dz] of [[-1.1, -0.55], [1.1, -0.55], [-1.1, 0.55], [1.1, 0.55]]) meuble(0.14, 0.72, 0.14, 10.5 + dx, 0.36, 153 + dz, bois, false);
  const sac = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.4, 16), std('#b8262f', 0.6)); sac.position.set(6, Y + 2.3, 160); scene.add(sac);
  const chaine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 3, 4), acier); chaine.position.set(6, Y + 4.5, 160); scene.add(chaine);
  animations.push(() => { sac.rotation.z = Math.sin(tempsJeu * 1.3) * 0.06; });

  // 7. Établi, coffre à outils rouge et racks de pneus contre le mur ouest (entre les voitures)
  for (const z of [111, 125, 139, 153]) {
    meuble(0.9, 1.0, 1.8, GARAGE.x1 + 0.6, 0.5, z, std('#c4202a', 0.4, 0.3));
    meuble(0.05, 1.6, 3.2, GARAGE.x1 + 0.05, 2.2, z, std('#3a3f47', 0.8), false);   // panneau à outils
    for (let k = 0; k < 3; k++) {
      const pneu = new THREE.Mesh(new THREE.TorusGeometry(0.33, 0.15, 8, 18), noirMat); pneu.position.set(GARAGE.x1 + 0.6, Y + 1.3 + k * 0.32, z + 1.6);
      pneu.rotation.x = Math.PI / 2; scene.add(pneu);
    }
  }
  // 8. Plantes
  for (const [x, z] of [[10, 98], [23, 129], [23, 141], [4, 166]]) {
    meuble(0.7, 0.8, 0.7, x, 0.4, z, std('#e9e7e2', 0.6));
    for (let k = 0; k < 4; k++) {
      const f = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55, 0), std('#3f8a3f', 0.8));
      f.position.set(x + (hasard() - 0.5) * 0.5, Y + 1.2 + k * 0.45, z + (hasard() - 0.5) * 0.5); scene.add(f);
    }
  }
}

// --- Le coin DJ : table de mixage, 2 platines, 2 grosses enceintes, piste de danse lumineuse, boule à facettes
const DJ = { x: -15.6, z: 132 };
const POSITIONS_ENCEINTES = [[-14.6, GARAGE.y + 1.9, 125.4], [-14.6, GARAGE.y + 1.9, 138.6]];
const djVisuel = {};
{
  const Y = GARAGE.y;
  const noir = std('#121317', 0.5, 0.2), metal = std('#a9b0ba', 0.3, 0.8);
  const lum = c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 1.8 });
  const ajout = (geo, mat, x, y, z) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, Y + y, z); scene.add(m); return m; };
  // La table (façade lumineuse côté piste)
  ajout(new THREE.BoxGeometry(1.1, 1.0, 3.6), noir, DJ.x, 0.5, DJ.z);
  djVisuel.facade = new THREE.MeshStandardMaterial({ color: '#ff3fb4', emissive: '#ff3fb4', emissiveIntensity: 1 });
  ajout(new THREE.BoxGeometry(0.04, 0.12, 3.5), djVisuel.facade, DJ.x + 0.56, 0.8, DJ.z);
  ajout(new THREE.BoxGeometry(0.04, 0.12, 3.5), lum('#35d6ff'), DJ.x + 0.56, 0.25, DJ.z);
  obstacles.push({ boite: true, niveau: 'garage', minX: DJ.x - 0.6, maxX: DJ.x + 0.6, minZ: DJ.z - 1.85, maxZ: DJ.z + 1.85 });
  // 2 platines (le disque tourne quand la musique joue) + la table de mixage au milieu
  djVisuel.disques = [];
  for (const dz of [-1.1, 1.1]) {
    ajout(new THREE.BoxGeometry(0.9, 0.08, 0.9), std('#2a2d33', 0.4, 0.5), DJ.x, 1.04, DJ.z + dz);
    const disque = ajout(new THREE.CylinderGeometry(0.36, 0.36, 0.03, 32), std('#0b0b0d', 0.25, 0.3), DJ.x, 1.1, DJ.z + dz);
    const etiquette = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.035, 20), lum(dz < 0 ? '#ff3fb4' : '#35d6ff'));
    const repere = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.036, 0.2), std('#ffffff', 0.5)); repere.position.x = 0.2;
    disque.add(etiquette, repere); djVisuel.disques.push(disque);
    const bras = ajout(new THREE.BoxGeometry(0.04, 0.04, 0.5), metal, DJ.x - 0.3, 1.16, DJ.z + dz + 0.12); bras.rotation.y = 0.5;
  }
  ajout(new THREE.BoxGeometry(0.7, 0.1, 0.55), std('#1c1f24', 0.4, 0.5), DJ.x, 1.06, DJ.z);
  djVisuel.leds = [];
  for (let k = 0; k < 6; k++) {                                         // petites LED de niveau sur la table de mixage
    const led = ajout(new THREE.BoxGeometry(0.04, 0.02, 0.05), new THREE.MeshStandardMaterial({ color: '#30ff8a', emissive: k > 3 ? '#ff3a3a' : '#30ff8a', emissiveIntensity: 0.2 }),
                      DJ.x + 0.2 - k * 0.07, 1.12, DJ.z - 0.15);
    djVisuel.leds.push(led.material);
  }
  for (let k = 0; k < 3; k++) ajout(new THREE.CylinderGeometry(0.03, 0.03, 0.06, 10), metal, DJ.x - 0.05 - k * 0.12, 1.14, DJ.z + 0.12);
  const casque = ajout(new THREE.TorusGeometry(0.13, 0.025, 8, 20, Math.PI), noir, DJ.x - 0.35, 1.18, DJ.z + 0.55); casque.rotation.y = 0.4;

  // 2 grosses enceintes : les haut-parleurs « poussent » au rythme des basses
  djVisuel.membranes = [];
  for (const [x, y0, z] of POSITIONS_ENCEINTES) {
    const caisson = ajout(new THREE.BoxGeometry(1.3, 3.0, 1.2), std('#16171b', 0.75), x, 1.5, z);
    caisson.castShadow = false;
    obstacles.push({ boite: true, niveau: 'garage', minX: x - 0.65, maxX: x + 0.65, minZ: z - 0.6, maxZ: z + 0.6 });
    for (const [h, r] of [[0.75, 0.44], [1.75, 0.44], [2.6, 0.16]]) {
      const anneau = ajout(new THREE.TorusGeometry(r + 0.03, 0.04, 8, 32), metal, x + 0.66, h, z); anneau.rotation.y = Math.PI / 2;
      const membrane = ajout(new THREE.ConeGeometry(r, r * 0.45, 32, 1, true), std('#2c2e34', 0.65), x + 0.62, h, z);
      membrane.rotation.z = -Math.PI / 2;                                  // le cône regarde vers la piste
      const cache = ajout(new THREE.CircleGeometry(r * 0.32, 20), std('#3a3d44', 0.4, 0.4), x + 0.64 - r * 0.2, h, z); cache.rotation.y = Math.PI / 2;
      djVisuel.membranes.push({ membrane, cache, x0: x + 0.62, cx0: cache.position.x, grave: r > 0.3 });
    }
    ajout(new THREE.BoxGeometry(0.03, 0.06, 1.0), lum('#ff3fb4'), x + 0.66, 3.0, z);   // liseré lumineux en haut
  }
  // Piste de danse : 8 × 8 dalles qui s'allument en rythme (une seule image qu'on redessine)
  const toile = document.createElement('canvas'); toile.width = toile.height = 8;
  djVisuel.toilePiste = toile;
  djVisuel.texPiste = new THREE.CanvasTexture(toile); djVisuel.texPiste.magFilter = THREE.NearestFilter; djVisuel.texPiste.minFilter = THREE.NearestFilter;
  const piste = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshStandardMaterial({ map: djVisuel.texPiste, emissive: '#ffffff', emissiveMap: djVisuel.texPiste, emissiveIntensity: 0.9, roughness: 0.3 }));
  piste.rotation.x = -Math.PI / 2; piste.position.set(-8.6, Y + 0.025, DJ.z); scene.add(piste);
  // Boule à facettes et faisceaux de lumière
  djVisuel.boule = ajout(new THREE.IcosahedronGeometry(0.55, 2), new THREE.MeshStandardMaterial({ color: '#dfe6ee', roughness: 0.05, metalness: 1, flatShading: true }), -8.6, 5.4, DJ.z);
  ajout(new THREE.CylinderGeometry(0.01, 0.01, 0.9, 4), metal, -8.6, 6.1, DJ.z);
  djVisuel.faisceaux = [];
  for (const c of ['#ff3fb4', '#35d6ff', '#ffd23f']) {
    const geo = new THREE.ConeGeometry(1.1, 6, 20, 1, true); geo.translate(0, -3, 0);
    const f = ajout(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }), -8.6, 6.3, DJ.z);
    djVisuel.faisceaux.push(f);
  }
  // Enseigne néon au mur derrière le DJ
  {
    const t = document.createElement('canvas'); t.width = 512; t.height = 128;
    const c = t.getContext('2d'); c.font = 'italic 900 78px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#35d6ff'; c.shadowBlur = 22; c.fillStyle = '#d6f6ff'; c.fillText('BITCHA SOUND', 256, 66);
    const e = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.75), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(t), transparent: true, blending: THREE.AdditiveBlending }));
    e.position.set(GARAGE.x1 + 0.12, Y + 4.2, DJ.z); e.rotation.y = Math.PI / 2; scene.add(e);
  }
  // L'animation (seulement quand on est au garage)
  let tCouleur = 0;
  animations.push(dt => {
    const y = enVoiture ? vehicule.position.y : etat.y;
    if (y > -10.5) return;
    const joue = dj.id && !dj.el.paused, b = dj.basses, a = dj.aigus;
    for (const d of djVisuel.disques) if (joue) d.rotation.y -= dt * 3.5;
    for (const m of djVisuel.membranes) {
      const pousse = (m.grave ? b : a) * (m.grave ? 0.16 : 0.05);
      m.membrane.position.x = m.x0 + pousse; m.cache.position.x = m.cx0 + pousse;
    }
    djVisuel.facade.emissiveIntensity = 0.6 + b * 2.5;
    djVisuel.leds.forEach((mat, k) => { mat.emissiveIntensity = b * 6 > k ? 2 : 0.1; });
    djVisuel.boule.rotation.y += dt * 0.6;
    djVisuel.faisceaux.forEach((f, k) => {
      f.rotation.x = 0.55 * Math.sin(tempsJeu * (0.7 + k * 0.23) + k * 2);
      f.rotation.z = 0.55 * Math.cos(tempsJeu * (0.6 + k * 0.31) + k);
      f.material.opacity = joue ? 0.08 + b * 0.25 : 0.04;
    });
    tCouleur += dt;
    if (tCouleur > (joue ? 0.11 : 0.6)) {
      tCouleur = 0;
      const c = djVisuel.toilePiste.getContext('2d');
      const couleurs = ['#ff3fb4', '#35d6ff', '#ffd23f', '#3ef08a', '#8f5bff'];
      for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) {
        const allume = joue ? Math.random() < 0.25 + b * 0.6 : (i + j) % 2 === 0;
        c.fillStyle = allume ? couleurs[Math.floor(Math.random() * couleurs.length)] : '#14151a';
        c.fillRect(i, j, 1, 1);
      }
      djVisuel.texPiste.needsUpdate = true;
    }
  });
}

// --- Le STAND DE TIR : une salle derrière le mur du fond du garage (porte à gauche, près de la Furia blanche)
const STAND = { x1: -16, x2: 8, z1: 168.5, z2: 196, ligne: 177.4, porte: [-15.5, -11.5], couloirs: [-11, -4, 3], zCible: 191.5 };
const surfacesTir = [];                                  // ce que les balles peuvent toucher (murs, sol, comptoir…)
const cibles = [];                                       // les cibles en papier
let casier = null;
{
  const Y = GARAGE.y, H = GARAGE.plafond - GARAGE.y, yc = Y + H / 2;
  const matMurStand = std('#3b3f46', 0.9), matBerme = std('#1a1b1f', 1), matBoisS = std('#6e4a2f', 0.6);
  const mur = (l, h, p, x, y, z, mat) => { const m = boite(l, h, p, x, y, z, mat, 'garage'); surfacesTir.push(m); return m; };
  // Sol, plafond, murs
  const sol = new THREE.Mesh(new THREE.PlaneGeometry(STAND.x2 - STAND.x1, STAND.z2 - STAND.z1), std('#2a2c31', 0.8));
  sol.rotation.x = -Math.PI / 2; sol.position.set((STAND.x1 + STAND.x2) / 2, Y + 0.005, (STAND.z1 + STAND.z2) / 2); sol.receiveShadow = true; scene.add(sol); surfacesTir.push(sol);
  const plaf = boite(STAND.x2 - STAND.x1 + 2, 0.5, STAND.z2 - STAND.z1 + 1.5, (STAND.x1 + STAND.x2) / 2, GARAGE.plafond + 0.25, (STAND.z1 + STAND.z2) / 2 + 0.5, std('#1b1d22', 0.9), 'aucun', false);
  surfacesTir.push(plaf);
  mur(1, H, STAND.z2 - STAND.z1 + 1, STAND.x1 - 0.5, yc, (STAND.z1 + STAND.z2) / 2, matMurStand);
  mur(1, H, STAND.z2 - STAND.z1 + 1, STAND.x2 + 0.5, yc, (STAND.z1 + STAND.z2) / 2, matMurStand);
  mur(STAND.x2 - STAND.x1 + 2, H, 1, (STAND.x1 + STAND.x2) / 2, yc, STAND.z2 + 0.5, matMurStand);
  // Butte de tir au fond (caoutchouc noir incliné qui arrête les balles)
  const berme = new THREE.Mesh(new THREE.BoxGeometry(STAND.x2 - STAND.x1, 4.2, 1.4), matBerme);
  berme.position.set((STAND.x1 + STAND.x2) / 2, Y + 2.1, STAND.z2 - 0.9); berme.rotation.x = -0.25; scene.add(berme); surfacesTir.push(berme);
  // Comptoir de tir (on reste derrière) et cloisons entre les 3 postes
  mur(STAND.x2 - STAND.x1, 1.05, 0.7, (STAND.x1 + STAND.x2) / 2, Y + 0.52, STAND.ligne, std('#202227', 0.6, 0.3));
  const plateau = new THREE.Mesh(new THREE.BoxGeometry(STAND.x2 - STAND.x1, 0.06, 0.8), matBoisS); plateau.position.set((STAND.x1 + STAND.x2) / 2, Y + 1.07, STAND.ligne); scene.add(plateau); surfacesTir.push(plateau);
  for (const x of [-7.5, -0.5]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 3.2), std('#4a4f58', 0.7, 0.2)); c.position.set(x, Y + 1.15, STAND.ligne - 1.2); scene.add(c); surfacesTir.push(c);
    obstacles.push({ boite: true, niveau: 'garage', minX: x - 0.1, maxX: x + 0.1, minZ: STAND.ligne - 2.8, maxZ: STAND.ligne + 0.4 });
  }
  // Numéros des postes au sol + bandes lumineuses au plafond
  STAND.couloirs.forEach((x, k) => {
    const t = document.createElement('canvas'); t.width = t.height = 64;
    const c = t.getContext('2d'); c.fillStyle = '#FFD23F'; c.font = '900 52px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(k + 1), 32, 36);
    const n = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(t), transparent: true }));
    n.rotation.x = -Math.PI / 2; n.position.set(x, Y + 0.02, STAND.ligne - 1.6); scene.add(n);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, STAND.zCible - STAND.ligne), matNeon); led.position.set(x, GARAGE.plafond - 0.05, (STAND.ligne + STAND.zCible) / 2); scene.add(led);
    const spot = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.05, 0.3), new THREE.MeshStandardMaterial({ color: '#fff7e0', emissive: '#fff3d0', emissiveIntensity: 2.4 }));
    spot.position.set(x, GARAGE.plafond - 0.05, STAND.zCible - 1.2); scene.add(spot);
  });
  for (let z = 170; z < STAND.ligne - 0.5; z += 3) {
    const led = new THREE.Mesh(new THREE.BoxGeometry(20, 0.05, 0.3), matNeon); led.position.set(-4, GARAGE.plafond - 0.05, z); scene.add(led);
  }
  // Ligne jaune au sol + panneau néon « STAND DE TIR »
  const ligneSol = new THREE.Mesh(new THREE.PlaneGeometry(STAND.x2 - STAND.x1, 0.12), matJaune); ligneSol.rotation.x = -Math.PI / 2; ligneSol.position.set(-4, Y + 0.015, STAND.ligne - 0.5); scene.add(ligneSol);
  {
    const t = document.createElement('canvas'); t.width = 512; t.height = 128;
    const c = t.getContext('2d'); c.font = 'italic 900 70px system-ui, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = '#ff3a3a'; c.shadowBlur = 20; c.fillStyle = '#ffd6d6'; c.fillText('STAND DE TIR', 256, 66);
    const e = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(t), transparent: true, blending: THREE.AdditiveBlending }));
    e.position.set(-13.5, Y + 4.6, GARAGE.z2 - 0.05); e.rotation.y = Math.PI; scene.add(e);      // au-dessus de la porte, côté garage
    const e2 = e.clone(); e2.position.set(-4, Y + 4.8, STAND.z1 + 0.62); e2.rotation.y = 0; scene.add(e2);   // dans la salle
  }
  // Les cibles : papier avec anneaux (10 au centre), sur un cadre, suspendues à un rail
  const t = document.createElement('canvas'); t.width = 256; t.height = 352;
  {
    const c = t.getContext('2d');
    c.fillStyle = '#f3efe4'; c.fillRect(0, 0, 256, 352);
    for (let k = 10; k >= 1; k--) {
      const r = k * 11.5;
      c.beginPath(); c.arc(128, 150, r, 0, Math.PI * 2);
      c.fillStyle = k > 7 ? (k % 2 ? '#141414' : '#141414') : k % 2 ? '#f3efe4' : '#f3efe4'; c.fill();
      c.lineWidth = 2; c.strokeStyle = k > 7 ? '#f3efe4' : '#141414'; c.stroke();
    }
    c.fillStyle = '#e23b3b'; c.beginPath(); c.arc(128, 150, 6, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#141414'; c.font = '700 20px system-ui'; c.textAlign = 'center';
    for (let k = 1; k <= 9; k++) c.fillText(String(k), 128 + (10 - k) * 11.5 + 5, 157);
    c.font = 'italic 900 26px system-ui'; c.fillText("MAN'SCAVE", 128, 318);
  }
  const texCible = new THREE.CanvasTexture(t);
  const matCible = new THREE.MeshStandardMaterial({ map: texCible, roughness: 0.9, side: THREE.DoubleSide });
  // Le papier fait 0,8 × 1,1 m ; le centre des anneaux est à 150 px sur 352 depuis le haut
  STAND.couloirs.forEach(x => {
    const support = new THREE.Group(); support.position.set(x, Y + 2.6, STAND.zCible); scene.add(support);   // le centre des anneaux à hauteur des yeux
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, STAND.zCible - STAND.ligne + 1), std('#8d939b', 0.4, 0.7));
    rail.position.set(x, GARAGE.plafond - 0.3, (STAND.zCible + STAND.ligne) / 2); scene.add(rail);
    const papier = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.1), matCible);
    papier.position.y = -1.1; papier.rotation.y = Math.PI;             // face au tireur (qui regarde vers +z)
    const cadre = new THREE.Mesh(new THREE.BoxGeometry(0.86, 1.16, 0.03), std('#2b2f36', 0.6)); cadre.position.set(0, -1.1, 0.03);
    const tige = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, GARAGE.plafond - (Y + 2.6) - 0.3, 6), std('#8d939b', 0.4, 0.7));
    tige.position.y = (GARAGE.plafond - (Y + 2.6) - 0.3) / 2;
    support.add(papier, cadre, tige);
    cibles.push({ papier, support, x, balancement: 0, vitesse: 0, trous: [] });
    surfacesTir.push(cadre);
  });
  // Le casier à armes (on prend / range le pistolet avec E)
  {
    const g = new THREE.Group(); g.position.set(STAND.x2 - 0.55, Y, 171.5); g.rotation.y = -Math.PI / 2; scene.add(g);
    const caisse = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 0.7), std('#2b2f36', 0.45, 0.6)); caisse.position.y = 1.1; g.add(caisse);
    const fond = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.5), std('#3a3f47', 0.85)); fond.position.set(0, 1.35, 0.351); g.add(fond);
    const vitre = new THREE.Mesh(new THREE.PlaneGeometry(1.84, 1.55), new THREE.MeshPhysicalMaterial({ color: '#bfe6ff', roughness: 0.05, metalness: 0, transparent: true, opacity: 0.18 }));
    vitre.position.set(0, 1.35, 0.4); g.add(vitre);
    const led = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.04, 0.04), new THREE.MeshStandardMaterial({ color: '#ff3a3a', emissive: '#ff3a3a', emissiveIntensity: 2 })); led.position.set(0, 2.08, 0.36); g.add(led);
    const tiroir = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.4, 0.05), std('#202227', 0.5, 0.5)); tiroir.position.set(0, 0.3, 0.36); g.add(tiroir);
    for (let k = 0; k < 3; k++) {                                        // boîtes de munitions
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.2), std('#4d5a2a', 0.7)); b.position.set(-0.6 + k * 0.4, 0.7, 0.2); g.add(b);
    }
    casier = { groupe: g, pistolets: [], x: STAND.x2 - 0.9, z: 171.5 };
    surfacesTir.push(caisse);
    obstacles.push({ boite: true, niveau: 'garage', minX: STAND.x2 - 0.9, maxX: STAND.x2, minZ: 170.5, maxZ: 172.5 });
  }
}

// --- La porte du stand de tir : elle coulisse, et s'ouvre avec un code tapé sur le clavier (le code n'est écrit nulle part)
const porte = { ouverte: false, t: 0, minuteur: 0, x0: -13.5, z: GARAGE.z2 + 0.5, obstacle: null };
{
  const Y = GARAGE.y;
  const g = new THREE.Group(); g.position.set(porte.x0, Y, porte.z); scene.add(g);
  const panneau = new THREE.Mesh(new THREE.BoxGeometry(4.05, 3.0, 0.16), std('#3c424b', 0.45, 0.7)); panneau.position.y = 1.5; g.add(panneau);
  const rayures = matRayure.clone(); rayures.map = matRayure.map.clone(); rayures.map.needsUpdate = true; rayures.map.wrapS = THREE.RepeatWrapping; rayures.map.repeat.set(4, 1);
  for (const dz of [-0.085, 0.085]) {
    const bande = new THREE.Mesh(new THREE.PlaneGeometry(4.05, 0.32), rayures); bande.position.set(0, 0.5, dz); if (dz < 0) bande.rotation.y = Math.PI; g.add(bande);
    const hublot = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshPhysicalMaterial({ color: '#7fb6d6', roughness: 0.1, transparent: true, opacity: 0.55 }));
    hublot.position.set(0.9, 1.9, dz * 1.02); if (dz < 0) hublot.rotation.y = Math.PI; g.add(hublot);
  }
  porte.groupe = g;
  porte.matVoyant = new THREE.MeshStandardMaterial({ color: '#ff3030', emissive: '#ff3030', emissiveIntensity: 2 });
  // Le clavier dehors (côté garage) et le bouton dedans (côté stand)
  for (const [z, rot, dedans] of [[porte.z - 0.52, Math.PI, false], [porte.z + 0.52, 0, true]]) {
    const boitier = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, 0.06), std('#1c1f24', 0.4, 0.6)); boitier.position.set(-10.85, Y + 1.45, z); boitier.rotation.y = rot; scene.add(boitier);
    const ecranP = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.07), porte.matVoyant); ecranP.position.set(-10.85, Y + 1.6, z + (dedans ? 0.035 : -0.035)); ecranP.rotation.y = rot; scene.add(ecranP);
    if (!dedans) for (let k = 0; k < 12; k++) {
      const touche = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.012), std('#9aa1aa', 0.4, 0.6));
      touche.position.set(-10.85 + ((k % 3) - 1) * 0.07, Y + 1.5 - Math.floor(k / 3) * 0.055, z - 0.036); scene.add(touche);
    } else {
      const bouton = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 20), new THREE.MeshStandardMaterial({ color: '#30d07a', emissive: '#30d07a', emissiveIntensity: 1.2 }));
      bouton.rotation.x = Math.PI / 2; bouton.position.set(-10.85, Y + 1.42, z + 0.04); scene.add(bouton);
    }
  }
  porte.obstacle = { boite: true, niveau: 'garage', minX: -15.5, maxX: -11.5, minZ: porte.z - 0.5, maxZ: porte.z + 0.5 };
  obstacles.push(porte.obstacle);
}
// Les empreintes des codes (on ne garde jamais les codes eux-mêmes dans le jeu) : porte du stand de tir et niveau -3
const EMPREINTE_CODE = 0x26eaa420, EMPREINTE_TRIP = 0xb2f55327;
function empreinte(texte, sel = 'manscave-porte:') { let h = 0x811c9dc5; for (const c of new TextEncoder().encode(sel + texte)) { h ^= c; h = Math.imul(h, 0x01000193) >>> 0; } return h; }
const presClavier = () => !enVoiture && etat.y < -10.5 && Math.hypot(etat.x + 10.85, etat.z - (porte.z - 1.1)) < 1.8;
const presBoutonInterieur = () => !enVoiture && etat.y < -10.5 && Math.hypot(etat.x + 10.85, etat.z - (porte.z + 1.1)) < 1.8;
function ouvrirPorte(venantDAutrui = false) {
  if (!venantDAutrui) porte.commande = Date.now();       // envoyée aux autres joueurs
  if (porte.ouverte) return;
  porte.ouverte = true; porte.minuteur = 7;
  const k = obstacles.indexOf(porte.obstacle); if (k >= 0) obstacles.splice(k, 1);
  sonArme('porte');
}
function fermerPorte() {
  porte.ouverte = false;
  if (!obstacles.includes(porte.obstacle)) obstacles.push(porte.obstacle);
  sonArme('porte');
}
// Le pavé numérique à l'écran
// Il sert à deux choses : la porte du stand de tir (mode 'porte') et le bouton -3 de l'ascenseur (mode 'trip')
const clavier = { ouvert: false, saisie: '', mode: 'porte' };
function ouvrirClavier(mode = 'porte') {
  clavier.ouvert = true; clavier.saisie = ''; clavier.mode = mode; majClavier('');
  document.querySelector('#clavier-code .code-tete b').textContent = mode === 'trip' ? 'ASCENSEUR · NIVEAU -3 PRIVÉ' : 'ACCÈS STAND DE TIR';
  $('clavier-code').classList.add('ouvert');
  if (document.pointerLockElement) { liberationVoulue = true; document.exitPointerLock(); }
  for (const k in touches) touches[k] = false;
}
function fermerClavier() { clavier.ouvert = false; $('clavier-code').classList.remove('ouvert'); capturerSouris(); }
function majClavier(etatEcran) {
  const ecran = $('code-ecran');
  ecran.textContent = clavier.saisie.length ? '•'.repeat(clavier.saisie.length) : '— — — —';
  ecran.className = etatEcran;
}
function toucheClavier(v) {
  if (v === 'effacer') clavier.saisie = clavier.saisie.slice(0, -1);
  else if (v === 'ok') {
    const trip = clavier.mode === 'trip';
    if (trip ? empreinte(clavier.saisie, 'manscave-trip:') === EMPREINTE_TRIP : empreinte(clavier.saisie) === EMPREINTE_CODE) {
      sonArme('bip'); majClavier('bon');
      if (trip) appelerAscenseur('-3', true); else ouvrirPorte();
      setTimeout(fermerClavier, 450);
      return;
    }
    sonArme('erreur'); majClavier('faux'); clavier.saisie = '';
    setTimeout(() => majClavier(''), 700);
    return;
  } else if (clavier.saisie.length < 8) clavier.saisie += v;
  sonArme('bip'); majClavier('');
}
document.querySelectorAll('#clavier-code [data-v]').forEach(b => b.addEventListener('click', () => toucheClavier(b.dataset.v)));
document.getElementById('code-fermer').addEventListener('click', fermerClavier);
const CHIFFRES_AZERTY = { '&': '1', 'é': '2', '"': '3', "'": '4', '(': '5', '-': '6', 'è': '7', '_': '8', 'ç': '9', 'à': '0' };
function majPorte(dt) {
  porte.t += ((porte.ouverte ? 1 : 0) - porte.t) * Math.min(1, dt * 3.2);
  porte.groupe.position.x = porte.x0 - porte.t * 4.1;          // elle coulisse dans le mur
  porte.matVoyant.color.set(porte.ouverte ? '#30ff8a' : '#ff3030'); porte.matVoyant.emissive.copy(porte.matVoyant.color);
  if (porte.ouverte) {
    const p = enVoiture ? vehicule.position : { x: etat.x, z: etat.z };
    const dansPassage = Math.abs(p.x - porte.x0) < 3.2 && Math.abs(p.z - porte.z) < 2.2;
    porte.minuteur = dansPassage ? Math.max(porte.minuteur, 2.5) : porte.minuteur - dt;
    if (porte.minuteur <= 0) fermerPorte();
  }
  const ind = $('indice-porte');
  const dehors = enJeu && !clavier.ouvert && !porte.ouverte && presClavier(), dedans = enJeu && !porte.ouverte && presBoutonInterieur();
  const texte = dehors ? '🔒 Porte verrouillée · touche E' : dedans ? '🚪 Ouvrir la porte · touche E' : '';
  if (ind.textContent !== texte) ind.textContent = texte;
  const montre = !!texte;
  if (montre !== (ind.style.display === 'block')) ind.style.display = montre ? 'block' : 'none';
}

// Économie : on ne dessine pas ce qu'on ne peut pas voir.
// Au garage (niveau -2), l'extérieur est invisible ; dehors, le garage est invisible.
const objetsGarage = scene.children.slice(debutGarage).filter(o => !voitures.some(v => v.groupe === o) && o.position.y < GARAGE.plafond);   // (le puits du niveau -1 reste toujours visible)
const objetsDehors = scene.children.slice(debutVille, finVille).concat(scene.children.slice(debutDehors, finDehors));
// Ce qu'on ne voit pas depuis le fond du parking : les immeubles et arbres de la ville, et tout le décor de la campagne
const objetsHauts = scene.children.slice(debutVille, finVille).filter(o => o.position.y > 0.1).concat(scene.children.slice(debutDecor, finDehors));
let zoneVisible = '';
function majVisibilite(y, z) {
  const zone = y < Y_TRIP ? 'trip' : y < -10.5 ? 'garage' : y < -3 ? (z > 105 ? 'parking' : 'sous-sol') : 'dehors';
  const puitsOuvert = ASC.y < SOUS_SOL.y - 0.3;          // la plateforme n'est pas en haut : on voit le garage par le trou
  if (zone + puitsOuvert === zoneVisible) return;
  zoneVisible = zone + puitsOuvert;
  renderer.shadowMap.autoUpdate = zone === 'dehors' || zone === 'sous-sol';   // sous terre, pas besoin de recalculer les ombres du soleil
  renderer.shadowMap.needsUpdate = true;
  // Au niveau -3, on ne voit que le hangar TRIP ; ailleurs, le hangar est caché
  const auTrip = zone === 'trip';
  for (const o of objetsTrip) o.visible = auTrip;
  for (const o of objetsHorsTrip) o.visible = !auTrip;
  for (const v of voitures) v.visibleEtage = (v.groupe.position.y < Y_TRIP) === auTrip
    && (!v.couleurFixe || zone !== 'dehors' || v.groupe.position.y > -10.5);   // une voiture du garage sortie reste visible
  if (auTrip) return;
  for (const o of objetsGarage) o.visible = zone === 'garage' || (zone !== 'dehors' && puitsOuvert);
  for (const o of objetsDehors) o.visible = zone !== 'garage';
  if (zone === 'parking') for (const o of objetsHauts) o.visible = false;
}
// --- Une fontaine au centre de la place (à la place de l'ancien plateau)
{
  const bassin = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.4, 0.7, 64, 1, true), std('#d5d8dd', 0.6));
  bassin.position.set(0, 0.35, -14); bassin.castShadow = bassin.receiveShadow = true; scene.add(bassin);
  const rebord = new THREE.Mesh(new THREE.TorusGeometry(7.1, 0.25, 10, 64), std('#e4e7eb', 0.5));
  rebord.rotation.x = Math.PI / 2; rebord.position.set(0, 0.72, -14); scene.add(rebord);
  const eau = new THREE.Mesh(new THREE.CircleGeometry(7, 64), new THREE.MeshPhysicalMaterial({ color: '#3d8fd1', roughness: 0.05, metalness: 0.1, clearcoat: 1, transparent: true, opacity: 0.85 }));
  eau.rotation.x = -Math.PI / 2; eau.position.set(0, 0.55, -14); scene.add(eau);
  const colonne = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 1.0, 3, 24), std('#d5d8dd', 0.5));
  colonne.position.set(0, 1.5, -14); colonne.castShadow = true; scene.add(colonne);
  const vasque = new THREE.Mesh(new THREE.SphereGeometry(1.8, 32, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std('#e4e7eb', 0.45));
  vasque.position.set(0, 3.4, -14); vasque.rotation.x = Math.PI; scene.add(vasque);
  const jets = [];
  const matJet = new THREE.MeshPhysicalMaterial({ color: '#cfeaff', roughness: 0.1, transparent: true, opacity: 0.55 });
  for (let k = 0; k < 8; k++) {
    const j = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), matJet); scene.add(j); jets.push({ j, a: (k / 8) * Math.PI * 2 });
  }
  animations.push(dt => {
    const t = performance.now() / 1000;
    for (const { j, a } of jets) {
      const p = (t * 0.8 + a / (Math.PI * 2)) % 1;
      j.position.set(Math.cos(a) * (1.8 + p * 4), 3.4 + Math.sin(p * Math.PI) * 2.2 - p * 2.6, -14 + Math.sin(a) * (1.8 + p * 4));
    }
  });
  obstacles.push({ x: 0, z: -14, rayon: 7.4 });
}

// =====================================================================
// 4b. OBSTACLES DE TEST sur la route en anneau : cônes et barrières
// =====================================================================
const cones = [];
const matCone = std('#ff6a1a', 0.55);
const matBlanc = std('#f4f4f4', 0.5);
function creerCone(x, z) {
  const g = new THREE.Group();
  const corps = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.85, 16), matCone); corps.position.y = 0.5;
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 0.7), matCone); base.position.y = 0.04;
  const bande = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.23, 0.12, 16), matBlanc); bande.position.y = 0.55;
  g.add(corps, base, bande);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.position.set(x, 0, z);
  scene.add(g);
  cones.push({ g, x, z, x0: x, z0: z, y: 0, vx: 0, vy: 0, vz: 0, chute: 0, touche: false });
}
// 6 rangées de 3 cônes en travers de la route : il faut passer entre eux
for (const a of [0.4, 2.55, 4.0, 5.3]) {
  for (const r of [37.2, 41, 44.8]) creerCone(Math.cos(a) * r, Math.sin(a) * r);
}
// Barrières rouges et blanches (un côté de la route, puis l'autre : slalom)
const matRouge = std('#e0262f', 0.5);
function creerBarriere(angle, rayon) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const bloc = new THREE.Mesh(new THREE.BoxGeometry(1, 0.9, 0.5), i % 2 ? matBlanc : matRouge);
    bloc.position.set(i - 2, 0.45, 0); bloc.castShadow = bloc.receiveShadow = true;
    g.add(bloc);
  }
  const x = Math.cos(angle) * rayon, z = Math.sin(angle) * rayon;
  g.position.set(x, 0, z);
  g.rotation.y = -angle + Math.PI / 2;                 // alignée avec la route
  scene.add(g);
  // Collision : 3 petits cercles le long de la barrière
  for (const k of [-1.6, 0, 1.6]) {
    obstacles.push({ x: x - Math.sin(angle) * k, z: z + Math.cos(angle) * k, rayon: 0.8 });
  }
}
[[2.85, 45.2], [2.25, 36.8], [1.9, 45.2]].forEach(([a, r]) => creerBarriere(a, r));   // (côté ouest : hors du circuit)

for (const v of voitures) {                            // un panneau au-dessus de chaque voiture exposée
  const p = creerPanneau(v.specs.nom, `${v.specs.moteur} · ${v.specs.kmh} km/h`);
  const pos = new THREE.Vector3(); v.groupe.getWorldPosition(pos);
  p.position.set(pos.x, pos.y + 3.6, pos.z);
  p.scale.multiplyScalar(0.75);
  scene.add(p);
  v.panneau = p;
}
// Ce qu'on cache au niveau -3 : la ville, le circuit du haut, le sous-sol, le garage… (ni les lumières, ni les voitures, ni leurs panneaux)
const finGarage = scene.children.length;
const objetsHorsTrip = [ciel].concat(scene.children.slice(debutVille, finGarage).filter(o => !o.isLight && o !== plateformeAsc
  && !voitures.some(v => v.groupe === o || v.panneau === o)));
