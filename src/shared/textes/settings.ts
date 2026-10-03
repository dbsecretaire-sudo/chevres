import { vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;

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
    animauxAnimalAnimauxFournisseursFournisseur: (
      animaux: number,
      fournisseurs: number,
      clients: number,
      comptesPcg: number,
    ) =>
      `${animaux} animal/animaux, ${fournisseurs} fournisseur(s), ${clients} client(s) et ${comptesPcg} compte(s) PCG importés.`,
    erreurDImport: 'Erreur d’import',
    etablissement: 'Établissement',
    actuelDeuxPoints: 'Actuel : ',
    changerCreerUnEtablissement: 'Changer / créer un établissement',
    export: 'Export',
    genereUnRapportCheptelVentes:
      'Génère un rapport (cheptel, ventes, factures, visites, contrôles) pour l’année',
    enPdfOuEnExcel: ', en PDF ou en Excel, prêt à partager ou envoyer à la comptabilité.',
    exporter: 'Exporter',
    sauvegardeLocale: 'Sauvegarde locale',
    exporteToutesLesDonneesDe:
      'Exporte toutes les données de l’appli (toutes années, cheptel, ventes, factures, visites, contrôles, fournisseurs) dans un seul fichier à conserver ailleurs (mail, stockage…) — permet de tout récupérer après une réinstallation, sans passer par Google Drive.',
    importer: 'Importer',
    restaurerUneSauvegardeQuestion: 'Restaurer une sauvegarde ?',
    toutesLesDonneesActuellementEnregistrees:
      'Toutes les données actuellement enregistrées sur cet appareil (cheptel, ventes, factures, visites, contrôles, fournisseurs) seront remplacées par celles du fichier choisi. Cette action est irréversible.',
    choisirLeFichier: 'Choisir le fichier',
    googleDrive: 'Google Drive',
    synchroniseLesFichiersTexteCheptel:
      'Synchronise les fichiers texte (cheptel, ventes, factures, visites vétérinaire, contrôles) dans un dossier « Troupeau Chèvres » sur Google Drive, pour partager les données entre plusieurs appareils.',
    laSynchronisationGoogleDriveN:
      'La synchronisation Google Drive n’est pas disponible sur le web — utilisez l’application mobile.',
    seConnecterAGoogleDrive: 'Se connecter à Google Drive',
    compteDeuxPoints: 'Compte : ',
    dossierDeuxPoints: 'Dossier : ',
    enCoursPoints: 'En cours… ',
    envoyerVersDrive: 'Envoyer vers Drive',
    recupererDepuisDrive: 'Récupérer depuis Drive',
    seDeconnecter: 'Se déconnecter',
    get troupeauChevresToutesLesDonnees() {
      return `${V().troupeau} — toutes les données restent d’abord enregistrées sur cet appareil.`;
    },
    donneesEnvoyeesVersGoogleDrive: 'Données envoyées vers Google Drive.',
    donneesRecupereesDepuisGoogleDrive: 'Données récupérées depuis Google Drive.',
    lengthEtablissementsChacunASes: (length: number) =>
      `${length} établissements. Chacun a ses propres données et son propre dossier Google Drive.`,
    creezUnAutreEtablissementPour:
      'Créez un autre établissement pour gérer un second élevage avec des données séparées.',
    exportAnneeactive: (anneeActive: number) => `Export ${anneeActive}`,
    get troupeauChevres() {
      return V().troupeau;
    },
    derniereSynchronisationValeur: (valeur: string) => `Dernière synchronisation : ${valeur}`,
    jamaisSynchronise: 'Jamais synchronisé',
  },
} as const;
