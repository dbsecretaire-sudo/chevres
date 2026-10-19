import { capitaliser, vocabulaire } from '@/shared/dictionnaire/animaux';

const V = vocabulaire;
const Cap = capitaliser;

/** Textes de l'interface — « clients ». À modifier ici uniquement. */
export const TEXTES_CLIENTS = {
  contact: { appeler: 'Appeler le contact', ecrire: 'Écrire un e-mail au contact' },
  ficheClient: {
    clientIntrouvable: 'Contact introuvable.',
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
    totalPayeParCeClient: 'Total payé par ce contact',
    aucuneEcritureLieeACe: 'Aucune écriture liée à ce contact pour l’instant.',
    cetteActionSupprimeraDefinitivementLa: (nom: string, valeur: string) =>
      `Cette action supprimera définitivement la fiche de ${nom}${valeur}. Les ventes déjà enregistrées ne sont pas modifiées.`,
    masquerLesDetails: 'Masquer les détails',
    voirLesDetails: 'Voir les détails',
    kgcabrisKg: (kgCabris: number) => ` (${kgCabris} kg)`,
  },
  listeClients: {
    nomTelephoneEmailPoints: 'Nom, téléphone, email…',
    aucunClient: 'Aucun contact',
    ajoutezVosClientsPourLes: 'Ajoutez vos contacts pour les retrouver rapidement dans une nouvelle vente.',
  },
  nouveauClient: {
    nomDuClient: 'Nom du contact',
    categorieDuClient: 'Catégorie de contact',
    aideCategorie: 'Elle règle le prix, le n° de facture et la déclaration des ventes de ce contact.',
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
    affichage: 'Afficher dans les factures de ses contacts',
    aideAffichage: 'Décochée, la case n’apparaît plus dans la facture d’un contact de cette catégorie.',
    exempleNom: 'ex : Coopérative',
    ajouter: '+ Ajouter une catégorie',
    recettes: 'Recettes proposées',
    aideRecettes:
      'Seul un organisme a l’aide / subvention d’office (ou une facture de prestations) ; les autres catégories ne la proposent pas tant que vous ne la cochez pas.',
    declaree: 'Vente déclarée d’office (avec facture)',
    prixLibre: 'Prix libre, n° de facture avec lettres, réajustement',
    fraisAbattoir: 'Facturer les frais d’abattoir (même à prix libre ou offert)',
    parDefaut: 'Catégorie d’office des contacts : elle ne se retire pas.',
    protegee:
      'Les groupements (Production) se choisissent parmi les contacts de cette catégorie : elle ne se retire pas.',
    supprimer: 'Retirer cette catégorie',
    supprimerQuestion: 'Retirer cette catégorie ?',
    supprimerMessage: 'Les contacts qui l’avaient passent en « Particulier » dans leur fiche.',
  },
  importClient: {
    importerDepuisUnAutreEtablissement: 'Importer un contact depuis un autre établissement',
    saisirUnNouveauClient: 'Saisir un nouveau contact',
    choisissezUnEtablissement: 'Choisissez un établissement, puis le contact à importer.',
    aucunClientDansCetEtablissement: 'Aucun contact dans cet établissement.',
    dejaPresent: (nom: string) =>
      `« ${nom} » existe déjà dans cet établissement (même nom et même téléphone) : rien n’a été importé.`,
  },
} as const;
