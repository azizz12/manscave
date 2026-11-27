// MAN'SCAVE — 12-conduite.js
// =====================================================================
// 7. LA VOITURE : monter / descendre, conduite et chocs
// =====================================================================
const $ = id => document.getElementById(id);

function voiturePlusProche() {
  let meilleure = null, dMin = Infinity;
  for (const v of voitures) {
    const p = new THREE.Vector3(); v.groupe.getWorldPosition(p);
    const d = Math.hypot(p.x - etat.x, p.z - etat.z) + Math.max(0, Math.abs(p.y - etat.y) - 1) * 3;
    if (d < dMin) { dMin = d; meilleure = v; }
  }
  return { voiture: meilleure, distance: dMin };
}
function distanceVoiture() { return voiturePlusProche().distance; }

// Monter dans la voiture ou en descendre (touche E)
function basculerVoiture() {
  if (!enJeu) return;
  if (!enVoiture) {
    const { voiture, distance } = voiturePlusProche();
    if (distance > 6) return;                            // trop loin
    // Cette voiture devient la voiture active
    voitureActive = voiture; vehicule = voiture.groupe; modele = voiture.modele; auto = voiture.auto; specs = voiture.specs;
    if (voiture.panneau) voiture.panneau.visible = false;
    auto.cap = vehicule.rotation.y; auto.vx = auto.vz = auto.vy = 0; auto.enLair = false; auto.rapport = 0; auto.rpm = specs.ralenti || 0;
    dessinerCompteur();
    demarrerMoteur();
    enVoiture = true;
    perso.visible = false; ombre.visible = false;
    vehicule.add(etiquette); etiquette.position.y = 2.2;   // le surnom passe au-dessus de la voiture
    angleCamera = 0;
  } else {
    if (Math.hypot(auto.vx, auto.vz) > 4) return;        // on ne saute pas d'une voiture lancée !
    if (auto.surCircuit && Math.abs(vehicule.position.y) > 1) { annoncer('Pas ici !', 'faux'); return; }   // pont ou tunnel
    enVoiture = false;
    // Le pilote ressort à gauche de la voiture
    etat.x = vehicule.position.x - Math.cos(auto.cap) * 2.1;
    etat.z = vehicule.position.z + Math.sin(auto.cap) * 2.1;
    etat.angle = auto.cap + Math.PI; etat.y = vehicule.position.y; etat.vitesseY = 0;
    perso.visible = true; ombre.visible = true;
    perso.add(etiquette); etiquette.position.y = 2.25;
    auto.vx = auto.vz = 0; auto.fumee = 0; auto.burnout = false;
    angleCamera = 0;
  }
}

// Touche E : presser le bouton de la console si on est à côté, sinon monter / descendre de voiture
const presConsole = () => !enVoiture && etat.y < -3 && etat.y > -10 && Math.hypot(etat.x - CONSOLE.x, etat.z - CONSOLE.z) < 2.4;
function actionE() {
  if (!enJeu) return;
  if (passager) { descendrePassager(); return; }
  if (presDJ()) { ouvrirDJ(); return; }
  if (presCasier()) { prendreOuRangerArme(); return; }
  if (!porte.ouverte && presClavier()) { ouvrirClavier(); return; }
  if (!porte.ouverte && presBoutonInterieur()) { ouvrirPorte(); return; }
  if (!enVoiture) {                                       // la voiture d'un ami juste à côté ? on monte côté passager
    const ami = voitureAmieProche();
    if (ami && ami.d <= voiturePlusProche().distance + 1.5) { monterPassager(ami.id); return; }   // la voiture d'un ami passe en priorité
  }
  if (presConsole()) {
    if (depart.etat === 'course' || depart.etat === 'sequence') return;
    depart.arme = !depart.arme;
    boutonCourse.position.y = 1.12; setTimeout(() => { boutonCourse.position.y = 1.16; }, 150);   // le bouton s'enfonce
    sonClic();
    annoncer(depart.arme ? 'Course prête !' : 'Course annulée', depart.arme ? 'go' : 'faux');
    return;
  }
  basculerVoiture();
}
// Vue à la première personne (cockpit / yeux du pilote) ou à la troisième personne
let vuePremiere = false;
function changerVue() {
  if (!enJeu) return;
  vuePremiere = !vuePremiere;
  $('btn-vue').textContent = vuePremiere ? 'Vue 3e' : 'Vue 1re';
  angleCamera = enVoiture ? 0 : angleCamera;
}

