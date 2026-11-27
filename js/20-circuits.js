// MAN'SCAVE — 20-circuits.js
// =====================================================================
// 12. CHANGER DE CIRCUIT : le circuit actif suit l'étage où l'on est (le haut, ou le TRIP au niveau -3)
// =====================================================================
function changerCircuit(c) {
  const ancien = circuitActif;
  // Une course en cours sur l'ancien circuit est annulée (adversaires, objets lancés, musique)
  if (depart.etat !== 'attente' || depart.arme) {
    if (depart.etat === 'course' || depart.etat === 'sequence') { annoncer('Course annulée', 'faux'); arreterMusique(1.5); }
    Object.assign(depart, { etat: 'attente', arme: false, t: 0 });
  }
  retirerBots();
  for (const p of projectiles) scene.remove(p.mesh);
  projectiles.length = 0;
  ancien.feux.allumer(0);
  ancien.console.bouton.material = matBoutonOff;
  ancien.console.ecran('COURSE', 'Appuie sur E', '#ff4a55');
  for (const k of ancien.caisses) k.mesh.visible = false;
  // On passe sur le nouveau circuit
  activerCircuit(c);
  caisses = c.caisses;
  for (const k of caisses) k.mesh.visible = k.actif;
  preparerCarte(c);
  for (const v of voitures) v.auto.indicePiste = undefined;   // les repères sur l'ancienne piste ne veulent plus rien dire
  indicePrecedentJoueur = -1;
}
function majCircuit(cible) {
  const voulu = cible.y < Y_TRIP ? CIRCUIT_TRIP : CIRCUIT_HAUT;
  if (voulu !== circuitActif) changerCircuit(voulu);
}

// La première descente au -3 ne doit pas « bégayer » : on prépare dès maintenant les matériaux du hangar
{
  for (const o of objetsTrip) o.visible = true;
  renderer.compile(scene, camera);
  for (const o of objetsTrip) o.visible = false;
}

// =====================================================================
// DÉMARRAGE DU JEU (en dernier : tous les fichiers sont chargés)
// =====================================================================
appliquerCouleurs();
NB_TOURS = reglages.tours || 3;
document.getElementById('fps').style.display = reglages.fps !== false ? 'block' : 'none';
majSurnom();
ouvrirMenu();
boucle();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
