// Troupeau Chèvres pour Windows : la version web de l'application dans une fenêtre de bureau, qui fonctionne sans internet.
// Les données sont rangées dans des fichiers de l'ordinateur (dossier de l'application dans %APPDATA%) ; internet ne sert qu'à Google Drive.
const { app, BrowserWindow, Menu, dialog, ipcMain, protocol, screen, session, shell } = require('electron');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { connexionGoogle, deconnexionGoogle, emailGoogle, jetonGoogle } = require('./google');
const { TEXTES } = require('./textes');

// Les données au même endroit que l'application soit lancée par le développeur ou installée : %APPDATA%Troupeau Chèvres.
// (BUREAU_DONNEES : un autre dossier, pour essayer le programme sans toucher aux vraies données ni gêner l'application déjà ouverte.)
app.setPath('userData', process.env.BUREAU_DONNEES || path.join(app.getPath('appData'), TEXTES.titre));

const DOSSIER_APPLICATION = path.join(__dirname, '..', 'dist');
const SCHEMA = 'app';
const HOTE = 'local';
// Le début de l'adresse d'un fichier joint (voir ADRESSE_FICHIERS_BUREAU dans src/shared/constants/fichiers.ts).
const PREFIXE_FICHIERS = '/fichier/';

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEMA, privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } },
]);

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
};

// ---------------------------------------------------------------------------------------------------------------------
// Les dossiers : les données et les pièces jointes (userData), les fichiers de passage (temp).
// ---------------------------------------------------------------------------------------------------------------------
const dossierDonnees = () => app.getPath('userData');
const dossierDocuments = () => path.join(dossierDonnees(), 'documents');
const dossierCache = () => path.join(os.tmpdir(), 'troupeau-chevres');
const posix = (p) => p.replace(/\\/g, '/');

/** Les fichiers que l'utilisateur a désignés (sélecteur, « Enregistrer sous ») : l'application peut les lire. */
const lecturesAutorisees = new Set();

const dansUn = (dossier, chemin) => {
  const relatif = path.relative(dossier, path.resolve(chemin));
  return !relatif.startsWith('..') && !path.isAbsolute(relatif);
};
const estAutorise = (chemin, avecChoisis) =>
  dansUn(dossierDonnees(), chemin) ||
  dansUn(dossierCache(), chemin) ||
  (avecChoisis && lecturesAutorisees.has(path.resolve(chemin)));

function verifier(chemin, avecChoisis = false) {
  const complet = path.resolve(chemin);
  if (!estAutorise(complet, avecChoisis)) throw new Error(`${TEXTES.cheminRefuse} ${chemin}`);
  return complet;
}

// ---------------------------------------------------------------------------------------------------------------------
// Les données (équivalent de AsyncStorage) : un fichier JSON, en mémoire, écrit sans attendre à chaque changement.
// ---------------------------------------------------------------------------------------------------------------------
let donnees = {};
let aEcrire = null;
const fichierDonnees = () => path.join(dossierDonnees(), 'donnees.json');

function lireFichierDonnees(chemin) {
  try {
    return JSON.parse(fs.readFileSync(chemin, 'utf8'));
  } catch {
    return undefined;
  }
}

function chargerDonnees() {
  // Le fichier principal, à défaut la copie de la fois d'avant (si l'ordinateur s'est éteint pendant une écriture).
  donnees = lireFichierDonnees(fichierDonnees()) ?? lireFichierDonnees(`${fichierDonnees()}.bak`) ?? {};
}

function ecrireDonnees() {
  aEcrire = null;
  fs.mkdirSync(dossierDonnees(), { recursive: true });
  const cible = fichierDonnees();
  const provisoire = `${cible}.tmp`;
  fs.writeFileSync(provisoire, JSON.stringify(donnees));
  if (fs.existsSync(cible)) fs.copyFileSync(cible, `${cible}.bak`);
  fs.renameSync(provisoire, cible);
}

// Une copie par jour des données, gardée trente jours : de quoi revenir en arrière après une fausse manœuvre ou un fichier abîmé.
// Elle est sur le même disque : elle ne remplace pas une sauvegarde hors de l'ordinateur (fichier ou Google Drive).
const NOMBRE_DE_COPIES = 30;
const dossierCopies = () => path.join(dossierDonnees(), 'sauvegardes-auto');

