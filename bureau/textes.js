// Les textes de la version Windows (fenêtre, sélecteurs, Google) : à modifier ici uniquement.
const TEXTES = {
  titre: 'Troupeau Chèvres',
  fichiersAcceptes: 'Fichiers acceptés',
  tousLesFichiers: 'Tous les fichiers',
  enregistrerSous: 'Enregistrer sous',
  affichage: 'Affichage',
  zoomAvant: 'Zoom avant',
  zoomArriere: 'Zoom arrière',
  tailleNormale: 'Taille normale',
  pleinEcran: 'Plein écran',
  quitter: 'Quitter',
  versionBureau: 'Version bureau (menus de la fenêtre)',
  versionMobile: 'Version mobile pour PC',
  versionSobre: 'Version sobre (sans couleur ni dessin)',
  cheminRefuse: 'Accès à ce fichier refusé :',
  google: {
    sansConfiguration:
      'La connexion à Google Drive n’est pas encore réglée sur cet ordinateur : il manque le fichier google.json (voir bureau/LISEZMOI.md).',
    jsonInvalide: 'le fichier n’est pas un JSON valide',
    sansIdentifiant: 'le fichier ne contient pas d’identifiant client (clientId)',
    delaiDepasse: 'La connexion à Google a pris trop de temps : recommencez.',
    refusee: 'Google a refusé la connexion.',
    echangeImpossible: 'Google n’a pas donné l’accès demandé.',
    pageReussite:
      '<html><head><meta charset="utf-8"><title>Troupeau Chèvres</title></head><body style="font-family:sans-serif;text-align:center;margin-top:20vh"><h2>Connexion réussie</h2><p>Vous pouvez fermer cette page et revenir à Troupeau Chèvres.</p></body></html>',
    pageEchec:
      '<html><head><meta charset="utf-8"><title>Troupeau Chèvres</title></head><body style="font-family:sans-serif;text-align:center;margin-top:20vh"><h2>Connexion refusée</h2><p>Revenez à Troupeau Chèvres et recommencez.</p></body></html>',
  },
};

module.exports = { TEXTES };
