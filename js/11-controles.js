// MAN'SCAVE — 11-controles.js
// =====================================================================
// 6. LES CONTRÔLES : clavier, souris et tactile
// =====================================================================
// --- 6a. Les réglages du joueur (enregistrés dans le navigateur)
const TOUCHES_PAR_DEFAUT = { avancer: 'z', reculer: 's', gauche: 'q', droite: 'd', freinMain: ' ', utiliser: 'f', chat: 't', entrer: 'e', replacer: 'r', vue: 'v', courir: 'shift', sauter: ' ' };
const NOMS_ACTIONS = { avancer: 'Avancer / accélérer', reculer: 'Reculer / freiner', gauche: 'Gauche', droite: 'Droite',
  freinMain: 'Frein à main (voiture)', utiliser: 'Utiliser l\'objet', chat: 'Chat (multijoueur)', entrer: 'Monter / sortir · bouton de course', replacer: 'Remettre sur la piste', vue: 'Vue 1re / 3e personne', courir: 'Courir (à pied)', sauter: 'Sauter (à pied)' };

let reglages = { surnom: '', touches: { ...TOUCHES_PAR_DEFAUT }, sensi: 1, inverse: false, volume: 0.6,
                 adversaires: 3, tours: 3, couleurs: {}, qualite: 'haute', carte: true, fps: true, qualiteAuto: true, volMusique: 0.7 };
try { Object.assign(reglages, JSON.parse(localStorage.getItem('monde3d-reglages')) || {}); } catch (e) {}
reglages.touches = { ...TOUCHES_PAR_DEFAUT, ...reglages.touches };   // ajoute les nouvelles commandes si besoin
function sauverReglages() { try { localStorage.setItem('monde3d-reglages', JSON.stringify(reglages)); } catch (e) {} }

// Transforme une touche en texte lisible
function nomTouche(t) {
  return ({ ' ': 'Espace', shift: 'Maj', control: 'Ctrl', alt: 'Alt', enter: 'Entrée', tab: 'Tab',
            arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→' })[t] || t.toUpperCase();
}

// --- 6b. Le menu
const menu = document.getElementById('menu');
const champSurnom = document.getElementById('surnom');
let enJeu = false, actionEcoutee = null;

function afficherTouches() {
  document.getElementById('liste-touches').innerHTML = Object.keys(NOMS_ACTIONS).map(a =>
    `<div class="ligne"><span>${NOMS_ACTIONS[a]}</span>
     <button class="touche${actionEcoutee === a ? ' ecoute' : ''}" data-action="${a}">
       ${actionEcoutee === a ? 'Appuie…' : nomTouche(reglages.touches[a])}</button></div>`).join('');
}
document.getElementById('liste-touches').addEventListener('click', e => {
  const b = e.target.closest('.touche');
  if (!b) return;
  actionEcoutee = b.dataset.action;   // le prochain appui de touche sera la nouvelle commande
  afficherTouches();
});

// Onglets du menu
document.querySelectorAll('.onglet').forEach(o => o.addEventListener('click', () => {
  document.querySelectorAll('.onglet').forEach(x => x.classList.toggle('actif', x === o));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('actif', p.dataset.page === o.dataset.onglet));
}));
// Petits boutons de choix (adversaires, tours)
function boutonsChoix(id, valeurs, cle) {
  const boite = document.getElementById(id);
  boite.innerHTML = valeurs.map(v => `<button data-v="${v}">${v}</button>`).join('');
  const maj = () => boite.querySelectorAll('button').forEach(b => b.classList.toggle('actif', Number(b.dataset.v) === reglages[cle]));
  boite.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; reglages[cle] = Number(b.dataset.v); maj(); });
  return maj;
}
const majChoixAdversaires = boutonsChoix('choix-adversaires', [0, 1, 2, 3], 'adversaires');
const majChoixTours = boutonsChoix('choix-tours', [1, 2, 3, 4, 5], 'tours');
// Garage : une carte par voiture, avec ses couleurs
const PALETTE = ['#6a3cff', '#c8102e', '#f2f4f7', '#141516', '#1f6feb', '#18b6a5', '#f2a516', '#e0408a', '#3fa34d'];
const ACCELERATION = { volt: '2,1 s', furia: '3,7 s', sprint: '5,5 s', toro: '2,8 s', kaiser: '6,7 s' };
function appliquerCouleurs() {
  for (const v of voitures) v.modele.peinture.color.set(v.couleurFixe || reglages.couleurs[v.nom] || DESIGNS[v.nom].couleur);
}
function afficherGarage() {
  const boite = document.getElementById('cartes-voitures');
  boite.innerHTML = voitures.filter(v => !v.couleurFixe).map(v => {
    const actuelle = reglages.couleurs[v.nom] || DESIGNS[v.nom].couleur;
    return `<div class="voiture-carte"><div><h3>${v.specs.nom}</h3><div class="caract">${v.specs.moteur} · 0 à 100 km/h en ${ACCELERATION[v.nom]}</div></div>
      <div class="vmax">${v.specs.kmh}<small> km/h</small></div>
      <div class="couleurs">${PALETTE.map(c => `<button aria-label="Couleur ${c}" data-voiture="${v.nom}" data-c="${c}" class="${c === actuelle ? 'actif' : ''}" style="background:${c}"></button>`).join('')}</div></div>`;
  }).join('');
}
document.getElementById('cartes-voitures').addEventListener('click', e => {
  const b = e.target.closest('button[data-c]'); if (!b) return;
  reglages.couleurs[b.dataset.voiture] = b.dataset.c;
  appliquerCouleurs(); afficherGarage(); sauverReglages();
});
// Records
function afficherRecords() {
  let rec = {};
  try { rec = JSON.parse(localStorage.getItem('monde3d-records')) || {}; } catch (e) {}
  document.getElementById('liste-records').innerHTML = voitures.map(v => {
    const t = rec[v.nom];
    const texte = typeof t === 'number' ? `${Math.floor(t / 60)}:${(t % 60 < 10 ? '0' : '') + (t % 60).toFixed(2)}` : '—';
    return `<div class="record"><span>${v.specs.nom}</span><b>${texte}</b></div>`;
  }).join('');
}
document.getElementById('btn-effacer-records').onclick = () => {
  try { localStorage.removeItem('monde3d-records'); } catch (e) {}
  if (typeof records === 'object') for (const k in records) delete records[k];
  afficherRecords();
};
// Qualité graphique : ombres et finesse de l'image
function appliquerQualite() {
  const q = reglages.qualite;
  renderer.setPixelRatio(q === 'haute' ? Math.min(devicePixelRatio, 2) : q === 'moyenne' ? 1 : 0.75);
  soleil.castShadow = q !== 'basse';
  const taille = q === 'haute' ? 2048 : 1024;
  if (soleil.shadow.mapSize.x !== taille) { soleil.shadow.mapSize.set(taille, taille); if (soleil.shadow.map) { soleil.shadow.map.dispose(); soleil.shadow.map = null; } }
}
// Les touches affichées dans le texte d'aide suivent les réglages
function majAidesTouches() {
  document.querySelectorAll('kbd[data-touche]').forEach(k => { k.textContent = nomTouche(reglages.touches[k.dataset.touche]); });
}

