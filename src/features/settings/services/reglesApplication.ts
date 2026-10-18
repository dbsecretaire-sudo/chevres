import { ageSevrage, agePetitMax, nbPetitsMax } from '@/shared/constants/cheptel';
import type { Duree } from '@/shared/utils/age';
import { TAUX_TVA_ACHAT_DEFAUT, TAUX_TVA_ACHAT_ENTREPRISE_DEFAUT, TAUX_TVA_CARBURANT } from '@/shared/constants/comptabilite';
import { DELAI_ENREGISTREMENT_AUTO } from '@/shared/constants/temps';

/** Une règle que l'application applique : un titre court et ce qu'elle fait, en une ou deux phrases. */
export interface RegleApplication {
  /** Son identifiant stable : de quoi dire plus tard « celle-ci s'affiche » ou « celle-ci se personnalise ». */
  id: string;
  titre: string;
  texte: string;
}

/** Les règles d'un même domaine (le cheptel, les ventes, la comptabilité…). */
export interface GroupeDeRegles {
  id: string;
  titre: string;
  regles: RegleApplication[];
}

/** Une durée en toutes lettres : « 6 mois », « 28 jours ». */
const duree = (d: Duree): string => `${d.valeur} ${d.unite}`;

/** Un pourcentage en français : « 2,1 % ». */
const pourcent = (n: number): string => `${String(n).replace('.', ',')} %`;

/**
 * Toutes les règles que l'application applique aujourd'hui, par domaine. C'est un état des lieux : aucune ne se règle encore ici. Les valeurs
 * qui viennent de l'application (les âges de l'espèce, les taux de TVA) sont lues à l'affichage, pas recopiées.
 */
