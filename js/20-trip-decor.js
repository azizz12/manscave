// MAN'SCAVE — 20-trip-decor.js
// =====================================================================
// 11b. LE DÉCOR DU TRIP : l'univers au plafond, les monuments, et la zone qui fait peur
// =====================================================================

// =====================================================================
// L'univers : le plafond et le haut des murs montrent l'espace (étoiles, nébuleuses, planètes, trou noir).
// Le dessin dépend seulement de la DIRECTION du regard : on croirait le ciel infiniment loin.
// =====================================================================
const matUnivers = new THREE.ShaderMaterial({
  uniforms: { temps: { value: 0 } },
  fog: false,
  vertexShader: `
    varying vec3 vMonde;
    void main() { vec4 m = modelMatrix * vec4(position, 1.0); vMonde = m.xyz; gl_Position = projectionMatrix * viewMatrix * m; }`,
  fragmentShader: `
    uniform float temps;
    varying vec3 vMonde;
    float h3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
    float bruit(vec3 x) {
      vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(mix(h3(i), h3(i + vec3(1, 0, 0)), f.x), mix(h3(i + vec3(0, 1, 0)), h3(i + vec3(1, 1, 0)), f.x), f.y),
                 mix(mix(h3(i + vec3(0, 0, 1)), h3(i + vec3(1, 0, 1)), f.x), mix(h3(i + vec3(0, 1, 1)), h3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
    }
    float fbm(vec3 p) { float v = 0.0, a = 0.5; for (int k = 0; k < 4; k++) { v += a * bruit(p); p *= 2.03; a *= 0.5; } return v; }
    // Une couche d'étoiles : une étoile au hasard dans certaines cases d'une grille posée sur la sphère du ciel
    float etoiles(vec3 d, float n, float seuil, float taille) {
      vec3 p = d * n, i = floor(p), f = fract(p);
      float h = h3(i);
      if (h < seuil) return 0.0;
      vec3 c = vec3(h3(i + 11.1), h3(i + 27.3), h3(i + 41.7)) * 0.6 + 0.2;
      float scint = 0.65 + 0.35 * sin(temps * (1.5 + h * 4.0) + h * 60.0);
      return smoothstep(taille, 0.0, length(f - c)) * scint;
    }
    // Une planète vue de loin : disque éclairé d'un côté, bandes de nuages, halo d'atmosphère
    vec4 planete(vec3 d, vec3 c, float rayon, vec3 col1, vec3 col2, vec3 lum, float bandes) {
      float ca = dot(d, c), a = acos(clamp(ca, -1.0, 1.0));
      if (a > rayon * 1.3) return vec4(0.0);
      float r = a / rayon;
      if (r > 1.0) { float g = (1.3 - r) / 0.3; return vec4(col1 * g * g * 0.45, 0.0); }
      vec3 t = d - c * ca; float lt = length(t); vec3 tn = lt > 1e-5 ? t / lt : vec3(0.0);
      vec3 n = normalize(-c * sqrt(1.0 - r * r) + tn * r);
      float motif = fbm(vec3(n.x * 2.0, n.y * bandes, n.z * 2.0) + 3.0);
      vec3 col = mix(col1, col2, smoothstep(0.35, 0.7, motif));
      float jour = max(dot(n, lum), 0.0);
      return vec4(col * (0.05 + 1.1 * jour) + col1 * pow(r, 6.0) * 0.4, 1.0);
    }
    void main() {
      vec3 d = normalize(vMonde - cameraPosition);
      // Le fond : noir bleuté, une bande de voie lactée et des nébuleuses violettes et roses
      float bande = exp(-pow(dot(d, normalize(vec3(0.35, 0.55, 0.75))) * 3.2, 2.0));
      float n1 = fbm(d * 2.3 + vec3(0.0, temps * 0.004, 0.0)), n2 = fbm(d * 4.1 + 7.0);
      vec3 col = vec3(0.004, 0.003, 0.014);
      col += mix(vec3(0.32, 0.05, 0.55), vec3(0.85, 0.12, 0.45), n2) * smoothstep(0.48, 0.85, n1) * 0.5;
      col += vec3(0.05, 0.22, 0.45) * smoothstep(0.55, 0.9, fbm(d * 3.0 - 4.0)) * 0.45;
      col += vec3(0.55, 0.45, 0.7) * bande * (0.1 + 0.25 * n2);
      // Les étoiles (petites, nombreuses ; grosses, rares ; plus serrées dans la voie lactée)
      col += vec3(1.0) * etoiles(d, 170.0, 0.9 - bande * 0.12, 0.2);
      col += vec3(0.85, 0.9, 1.0) * etoiles(d, 55.0, 0.975, 0.16) * 1.6;
      col += vec3(1.0, 0.75, 0.9) * etoiles(d, 23.0, 0.985, 0.1) * 2.2;
      // Le trou noir : un disque noir entouré d'un anneau de matière brûlante qui tourne
      vec3 cTrou = normalize(vec3(-0.55, 0.62, -0.56));
      float aT = acos(clamp(dot(d, cTrou), -1.0, 1.0));
      vec3 axeT = normalize(cross(cTrou, vec3(0.0, 1.0, 0.0))), axeT2 = cross(cTrou, axeT);
      float angT = atan(dot(d, axeT2), dot(d, axeT));
      float tourb = fbm(vec3(cos(angT * 3.0 + temps * 0.35 + aT * 18.0), sin(angT * 3.0 + temps * 0.35), aT * 10.0) * 2.5);
      float anneau = exp(-pow((aT - 0.17) / 0.05, 2.0)) * (0.5 + tourb);
      col += vec3(1.0, 0.45, 0.25) * anneau * 1.3 + vec3(0.6, 0.2, 0.8) * exp(-aT * 6.0) * 0.35;
      col *= smoothstep(0.085, 0.11, aT);
      // Deux planètes, dont une avec des anneaux
      vec3 lum = normalize(vec3(0.6, 0.2, 0.5));
      vec3 cP = normalize(vec3(0.62, 0.48, 0.35));
      float rP = 0.16;
      vec3 nAnneau = normalize(vec3(0.25, 1.0, -0.35));
      float tA = dot(cP, nAnneau) / dot(d, nAnneau);
      float dA = length(d * tA - cP) / rP;
      vec4 p1 = planete(d, cP, rP, vec3(0.95, 0.55, 0.3), vec3(0.55, 0.2, 0.45), lum, 9.0);
      float ruban = (tA > 0.0 && dA > 1.35 && dA < 2.3) ? (0.45 + 0.55 * bruit(vec3(dA * 22.0))) * smoothstep(1.35, 1.5, dA) * smoothstep(2.3, 2.1, dA) : 0.0;
      vec3 colAnneau = vec3(0.95, 0.8, 0.65) * ruban * 0.8;
      if (tA > 1.0) col += colAnneau;                   // l'anneau passe derrière la planète…
      col = mix(col + p1.rgb, p1.rgb, p1.a);
      if (tA <= 1.0) col += colAnneau;                  // … puis devant
      vec4 p2 = planete(d, normalize(vec3(0.1, 0.3, 0.95)), 0.07, vec3(0.2, 0.75, 0.95), vec3(0.1, 0.25, 0.6), lum, 3.0);
      col = mix(col + p2.rgb, p2.rgb, p2.a);
      gl_FragColor = vec4(col, 1.0);
    }`,
});
animations.push(dt => { if (zoneVisible.slice(0, 4) === 'trip') matUnivers.uniforms.temps.value += dt; });
{
  // Une grande boîte vue de l'intérieur (plafond + murs) ; sa face du bas n'est pas dessinée (le sol est là)
  const L = TRIP.x2 - TRIP.x1 + 2, P = TRIP.z2 - TRIP.z1 + 2, H = TRIP.plafond - Y0;
  const invisible = new THREE.MeshBasicMaterial({ visible: false });
  matUnivers.side = THREE.BackSide;
  const boite = new THREE.Mesh(new THREE.BoxGeometry(L, H, P), [matUnivers, matUnivers, matUnivers, invisible, matUnivers, matUnivers]);
  boite.position.set((TRIP.x1 + TRIP.x2) / 2, Y0 + H / 2, (TRIP.z1 + TRIP.z2) / 2);
  boite.frustumCulled = false;
  scene.add(boite);
}

