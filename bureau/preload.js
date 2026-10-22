// Le pont entre l'application (la page) et l'ordinateur : seules ces fonctions sont offertes à la page, rien d'autre.
const { contextBridge, ipcRenderer } = require('electron');

const appeler = (canal, argument) => ipcRenderer.invoke(canal, argument);

// Les données enregistrées, lues une seule fois ; l'affichage choisi (bureau, mobile ou sobre : voir src/shared/utils/affichage.ts) en fait partie.
const donneesAuDemarrage = ipcRenderer.sendSync('stockage:charger');
const AFFICHAGE = donneesAuDemarrage['bureau:affichage'] ?? 'bureau';

contextBridge.exposeInMainWorld('bureau', {
  /** Toutes les données enregistrées au démarrage (le reste du temps, la page les garde en mémoire et n'envoie que les changements). */
  donnees: donneesAuDemarrage,
  dossiers: ipcRenderer.sendSync('fs:dossiers'),
  ecrireStockage: (ecrire, retirer) => appeler('stockage:ecrire', { ecrire, retirer }),
  fichiers: {
    creerDossier: (chemin) => appeler('fs:creerDossier', chemin),
    copier: (de, vers) => appeler('fs:copier', { de, vers }),
    lire: (chemin, encodage) => appeler('fs:lire', { chemin, encodage }),
    ecrire: (chemin, contenu, encodage) => appeler('fs:ecrire', { chemin, contenu, encodage }),
    supprimer: (chemin) => appeler('fs:supprimer', chemin),
    existe: (chemin) => appeler('fs:existe', chemin),
    choisir: (extensions, multiple) => appeler('dialogue:ouvrir', { extensions, multiple }),
    enregistrerSous: (source, nom, titre) => appeler('fichier:enregistrerSous', { source, nom, titre }),
    ouvrir: (chemin) => appeler('fichier:ouvrir', chemin),
    imprimerPdf: (html, paysage, sansMarges, pied) => appeler('pdf:imprimer', { html, paysage, sansMarges, pied }),
  },
  menu: {
    definir: (menus, affichage) => appeler('menu:definir', { menus, affichage }),
    surChoix: (rappel) => {
      const ecoute = (_evenement, route) => rappel(route);
      ipcRenderer.on('menu:aller', ecoute);
      return () => ipcRenderer.removeListener('menu:aller', ecoute);
    },
  },
  google: {
    connexion: () => appeler('google:connexion'),
    jeton: () => appeler('google:jeton'),
    email: () => appeler('google:email'),
    deconnexion: () => appeler('google:deconnexion'),
  },
});

// ---------------------------------------------------------------------------------------------------------------------
// Les boutons en icône de l'en-tête (graphique, pile, horloge…) : sur ordinateur, leur nom s'écrit à côté, comme dans la barre d'outils
// d'un programme. Le nom est celui que l'application leur a déjà donné (pour les lecteurs d'écran) ; rien ne change dans l'application.
// ---------------------------------------------------------------------------------------------------------------------
const HAUTEUR_ENTETE = 70;
const CLASSE_ETIQUETTE = 'bureau-etiquette';

/** Vrai pour un élément d'une zone qui défile : un bouton de l'en-tête n'y est jamais (un bouton du contenu y passe sous l'en-tête). */
function dansUneZoneQuiDefile(element) {
  for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
    const defilement = getComputedStyle(parent).overflowY;
    if (defilement === 'auto' || defilement === 'scroll') return true;
  }
  return false;
}

function etiqueterLesBoutonsDEntete() {
  // Les noms écrits à côté des icônes sont ceux de l'affichage « bureau » : le mobile garde les icônes seules, comme le téléphone.
  if (AFFICHAGE !== 'bureau') return;
  for (const bouton of document.querySelectorAll('div[aria-label]')) {
    const nom = bouton.getAttribute('aria-label');
    if (bouton.dataset.etiquette) {
      // Le même bouton change de nom (l'en-tête garde son élément d'un onglet à l'autre) : son étiquette suit.
      const etiquetee = bouton.querySelector('.' + CLASSE_ETIQUETTE);
      if (etiquetee && nom && etiquetee.textContent !== nom) etiquetee.textContent = nom;
      continue;
    }
    // Un bouton en icône seulement (un seul caractère : le dessin de l'icône), visible, dans l'en-tête.
    if (
      !nom ||
      bouton.textContent.length > 2 ||
      !bouton.checkVisibility({ opacityProperty: true, visibilityProperty: true })
    )
      continue;
    const place = bouton.getBoundingClientRect();
    if (place.width === 0 || place.top < 0 || place.top >= HAUTEUR_ENTETE || dansUneZoneQuiDefile(bouton))
      continue;
    const icone = bouton.firstElementChild ?? bouton;
    const etiquette = document.createElement('span');
    etiquette.className = CLASSE_ETIQUETTE;
    etiquette.textContent = nom;
    etiquette.style.color = getComputedStyle(icone).color;
    bouton.dataset.etiquette = '1';
    bouton.style.width = 'auto';
    bouton.style.flexDirection = 'row';
    bouton.style.alignItems = 'center';
    bouton.style.gap = '6px';
    bouton.style.paddingLeft = '6px';
    bouton.style.paddingRight = '6px';
    bouton.append(etiquette);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent =
    '.' +
    CLASSE_ETIQUETTE +
    ' { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 600; white-space: nowrap; }';
  document.head.append(style);
  // L'affichage sobre : tout en nuances de gris (les dessins de l'accueil sont remplacés par des listes dans l'application).
  if (AFFICHAGE === 'sobre') {
    const sobre = document.createElement('style');
    sobre.id = 'affichage-sobre';
    sobre.textContent = 'html { filter: grayscale(1); }';
    document.head.append(sobre);
  }
  // Les modales de l'application (un conteneur fixe plein écran) ne couvrent que la zone de droite : le menu de gauche reste libre.
  // La largeur du menu est donnée par l'application (--bureau-menu-gauche, 0 sans menu).
  const modales = document.createElement('style');
  modales.textContent =
    'div:has(> div[aria-modal="true"]), div[aria-modal="true"] { left: var(--bureau-menu-gauche, 0px) !important; }';
  document.head.append(modales);
  let planifie = false;
  new MutationObserver(() => {
    if (planifie) return;
    planifie = true;
    requestAnimationFrame(() => {
      planifie = false;
      etiqueterLesBoutonsDEntete();
    });
  }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label'] });
});