// Remettre la voiture au milieu de la piste, dans le bon sens (touche R)
function replacerVoiture() {
  if (!enVoiture || !enJeu) return;
  const info = trouverPiste(vehicule.position.x, vehicule.position.y, vehicule.position.z, auto.indicePiste ?? -1);
  if (!info) return;
  const s = info.s;
  vehicule.position.set(s.x, s.y, s.z);
  auto.cap = Math.atan2(-s.tx, -s.tz);                  // face au sens de la course
  auto.vx = auto.vz = auto.vy = 0; auto.enLair = false; auto.indicePiste = info.i; auto.rapport = 0;
  angleCamera = 0;
}

// --- Effets de choc : discrets (quelques étincelles, un bruit, une petite secousse)
const etincelles = [];
const geoEtincelle = new THREE.BoxGeometry(0.09, 0.09, 0.09);
const matEtincelles = ['#ffd45a', '#ff9a2e', '#ffffff'].map(c => new THREE.MeshBasicMaterial({ color: c }));
function jaillir(x, y, z, nombre) {
  for (let i = 0; i < nombre; i++) {
    const m = new THREE.Mesh(geoEtincelle, matEtincelles[i % 3]);
    m.position.set(x, y, z); scene.add(m);
    etincelles.push({ m, vx: (Math.random() - 0.5) * 12, vy: 2 + Math.random() * 7, vz: (Math.random() - 0.5) * 12, vie: 0.5 + Math.random() * 0.5 });
  }
}

let secousse = 0, dernierChoc = 0;
function choc(force, x, z) {
  const maintenant = performance.now();
  if (maintenant - dernierChoc < 250) return;            // un seul effet par contact
  dernierChoc = maintenant;
  const f = clamp(force / 20, 0.1, 1);                   // 0 = petit choc, 1 = gros choc
  secousse = Math.max(secousse, f * 0.5);
  jaillir(x, vehicule.position.y + 0.6, z, Math.round(4 + f * 12));
  sonChoc(f);
}

// --- Le moteur : quelle poussée donne la voiture ? (dépend du type de moteur et du rapport engagé)
function poussee(v) {
  const finCourse = 1 - Math.pow(clamp(v / specs.vmax, 0, 1), 8);    // la poussée s'écroule près de la vitesse max
  if (!specs.rapports) return specs.accel * finCourse;                // électrique : tout le couple, tout de suite
  if (auto.changement > 0) return 0;                                  // pendant le passage de rapport : coupure
  const couple = 0.72 + 0.28 * Math.sin(Math.PI * clamp(auto.regime * 1.05, 0, 1));   // courbe de couple
  const demultiplication = Math.pow(specs.rapports[0] / specs.rapports[auto.rapport], 0.4);  // 1re = plus de force
  return specs.accel * couple * demultiplication * finCourse;
}