let menuOuvertA = 0;
function ouvrirMenu() {
  menuOuvertA = performance.now();
  enJeu = false;
  if (document.pointerLockElement) { liberationVoulue = true; document.exitPointerLock(); }
  for (const k in touches) touches[k] = false;
  champSurnom.value = reglages.surnom;
  document.getElementById('sensi').value = reglages.sensi;
  document.getElementById('inverse').checked = reglages.inverse;
  document.getElementById('volume').value = reglages.volume;
  document.getElementById('vol-musique').value = reglages.volMusique ?? 0.7;
  $('mode-musique').value = reglages.modeMusique || 'hasard';
  document.getElementById('qualite').value = reglages.qualite;
  document.getElementById('option-carte').checked = reglages.carte;
  document.getElementById('option-fps').checked = reglages.fps !== false;
  document.getElementById('option-auto').checked = reglages.qualiteAuto !== false;
  document.getElementById('btn-jouer').textContent = premiereFois ? 'Jouer' : 'Reprendre';
  majChoixAdversaires(); majChoixTours(); afficherGarage(); afficherRecords(); majAidesTouches();
  afficherTouches();
  menu.classList.remove('cache');
}
function fermerMenu() {
  reglages.surnom = champSurnom.value.trim().slice(0, 16);
  reglages.sensi = parseFloat(document.getElementById('sensi').value);
  reglages.inverse = document.getElementById('inverse').checked;
  reglages.volume = parseFloat(document.getElementById('volume').value);
  reglages.volMusique = parseFloat(document.getElementById('vol-musique').value);
  reglages.modeMusique = $('mode-musique').value;
  if (!fondu) musique.volume = reglages.volMusique;
  arreterApercu();
  reglages.qualite = document.getElementById('qualite').value;
  reglages.carte = document.getElementById('option-carte').checked;
  reglages.fps = document.getElementById('option-fps').checked;
  reglages.qualiteAuto = document.getElementById('option-auto').checked;
  document.getElementById('fps').style.display = reglages.fps ? 'block' : 'none';
  if (depart.etat !== 'course' && depart.etat !== 'sequence') NB_TOURS = reglages.tours;   // pas en pleine course
  document.getElementById('carte').style.visibility = reglages.carte ? 'visible' : 'hidden';
  actionEcoutee = null;
  initAudio();                                          // le clic sur « Jouer » autorise le son
  appliquerQualite();
  sauverReglages();
  majSurnom();
  premiereFois = false;
  menu.classList.add('cache');
  enJeu = true;
  capturerSouris();                                     // le clic sur « Jouer » permet de capturer la souris
}
let premiereFois = true;
document.getElementById('btn-jouer').onclick = fermerMenu;
document.getElementById('btn-menu').onclick = ouvrirMenu;
champSurnom.addEventListener('keydown', e => { if (e.key === 'Enter') fermerMenu(); });
document.getElementById('btn-reset').onclick = () => {
  reglages.touches = { ...TOUCHES_PAR_DEFAUT };
  actionEcoutee = null;
  afficherTouches(); majAidesTouches();
};

