import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { vocabulaire } from '@/shared/dictionnaire/animaux';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';

const V = vocabulaire;

/** Ce que contient une entreprise, pour décrire ses exports et sauvegardes (le gîte seulement pour une association). */
const contenuEntreprise = (base: string): string => {
  const activites = activitesEtablissement();
  return [
    base,
    ...(activites.includes(ACTIVITE_SOCIETE.ASSOCIATION) ? ['séjours du gîte', 'boissons du bar'] : []),
    ...(activites.includes(ACTIVITE_SOCIETE.LIBERAL) ? ['trades'] : []),
    'fichiers joints',
  ].join(', ');
};

/** Textes de l'interface — « settings ». À modifier ici uniquement. */
export const TEXTES_SETTINGS = {
  appSettingsContext: {
    useappsettingsDoitEtreUtiliseDans: 'useAppSettings doit être utilisé dans AppSettingsProvider',
  },
  reglages: {
    connecte: 'Connecté',
    connecteAGoogleDriveEmail: (email: string) => `Connecté à Google Drive (${email}).`,
    erreurDeConnexion: 'Erreur de connexion',
    sessionExpiree: 'Session expirée',
    merciDeVousReconnecterA: 'Merci de vous reconnecter à Google Drive.',
    termine: 'Terminé',
    erreurDeSynchronisation: 'Erreur de synchronisation',
    erreurDeSauvegarde: 'Erreur de sauvegarde',
    sauvegardeRestauree: 'Sauvegarde restaurée',
    messageImport: (r: {
      animaux: number;
      fournisseurs: number;
      clients: number;
      comptesPcg: number;
      contenus: number;
      sejours: number;
      trades: number;
      misAJour: number;
      inchanges: number;
    }) => {
      const bilan = `${r.misAJour} jeu(x) de données mis à jour, ${r.inchanges} déjà à jour (laissé(s) tel(s) quel(s)).`;
      return modeEntreprise()
        ? `${r.clients} client(s), ${r.fournisseurs} fournisseur(s), ${r.contenus} contenu(s) de dossier, ${r.sejours} séjour(s), ${r.trades} trade(s) et ${r.comptesPcg} compte(s) PCG importés. ${bilan}`
        : `${r.animaux} animal/animaux, ${r.fournisseurs} fournisseur(s), ${r.clients} client(s) et ${r.comptesPcg} compte(s) PCG importés. ${bilan}`;
    },
    erreurDImport: 'Erreur d’import',
    export: 'Export',
    descriptionExport: (annee: number) =>
      modeEntreprise()
        ? `Génère un rapport (${contenuEntreprise('synthèse, factures, clients, contenus des dossiers')}) pour l’année ${annee}, en PDF ou en Excel, prêt à partager ou envoyer à la comptabilité.`
        : `Génère un rapport (cheptel, ventes, factures, visites, contrôles) pour l’année ${annee}, en PDF ou en Excel, prêt à partager ou envoyer à la comptabilité.`,
    exporter: 'Exporter',
    sauvegardeLocale: 'Sauvegarde locale',
    get exporteToutesLesDonneesDe() {
      const contenu = modeEntreprise()
        ? contenuEntreprise('factures, clients, dossiers et contenus, fournisseurs')
        : 'cheptel, ventes, factures, visites, contrôles, fournisseurs';
      return `Exporte toutes les données de l’appli (toutes années, ${contenu}) dans un seul fichier à conserver ailleurs (mail, stockage…) — permet de tout récupérer après une réinstallation, sans passer par Google Drive.`;
    },
    importer: 'Importer',
    restaurerUneSauvegardeQuestion: 'Restaurer une sauvegarde ?',
    get toutesLesDonneesActuellementEnregistrees() {
      const contenu = modeEntreprise()
        ? contenuEntreprise('factures, clients, dossiers et contenus, fournisseurs')
        : 'cheptel, ventes, factures, visites, contrôles, fournisseurs';
      return `Toutes les données actuellement enregistrées sur cet appareil (${contenu}) seront remplacées par celles du fichier choisi. Cette action est irréversible.`;
    },
    choisirLeFichier: 'Choisir le fichier',
    googleDrive: 'Google Drive',
    get synchroniseLesFichiersTexteCheptel() {
      const contenu = modeEntreprise()
        ? contenuEntreprise('factures, clients, dossiers et contenus')
        : 'cheptel, ventes, factures, visites vétérinaire, contrôles';
      return `Synchronise les fichiers texte (${contenu}) dans un dossier « Troupeau Chèvres » sur Google Drive, pour partager les données entre plusieurs appareils.`;
    },
    laSynchronisationGoogleDriveN:
      'La synchronisation Google Drive n’est pas disponible sur le web — utilisez l’application mobile.',
    seConnecterAGoogleDrive: 'Se connecter à Google Drive',
    pasEncoreLie:
      'Google est connecté sur cet appareil, mais cet établissement n’est pas encore lié à Google Drive : un dossier à son nom sera créé dans votre compte.',
    lierAuCompteGoogle: 'Lier cet établissement à mon compte Google',
    compteDeuxPoints: 'Compte : ',
    dossierDeuxPoints: 'Dossier : ',
    enCoursPoints: 'En cours… ',
    envoyerVersDrive: 'Envoyer vers Drive',
    recupererDepuisDrive: 'Récupérer depuis Drive',
    seDeconnecter: 'Se déconnecter',
    get troupeauChevresToutesLesDonnees() {
      return modeEntreprise()
        ? 'Toutes les données restent d’abord enregistrées sur cet appareil.'
        : `${V().troupeau} — toutes les données restent d’abord enregistrées sur cet appareil.`;
    },
    donneesEnvoyeesVersGoogleDrive: 'Données envoyées vers Google Drive.',
    donneesRecupereesDepuisGoogleDrive: 'Données récupérées depuis Google Drive.',
    bilanSynchro: (misAJour: number, inchanges: number) =>
      `${misAJour} fichier${misAJour > 1 ? 's' : ''} mis à jour, ${inchanges} déjà à jour (laissé${inchanges > 1 ? 's' : ''} tel${inchanges > 1 ? 's' : ''} quel${inchanges > 1 ? 's' : ''}).`,
    exportAnneeactive: (anneeActive: number) => `Export ${anneeActive}`,
    get troupeauChevres() {
      return V().troupeau;
    },
    derniereSynchronisationValeur: (valeur: string) => `Dernière synchronisation : ${valeur}`,
    jamaisSynchronise: 'Jamais synchronisé',
  },
} as const;