export function reglesDeLApplication(): GroupeDeRegles[] {
  return [
    {
      id: 'animaux',
      titre: 'Animaux',
      regles: [
        {
          id: 'animaux.petit',
          titre: 'Petit ou adulte',
          texte: `Un animal de moins de ${duree(agePetitMax())} est un petit (cabri, chevreau…) ; au-delà, c’est un adulte. Cet âge dépend de l’espèce choisie.`,
        },
        {
          id: 'animaux.sevrage',
          titre: 'Sevrage',
          texte: `À partir de ${duree(ageSevrage())}, un petit est sevré : il mange comme un adulte et compte dans l’effectif.`,
        },
        {
          id: 'animaux.portee',
          titre: 'Taille d’une mise bas',
          texte: `Une mise bas compte au plus ${nbPetitsMax()} petits.`,
        },
        {
          id: 'animaux.boucle',
          titre: 'Numéro de boucle',
          texte: 'Facultatif pour un petit, obligatoire une fois l’âge de petit dépassé. Il est unique dans l’espèce.',
        },
        {
          id: 'animaux.tiptag',
          titre: 'Tiptag',
          texte: 'Tout animal à tiptag est destiné à l’abattoir : il n’entre pas dans un classement de renouvellement et il est proposé aux lots d’abattoir.',
        },
        {
          id: 'animaux.sorties',
          titre: 'Sorties du cheptel',
          texte: 'Un animal vendu, abattu, mort ou auto-consommé garde sa fiche avec son statut et sa date de sortie ; il quitte les animaux vivants.',
        },
        {
          id: 'animaux.parents',
          titre: 'Mère et père possibles',
          texte: 'La mère se choisit parmi les femelles, le père parmi les mâles : seuls sont proposés les animaux présents sur l’exploitation à la naissance du petit (même vendus ou morts depuis) et qui avaient l’âge de petit révolu.',
        },
      ],
    },
    {
      id: 'naissances',
      titre: 'Naissances et carnet de mise bas',
      regles: [
        {
          id: 'naissances.sansBoucle',
          titre: 'Petits sans boucle',
          texte: 'Les petits sans boucle (mort-nés compris, auto-consommés exceptés) ne figurent ni dans le carnet ni dans le recensement. Une mise bas sans aucun petit compté disparaît du carnet.',
        },
        {
          id: 'naissances.morts',
          titre: 'Morts des petits',
          texte: 'Un petit mort avant 7 jours est mort dans sa première semaine ; entre 7 et 90 jours, avant le sevrage ; après, avant son départ. Un petit mort l’année suivante est compté vivant au 31 décembre de l’année de sa naissance.',
        },
        {
          id: 'naissances.age',
          titre: 'Âge au départ ou à la mort',
          texte: 'Il s’écrit en jours jusqu’à 60 jours, puis en mois.',
        },
        {
          id: 'naissances.observations',
          titre: 'Observations du carnet',
          texte: 'R : renouvellement ; A : abattoir (un petit à tiptag) ; V : vendu ; C : consommé ; MN : mort-né.',
        },
        {
          id: 'naissances.taux',
          titre: 'Taux de production',
          texte: 'Fertilité : chèvres ayant mis bas ÷ chèvres mises à la reproduction. Prolificité : petits nés ÷ chèvres ayant mis bas. Productivité : petits vendus ou gardés reproducteurs ÷ chèvres mises à la reproduction. Mortalité : petits morts ÷ petits nés.',
        },
        {
          id: 'naissances.reproduction',
          titre: 'Chèvres mises à la reproduction',
          texte: 'Leur nombre est celui des animaux du lot « Mises à la reproduction » de l’année. Sans lot, il est calculé d’après le cheptel.',
        },
        {
          id: 'naissances.pages',
          titre: 'Pages du carnet imprimé',
          texte: 'Le carnet A4 a des lignes de hauteur fixe (26 par page, de quoi écrire deux petits), des pages complétées de lignes vides pour écrire à la main, et une seule page vide avant les naissances de l’année. Le livret compte 16 lignes par double page.',
        },
      ],
    },
    {
      id: 'lots',
      titre: 'Lots d’animaux',
      regles: [
        {
          id: 'lots.reproduction',
          titre: 'Mises à la reproduction',
          texte: 'Un lot est créé chaque année, de la première naissance à l’année en cours : les femelles qui ont mis bas, et toutes celles à leur majorité sexuelle et vivantes à la date d’une mise bas. Sans mise bas cette année-là, les femelles présentes au 1er janvier. Son nom suit son année et il ne se supprime pas.',
        },
        {
          id: 'lots.renouvellement',
          titre: 'Renouvellement',
          texte: 'Un lot par année. Un animal ne peut figurer que dans un seul classement de renouvellement ; les animaux à tiptag n’y entrent pas.',
        },
        {
          id: 'lots.abattoir',
          titre: 'Lots d’abattoir',
          texte: 'Un animal ajouté à un lot d’abattoir passe en statut « abattoir » à la date d’abattage ; on n’en retire pas. Quand une facture du client vend ses animaux, le lot est figé : il faut supprimer la facture pour le modifier.',
        },
        {
          id: 'lots.veterinaire',
          titre: 'Lots vétérinaires',
          texte: 'Un lot est la fiche d’une visite : son nom suit la date de la visite.',
        },
        {
          id: 'lots.enregistrement',
          titre: 'Enregistrement',
          texte: 'Un lot déjà créé s’enregistre tout seul à chaque modification ; seul un nouveau lot a son bouton Enregistrer.',
        },
      ],
    },
    {
      id: 'ventes',
      titre: 'Ventes, réservations et commandes',
      regles: [
        {
          id: 'ventes.circuit',
          titre: 'Circuit de vente',
          texte: 'Pour une vente de production, le circuit de vente est obligatoire : on ne passe pas à la suite sans l’avoir choisi.',
        },
        {
          id: 'ventes.offert',
          titre: 'Produit offert',
          texte: 'Quand « offert » est coché, le total TTC est de 0 €.',
        },
        {
          id: 'ventes.sansFacture',
          titre: 'Sans facture',
          texte: 'Seul un client particulier peut recevoir une réservation ou une vente sans facture.',
        },
        {
          id: 'ventes.etat',
          titre: 'Animaux vivants ou morts',
          texte: 'Un client de catégorie Abattoir reçoit toujours les animaux vivants. Pour des adultes, la ligne choisie décide (« sur pied » : morts ; « vivant » : vivants). Pour des cabris : toujours morts avec facture, au choix sans facture (morts par défaut).',
        },
        {
          id: 'ventes.datePied',
          titre: 'Cabri ou chèvre sur pied',
          texte: 'Le détail de la vente (cabri ou chèvre sur pied) se choisit d’après l’âge de l’animal à la date de la facture.',
        },
        {
          id: 'ventes.sortie',
          titre: 'Sortie des animaux vendus',
          texte: 'Un animal vendu passe en « vendue » à la date de la vente. Pour de la viande déclarée sans état précisé, il passe en « abattoir » à la date d’abattoir.',
        },
        {
          id: 'ventes.supprimer',
          titre: 'Supprimer ou modifier une vente',
          texte: 'Supprimer ou modifier une vente ou une réservation remet les animaux concernés à vendre.',
        },
        {
          id: 'ventes.reserver',
          titre: 'Réservation abandonnée',
          texte: 'Fermer la fenêtre d’une écriture sans la terminer ne réserve rien : l’animal reste à vendre.',
        },
        {
          id: 'ventes.bon',
          titre: 'Bon de commande',
          texte: 'Un seul bon de commande reste ouvert par client. Les animaux et produits réservés s’y rangent ; facturer tout le bon le passe en terminé.',
        },
        {
          id: 'ventes.lots',
          titre: 'Fromage et charcuterie',
          texte: 'Un fromage ou une charcuterie qui a des lots en stock se vend lot par lot : les numéros de lot sont désignés dans la commande, puis repris à la facturation pour le suivi.',
        },
        {
          id: 'ventes.poids',
          titre: 'Poids',
          texte: 'Un animal sur pied, vivant ou un petit ne se vend pas sans dire lesquels ni leur poids.',
        },
      ],
    },
    {
      id: 'circulation',
      titre: 'Document de circulation',
      regles: [
        {
          id: 'circulation.vente',
          titre: 'Vente d’animaux vivants',
          texte: 'Un document de circulation (modèle pré-rempli) est proposé quand la vente est déclarée et que des animaux voyagent vivants : au particulier, au professionnel ou à l’abattoir. Des animaux déjà morts, ou une vente sans facture : aucun.',
        },
        {
          id: 'circulation.achat',
          titre: 'Achat d’animaux vivants',
          texte: 'Pour des animaux achetés à un autre éleveur, le document part de chez le vendeur et arrive chez vous.',
        },
        {
          id: 'circulation.abattoir',
          titre: 'Abattoir',
          texte: 'Pour les animaux d’un lot d’abattoir et pour la dépense d’un contact de catégorie Abattoir, le document va de l’exploitation à l’abattoir. Un client de catégorie Abattoir est toujours le lieu d’arrivée.',
        },
        {
          id: 'circulation.sanitaire',
          titre: 'Information sanitaire',
          texte: 'Des animaux sous délai d’attente pour la viande le jour du chargement sont signalés sur le document.',
        },
      ],
    },
    {
      id: 'comptabilite',
      titre: 'Comptabilité',
      regles: [
        {
          id: 'compta.tva',
          titre: 'Taux de TVA d’office',
          texte: `Un achat de l’élevage : ${pourcent(TAUX_TVA_ACHAT_DEFAUT)} ; le carburant : ${pourcent(TAUX_TVA_CARBURANT)} ; un achat d’entreprise : ${pourcent(TAUX_TVA_ACHAT_ENTREPRISE_DEFAUT)}. On peut les changer écriture par écriture.`,
        },
        {
          id: 'compta.nonFacturee',
          titre: 'Dépense non facturée',
          texte: 'Sans facture, la TVA de la dépense n’est pas déductible : elle reste dans la trésorerie et dans la rentabilité.',
        },
        {
          id: 'compta.pasPayee',
          titre: 'Pas encore payée',
          texte: 'Une écriture pas encore payée est comptée dans la trésorerie à son échéance (un mois après sa date d’office).',
        },
        {
          id: 'compta.pcg',
          titre: 'Comptes du plan comptable',
          texte: 'Les comptes proposés sont indicatifs : à confirmer avec votre comptable avant toute déclaration.',
        },
        {
          id: 'compta.fournisseur',
          titre: 'Catégorie du fournisseur',
          texte: 'La catégorie du contact règle les dépenses possibles (un vétérinaire n’a que la dépense vétérinaire) et les cases proposées (pas encore payée, non facturée).',
        },
        {
          id: 'compta.animaux',
          titre: 'Achat d’animaux vivants',
          texte: 'Chaque animal acheté a sa fiche créée dans le cheptel à l’enregistrement : date de naissance obligatoire, n° de boucle facultatif mais unique.',
        },
        {
          id: 'compta.boucles',
          titre: 'Achat de boucles',
          texte: 'La première boucle achetée est saisie ; les suivantes se numérotent à la suite selon la quantité.',
        },
        {
          id: 'compta.etapes',
          titre: 'Saisie en deux étapes',
          texte: 'Une écriture se saisit en deux étapes : d’abord le contact et la facture, puis ce qui est acheté ou vendu.',
        },
      ],
    },
    {
      id: 'contacts',
      titre: 'Contacts',
      regles: [
        {
          id: 'contacts.fiche',
          titre: 'Une fiche, une catégorie',
          texte: 'Un contact reçoit des recettes, fait des dépenses, ou les deux : une seule fiche et une seule catégorie.',
        },
        {
          id: 'contacts.categorieClient',
          titre: 'Catégorie d’un client',
          texte: 'Elle règle le prix libre ou tiré de l’inventaire, si la vente est déclarée d’office, et les recettes possibles (un organisme n’a que l’aide ou les prestations).',
        },
        {
          id: 'contacts.choix',
          titre: 'Choisir un contact',
          texte: 'Les listes de choix d’un contact montrent d’abord ses catégories, puis les contacts de la catégorie ouverte. Une recherche propose la catégorie du contact trouvé.',
        },
      ],
    },
    {
      id: 'donnees',
      titre: 'Données et documents',
      regles: [
        {
          id: 'donnees.auto',
          titre: 'Enregistrement automatique',
          texte: `Un formulaire qu’on modifie s’enregistre tout seul, ${DELAI_ENREGISTREMENT_AUTO / 1000} s après le dernier changement et en quittant l’écran. Les écrans de création gardent leur bouton Enregistrer.`,
        },
        {
          id: 'donnees.pdf',
          titre: 'Documents générés',
          texte: 'Les PDF générés sont conservés dans la bibliothèque des documents (historique) ; Organisation › PDF et le dossier PAC signalent ceux déjà générés.',
        },
        {
          id: 'donnees.drive',
          titre: 'Google Drive',
          texte: 'Les données partent sur Drive en un fichier par catégorie, avec une colonne année ; elles restent d’abord enregistrées sur l’appareil.',
        },
      ],
    },
  ];
}