// --- 6c. Le clavier
const touches = {};
addEventListener('keydown', e => {
  const t = e.key.toLowerCase();
  // Si on est en train de changer une commande dans le menu
  if (actionEcoutee) {
    e.preventDefault();
    if (t !== 'escape') reglages.touches[actionEcoutee] = t;
    actionEcoutee = null;
    afficherTouches();
    return;
  }
  if (chatOuvert()) return;                              // on est en train d'écrire un message
  if (dj.ouvert) { if (t === 'escape' || t === reglages.touches.entrer) { e.preventDefault(); fermerDJ(); } return; }
  if (clavier.ouvert) {
    e.preventDefault();
    const chiffre = /^[0-9]$/.test(e.key) ? e.key : CHIFFRES_AZERTY[e.key];
    if (chiffre) toucheClavier(chiffre);
    else if (t === 'backspace') toucheClavier('effacer');
    else if (t === 'enter') toucheClavier('ok');
    else if (t === 'escape') fermerClavier();
    return;
  }
  if (t === reglages.touches.chat && enJeu && !actionEcoutee) { e.preventDefault(); ouvrirChat(); return; }
  if (t === 'escape') {
    if (!enJeu && performance.now() - menuOuvertA < 500) return;   // ce Échap vient de libérer la souris
    enJeu ? ouvrirMenu() : (!premiereFois && fermerMenu()); return;
  }
  if (!enJeu) return;
  if (t === ' ') e.preventDefault();
  touches[t] = true;
  if (t === reglages.touches.sauter && !enVoiture) sauter();
  if (t === reglages.touches.entrer) actionE();
  if (t === reglages.touches.vue) changerVue();
  if (t === reglages.touches.utiliser) utiliserObjetJoueur();
  if (t === reglages.touches.replacer) { if (enVoiture) replacerVoiture(); else recharger(); }
  if (t === '1' || t === '&') appelerAscenseur('-1');           // « & » : la touche 1 d'un clavier AZERTY sans Maj
  if (t === '2' || t === 'é') appelerAscenseur('-2');
});
document.querySelectorAll('#ascenseur button').forEach(b => b.addEventListener('click', () => appelerAscenseur(b.dataset.niveau)));
addEventListener('keyup', e => { touches[e.key.toLowerCase()] = false; });
const appuye = action => !!touches[reglages.touches[action]];

// --- 6d. La caméra tourne autour du personnage quand on glisse
let angleCamera = 0, hauteurCamera = 0.45;
let glisse = null;
const toile3D = renderer.domElement;
const sourisCapturee = () => document.pointerLockElement === toile3D;
// Capturer la souris : le curseur disparaît et chaque mouvement tourne la caméra (Échap pour la libérer)
function capturerSouris() {
  if (matchMedia('(pointer: coarse)').matches || !toile3D.requestPointerLock) return;
  try { const r = toile3D.requestPointerLock(); if (r && r.catch) r.catch(() => {}); } catch (e) {}
}
document.addEventListener('mousemove', e => {
  if (!sourisCapturee() || !enJeu) return;
  const s = reglages.sensi, sens = reglages.inverse ? -1 : 1;
  angleCamera -= e.movementX * 0.0035 * s;
  hauteurCamera = Math.min(enVoiture ? 1.1 : 1.35, Math.max(enVoiture ? 0.15 : -0.45, hauteurCamera + e.movementY * 0.0028 * s * sens));
});
// Clic droit : en voiture on regarde derrière (tant qu'on tient), à pied avec une arme on vise
let regardArriere = false, viser = false;
toile3D.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('contextmenu', e => { if (enJeu) e.preventDefault(); });
document.addEventListener('mousedown', e => {
  if (!enJeu || !sourisCapturee()) return;
  if (e.button === 2) { if (enVoiture) regardArriere = true; else viser = true; }
  if (e.button === 0 && !enVoiture) tirer();
});
document.addEventListener('mouseup', e => { if (e.button === 2) { regardArriere = false; viser = false; } });
// Si la souris est libérée (touche Échap) pendant le jeu, on ouvre le menu, comme dans les jeux PC
let liberationVoulue = false;
document.addEventListener('pointerlockchange', () => {
  if (!sourisCapturee() && enJeu && !liberationVoulue) ouvrirMenu();
  liberationVoulue = false;
  $('aide-souris').style.display = enJeu && !sourisCapturee() && !chatOuvert() && !matchMedia('(pointer: coarse)').matches ? 'block' : 'none';
});
toile3D.addEventListener('click', () => { if (enJeu && !sourisCapturee()) capturerSouris(); });
toile3D.addEventListener('pointerdown', e => { if (!sourisCapturee()) glisse = { id: e.pointerId, x: e.clientX, y: e.clientY }; });
addEventListener('pointermove', e => {
  if (!glisse || e.pointerId !== glisse.id || !enJeu || sourisCapturee()) return;
  const s = reglages.sensi, sens = reglages.inverse ? -1 : 1;
  angleCamera -= (e.clientX - glisse.x) * 0.006 * s;
  hauteurCamera = Math.min(enVoiture ? 1.1 : 1.35, Math.max(enVoiture ? 0.15 : -0.45, hauteurCamera + (e.clientY - glisse.y) * 0.004 * s * sens));
  glisse.x = e.clientX; glisse.y = e.clientY;
});
addEventListener('pointerup', e => { if (glisse && e.pointerId === glisse.id) glisse = null; });