function copieDuJour() {
  try {
    const source = fichierDonnees();
    if (!fs.existsSync(source)) return;
    const jour = new Date().toISOString().slice(0, 10);
    const cible = path.join(dossierCopies(), `donnees_${jour}.json`);
    if (fs.existsSync(cible)) return;
    fs.mkdirSync(dossierCopies(), { recursive: true });
    fs.copyFileSync(source, cible);
    const copies = fs
      .readdirSync(dossierCopies())
      .filter((f) => /^donnees_\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort();
    for (const ancienne of copies.slice(0, Math.max(0, copies.length - NOMBRE_DE_COPIES))) {
      fs.unlinkSync(path.join(dossierCopies(), ancienne));
    }
  } catch {
    // Une copie qui échoue ne doit jamais empêcher l'application de démarrer.
  }
}

const planifierEcriture = () => {
  if (!aEcrire) aEcrire = setTimeout(ecrireDonnees, 300);
};

ipcMain.on('stockage:charger', (e) => {
  e.returnValue = donnees;
});
ipcMain.handle('stockage:ecrire', (_e, { ecrire = {}, retirer = [] }) => {
  Object.assign(donnees, ecrire);
  for (const cle of retirer) delete donnees[cle];
  planifierEcriture();
});
ipcMain.on('fs:dossiers', (e) => {
  e.returnValue = { documents: `${posix(dossierDocuments())}/`, cache: `${posix(dossierCache())}/` };
});

// ---------------------------------------------------------------------------------------------------------------------
// Les fichiers : pièces jointes, sauvegardes, exports.
// ---------------------------------------------------------------------------------------------------------------------
ipcMain.handle('fs:creerDossier', (_e, chemin) => {
  fs.mkdirSync(verifier(chemin), { recursive: true });
});
ipcMain.handle('fs:copier', (_e, { de, vers }) => {
  const source = verifier(de, true);
  const cible = verifier(vers);
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.copyFileSync(source, cible);
});
ipcMain.handle('fs:lire', (_e, { chemin, encodage }) =>
  fs.readFileSync(verifier(chemin, true), encodage === 'base64' ? 'base64' : 'utf8'),
);
ipcMain.handle('fs:ecrire', (_e, { chemin, contenu, encodage }) => {
  const cible = verifier(chemin);
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, contenu, encodage === 'base64' ? 'base64' : 'utf8');
});
ipcMain.handle('fs:supprimer', (_e, chemin) => {
  fs.rmSync(verifier(chemin), { force: true });
});
ipcMain.handle('fs:existe', (_e, chemin) => fs.existsSync(verifier(chemin, true)));

ipcMain.handle('dialogue:ouvrir', async (e, { extensions = [], multiple = false }) => {
  const fenetre = BrowserWindow.fromWebContents(e.sender);
  const filtres = extensions.length > 0 ? [{ name: TEXTES.fichiersAcceptes, extensions }] : [];
  const choix = await dialog.showOpenDialog(fenetre, {
    properties: multiple ? ['openFile', 'multiSelections'] : ['openFile'],
    filters: [...filtres, { name: TEXTES.tousLesFichiers, extensions: ['*'] }],
  });
  if (choix.canceled) return [];
  return choix.filePaths.map((chemin) => {
    lecturesAutorisees.add(path.resolve(chemin));
    return { chemin: posix(chemin), nom: path.basename(chemin) };
  });
});

ipcMain.handle('fichier:enregistrerSous', async (e, { source, nom, titre }) => {
  const fenetre = BrowserWindow.fromWebContents(e.sender);
  const choix = await dialog.showSaveDialog(fenetre, {
    title: titre || TEXTES.enregistrerSous,
    defaultPath: path.join(app.getPath('documents'), nom || path.basename(source)),
  });
  if (choix.canceled || !choix.filePath) return false;
  fs.copyFileSync(verifier(source, true), choix.filePath);
  shell.showItemInFolder(choix.filePath);
  return true;
});

ipcMain.handle('fichier:ouvrir', async (_e, chemin) => {
  const erreur = await shell.openPath(verifier(chemin, true));
  if (erreur) throw new Error(erreur);
});

/** Un PDF fabriqué à partir d'un HTML, par une fenêtre cachée (l'impression de l'ordinateur ne demande aucune connexion). */
// Un formulaire (une page A4 de 595 × 842 points, la taille du PDF du téléphone) est mis en page pour cette taille ; la page
// s'agrandit d'un tiers sur l'A4 de l'ordinateur (voir print.ts) et s'imprime sans marge, la taille de la page étant celle du style.
const ECHELLE_PAYSAGE = 96 / 72;
// Les marges de printToPDF se donnent en pouces (« marginType » n'existe que pour l'impression à l'écran) : toutes nulles.
const SANS_MARGES = { top: 0, bottom: 0, left: 0, right: 0 };