// --- La boîte de vitesses automatique (voitures thermiques)
function boiteDeVitesses(dt, vAvant, gaz) {
  if (!specs.rapports) {                                              // électrique : un seul rapport
    auto.regime = clamp(Math.abs(vAvant) / specs.vmax, 0, 1);
    return;
  }
  auto.changement = Math.max(0, auto.changement - dt);
  const v = Math.max(0, vAvant);
  const n = specs.rapports.length;
  const haut = specs.rapports[auto.rapport];
  const bas = auto.rapport > 0 ? specs.rapports[auto.rapport - 1] : 0;
  auto.regime = clamp(v / haut, 0, 1.02);
  if (auto.regime > 0.97 && auto.rapport < n - 1 && gaz > 0 && auto.changement === 0) {
    auto.rapport++;                                                   // on passe le rapport supérieur
    auto.changement = specs.cylindres === 8 ? 0.16 : 0.24;            // la GT passe plus vite ses rapports
    modele.rotation.z = 0.02;                                         // petit à-coup visible (le nez plonge)
    sonChangement();
    if (modele.echappements && gaz > 0.5) explosionEchappement(0.45 + Math.random() * 0.35);   // « pop » au changement de rapport
  } else if (auto.rapport > 0 && v < bas * 0.7) {
    auto.rapport--;                                                   // rétrogradage
  }
  // Régime moteur en tours/minute (au moins le ralenti ; il monte quand on accélère à l'arrêt)
  const plage = specs.zoneRouge - specs.ralenti;
  const derniere = auto.rapport === specs.rapports.length - 1;
  const cible = specs.ralenti + clamp(v / specs.rapports[auto.rapport], 0, 1) * plage * (derniere ? 0.9 : 1);   // en dernière, on reste sous la zone rouge
  const aVide = specs.ralenti + gaz * 0.35 * plage;
  auto.rpm += (Math.max(cible, auto.rapport === 0 ? aVide : 0) - auto.rpm) * Math.min(1, dt * 12);
}

