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
  /** Organisation › Listes de choix : « Assurance de » et « Catégorie de dépense » personnalisables. */
  listesChoix: {
    titre: 'Listes de choix',
    aide: 'Personnalisez les listes proposées dans les écritures : ce qu’une assurance couvre, les catégories de dépense.',
    intro: 'Masquez les choix dont vous ne vous servez pas, ajoutez les vôtres. Une écriture déjà faite garde son choix, même masqué.',
    assuranceDe: 'Assurance de',
    assuranceAide: 'Ce que couvre une facture d’assurance (bâtiments, animaux, visiteurs, véhicule…).',
    categorieDepense: 'Catégorie de dépense',
    categorieAide: 'Les catégories d’office se masquent ; une catégorie ajoutée reçoit ses écritures sur le compte du plan comptable que vous choisissez.',
    nouveauChoix: 'Nouveau choix',
    exempleAssurance: 'ex : Matériel agricole',
    nouvelleCategorie: 'Nouvelle catégorie',
    exempleCategorie: 'ex : Cotisations syndicales',
    compte: 'Compte du plan comptable',
    compteAide: 'Les écritures de cette catégorie sont comptées sur ce compte (Rentabilité, fiscalité).',
    ajouter: 'Ajouter',
    renommer: 'Renommer',
    renommerTitre: 'Nom du choix',
    retirer: 'Retirer ce choix',
    masquer: 'Masquer',
    afficher: 'Afficher de nouveau',
    masque: 'masqué',
  },
  reglages: {
    aideListesChoix: 'Ce qu’une assurance couvre, les catégories de dépense : ajoutez, masquez.',
    sectionEtablissement: 'Mon établissement',
    sectionTiers: 'Contacts',
    aideRubriqueTiers: 'Le carnet d’adresses de vos contacts, leurs catégories et ce qu’elles changent.',
    aideRubriqueFiscalite: 'Déclarations à valider, impôts, RSA, URSSAF, TVA.',
    sectionCategoriesClient: 'Catégories de contact (recettes)',
    aideCategoriesClient: 'Particulier, récolteur, organisme… et ce qu’elles changent dans les ventes.',
    sectionCategoriesTiers: 'Catégories de contact (dépenses)',
    aideCategoriesTiers: 'Contact, vétérinaire… et les dépenses que leurs factures peuvent avoir.',
    aideRubriqueEtablissement: 'Informations, statut, dossiers des contacts.',
    aideRubriqueDonnees: 'Export et PDF, sauvegarde, Google Drive.',
    aideConditionnement: 'Les emballages consommés à chaque vente d’un fromage.',
    sectionDonnees: 'Mes données',
    sectionRegles: 'Réglages',
    aideRubriqueRegles: 'Les règles que l’application applique aujourd’hui.',
    aideRegles: 'Toutes les règles que l’application applique aujourd’hui, par domaine. Les règles que l’on pourra personnaliser s’y régleront ensuite.',
    pdf: 'PDF',
    aidePdf: 'Le titre imprimé en tête, et chaque PDF par activité.',
    aucunPdf: 'Aucun PDF à part pour cet établissement : l’export de l’année les réunit.',
    titrePdf: 'Titre des PDF',
    titrePdfAide: 'Facultatif : s’imprime en haut de chaque PDF (nom commercial, mention, adresse…).',
    titrePdfExemple: 'ex : Ferme des Hauts — 12 rue du Col',
    autresPdf: 'PDF à générer',
    generationEnCours: 'Génération en cours…',
    comptesPcg: 'Comptes du plan comptable',
    aideComptesPcg: 'Les comptes et leurs libellés.',
    aideInformations: 'Nom, statut, régimes, SIRET, tarifs…',
    aideStructure: 'Les dossiers créés pour chaque nouveau contact.',
    aideExport: (annee: number) => `Un rapport de l’année ${annee}, en PDF ou en Excel.`,
    aideSauvegarde: 'Toutes les données dans un seul fichier, à garder ou à reprendre.',
    aideDrive: 'Synchroniser les données avec votre Google Drive.',
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
        ? `${r.clients + r.fournisseurs} contact(s), ${r.contenus} contenu(s) de dossier, ${r.sejours} séjour(s), ${r.trades} trade(s) et ${r.comptesPcg} compte(s) PCG importés. ${bilan}`
        : `${r.animaux} animal/animaux, ${r.clients + r.fournisseurs} contact(s) et ${r.comptesPcg} compte(s) PCG importés. ${bilan}`;
    },
    erreurDImport: 'Erreur d’import',
    export: 'Export',
    descriptionExport: (annee: number) =>
      modeEntreprise()
        ? `Génère un rapport (${contenuEntreprise('synthèse, factures, contacts, contenus des dossiers')}) pour l’année ${annee}, en PDF ou en Excel, prêt à partager ou envoyer à la comptabilité.`
        : `Génère un rapport (cheptel, ventes, factures, visites, contrôles) pour l’année ${annee}, en PDF ou en Excel, prêt à partager ou envoyer à la comptabilité.`,
    exporter: 'Exporter',
    sauvegardeLocale: 'Sauvegarde locale',
    get exporteToutesLesDonneesDe() {
      const contenu = modeEntreprise()
        ? contenuEntreprise('factures, contacts, dossiers et contenus')
        : 'cheptel, ventes, factures, visites, contrôles, contacts';
      return `Exporte toutes les données de l’appli (toutes années, ${contenu}) dans un seul fichier à conserver ailleurs (mail, stockage…) — permet de tout récupérer après une réinstallation, sans passer par Google Drive.`;
    },
    importer: 'Importer',
    restaurerUneSauvegardeQuestion: 'Restaurer une sauvegarde ?',
    get toutesLesDonneesActuellementEnregistrees() {
      const contenu = modeEntreprise()
        ? contenuEntreprise('factures, contacts, dossiers et contenus')
        : 'cheptel, ventes, factures, visites, contrôles, contacts';
      return `Toutes les données actuellement enregistrées sur cet appareil (${contenu}) seront remplacées par celles du fichier choisi. Cette action est irréversible.`;
    },
    choisirLeFichier: 'Choisir le fichier',
    googleDrive: 'Google Drive',
    get synchroniseLesFichiersTexteCheptel() {
      const contenu = modeEntreprise()
        ? contenuEntreprise('factures, contacts, dossiers et contenus')
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
    fusionDemandeTitre: 'Fusionner les données ?',
    fusionOui: 'Oui',
    fusionDemande:
      'Des données enregistrées sur Drive sont manquantes dans votre sauvegarde en cours. Voulez-vous fusionner les données ? Tout ce que chacun a saisi est gardé ; sur une valeur différente des deux côtés, celle de cet appareil reste.',
    fusionTerminee: (ajoutes: number, conflits: number) =>
      `Fusion terminée : ${ajoutes} élément${ajoutes > 1 ? 's' : ''} de l’autre appareil ajouté${ajoutes > 1 ? 's' : ''}${
        conflits > 0 ? `, ${conflits} valeur${conflits > 1 ? 's' : ''} différente${conflits > 1 ? 's' : ''} (celle de cet appareil gardée)` : ''
      }. Les données fusionnées sont sur Drive.`,
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
