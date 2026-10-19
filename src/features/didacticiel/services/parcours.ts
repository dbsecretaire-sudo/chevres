import type { EtapeVisite } from '@/features/didacticiel/services/visiteGuidee';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';

/** Une étape d'un parcours de cas : ce qu'on fait, où, et l'écran qui s'ouvre. */
export interface EtapeParcours {
  /** Son numéro, tel qu'on le lit (« 1 », « 5A »). */
  numero: string;
  titre: string;
  texte: string;
  /** Le chemin à suivre (« Production › Viande › À vendre »). */
  chemin?: string;
  /** L'écran de l'étape (sans paramètres : la visite guidée s'y reconnaît). */
  route?: string;
  /** L'adresse à ouvrir pour y aller, quand elle diffère de `route` (un onglet, un filtre). */
  ouvrir?: string;
}

/** Un cas du quotidien suivi pas à pas : on le lit dans le didacticiel, ou on le parcourt en visite guidée. */
export interface Parcours {
  id: string;
  titre: string;
  resume: string;
  etapes: EtapeParcours[];
}

const CONTROLES_PRODUCTION = '/production/controles/liste';
const CONTROLES_SANTE = '/sante/controles/liste';

/** Les étapes de l'inventaire, communes à plusieurs parcours : le stock restant, puis ses mouvements. */
const etapesDeStock = (premier: number): EtapeParcours[] => [
  {
    numero: String(premier),
    titre: 'Le stock restant',
    texte: 'Dans l’inventaire, le stock de ce que vous venez de vendre a baissé : on y lit ce qui reste.',
    chemin: 'Comptabilité › Inventaire › Stocks',
    route: ROUTES.COMPTABILITE_STOCKS,
  },
  {
    numero: String(premier + 1),
    titre: 'Les mouvements de stock',
    texte: 'L’historique de l’inventaire garde chaque mouvement : la vente y figure avec sa date et sa quantité.',
    chemin: 'Comptabilité › Inventaire › Historique',
    route: '/comptabilite/stock-historique',
    ouvrir: ROUTES.stockHistorique(),
  },
];

/**
 * Les parcours de cas du didacticiel : chacun suit un cas de bout en bout (une vente, un traitement…), dans l'ordre où on le fait dans
 * l'application. Les noms d'écrans sont ceux des menus.
 */