// --- La conduite (appelée à chaque image quand on est dans la voiture)
function conduire(dt, gaz, frein, direction, freinMain, burnout = false) {
  const VMAX_ARRIERE = -12, R = 2.0;                     // R = « rayon » de la voiture pour les collisions
  let avX = -Math.sin(auto.cap), avZ = -Math.cos(auto.cap);   // vecteur « devant »
  let drX = Math.cos(auto.cap), drZ = -Math.sin(auto.cap);    // vecteur « à droite »
  let vAvant = auto.vx * avX + auto.vz * avZ;            // vitesse vers l'avant
  let vCote = auto.vx * drX + auto.vz * drZ;             // glissade sur le côté
  const auSol0 = !auto.enLair;
  burnout = burnout && auSol0;
  auto.burnout = burnout;
  auto.gaz = burnout ? 1 : gaz;

  boiteDeVitesses(dt, vAvant, burnout ? 1 : gaz);
  if (burnout && specs.rapports) {                       // burnout : le moteur hurle près de la zone rouge
    const cibleTours = specs.ralenti + 0.82 * (specs.zoneRouge - specs.ralenti) + Math.sin(tempsJeu * 23) * 250;
    auto.rpm += (cibleTours - auto.rpm) * Math.min(1, dt * 7);
  }

  // Accélérer, freiner, reculer (en l'air, les roues ne touchent rien : pas d'effet)
  const auSolVoiture = !auto.enLair;
  if (auSolVoiture) {
    if (gaz > 0) vAvant += (vAvant < 0 ? specs.freinage : poussee(vAvant)) * gaz * dt;
    if (frein > 0) vAvant -= (vAvant > 0.5 ? specs.freinage : 9) * frein * dt;
    vAvant -= vAvant * (gaz || frein ? 0.004 : 0.3) * dt;              // frottements / roue libre
    if (freinMain) vAvant -= Math.sign(vAvant) * Math.min(Math.abs(vAvant), 12 * dt);
    vAvant -= 9 * (auto.penteAvant || 0) * dt;                       // la gravité dans les côtes et les descentes
    if (burnout) vAvant -= Math.sign(vAvant) * Math.min(Math.abs(vAvant), 22 * dt);   // les freins avant retiennent la voiture
  }
  // Accélérateur : une poussée en plus pendant 1,6 s, et on peut dépasser un peu la vitesse max
  auto.boost = Math.max(0, (auto.boost || 0) - dt);
  if (auto.boost > 0) vAvant += 18 * dt;
  vAvant = clamp(vAvant, VMAX_ARRIERE, auto.boost > 0 ? specs.vmax * 1.18 : specs.vmax + Math.max(0, vAvant - specs.vmax) * (1 - dt * 1.2));

  // Adhérence : chaque voiture a la sienne. La GT glisse un peu si on accélère fort en virage.
  let adherence = specs.adherence;
  if (specs.cylindres === 8 && gaz > 0 && Math.abs(auto.braquage) > 0.4 && vAvant > 12) adherence *= 0.62;
  if (freinMain) adherence = 1.3;
  if (auSolVoiture) vCote -= vCote * Math.min(1, adherence * dt);

  // Direction : progressive, et moins vive à grande vitesse
  auto.braquage += (direction - auto.braquage) * Math.min(1, dt * 8);
  const efficacite = Math.min(1, Math.abs(vAvant) / 6) * Math.sign(vAvant) * (1 - clamp(Math.abs(vAvant) / specs.vmax, 0, 1) * 0.55);
  auto.cap -= auto.braquage * specs.braquage * efficacite * dt * (freinMain ? 1.6 : 1) * (auSolVoiture ? 1 : 0.15);
  if (burnout) auto.cap -= auto.braquage * 1.5 * dt;     // burnout + direction : la voiture pivote sur place (donut)

  // Fumée des pneus : quand la voiture glisse sur le côté (drift), au frein à main, ou en burnout
  const glisseCote = Math.abs(vCote);
  let fumee = auSolVoiture ? clamp((glisseCote - 2.2) / 7, 0, 1) : 0;
  if (auSolVoiture && freinMain && Math.abs(vAvant) > 8) fumee = Math.max(fumee, 0.45);
  if (burnout) fumee = 1;
  auto.fumee = fumee;

  avX = -Math.sin(auto.cap); avZ = -Math.cos(auto.cap);
  drX = Math.cos(auto.cap); drZ = -Math.sin(auto.cap);
  auto.vx = avX * vAvant + drX * vCote;
  auto.vz = avZ * vAvant + drZ * vCote;

  // Les autres voitures sont aussi des obstacles
  const niveau = niveauDe(vehicule.position.y);
  const autres = voitures.filter(v => v !== voitureActive).map(v => {
    const p = new THREE.Vector3(); v.groupe.getWorldPosition(p);
    return { x: p.x, z: p.z, rayon: 2.0, niveau: niveauDe(p.y) };
  }).concat(bots.filter(b => b.pose).map(b => ({ x: b.pose.x, z: b.pose.z, rayon: 1.6, niveau: niveauDe(b.pose.y) })));
  const liste = obstacles.concat(autres);
  const listePiste = autres.concat(obstaclesPiste());
  const indiceAvant = auto.indicePiste ?? -1;

  // À grande vitesse, on avance par petits pas pour ne pas « traverser » les obstacles
  let nx = vehicule.position.x, nz = vehicule.position.z;
  let infoPiste = trouverPiste(nx, vehicule.position.y, nz, auto.indicePiste ?? -1);
  const pas = Math.max(1, Math.ceil(Math.hypot(auto.vx, auto.vz) * dt / 0.7));
  for (let k = 0; k < pas; k++) {
    nx += auto.vx * dt / pas; nz += auto.vz * dt / pas;
    infoPiste = trouverPiste(nx, vehicule.position.y, nz, infoPiste ? infoPiste.i : -1);
    const surPiste = infoPiste && infoPiste.type === 'piste' && infoPiste.dist < infoPiste.w + 4;
    if (surPiste) {
      // Sur le circuit : les murs de chaque côté retiennent la voiture
      const lim = infoPiste.w - 1.05, d = infoPiste.lat, s = infoPiste.s;
      if (Math.abs(d) > lim) {
        const cote = Math.sign(d);
        nx -= (d - cote * lim) * s.lx; nz -= (d - cote * lim) * s.lz;
        const vLat = auto.vx * s.lx + auto.vz * s.lz;
        if (vLat * cote > 0) {
          auto.vx -= 1.3 * vLat * s.lx; auto.vz -= 1.3 * vLat * s.lz;
          auto.vx *= 0.96; auto.vz *= 0.96;            // frottement contre le mur
          if (Math.abs(vLat) > 3) choc(Math.abs(vLat) * 1.3, nx + s.lx * cote * 1.05, nz + s.lz * cote * 1.05);
        }
      }
    }
    for (const o of (surPiste ? listePiste : liste)) {
      if (o.pieton || !memeNiveau(o, niveau)) continue;
      const px = o.boite ? clamp(nx, o.minX, o.maxX) : o.x;  // point de l'obstacle le plus proche
      const pz = o.boite ? clamp(nz, o.minZ, o.maxZ) : o.z;
      const dx = nx - px, dz = nz - pz;
      const d = Math.hypot(dx, dz);
      const min = o.boite ? R : R + o.rayon;
      if (d >= min) continue;
      let n1 = -avX, n2 = -avZ;                              // direction pour repousser la voiture
      if (d > 0.0001) { n1 = dx / d; n2 = dz / d; }
      nx += n1 * (min - d); nz += n2 * (min - d);
      const vitesseImpact = -(auto.vx * n1 + auto.vz * n2);
      if (vitesseImpact > 0) {                               // rebond
        auto.vx += 1.35 * vitesseImpact * n1; auto.vz += 1.35 * vitesseImpact * n2;
        auto.vx *= 0.8; auto.vz *= 0.8;
        if (vitesseImpact > 2.5) choc(vitesseImpact, nx - n1 * R, nz - n2 * R);
      }
    }
  }
  // Limites du monde
  nx = clamp(nx, -1500, 2600); nz = clamp(nz, -1400, 2900);
  if (infoPiste) auto.indicePiste = infoPiste.i;

  // Les cônes : on peut les percuter, ils s'envolent
  const vitesseTotale = Math.hypot(auto.vx, auto.vz);
  for (const c of cones) {
    if (c.touche || vehicule.position.y < -1) continue;
    const dx = c.x - nx, dz = c.z - nz, d = Math.hypot(dx, dz);
    if (d > R + 0.35 || d === 0) continue;
    c.touche = true;
    c.vx = dx / d * vitesseTotale * 0.6 + auto.vx * 0.7;
    c.vz = dz / d * vitesseTotale * 0.6 + auto.vz * 0.7;
    c.vy = 3 + vitesseTotale * 0.25;
    auto.vx *= 0.93; auto.vz *= 0.93;
    if (vitesseTotale > 1.5) choc(Math.max(4, vitesseTotale * 0.5), c.x, c.z);
  }

  // On applique la nouvelle position
  vehicule.position.x = nx; vehicule.position.z = nz;
  const surLeCircuit = infoPiste && infoPiste.type === 'piste' && infoPiste.dist < infoPiste.w + 4;
  auto.surCircuit = !!surLeCircuit;
  let inclinaison, roulis = 0;
  if (surLeCircuit) {
    // Sur le circuit : la hauteur vient de la piste (pont, tunnel, rampe, tremplins, virage relevé)
    const sol = infoPiste.y;
    const alignement = avX * infoPiste.s.tx + avZ * infoPiste.s.tz;
    if (auto.enLair) {
      auto.vy -= 24 * dt;                               // la gravité ramène la voiture
      vehicule.position.y += auto.vy * dt;
      if (vehicule.position.y <= sol) {                 // atterrissage !
        const impact = -auto.vy;
        vehicule.position.y = sol; auto.enLair = false; auto.vy = 0; auto.atterriA = tempsJeu;
        if (impact > 3) { secousse = Math.max(secousse, Math.min(0.6, impact / 18)); sonChoc(Math.min(1, impact / 14)); }
      }
      inclinaison = Math.atan2(auto.vy, Math.max(6, Math.abs(vAvant))) * 0.7;
    } else {
      const vyPiste = auto.solPrec !== undefined ? (sol - auto.solPrec) / dt : 0;
      if (auto.solPrec !== undefined && sol < vehicule.position.y - 0.3) {
        auto.enLair = true; auto.vy = auto.vyPrec || 0;  // le sol disparaît sous les roues : décollage
        if (auto.vy > -2) annoncer('Saut !', 'cp');
      } else {
        vehicule.position.y = sol;
        auto.vyPrec = vyPiste;
      }
      inclinaison = Math.atan(infoPiste.pente * alignement);
      // Sommet de bosse pris très vite : la route « tombe » plus vite que la gravité → la voiture décolle
      const vLong = vAvant * alignement, kv = infoPiste.s.kv;
      if (!auto.enLair && kv < 0 && vLong > 20 && vLong * vLong * -kv > 27 && !surTremplin(infoPiste.i) && tempsJeu - (auto.atterriA || 0) > 0.8) {
        auto.enLair = true; auto.vy = infoPiste.pente * vLong;
      }
    }
    auto.penteAvant = auto.enLair ? 0 : infoPiste.pente * alignement;
    auto.solPrec = sol;
    roulis = Math.atan(infoPiste.releve * (drX * infoPiste.s.lx + drZ * infoPiste.s.lz));
    // Accélérateurs : on passe sur une plaque ?
    if (!auto.enLair && indiceAvant >= 0) {
      for (const b of BOOSTS) {
        const k = (infoPiste.i - b.i + NB) % NB, kAvant = (indiceAvant - b.i + NB) % NB;
        if (k <= 3 && (kAvant > 3 || kAvant > k) && Math.abs(infoPiste.lat) < infoPiste.w * 0.6 && auto.boost < 1.2) {
          auto.boost = 1.6; sonBoost(); annoncer('Boost !', 'go');
        }
      }
    }
  } else {
    auto.solPrec = undefined; auto.enLair = false; auto.penteAvant = 0;
    const sol = hauteurSol(nx, nz, vehicule.position.y);
    vehicule.position.y += (sol - vehicule.position.y) * Math.min(1, dt * 12);
    // La voiture s'incline dans la rampe : on compare la hauteur du sol devant et derrière
    const hDevant = hauteurSol(nx + avX * 1.5, nz + avZ * 1.5, vehicule.position.y);
    const hDerriere = hauteurSol(nx - avX * 1.5, nz - avZ * 1.5, vehicule.position.y);
    inclinaison = Math.atan2(hDevant - hDerriere, 3);
  }
  vehicule.rotation.set(inclinaison, auto.cap, roulis, 'YXZ');

  // Roues : elles tournent avec la vitesse, et celles de devant braquent
  for (const r of modele.roues) {
    // En burnout, les roues arrière patinent à toute vitesse alors que la voiture ne bouge pas
    r.tourne.rotation.z += (burnout && !r.avant ? 48 : vAvant) * dt / r.rayon;
    if (r.avant) r.rotation.y = -auto.braquage * 0.45;
  }
  if (fumee > 0.02) emettreFumee(modele, fumee, dt, auto.vx, auto.vz);
  // La caisse penche dans les virages, se cabre à l'accélération et plonge au freinage
  const tangage = burnout ? -0.022 + Math.sin(tempsJeu * 41) * 0.004      // l'arrière s'écrase et la caisse vibre
    : clamp((frein > 0 && vAvant > 1 ? 0.02 : 0) - (gaz > 0 && auto.changement === 0 ? 0.012 : 0), -0.03, 0.03);
  modele.rotation.x = clamp(auto.braquage * efficacite * 0.07, -0.07, 0.07);
  modele.rotation.z += (tangage - modele.rotation.z) * Math.min(1, dt * 6);
  if (modele.volant) modele.volant.rotation.z = -auto.braquage * 1.6;   // le volant tourne avec les roues
  auto.vitesse = auto.vx * avX + auto.vz * avZ;          // vitesse réelle après les chocs (pour le compteur)
}