// Un document avec pied de page : le pied s'imprime dans la marge du bas de chaque page (il ne cache plus les dernières lignes).
const MARGES_AVEC_PIED = { top: 0.4, bottom: 0.75, left: 0.4, right: 0.4 };
const modeleDePied = ({ gauche, droite }) =>
  `<div style="width:100%;padding:0 0.4in;font-family:Arial,Helvetica,sans-serif;font-size:8px;color:#6B6F63"><div style="display:flex;justify-content:space-between;border-top:1px solid #E1DDD0;padding-top:3px"><span>${gauche}</span><span>${droite}</span></div></div>`;

ipcMain.handle('pdf:imprimer', async (_e, { html, paysage, sansMarges, pied }) => {
  fs.mkdirSync(dossierCache(), { recursive: true });
  const identifiant = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
  const page = path.join(dossierCache(), `impression-${identifiant}.html`);
  const pdf = path.join(dossierCache(), `impression-${identifiant}.pdf`);
  fs.writeFileSync(page, html, 'utf8');
  const fenetre = new BrowserWindow({ show: false, webPreferences: { sandbox: true, javascript: false } });
  try {
    await fenetre.loadFile(page);
    // Un formulaire à la taille exacte de la feuille (sansMarges) s'imprime sans marge autour de la page.
    // Un formulaire en paysage sans marge (le carnet sanitaire) est dessiné pour la page elle-même : taille du style, sans agrandissement.
    const options = paysage && sansMarges
      ? { preferCSSPageSize: true, margins: SANS_MARGES }
      : paysage
      ? { landscape: true, scale: ECHELLE_PAYSAGE, margins: SANS_MARGES }
      : sansMarges
        ? { preferCSSPageSize: true, margins: SANS_MARGES }
        : pied
          ? {
              displayHeaderFooter: true,
              headerTemplate: '<span></span>',
              footerTemplate: modeleDePied(pied),
              margins: MARGES_AVEC_PIED,
            }
          : {};
    const contenu = await fenetre.webContents.printToPDF({ printBackground: true, pageSize: 'A4', ...options });
    fs.writeFileSync(pdf, contenu);
  } finally {
    fenetre.destroy();
    fs.rmSync(page, { force: true });
  }
  return posix(pdf);
});

// ---------------------------------------------------------------------------------------------------------------------
// Google Drive : la seule chose qui demande internet.
// ---------------------------------------------------------------------------------------------------------------------
/** Les menus de la barre du haut (en haut à gauche) : ceux que l'application donne, plus l'affichage. Un choix envoie son écran à la page. */
ipcMain.handle('menu:definir', (e, { menus, affichage }) => {
  const page = e.sender;
  const aller = (route) => () => page.send('menu:aller', route);
  // L'affichage : les deux autres que celui d'en ce moment (changer recharge la fenêtre, qui reprend alors les menus qui vont avec).
  const autresAffichages = [
    ['bureau', TEXTES.versionBureau],
    ['mobile', TEXTES.versionMobile],
    ['sobre', TEXTES.versionSobre],
  ].filter(([mode]) => mode !== affichage);
  const modele = menus.map((menu) =>
    menu.items
      ? {
          label: menu.label,
          submenu: menu.items.map((item) =>
            item.separateur ? { type: 'separator' } : { label: item.label, click: aller(item.route) },
          ),
        }
      : { label: menu.label, click: aller(menu.route) },
  );
  modele.push({
    label: TEXTES.affichage,
    submenu: [
      { label: TEXTES.zoomAvant, role: 'zoomIn', accelerator: 'CommandOrControl+Plus' },
      { label: TEXTES.zoomArriere, role: 'zoomOut', accelerator: 'CommandOrControl+-' },
      { label: TEXTES.tailleNormale, role: 'resetZoom', accelerator: 'CommandOrControl+0' },
      { type: 'separator' },
      { label: TEXTES.pleinEcran, role: 'togglefullscreen', accelerator: 'F11' },
      { type: 'separator' },
      ...autresAffichages.map(([mode, label]) => ({ label, click: aller(`#affichage:${mode}`) })),
      { type: 'separator' },
      { label: TEXTES.quitter, role: 'quit', accelerator: 'CommandOrControl+Q' },
    ],
  });
  // Sans menus de l'application (l'affichage mobile), la barre de menus de la fenêtre disparaît ; ses raccourcis (zoom, plein écran) restent actifs.
  const sansMenus = menus.length === 0;
  Menu.setApplicationMenu(Menu.buildFromTemplate(sansMenus ? modele.slice(-1) : modele));
  const fenetre = BrowserWindow.fromWebContents(page);
  if (fenetre) {
    fenetre.setAutoHideMenuBar(false);
    fenetre.setMenuBarVisibility(!sansMenus);
  }
});