export function parcoursDeCas(): Parcours[] {
  return [
    {
      id: 'vente-sans-facture',
      titre: 'Je vends un animal à un particulier sans facture',
      resume: 'Du petit sans boucle à l’écriture de vente, sans facture.',
      etapes: [
        {
          numero: '1',
          titre: 'Je déclare une naissance sans boucle',
          texte: 'Notez la naissance du petit sans lui poser de boucle : un animal sans boucle se vend sans facture.',
          chemin: 'Cheptel › Naissances › +',
          route: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE,
        },
        {
          numero: '2',
          titre: 'J’active l’option « Avancé »',
          texte: 'Dans Production › Viande, cochez « Avancé » : les onglets « À vendre » et « Vendue » apparaissent.',
          chemin: 'Production › Viande',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          numero: '3',
          titre: 'Je récupère l’animal',
          texte: 'Ouvrez l’onglet « À vendre » : l’animal né sans boucle y est proposé.',
          chemin: 'Production › Viande › À vendre',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          numero: '4',
          titre: 'Je le réserve ou je le facture de suite',
          texte: 'Réservez l’animal pour le client (il rejoint son bon de commande), ou facturez-le tout de suite.',
          chemin: 'Production › Viande › À vendre',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          numero: '5',
          titre: 'Réservé : je le facture',
          texte: 'Un animal réservé se facture d’un appui, depuis la réservation.',
          chemin: 'Production › Viande › À vendre',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          numero: '5A',
          titre: 'Je vois les commandes en cours',
          texte: 'Les réservations non encore facturées sont dans les commandes à traiter.',
          chemin: 'Commercial › Commandes à traiter',
          route: ROUTES.COMMERCIAL_COMMANDES,
        },
        {
          numero: '6',
          titre: 'Je vérifie les informations préremplies',
          texte: 'Vérifiez que « Sans facture » est bien sélectionné. L’écriture apparaît dans la liste des écritures, mais elle ne sera comptée ni pour les impôts ni pour le RSA.',
          chemin: 'Comptabilité › Écritures',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '7',
          titre: 'Cabri mort ou vivant',
          texte: 'Cochez « morts » ou « vivants » selon la demande du client.',
          chemin: 'Comptabilité › Écritures',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '8',
          titre: 'Je vérifie l’atelier',
          texte: 'Vérifiez que l’atelier concerné (l’espèce) est le bon.',
          chemin: 'Comptabilité › Écritures',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '9',
          titre: 'Je vois la liste des ventes sans facture',
          texte: 'L’onglet « Vendue » de la viande liste les animaux vendus sans facture.',
          chemin: 'Production › Viande › Vendue',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        ...etapesDeStock(10),
      ],
    },
    {
      id: 'vente-abattoir',
      titre: 'Je vends un animal passé à l’abattoir',
      resume: 'De la facture de l’abattoir à la facture du client.',
      etapes: [
        {
          numero: '1',
          titre: 'Je crée la facture de l’abattoir',
          texte: 'Une dépense au nom de l’abattoir : c’est elle qui donne les frais d’abattoir refacturés au client.',
          chemin: 'Comptabilité › Écritures › + › Débit',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '2',
          titre: 'Je récupère le lot',
          texte: 'Dans l’onglet « À facturer », ouvrez le lot (le jour d’abattage) et vérifiez qu’aucun animal n’est mort ni saisi par l’abattoir.',
          chemin: 'Production › Viande › À facturer',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          numero: '3',
          titre: 'Je vérifie le poids total',
          texte: 'Contrôlez le poids total noté à l’abattoir : il remplit le poids de la facture au client.',
          chemin: 'Production › Viande › lot › Écritures',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          numero: '4',
          titre: 'Je facture ce lot à un client',
          texte: 'Le bouton « Facturer la viande de ce lot au client » ouvre la facture, déjà préremplie.',
          chemin: 'Production › Viande › lot',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          numero: '5',
          titre: 'Je termine la facture',
          texte: 'Complétez les informations demandées (contact, date, TVA, paiement) puis enregistrez.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '6',
          titre: 'Je vérifie l’atelier',
          texte: 'Vérifiez que l’atelier concerné (l’espèce) est le bon.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '7',
          titre: 'La liste des factures',
          texte: 'Les ventes de viande facturées sont dans l’onglet « Facturée ».',
          chemin: 'Production › Viande › Facturée',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        ...etapesDeStock(8),
      ],
    },
    {
      id: 'vente-lait',
      titre: 'Je vends le lait',
      resume: 'De la recette au récolteur jusqu’à la rentabilité de l’atelier.',
      etapes: [
        {
          numero: '1',
          titre: 'Nouvelle recette',
          texte: 'Dans les écritures, le bouton « + » puis « Crédit » ouvre une nouvelle recette.',
          chemin: 'Comptabilité › Écritures › + › Crédit',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '2',
          titre: 'Je choisis un récolteur',
          texte: 'Le contact est le récolteur qui collecte votre lait.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '3',
          titre: 'Je choisis la catégorie Lait',
          texte: 'La catégorie de recette « Lait » demande le litrage vendu.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '4',
          titre: 'J’indique le litrage vendu',
          texte: 'Le nombre de litres livrés au récolteur.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '5',
          titre: 'J’indique le montant payé par le récolteur',
          texte: 'Le récolteur fixe son prix : saisissez le montant qu’il vous paie. La case « Prix du produit personnalisé » se règle par catégorie de contact, dans Organisation › Contacts : elle n’est utile qu’aux contacts qui en ont besoin.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '5A',
          titre: 'Je précise l’atelier',
          texte: 'Vérifiez l’atelier (l’espèce) concerné par cette vente de lait.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '6',
          titre: 'Je complète les analyses obligatoires',
          texte: 'Pour chaque mois, ajoutez les analyses du lait.',
          chemin: 'Production › Qualité du lait › Analyses',
          route: CONTROLES_PRODUCTION,
          ouvrir: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.LAITIER, FAMILLE_CONTROLE.ANALYSE),
        },
        {
          numero: '7',
          titre: 'Je constate l’évolution de la qualité',
          texte: 'L’onglet « Résumé » montre l’évolution de la qualité du lait.',
          chemin: 'Production › Qualité du lait › Résumé',
          route: CONTROLES_PRODUCTION,
          ouvrir: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.LAITIER, FAMILLE_CONTROLE.RESUME),
        },
        {
          numero: '8',
          titre: 'La production du lait',
          texte: 'Précisez la date de début et de fin de traite et le nombre de chèvres à la traite : on obtient la quantité de lait par chèvre et par traite.',
          chemin: 'Production › Production du lait',
          route: ROUTES.PRODUCTION_LAIT,
        },
        {
          numero: '9',
          titre: 'Le chiffre d’affaires',
          texte: 'Une vision globale du chiffre d’affaires, par produit, par contact et par mois.',
          chemin: 'Commercial › Chiffre d’affaires',
          route: ROUTES.COMMERCIAL_VENTES,
        },
        {
          numero: '10',
          titre: 'La rentabilité par atelier',
          texte: 'Ce que rapporte et ce que coûte chaque atelier.',
          chemin: 'Comptabilité › Rentabilité',
          route: ROUTES.RENTABILITE,
        },
        {
          numero: '11',
          titre: 'Le stock et ses mouvements',
          texte: 'Le stock de lait se lit dans l’inventaire (Stocks), et ses mouvements dans l’historique de l’inventaire.',
          chemin: 'Comptabilité › Inventaire › Stocks + Historique',
          route: ROUTES.COMPTABILITE_STOCKS,
        },
      ],
    },
    {
      id: 'vente-fromage',
      titre: 'Je vends du fromage',
      resume: 'La vente d’un lot de fromage, et son rappel si un contrôle n’est pas bon.',
      etapes: [
        {
          numero: '1',
          titre: 'Le lot de fromage',
          texte: 'Chaque fabrication est un lot numéroté : c’est lui qu’on vend et qu’on suit.',
          chemin: 'Production › Fromages',
          route: ROUTES.PRODUCTION_FROMAGES,
        },
        {
          numero: '2',
          titre: 'Nouvelle recette',
          texte: 'Crédit, catégorie « Fromages » : choisissez le type de fromage et les lots vendus (leurs numéros sont repris pour le suivi).',
          chemin: 'Comptabilité › Écritures › + › Crédit',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '3',
          titre: 'Je vérifie l’atelier',
          texte: 'Vérifiez l’atelier (l’espèce) concerné.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        ...etapesDeStock(4),
        {
          numero: '6',
          titre: 'Le rappel de lots',
          texte: 'Si le contrôle d’un lot vendu n’est pas bon, le lot est à rappeler : il apparaît dans les rappels de lots (et sur l’accueil) jusqu’à ce que le rappel soit validé.',
          chemin: 'Production › Fromages › Rappel (et Production › Rappels de lots)',
          route: ROUTES.PRODUCTION_RAPPELS_LOTS,
        },
      ],
    },
    {
      id: 'vente-charcuterie',
      titre: 'Je vends de la boucherie ou de la charcuterie',
      resume: 'La vente d’un lot de charcuterie ou de morceaux, et son rappel.',
      etapes: [
        {
          numero: '1',
          titre: 'Le lot de charcuterie',
          texte: 'Chaque fabrication est un lot numéroté : c’est lui qu’on vend et qu’on suit.',
          chemin: 'Production › Boucherie / Charcuterie',
          route: ROUTES.PRODUCTION_CHARCUTERIE,
        },
        {
          numero: '2',
          titre: 'Nouvelle recette',
          texte: 'Crédit, catégorie « Boucherie / charcuterie » : choisissez le produit et les lots vendus.',
          chemin: 'Comptabilité › Écritures › + › Crédit',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '3',
          titre: 'Je vérifie l’atelier',
          texte: 'Vérifiez l’atelier (l’espèce) concerné.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        ...etapesDeStock(4),
        {
          numero: '6',
          titre: 'Le rappel de lots',
          texte: 'Si le contrôle d’un lot vendu n’est pas bon, le lot est à rappeler : il apparaît dans les rappels de lots (et sur l’accueil) jusqu’à ce que le rappel soit validé.',
          chemin: 'Production › Boucherie / Charcuterie › Rappel (et Production › Rappels de lots)',
          route: ROUTES.PRODUCTION_RAPPELS_LOTS,
        },
      ],
    },
    {
      id: 'veterinaire-traitement',
      titre: 'Visite du vétérinaire et traitement',
      resume: 'De la dépense du vétérinaire au délai d’attente des animaux traités.',
      etapes: [
        {
          numero: '1',
          titre: 'La dépense du vétérinaire',
          texte: 'Saisissez la facture du vétérinaire : une dépense, catégorie vétérinaire.',
          chemin: 'Comptabilité › Écritures › + › Débit',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '2',
          titre: 'Je note le motif de la visite',
          texte: 'Indiquez le motif, puis « Ajouter aux visites vétérinaires » : la visite entre dans le carnet sanitaire (« Bilan sanitaire annuel » pour le bilan de l’année).',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '3',
          titre: 'Je note le traitement',
          texte: 'Le bouton « + » ajoute un traitement : le médicament, les animaux (vide : tout le troupeau) et les délais d’attente du lait et de la viande, ceux de l’ordonnance ou de la notice.',
          chemin: 'Cheptel › Santé › Traitements › +',
          route: ROUTES.CHEPTEL_TRAITEMENT_NOUVEAU,
        },
        {
          numero: '4',
          titre: 'Je suis les délais d’attente',
          texte: 'La fin du délai d’attente se calcule toute seule : les animaux en délai sont listés, et signalés si vous les vendez avant la fin (document de circulation compris).',
          chemin: 'Cheptel › Santé › Traitements',
          route: ROUTES.CHEPTEL_TRAITEMENTS,
        },
      ],
    },
    {
      id: 'aliments',
      titre: 'Je remplis les factures d’aliments',
      resume: 'De la facture d’aliments au prix par animal.',
      etapes: [
        {
          numero: '1',
          titre: 'La facture d’aliments',
          texte: 'Une dépense, catégorie alimentation : le fournisseur, la date et le numéro de la facture.',
          chemin: 'Comptabilité › Écritures › + › Débit',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '2',
          titre: 'Le détail par aliment',
          texte: 'Une ligne par aliment : choisissez l’aliment, indiquez la quantité et le montant. C’est ce détail qui permet de calculer le prix par animal.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '3',
          titre: 'Je vérifie l’atelier',
          texte: 'L’atelier (l’espèce) est facultatif : il sert à la marge par atelier. L’aliment d’un autre cheptel reste une charge commune.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '4',
          titre: 'Le stock d’aliments',
          texte: 'Les aliments achetés entrent dans l’inventaire, et se consomment au fil de la distribution.',
          chemin: 'Comptabilité › Inventaire › Stocks',
          route: ROUTES.COMPTABILITE_STOCKS,
        },
        {
          numero: '5',
          titre: 'Ce que mangent les animaux et ce que ça coûte',
          texte: 'La distribution d’aliments et son coût, avec des repères d’alimentation par espèce (des ordres de grandeur, jamais une ration).',
          chemin: 'Cheptel › Santé › Alimentation',
          route: ROUTES.SANTE_ALIMENTATION,
        },
        {
          numero: '6',
          titre: 'Le prix par animal',
          texte: 'Le coût d’aliment par animal et par jour se lit dans les chiffres de l’année, sur l’accueil, et dans le détail du tableau de bord du cheptel.',
          chemin: 'Cheptel › Tableau de bord',
          route: ROUTES.CHEPTEL_TABLEAU_DE_BORD,
        },
        {
          numero: '7',
          titre: 'La rentabilité',
          texte: 'La rentabilité compare ce que coûte l’aliment à ce que rapporte l’atelier (par exemple, le coût d’aliment par litre de lait).',
          chemin: 'Comptabilité › Rentabilité',
          route: ROUTES.RENTABILITE,
        },
      ],
    },
    {
      id: 'boucles-pac',
      titre: 'Boucles et dossier PAC',
      resume: 'Des boucles achetées au dossier PAC et aux documents de circulation.',
      etapes: [
        {
          numero: '1',
          titre: 'J’achète des boucles',
          texte: 'La facture d’achat des boucles (ou des tiptag) les ajoute à l’inventaire.',
          chemin: 'Comptabilité › Écritures › + › Débit',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '2',
          titre: 'L’inventaire des boucles',
          texte: 'Les boucles, boucles rouges et tiptag, à poser ou posés. Un tiptag est destiné à l’abattoir : c’est toujours un cabri.',
          chemin: 'Cheptel › Boucles',
          route: '/sante/controles/liste',
          ouvrir: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES),
        },
        {
          numero: '3',
          titre: 'Je pose une boucle',
          texte: 'La boucle se pose à la naissance du petit, ou depuis la fiche de l’animal (bouclage) : elle est alors marquée posée.',
          chemin: 'Cheptel › Naissances › + ou Cheptel › Animaux › un animal',
          route: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE,
        },
        {
          numero: '4',
          titre: 'Les contrôles des animaux',
          texte: 'Les contrôles de l’ASP : identification, registre.',
          chemin: 'Cheptel › Contrôles des animaux',
          route: CONTROLES_SANTE,
          ouvrir: ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.ANIMAUX),
        },
        {
          numero: '5',
          titre: 'Le dossier PAC',
          texte: 'Le suivi des mouvements, les bordereaux de perte, le recensement annuel et la déclaration d’estive, prêts à imprimer ou à envoyer.',
          chemin: 'Cheptel › Dossier PAC',
          route: ROUTES.CHEPTEL_DOSSIER_PAC,
        },
        {
          numero: '6',
          titre: 'Les documents de circulation',
          texte: 'Pour chaque achat, envoi à l’abattoir ou vente d’animaux vivants, déposez le document (ou générez le modèle pré-rempli). Il est ensuite à envoyer à la chambre d’agriculture : un rappel de l’accueil reste à valider tant qu’il n’est pas envoyé.',
          chemin: 'Cheptel › Dossier PAC › Documents de circulation',
          route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION,
        },
        {
          numero: '7',
          titre: 'Les documents déjà générés',
          texte: 'Tous les PDF générés (suivi des mouvements, bordereaux, documents de circulation) sont gardés pour les rouvrir.',
          chemin: 'Cheptel › Dossier PAC › Documents déjà générés',
          route: ROUTES.CHEPTEL_BIBLIOTHEQUE,
        },
      ],
    },
    {
      id: 'achat-animaux',
      titre: 'J’achète des animaux vivants',
      resume: 'De la facture du vendeur au document de circulation (feuillet vert).',
      etapes: [
        {
          numero: '1',
          titre: 'La dépense',
          texte: 'Une dépense au nom du vendeur : le contact, la date et le numéro de facture.',
          chemin: 'Comptabilité › Écritures › + › Débit',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '2',
          titre: 'Les animaux achetés',
          texte: 'Catégorie « Animaux vivants (achat) » : saisissez chaque animal (boucle, sexe, naissance). Les fiches se créent d’elles-mêmes dans le cheptel.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '3',
          titre: 'Je vérifie l’atelier',
          texte: 'Vérifiez l’atelier (l’espèce) concerné.',
          chemin: 'Comptabilité › Écritures › +',
          route: ROUTES.COMPTABILITE_NOUVELLE,
        },
        {
          numero: '4',
          titre: 'Les nouvelles fiches',
          texte: 'Les animaux achetés sont dans la liste des animaux vivants, avec leur date d’entrée.',
          chemin: 'Cheptel › Animaux',
          route: ROUTES.CHEPTEL_LISTE,
        },
        {
          numero: '5',
          titre: 'Le document de circulation',
          texte: 'Le document part de chez le vendeur et arrive chez vous : déposez le vôtre, ou générez le modèle pré-rempli. En bas du document, vous notifiez une arrivée.',
          chemin: 'Cheptel › Dossier PAC › Documents de circulation',
          route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION,
        },
        {
          numero: '6',
          titre: 'Les feuillets',
          texte: 'Vous gardez le feuillet bleu et donnez le blanc, le jaune et le rose. Le vert, vous le gardez d’abord, puis vous l’envoyez à la chambre d’agriculture.',
          chemin: 'Cheptel › Dossier PAC › Documents de circulation',
          route: ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION,
        },
        {
          numero: '7',
          titre: 'Je valide l’envoi',
          texte: 'Sur l’accueil, un rappel « Envoyer le document du … (vert) à la chambre d’agriculture » reste à valider tant que le feuillet n’est pas envoyé. La coche le valide ; il passe dans l’historique des rappels.',
          chemin: 'Accueil › Rappels',
          route: '/',
        },
      ],
    },
    {
      id: 'naissance-carnet',
      titre: 'Je déclare une naissance et je tiens le carnet de mise bas',
      resume: 'De la naissance du petit au carnet de mise bas imprimé.',
      etapes: [
        {
          numero: '1',
          titre: 'Je déclare la naissance',
          texte: 'Une mise bas se note portée par portée : la mère, le père, la date, puis chaque petit (avec sa boucle, ou son tiptag s’il est destiné à l’abattoir, ou sans boucle).',
          chemin: 'Cheptel › Naissances › +',
          route: ROUTES.CHEPTEL_NAISSANCE_NOUVELLE,
        },
        {
          numero: '2',
          titre: 'La liste des naissances',
          texte: 'Les mises bas de l’année, portée par portée. Un appui ouvre la fiche d’un petit.',
          chemin: 'Cheptel › Naissances',
          route: ROUTES.CHEPTEL_NAISSANCES,
        },
        {
          numero: '3',
          titre: 'Mère et père sur la fiche',
          texte: 'Dans la fiche d’un animal, l’onglet Reproduction montre l’ascendance (mère et père) et la descendance ; les boutons ♀ et ♂ changent un parent.',
          chemin: 'Cheptel › Animaux › un animal › Reproduction',
          route: ROUTES.CHEPTEL_LISTE,
        },
        {
          numero: '4',
          titre: 'Le carnet de mise bas',
          texte: 'Le carnet s’imprime en livret à plier depuis les naissances ; il se remplit d’après les naissances et les résultats de production de l’année.',
          chemin: 'Cheptel › Naissances › Carnet de mise bas',
          route: ROUTES.CHEPTEL_NAISSANCES,
        },
        {
          numero: '5',
          titre: 'Le carnet en feuilles A4',
          texte: 'Le même carnet existe en feuilles A4 à ranger, dans les PDF de l’application.',
          chemin: 'Organisation › Mes données › PDF',
          route: ROUTES.PDF_DONNEES,
        },
      ],
    },
    {
      id: 'commande-client',
      titre: 'Une commande client avec réservation',
      resume: 'Du contact à la facture, en passant par le bon de commande.',
      etapes: [
        {
          numero: '1',
          titre: 'Le contact et son circuit de vente',
          texte: 'La fiche du contact dit son circuit de vente privilégié (obligatoire) : la commande le reprend.',
          chemin: 'Contacts › un contact',
          route: ROUTES.CONTACTS,
        },
        {
          numero: '2',
          titre: 'Le bon de commande',
          texte: 'Un seul bon de commande reste ouvert par client : les animaux et les produits réservés s’y rangent.',
          chemin: 'Commercial › Commandes à traiter',
          route: ROUTES.COMMERCIAL_COMMANDES,
        },
        {
          numero: '3',
          titre: 'Je réserve un animal',
          texte: 'Depuis l’onglet « À vendre », réservez l’animal pour ce client.',
          chemin: 'Production › Viande › À vendre',
          route: ROUTES.PRODUCTION_VIANDE,
        },
        {
          numero: '4',
          titre: 'Je réserve du fromage ou de la charcuterie',
          texte: 'Un fromage ou une charcuterie se réserve lot par lot depuis son inventaire : les numéros de lot sont repris à la facturation.',
          chemin: 'Production › Fromages ou Boucherie / Charcuterie',
          route: ROUTES.PRODUCTION_FROMAGES,
        },
        {
          numero: '5',
          titre: 'Les commandes en cours',
          texte: 'Tout ce qui est réservé se retrouve dans les commandes à traiter, avec le total du bon.',
          chemin: 'Commercial › Commandes à traiter',
          route: ROUTES.COMMERCIAL_COMMANDES,
        },
        {
          numero: '6',
          titre: 'Je facture',
          texte: 'La commande se facture d’un appui : la facture est préremplie d’après les réservations (vérifiez le prix, la TVA et l’atelier). La commande passe en terminée.',
          chemin: 'Commercial › Commandes à traiter › une commande',
          route: ROUTES.COMMERCIAL_COMMANDES,
        },
        ...etapesDeStock(7),
      ],
    },
    {
      id: 'declaration-rsa',
      titre: 'La déclaration RSA trimestrielle',
      resume: 'Du rappel de l’accueil à la déclaration validée.',
      etapes: [
        {
          numero: '1',
          titre: 'Le rappel',
          texte: 'À la fin de chaque trimestre, un rappel « Déclaration RSA » apparaît sur l’accueil, à faire avant la fin du mois suivant.',
          chemin: 'Accueil › Rappels',
          route: '/',
        },
        {
          numero: '2',
          titre: 'Je vérifie les écritures',
          texte: 'Contrôlez les ventes et factures du trimestre. Une vente sans facture est dans la liste, mais elle n’est pas comptée pour le RSA.',
          chemin: 'Comptabilité › Écritures',
          route: ROUTES.COMPTABILITE_LISTE,
        },
        {
          numero: '3',
          titre: 'Les recettes par mois',
          texte: 'La déclaration affiche le chiffre d’affaires mois par mois, de quoi remplir la déclaration trimestrielle de ressources. L’application ne calcule pas l’abattement : il se vérifie sur le formulaire de la CAF ou de la MSA.',
          chemin: 'Comptabilité › Fiscalité › Déclaration RSA',
          route: ROUTES.FISCALITE_RSA,
        },
        {
          numero: '4',
          titre: 'Je valide le rappel',
          texte: 'Une fois la déclaration faite, la coche du rappel le valide ; il passe dans l’historique, où on peut le remettre à valider.',
          chemin: 'Accueil › Rappels › historique',
          route: ROUTES.RAPPELS_HISTORIQUE,
        },
      ],
    },
    {
      id: 'sauvegarde',
      titre: 'La sauvegarde et la reprise des données',
      resume: 'Protéger ses données, et les retrouver après une réinstallation ou sur un autre appareil.',
      etapes: [
        {
          numero: '1',
          titre: 'Mes données',
          texte: 'Export et PDF, sauvegarde, Google Drive : tout ce qui concerne vos données est réuni ici.',
          chemin: 'Organisation › Mes données',
          route: ROUTES.ORGANISATION_DONNEES,
        },
        {
          numero: '2',
          titre: 'La sauvegarde locale',
          texte: 'Une copie de toutes vos données dans un fichier, à garder ailleurs que sur l’appareil. Un rappel de l’accueil vous prévient quand la dernière sauvegarde est ancienne.',
          chemin: 'Organisation › Mes données › Sauvegarde locale',
          route: ROUTES.SAUVEGARDE_LOCALE,
        },
        {
          numero: '3',
          titre: 'Google Drive',
          texte: 'Les données partent sur Google Drive, un fichier par catégorie ; elles restent d’abord enregistrées sur l’appareil.',
          chemin: 'Organisation › Mes données › Google Drive',
          route: ROUTES.GOOGLE_DRIVE,
        },
        {
          numero: '4',
          titre: 'La reprise sur un autre appareil',
          texte: 'Sur le nouvel appareil (ou après une réinstallation), ouvrez la sauvegarde locale et touchez « Importer » : la question « Restaurer une sauvegarde ? » vous prévient que les données de l’appareil sont remplacées par celles du fichier, et que c’est irréversible.',
          chemin: 'Organisation › Mes données › Sauvegarde locale',
          route: ROUTES.SAUVEGARDE_LOCALE,
        },
      ],
    },
  ];
}

/** Le parcours dont on donne l'identifiant. */
export const parcoursDe = (id: string): Parcours | undefined => parcoursDeCas().find((p) => p.id === id);

/**
 * Les étapes de la visite guidée d'un parcours : chacune s'affiche sur son écran, sans voile (l'écran reste utilisable), avec un bouton
 * « Suivant » qui ouvre l'écran de l'étape d'après.
 */
export function etapesDuParcours(id: string): EtapeVisite[] {
  const parcours = parcoursDe(id);
  if (!parcours) return [];
  return parcours.etapes.map<EtapeVisite>((e) => ({
    id: `parcours.${parcours.id}.${e.numero}`,
    route: e.route,
    ouvrir: e.ouvrir,
    titre: `${e.numero}. ${e.titre}`,
    texte: e.chemin ? `${e.texte}\n\n${e.chemin}` : e.texte,
    sansVoile: true,
  }));
}
