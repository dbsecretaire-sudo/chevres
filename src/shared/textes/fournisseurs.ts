/** Textes de l'interface — « fournisseurs ». À modifier ici uniquement. */
export const TEXTES_FOURNISSEURS = {
  /** Les factures de la Chambre d'agriculture : ses articles habituels, modifiables. */
  chambre: {
    titre: 'Articles de la Chambre d’agriculture',
    aide: 'Les articles proposés sont modifiables : changez un nom, retirez une ligne, ajoutez-en. Le total de la facture est la somme des montants (un article sans montant n’est pas facturé).',
    articles: ['Forfait d’identification', 'Équarrissage ATM', 'Conseils et analyses'],
    article: 'Article',
    montant: 'Montant TTC (€)',
    ajouter: 'Ajouter un article',
    retirer: 'Retirer cet article',
    detailler: 'Détailler par article de la Chambre',
    /** Les boucles que la facture commande en même temps que ses articles : elles entrent à l'inventaire. */
    boucles: 'Boucles commandées avec cette facture (facultatif, ajoutées à l’inventaire)',
    /** Une ligne d'équarrissage se lie à un équarrisseur : elle apparaît dans ses factures, dans Groupements. */
    equarrisseur: 'Équarrisseur',
    equarrisseurAuto: (nom: string) => `${nom} (automatique)`,
    equarrisseurAChoisir: 'À choisir',
    equarrisseurAide:
      'Cette ligne apparaît dans les factures de cet équarrisseur, dans Groupements. Changez-le si l’équarrisseur change.',
  },
  /** Catégories de tiers (fournisseurs) : le champ de leur fiche et l'écran Organisation › Clients et fournisseurs › Catégories de tiers. */
  categories: {
    champ: 'Catégorie',
    aideChamp: 'Elle règle les catégories de dépense que ses factures peuvent avoir.',
    aide: 'Renommez, ajoutez ou retirez des catégories, et réglez les dépenses que leurs fournisseurs peuvent avoir.',
    parCategorie: 'Par catégorie',
    parOption: 'Par option',
    aideParOption: 'Ouvrez une option et cochez les catégories qui l’appliquent.',
    renommer: 'Modifier le nom de la catégorie',
    nomCategorie: 'Nom de la catégorie',
    affichage: 'Afficher dans les factures de ses fournisseurs',
    aideAffichage: 'Décochée, la case n’apparaît plus dans la facture d’un fournisseur de cette catégorie.',
    exempleNom: 'ex : Maréchal-ferrant',
    ajouter: '+ Ajouter une catégorie',
    ajouterManquantes: (nombre: number) => `Ajouter les catégories d’office manquantes (${nombre})`,
    depenses: 'Dépenses proposées',
    aideDepenses:
      'Un fournisseur ne propose que les dépenses cochées : un vétérinaire n’a que la dépense vétérinaire, l’État que les impôts et taxes, et ni l’un ni l’autre n’a à choisir l’atelier.',
    parDefaut: 'Catégorie d’office des fournisseurs : elle ne se retire pas.',
    protegee: 'Catégorie proposée d’office (dépenses vétérinaires, impôts et taxes) : elle ne se retire pas.',
    supprimer: 'Retirer cette catégorie',
    supprimerQuestion: 'Retirer cette catégorie ?',
    supprimerMessage: 'Les fournisseurs qui l’avaient passent dans la catégorie d’office dans leur fiche.',
  },
  ficheFournisseur: {
    fournisseurIntrouvable: 'Fournisseur introuvable.',
    nomDEntrepriseDeuxPoints: 'Nom d’entreprise : ',
    contactDeuxPoints: 'Contact : ',
    siretDeuxPoints: 'SIRET : ',
    tvaIntracommunautaireDeuxPoints: 'TVA intracommunautaire : ',
    ribDeuxPoints: 'RIB : ',
    totalPayeACeFournisseur: 'Total payé à ce fournisseur',
    totalAvecAutreDeuxPoints: 'Total avec Autre : ',
    aucuneEcritureLieeACe: 'Aucune écriture liée à ce fournisseur pour l’instant.',
    cetteActionSupprimeraDefinitivementLa: (nomEntreprise: string) =>
      `Cette action supprimera définitivement la fiche de ${nomEntreprise}. Les factures déjà enregistrées ne sont pas modifiées.`,
  },
  listeFournisseurs: {
    nomEntrepriseSiretPoints: 'Nom, entreprise, SIRET…',
    aucunFournisseur: 'Aucun fournisseur',
    ajoutezVosFournisseursPourLes:
      'Ajoutez vos fournisseurs pour les retrouver rapidement dans une nouvelle facture.',
    nomValeurSiretSiret: (nom: string, valeur: string, siret?: string) =>
      siret ? `${nom}${valeur} · SIRET ${siret}` : `${nom}${valeur}`,
  },
  nouveauFournisseur: {
    exCooperativeAgricoleDuNord: 'ex: Coopérative agricole du Nord',
    nomDuContact: 'Nom du contact',
    facultatifIbanBic: 'Facultatif — IBAN / BIC',
  },
  importFournisseur: {
    importerDepuisUnAutreEtablissement: 'Importer un fournisseur depuis un autre établissement',
    saisirUnNouveauFournisseur: 'Saisir un nouveau fournisseur',
    choisissezUnEtablissement: 'Choisissez un établissement, puis le fournisseur à importer.',
    aucunFournisseurDansCetEtablissement: 'Aucun fournisseur dans cet établissement.',
    dejaPresent: (nomEntreprise: string) =>
      `« ${nomEntreprise} » existe déjà dans cet établissement (même SIRET) : rien n’a été importé.`,
  },
} as const;
