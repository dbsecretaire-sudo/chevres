import type { EtapeVisite } from '@/features/didacticiel/services/visiteGuidee';
import { FAMILLE_CONTROLE } from '@/shared/constants/controles';
import { ROUTES } from '@/shared/constants/routes';
import { LOT_ABATTOIR } from '@/features/didacticiel/services/adresses';

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
  /** L'adresse à ouvrir pour y aller, quand elle diffère de `route` : l'onglet, la catégorie ou le type d'écriture voulus. */
  ouvrir?: string;
  /** L'élément de l'écran que la visite guidée met en surbrillance (voir AncreVisite). */
  ancre?: string;
  /** Vrai : l'étape attend qu'on touche l'élément en surbrillance (ce qu'il ouvre est l'étape d'après). */
  clic?: boolean;
}

/** Les pictogrammes qui résument un parcours d'un coup d'œil (voir SchemaParcours). */
export type Picto =
  | 'animal'
  | 'facture'
  | 'facture-barree'
  | 'argent'
  | 'abattoir'
  | 'lait'
  | 'fromage'
  | 'charcuterie'
  | 'rappel'
  | 'veterinaire'
  | 'traitement'
  | 'delai'
  | 'aliment'
  | 'boucle'
  | 'pac'
  | 'envoi'
  | 'circulation'
  | 'naissance'
  | 'carnet'
  | 'commande'
  | 'declaration'
  | 'valide'
  | 'donnees'
  | 'nuage'
  | 'restaure';

/** Un cas du quotidien suivi pas à pas : on le lit dans le didacticiel, ou on le parcourt en visite guidée. */
export interface Parcours {
  id: string;
  titre: string;
  resume: string;
  /** Le parcours en pictogrammes, de gauche à droite (séparés par des flèches). */
  schema: Picto[];
  etapes: EtapeParcours[];
}

/** Les adresses où mènent les étapes : l'écran voulu, ouvert sur le bon onglet, la bonne catégorie ou le bon type d'écriture. */
const ECRITURE = (type: 'emise' | 'recue', categorie?: string, sansFacture = false, deuxiemeEtape = false, supplement = ''): string =>
  `${ROUTES.COMPTABILITE_NOUVELLE}?type=${type}${categorie ? `&categorie=${categorie}` : ''}${sansFacture ? '&facture=non' : ''}${deuxiemeEtape ? '&etape=vente' : '&etape=contact'}${supplement}`;
/** La viande vendue : son onglet, son sous-onglet (Disponibles, Réservés, Morts, Vivants) et, quand on le demande, le menu d'actions du premier animal. */
const VIANDE = (onglet: 'afacturer' | 'facturee' | 'avendre' | 'vendue', sous?: string, menu = false): string =>
  `${ROUTES.PRODUCTION_VIANDE}?onglet=${onglet}${sous ? `&sous=${sous}` : ''}&menu=${menu ? 'premier' : 'non'}`;
/** La fiche du lot d'abattoir le plus récent, ouverte sur un de ses onglets (facture : écritures, poids ; animaux ; suivi : sanitaire). */
const LOT = (onglet: 'facture' | 'animaux' | 'suivi'): string => `${ROUTES.PRODUCTION}/lot?id=${LOT_ABATTOIR}&onglet=${onglet}`;
const STOCKS = (onglet: string): string => `${ROUTES.COMPTABILITE_STOCKS}?onglet=${onglet}`;

/** Une étape : `adresse` est l'écran à ouvrir ; sa page (sans paramètres) sert à la reconnaître en visite guidée. */
const etape = (numero: string, titre: string, texte: string, chemin?: string, adresse?: string, ancre?: string, clic = false): EtapeParcours => ({
  numero,
  titre,
  texte,
  chemin,
  route: adresse?.split('?')[0],
  ouvrir: adresse?.includes('?') ? adresse : undefined,
  ancre,
  clic: clic || undefined,
});

/** Les étapes de l'inventaire, communes à plusieurs parcours : le stock restant, puis ses mouvements. */
const etapesDeStock = (premier: number, onglet: string, ancreStock: string, ancreHistorique: string): EtapeParcours[] => [
  etape(
    String(premier),
    'Le stock restant',
    'Dans l’inventaire, le stock de ce que vous venez de vendre a baissé : on y lit ce qui reste (la ligne en surbrillance).',
    'Comptabilité › Inventaire › Stocks',
    STOCKS(onglet),
    ancreStock,
  ),
  etape(
    String(premier + 1),
    'Les mouvements de stock',
    'L’historique de l’inventaire garde chaque mouvement : « Détails » déroule les mois, et chaque mois la vente avec sa date et sa quantité.',
    'Comptabilité › Inventaire › Historique',
    ROUTES.stockHistorique(),
    ancreHistorique,
  ),
];

