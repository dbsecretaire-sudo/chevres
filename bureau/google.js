// La connexion à Google Drive pour Windows : une connexion dans le navigateur de l'ordinateur (OAuth avec PKCE, retour sur une adresse
// locale), puis un jeton de renouvellement gardé chiffré dans le dossier de l'application. Aucun mot de passe ne passe par l'application.
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { safeStorage, shell } = require('electron');
const { TEXTES } = require('./textes');

const ADRESSE_AUTORISATION = 'https://accounts.google.com/o/oauth2/v2/auth';
const ADRESSE_JETON = 'https://oauth2.googleapis.com/token';
const ADRESSE_REVOCATION = 'https://oauth2.googleapis.com/revoke';
/** Le même accès complet à Drive que sur le téléphone, plus l'adresse du compte. */
const PORTEE = ['openid', 'email', 'https://www.googleapis.com/auth/drive'].join(' ');
const DELAI_CONNEXION = 3 * 60 * 1000;
/** Une marge avant l'expiration d'un jeton : on le renouvelle un peu avant. */
const MARGE = 60 * 1000;

let jetonCourant = null;

const fichierSession = (dossier) => path.join(dossier, 'google-session.bin');

/**
 * Les identifiants du client « Application de bureau » de Google Cloud : à côté des données, sinon dans le dossier bureau. Les deux
 * formes se lisent : { clientId, clientSecret } ou le fichier tel que Google le télécharge ({ installed: { client_id, client_secret } }).
 */
function lireConfiguration(dossier) {
  // « google.json.txt » aussi : le Bloc-notes ajoute parfois « .txt » au nom quand les extensions sont masquées.
  const noms = ['google.json', 'google.json.txt'];
  let illisible = null;
  for (const chemin of [...noms.map((n) => path.join(dossier, n)), path.join(__dirname, 'google.json')]) {
    let texte;
    try {
      texte = fs.readFileSync(chemin, 'utf8');
    } catch {
      continue; // pas de fichier à cet endroit
    }
    try {
      // Le Bloc-notes ajoute parfois une marque invisible (BOM) en tête de fichier : on l'ignore.
      const brut = JSON.parse(texte.replace(/^﻿/, ''));
      const google = brut.installed ?? brut.web;
      const config = google
        ? { clientId: google.client_id, clientSecret: google.client_secret }
        : { clientId: brut.clientId, clientSecret: brut.clientSecret };
      if (config.clientId) return config;
      illisible = illisible ?? `${chemin} : ${TEXTES.google.sansIdentifiant}`;
    } catch (erreur) {
      illisible = illisible ?? `${chemin} : ${TEXTES.google.jsonInvalide} (${erreur.message})`;
    }
  }
  throw new Error(illisible ?? TEXTES.google.sansConfiguration);
}

function lireSession(dossier) {
  try {
    const brut = fs.readFileSync(fichierSession(dossier));
    const texte = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(brut)
      : brut.toString('utf8');
    return JSON.parse(texte);
  } catch {
    return null;
  }
}

function ecrireSession(dossier, session) {
  const texte = JSON.stringify(session);
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(
    fichierSession(dossier),
    safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(texte) : Buffer.from(texte, 'utf8'),
  );
}

const base64Url = (octets) =>
  octets.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** L'adresse du compte, lue dans le jeton d'identité que Google renvoie. */
function emailDuJeton(idToken) {
  try {
    const charge = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'));
    return charge.email ?? null;
  } catch {
    return null;
  }
}

async function demanderJeton(config, parametres) {
  const corps = new URLSearchParams({ client_id: config.clientId, ...parametres });
  if (config.clientSecret) corps.set('client_secret', config.clientSecret);
  const reponse = await fetch(ADRESSE_JETON, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: corps,
  });
  const donnees = await reponse.json();
  if (!reponse.ok || !donnees.access_token) {
    throw new Error(`${TEXTES.google.echangeImpossible} (${donnees.error ?? reponse.status})`);
  }
  return donnees;
}

