// MAN'SCAVE — 01-scene.js
// =====================================================================
// 1. LA SCÈNE : le « monde », la caméra (nos yeux) et le moteur de rendu
// =====================================================================
const scene = new THREE.Scene();
const COULEUR_HORIZON = '#f2c9a4';
scene.fog = new THREE.Fog(COULEUR_HORIZON, 90, 340);  // brume au loin, couleur du coucher de soleil

const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1500);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;    // rendu « cinéma », couleurs plus riches
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

// Le ciel : une grande sphère avec un dégradé (bleu en haut, orangé à l'horizon)
const ciel = new THREE.Mesh(
  new THREE.SphereGeometry(700, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { haut: { value: new THREE.Color('#2f5fc4') }, milieu: { value: new THREE.Color('#8fb3e8') },
                horizon: { value: new THREE.Color(COULEUR_HORIZON) } },
    vertexShader: 'varying float h; void main(){ h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 haut; uniform vec3 milieu; uniform vec3 horizon; varying float h;' +
      'void main(){ vec3 c = mix(horizon, milieu, smoothstep(0.0, 0.18, h)); c = mix(c, haut, smoothstep(0.18, 0.7, h)); gl_FragColor = vec4(c, 1.0); }'
  })
);
scene.add(ciel);

// Reflets : on « photographie » le ciel pour que la carrosserie et les vitres le reflètent
const sceneCiel = new THREE.Scene();
sceneCiel.add(ciel.clone());
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(sceneCiel).texture;

// =====================================================================
// 2. LES LUMIÈRES : un soleil bas de fin d'après-midi
// =====================================================================
const hemi = new THREE.HemisphereLight('#cfe0ff', '#4a5a3a', 0.55);
scene.add(hemi);

const soleil = new THREE.DirectionalLight('#ffd9b0', 1.25);
soleil.castShadow = true;
soleil.shadow.mapSize.set(2048, 2048);
soleil.shadow.bias = -0.0004;
const zone = 45;
Object.assign(soleil.shadow.camera, { left: -zone, right: zone, top: zone, bottom: -zone, near: 1, far: 260 });
scene.add(soleil, soleil.target);

// Panneau d'information qui flotte (utilisé au sous-sol et au-dessus des voitures exposées)
function creerPanneau(texte, sousTexte) {
  const t = document.createElement('canvas'); t.width = 512; t.height = 160;
  const c = t.getContext('2d');
  c.fillStyle = 'rgba(14, 20, 32, 0.82)';
  c.beginPath(); c.roundRect ? c.roundRect(8, 8, 496, 144, 28) : c.rect(8, 8, 496, 144); c.fill();
  c.fillStyle = '#ffffff'; c.textAlign = 'center';
  c.font = '800 58px system-ui, sans-serif'; c.fillText(texte, 256, 78);
  c.fillStyle = '#9fe9ff'; c.font = '500 30px system-ui, sans-serif'; c.fillText(sousTexte, 256, 124);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(t), depthWrite: false }));
  s.scale.set(5, 1.56, 1);
  return s;
}