ipcMain.handle('google:connexion', () => connexionGoogle(dossierDonnees()));
ipcMain.handle('google:jeton', () => jetonGoogle(dossierDonnees()));
ipcMain.handle('google:email', () => emailGoogle(dossierDonnees()));
ipcMain.handle('google:deconnexion', () => deconnexionGoogle(dossierDonnees()));

// ---------------------------------------------------------------------------------------------------------------------
// La fenêtre.
// ---------------------------------------------------------------------------------------------------------------------
function servirApplication() {
  protocol.handle(SCHEMA, async (requete) => {
    const adresse = new URL(requete.url);
    if (adresse.host !== HOTE) return new Response('', { status: 404 });
    // Un fichier joint rangé dans l'ordinateur (aperçu d'une image) : seulement ceux du dossier de l'application.
    if (adresse.pathname.startsWith(PREFIXE_FICHIERS)) {
      const chemin = path.resolve(decodeURIComponent(adresse.pathname.slice(PREFIXE_FICHIERS.length)));
      if (!estAutorise(chemin, false) || !fs.existsSync(chemin)) return new Response('', { status: 404 });
      return new Response(await fs.promises.readFile(chemin), {
        headers: { 'Content-Type': TYPES[path.extname(chemin).toLowerCase()] ?? 'application/octet-stream' },
      });
    }
    const demande = path.normalize(path.join(DOSSIER_APPLICATION, decodeURIComponent(adresse.pathname)));
    if (!dansUn(DOSSIER_APPLICATION, demande)) return new Response('', { status: 403 });
    // Un écran de l'application (une adresse sans fichier) : l'application s'en charge d'elle-même, depuis sa page d'accueil.
    const fichier =
      fs.existsSync(demande) && fs.statSync(demande).isFile()
        ? demande
        : path.join(DOSSIER_APPLICATION, 'index.html');
    const contenu = await fs.promises.readFile(fichier);
    return new Response(contenu, {
      headers: { 'Content-Type': TYPES[path.extname(fichier).toLowerCase()] ?? 'application/octet-stream' },
    });
  });
}

/** La largeur de la fenêtre à l'ouverture : celle d'un grand téléphone, que l'accueil « ferme » remplit bien. */
const LARGEUR_PAR_DEFAUT = 800;

/** L'affichage sobre est un poste de comptabilité (menu à gauche, tableaux) : sa fenêtre s'ouvre large. */
const LARGEUR_SOBRE = 1280;

function creerFenetre() {
  // Haute comme l'écran (sa zone utile, sans la barre des tâches), étroite, et posée au milieu : l'accueil « ferme » est pensé en hauteur.
  const zone = screen.getPrimaryDisplay().workArea;
  const sobre = (donnees['bureau:affichage'] ?? 'sobre') === 'sobre';
  const largeur = Math.min(sobre ? LARGEUR_SOBRE : LARGEUR_PAR_DEFAUT, zone.width);
  const fenetre = new BrowserWindow({
    width: largeur,
    height: zone.height,
    x: zone.x + Math.round((zone.width - largeur) / 2),
    y: zone.y,
    // Le poste de comptabilité a besoin de place pour son menu et ses tableaux.
    minWidth: sobre ? 820 : 420,
    minHeight: 600,
    title: TEXTES.titre,
    backgroundColor: '#f4f2ec',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  // Les liens vers un site s'ouvrent dans le navigateur de l'ordinateur, jamais dans la fenêtre de l'application ; ceux vers une
  // adresse e-mail (mailto) ou un numéro (tel) dans le logiciel de courrier ou de téléphonie.
  const lienExterne = (url) => /^(https?|mailto|tel):/i.test(url);
  fenetre.webContents.setWindowOpenHandler(({ url }) => {
    if (lienExterne(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
  fenetre.webContents.on('will-navigate', (evenement, url) => {
    if (!url.startsWith(`${SCHEMA}://${HOTE}/`)) {
      evenement.preventDefault();
      if (lienExterne(url)) shell.openExternal(url);
    }
  });
  fenetre.loadURL(`${SCHEMA}://${HOTE}/`);
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  copieDuJour();
  chargerDonnees();
  servirApplication();
  // Seule la caméra (scan des boucles) est demandée par l'application.
  session.defaultSession.setPermissionRequestHandler((_contenu, permission, rappel) =>
    rappel(permission === 'media'),
  );
  creerFenetre();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) creerFenetre();
  });
});

app.on('second-instance', () => {
  const [fenetre] = BrowserWindow.getAllWindows();
  if (fenetre) {
    if (fenetre.isMinimized()) fenetre.restore();
    fenetre.focus();
  }
});

// Rien ne se perd en quittant : l'écriture en attente part avant la fermeture.
app.on('before-quit', () => {
  if (aEcrire) {
    clearTimeout(aEcrire);
    ecrireDonnees();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