/** Ouvre la connexion Google dans le navigateur ; rend l'adresse du compte et un jeton d'accès. */
async function connexionGoogle(dossier) {
  const config = lireConfiguration(dossier);
  const verificateur = base64Url(crypto.randomBytes(48));
  const defi = base64Url(crypto.createHash('sha256').update(verificateur).digest());
  const etat = base64Url(crypto.randomBytes(16));

  // Le serveur local démarre d'abord : son port fait l'adresse de retour, où Google renvoie le code de connexion.
  let port = 0;
  const code = await new Promise((resolve, reject) => {
    const serveur = http.createServer((requete, reponse) => {
      const adresse = new URL(requete.url, 'http://127.0.0.1');
      const recu = adresse.searchParams.get('code');
      const valide = !!recu && adresse.searchParams.get('state') === etat;
      reponse.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      reponse.end(valide ? TEXTES.google.pageReussite : TEXTES.google.pageEchec);
      clearTimeout(delai);
      serveur.close();
      if (valide) resolve(recu);
      else reject(new Error(TEXTES.google.refusee));
    });
    const delai = setTimeout(() => {
      serveur.close();
      reject(new Error(TEXTES.google.delaiDepasse));
    }, DELAI_CONNEXION);
    serveur.on('error', (erreur) => {
      clearTimeout(delai);
      reject(erreur);
    });
    serveur.listen(0, '127.0.0.1', () => {
      port = serveur.address().port;
      const adresse = new URL(ADRESSE_AUTORISATION);
      adresse.search = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: `http://127.0.0.1:${port}`,
        response_type: 'code',
        scope: PORTEE,
        state: etat,
        code_challenge: defi,
        code_challenge_method: 'S256',
        access_type: 'offline',
        prompt: 'consent select_account',
      }).toString();
      shell.openExternal(adresse.toString());
    });
  });

  const donnees = await demanderJeton(config, {
    code,
    code_verifier: verificateur,
    grant_type: 'authorization_code',
    redirect_uri: `http://127.0.0.1:${port}`,
  });
  const email = emailDuJeton(donnees.id_token ?? '') ?? '';
  if (donnees.refresh_token) ecrireSession(dossier, { email, refreshToken: donnees.refresh_token });
  jetonCourant = {
    accessToken: donnees.access_token,
    expire: Date.now() + donnees.expires_in * 1000 - MARGE,
  };
  return { email, accessToken: donnees.access_token };
}

/** Un jeton d'accès valable (renouvelé par le jeton de renouvellement quand il a expiré) ; null si on n'est pas connecté. */
async function jetonGoogle(dossier) {
  if (jetonCourant && jetonCourant.expire > Date.now()) return jetonCourant.accessToken;
  const session = lireSession(dossier);
  if (!session?.refreshToken) return null;
  try {
    const donnees = await demanderJeton(lireConfiguration(dossier), {
      refresh_token: session.refreshToken,
      grant_type: 'refresh_token',
    });
    jetonCourant = {
      accessToken: donnees.access_token,
      expire: Date.now() + donnees.expires_in * 1000 - MARGE,
    };
    return jetonCourant.accessToken;
  } catch {
    return null;
  }
}

/** L'adresse du compte connecté (null s'il n'y en a pas ou si la connexion a expiré). */
async function emailGoogle(dossier) {
  const session = lireSession(dossier);
  if (!session?.refreshToken) return null;
  return (await jetonGoogle(dossier)) ? session.email : null;
}

async function deconnexionGoogle(dossier) {
  const session = lireSession(dossier);
  jetonCourant = null;
  fs.rmSync(fichierSession(dossier), { force: true });
  if (session?.refreshToken) {
    // Le consentement est retiré chez Google ; sans internet, la session locale est quand même effacée.
    try {
      await fetch(`${ADRESSE_REVOCATION}?token=${encodeURIComponent(session.refreshToken)}`, {
        method: 'POST',
      });
    } catch {
      // hors connexion : rien de plus à faire
    }
  }
}

module.exports = { connexionGoogle, deconnexionGoogle, emailGoogle, jetonGoogle };
