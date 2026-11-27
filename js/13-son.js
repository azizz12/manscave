// MAN'SCAVE — 13-son.js
// =====================================================================
// 8. LA BOUCLE DE JEU : répétée environ 60 fois par seconde
// =====================================================================
// Compteur de vitesse : graduations adaptées à la voiture (0 à 320, 280 ou 240 km/h sur un arc de 270°)
let VITESSE_MAX_COMPTEUR = 320;
const angleCompteur = kmh => -135 + clamp(kmh / VITESSE_MAX_COMPTEUR, 0, 1) * 270;   // en degrés, 0 = en haut
function dessinerCompteur() {
  VITESSE_MAX_COMPTEUR = specs.compteurMax;
  const valeurs = [];
  for (let v = 0; v <= VITESSE_MAX_COMPTEUR; v += 20) valeurs.push(v);
  $('graduations').innerHTML = valeurs.map(v => {
    const a = angleCompteur(v) * Math.PI / 180;
    const x1 = 100 + Math.sin(a) * 84, y1 = 100 - Math.cos(a) * 84, x2 = 100 + Math.sin(a) * (v % 40 ? 79 : 76), y2 = 100 - Math.cos(a) * (v % 40 ? 79 : 76);
    const tx = 100 + Math.sin(a) * 57, ty = 100 - Math.cos(a) * 57;
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>` +
           (v % 40 === 0 ? `<text x="${tx.toFixed(1)}" y="${ty.toFixed(1)}">${v}</text>` : '');
  }).join('');
  $('arc-regime').style.display = specs.rapports ? '' : 'none';
}
let aiguilleAffichee = 0;
function majCompteur(dt) {
  const kmh = Math.abs(auto.vitesse) * 3.6;             // m/s → km/h : vitesse réelle de la voiture
  aiguilleAffichee += (kmh - aiguilleAffichee) * Math.min(1, dt * 10);   // l'aiguille bouge en douceur
  $('aiguille').setAttribute('transform', `rotate(${angleCompteur(aiguilleAffichee).toFixed(1)} 100 100)`);
  $('arc-vitesse').setAttribute('stroke-dasharray', `${(clamp(aiguilleAffichee / VITESSE_MAX_COMPTEUR, 0, 1) * 100).toFixed(1)} 100`);
  $('arc-vitesse').setAttribute('stroke', kmh > specs.kmh * 0.85 ? '#ff3b47' : '#7fe8ff');
  $('vitesse').textContent = Math.round(kmh);
  // Rapport engagé et compte-tours
  let rapport = 'D';
  if (auto.vitesse < -0.5) rapport = 'R';
  else if (specs.rapports) rapport = String(auto.rapport + 1);
  $('rapport').textContent = rapport;
  if (specs.rapports) {
    const r = clamp((auto.rpm - specs.ralenti) / (specs.zoneRouge - specs.ralenti), 0, 1);
    $('arc-regime').setAttribute('stroke-dasharray', `${(r * 100).toFixed(1)} 100`);
    $('arc-regime').setAttribute('stroke', r > 0.9 ? '#ff3b47' : '#ffb02e');
  }
}

// =====================================================================
// 7b. LE SON : moteur V8, 4 cylindres ou électrique (fabriqué en direct avec Web Audio)
// =====================================================================
let audio = null;
function initAudio() {                                  // le navigateur exige un clic avant de jouer du son
  if (audio) { if (audio.ctx.state === 'suspended') audio.ctx.resume(); return; }
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const sr = ctx.sampleRate;
    // Un compresseur à la sortie : les détonations ne saturent pas et le moteur garde de la présence
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = 0.003; comp.release.value = 0.18;
    const master = ctx.createGain(); master.gain.value = reglages.volume;
    master.connect(comp); comp.connect(ctx.destination);

    // ---- Moteur thermique « procédural » : on fabrique chaque explosion de cylindre, une par une
    // Chaque explosion = une impulsion qui décroît vite. Les cylindres n'ont pas tous exactement la même force :
    // c'est ce qui donne le « glouglou » d'un V8 au ralenti.
    const M = { freq: 40, charge: 0, cyl: 8, drive: 2, coupe: false, ecarts: [1, 1, 1, 1, 1, 1, 1, 1] };
    // Le calcul des explosions tourne dans un « fil » à part (AudioWorklet) : il ne ralentit plus l'image.
    // Si le navigateur ne sait pas faire, on retombe sur l'ancienne méthode.
    const CODE_MOTEUR = `
      const etat = { freq: 40, charge: 0, cyl: 8, drive: 2, coupe: false, ecarts: [1,1,1,1,1,1,1,1], phase: 0, n: 0, amp: 0, env: 0, k: 0 };
      function remplir(out, sr) {
        const e = etat, f = e.freq, ch = e.charge, n = e.cyl, drive = e.drive;
        const dec = Math.exp(-f * 3.4 / sr);
        const w1 = 2 * Math.PI * f / sr, w2 = 2 * Math.PI * f * 2.02 / sr;
        for (let i = 0; i < out.length; i++) {
          e.phase += f / sr;
          if (e.phase >= 1) {
            e.phase -= 1; e.n = (e.n + 1) % n;
            const alea = 1 + (Math.random() - 0.5) * (0.1 + (1 - ch) * 0.4);
            e.amp = e.coupe ? 0.08 : (0.32 + 0.68 * ch) * (e.ecarts[e.n] || 1) * alea;
            e.env = 1; e.k = 0;
          }
          e.env *= dec; e.k++;
          const ton = Math.sin(w1 * e.k) * 0.75 + Math.sin(w2 * e.k) * (0.18 + 0.3 * ch);
          const souffle = (Math.random() * 2 - 1) * (0.22 + 0.5 * ch);
          out[i] = Math.tanh(e.amp * e.env * (ton + souffle) * drive) * 0.8;
        }
      }`;
    M.envoyer = () => {};
    const repli = () => {                                  // ancienne méthode (ScriptProcessor)
      const sp = ctx.createScriptProcessor(1024, 1, 1);
      const moteurLocal = new Function(CODE_MOTEUR + '; return { etat, remplir };')();
      sp.onaudioprocess = e => moteurLocal.remplir(e.outputBuffer.getChannelData(0), sr);
      M.envoyer = p => Object.assign(moteurLocal.etat, p);
      const silence = ctx.createConstantSource ? ctx.createConstantSource() : null;
      if (silence) { silence.offset.value = 0; silence.connect(sp); silence.start(); }
      return sp;
    };
    const entreeMoteur = ctx.createGain();               // point de branchement commun aux deux méthodes
    if (ctx.audioWorklet && window.Blob && window.URL) {
      const source = CODE_MOTEUR + `
        class Moteur extends AudioWorkletProcessor {
          constructor() { super(); this.port.onmessage = m => Object.assign(etat, m.data); }
          process(entrees, sorties) { remplir(sorties[0][0], sampleRate); return true; }
        }
        registerProcessor('moteur-robocam', Moteur);`;
      const url = URL.createObjectURL(new Blob([source], { type: 'application/javascript' }));
      ctx.audioWorklet.addModule(url).then(() => {
        const noeud = new AudioWorkletNode(ctx, 'moteur-robocam', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [1] });
        noeud.connect(entreeMoteur);
        M.envoyer = p => noeud.port.postMessage(p);
      }).catch(err => { console.warn("worklet moteur:", err && err.message); repli().connect(entreeMoteur); });
    } else {
      repli().connect(entreeMoteur);
    }
    // Résonance du pot d'échappement + filtre qui s'ouvre quand on accélère
    const resonance = ctx.createBiquadFilter(); resonance.type = 'peaking'; resonance.frequency.value = 160; resonance.Q.value = 1.2; resonance.gain.value = 7;
    const filtre = ctx.createBiquadFilter(); filtre.type = 'lowpass'; filtre.frequency.value = 900; filtre.Q.value = 0.9;
    const gMoteur = ctx.createGain(); gMoteur.gain.value = 0;
    entreeMoteur.connect(resonance); resonance.connect(filtre); filtre.connect(gMoteur); gMoteur.connect(master);

    // Bruits de base
    const bruit = ctx.createBuffer(1, sr * 0.5, sr);     // bruit qui décroît (chocs, détonations)
    const data = bruit.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 2);
    const bruitLong = ctx.createBuffer(1, sr * 2, sr);   // bruit continu en boucle (pneus, vent, admission)
    const dl = bruitLong.getChannelData(0);
    for (let i = 0; i < dl.length; i++) dl[i] = Math.random() * 2 - 1;
    const boucleBruit = (type, freq, q) => {
      const src = ctx.createBufferSource(); src.buffer = bruitLong; src.loop = true; src.loopStart = Math.random();
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
      const g = ctx.createGain(); g.gain.value = 0;
      src.connect(f); f.connect(g); g.connect(master); src.start();
      return { f, g };
    };
    const admission = boucleBruit('bandpass', 1400, 1.4);   // l'air aspiré par le moteur
    const crisse = boucleBruit('bandpass', 2100, 4);        // pneus qui crissent
    const vent = boucleBruit('lowpass', 500, 0.7);          // le vent à haute vitesse
    const roulement = boucleBruit('lowpass', 160, 1.5);     // les pneus qui roulent sur l'asphalte

    // Turbo : un sifflement aigu qui monte avec la pression
    const turbo = ctx.createOscillator(); turbo.type = 'sine'; turbo.frequency.value = 2000;
    const turbo2 = ctx.createOscillator(); turbo2.type = 'sine'; turbo2.frequency.value = 3010;
    const gTurbo = ctx.createGain(); gTurbo.gain.value = 0;
    turbo.connect(gTurbo); turbo2.connect(gTurbo); gTurbo.connect(master);

    // Moteur électrique : plusieurs harmoniques + le sifflement aigu de l'onduleur
    const oe = ctx.createOscillator(); oe.type = 'sine';
    const oe2 = ctx.createOscillator(); oe2.type = 'triangle';
    const oe3 = ctx.createOscillator(); oe3.type = 'sine';
    const g3 = ctx.createGain(); g3.gain.value = 0.25;
    const ge = ctx.createGain(); ge.gain.value = 0;
    oe.connect(ge); oe2.connect(ge); oe3.connect(g3); g3.connect(ge); ge.connect(master);
    for (const o of [turbo, turbo2, oe, oe2, oe3]) o.start();

    // Courbe de distorsion pour les détonations de l'anti-lag
    const courbe = new Float32Array(1024);
    for (let i = 0; i < 1024; i++) { const x = i / 512 - 1; courbe[i] = Math.tanh(x * 5); }

    audio = { ctx, master, M, filtre, resonance, gMoteur, admission, crisse, vent, roulement, gTurbo, turbo, turbo2, oe, oe2, oe3, ge,
              bruit, courbe, coupure: 0, pression: 0 };
  } catch (e) { audio = null; }
}
function demarrerMoteur() { initAudio(); }
function sonChangement() { if (audio) audio.coupure = 0.12; }   // le son baisse pendant le passage de rapport
function sonChoc(force) {
  if (!audio) return;
  const src = audio.ctx.createBufferSource(); src.buffer = audio.bruit;
  const f = audio.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500 + force * 900;
  const g = audio.ctx.createGain(); g.gain.value = 0.25 + force * 0.6;
  src.connect(f); f.connect(g); g.connect(audio.master);
  src.start();
}
function sonClic() {
  if (!audio) return;
  const o = audio.ctx.createOscillator(), g = audio.ctx.createGain();
  o.type = 'square'; o.frequency.value = 880; g.gain.value = 0.12;
  g.gain.exponentialRampToValueAtTime(0.001, audio.ctx.currentTime + 0.12);
  o.connect(g); g.connect(audio.master); o.start(); o.stop(audio.ctx.currentTime + 0.13);
}
function sonBoost() {
  if (!audio) return;
  const src = audio.ctx.createBufferSource(); src.buffer = audio.bruit;
  const f = audio.ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2;
  f.frequency.setValueAtTime(600, audio.ctx.currentTime); f.frequency.exponentialRampToValueAtTime(3200, audio.ctx.currentTime + 0.45);
  const g = audio.ctx.createGain(); g.gain.value = 0.5;
  src.connect(f); f.connect(g); g.connect(audio.master); src.start();
}
// Détonation de l'anti-lag : un « BANG » sec (bruit saturé) + un coup sourd dans les basses
function sonBang(force, volume = 1) {
  if (!audio || volume <= 0.01) return;
  const ctx = audio.ctx, t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = audio.bruit; src.playbackRate.value = 0.55 + Math.random() * 0.4;
  const dist = ctx.createWaveShaper(); dist.curve = audio.courbe;
  const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900 + force * 1800 + Math.random() * 500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.75 * force * volume, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.1 + force * 0.12);
  src.connect(dist); dist.connect(f); f.connect(g); g.connect(audio.master);
  src.start(t); src.stop(t + 0.3);
  const o = ctx.createOscillator(); o.type = 'sine';
  o.frequency.setValueAtTime(120 + Math.random() * 40, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  const go = ctx.createGain();
  go.gain.setValueAtTime(0.9 * force * volume, t); go.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
  o.connect(go); go.connect(audio.master); o.start(t); o.stop(t + 0.18);
}
// Soupape de décharge du turbo quand on lâche l'accélérateur : « pschhh-tutututu »
function sonDecharge(force) {
  if (!audio) return;
  const ctx = audio.ctx, t = ctx.currentTime;
  const src = ctx.createBufferSource(); src.buffer = audio.bruit; src.playbackRate.value = 0.8;
  const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.6;
  f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(700, t + 0.4);
  const flutter = ctx.createGain(); flutter.gain.value = 0.55;            // « tutututu » : le volume est haché 22 fois par seconde
  const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.setValueAtTime(26, t); lfo.frequency.linearRampToValueAtTime(14, t + 0.4);
  const lfoG = ctx.createGain(); lfoG.gain.value = 0.45; lfo.connect(lfoG); lfoG.connect(flutter.gain);
  const env = ctx.createGain(); env.gain.setValueAtTime(0.38 * force, t); env.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
  src.connect(f); f.connect(flutter); flutter.connect(env); env.connect(audio.master);
  src.start(t); src.stop(t + 0.5); lfo.start(t); lfo.stop(t + 0.5);
}

function majSon(dt) {
  if (!audio) return;
  const t = audio.ctx.currentTime, M = audio.M;
  audio.master.gain.setTargetAtTime(enJeu ? reglages.volume : 0, t, 0.1);
  audio.coupure = Math.max(0, audio.coupure - dt);
  let gainMoteur = 0, gainElec = 0, gainTurbo = 0, gainAdmission = 0;
  const v = enVoiture ? Math.abs(auto.vitesse) : 0;
  if (enVoiture) {
    if (specs.rapports) {
      const tours = Math.max(specs.ralenti, auto.rpm);
      const r = clamp((tours - specs.ralenti) / (specs.zoneRouge - specs.ralenti), 0, 1);
      const gaz = auto.gaz || 0;
      const rupteur = r > 0.975 && gaz > 0.5 && auto.rapport < specs.rapports.length - 1;   // au rupteur (jamais en dernière)
      M.freq = tours / 60 * (specs.cylindres / 2);                  // fréquence des explosions
      M.cyl = specs.cylindres;
      M.charge += ((audio.coupure > 0 ? 0.1 : gaz) - M.charge) * Math.min(1, dt * 14);
      M.coupe = rupteur && Math.floor(t * 18) % 2 === 0;
      M.drive = (1.6 + M.charge * 2.6 + r * 1.2) * ((specs.son && specs.son.drive) || 1);
      if (!M.ecartsPour || M.ecartsPour !== specs.nom) {             // chaque moteur a sa « signature »
        M.ecartsPour = specs.nom;
        M.ecarts = specs.cylindres === 8 ? [1, 0.78, 1.1, 0.86, 0.95, 1.12, 0.8, 1.04]            // V8 : le « glouglou »
                 : specs.cylindres === 12 ? Array.from({ length: 12 }, (_, k) => 0.96 + 0.08 * ((k * 7) % 5) / 4)   // V12 : très régulier (il « hurle »)
                 : specs.nom === 'Kaiser 88' ? [1, 0.9, 1.08, 0.94] : [1, 0.93, 1.05, 0.96];
      }
      M.envoyer({ freq: M.freq, charge: M.charge, cyl: M.cyl, drive: M.drive, coupe: M.coupe, ecarts: M.ecarts });
      const v8 = specs.cylindres === 8;
      const S = specs.son || (v8 ? { res: 110, resR: 160, filtre: 420, turbo: 0.012, drive: 1, admission: 1 } : { res: 190, resR: 260, filtre: 650, turbo: 0.03, drive: 1, admission: 1 });
      audio.resonance.frequency.setTargetAtTime(S.res + r * S.resR, t, 0.05);
      audio.filtre.frequency.setTargetAtTime(S.filtre + M.charge * 2400 + r * 1800, t, 0.04);
      gainMoteur = (0.16 + M.charge * 0.16 + r * 0.06) * (audio.coupure > 0 ? 0.45 : 1);
      // Turbo : la pression monte quand on accélère dans les tours, et retombe d'un coup quand on lâche
      const cible = gaz > 0.5 ? clamp(r * 1.3 - 0.15, 0, 1) : 0;
      audio.pression += (cible - audio.pression) * Math.min(1, dt * (cible > audio.pression ? 1.8 : 6));
      gainTurbo = audio.pression * S.turbo;
      audio.turbo.frequency.setTargetAtTime(1800 + audio.pression * 5200, t, 0.05);
      audio.turbo2.frequency.setTargetAtTime(2700 + audio.pression * 7900, t, 0.05);
      gainAdmission = M.charge * (0.02 + r * 0.05) * (S.admission || 1);   // la 4 cylindres « aspire » fort (papillons individuels)
      audio.admission.f.frequency.setTargetAtTime(900 + r * 2600, t, 0.05);
    } else {
      // Électrique : un chant qui monte avec la vitesse, plus fort quand on accélère
      audio.oe.frequency.setTargetAtTime(120 + v * 11, t, 0.05);
      audio.oe2.frequency.setTargetAtTime(240 + v * 22.3, t, 0.05);
      audio.oe3.frequency.setTargetAtTime(1600 + v * 95, t, 0.05);
      gainElec = 0.012 + Math.min(0.045, v / specs.vmax * 0.045) + (auto.gaz || 0) * 0.025;
    }
  }
  audio.gMoteur.gain.setTargetAtTime(gainMoteur, t, 0.03);
  audio.ge.gain.setTargetAtTime(gainElec, t, 0.08);
  audio.gTurbo.gain.setTargetAtTime(gainTurbo, t, 0.05);
  audio.admission.g.gain.setTargetAtTime(gainAdmission, t, 0.05);
  // Vent et roulement : on sent la vitesse
  audio.vent.g.gain.setTargetAtTime(Math.min(0.14, Math.pow(v / 80, 2) * 0.14), t, 0.1);
  audio.vent.f.frequency.setTargetAtTime(350 + v * 14, t, 0.1);
  audio.roulement.g.gain.setTargetAtTime(enVoiture && !auto.enLair ? Math.min(0.09, v * 0.0018) : 0, t, 0.08);
  const crisse = enVoiture ? (auto.fumee || 0) : 0;
  audio.crisse.g.gain.setTargetAtTime(crisse * 0.16, t, 0.06);
  audio.crisse.f.frequency.setTargetAtTime(1800 + crisse * 600 + Math.random() * 300, t, 0.05);
}

// =====================================================================
// ANTI-LAG : quand on lâche l'accélérateur dans les tours, l'essence explose dans l'échappement
// → des détonations en rafale et des flammes qui sortent des pots
// =====================================================================
const MAT_FLAMME = new THREE.MeshBasicMaterial({ color: '#ff6a1a', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false });
const MAT_FLAMME_COEUR = new THREE.MeshBasicMaterial({ color: '#9fd0ff', transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
const GEO_FLAMME = new THREE.ConeGeometry(0.2, 1, 14, 1, true); GEO_FLAMME.translate(0, 0.5, 0);
const GEO_FLAMME_COEUR = new THREE.ConeGeometry(0.1, 0.5, 10, 1, true); GEO_FLAMME_COEUR.translate(0, 0.25, 0);
const MAT_LUEUR = new THREE.SpriteMaterial({ map: texFumee, color: '#ff8a30', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
// Halo orange posé au sol derrière la voiture : remplace une vraie lumière (beaucoup plus léger pour l'ordinateur)
const MAT_HALO_SOL = new THREE.MeshBasicMaterial({ map: texFumee, color: '#ff7a24', transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
const GEO_HALO_SOL = new THREE.PlaneGeometry(3.2, 2.4); GEO_HALO_SOL.rotateX(-Math.PI / 2);
const modelesEnFeu = new Set();
let flammesEnvoyees = 0;                                  // compteur partagé en multijoueur : les autres voient nos flammes
const posFlamme = new THREE.Vector3();

function declencherFlamme(mod, force) {
  if (!mod.echappements) return;
  if (!mod.flammes) {                                     // on crée les flammes la première fois seulement
    mod.flammes = mod.echappements.map(p => {
      const g = new THREE.Group();
      g.add(new THREE.Mesh(GEO_FLAMME, MAT_FLAMME), new THREE.Mesh(GEO_FLAMME_COEUR, MAT_FLAMME_COEUR));
      g.position.copy(p); g.rotation.order = 'ZYX'; g.rotation.z = -Math.PI / 2;   // le cône pointe vers l'arrière de la voiture
      g.visible = false; mod.add(g);
      const lueur = new THREE.Sprite(MAT_LUEUR);           // halo lumineux au bout du pot
      lueur.position.copy(p).add(new THREE.Vector3(0.25, 0, 0)); lueur.visible = false; mod.add(lueur);
      g.lueur = lueur;
      return g;
    });
    const xs = mod.echappements.map(p => p.x);
    mod.haloSol = new THREE.Mesh(GEO_HALO_SOL, MAT_HALO_SOL);
    mod.haloSol.position.set(Math.max(...xs) + 1.1, 0.04, 0); mod.haloSol.visible = false; mod.add(mod.haloSol);
  }
  mod.feu = 0.06 + force * 0.08; mod.feuForce = force;
  modelesEnFeu.add(mod);
}
function majFlammes(dt) {
  for (const mod of modelesEnFeu) {
    mod.feu -= dt;
    const allume = mod.feu > 0;
    for (const g of mod.flammes) {
      g.visible = allume; g.lueur.visible = allume;
      mod.haloSol.visible = allume; if (allume) mod.haloSol.scale.setScalar(0.7 + mod.feuForce * 0.5 + Math.random() * 0.2);
      if (allume) {
        const l = (0.6 + Math.random() * 0.9) * (0.5 + mod.feuForce * 0.9);
        const w = 0.8 + Math.random() * 0.6;
        g.scale.set(w, l, w);
        g.rotation.y = Math.random() * Math.PI;          // la flamme « danse » autour de son axe
        g.lueur.scale.setScalar(0.7 + mod.feuForce * 0.9 + Math.random() * 0.3);
      }
    }
    if (!allume) modelesEnFeu.delete(mod);
  }
}
// Une détonation sur NOTRE voiture : flamme + son + compteur pour le multijoueur
function explosionEchappement(force) {
  if (!enVoiture || !modele.echappements) return;
  declencherFlamme(modele, force);
  sonBang(force, 1);
  flammesEnvoyees++;
}
const antiLag = { actif: 0, prochain: 0, gazPrec: 0 };
function majAntiLag(dt) {
  if (!specs.rapports || !modele.echappements || auto.enLair) { antiLag.gazPrec = auto.gaz || 0; return; }
  const r = clamp((auto.rpm - specs.ralenti) / (specs.zoneRouge - specs.ralenti), 0, 1);
  const gaz = auto.gaz || 0;
  // On vient de lâcher l'accélérateur dans les tours : l'anti-lag se déclenche
  if (antiLag.gazPrec > 0.5 && gaz < 0.1 && r > 0.4 && Math.abs(auto.vitesse) > 3) {
    antiLag.actif = 0.45 + r * 0.9; antiLag.prochain = 0.02;
    if (!specs.son || specs.son.turbo > 0) sonDecharge(Math.min(1, 0.5 + (audio ? audio.pression : 0) * 0.5));   // soupape : seulement les moteurs turbo
  }
  antiLag.gazPrec = gaz;
  if (gaz > 0.1) antiLag.actif = 0;
  if (antiLag.actif > 0) {
    antiLag.actif -= dt; antiLag.prochain -= dt;
    if (antiLag.prochain <= 0) {                          // rafale irrégulière de détonations
      explosionEchappement(0.5 + Math.random() * 0.5);
      antiLag.prochain = 0.045 + Math.random() * 0.14;
    }
  } else if (gaz < 0.1 && r > 0.25 && Math.random() < dt * 3 * r) {
    explosionEchappement(0.2 + Math.random() * 0.25);   // petits « pops » en décélération
  }
}
