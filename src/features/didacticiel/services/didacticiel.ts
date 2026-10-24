import { groupesCheptel } from '@/features/cheptel/services/rubriquesCheptel';
import { especeDuSuivi } from '@/features/export/suiviMouvementsPdf';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/** Une option de l'application, expliquée : son nom, ce qu'elle fait, et l'écran où on la trouve (un appui l'ouvre). */
export interface EtapeDidacticiel {
  /** Son identifiant stable. */
  id: string;
  titre: string;
  texte: string;
  /** Le chemin à suivre (« Cheptel › Naissances »). */
  chemin?: string;
  /** L'écran qu'elle ouvre ; sans lui, c'est une explication seule. */
  route?: string;
}

/** Une partie de l'application (un onglet), avec ses options. */
export interface ChapitreDidacticiel {
  id: string;
  titre: string;
  presentation: string;
  etapes: EtapeDidacticiel[];
}

/**
 * Le didacticiel : toutes les options de l'application, onglet par onglet. Les noms et les phrases des menus sont ceux de l'application
 * (ils ne se recopient pas) ; les explications de ce qui demande un geste (une dépense en deux étapes, un document de circulation) sont ici.
 */
export function didacticielDeLApplication(): ChapitreDidacticiel[] {
  const production = TEXTES.production.accueil;
  const commercial = TEXTES.commercial.accueil;
  const compta = TEXTES.comptabilite.accueil;
  const reglages = TEXTES.settings.reglages;

  return [
    {
      id: 'accueil',
      titre: 'Accueil',
      presentation: 'Ce qui demande qu’on s’en occupe, et les chiffres de l’année.',
      etapes: [
        {
          id: 'accueil.annee',
          titre: 'L’année et l’espèce',
          texte: 'En haut, choisissez l’année et l’espèce : tout l’écran, et la plupart des listes de l’application, suivent ce choix.',
        },
        {
          id: 'accueil.cotes',
          titre: 'Les trois côtés de la ferme',
          texte: 'Trois pastilles en bas : Exploitation (le troupeau et ses intervenants), Atelier (le travail du produit : fromages, charcuterie, viande) et Agritourisme (les visiteurs, leurs visites et leurs formules). Touchez une pastille, ou balayez la scène vers la gauche ou la droite.',
        },
        {
          id: 'accueil.rappels',
          titre: 'Rappels',
          texte: 'Les déclarations à valider (RSA, URSSAF), les lots à rappeler, les documents de circulation manquants et ceux à envoyer à la chambre d’agriculture (à valider une fois envoyés). Le crayon règle les rappels, l’horloge montre ceux déjà validés.',
          route: ROUTES.RAPPELS_HISTORIQUE,
        },
        {
          id: 'accueil.sante',
          titre: 'Santé du troupeau',
          texte: 'Les animaux en délai d’attente après un traitement et le bilan sanitaire annuel, qui se note dans une visite du vétérinaire.',
        },
        {
          id: 'accueil.chiffres',
          titre: 'Les chiffres de l’année',
          texte: 'Animaux vivants, petits nés, aliment par animal et par jour, solde des factures. Le détail est dans Cheptel › Tableau de bord.',
        },
        {
          id: 'accueil.etablissements',
          titre: 'Changer d’établissement',
          texte: 'Le nom de l’établissement, en haut à droite, ouvre la liste de vos établissements ; chacun a ses propres données.',
        },
      ],
    },
    {
      id: 'cheptel',
      titre: 'Cheptel',
      presentation: 'Le troupeau, sa santé, l’identification et le dossier PAC.',
      etapes: [
        ...groupesCheptel(especeDuSuivi(especeCourante())).flatMap((groupe) =>
          groupe.lignes.map<EtapeDidacticiel>((ligne) => ({
            id: `cheptel.${ligne.cle}`,
            titre: ligne.titre,
            texte: ligne.aide ?? ligne.titre,
            chemin: `Cheptel › ${groupe.titre}`,
            route: ligne.route,
          })),
        ),
        {
          id: 'cheptel.fiche',
          titre: 'La fiche d’un animal',
          texte: 'Trois onglets : Fiche (identité, bouclage, notes ; « Modifier la fiche » s’enregistre tout seul), Santé (visites et traitements) et Reproduction (lots de l’année, ascendance avec la mère et le père, descendance, bouton « Signaler un avortement »).',
          chemin: 'Cheptel › Animaux › un animal',
        },
        {
          id: 'cheptel.parents',
          titre: 'Mère et père',
          texte: 'Dans Reproduction › Ascendance, les boutons ronds ♀ et ♂ proposent les animaux présents à la naissance du petit ; le crayon change ou retire un parent déjà choisi.',
          chemin: 'Cheptel › Animaux › un animal › Reproduction',
        },
        {
          id: 'cheptel.carnet',
          titre: 'Carnet de mise bas',
          texte: 'Dans Naissances, le carnet s’imprime en livret à plier ; dans Organisation › PDF, en feuilles A4 à ranger. Il se remplit d’après les naissances et les résultats de production de l’année.',
          chemin: 'Cheptel › Naissances',
          route: ROUTES.CHEPTEL_NAISSANCES,
        },
        {
          id: 'cheptel.circulation',
          titre: 'Documents de circulation',
          texte: 'Un document par bon de livraison à l’abattoir ou par vente d’animaux vivants (créé avant toute écriture), ou par achat d’animaux vivants : déposez-le rempli (scan ou photo), ou générez le modèle pré-rempli. Touchez une ligne pour voir le document et les factures concernées (la prestation de l’abattoir, la vente). Tant qu’il manque, un rappel s’affiche sur l’accueil ; une fois déposé, un autre rappelle de l’envoyer à la chambre d’agriculture.',
          chemin: 'Cheptel › Dossier PAC › Documents de circulation',
          route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION,
        },
        {
          id: 'cheptel.bibliotheque',
          titre: 'Documents déjà générés',
          texte: 'Tous les PDF générés par l’application sont gardés : on les rouvre pour les envoyer ou les imprimer de nouveau.',
          chemin: 'Cheptel › Dossier PAC › Documents déjà générés',
          route: ROUTES.CHEPTEL_BIBLIOTHEQUE,
        },
      ],
    },
    {
      id: 'production',
      titre: 'Production',
      presentation: 'Ce que produit l’exploitation : fromages, viande, œufs, lait, contrôles.',
      etapes: [
        { id: 'production.fromages', titre: production.fromages.titre, texte: production.fromages.aide, chemin: 'Production', route: ROUTES.PRODUCTION_FROMAGES },
        { id: 'production.viande', titre: production.viande.titre, texte: `${production.viande.aide} Les lots naissent d’un « bon de livraison » (page de l’abattoir). Quatre onglets : À facturer (les lots, par jour d’abattage), Facturée, À vendre (animaux disponibles ou réservés) et Vendue (morts ou vivants).`, chemin: 'Production', route: ROUTES.PRODUCTION_VIANDE },
        { id: 'production.charcuterie', titre: production.charcuterie.titre, texte: production.charcuterie.aide, chemin: 'Production', route: ROUTES.PRODUCTION_CHARCUTERIE },
        { id: 'production.laitier', titre: production.laitier.titre, texte: production.laitier.aide, chemin: 'Production' },
        { id: 'production.lait', titre: production.productionLait.titre, texte: production.productionLait.aide, chemin: 'Production', route: ROUTES.PRODUCTION_LAIT },
        { id: 'production.rappels', titre: production.rappels.titre, texte: production.rappels.aide, chemin: 'Production', route: ROUTES.PRODUCTION_RAPPELS_LOTS },
      ],
    },
    {
      id: 'commercial',
      titre: 'Commercial',
      presentation: 'Les ventes, les commandes et l’agritourisme.',
      etapes: [
        { id: 'commercial.ventes', titre: commercial.ventes.titre, texte: commercial.ventes.aide, chemin: 'Commercial', route: ROUTES.COMMERCIAL_VENTES },
        { id: 'commercial.tarifs', titre: commercial.tarifs.titre, texte: commercial.tarifs.aide, chemin: 'Commercial', route: ROUTES.COMMERCIAL_TARIFS },
        { id: 'commercial.commandes', titre: commercial.commandes.titre, texte: `${commercial.commandes.aide} Un seul bon de commande reste ouvert par client : les animaux et produits réservés s’y rangent, puis la facturation le passe en terminé.`, chemin: 'Commercial', route: ROUTES.COMMERCIAL_COMMANDES },
        { id: 'commercial.visites', titre: commercial.visitesAgri.titre, texte: commercial.visitesAgri.aide, chemin: 'Accueil › Agritourisme › Visites', route: ROUTES.COMMERCIAL_AGRITOURISME },
        { id: 'commercial.formules', titre: commercial.formulesAgri.titre, texte: commercial.formulesAgri.aide, chemin: 'Accueil › Agritourisme › Formules', route: ROUTES.COMMERCIAL_FORMULES },
        { id: 'commercial.circuits', titre: commercial.circuits.titre, texte: 'Le circuit par lequel un produit est vendu (vente à la ferme, abattoir…) ; il est obligatoire pour une vente de production.', chemin: 'Commercial', route: ROUTES.COMMERCIAL_CIRCUITS },
        { id: 'commercial.reserver', titre: 'Réserver pour un client', texte: 'Un animal, un fromage ou une charcuterie se réserve pour un client depuis son inventaire ; la réservation rejoint le bon de commande du client et se facture d’un appui.', chemin: 'Production › Viande › À vendre' },
      ],
    },
    {
      id: 'comptabilite',
      titre: 'Comptabilité',
      presentation: 'Les écritures, l’inventaire, la trésorerie, la TVA et les déclarations.',
      etapes: [
        { id: 'compta.ecritures', titre: compta.ecritures, texte: 'Toutes les ventes et factures de l’année. Le bouton « + » ouvre une nouvelle écriture : un débit (dépense) ou un crédit (recette).', chemin: 'Comptabilité', route: ROUTES.COMPTABILITE_LISTE },
        { id: 'compta.etapes', titre: 'Saisir une écriture', texte: 'Deux étapes : d’abord le contact, la date et la facture, puis ce qui est acheté ou vendu (catégorie, détail, TVA, montant). « Suivant » et « Précédent » passent de l’une à l’autre.', chemin: 'Comptabilité › Écritures › +' },
        { id: 'compta.contact', titre: 'Choisir un contact', texte: 'La liste montre d’abord les catégories de contact, puis les contacts de la catégorie ouverte. Une recherche propose la catégorie du contact trouvé ; le crayon mène à la fiche.', chemin: 'Comptabilité › Écritures › +' },
        { id: 'compta.animaux', titre: 'Acheter des animaux vivants', texte: 'Dépense, catégorie « Animaux vivants (achat) » : saisissez chaque animal (boucle, sexe, naissance). Les fiches se créent dans le cheptel et le document de circulation part de chez le vendeur.', chemin: 'Comptabilité › Écritures › + › Débit' },
        { id: 'compta.viande', titre: 'Vendre de la viande ou des animaux', texte: 'Crédit, catégorie viande : choisissez les animaux du cheptel et leur poids ; ils vendent vivants ou morts selon le client et la ligne choisie. Supprimer la vente les remet dans le cheptel.', chemin: 'Comptabilité › Écritures › + › Crédit' },
        { id: 'compta.inventaire', titre: compta.inventaire.titre, texte: `${compta.inventaire.aide} ${compta.inventaire.stocksAide}`, chemin: 'Comptabilité', route: ROUTES.COMPTABILITE_INVENTAIRE },
        { id: 'compta.tresorerie', titre: compta.tresorerie.titre, texte: compta.tresorerie.aide, chemin: 'Comptabilité', route: ROUTES.COMPTABILITE_TRESORERIE },
        { id: 'compta.rentabilite', titre: compta.rentabilite.titre, texte: compta.rentabilite.aide, chemin: 'Comptabilité', route: ROUTES.RENTABILITE },
        { id: 'compta.tva', titre: compta.tva.titre, texte: compta.tva.aide, chemin: 'Comptabilité', route: ROUTES.TVA },
        { id: 'compta.fiscalite', titre: TEXTES.comptabilite.fiscalite.titre, texte: compta.declarationsAide, chemin: 'Comptabilité', route: ROUTES.FISCALITE },
        { id: 'compta.pcg', titre: reglages.comptesPcg, texte: 'Les comptes du plan comptable proposés pour chaque dépense ; ils sont indicatifs, à confirmer avec votre comptable.', chemin: 'Comptabilité', route: ROUTES.COMPTES_PCG },
        { id: 'compta.reglages', titre: compta.reglages.titre, texte: compta.reglages.aide, chemin: 'Comptabilité', route: ROUTES.COMPTABILITE_REGLAGES },
      ],
    },
    {
      id: 'contacts',
      titre: 'Contacts',
      presentation: 'Le carnet d’adresses : clients, fournisseurs, organismes.',
      etapes: [
        { id: 'contacts.carnet', titre: TEXTES.contacts.titre, texte: 'Un contact reçoit des recettes, fait des dépenses, ou les deux : une seule fiche, une seule catégorie. La barre de recherche trouve un nom, un téléphone ou un e-mail.', chemin: 'Contacts', route: ROUTES.CONTACTS },
        { id: 'contacts.categories', titre: 'Les catégories', texte: 'La catégorie d’un contact règle ce qu’il peut avoir : pour un client, le prix libre ou de l’inventaire et les recettes possibles ; pour un fournisseur, les dépenses possibles. Elles se renomment, s’ajoutent et se retirent dans Organisation.', chemin: 'Organisation › Contacts', route: ROUTES.ORGANISATION_TIERS },
      ],
    },
    {
      id: 'organisation',
      titre: 'Organisation',
      presentation: 'Ce qui est commun à toute l’exploitation.',
      etapes: [
        { id: 'organisation.etablissement', titre: reglages.sectionEtablissement, texte: reglages.aideRubriqueEtablissement, chemin: 'Organisation', route: ROUTES.ORGANISATION_ETABLISSEMENT },
        { id: 'organisation.categories', titre: `${reglages.sectionCategoriesClient} et ${reglages.sectionCategoriesTiers}`, texte: `${reglages.aideCategoriesClient} ${reglages.aideCategoriesTiers}`, chemin: 'Organisation › Contacts', route: ROUTES.ORGANISATION_TIERS },
        { id: 'organisation.donnees', titre: reglages.sectionDonnees, texte: reglages.aideRubriqueDonnees, chemin: 'Organisation', route: ROUTES.ORGANISATION_DONNEES },
        { id: 'organisation.pdf', titre: reglages.pdf, texte: `${reglages.aidePdf} Les documents déjà générés y sont signalés.`, chemin: 'Organisation › Mes données', route: ROUTES.PDF_DONNEES },
        { id: 'organisation.sauvegarde', titre: reglages.sauvegardeLocale, texte: 'Une copie de toutes vos données dans un fichier, à garder ailleurs ; un rappel vous prévient quand la dernière sauvegarde est ancienne.', chemin: 'Organisation › Mes données', route: ROUTES.SAUVEGARDE_LOCALE },
        { id: 'organisation.drive', titre: reglages.googleDrive, texte: 'Les données partent sur Google Drive en un fichier par catégorie ; elles restent d’abord enregistrées sur l’appareil.', chemin: 'Organisation › Mes données', route: ROUTES.GOOGLE_DRIVE },
        { id: 'organisation.reglages', titre: reglages.sectionRegles, texte: reglages.aideRubriqueRegles, chemin: 'Organisation', route: ROUTES.ORGANISATION_REGLES },
        { id: 'organisation.auto', titre: 'Enregistrement automatique', texte: 'Un formulaire qu’on modifie s’enregistre tout seul ; seuls les écrans de création ont leur bouton Enregistrer.' },
      ],
    },
  ];
}