// Joystick tactile
const joy = document.getElementById('joy'), bouton = joy.querySelector('span');
const joystick = { x: 0, y: 0, id: null };
function bougerJoy(e) {
  const r = joy.getBoundingClientRect(), max = r.width * 0.35;
  let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
  const d = Math.hypot(dx, dy);
  if (d > max) { dx *= max / d; dy *= max / d; }
  bouton.style.transform = `translate(${dx}px, ${dy}px)`;
  joystick.x = dx / max; joystick.y = dy / max;
}
joy.addEventListener('pointerdown', e => { e.stopPropagation(); joystick.id = e.pointerId; joy.setPointerCapture(e.pointerId); bougerJoy(e); });
joy.addEventListener('pointermove', e => { if (e.pointerId === joystick.id) bougerJoy(e); });
const lacherJoy = () => { joystick.id = null; joystick.x = joystick.y = 0; bouton.style.transform = ''; };
joy.addEventListener('pointerup', lacherJoy); joy.addEventListener('pointercancel', lacherJoy);

// Bouton tactile : « Saut » à pied, « Frein » (frein à main) en voiture
let freinTactile = false;
const btnSaut = document.getElementById('saut');
btnSaut.addEventListener('pointerdown', e => { e.stopPropagation(); if (enVoiture) freinTactile = true; else sauter(); });
btnSaut.addEventListener('pointerup', () => { freinTactile = false; });
btnSaut.addEventListener('pointercancel', () => { freinTactile = false; });
document.getElementById('btn-e').addEventListener('pointerdown', e => { e.stopPropagation(); actionE(); });
document.getElementById('btn-objet').addEventListener('pointerdown', e => { e.stopPropagation(); utiliserObjetJoueur(); });
document.getElementById('btn-vue').addEventListener('click', e => { e.stopPropagation(); changerVue(); e.currentTarget.blur(); });

function sauter() {
  if (enJeu && etat.auSol) { etat.vitesseY = 5.6; etat.auSol = false; }
}

// --- 6e. Le surnom au-dessus de la tête
// On dessine le texte sur une petite image (canvas), puis on l'affiche dans la 3D
// avec un « sprite » : une image toujours tournée vers la caméra.
const toile = document.createElement('canvas');
toile.width = 512; toile.height = 128;
const texture = new THREE.CanvasTexture(toile);
const etiquette = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
etiquette.position.y = 3.45;
perso.add(etiquette);

function majSurnom() {
  const ctx = toile.getContext('2d');
  ctx.clearRect(0, 0, toile.width, toile.height);
  const texte = reglages.surnom;
  etiquette.visible = texte.length > 0;
  if (!texte) return;
  ctx.font = '700 56px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
  const largeur = Math.min(ctx.measureText(texte).width + 56, toile.width - 8);
  const x = (toile.width - largeur) / 2;
  ctx.fillStyle = 'rgba(23, 50, 74, 0.78)';            // fond arrondi
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, 20, largeur, 88, 44); else ctx.rect(x, 20, largeur, 88);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(texte, toile.width / 2, 66, toile.width - 60);
  texture.needsUpdate = true;
  etiquette.scale.set(1.5, 0.375, 1);                    // taille dans le monde 3D
}