// Mise à jour des effets (étincelles, cônes qui tombent, flash…)
function majEffets(dt) {
  for (let i = etincelles.length - 1; i >= 0; i--) {
    const e = etincelles[i];
    e.vy -= 20 * dt;
    e.m.position.x += e.vx * dt; e.m.position.y += e.vy * dt; e.m.position.z += e.vz * dt;
    if (e.m.position.y < 0.05) { e.m.position.y = 0.05; e.vy *= -0.3; e.vx *= 0.6; e.vz *= 0.6; }
    e.vie -= dt;
    e.m.scale.setScalar(Math.max(0.01, e.vie * 1.6));
    if (e.vie <= 0) { scene.remove(e.m); etincelles.splice(i, 1); }
  }
  for (const c of cones) {
    if (!c.touche) continue;
    if (c.y > 0 || c.vy > 0 || Math.abs(c.vx) + Math.abs(c.vz) > 0.05) {
      c.vy -= 20 * dt;
      c.x += c.vx * dt; c.z += c.vz * dt; c.y += c.vy * dt;
      if (c.y < 0) { c.y = 0; c.vy = -c.vy * 0.3; c.vx *= 0.55; c.vz *= 0.55; }
      c.chute = Math.min(Math.PI / 2, c.chute + dt * 9);      // le cône bascule et finit couché
      c.g.position.set(c.x, c.y + (c.chute > 1 ? 0.3 : 0), c.z);
      c.g.rotation.set(c.chute, Math.atan2(c.vx, c.vz), 0, 'YXZ');
    }
  }
  secousse = Math.max(0, secousse - dt * 2.2);
}

