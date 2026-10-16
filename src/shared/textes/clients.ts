import { capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

/** Textes de l'interface — « clients ». À modifier ici uniquement. */
export const TEXTES_CLIENTS = {
  contact: { appeler: 'Appeler le client', ecrire: 'Écrire un e-mail au client' },
  ficheClient: {
    clientIntrouvable: 'Client introuvable.',
    categorieDeuxPoints: 'Catégorie : ',
    telephoneDeuxPoints: 'Téléphone : ',
    emailDeuxPoints: 'Email : ',
    resume: 'Résumé',
    laitVendu: 'Lait vendu',
    fromageVendu: 'Fromage vendu',
    get cabrisVendus() {
      return `${Cap(V().petit.pluriel)} vendus`;
    },
    autresVentes: 'Autres ventes (animaux, viande, charcuterie)',
    aidesSubventions: 'Aides / subventions',
    totalPayeParCeClient: 'Total payé par ce client',
    aucuneEcritureLieeACe: 'Aucune écriture liée à ce client pour l’instant.',
    cetteActionSupprimeraDefinitivementLa: (nom: string, valeur: string) =>
      `Cette action supprimera définitivement la fiche de ${nom}${valeur}. Les ventes déjà enregistrées ne sont pas modifiées.`,
    masquerLesDetails: 'Masquer les détails',
    voirLesDetails: 'Voir les détails',
    kgcabrisKg: (kgCabris: number) => ` (${kgCabris} kg)`,
  },
  listeClients: {
    nomTelephoneEmailPoints: 'Nom, téléphone, email…',
    aucunClient: 'Aucun client',
    ajoutezVosClientsPourLes: 'Ajoutez vos clients pour les retrouver rapidement dans une nouvelle vente.',
  },
  nouveauClient: {
    nomDuClient: 'Nom du client',
    categorieDuClient: 'Catégorie de client',
    aideCategorie: 'Elle règle le prix, le n° de facture et la déclaration des ventes de ce client.',
  },
  /** Organisation › Clients et fournisseurs › Catégories de client. */
  categories: {
    aide: 'Renommez, ajoutez ou retirez des catégories, et réglez ce qu’elles changent dans les ventes.',
    parCategorie: 'Par catégorie',
    parOption: 'Par option',
    aideParOption: 'Ouvrez une option et cochez les catégories qui l’appliquent.',
    dansLesVentes: 'Dans les ventes',
    renommer: 'Modifier le nom de la catégorie',
    nomCategorie: 'Nom de la catégorie',
    affichage: 'Afficher dans les factures de ses clients',
    aideAffichage: 'Décochée, la case n’apparaît plus dans la facture d’un client de cette catégorie.',
    exempleNom: 'ex : Coopérative',
    ajouter: '+ Ajouter une catégorie',
    recettes: 'Recettes proposées',
    aideRecettes:
      'Seul un organisme a l’aide / subvention d’office (ou une facture de prestations) ; les autres catégories ne la proposent pas tant que vous ne la cochez pas.',
    declaree: 'Vente déclarée d’office (avec facture)',
    prixLibre: 'Prix libre, n° de facture avec lettres, réajustement',
    parDefaut: 'Catégorie d’office des clients : elle ne se retire pas.',
    protegee:
      'Les groupements (Production) se choisissent parmi les clients de cette catégorie : elle ne se retire pas.',
    supprimer: 'Retirer cette catégorie',
    supprimerQuestion: 'Retirer cette catégorie ?',
    supprimerMessage: 'Les clients qui l’avaient passent en « Particulier » dans leur fiche.',
  },
  importClient: {
    importerDepuisUnAutreEtablissement: 'Importer un client depuis un autre établissement',
    saisirUnNouveauClient: 'Saisir un nouveau client',
    choisissezUnEtablissement: 'Choisissez un établissement, puis le client à importer.',
    aucunClientDansCetEtablissement: 'Aucun client dans cet établissement.',
    dejaPresent: (nom: string) =>
      `« ${nom} » existe déjà dans cet établissement (même nom et même téléphone) : rien n’a été importé.`,
  },
} as const;