// =====================================================================
// Les monuments : de grandes formes qui cachent l'autre côté du circuit (on ne sait jamais ce qui arrive)
// =====================================================================
const hasardTrip = (() => { let a = 20261127; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();
const MATS_DECOR = {
  pierre: new THREE.MeshStandardMaterial({ color: '#2b2338', emissive: '#0d0618', roughness: 0.75, metalness: 0.15, envMapIntensity: 0.6 }),
  os: new THREE.MeshStandardMaterial({ color: '#cfc3a4', emissive: '#1a1208', roughness: 0.7, envMapIntensity: 0.4 }),
  noir: new THREE.MeshStandardMaterial({ color: '#050407', roughness: 0.15, metalness: 0.6, envMapIntensity: 1.2 }),
  rouge: new THREE.MeshBasicMaterial({ color: '#ff1a24' }),
  cyan: matTripCyan, rose: matTripRose,
  cristal: new THREE.MeshStandardMaterial({ color: '#7d4bff', emissive: '#5a1cff', emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.4 }),
  vortex: new THREE.MeshBasicMaterial({ color: '#8a4bff', transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
};
const morceauxDecor = Object.fromEntries(Object.keys(MATS_DECOR).map(k => [k, []]));
// Ajoute une forme (déjà placée dans le repère du monument) ; m = matrice du monument (position + orientation)
const poser = (cle, geo, m) => { geo.applyMatrix4(m); morceauxDecor[cle].push(geo); };
const matrice = (x, z, rot, y = Y0) => new THREE.Matrix4().makeRotationY(rot).setPosition(x, y, z);

// Chaque monument : (x, z, r = rayon disponible, rot = tourné vers la piste)
const MONUMENTS = {
  pyramide(x, z, r, rot) {
    const m = matrice(x, z, rot), R = Math.min(r, 13), h = Math.min(R * 1.25, 15.5), a = R / Math.SQRT2;
    poser('pierre', new THREE.ConeGeometry(R, h, 4).rotateY(Math.PI / 4).translate(0, h / 2, 0), m);
    poser('cyan', new THREE.OctahedronGeometry(R * 0.12).translate(0, h + 1.2, 0), m);   // la pierre qui flotte au sommet
    for (const [l, p, dx, dz] of [[2 * a, 0.2, 0, a], [2 * a, 0.2, 0, -a], [0.2, 2 * a, a, 0], [0.2, 2 * a, -a, 0]])
      poser('rose', new THREE.BoxGeometry(l + 0.2, 0.2, p).translate(dx, 0.12, dz), m);
    poser('rouge', new THREE.CircleGeometry(R * 0.09, 16).rotateX(-Math.atan2(a, h)).translate(0, h * 0.45, a * 0.55 + 0.12), m);   // un œil rouge
    return R * 0.85;
  },
  obelisques(x, z, r, rot) {
    const m = matrice(x, z, rot), n = r > 9 ? 3 : 1;
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2, d = n > 1 ? Math.min(r * 0.45, 6) : 0;
      const w = 1.6 + hasardTrip(), h = 9 + hasardTrip() * 4.5, ox = Math.cos(a) * d, oz = Math.sin(a) * d;
      poser('pierre', new THREE.BoxGeometry(w * 2.4, 0.8, w * 2.4).translate(ox, 0.4, oz), m);
      poser('pierre', new THREE.CylinderGeometry(w * 0.55, w * 0.85, h, 4).rotateY(Math.PI / 4).translate(ox, 0.8 + h / 2, oz), m);
      poser('rouge', new THREE.ConeGeometry(w * 0.56, w * 1.1, 4).rotateY(Math.PI / 4).translate(ox, 0.8 + h + w * 0.55, oz), m);
      for (let j = 0; j < 4; j++) poser('rouge', new THREE.BoxGeometry(0.18, 0.9, 0.05).translate(ox, 2.5 + j * 1.6, oz + w * 0.62 - j * 0.04), m);   // des runes
    }
    return Math.min(r, 9);
  },
  crane(x, z, r, rot) {                                  // un crâne géant à moitié enterré, les yeux rouges
    const m = matrice(x, z, rot, Y0 - 0.8), s = Math.min(r * 0.62, 8);
    poser('os', new THREE.SphereGeometry(s, 22, 16).scale(1, 0.92, 1.1).translate(0, s * 1.15, 0), m);
    poser('os', new THREE.SphereGeometry(s * 0.62, 16, 12).scale(1.25, 0.9, 1).translate(0, s * 0.72, s * 0.48), m);
    poser('os', new THREE.BoxGeometry(s * 1.05, s * 0.42, s * 0.75).translate(0, s * 0.33, s * 0.58), m);
    for (const c of [-1, 1]) {
      poser('noir', new THREE.SphereGeometry(s * 0.27, 14, 10).translate(c * s * 0.38, s * 1.0, s * 0.92), m);
      poser('rouge', new THREE.SphereGeometry(s * 0.085, 10, 8).translate(c * s * 0.38, s * 1.0, s * 1.12), m);
    }
    poser('noir', new THREE.ConeGeometry(s * 0.13, s * 0.3, 3).rotateX(Math.PI).translate(0, s * 0.7, s * 1.05), m);
    for (let k = 0; k < 8; k++) poser('os', new THREE.BoxGeometry(s * 0.1, s * 0.17, s * 0.07).translate((k - 3.5) * s * 0.12, s * 0.5, s * 0.97), m);
    return s * 1.15;
  },
  alien(x, z, r, rot) {                                  // une tête d'extraterrestre aux grands yeux noirs
    const m = matrice(x, z, rot), s = Math.min(r * 0.42, 4.1);
    poser('pierre', new THREE.BoxGeometry(s * 1.8, s * 0.5, s * 1.8).translate(0, s * 0.25, 0), m);
    poser('pierre', new THREE.CylinderGeometry(s * 0.22, s * 0.38, s * 1.5).translate(0, s * 1.2, 0), m);
    poser('pierre', new THREE.SphereGeometry(s, 22, 16).scale(0.78, 1.32, 0.88).rotateX(-0.3).translate(0, s * 2.7, -s * 0.1), m);
    for (const c of [-1, 1]) {
      poser('noir', new THREE.SphereGeometry(s * 0.34, 14, 10).scale(1.35, 0.62, 0.55).rotateZ(c * 0.42).translate(c * s * 0.33, s * 2.45, s * 0.62), m);
      poser('rouge', new THREE.SphereGeometry(s * 0.05, 8, 6).translate(c * s * 0.36, s * 2.47, s * 0.8), m);
    }
    return s * 1.2;
  },
  portail(x, z, r, rot) {                                // une porte des étoiles, avec son tourbillon
    const m = matrice(x, z, rot), R = Math.min(r * 0.8, 7.5);
    poser('pierre', new THREE.TorusGeometry(R, R * 0.13, 10, 44).translate(0, R + 1.2, 0), m);
    poser('cyan', new THREE.TorusGeometry(R * 0.86, 0.12, 6, 44).translate(0, R + 1.2, 0), m);
    poser('vortex', new THREE.CircleGeometry(R * 0.84, 44).translate(0, R + 1.2, 0), m);
    for (const c of [-1, 1]) poser('pierre', new THREE.BoxGeometry(R * 0.4, 1.6, R * 0.5).translate(c * R * 0.75, 0.8, 0), m);
    return R * 0.9;
  },
  cristaux(x, z, r, rot) {
    const m = matrice(x, z, rot), n = 4 + Math.floor(hasardTrip() * 4);
    for (let k = 0; k < n; k++) {
      const a = hasardTrip() * 6.3, d = hasardTrip() * Math.min(r * 0.5, 5), h = 4 + hasardTrip() * 9, l = 0.8 + hasardTrip() * 1.2;
      poser('cristal', new THREE.OctahedronGeometry(1).scale(l, h / 2, l).rotateZ((hasardTrip() - 0.5) * 0.5).rotateX((hasardTrip() - 0.5) * 0.5)
        .translate(Math.cos(a) * d, h * 0.42, Math.sin(a) * d), m);
    }
    return Math.min(r * 0.7, 6);
  },
  monolithe(x, z, r, rot) {                              // une dalle noire immense, avec une fente rouge qui regarde
    const m = matrice(x, z, rot), h = 13 + hasardTrip() * 3;
    poser('noir', new THREE.BoxGeometry(4.2, h, 1.1).translate(0, h / 2, 0), m);
    for (const c of [-1, 1]) poser('rouge', new THREE.BoxGeometry(1.6, 0.16, 0.04).translate(0, h * 0.72, c * 0.58), m);
    return 2.6;
  },
  main(x, z, r, rot) {                                   // une main squelette qui sort du sol
    const m = matrice(x, z, rot), s = Math.min(r * 0.32, 2.2);
    poser('os', new THREE.BoxGeometry(s * 1.3, s * 1.5, s * 0.45).translate(0, s * 0.6, 0), m);
    poser('os', new THREE.CylinderGeometry(s * 0.28, s * 0.36, s * 1.4).translate(0, -s * 0.3, 0), m);
    [[-0.55, 0.9, 0.3], [-0.2, 1.1, 0.1], [0.15, 1.15, -0.05], [0.5, 1.0, -0.2], [-0.8, 0.4, 0.9]].forEach(([dx, long, pente], k) => {
      let px = dx * s, py = s * 1.35, a = (k === 4 ? 0.9 : 0.12) + pente;   // 3 phalanges, de plus en plus pliées
      for (let j = 0; j < 3; j++) {
        const lj = s * long * (0.55 - j * 0.1);
        poser('os', new THREE.CylinderGeometry(s * 0.09, s * 0.11, lj, 6).translate(0, lj / 2, 0).rotateZ(-a).translate(px, py, 0), m);
        poser('os', new THREE.SphereGeometry(s * 0.13, 6, 5).translate(px, py, 0), m);
        px += Math.sin(a) * lj; py += Math.cos(a) * lj; a += 0.35;
      }
    });
    return s * 1.3;
  },
};
// La distance à la piste la plus proche (bord de piste), pour savoir où l'on a de la place
const P_TRIP = CIRCUIT_TRIP.piste;
function bordPisteTrip(x, z) {
  let d = Infinity, k = 0;
  for (let i = 0; i < P_TRIP.length; i++) { const s = P_TRIP[i], e = Math.hypot(s.x - x, s.z - z) - s.w; if (e < d) { d = e; k = i; } }
  return { d, s: P_TRIP[k] };
}
const versPiste = (x, z, s) => Math.atan2(s.x - x, s.z - z);   // rotation qui tourne la face +Z vers la piste
// Les yeux géants (plus bas) et les formes qui flottent : on garde leur place libre
const YEUX_TRIP = [[60, 190, 12, 4.8], [-165, 115, 12.5, 5.2], [100, -40, 12, 4.2]];
const occupe = YEUX_TRIP.map(([x, z, h, r]) => [x, z, r + 3]).concat(formesTrip.map(f => [f.g.position.x, f.g.position.z, 4]));   // [x, z, rayon] déjà pris
const libre = (x, z, r) => occupe.every(([ox, oz, or]) => Math.hypot(ox - x, oz - z) > r + or + 4);
function poserMonument(type, x, z, r) {
  const { s } = bordPisteTrip(x, z);
  const rayon = MONUMENTS[type](x, z, r, versPiste(x, z, s));
  occupe.push([x, z, rayon]);
  obstacles.push({ x, z, rayon, niveau: 'trip' });
}
// Endroits interdits : le parking, l'ascenseur, la zone sombre (décor à part), les bords du hangar
const interdit = (x, z, r) => (x > PARKING_TRIP.x1 - 10 - r && x < PARKING_TRIP.x2 + 10 + r && z > PARKING_TRIP.z1 - 10 - r && z < PARKING_TRIP.z2 + 10 + r)
  || x < TRIP.x1 + 6 + r || x > TRIP.x2 - 6 - r || z < TRIP.z1 + 8 + r || z > TRIP.z2 - 6 - r
  || (x > ZONE_SOMBRE.x1 - 14 && x < ZONE_SOMBRE.x2 + 14 && z > ZONE_SOMBRE.z1 - 14 && z < ZONE_SOMBRE.z2 + 14);

// --- La zone sombre : une cage thoracique géante au-dessus de la piste, des crânes à l'entrée, des mains qui sortent du sol
const matRougeVacille = new THREE.MeshBasicMaterial({ color: '#ff1020' });
{
  const dedans = P_TRIP.map((s, i) => i).filter(i => dansZoneSombre(P_TRIP[i].x, P_TRIP[i].z) && P_TRIP[i].z > ZONE_SOMBRE.z1 + 6 && P_TRIP[i].z < ZONE_SOMBRE.z2 - 6);
  const colonne = [];
  const X = new THREE.Vector3(), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3();
  dedans.forEach((i, n) => {
    const s = P_TRIP[i], R = s.w + 2;
    colonne.push(new THREE.Vector3(s.x, s.y + R * 0.98, s.z));
    if (n % 2) return;
    X.set(s.lx, 0, s.lz); Z.set(-s.tx, 0, -s.tz);
    const m = new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(s.x, s.y, s.z);
    for (const c of [-1, 1]) {                         // deux côtes courbées qui montent vers la colonne vertébrale
      const g = new THREE.TorusGeometry(R, 0.42, 6, 18, Math.PI * 0.48).rotateZ(c > 0 ? 0 : Math.PI * 0.52);
      g.applyMatrix4(m); morceauxDecor.os.push(g);
    }
    morceauxDecor.os.push(new THREE.SphereGeometry(1.1, 10, 8).scale(1, 0.8, 1.4).applyMatrix4(m).translate(0, R * 0.98, 0));   // une vertèbre
  });
  if (colonne.length > 1) morceauxDecor.os.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(colonne), colonne.length * 2, 0.55, 8, false));
  // Des lampes rouges qui pendent de la colonne et clignotent
  const lampes = [];
  for (let k = 2; k < colonne.length; k += 5) lampes.push(new THREE.SphereGeometry(0.35, 8, 6).translate(colonne[k].x, colonne[k].y - 1.6, colonne[k].z),
    new THREE.CylinderGeometry(0.03, 0.03, 1.3).translate(colonne[k].x, colonne[k].y - 0.9, colonne[k].z));
  if (lampes.length) scene.add(new THREE.Mesh(fusionnerFormes(lampes), matRougeVacille));
  // Deux crânes géants qui gardent l'entrée et la sortie, et des mains de chaque côté
  for (const [zz, cote] of [[ZONE_SOMBRE.z1 - 4, 1], [ZONE_SOMBRE.z1 - 4, -1], [ZONE_SOMBRE.z2 + 2, 1]]) {
    const s = P_TRIP[indiceTrip(-236, zz)], x = s.x + s.lx * cote * (s.w + 9), z = s.z + s.lz * cote * (s.w + 9);
    poserMonument('crane', x, z, 9);
  }
  for (const i of dedans.filter((i, n) => n % 5 === 2)) {
    const s = P_TRIP[i], c = (i % 2) * 2 - 1;
    poserMonument('main', s.x + s.lx * c * (s.w + 3.5), s.z + s.lz * c * (s.w + 3.5), 4);
  }
}
function indiceTrip(x, z) { let m = 0, d = Infinity; P_TRIP.forEach((s, i) => { const e = Math.hypot(s.x - x, s.z - z); if (e < d) { d = e; m = i; } }); return m; }

// --- On remplit le reste du hangar : on cherche les grands espaces libres, du plus grand au plus petit
{
  const candidats = [];
  for (let x = TRIP.x1 + 10; x < TRIP.x2 - 8; x += 6) for (let z = TRIP.z1 + 10; z < TRIP.z2 - 8; z += 6) {
    const { d } = bordPisteTrip(x, z);
    const r = Math.min(d - 5, 14);                     // au moins 5 m entre le monument et le bord de la piste
    if (r >= 3.5 && !interdit(x, z, r)) candidats.push([x, z, r]);
  }
  // Du plus grand espace au plus petit ; à place égale, au hasard (mais toujours le même hasard : tout le monde voit le même décor)
  for (const c of candidats) c.push(hasardTrip());
  candidats.sort((a, b) => Math.floor(b[2] / 2) - Math.floor(a[2] / 2) || a[3] - b[3]);
  const grands = ['pyramide', 'crane', 'portail', 'alien', 'obelisques', 'pyramide', 'alien', 'portail'];
  const moyens = ['obelisques', 'cristaux', 'monolithe', 'alien', 'cristaux', 'main'];
  const petits = ['cristaux', 'monolithe', 'main', 'obelisques'];
  let nG = 0, nM = 0, nP = 0;
  for (const [x, z, r] of candidats) {
    if (occupe.length > 95 || !libre(x, z, r)) continue;
    const type = r >= 11 ? grands[nG++ % grands.length] : r >= 7 ? moyens[nM++ % moyens.length] : petits[nP++ % petits.length];
    poserMonument(type, x, z, r);
  }
}
// Tous les morceaux d'un même matériau sont réunis : quelques dessins seulement pour des dizaines de monuments
for (const cle in morceauxDecor) if (morceauxDecor[cle].length) {
  const m = new THREE.Mesh(fusionnerFormes(morceauxDecor[cle]), MATS_DECOR[cle]);
  if (cle === 'vortex') m.renderOrder = 1;
  scene.add(m);
}
animations.push(() => {                               // le vortex des portails respire, les lampes rouges vacillent
  if (zoneVisible.slice(0, 4) !== 'trip') return;
  const t = performance.now() / 1000;
  MATS_DECOR.vortex.opacity = 0.22 + 0.14 * Math.sin(t * 1.7);
  matRougeVacille.color.setRGB(Math.random() < 0.08 ? 0.15 : 1, 0.05, 0.08);
  MATS_DECOR.rouge.color.setRGB(0.75 + 0.25 * Math.sin(t * 2.3), 0.08, 0.12);
});

// =====================================================================
// Les yeux géants qui suivent le joueur du regard
// =====================================================================
const yeuxTrip = [];
{
  const t = document.createElement('canvas'); t.width = 512; t.height = 256;
  const c = t.getContext('2d');
  c.fillStyle = '#efe6dc'; c.fillRect(0, 0, 512, 256);
  c.strokeStyle = 'rgba(170,20,20,.55)'; c.lineWidth = 1.5;   // les veines
  for (let k = 0; k < 70; k++) {
    let x = 128 + (Math.random() - 0.5) * 340, y = 128 + (Math.random() - 0.5) * 220;
    c.beginPath(); c.moveTo(x, y);
    for (let j = 0; j < 6; j++) { x += (128 - x) * 0.12 + (Math.random() - 0.5) * 18; y += (128 - y) * 0.12 + (Math.random() - 0.5) * 18; c.lineTo(x, y); }
    c.stroke();
  }
  const g = c.createRadialGradient(128, 128, 4, 128, 128, 30);   // l'iris (en u = 0,25 : la face +Z de la sphère)
  g.addColorStop(0, '#000'); g.addColorStop(0.32, '#000'); g.addColorStop(0.36, '#ffcf3a'); g.addColorStop(0.75, '#d42a10'); g.addColorStop(1, '#3a0505');
  c.fillStyle = g; c.beginPath(); c.arc(128, 128, 30, 0, 7); c.fill();
  const tex = new THREE.CanvasTexture(t);
  const mat = new THREE.MeshStandardMaterial({ map: tex, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.35, roughness: 0.25, metalness: 0.1 });
  const matNerf = new THREE.MeshStandardMaterial({ color: '#5a0d14', emissive: '#2a0006', roughness: 0.6 });
  for (const [x, z, h, r] of YEUX_TRIP) {
    const oeil = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 22), mat);
    oeil.position.set(x, Y0 + h, z); scene.add(oeil);
    const nerf = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.9, TRIP.plafond - (Y0 + h), 8), matNerf);   // il pend au plafond
    nerf.position.set(x, (TRIP.plafond + Y0 + h) / 2 + r * 0.5, z); scene.add(nerf);
    yeuxTrip.push(oeil);
  }
  const q = new THREE.Quaternion(), m = new THREE.Matrix4(), haut = new THREE.Vector3(0, 1, 0);
  animations.push(dt => {
    if (zoneVisible.slice(0, 4) !== 'trip') return;
    for (const o of yeuxTrip) {                         // l'œil tourne lentement vers la caméra
      m.lookAt(camera.position, o.position, haut); q.setFromRotationMatrix(m);
      o.quaternion.slerp(q, Math.min(1, dt * 2.5));
    }
  });
}