// --- Fumée des pneus : des « sprites » (images toujours tournées vers la caméra) qui grossissent et s'effacent
const texFumee = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const d = g.createRadialGradient(32, 32, 2, 32, 32, 31);
  d.addColorStop(0, 'rgba(255,255,255,1)'); d.addColorStop(0.45, 'rgba(255,255,255,.5)'); d.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = d; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();
const MAX_FUMEE = 260, fumees = [];
let indexFumee = 0;
for (let i = 0; i < MAX_FUMEE; i++) {
  const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: texFumee, color: 0xe4e4e6, transparent: true, opacity: 0, depthWrite: false, fog: true }));
  m.visible = false; m.renderOrder = 2; scene.add(m);
  fumees.push({ m, vie: 0, duree: 1, vx: 0, vy: 0, vz: 0, taille: 1, opa: 0.5 });
}
const posRoue = new THREE.Vector3();
function emettreFumee(modeleVoiture, force, dt, vx = 0, vz = 0) {
  const debit = (reglages.qualite === 'basse' ? 28 : 60) * force;   // nouvelles bouffées par seconde et par roue
  for (const r of modeleVoiture.roues) {
    if (r.avant) continue;                               // seules les roues arrière fument
    r.accFumee = (r.accFumee || 0) + dt * debit;
    while (r.accFumee >= 1) {
      r.accFumee -= 1;
      r.getWorldPosition(posRoue);
      const p = fumees[indexFumee]; indexFumee = (indexFumee + 1) % MAX_FUMEE;
      p.m.position.set(posRoue.x + (Math.random() - 0.5) * 0.5, posRoue.y - r.rayon + 0.3, posRoue.z + (Math.random() - 0.5) * 0.5);
      p.vx = vx * 0.3 + (Math.random() - 0.5) * 2.2;
      p.vz = vz * 0.3 + (Math.random() - 0.5) * 2.2;
      p.vy = 0.5 + Math.random() * 0.9;
      p.duree = p.vie = (1.3 + Math.random() * 1.1) * (0.7 + force * 0.6);
      p.taille = 0.7 + Math.random() * 0.5;
      p.opa = 0.28 + 0.34 * force;
      p.m.material.rotation = Math.random() * Math.PI * 2;
      p.m.visible = true;
    }
  }
}
function majFumee(dt) {
  for (const p of fumees) {
    if (p.vie <= 0) continue;
    p.vie -= dt;
    if (p.vie <= 0) { p.m.visible = false; continue; }
    const k = 1 - p.vie / p.duree;                       // 0 = vient de naître, 1 = va disparaître
    const frein = Math.max(0, 1 - dt * 1.8);
    p.vx *= frein; p.vz *= frein; p.vy *= Math.max(0, 1 - dt * 0.6);
    p.m.position.x += p.vx * dt; p.m.position.y += p.vy * dt; p.m.position.z += p.vz * dt;
    p.m.scale.setScalar(p.taille + k * 5.5);             // la fumée gonfle
    p.m.material.opacity = p.opa * Math.min(1, k * 7) * Math.pow(1 - k, 1.6);
    p.m.material.rotation += dt * 0.4;
  }
}
