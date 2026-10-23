/** Textes de l'interface — « contacts » : une personne ou une organisation qui est client, fournisseur, ou les deux. À modifier ici uniquement. */
export const TEXTES_CONTACTS = {
  titre: 'Contacts',
  /** Les opérations d'une catégorie de contact, rangées comme l'inventaire. */
  operations: {
    liste: 'Liste',
    vente: 'Vente',
    /** Dans les dépenses, la seule « vente » est la sortie d'animaux vivants (vers l'abattoir) : on la paie, on ne la vend pas. */
    sortie: 'Sortie',
    achat: 'Achat',
    toutesLesVentes: 'Toutes les ventes',
    tousLesAchats: 'Tous les achats',
    autresDepenses: 'Autres dépenses (sans stock)',
    autresRecettes: 'Autres recettes',
    aideAchats:
      'Une dépense est un achat : cochez, pour chaque liste de l’inventaire, ce que les contacts de cette catégorie peuvent vous vendre. Seule exception, « Animaux » propose aussi « Sortie » : des animaux vivants qui partent à l’abattoir (de vivant à abattu) se facturent en dépense.',
    aideVentes:
      'Une recette est une vente : cochez, pour chaque liste de l’inventaire, ce que les contacts de cette catégorie peuvent vous acheter.',
  },
  titreFiche: 'Contact',
  titreDocument: 'Document du contact',
  /** Les contrats d'un assureur : leur liste, choisie dans une écriture d'assurance à la place du numéro de facture. */
  contrat: {
    titre: 'Contrat d’assurance',
    aide: 'Le contrat se choisit dans une écriture d’assurance dès que cet assureur est sélectionné : son numéro s’inscrit alors comme numéro de la facture.',
    assureur: 'Assureur',
    choisirAssureur: 'Choisir l’assureur',
    denomination: 'Dénomination du contrat',
    exempleDenomination: 'ex : Multirisque exploitation, 4x4 Hilux',
    numero: 'Numéro de contrat',
    exempleNumero: 'ex : 123456789',
    numeroAide: 'Il remplace le numéro de facture : sans numéro, c’est la dénomination qui s’inscrit.',
    dossier: 'Dossier de l’assureur',
    dossierAide: 'Les papiers du contrat (conditions, attestation, avenants) se rangent dans un dossier de cet assureur.',
    dossierDeLAssureur: 'Dossier du contrat',
    aucunDossier: 'Aucun dossier',
    creerDossier: 'Créer un dossier au nom du contrat',
    assureurRequis: 'Choisissez l’assureur de ce contrat.',
    denominationRequise: 'La dénomination du contrat est obligatoire.',
    supprimer: 'Supprimer ce contrat',
    supprimerQuestion: 'Supprimer ce contrat ?',
    supprimerMessage: 'Il disparaît de la liste de l’assureur. Les écritures déjà faites gardent leur numéro, et son dossier reste rangé.',
    /** Dans une écriture d'assurance : le choix du contrat à la place du numéro de facture. */
    champ: 'Contrat d’assurance',
    champAide: 'Son numéro s’inscrit comme numéro de la facture.',
    sansContrat: 'Autre (sans contrat de la liste)',
    nouveau: '+ Nouveau contrat…',
    aucunContrat: 'Aucun contrat pour cet assureur : créez-le (son numéro s’inscrira dans la facture).',
    /** Sur la page de l'assurance : les contrats de tous les assureurs. */
    groupe: 'Contrats d’assurance',
    nouveauContrat: 'Nouveau contrat d’assurance',
    aucunContratListe: 'Aucun contrat d’assurance.',
    ligne: (assureur: string, numero: string) => [assureur, numero && `n° ${numero}`].filter(Boolean).join(' · '),
    /** Un contrat rangé sous son assureur : le nom de l’assureur est déjà au-dessus. */
    ligneSousAssureur: (numero: string) => (numero ? `n° ${numero}` : undefined),
  },
  aide: 'Un contact reçoit des recettes, fait des dépenses, ou les deux. Une seule fiche, une seule catégorie.',
  aideRubrique:
    'Clients et fournisseurs réunis : chaque contact une fois, avec ses recettes et ses dépenses.',
  recherche: 'Nom, téléphone, e-mail…',
  toutesLesCategories: (n: number) => `Toutes (${n})`,
  categorieAChoisirPuce: (n: number) => `À choisir (${n})`,
  aucun: 'Aucun contact.',
  aucunSousTitre: 'Ajoutez un contact avec le bouton +.',
  recettes: 'Recettes',
  depenses: 'Dépenses',
  nouveau: 'Nouveau contact',
  categorieAChoisir: 'Catégorie à choisir',
  aClasser: (nombre: number) =>
    nombre === 1
      ? '1 contact a deux catégories différentes : à choisir'
      : `${nombre} contacts ont deux catégories différentes : à choisir`,
  fiche: {
    introuvable: 'Contact introuvable.',
    categorieDeuxPoints: 'Catégorie : ',
    nomDEntrepriseDeuxPoints: 'Nom : ',
    personneDeuxPoints: 'Contact : ',
    siretDeuxPoints: 'SIRET : ',
    tvaDeuxPoints: 'TVA intracommunautaire : ',
    ribDeuxPoints: 'RIB : ',
    adresseDeuxPoints: 'Adresse : ',
    telephoneDeuxPoints: 'Téléphone : ',
    emailDeuxPoints: 'Email : ',
    typeDeuxPoints: 'Type : ',
    resume: 'Résumé',
    balance: 'Balance du contact',
    aideBalance: 'Ce qu’il vous a payé, moins ce que vous lui avez payé.',
    aucuneEcriture: 'Aucune écriture liée à ce contact pour l’instant.',
    nouvelleDepense: 'Nouvelle dépense',
    nouvelleRecette: 'Nouvelle recette',
    ongletEcritures: (n: number) => `Écritures liées${n > 0 ? ` (${n})` : ''}`,
    ongletDocuments: (n: number) => `Documents liés${n > 0 ? ` (${n})` : ''}`,
    /** L’onglet des contrats d’un assureur, à gauche de ses documents. */
    ongletContrats: (n: number) => `Contrats${n > 0 ? ` (${n})` : ''}`,
    ajouterDocument: '+ Ajouter un document, un courrier, une aide…',
    aucunDocument: 'Aucun document lié à ce contact pour l’instant.',
    origine: { partenaire: 'Document', dossier: 'Dossier' },
    /** Les pièces qui se rangent toutes seules dans les documents d'un contact : les bons d'équarrissage (équarrisseur), les documents de circulation (abattoir). */
    pieces: {
      bonNumero: (numero: string) => `Bon d’équarrissage n° ${numero}`,
      bonDuLot: (lot: string) => `Bon d’équarrissage · ${lot}`,
      bonManque: 'Bon à ajouter',
      circulation: (de: string) => `Document de circulation · ${de}`,
      documentAjoute: 'Document ajouté',
      documentManque: 'Document à ajouter',
      equarrisseurAChoisir: 'Équarrisseur à choisir dans le lot',
    },
    supprimerQuestion: 'Supprimer ce contact ?',
    supprimerMessage: (nom: string) =>
      `Cette action supprimera définitivement la fiche de ${nom}. Les ventes et les factures déjà enregistrées ne sont pas modifiées.`,
    conflitTitre: 'Quelle catégorie garder ?',
    conflitMessage: (client: string, fournisseur: string) =>
      `Ce contact a une catégorie côté recettes (« ${client} ») et une autre côté dépenses (« ${fournisseur} »). Choisissez celle qui s’applique aux deux.`,
    garder: (nom: string) => `Garder « ${nom} »`,
  },
  formulaire: {
    titreModifier: 'Modifier la fiche',
    categorie: 'Catégorie',
    choisirCategorie: 'Choisir une catégorie',
    volets: 'Volets',
    aideVolets:
      'Cochez ce que cette association ou cette coopérative fait pour vous : ses écritures proposent alors ces volets. Rien de coché : des écritures simples (cotisation, facture).',
    circuitPrivilegie: 'Circuit de vente privilégié',
    aideCircuit:
      'Par où ce contact achète d’ordinaire : il est repris d’office dans ses ventes, ses réservations et ses commandes.',
    aideCategorie:
      'Une seule catégorie pour le contact, qu’il reçoive des recettes, fasse des dépenses, ou les deux.',
    nom: 'Nom ou entreprise',
    prenom: 'Prénom',
    personne: 'Personne à contacter',
    facultatif: 'Facultatif',
    type: 'Ce contact…',
    recettes: 'Reçoit des recettes',
    depenses: 'Fait des dépenses',
    siret: 'SIRET',
    tva: 'TVA intracommunautaire',
    rib: 'RIB',
    adresse: 'Adresse postale',
    telephone: 'Téléphone',
    email: 'Email',
    enregistrer: 'Enregistrer',
    annuler: 'Annuler',
    retirerClient:
      'Retirer le côté « recettes » supprime la fiche client de ce contact (et son dossier). Continuer ?',
    retirerFournisseur:
      'Retirer le côté « dépenses » supprime la fiche fournisseur de ce contact. Continuer ?',
    confirmer: 'Continuer',
  },
  erreurs: {
    nomRequis: 'Nom requis',
    categorieRequise: 'Choisissez une catégorie.',
    circuitRequis: 'Choisissez le circuit de vente privilégié du contact.',
    rienCoche: 'Cochez « recettes », « dépenses », ou les deux.',
    nomDejaPris: 'Un autre contact porte déjà ce nom : choisissez un nom différent, ou ouvrez ce contact.',
    ecrituresRecettes:
      'Ce contact a des ventes ou des factures émises : le côté « recettes » ne se retire pas.',
    ecrituresDepenses: 'Ce contact a des factures reçues : le côté « dépenses » ne se retire pas.',
  },
  lien: {
    titre: 'Contact',
    aide: 'Ses recettes, ses dépenses, sa catégorie et ses écritures sont réunies dans sa fiche contact.',
    ouvrir: 'Ouvrir la fiche contact',
  },
} as const;
