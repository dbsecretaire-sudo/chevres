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
    aide: 'Renommez, ajoutez ou retirez des catégories, et réglez les dépenses que leurs contacts peuvent avoir.',
    parCategorie: 'Par catégorie',
    parOption: 'Par option',
    aideParOption: 'Ouvrez une option et cochez les catégories qui l’appliquent.',
    renommer: 'Modifier le nom de la catégorie',
    nomCategorie: 'Nom de la catégorie',
    affichage: 'Afficher dans les factures de ses contacts',
    aideAffichage: 'Décochée, la case n’apparaît plus dans la facture d’un contact de cette catégorie.',
    exempleNom: 'ex : Maréchal-ferrant',
    ajouter: '+ Ajouter une catégorie',
    ajouterManquantes: (nombre: number) => `Ajouter les catégories d’office manquantes (${nombre})`,
    depenses: 'Dépenses proposées',
    aideDepenses:
      'Un contact ne propose que les dépenses cochées : un vétérinaire n’a que la dépense vétérinaire, l’État que les impôts et taxes, et ni l’un ni l’autre n’a à choisir l’atelier.',
    parDefaut: 'Catégorie d’office des contacts : elle ne se retire pas.',
    protegee: 'Catégorie proposée d’office (dépenses vétérinaires, impôts et taxes) : elle ne se retire pas.',
    supprimer: 'Retirer cette catégorie',
    supprimerQuestion: 'Retirer cette catégorie ?',
    supprimerMessage: 'Les contacts qui l’avaient passent dans la catégorie d’office dans leur fiche.',
  },
  ficheFournisseur: {
    fournisseurIntrouvable: 'Contact introuvable.',
    nomDEntrepriseDeuxPoints: 'Nom d’entreprise : ',
    contactDeuxPoints: 'Contact : ',
    siretDeuxPoints: 'SIRET : ',
    tvaIntracommunautaireDeuxPoints: 'TVA intracommunautaire : ',
    ribDeuxPoints: 'RIB : ',
    totalPayeACeFournisseur: 'Total payé à ce contact',
    totalAvecAutreDeuxPoints: 'Total avec Autre : ',
    aucuneEcritureLieeACe: 'Aucune écriture liée à ce contact pour l’instant.',
    cetteActionSupprimeraDefinitivementLa: (nomEntreprise: string) =>
      `Cette action supprimera définitivement la fiche de ${nomEntreprise}. Les factures déjà enregistrées ne sont pas modifiées.`,
  },
  listeFournisseurs: {
    nomEntrepriseSiretPoints: 'Nom, entreprise, SIRET…',
    aucunFournisseur: 'Aucun contact',
    ajoutezVosFournisseursPourLes:
      'Ajoutez vos contacts pour les retrouver rapidement dans une nouvelle facture.',
    nomValeurSiretSiret: (nom: string, valeur: string, siret?: string) =>
      [`${nom}${valeur}`.trim(), siret ? `SIRET ${siret}` : ''].filter(Boolean).join(' · '),
  },
  nouveauFournisseur: {
    exCooperativeAgricoleDuNord: 'ex: Coopérative agricole du Nord',
    nomDuContact: 'Nom du contact',
    facultatifIbanBic: 'Facultatif — IBAN / BIC',
  },
  importFournisseur: {
    importerDepuisUnAutreEtablissement: 'Importer un contact depuis un autre établissement',
    saisirUnNouveauFournisseur: 'Saisir un nouveau contact',
    choisissezUnEtablissement: 'Choisissez un établissement, puis le contact à importer.',
    aucunFournisseurDansCetEtablissement: 'Aucun contact dans cet établissement.',
    dejaPresent: (nomEntreprise: string) =>
      `« ${nomEntreprise} » existe déjà dans cet établissement (même SIRET) : rien n’a été importé.`,
  },
} as const;
