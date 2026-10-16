import { agePetitMax } from '@/shared/constants/cheptel';
import { libelleDuree } from '@/shared/utils/age';
import { capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

/** Textes de l'interface — « commun ». À modifier ici uniquement. */
export const TEXTES_COMMUN = {
  /** Le filtre d'une colonne de tableau, comme dans Excel : tri, recherche et cases à cocher. */
  filtreColonne: {
    titre: (colonne: string) => `Filtrer : ${colonne.replace(/\n/g, ' ')}`,
    triCroissant: 'Tri croissant',
    triDecroissant: 'Tri décroissant',
    rechercher: 'Rechercher…',
    tout: 'Tout',
    vide: '(vides)',
    aucun: 'Aucune valeur',
    ok: 'OK',
    annuler: 'Annuler',
    effacer: 'Effacer le filtre',
    filtrer: (colonne: string) => `Filtrer la colonne ${colonne.replace(/\n/g, ' ')}`,
  },
  general: {
    separateurListe: ', ',
    informationsDeLExploitation: 'Informations de l’exploitation',
    informationsDeLEntreprise: 'Informations de l’entreprise',
    nonRenseigne: 'Non renseigné',
    cheptel: 'Cheptel',
    comptabilite: 'Comptabilité',
    exploitation: 'Exploitation',
    bilanAnnuel: 'Bilan annuel',
    vente: 'Vente',
    detail: 'Détail par catégorie',
    impotsMicroBa: 'Impôts (micro-BA)',
    declarationRsa: 'Déclaration RSA',
    fournisseurs: 'Contacts',
    nouveauFournisseur: 'Nouveau contact',
    fournisseur: 'Contact',
    comptesPcg: 'Comptes PCG',
    nouveauCompte: 'Nouveau compte',
    comptePcg: 'Compte PCG',
    clients: 'Contacts',
    nouveauClient: 'Nouveau contact',
    client: 'Contact',
    visitesVeterinaire: 'Visites vétérinaire',
    controles: 'Contrôles',
    alimentation: 'Alimentation',
    get cabrisNesEnEspace() {
      return `${Cap(V().petit.pluriel)} nés en `;
    },
    erreurExport: 'Erreur export',
    fermer: 'Fermer',
    agrandirLImage: 'Agrandir l’image',
    annuler: 'Annuler',
    retour: 'Retour',
    abattoir: 'Abattoir',
    get chevres() {
      return Cap(V().femelle.pluriel);
    },
    mortes: 'Mortes',
    vendues: 'Vendues',
    get boucs() {
      return Cap(V().male.pluriel);
    },
    supprimerDefinitivement: 'Supprimer définitivement',
    designeEPourLeRenouvellement: 'Désigné(e) pour le renouvellement',
    anneeDeDesignation: 'Année de désignation',
    nDeBoucle: 'N° de boucle',
    get facultatifAvantAgeMax() {
      return `Facultatif avant ${libelleDuree(agePetitMax())}`;
    },
    dateDeBouclage: 'Date de bouclage',
    nom: 'Nom',
    sexe: 'Sexe',
    femelle: 'Femelle',
    male: 'Mâle',
    dateDeNaissance: 'Date de naissance',
    effacer: 'Effacer',
    nDeBoucleDeLa: 'N° de boucle de la mère',
    notes: 'Notes',
    enregistrer: 'Enregistrer',
    nomDeuxPoints: 'Nom : ',
    modifierLaFiche: 'Modifier la fiche',
    date: 'Date',
    statut: 'Statut',
    accordNeLeDate: (accordNe: string, date: string) => `${accordNe} le ${date}`,
    supprimerDefinitivementQuestion: 'Supprimer définitivement ?',
    nDeBoucleDejaUtilise: 'N° de boucle déjà utilisé',
    get cabris() {
      return Cap(V().petit.pluriel);
    },
    rechercher: 'Rechercher',
    nDeBoucleEnDouble: 'N° de boucle en double',
    leNBoucleEstDeja: (boucle: string) => `Le n° ${boucle} est déjà attribué à un autre animal.`,
    facultatif: 'Facultatif',
    dateDeLaMiseBas: 'Date de la mise bas',
    get cabriEspace() {
      return `${Cap(V().petit.singulier)} `;
    },
    retirer: 'Retirer',
    mortNe: 'Mort-né',
    get ajouterUnCabri() {
      return `+ Ajouter un ${V().petit.singulier}`;
    },
    adresseDeuxPoints: 'Adresse : ',
    prenom: 'Prénom',
    telephone: 'Téléphone',
    email: 'Email',
    adressePostale: 'Adresse postale',
    autre: 'Autre',
    ecrituresLiees: 'Écritures liées',
    dateDeuxPoints: 'Date : ',
    montantDeuxPoints: 'Montant : ',
    comptePcgDeuxPoints: 'Compte PCG : ',
    modifierLaFacture: 'Modifier la facture',
    montantTtc: 'Montant TTC',
    unite: 'Unité',
    kg: 'kg',
    depenses: 'Dépenses',
    total: 'Total',
    montantInvalide: 'Montant invalide',
    ajoutezAuMoinsUnMontant: 'Ajoutez au moins un montant pour un aliment.',
    ajoutezAuMoinsUnMontantPour: 'Ajoutez au moins un montant pour un carburant.',
    erreur: 'Erreur',
    impossibleDEnregistrerLesModifications: "Impossible d'enregistrer les modifications.",
    tauxDeTva: 'Taux de TVA',
    type: 'Type',
    choixDuFournisseur: 'Choix du contact',
    choixDuClient: 'Choix du contact',
    totalFactureTtcDeuxPoints: 'Total facture TTC : ',
    quantiteInvalide: 'Quantité invalide',
    prixInvalide: 'Prix invalide',
    quantite: 'Quantité',
    poidsKg: 'Poids (kg)',
    noticeExplicativeAVerifierAvant: 'Notice explicative — à vérifier avant usage officiel',
    debit: 'Débit',
    credit: 'Crédit',
    description: 'Description',
    supprimer: 'Supprimer',
    modifier: 'Modifier',
    nDeBoucleConcerne: 'N° de boucle concerné',
    animauxSelectionnes: (n: number) => `${n} animal${n > 1 ? 'ux' : ''} sélectionné${n > 1 ? 's' : ''}`,
    videTroupeauEntier: 'Vide = troupeau entier',
    /** Le choix des boucles dans la liste des animaux vivants du cheptel (contrôles, visites vétérinaires). */
    choisirBoucles: 'Choisir dans le cheptel',
    titreBoucles: 'Boucles du cheptel',
    ajouterLesBoucles: (nombre: number) => `Ajouter ${nombre} boucle${nombre > 1 ? 's' : ''}`,
    nomDEntreprise: 'Nom d’entreprise',
    siret: 'SIRET',
    tvaIntracommunautaire: 'TVA intracommunautaire',
    rib: 'RIB',
    voirMoins: 'Voir moins',
    voirPlus: 'Voir plus',
    renouvellement: 'Renouvellement',
    facture: 'Facture',
    nomRequis: 'Nom requis',
    planComptable: 'Plan comptable',
    factureEmise: 'Facture émise',
    factureRecue: 'Facture reçue',
    fournisseurRequis: 'Contact requis',
    clientRequis: 'Contact requis',
    filtrer: 'Filtrer',
    nRequis: 'N° requis',
    descriptionRequise: 'Description requise',
    nCheptel: 'N° cheptel',
    indicatifDeMarquage: 'Indicatif de marquage',
    exportAnneeTroupeauChevres: (annee: number) => `Export ${annee} — ${V().troupeau}`,
    totalHorsAutre: 'Total (hors Autre)',
    exploitationAnneeTroupeauChevres: (annee: number) => `Exploitation ${annee} — ${V().troupeau}`,
    planComptableAnneeTroupeauChevres: (annee: number) => `Plan comptable ${annee} — ${V().troupeau}`,
    get cheptelTroupeauChevres() {
      return `Cheptel — ${V().troupeau}`;
    },
    get registreCompletTroupeauChevres() {
      return `Registre complet du cheptel — ${V().troupeau}`;
    },
    nomDEntrepriseRequis: 'Nom d’entreprise requis',
    confirmer: 'Confirmer',
    troupeauEntier: 'Troupeau entier',
    aucuneFacturePourCetteAnnee: 'Aucune facture pour cette année',
    aucuneVisitePourCetteAnnee: 'Aucune visite pour cette année',
    aucunControlePourCetteAnnee: 'Aucun contrôle pour cette année',
    aucuneFactureCategoriseePourCette: 'Aucune facture catégorisée pour cette année',
    aucunAnimalEnregistre: 'Aucun animal enregistré',
    aucunAnimalPourCetteAnnee: 'Aucun animal pour cette année',
  },
  /** Le calendrier mensuel (accueil d'une entreprise, gîte). */
  /** Les titres des listes de choix du haut des écrans (l'année, l'animal). */
  /** Les titres des sections des formulaires. */
  formulaire: {
    identite: 'Identité',
    filiation: 'Filiation',
    suivi: 'Suivi',
    naissance: 'Naissance',
    ecriture: 'Écriture',
    reservation: 'Réservation',
    voyageursEtRepas: 'Client et repas',
    cabris: 'Petits',
  },
  choix: {
    annee: 'Année',
    toutesAnnees: 'Tout',
    animal: 'Animal',
    rubrique: 'Rubrique',
    activite: 'Activité',
  },
  calendrier: {
    jours: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    moisPrecedent: 'Mois précédent',
    moisSuivant: 'Mois suivant',
  },
  dateField: {
    aaaaMmJj: 'AAAA-MM-JJ',
    /** Sous le champ d'une date dont l'année est imposée (le filtre d'une période). */
    format: 'format : AAAA-MM-JJ',
    /** Sous le champ d'une date écrite jour d'abord (les filtres). */
    formatJourMoisAnnee: 'format : JJ-MM-AAAA',
    /** Quand l'année est imposée (une année active choisie) : seuls le jour et le mois s'écrivent. */
    formatJourMois: 'format : JJ-MM',
    jourMois: 'JJ-MM',
    jourMoisAnnee: 'JJ-MM-AAAA',
    anneeImposee: 'Pour une autre année, changer l’année active',
    /** Une seule note sous une date dont l'année est imposée : le format et l'année. */
    formatAvecAnnee: (format: string, annee: number) => `${format} · année ${annee}`,
    invalide: 'Date invalide : écrivez-la sous la forme AAAA-MM-JJ (ex : 2026-10-04).',
  },
  infoModal: {
    ok: 'OK',
  },
  /** La fenêtre qui modifie une liste de valeurs (le crayon d'une liste déroulante). */
  listeModifiable: {
    valeur: 'Valeur',
    ajouter: 'Ajouter une valeur',
    retirer: 'Retirer la valeur',
    retablir: 'Rétablir la liste d’origine',
  },
  selectField: {
    rechercherParNOuLibellePoints: 'Rechercher par n° ou libellé…',
    aucunResultat: 'Aucun résultat.',
    selectionnerPoints: 'Sélectionner…',
    /** La liste où l'on coche plusieurs lignes : la recherche, une plage de numéros, tout cocher. */
    rechercherOuPlage: 'Rechercher, ou une plage de n° (ex : 12-30)',
    cocherLaPlage: (debut: string, fin: string, nombre: number) =>
      `Cocher du n° ${debut} au n° ${fin} (${nombre})`,
    toutCocher: (nombre: number) => `Tout cocher (${nombre})`,
    toutDecocher: 'Tout décocher',
  },
} as const;