// =====================================================================
// La peur : dans la zone sombre, la brume devient rouge, le cœur bat, et une créature rugit à l'entrée
// =====================================================================
const peur = { niveau: 0, coeur: 0, dernierCri: -99, dedans: false };
const voile = document.createElement('div');           // un voile rouge sur les bords de l'écran
voile.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:3;opacity:0;background:radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(120,0,8,.55) 80%, rgba(40,0,0,.9) 100%)';
document.body.appendChild(voile);
function battement(ctx, t, force) {                    // « boum-boum » : deux coups sourds
  for (const [d, f] of [[0, 1], [0.28, 0.7]]) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(62, t + d); o.frequency.exponentialRampToValueAtTime(38, t + d + 0.16);
    g.gain.setValueAtTime(0.0001, t + d); g.gain.exponentialRampToValueAtTime(0.9 * force * f, t + d + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + d + 0.22);
    o.connect(g); g.connect(audio.master); o.start(t + d); o.stop(t + d + 0.25);
  }
}
function cri(ctx, t) {                                 // un rugissement grave et rauque
  const duree = 2.2, n = Math.floor(ctx.sampleRate * duree), buf = ctx.createBuffer(1, n, ctx.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const bruitS = ctx.createBufferSource(); bruitS.buffer = buf;
  const filtre = ctx.createBiquadFilter(); filtre.type = 'bandpass'; filtre.Q.value = 2.5;
  filtre.frequency.setValueAtTime(180, t); filtre.frequency.linearRampToValueAtTime(420, t + 0.5); filtre.frequency.exponentialRampToValueAtTime(120, t + duree);
  const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.linearRampToValueAtTime(95, t + 0.4); o.frequency.exponentialRampToValueAtTime(40, t + duree);
  const lfo = ctx.createOscillator(), lfoG = ctx.createGain(); lfo.frequency.value = 23; lfoG.gain.value = 18; lfo.connect(lfoG); lfoG.connect(o.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.7, t + 0.12); g.gain.setValueAtTime(0.7, t + 0.7); g.gain.exponentialRampToValueAtTime(0.001, t + duree);
  bruitS.connect(filtre); filtre.connect(g); o.connect(g); g.connect(audio.master);
  for (const s of [bruitS, o, lfo]) { s.start(t); s.stop(t + duree); }
}
// Appelée à chaque image par l'ambiance : renvoie la peur (0 = rien, 1 = au cœur de la zone sombre)
function majPeur(cible, dt) {
  const dedans = cible.y < Y_TRIP && dansZoneSombre(cible.x, cible.z);
  peur.niveau += ((dedans ? 1 : 0) - peur.niveau) * Math.min(1, dt * 1.6);
  const maintenant = performance.now() / 1000;
  let flash = 0;
  if (dedans && !peur.dedans && maintenant - peur.dernierCri > 25) {   // on entre : le cri (pas plus d'une fois toutes les 25 s)
    peur.dernierCri = maintenant;
    if (audio) cri(audio.ctx, audio.ctx.currentTime + 0.05);
  }
  peur.dedans = dedans;
  if (maintenant - peur.dernierCri < 0.5) flash = 1 - (maintenant - peur.dernierCri) / 0.5;
  if (peur.niveau > 0.05 && audio) {                    // le cœur bat de plus en plus vite
    peur.coeur -= dt;
    if (peur.coeur <= 0) { battement(audio.ctx, audio.ctx.currentTime + 0.02, peur.niveau); peur.coeur = 0.95 - 0.3 * peur.niveau; }
  }
  const o = Math.min(1, peur.niveau * 0.75 + flash * 0.6);
  if (Math.abs(parseFloat(voile.style.opacity || 0) - o) > 0.01) voile.style.opacity = o.toFixed(2);
  return peur.niveau;
}

// =====================================================================
// Pour finir : la liste de tout ce qui appartient au hangar, et le reflet « néon » des carrosseries
// =====================================================================
// (sauf les voitures, leurs panneaux, les garde-corps et les caisses, gérés à part)
const objetsTrip = scene.children.slice(debutTrip).filter(o => !voitures.some(v => v.groupe === o || v.panneau === o)
  && !gardeCorps.some(g => g.m === o) && !CIRCUIT_TRIP.caisses.some(c => c.mesh === o));
const envCiel = scene.environment;
const envTrip = (() => {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.SphereGeometry(50, 16, 8), new THREE.MeshBasicMaterial({ color: '#0a0614', side: THREE.BackSide })));
  [[NEON.rose, 0], [NEON.cyan, 1.6], [NEON.violet, 3.2], [NEON.jaune, 4.7]].forEach(([c, a]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(30, 2, 2), new THREE.MeshBasicMaterial({ color: c }));
    b.position.set(Math.cos(a) * 30, 12 + (a % 2) * 6, Math.sin(a) * 30); b.lookAt(0, 12, 0); s.add(b);
  });
  const haut = new THREE.Mesh(new THREE.BoxGeometry(60, 1, 2), new THREE.MeshBasicMaterial({ color: '#b98cff' })); haut.position.y = 40; s.add(haut);
  return new THREE.PMREMGenerator(renderer).fromScene(s).texture;
})();