const ATELIER = 'Vérifiez que l’atelier concerné (l’espèce) est le bon.';
const CATEGORIE_DE_RECETTE = 'Vérifiez la catégorie de recette (la liste en surbrillance) : c’est elle, avec le détail de la vente, qui décide de l’atelier où la vente compte dans la rentabilité (cabris, lait, fromage…).';

/**
 * Les parcours de cas du didacticiel : chacun suit un cas de bout en bout (une vente, un traitement…), dans l'ordre où on le fait dans
 * l'application. Chaque étape ouvre l'écran dont elle parle, sur le bon onglet.
 */
export function parcoursDeCas(): Parcours[] {
  return [
    {
      id: 'vente-sans-facture',
      titre: 'Je vends un animal à un particulier sans facture',
      resume: 'Du petit sans boucle à l’écriture de vente, sans facture.',
      schema: ['animal', 'commande', 'facture-barree', 'argent'],
      etapes: [
        etape('1', 'Je déclare une naissance sans boucle', 'Notez la naissance du petit sans lui poser de boucle : un animal sans boucle se vend sans facture.', 'Cheptel › Naissances › +', ROUTES.CHEPTEL_NAISSANCE_NOUVELLE),
        etape('2', 'J’active l’option « Avancé »', 'Dans Production › Viande, cochez « Avancé », sous les onglets : les onglets « À vendre » et « Vendue » apparaissent.', 'Production › Viande', VIANDE('afacturer'), 'viande.avance'),
        etape('3', 'Je récupère l’animal', 'Ouvrez l’onglet « À vendre » (visible une fois « Avancé » coché) : l’animal né sans boucle y est proposé, dans « Disponibles ».', 'Production › Viande › À vendre › Disponibles', VIANDE('avendre', 'disponibles')),
        etape('4', 'Je le réserve sur un bon de commande ou je le facture de suite', 'Touchez un animal : un menu d’actions propose de le réserver pour le client (il rejoint son bon de commande, et la facture se remplit toute seule ensuite) ou de le facturer tout de suite.', 'Production › Viande › À vendre › un animal', VIANDE('avendre', 'disponibles', true)),
        etape('5', 'Réservé : je le facture', 'Les animaux réservés sont rangés par client dans le sous-onglet « Réservés » : touchez-en un, puis « Valider et facturer ».', 'Production › Viande › À vendre › Réservés', VIANDE('avendre', 'reserves')),
        etape('5A', 'Je vois les commandes en cours', 'Les réservations non encore facturées sont dans les commandes à traiter.', 'Commercial › Commandes à traiter', ROUTES.COMMERCIAL_COMMANDES),
        etape('6', 'Je vérifie les informations préremplies', 'Vérifiez que « Sans facture » est bien sélectionné. L’écriture apparaît dans la liste des écritures, mais elle ne sera comptée ni pour les impôts ni pour le RSA.', 'Comptabilité › Écritures › + › Crédit › Viande', ECRITURE('emise', 'viande', true, false, '&detail=jeune')),
        etape('7', 'Cabri mort ou vivant', 'Dans le menu déroulant « Animaux remis », choisissez morts ou vivants selon la demande du client : un cabri vivant a un document de circulation, un cabri mort non.', 'Comptabilité › Écritures › + › Crédit › Viande', ECRITURE('emise', 'viande', true, true, '&detail=jeune'), 'ecriture.etat'),
        etape('8', 'Je vérifie la catégorie de recette', CATEGORIE_DE_RECETTE, 'Comptabilité › Écritures › + › Crédit › Viande', ECRITURE('emise', 'viande', true, true, '&detail=jeune'), 'ecriture.categorie'),
        etape('9', 'Je vois la liste des ventes sans facture', 'L’onglet « Vendue » de la viande liste les animaux vendus sans facture : ici, ceux remis morts.', 'Production › Viande › Vendue › Morts', VIANDE('vendue', 'morts')),
        etape('9A', 'Où sont les animaux vendus vivants', 'Le sous-onglet « Vivants » liste ceux qui sont partis vivants chez le client.', 'Production › Viande › Vendue › Vivants', VIANDE('vendue', 'vivants')),
        ...etapesDeStock(10, 'animaux', 'stock.animaux', 'historique.viande'),
      ],
    },
    {
      id: 'vente-abattoir',
      titre: 'Je vends un animal passé à l’abattoir',
      resume: 'Du lot d’abattoir et de son document de circulation à la facture du client.',
      schema: ['animal', 'facture', 'abattoir', 'argent'],
      etapes: [
        etape('1', 'Je crée le lot d’abattoir', 'Avant toute écriture : la date du départ, puis « Choisir les animaux » ouvre la liste (Tiptag ou Boucles). Déposez ensuite le document de circulation (un seul par lot, obligatoire) et indiquez si les animaux sont morts (à l’abattoir) ou vivants (vendus). Morts, ils passent à « abattoir » à la date du départ.', 'Abattoir › Nouveau lot d’abattoir', ROUTES.lotAbattoirNouveau(), 'ecriture.animauxEnvoyes'),
        etape('1A', 'Je crée la facture de l’abattoir', 'Émise quelques jours après l’abattage : une dépense au nom de l’abattoir, rattachée au lot (sans lot, pas de facture). C’est elle qui donne les frais d’abattoir refacturés au client.', 'Comptabilité › Écritures › + › Débit › Animaux vivants (sortie)', ECRITURE('recue', undefined, false, true, '&depense=animaux_vivants_vente')),
        etape('2', 'Je récupère le lot', 'Dans l’onglet « À facturer », touchez le lot (le jour d’abattage) pour ouvrir sa fiche. Vérifiez ensuite qu’aucun animal n’est mort ni saisi par l’abattoir.', 'Production › Viande › À facturer', VIANDE('afacturer'), 'viande.premierLot', true),
        etape('3', 'Je vérifie le poids total', 'Dans l’onglet Écritures du lot, contrôlez le poids total noté à l’abattoir : il remplit le poids de la facture au client.', 'Production › Viande › À facturer › lot › Écritures', LOT('facture'), 'lot.poids'),
        etape('3A', 'Animaux morts ou saisis', 'Dans le suivi sanitaire du lot, déclarez les bêtes saisies par l’abattoir ou mortes pendant le transport : elles ne se facturent pas au client et ne comptent pas parmi les animaux abattus.', 'Production › Viande › lot › Suivi sanitaire', LOT('suivi'), 'lot.inconsommables'),
        etape('3B', 'Comment elles s’affichent', 'Dans l’onglet Animaux, ces bêtes sont en rouge dans la liste des animaux du lot.', 'Production › Viande › lot › Animaux', LOT('animaux'), 'lot.animaux'),
        etape('3C', 'Le document de circulation du lot', 'Les animaux sont partis vivants à l’abattoir : le document du lot (un seul) se dépose dès la création du lot, avant toute écriture. Ce bouton ouvre un menu pour le remplacer, l’ouvrir, le retirer, ou générer le modèle pré-rempli. En bas du document, vous notifiez un départ.', 'Production › Viande › lot › Animaux', LOT('animaux'), 'lot.circulation'),
        etape('3D', 'J’envoie le feuillet à la chambre d’agriculture', 'Vous gardez le blanc et le jaune, vous donnez le vert et le bleu à l’abattoir, et vous gardez le rose avant de l’envoyer à la chambre d’agriculture : sur l’accueil, le rappel « Envoyer le document du … (rose) » reste à valider tant qu’il n’est pas envoyé.', 'Cheptel › Dossier PAC › Documents de circulation', ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION),
        etape('4', 'Je facture ce lot à un client', 'Le bouton « Facturer la viande de ce lot au client » (onglet Écritures) ouvre la facture, déjà préremplie.', 'Production › Viande › lot › Écritures', LOT('facture'), 'lot.facturer'),
        etape('5', 'Je termine la facture', 'Complétez les informations demandées (contact, date, TVA, paiement) puis enregistrez.', 'Comptabilité › Écritures › + › Crédit › Viande', ECRITURE('emise', 'viande', false, true)),
        etape('6', 'Je vérifie la catégorie de recette', CATEGORIE_DE_RECETTE, 'Comptabilité › Écritures › + › Crédit › Viande', ECRITURE('emise', 'viande', false, true), 'ecriture.categorie'),
        etape('7', 'La liste des factures', 'Les ventes de viande facturées sont dans l’onglet « Facturée ».', 'Production › Viande › Facturée', VIANDE('facturee')),
        ...etapesDeStock(8, 'viande', 'stock.viande', 'historique.viande'),
      ],
    },
    {
      id: 'vente-lait',
      titre: 'Je vends le lait',
      resume: 'De la recette au récolteur jusqu’à la rentabilité de l’atelier.',
      schema: ['lait', 'facture', 'argent'],
      etapes: [
        etape('1', 'Nouvelle recette', 'Dans les écritures, le bouton « + » puis « Crédit » ouvre une nouvelle recette.', 'Comptabilité › Écritures › + › Crédit', ECRITURE('emise', 'lait')),
        etape('2', 'Je choisis un récolteur', 'Le contact est le récolteur qui collecte votre lait.', 'Comptabilité › Écritures › + › Crédit', ECRITURE('emise', 'lait')),
        etape('3', 'Je choisis la catégorie Lait', 'La catégorie de recette « Lait » demande le litrage vendu (2e étape de la saisie, bouton « Suivant »).', 'Comptabilité › Écritures › + › Crédit', ECRITURE('emise', 'lait', false, true)),
        etape('4', 'J’indique le litrage vendu', 'Le nombre de litres livrés au récolteur.', 'Comptabilité › Écritures › + › Crédit', ECRITURE('emise', 'lait', false, true)),
        etape('5', 'J’indique le montant payé par le récolteur', 'Le récolteur fixe son prix : saisissez le montant qu’il vous paie. La case « Prix du produit personnalisé » se règle par catégorie de contact, dans Organisation › Contacts : elle n’est utile qu’aux contacts qui en ont besoin.', 'Comptabilité › Écritures › + › Crédit', ECRITURE('emise', 'lait', false, true)),
        etape('5A', 'Je vérifie la catégorie de recette', CATEGORIE_DE_RECETTE, 'Comptabilité › Écritures › + › Crédit', ECRITURE('emise', 'lait', false, true), 'ecriture.categorie'),
        etape('6', 'Je complète les analyses obligatoires', 'Pour chaque mois, ajoutez les analyses du lait.', 'Production › Qualité du lait › Analyses', ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.LAITIER, FAMILLE_CONTROLE.ANALYSE)),
        etape('7', 'Je constate l’évolution de la qualité', 'L’onglet « Résumé » montre l’évolution de la qualité du lait.', 'Production › Qualité du lait › Résumé', ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.LAITIER, FAMILLE_CONTROLE.RESUME)),
        etape('8', 'La production du lait', 'Précisez la date de début et de fin de traite et le nombre de chèvres à la traite : on obtient la quantité de lait par chèvre et par traite.', 'Production › Production du lait', ROUTES.PRODUCTION_LAIT),
        etape('9', 'Le chiffre d’affaires', 'Une vision globale du chiffre d’affaires, par produit, par contact et par mois.', 'Commercial › Chiffre d’affaires', ROUTES.COMMERCIAL_VENTES),
        etape('10', 'La rentabilité par atelier', 'Ce que rapporte et ce que coûte chaque atelier.', 'Comptabilité › Rentabilité', ROUTES.RENTABILITE),
        etape('11', 'Le stock et ses mouvements', 'Le stock de lait se lit dans l’inventaire (Stocks), et ses mouvements dans l’historique de l’inventaire.', 'Comptabilité › Inventaire › Stocks + Historique', STOCKS('lait'), 'stock.lait'),
      ],
    },
    {
      id: 'vente-fromage',
      titre: 'Je vends du fromage',
      resume: 'La vente d’un lot de fromage, et son rappel si un contrôle n’est pas bon.',
      schema: ['fromage', 'commande', 'facture', 'argent', 'rappel'],
      etapes: [
        etape('1', 'Le lot de fromage', 'Chaque fabrication est un lot numéroté : c’est lui qu’on vend et qu’on suit.', 'Production › Fromages', ROUTES.PRODUCTION_FROMAGES),
        etape('2', 'Le plus simple : je réserve sur un bon de commande', 'Dans le bon de commande du client, ajoutez une ligne de fromage et choisissez ses lots : ils sont réservés, et la facture se remplit toute seule d’après la réservation (c’est le plus simple pour facturer ensuite).', 'Commercial › Commandes à traiter', ROUTES.COMMERCIAL_COMMANDE),
        etape('3', 'Sans bon de commande : je choisis les fromages dans la facture', 'Sans réservation, crédit, catégorie « Fromages » : choisissez le type de fromage et les lots vendus dans la facture (leurs numéros sont repris pour le suivi).', 'Comptabilité › Écritures › + › Crédit › Fromages', ECRITURE('emise', 'fromage', false, true)),
        etape('4', 'Je vérifie la catégorie de recette', CATEGORIE_DE_RECETTE, 'Comptabilité › Écritures › + › Crédit › Fromages', ECRITURE('emise', 'fromage', false, true), 'ecriture.categorie'),
        ...etapesDeStock(5, 'fromages', 'stock.fromages', 'historique.fromage'),
        etape('7', 'Le rappel de lots', 'Si le contrôle d’un lot vendu n’est pas bon, le lot est à rappeler : il apparaît dans les rappels de lots (et sur l’accueil) jusqu’à ce que le rappel soit validé.', 'Production › Rappels de lots', ROUTES.PRODUCTION_RAPPELS_LOTS),
      ],
    },
    {
      id: 'vente-charcuterie',
      titre: 'Je vends de la boucherie ou de la charcuterie',
      resume: 'La vente d’un lot de charcuterie ou de morceaux, et son rappel.',
      schema: ['charcuterie', 'commande', 'facture', 'argent', 'rappel'],
      etapes: [
        etape('1', 'Le lot de charcuterie', 'Chaque fabrication est un lot numéroté : c’est lui qu’on vend et qu’on suit.', 'Production › Boucherie / Charcuterie', ROUTES.PRODUCTION_CHARCUTERIE),
        etape('2', 'Le plus simple : je réserve sur un bon de commande', 'Dans le bon de commande du client, ajoutez une ligne de charcuterie et choisissez ses lots : ils sont réservés, et la facture se remplit toute seule d’après la réservation (c’est le plus simple pour facturer ensuite).', 'Commercial › Commandes à traiter', ROUTES.COMMERCIAL_COMMANDE),
        etape('3', 'Sans bon de commande : je choisis les produits dans la facture', 'Sans réservation, crédit, catégorie « Boucherie / charcuterie » : choisissez le produit et les lots vendus dans la facture.', 'Comptabilité › Écritures › + › Crédit › Boucherie / charcuterie', ECRITURE('emise', 'boucherie_charcuterie', false, true)),
        etape('4', 'Je vérifie la catégorie de recette', CATEGORIE_DE_RECETTE, 'Comptabilité › Écritures › + › Crédit › Boucherie / charcuterie', ECRITURE('emise', 'boucherie_charcuterie', false, true), 'ecriture.categorie'),
        ...etapesDeStock(5, 'viande', 'stock.viande', 'historique.viande'),
        etape('7', 'Le rappel de lots', 'Si le contrôle d’un lot vendu n’est pas bon, le lot est à rappeler : il apparaît dans les rappels de lots (et sur l’accueil) jusqu’à ce que le rappel soit validé.', 'Production › Rappels de lots', ROUTES.PRODUCTION_RAPPELS_LOTS),
      ],
    },
    {
      id: 'veterinaire-traitement',
      titre: 'Visite du vétérinaire et traitement',
      resume: 'De la dépense du vétérinaire au délai d’attente des animaux traités.',
      schema: ['veterinaire', 'facture', 'traitement', 'delai'],
      etapes: [
        etape('1', 'La dépense du vétérinaire', 'Saisissez la facture du vétérinaire : une dépense, catégorie vétérinaire.', 'Comptabilité › Écritures › + › Débit', ECRITURE('recue')),
        etape('2', 'Je note le motif de la visite', 'Indiquez le motif, puis « Ajouter aux visites vétérinaires » : la visite entre dans le carnet sanitaire (« Bilan sanitaire annuel » pour le bilan de l’année).', 'Comptabilité › Écritures › + › Débit', ECRITURE('recue', undefined, false, true)),
        etape('3', 'Je note le traitement', 'Le bouton « + » ajoute un traitement : le médicament, les animaux (vide : tout le troupeau) et les délais d’attente du lait et de la viande, ceux de l’ordonnance ou de la notice.', 'Cheptel › Santé › Traitements › +', ROUTES.CHEPTEL_TRAITEMENT_NOUVEAU),
        etape('4', 'Je suis les délais d’attente', 'La fin du délai d’attente se calcule toute seule : les animaux en délai sont listés, et signalés si vous les vendez avant la fin (document de circulation compris).', 'Cheptel › Santé › Traitements', ROUTES.CHEPTEL_TRAITEMENTS),
      ],
    },
    {
      id: 'aliments',
      titre: 'Je remplis les factures d’aliments',
      resume: 'De la facture d’aliments au prix par animal.',
      schema: ['aliment', 'facture', 'animal', 'argent'],
      etapes: [
        etape('1', 'La facture d’aliments', 'Une dépense, catégorie alimentation : le fournisseur, la date et le numéro de la facture.', 'Comptabilité › Écritures › + › Débit', ECRITURE('recue')),
        etape('2', 'Le détail par aliment', 'Une ligne par aliment : choisissez l’aliment, indiquez la quantité et le montant. C’est ce détail qui permet de calculer le prix par animal.', 'Comptabilité › Écritures › + › Débit', ECRITURE('recue', undefined, false, true)),
        etape('3', 'Je vérifie l’atelier', 'L’atelier (l’espèce) est facultatif : il sert à la marge par atelier. L’aliment d’un autre cheptel reste une charge commune.', 'Comptabilité › Écritures › + › Débit', ECRITURE('recue', undefined, false, true), 'ecriture.atelier'),
        etape('4', 'Le stock d’aliments', 'Les aliments achetés entrent dans l’inventaire, et se consomment au fil de la distribution.', 'Comptabilité › Inventaire › Stocks › Aliments', STOCKS('aliments'), 'stock.aliments'),
        etape('5', 'Ce que mangent les animaux et ce que ça coûte', 'La distribution d’aliments et son coût, avec des repères d’alimentation par espèce (des ordres de grandeur, jamais une ration).', 'Cheptel › Santé › Alimentation', ROUTES.SANTE_ALIMENTATION),
        etape('6', 'Le prix par animal', 'Le coût d’aliment par animal et par jour se lit dans les chiffres de l’année, sur l’accueil, et dans le détail du tableau de bord du cheptel.', 'Cheptel › Tableau de bord', ROUTES.CHEPTEL_TABLEAU_DE_BORD),
        etape('7', 'La rentabilité', 'La rentabilité compare ce que coûte l’aliment à ce que rapporte l’atelier (par exemple, le coût d’aliment par litre de lait).', 'Comptabilité › Rentabilité', ROUTES.RENTABILITE),
      ],
    },
    {
      id: 'boucles-pac',
      titre: 'Boucles et dossier PAC',
      resume: 'Des boucles achetées au dossier PAC et aux documents de circulation.',
      schema: ['boucle', 'animal', 'pac', 'envoi'],
      etapes: [
        etape('1', 'J’achète des boucles', 'La facture d’achat des boucles (ou des tiptag) les ajoute à l’inventaire.', 'Comptabilité › Écritures › + › Débit', ECRITURE('recue')),
        etape('2', 'L’inventaire des boucles', 'Les boucles, boucles rouges et tiptag, à poser ou posés. Un tiptag est destiné à l’abattoir : c’est toujours un cabri.', 'Cheptel › Boucles', ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.BOUCLES)),
        etape('3', 'Je pose une boucle', 'La boucle se pose à la naissance du petit, ou depuis la fiche de l’animal (bouclage) : elle est alors marquée posée.', 'Cheptel › Naissances › + ou Cheptel › Animaux › un animal', ROUTES.CHEPTEL_NAISSANCE_NOUVELLE),
        etape('4', 'Les contrôles des animaux', 'Les contrôles de l’ASP : identification, registre.', 'Cheptel › Contrôles des animaux', ROUTES.santeControlesOnglet(FAMILLE_CONTROLE.ANIMAUX, FAMILLE_CONTROLE.ANIMAUX)),
        etape('5', 'Le dossier PAC', 'Le suivi des mouvements, les bordereaux de perte, le recensement annuel et la déclaration d’estive, prêts à imprimer ou à envoyer.', 'Cheptel › Dossier PAC', ROUTES.CHEPTEL_DOSSIER_PAC),
        etape('6', 'Les documents de circulation', 'Un document par lot d’animaux partis vivants (à l’abattoir ou vendus), et par achat d’animaux : déposez-le (ou générez le modèle pré-rempli). Touchez une ligne pour voir le document et les factures concernées. Il est ensuite à envoyer à la chambre d’agriculture : un rappel de l’accueil reste à valider tant qu’il n’est pas envoyé.', 'Cheptel › Dossier PAC › Documents de circulation', ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION),
        etape('7', 'Les documents déjà générés', 'Tous les PDF générés (suivi des mouvements, bordereaux, documents de circulation) sont gardés pour les rouvrir.', 'Cheptel › Dossier PAC › Documents déjà générés', ROUTES.CHEPTEL_BIBLIOTHEQUE),
      ],
    },
    {
      id: 'achat-animaux',
      titre: 'J’achète des animaux vivants',
      resume: 'De la facture du vendeur au document de circulation (feuillet vert).',
      schema: ['argent', 'animal', 'circulation', 'rappel'],
      etapes: [
        etape('1', 'La dépense', 'Une dépense au nom du vendeur : le contact, la date et le numéro de facture.', 'Comptabilité › Écritures › + › Débit', ECRITURE('recue')),
        etape('2', 'Les animaux achetés', 'Catégorie « Animaux vivants (achat) » : saisissez chaque animal (boucle, sexe, naissance). Les fiches se créent d’elles-mêmes dans le cheptel.', 'Comptabilité › Écritures › + › Débit', ECRITURE('recue', undefined, false, true)),
        etape('3', 'Je vérifie l’atelier', ATELIER, 'Comptabilité › Écritures › + › Débit', ECRITURE('recue', undefined, false, true), 'ecriture.atelier'),
        etape('4', 'Les nouvelles fiches', 'Les animaux achetés sont dans la liste des animaux vivants, avec leur date d’entrée.', 'Cheptel › Animaux', ROUTES.CHEPTEL_LISTE),
        etape('5', 'Le document de circulation', 'Le document part de chez le vendeur et arrive chez vous : déposez le vôtre, ou générez le modèle pré-rempli. En bas du document, vous notifiez une arrivée.', 'Cheptel › Dossier PAC › Documents de circulation', ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION),
        etape('6', 'Les feuillets', 'Vous gardez le feuillet bleu et donnez le blanc, le jaune et le rose. Le vert, vous le gardez d’abord, puis vous l’envoyez à la chambre d’agriculture.', 'Cheptel › Dossier PAC › Documents de circulation', ROUTES.CHEPTEL_DOCUMENTS_CIRCULATION),
        etape('7', 'Je valide l’envoi', 'Sur l’accueil, un rappel « Envoyer le document du … (vert) à la chambre d’agriculture » reste à valider tant que le feuillet n’est pas envoyé. La coche le valide ; il passe dans l’historique des rappels.', 'Accueil › Rappels', '/'),
      ],
    },
    {
      id: 'naissance-carnet',
      titre: 'Je déclare une naissance et je tiens le carnet de mise bas',
      resume: 'De la naissance du petit au carnet de mise bas imprimé.',
      schema: ['naissance', 'carnet'],
      etapes: [
        etape('1', 'Je déclare la naissance', 'Une mise bas se note portée par portée : la mère, le père, la date, puis chaque petit (avec sa boucle, ou son tiptag s’il est destiné à l’abattoir, ou sans boucle).', 'Cheptel › Naissances › +', ROUTES.CHEPTEL_NAISSANCE_NOUVELLE),
        etape('2', 'La liste des naissances', 'Les mises bas de l’année, portée par portée. Un appui ouvre la fiche d’un petit.', 'Cheptel › Naissances', ROUTES.CHEPTEL_NAISSANCES),
        etape('3', 'Mère et père sur la fiche', 'Dans la fiche d’un animal, l’onglet Reproduction montre l’ascendance (mère et père) et la descendance ; les boutons ♀ et ♂ changent un parent.', 'Cheptel › Animaux › un animal › Reproduction', ROUTES.CHEPTEL_LISTE),
        etape('4', 'Le carnet de mise bas', 'Le carnet s’imprime en livret à plier depuis les naissances ; il se remplit d’après les naissances et les résultats de production de l’année.', 'Cheptel › Naissances › Carnet de mise bas', ROUTES.CHEPTEL_NAISSANCES),
        etape('5', 'Le carnet en feuilles A4', 'Le même carnet existe en feuilles A4 à ranger, dans les PDF de l’application.', 'Organisation › Mes données › PDF', ROUTES.PDF_DONNEES),
      ],
    },
    {
      id: 'commande-client',
      titre: 'Une commande client avec réservation',
      resume: 'Du contact à la facture, en passant par le bon de commande.',
      schema: ['commande', 'animal', 'facture', 'argent'],
      etapes: [
        etape('1', 'Le contact et son circuit de vente', 'La fiche du contact dit son circuit de vente privilégié (obligatoire) : la commande le reprend.', 'Contacts › un contact', ROUTES.CONTACTS),
        etape('2', 'Le bon de commande', 'Un seul bon de commande reste ouvert par client : les animaux et les produits réservés s’y rangent.', 'Commercial › Commandes à traiter', ROUTES.COMMERCIAL_COMMANDES),
        etape('3', 'Je réserve un animal', 'Depuis l’onglet « À vendre », réservez l’animal pour ce client.', 'Production › Viande › À vendre', VIANDE('avendre')),
        etape('4', 'Je réserve du fromage ou de la charcuterie', 'Dans le bon de commande, ajoutez une ligne de fromage ou de charcuterie et choisissez ses lots : ils sont réservés, et leurs numéros sont repris à la facturation.', 'Commercial › Commandes à traiter › une commande', ROUTES.COMMERCIAL_COMMANDE),
        etape('5', 'Les commandes en cours', 'Tout ce qui est réservé se retrouve dans les commandes à traiter, avec le total du bon.', 'Commercial › Commandes à traiter', ROUTES.COMMERCIAL_COMMANDES),
        etape('6', 'Je facture', 'La commande se facture d’un appui : la facture est préremplie d’après les réservations (vérifiez le prix, la TVA et l’atelier). La commande passe en terminée.', 'Commercial › Commandes à traiter › une commande', ROUTES.COMMERCIAL_COMMANDES),
        ...etapesDeStock(7, 'animaux', 'stock.animaux', 'historique.viande'),
      ],
    },
    {
      id: 'declaration-rsa',
      titre: 'La déclaration RSA trimestrielle',
      resume: 'Du rappel de l’accueil à la déclaration validée.',
      schema: ['rappel', 'facture', 'declaration', 'valide'],
      etapes: [
        etape('1', 'Le rappel', 'À la fin de chaque trimestre, un rappel « Déclaration RSA » apparaît sur l’accueil, à faire avant la fin du mois suivant.', 'Accueil › Rappels', '/'),
        etape('2', 'Je vérifie les écritures', 'Contrôlez les ventes et factures du trimestre. Une vente sans facture est dans la liste, mais elle n’est pas comptée pour le RSA.', 'Comptabilité › Écritures', ROUTES.COMPTABILITE_LISTE),
        etape('3', 'Les recettes par mois', 'La déclaration affiche le chiffre d’affaires mois par mois, de quoi remplir la déclaration trimestrielle de ressources. L’application ne calcule pas l’abattement : il se vérifie sur le formulaire de la CAF ou de la MSA.', 'Comptabilité › Fiscalité › Déclaration RSA', ROUTES.FISCALITE_RSA),
        etape('4', 'Je valide le rappel', 'Une fois la déclaration faite, la coche du rappel le valide ; il passe dans l’historique, où on peut le remettre à valider.', 'Accueil › Rappels › historique', ROUTES.RAPPELS_HISTORIQUE),
      ],
    },
    {
      id: 'sauvegarde',
      titre: 'La sauvegarde et la reprise des données',
      resume: 'Protéger ses données, et les retrouver après une réinstallation ou sur un autre appareil.',
      schema: ['donnees', 'nuage', 'restaure'],
      etapes: [
        etape('1', 'Mes données', 'Export et PDF, sauvegarde, Google Drive : tout ce qui concerne vos données est réuni ici.', 'Organisation › Mes données', ROUTES.ORGANISATION_DONNEES),
        etape('2', 'La sauvegarde locale', 'Une copie de toutes vos données dans un fichier, à garder ailleurs que sur l’appareil. Un rappel de l’accueil vous prévient quand la dernière sauvegarde est ancienne.', 'Organisation › Mes données › Sauvegarde locale', ROUTES.SAUVEGARDE_LOCALE),
        etape('3', 'Google Drive', 'Les données partent sur Google Drive, un fichier par catégorie ; elles restent d’abord enregistrées sur l’appareil.', 'Organisation › Mes données › Google Drive', ROUTES.GOOGLE_DRIVE),
        etape('4', 'La reprise sur un autre appareil', 'Sur le nouvel appareil (ou après une réinstallation), ouvrez la sauvegarde locale et touchez « Importer » : la question « Restaurer une sauvegarde ? » vous prévient que les données de l’appareil sont remplacées par celles du fichier, et que c’est irréversible.', 'Organisation › Mes données › Sauvegarde locale', ROUTES.SAUVEGARDE_LOCALE),
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
    ancre: e.ancre,
    clic: e.clic,
    titre: `${e.numero}. ${e.titre}`,
    texte: e.chemin ? `${e.texte}\n\n${e.chemin}` : e.texte,
    sansVoile: true,
  }));
}
