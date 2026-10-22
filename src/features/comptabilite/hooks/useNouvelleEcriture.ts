import {
  useEffect,
  useRef,
  useState,
} from 'react';
import { useRetour } from '@/shared/navigation/origineRetour';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { Commande, LigneCommande } from '@/features/commercial/types';
import type { Chevre } from '@/features/cheptel/types';
import type { ArchiveStock } from '@/features/stock/types';
import { enregistrerCommande } from '@/features/commercial/repository';
import {
  elementsAFacturer,
  estLigneDeViande,
  type ElementACommande,
} from '@/features/commercial/services/commandes';
import { STATUT_COMMANDE } from '@/shared/constants/commercial';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  roleDeLaLigneDeLaVente,
} from '@/features/stock/services/stock';
import { erreurAchatBoucles } from '@/features/stock/services/boucles';
import {
  listTousLesAnimauxDeLEspece,
} from '@/features/cheptel/repository/chevres';
import {
  PREFIXE_CATEGORIE_AJOUTEE,
  categoriesAjoutees,
} from '@/features/comptabilite/utils/categoriesRecetteInventaire';
import { LABEL_GROUPE_RECETTE } from '@/shared/textes/libelles';
import { tauxImpositionDeLAide, tauxTvaDeLaVente } from '@/shared/dictionnaire/tauxParProduit';
import { categorieDepenseAutorisee, estChambreAgriculture } from '@/features/fournisseurs/services/categorie';
import { CATEGORIE_CLIENT } from '@/shared/constants/clients';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import {
  categorieFournisseurDe,
  depensesDeLaCategorie,
  pasPayeeAffichee,
  offertAffiche,
  sansFactureAffichee,
} from '@/shared/dictionnaire/categoriesFournisseur';
import { categorieClientDe, pasEncaisseeAffichee } from '@/shared/dictionnaire/categoriesClient';
import { categoriesDepenseDuMode } from '@/features/comptabilite/utils/categories';
import {
  groupeRecetteAutorise,
  numeroFactureLibre as numeroFactureLibreDuClient,
  reajustementPossible as reajustementPossibleDuClient,
  prixLibre as prixLibreDuClient,
  fraisAbattoirFacturesAuClient,
  fraisAbattoirMemeOfferts,
  estClientAbattoir,
  venteDeclareeParDefaut,
} from '@/features/clients/services/categorie';
import { construireEcriture, type ErreurSaisie } from '@/features/comptabilite/forms/construireEcriture';
import { lierLaFactureAuLot } from '@/features/exploitation/services/departDAnimaux';
import { useLignesDepense } from '@/features/comptabilite/hooks/nouvelleEcriture/useLignesDepense';
import { useDonneesDeReference } from '@/features/comptabilite/hooks/nouvelleEcriture/useDonneesDeReference';
import {
  controlerAvantEnregistrement,
  enregistrerLaDepense,
  enregistrerLaVente,
  sortirLesAnimauxDeLaVente,
} from '@/features/comptabilite/hooks/nouvelleEcriture/enregistrement';
import { detailDesAnimaux } from '@/features/comptabilite/forms/detailDesAnimaux';
import { optionsDesComptes } from '@/features/comptabilite/utils/optionsComptes';
import type {
  ActiviteComptable,
  CategorieDepense,
  CategorieRecette,
  TypeAide,
  TypeFacture,
  TypeFromage,
  UniteVente,
} from '@/features/comptabilite/types';
import { useAnneeImposee } from '@/features/settings/hooks/useAnneeImposee';
import {
  estDateISO,
  memeJourDansLAnnee,
  todayISO,
} from '@/shared/utils/dates';
import { typesAlimentEspece } from '@/features/comptabilite/utils/alimentation';
import {
  categoriesGroupe,
  categoriesRecetteActivite,
  estCategorieVente,
  groupeRecette,
  groupesRecetteActivite,
  type GroupeRecette,
  premiereCategorieRecette,
} from '@/features/comptabilite/utils/recettes';
import { ACTIVITE_COMMUNE, ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { parseDecimal, totalMontants } from '@/shared/utils/nombres';
import {
  CATEGORIES_DEPENSE_ENTREPRISE,
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  GROUPE_RECETTE,
  CATEGORIE_VENTE,
  POURCENTAGE_MIN,
  TAUX_TVA_ACHAT_DEFAUT,
  TAUX_TVA_ACHAT_ENTREPRISE_DEFAUT,
  TAUX_TVA_RECETTE_ENTREPRISE,
  TAUX_TVA_CARBURANT,
  TYPE_AIDE,
  TYPE_ALIMENT,
  TYPE_FACTURE,
  TYPE_FROMAGE,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import { COMPTE_PAR_DEPENSE, COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';

/** Taux de TVA proposé pour une recette (celui de la vente de production, 0 pour une aide ou autre). */
const tauxTvaParDefaut = (categorie: CategorieRecette): number =>
  estCategorieVente(categorie) ? tauxTvaDeLaVente(categorie) : 0;

/** État, valeurs calculées et actions du formulaire « Nouvelle écriture » (débit/crédit). */
export function useNouvelleEcriture(
  typeInitial?: TypeFacture,
  categorieInitiale?: CategorieRecette,
  /** Le jour d'abattage d'ouverture (depuis Production › Viande) : les animaux abattus ce jour-là sont proposés d'office. */
  abattoirInitial?: string,
  /** Ouvert pour un client qui ne veut pas de facture (depuis Production › Viande, pour les petits sans boucle). */
  sansFactureInitial?: boolean,
  /** Le client d'ouverture (depuis la réservation d'un animal) et les animaux à vendre. */
  clientInitial?: string,
  animauxInitiaux?: string[],
  /** Des lots à vendre (depuis la liste des lots d'un fromage ou d'une charcuterie) : leurs identifiants, le produit (« fromage:frais ») et son nom. */
  departLots?: { fromages: string[]; produit?: string; libelle?: string },
  /** L'état des animaux (depuis leur réservation) : « vivants » ou « morts ». */
  etatInitial?: string,
  /** Le lot d'abattoir à facturer (depuis son assistant, ou le choix d'un lot) : ses animaux sont déjà sortis ; sa facture se lie à lui. */
  lotInitial?: string,
) {
  // Revenir d'où l'on vient : la page d'un lieu qui a ouvert l'écriture, sinon l'écran d'avant.
  const retour = useRetour();
  const { settings, setAnneeActive, choisirToutesAnnees, patchSettings } = useAppSettings();
  const { anneeImposee, dateDuJour } = useAnneeImposee();
  /** Le client souhaite que la vente soit déclarée (avec facture) : coché d'office. */
  const [avecFacture, setAvecFacture] = useState(!sansFactureInitial);
  /** Le numéro de la facture de la vente (obligatoire quand elle est déclarée). */
  const [numeroFacture, setNumeroFacture] = useState('');
  /** Le récolteur coche « Réajustement » : décoché d'office. */
  const [reajustementCoche, setReajustement] = useState(false);
  /** Une vente offerte au client : prix à 0 €. */
  const [offertCoche, setOffert] = useState(false);
  /** Vente offerte : le bouton « Cadeau » des animaux (d'office : actif). */
  const [cadeauProduit, setCadeauProduit] = useState(true);
  /** Vente offerte : le bouton « Cadeau » des frais d'abattoir ; non touché, il suit la catégorie du client. */
  const [cadeauFraisChoisi, setCadeauFrais] = useState<boolean | undefined>(undefined);
  /** La commande que l'on transforme en ventes (une vente par ligne) : chaque enregistrement prend la ligne suivante. */
  const [commande, setCommande] = useState<Commande | null>(null);
  /** Ce qu'on passe en vente maintenant (le premier est celui à l'écran) et les animaux réservés de la commande pas encore vendus. */
  const [fileDeLaCommande, setFileDeLaCommande] = useState<ElementACommande[]>([]);
  const [animauxDuBon, setAnimauxDuBon] = useState<string[]>([]);
  /** La nature de la recette pour l'URSSAF (vide : selon la catégorie). */
  const [natureUrssaf, setNatureUrssaf] = useState('');
  /** Le paiement n'a pas encore eu lieu : sa date prévue (la trésorerie la compte à cette date). */
  const [enAttente, setEnAttente] = useState(false);
  /** Une dépense qui n'a pas été facturée (pas de TVA à déduire). */
  const [sansFacture, setSansFacture] = useState(false);
  /** Une dépense offerte par le fournisseur (un cadeau) : la case cochée. */
  const [offertDepenseCoche, setOffertDepense] = useState(false);
  /** Dépense offerte sans détail par ligne : le bouton « Cadeau » du montant (d'office : actif). */
  const [cadeauMontantDepense, setCadeauMontantDepense] = useState(true);
  const [echeance, setEcheance] = useState('');
  /** Le circuit de vente d'une vente (vide : non précisé). */
  const [circuit, setCircuit] = useState('');
  /** L'atelier d'une charge (vide : commune, répartie entre les ateliers). */
  const [atelier, setAtelier] = useState('');
  /** Le véhicule de la flotte d'une réparation ou d'une assurance (vide : aucun). */
  const [vehiculeId, setVehiculeId] = useState('');
  /** Ce qu'une assurance couvre (vide : non précisé). */
  const [objetAssurance, setObjetAssurance] = useState('');
  /** Le motif d'une réparation ou de l'indemnité d'une assurance. */
  const [motif, setMotif] = useState('');
  /** Le volet d'une association ou d'une coopérative agricole (vide : non précisé). */
  const [voletCooperative, setVoletCooperative] = useState('');
  /** L'élément de l'agritourisme d'une charge de l'atelier Agritourisme (vide : toutes les visites). */
  const [elementAgri, setElementAgri] = useState('');
  // Une entreprise n'a pas d'espèces : ses écritures sont « communes », avec ses propres catégories. La TVA ne
  // s'applique (champ affiché, taux enregistré) que si elle a coché « Assujetti à la TVA » dans ses informations.
  const entreprise = modeEntreprise();
  const tvaEntreprise = entreprise && !!settings.exploitation?.entreprise?.tvaApplicable;
  // Le taux de TVA se montre quand la TVA s'applique (un élevage, ou une entreprise assujettie).
  const afficherTva = !entreprise || tvaEntreprise;
  const activiteInitiale: ActiviteComptable = entreprise ? ACTIVITE_COMMUNE : especeCourante();
  const tauxTvaEntreprise = (categorie: CategorieRecette): string =>
    tvaEntreprise
      ? String(TAUX_TVA_RECETTE_ENTREPRISE[categorie as keyof typeof TAUX_TVA_RECETTE_ENTREPRISE] ?? 0)
      : '0';

  const [type, setType] = useState<TypeFacture>(
    typeInitial === TYPE_FACTURE.EMISE ? TYPE_FACTURE.EMISE : TYPE_FACTURE.RECUE,
  );
  // Activité : l'espèce courante par défaut (visible seulement si l'établissement en élève plusieurs).
  const [activite, setActivite] = useState<ActiviteComptable>(activiteInitiale);
  const [date, setDate] = useState(dateDuJour);
  // Une autre année active (choisie ici) : la date passe dans cette année ; avec « Tout », elle reste libre.
  const [anneeVue, setAnneeVue] = useState(anneeImposee);
  if (anneeVue !== anneeImposee) {
    setAnneeVue(anneeImposee);
    if (anneeImposee !== undefined) setDate(memeJourDansLAnnee(date, anneeImposee));
  }
  const [tiers, setTiers] = useState('');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  /** Le nombre d'écritures enregistrées avec « en ajouter une autre » depuis l'ouverture de l'écran. */
  const [enchainees, setEnchainees] = useState(0);
  const [erreur, setErreur] = useState<ErreurSaisie | null>(null);

  // Débit (facture reçue)
  const [categorieDepense, setCategorieDepense] = useState<CategorieDepense>(
    entreprise ? CATEGORIES_DEPENSE_ENTREPRISE[0] : CATEGORIE_DEPENSE.ALIMENTATION,
  );
  // Les lignes saisies d'une dépense (aliments, marchandises, carburant, fournitures, Chambre, vétérinaire, animaux achetés ou envoyés).
  const {
    lignesAlimentation,
    setLignesAlimentation,
    lignesMarchandises,
    setLignesMarchandises,
    lignesCarburant,
    setLignesCarburant,
    animauxAchetes,
    setAnimauxAchetes,
    animauxEnvoyes,
    setAnimauxEnvoyes,
    lotId,
    setLotId,
    lignesProduction,
    setLignesProduction,
    lignesChambre,
    setLignesChambre,
    lignesVeterinaire,
    setLignesVeterinaire,
    reinitialiserLesLignes,
  } = useLignesDepense();
  // Ouvert avec un lot d'abattoir (depuis son assistant) : il est choisi d'office, une seule fois.
  const [lotVu, setLotVu] = useState<string | undefined>(undefined);
  if (lotInitial !== lotVu) {
    setLotVu(lotInitial);
    if (lotInitial) setLotId(lotInitial);
  }
  /** Le lot d'abattoir choisi, et vrai quand son document de circulation manque (il se dépose avant toute écriture). */
  const lotChoisi = (settings.exploitation?.lots ?? []).find((l) => l.id === lotId);
  const lotSansDocument = !!lotChoisi && !lotChoisi.documentCirculation;
  const [tauxTvaAchat, setTauxTvaAchat] = useState(
    entreprise
      ? tvaEntreprise
        ? String(TAUX_TVA_ACHAT_ENTREPRISE_DEFAUT)
        : '0'
      : String(TAUX_TVA_ACHAT_DEFAUT),
  );
  const [compteDepenseAutre, setCompteDepenseAutre] = useState(
    COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.AUTRE].numero,
  );
  // Ce qui se lit à chaque ouverture : fournisseurs, clients, comptes, listes de l'inventaire.
  const { fournisseurs, clients, comptes, comptesInventaire, versionGroupes } = useDonneesDeReference();
  const [fournisseurId, setFournisseurId] = useState('');
  /** Achat de production : l'article du stock acheté et sa quantité. */
  const [stockArticle, setStockArticle] = useState('');
  const [stockQuantite, setStockQuantite] = useState<number | undefined>();
  /** Un achat de boucles : le numéro de la première. */
  const [bouclesDebut, setBouclesDebut] = useState('');
  /** Une dépense vétérinaire : le motif de la visite, et son inscription dans les visites vétérinaires. */
  const [motifVisite, setMotifVisite] = useState('');
  const [ajouterVisite, setAjouterVisite] = useState(true);

  // Crédit (facture émise ou vente de production)
  // Première recette de l'espèce courante : le lait pour les chèvres, la charcuterie pour les cochons…
  // Une recette peut s'ouvrir sur sa catégorie (les œufs vendus depuis la Production, par exemple).
  const [categorieRecette, setCategorieRecette] = useState<CategorieRecette>(
    categorieInitiale ?? premiereCategorieRecette(activiteInitiale),
  );
  const codeFromageDepart = departLots?.produit?.startsWith('fromage:') ? departLots.produit.split(':')[1] : undefined;
  const fromageConnu = !!codeFromageDepart && (Object.values(TYPE_FROMAGE) as string[]).includes(codeFromageDepart);
  const [typeFromage, setTypeFromage] = useState<TypeFromage>(
    fromageConnu ? (codeFromageDepart as TypeFromage) : codeFromageDepart ? TYPE_FROMAGE.AUTRE : TYPE_FROMAGE.FRAIS,
  );
  const [typeFromageLibre, setTypeFromageLibre] = useState(
    codeFromageDepart && !fromageConnu ? (departLots?.libelle ?? '') : '',
  );
  const [quantite, setQuantite] = useState('');
  const [unite, setUnite] = useState<UniteVente>(UNITE_VENTE.PIECE);
  const [poidsKg, setPoidsKg] = useState('');
  const [jeune, setJeune] = useState<boolean | undefined>();
  /** L'état des animaux d'une vente de viande à la remise : « vivants », « morts », ou vide (vivants à l'abattoir). */
  const [etatAnimaux, setEtatAnimaux] = useState(etatInitial ?? '');
  /** Les fiches des animaux sur pied ou vivants vendus (vide : aucun choisi). */
  const [animaux, setAnimaux] = useState<string[]>(animauxInitiaux ?? []);
  /** Les lots des fromages vendus (vide : aucun choisi, ou un fromage sans lot). */
  const [fromages, setFromages] = useState<string[]>(departLots?.fromages ?? []);
  /** Une vente de viande avec des animaux : leur date d'abattoir (vide : la date de la vente). */
  const [dateAbattoir, setDateAbattoir] = useState(abattoirInitial ?? '');
  /** Une vente de viande : les frais d'abattoir refacturés au client (texte saisi) et leur taux de TVA (vide : celui de la vente). */
  const [fraisAbattoir, setFraisAbattoir] = useState('');
  const [tauxTvaFrais, setTauxTvaFrais] = useState('');
  const [precision, setPrecision] = useState(departLots?.produit?.startsWith('viande:') ? (departLots.libelle ?? '') : '');
  /** Un prix personnalisé (exceptionnel) pour les produits de cette facture : l'option reste cochée d'une ligne à l'autre, le prix se saisit pour chaque produit. */
  const [prixPersonnalise, setPrixPersonnalise] = useState(false);
  /** Des animaux vivants vendus au poids vif (réforme) : le prix au kilo se saisit ; sinon, à la tête. */
  const [venduAuPoids, setVenduAuPoids] = useState(false);
  const [prixPerso, setPrixPerso] = useState<{ cle: string; valeur: string }>({ cle: '', valeur: '' });
  /** Le produit auquel le prix saisi appartient : un autre produit repart du prix de l'inventaire. */
  const clePrix = [categorieRecette, precision, typeFromage].join('|');
  const prixUnitaireSaisi = prixPerso.cle === clePrix ? prixPerso.valeur : '';
  const setPrixUnitaireSaisi = (valeur: string) => setPrixPerso({ cle: clePrix, valeur });
  const [typeAide, setTypeAide] = useState<TypeAide>(TYPE_AIDE.PAIEMENT_BASE);
  const [typeAideLibre, setTypeAideLibre] = useState('');
  const [tauxImpositionLibre, setTauxImpositionLibre] = useState(
    String(tauxImpositionDeLAide(TYPE_AIDE.PAIEMENT_BASE)),
  );
  const [compteRecetteAutre, setCompteRecetteAutre] = useState(
    COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.AUTRE].numero,
  );
  const [tauxTvaVente, setTauxTvaVente] = useState(
    entreprise
      ? tauxTvaEntreprise(premiereCategorieRecette(activiteInitiale))
      : String(tauxTvaParDefaut(categorieInitiale ?? premiereCategorieRecette(especeCourante()))),
  );
  const [clientId, setClientId] = useState(clientInitial ?? '');



  // --- Valeurs calculées ---
  const clientSelectionne = clients.find((c) => c.id === clientId);
  /** Le prix d'un récolteur est libre (saisi) ; son numéro de facture peut avoir des lettres, celui des autres seulement des chiffres. */
  const prixLibre = prixLibreDuClient(clientSelectionne);
  /** Les frais d'abattoir se facturent à ce client (sa catégorie : réglage, sinon oui sauf à prix libre). */
  const fraisAbattoirAffiches = fraisAbattoirFacturesAuClient(clientSelectionne);
  const cadeauFrais = cadeauFraisChoisi ?? !fraisAbattoirMemeOfferts(clientSelectionne);
  const numeroFactureLibre = numeroFactureLibreDuClient(clientSelectionne);
  /** « Réajustement » : une vente de lait déclarée d'un récolteur ; coché, elle n'a ni litrage ni numéro de facture. */
  const reajustementPossible = reajustementPossibleDuClient(clientSelectionne, categorieRecette, avecFacture);
  const reajustement = reajustementPossible && reajustementCoche;
  /** Choisit le client, et règle d'office « le client souhaite déclarer la vente » selon sa catégorie. */
  const choisirClient = (id: string) => {
    setClientId(id);
    const client = clients.find((c) => c.id === id);
    // La catégorie du client règle les recettes possibles : une recette qu'elle ne propose pas laisse la place à la première qui l'est.
    if (
      type === TYPE_FACTURE.EMISE &&
      !categorieAjoutee &&
      !groupeRecetteAutorise(client, groupeRecette(categorieRecette, activite))
    ) {
      const permis = groupesRecetteActivite(activite).find((g) => groupeRecetteAutorise(client, g));
      if (permis) changerCategorieRecette(categoriesGroupe(permis, activite)[0]);
    }
    const clientChoisi = clients.find((c) => c.id === id);
    // Le circuit de vente privilégié du contact se prérempli (on peut le changer pour cette vente).
    if (clientChoisi?.circuit) setCircuit(clientChoisi.circuit);
    // Une case que la catégorie du client n'affiche pas ne reste pas cochée.
    if (clientChoisi && !pasEncaisseeAffichee(categorieClientDe(clientChoisi.categorie))) setEnAttente(false);
    const declaree = venteDeclareeParDefaut(clients.find((c) => c.id === id));
    if (declaree !== avecFacture) {
      setAvecFacture(declaree);
      // Avec facture, les animaux ont une boucle ; sans, ils n'en ont pas : ceux déjà choisis ne conviennent plus.
      setAnimaux([]);
    }
  };
  const estProductionVente = type === TYPE_FACTURE.EMISE && estCategorieVente(categorieRecette);
  const estAlimentationDebit =
    type === TYPE_FACTURE.RECUE && categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION;
  // L'alimentation et les ventes de production sont propres à une espèce ; le reste peut être « commun ».
  const avecCommunActivite = !estAlimentationDebit && !estProductionVente;
  // Un achat de marchandises d'un gîte se détaille par marchandise (bar, restaurant, activité annexe).
  const estMarchandisesGite =
    type === TYPE_FACTURE.RECUE &&
    categorieDepense === CATEGORIE_DEPENSE.ACHATS_MARCHANDISES &&
    activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);

  // Les comptes proposés (de charges et de produits), selon l’espèce de l’écriture ; ceux de l’inventaire d’abord pour une dépense.
  const { comptesDepense, comptesRecette, optionsCompteDepense, optionsCompteRecette } = optionsDesComptes(
    comptes,
    activite,
    comptesInventaire,
  );

  const compteAffiche =
    type === TYPE_FACTURE.RECUE
      ? categorieDepense === CATEGORIE_DEPENSE.AUTRE
        ? (comptesDepense.find((c) => c.numero === compteDepenseAutre) ??
          COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.AUTRE])
        : COMPTE_PAR_DEPENSE[categorieDepense]
      : categorieRecette === CATEGORIE_RECETTE.AUTRE
        ? (comptesRecette.find((c) => c.numero === compteRecetteAutre) ??
          COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.AUTRE])
        : COMPTE_PAR_RECETTE[categorieRecette];

  // --- Actions ---
  const changerActivite = (nouvelle: ActiviteComptable) => {
    setActivite(nouvelle);
    // Les lignes d'alimentation déjà saisies passent au premier aliment de l'espèce si le leur n'en fait pas partie.
    const types = typesAlimentEspece(nouvelle === ACTIVITE_COMMUNE ? especeCourante() : nouvelle);
    const permises = categoriesRecetteActivite(nouvelle);
    if (!permises.includes(categorieRecette)) changerCategorieRecette(premiereCategorieRecette(nouvelle));
    setLignesAlimentation((lignes) =>
      lignes.map((l) =>
        l.activite || l.type === TYPE_ALIMENT.AUTRE || types.includes(l.type) ? l : { ...l, type: types[0] },
      ),
    );
  };

  /** Une écriture propre à une espèce ne peut pas rester « commune » : on revient à l'espèce courante. */
  const rattacherSiCommun = () => setActivite((a) => (a === ACTIVITE_COMMUNE ? especeCourante() : a));

  const fournisseurSelectionne = fournisseurs.find((x) => x.id === fournisseurId);
  /** Une dépense « Autre » d'un fournisseur de la catégorie Chambre d'agriculture : le détail par article. */
  const estChambre =
    type === TYPE_FACTURE.RECUE &&
    categorieDepense === CATEGORIE_DEPENSE.AUTRE &&
    estChambreAgriculture(fournisseurSelectionne);
  /** La catégorie du fournisseur choisi : elle dit si la case « Offert par le fournisseur » s'affiche. */
  const categorieDuFournisseur = fournisseurSelectionne ? categorieFournisseurDe(fournisseurSelectionne.categorie) : undefined;
  /** Le volet se choisit quand le contact est une association ou une coopérative agricole (fournisseur d'une dépense, client d'une recette), ou qu'il est déjà donné. */
  const contactCooperative =
    type === TYPE_FACTURE.RECUE
      ? categorieDuFournisseur?.id === CATEGORIE_FOURNISSEUR.GROUPEMENT
      : categorieClientDe(clientSelectionne?.categorie)?.id === CATEGORIE_CLIENT.GROUPEMENT;
  const voletAffiche = contactCooperative || voletCooperative !== '';
  /** Une dépense offerte (la case est cochée, la catégorie la propose, et la dépense a des montants que le fournisseur peut offrir : ni la Chambre, ni le carburant). */
  const offertDepense =
    type === TYPE_FACTURE.RECUE &&
    offertDepenseCoche &&
    offertAffiche(categorieDuFournisseur) &&
    !estChambre &&
    categorieDepense !== CATEGORIE_DEPENSE.CARBURANT;
  const totalMarchandises = totalMontants(lignesMarchandises, offertDepense);
  const totalAlimentation = totalMontants(lignesAlimentation, offertDepense);
  const totalCarburant = totalMontants(lignesCarburant);
  const totalProduction = totalMontants(lignesProduction, offertDepense);
  /** Le total d'une facture de la Chambre : ses articles, plus les boucles qu'elle commande. */
  const totalChambre = totalMontants(lignesChambre) + totalProduction;
  const changerFournisseur = (id: string) => {
    setFournisseurId(id);
    const choisi = fournisseurs.find((x) => x.id === id);
    setTiers(choisi?.nomEntreprise ?? '');
    // Un fournisseur qui ne remet pas de facture : la dépense se note « non facturée » d'office (on peut décocher).
    const categorieTiers = choisi ? categorieFournisseurDe(choisi.categorie) : undefined;
    setSansFacture(
      sansFactureAffichee(categorieTiers) && choisi?.categorie === CATEGORIE_FOURNISSEUR.NON_FACTURABLE,
    );
    // Une case que la catégorie n'affiche pas ne reste pas cochée.
    if (!pasPayeeAffichee(categorieTiers)) setEnAttente(false);
    // La catégorie du fournisseur règle les dépenses possibles : celle qu'elle ne permet pas laisse la place à la première qui l'est.
    if (!categorieDepenseAutorisee(choisi, categorieDepense)) {
      // Dans l'ordre de la catégorie du tiers (un assureur : « Assurances » avant « Autre »), pas dans celui de la liste générale.
      const dansLOrdreDuTiers = depensesDeLaCategorie(categorieFournisseurDe(choisi?.categorie)) ?? [];
      const proposees = categoriesDepenseDuMode();
      const permise =
        dansLOrdreDuTiers.find((c) => proposees.includes(c as CategorieDepense)) ??
        proposees.find((c) => categorieDepenseAutorisee(choisi, c));
      if (permise) changerCategorieDepense(permise as CategorieDepense);
    }
  };

  const changerTypeAide = (v: TypeAide) => {
    setTypeAide(v);
    setTauxImpositionLibre(String(v === TYPE_AIDE.AUTRE ? POURCENTAGE_MIN : tauxImpositionDeLAide(v)));
  };

  const changerCategorieRecette = (v: CategorieRecette) => {
    setCategorieRecette(v);
    // Le détail (et les animaux choisis) d'une vente de viande ne vaut pas pour une autre catégorie : on repart de zéro.
    if (v !== categorieRecette) {
      setPrecision('');
      setAnimaux([]);
      setJeune(undefined);
    }
    if (estCategorieVente(v)) {
      setTauxTvaVente(String(tauxTvaDeLaVente(v)));
      rattacherSiCommun();
    } else if (entreprise) {
      setTauxTvaVente(tauxTvaEntreprise(v));
    }
  };

  const changerCategorieDepense = (v: CategorieDepense) => {
    setCategorieDepense(v);
    setStockArticle('');
    setStockQuantite(undefined);
    setBouclesDebut('');
    if (v === CATEGORIE_DEPENSE.ALIMENTATION) rattacherSiCommun();
    // Une entreprise garde le taux choisi (ou l'absence de TVA) ; un élevage a un taux par défaut selon la catégorie.
    if (!entreprise) {
      setTauxTvaAchat(String(v === CATEGORIE_DEPENSE.CARBURANT ? TAUX_TVA_CARBURANT : TAUX_TVA_ACHAT_DEFAUT));
    }
  };

  // Une catégorie ajoutée par l'utilisateur : une recette « autre » dont le compte est celui qu'il a choisi.
  const [categorieAjouteeId, setCategorieAjouteeId] = useState<string | undefined>();
  const categoriesAjouteesActivite = activite === ACTIVITE_COMMUNE || entreprise ? [] : categoriesAjoutees();
  const categorieAjoutee =
    categorieRecette === CATEGORIE_RECETTE.AUTRE
      ? categoriesAjouteesActivite.find((c) => c.id === categorieAjouteeId)
      : undefined;
  const choisirGroupeRecette = (valeur: string) => {
    const ajoutee = categoriesAjouteesActivite.find((c) => `${PREFIXE_CATEGORIE_AJOUTEE}${c.id}` === valeur);
    if (ajoutee) {
      setCategorieAjouteeId(ajoutee.id);
      changerCategorieRecette(CATEGORIE_RECETTE.AUTRE);
      setCompteRecetteAutre(ajoutee.compte);
      return;
    }
    setCategorieAjouteeId(undefined);
    changerCategorieRecette(categoriesGroupe(valeur as GroupeRecette, activite)[0]);
  };

  // Le choix des catégories de recette a changé (retour de l'écran des catégories) : la recette qui n'est plus proposée laisse la place.
  useEffect(() => {
    if (versionGroupes === 0) return;
    const proposees = groupesRecetteActivite(activite).flatMap((g) => categoriesGroupe(g, activite));
    if (!proposees.includes(categorieRecette) && !categorieAjoutee)
      changerCategorieRecette(premiereCategorieRecette(activite));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [versionGroupes]);

  /**
   * Vide ce qui est propre à une écriture (montant, description, numéro, lignes) et garde ce qui se répète d'une saisie à
   * l'autre : le type, la date, l'activité, la catégorie, le client ou le fournisseur, la TVA, la nature URSSAF.
   */
  /** La ligne de commande à reprendre après « Enregistrer et en ajouter une autre ». */
  const suiteDeLaCommande = useRef<ElementACommande | null>(null);
  /** Les animaux d'un bon dont le détail de la vente est deviné d'après leur âge : il suit la date de la facture tant qu'on ne le change pas. */
  const animauxAuto = useRef<{ animaux: Chevre[]; etat?: 'vivants' | 'morts'; archive: ArchiveStock } | null>(null);

  const repartir = () => {
    animauxAuto.current = null;
    setDescription('');
    setMontant('');
    setNumeroFacture('');
    setEnAttente(false);
    setEcheance('');
    setQuantite('');
    setStockQuantite(undefined);
    setBouclesDebut('');
    setMotifVisite('');
    setPoidsKg('');
    setFraisAbattoir('');
    setTauxTvaFrais('');
    setAnimaux([]);
    setPrecision('');
    setJeune(undefined);
    reinitialiserLesLignes();
  };

  /** Reprend une ligne de commande : sa catégorie (fromage, ou viande / charcuterie), son produit et sa quantité. */
  const appliquerLigne = (ligne: LigneCommande) => {
    if (estLigneDeViande(ligne.article)) {
      changerCategorieRecette(CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE);
      setPrecision(ligne.libelle);
    } else {
      changerCategorieRecette(CATEGORIE_RECETTE.FROMAGE);
      const code = ligne.article.split(':')[1];
      if ((Object.values(TYPE_FROMAGE) as string[]).includes(code)) {
        setTypeFromage(code as TypeFromage);
        setTypeFromageLibre('');
      } else {
        setTypeFromage(TYPE_FROMAGE.AUTRE);
        setTypeFromageLibre(ligne.libelle);
      }
    }
    // Des lots réservés pour cette ligne : ils sont vendus avec elle (suivi des lots), leur nombre fait la quantité.
    const lots = ligne.lotIds ?? [];
    setFromages(lots);
    setQuantite(String(lots.length > 0 ? lots.length : ligne.quantite));
  };

  /** Reprend un élément d'une commande : une ligne, ou les animaux réservés (vente sans facture, détail deviné d'après leur âge). */
  const appliquerElement = async (element: ElementACommande) => {
    if (element.type === 'ligne') return appliquerLigne(element.ligne);
    changerCategorieRecette(CATEGORIE_RECETTE.VIANDE);
    setAvecFacture(false);
    setAnimaux(element.ids);
    // Vivants ou morts, comme dit à la réservation.
    setEtatAnimaux(element.etat ?? '');
    const [tous, archive] = await Promise.all([listTousLesAnimauxDeLEspece(), lireArchiveStock()]);
    const choisis = tous.filter((a) => element.ids.includes(a.id));
    // Le détail de la vente d'après l'âge à la date de la facture : « Cabris » pour des petits, sinon la ligne des adultes (vivants s'ils
    // sont remis vivants, sinon sur pied).
    animauxAuto.current = { animaux: choisis, etat: element.etat, archive };
    const { libelle, petits } = detailDesAnimaux(choisis, element.etat, estDateISO(date) ? date : todayISO(), archive);
    if (libelle) setPrecision(libelle);
    // Le nombre d'animaux, et petits ou adultes ; leur poids est repris par le formulaire (voir ChampsVenteViande).
    setQuantite(String(element.ids.length));
    setJeune(petits);
  };


  /** La date de la facture change : le détail deviné (cabris ou chèvre) suit, tant qu'on ne l'a pas choisi soi-même. */
  const changerDate = (nouvelle: string) => {
    setDate(nouvelle);
    const auto = animauxAuto.current;
    if (!auto || !estDateISO(nouvelle)) return;
    const { libelle, petits } = detailDesAnimaux(auto.animaux, auto.etat, nouvelle, auto.archive);
    if (libelle) setPrecision(libelle);
    setJeune(petits);
  };

  /** Un détail choisi à la main : il ne suit plus la date. */
  const choisirDetail = (detail: string) => {
    animauxAuto.current = null;
    setPrecision(detail);
  };

  /** Une vente basée sur une commande : le contact, le circuit, le paiement, puis les éléments choisis, un à un. */
  const demarrerCommande = (c: Commande, elements: ElementACommande[], idsAnimaux: string[]) => {
    setCommande(c);
    setFileDeLaCommande(elements);
    setAnimauxDuBon(idsAnimaux);
    if (c.clientId) choisirClient(c.clientId);
    // Le circuit est celui du contact ; celui de la commande ne sert que sans circuit privilégié.
    if (!clients.find((x) => x.id === c.clientId)?.circuit) setCircuit(c.circuit ?? '');
    setEnAttente(!!c.enAttente);
    setEcheance(c.echeance ?? '');
    if (elements[0]) appliquerElement(elements[0]);
  };

  /** Enregistre l'écriture, puis ferme l'écran ; avec `enchainer`, reste dessus pour saisir la suivante. */
  const enregistrer = async (enchainer = false) => {
    setEnregistrement(true);
    try {
      // Les contrôles de ce que la saisie désigne : animaux et poids d'une vente, lots, animaux achetés ou envoyés d'une dépense.
      const achatAnimaux = type === TYPE_FACTURE.RECUE && categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS;
      const envoiAnimaux = type === TYPE_FACTURE.RECUE && categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE;
      const erreurDeSaisie = await controlerAvantEnregistrement({
        type,
        categorieRecette,
        categorieDepense,
        activite,
        precision,
        animaux,
        poidsKg,
        venduAuPoids,
        estProductionVente,
        typeFromage,
        typeFromageLibre,
        fromages,
        animauxAchetes,
        animauxEnvoyes,
        lotId,
        lotSansDocument,
        motif,
        vehiculeId,
      });
      if (erreurDeSaisie) {
        setErreur(erreurDeSaisie);
        return;
      }
      // Pour l'état des animaux : le rôle de la ligne choisie (cabris, sur pied, vivant), et un client de catégorie Abattoir.
      const roleDuDetail =
        categorieRecette === CATEGORIE_RECETTE.VIANDE
          ? roleDeLaLigneDeLaVente({ categorie: CATEGORIE_VENTE.VIANDE, precision, activite }, await lireArchiveStock())
          : undefined;
      const resultat = construireEcriture({
        roleDuDetail,
        clientAbattoir: estClientAbattoir(clientSelectionne),
        activite,
        type,
        date,
        tiers,
        description: description.trim() || categorieAjoutee?.nom || '',
        montant,
        categorieDepense,
        stockArticle,
        stockQuantite,
        bouclesDebut,
        motifVisite,
        ajouterVisite,
        lignesAlimentation,
        lignesMarchandises: estMarchandisesGite ? lignesMarchandises : undefined,
        lignesProduction,
        lignesChambre: estChambre ? lignesChambre : undefined,
        lignesVeterinaire,
        lignesCarburant,
        categorieRecette,
        typeFromage,
        typeFromageLibre,
        quantite,
        unite,
        typeAide,
        typeAideLibre,
        tauxImpositionLibre,
        compteDepenseAutre,
        compteRecetteAutre,
        tauxTvaVente,
        tauxTvaAchat,
        poidsKg,
        jeune,
        etatAnimaux,
        animaux,
        fromages,
        dateAbattoir,
        fraisAbattoir,
        tauxTvaFrais,
        precision,
        clientSelectionne,
        estProductionVente,
        tvaEmise: tvaEntreprise && type === TYPE_FACTURE.EMISE && categorieRecette !== CATEGORIE_RECETTE.AIDE,
        avecFacture,
        numeroFacture,
        enAttente,
        sansFacture,
        offertDepense,
        cadeauMontant: cadeauMontantDepense,
        echeance,
        atelier,
        vehiculeId,
        objetAssurance,
        motif,
        voletCooperative,
        elementAgri,
        reajustement,
        offert: offertCoche && estProductionVente,
        cadeauProduit,
        venduAuPoids,
        prixUnitairePersonnalise: prixPersonnalise ? parseDecimal(prixUnitaireSaisi) || undefined : undefined,
        fraisOfferts: cadeauFrais,
        natureUrssaf,
        circuit,
      });
      if ('erreur' in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      if ('facture' in resultat) {
        const message = erreurAchatBoucles(await lireArchiveStock(), resultat.facture);
        if (message) {
          setErreur({ titre: message });
          return;
        }
      }
      if ('vente' in resultat) {
        const vente = await enregistrerLaVente(lotId ? { ...resultat.vente, lotId } : resultat.vente, commande?.id);
        // Une vente de commande : elle s'ajoute au bon, livré quand tout est passé en vente (les lignes, et les animaux réservés).
        let suite: ElementACommande | undefined;
        if (commande && fileDeLaCommande[0]) {
          const fait = fileDeLaCommande[0];
          const restantsAnimaux =
            fait.type === 'animaux' ? animauxDuBon.filter((id) => !fait.ids.includes(id)) : animauxDuBon;
          const mise: Commande = {
            ...commande,
            venteIds: [...(commande.venteIds ?? []), vente.id],
            lignesFacturees:
              fait.type === 'ligne'
                ? [...(commande.lignesFacturees ?? []), fait.ligne.id]
                : commande.lignesFacturees,
          };
          const complete = elementsAFacturer(mise, restantsAnimaux).length === 0;
          const enregistree = await enregistrerCommande(
            complete ? { ...mise, statut: STATUT_COMMANDE.LIVREE, dateLivraison: vente.date } : mise,
          );
          suite = fileDeLaCommande[1];
          setAnimauxDuBon(restantsAnimaux);
          setFileDeLaCommande(fileDeLaCommande.slice(1));
          setCommande(suite ? enregistree : null);
          if (enchainer && suite) suiteDeLaCommande.current = suite;
        }
        // Les animaux vendus quittent le cheptel (abattoir, morte ou vendue, selon la vente).
        await sortirLesAnimauxDeLaVente(vente);
      } else {
        // Les fiches des animaux achetés ou envoyés, le stock acheté et la visite du vétérinaire suivent la dépense.
        const facture = await enregistrerLaDepense(resultat.facture, {
          date,
          tiers,
          achatAnimaux,
          animauxAchetes,
          envoiAnimaux,
          animauxEnvoyes,
          lotId: envoiAnimaux ? lotId : undefined,
        });
        // La facture de l'abattoir se lie à son lot (créé avant, au départ des animaux) : le lot garde sa date et son document.
        if (envoiAnimaux && lotId) {
          await patchSettings({
            exploitation: {
              ...settings.exploitation,
              lots: lierLaFactureAuLot(settings.exploitation?.lots ?? [], lotId, facture.id),
            },
          });
        }
      }
      if (enchainer) {
        repartir();
        setEnchainees((n) => n + 1);
        // Une commande qui a d'autres lignes : la suivante est reprise.
        if (suiteDeLaCommande.current) {
          await appliquerElement(suiteDeLaCommande.current);
          setEnAttente(!!commande?.enAttente);
          setEcheance(commande?.echeance ?? '');
        }
        suiteDeLaCommande.current = null;
      } else retour();
    } finally {
      setEnregistrement(false);
    }
  };

  return {
    // champs communs
    activite,
    changerActivite,
    avecCommunActivite,
    entreprise,
    afficherTva,
    type,
    setType,
    date,
    setDate: changerDate,
    anneeImposee,
    anneeActive: settings.anneeActive,
    toutesAnnees: !!settings.toutesAnnees,
    setAnneeActive,
    choisirToutesAnnees,
    description,
    setDescription,
    // Une vente offerte au client : le total est de 0 € (le montant calculé revient dès qu'on décoche).
    montant: offertCoche && estProductionVente ? '0,00' : montant,
    setMontant,
    enregistrement,
    erreur,
    setErreur,
    enregistrer,
    enchainees,
    annuler: retour,
    // débit
    categorieDepense,
    changerCategorieDepense,
    stockArticle,
    setStockArticle,
    stockQuantite,
    setStockQuantite,
    bouclesDebut,
    setBouclesDebut,
    motifVisite,
    setMotifVisite,
    ajouterVisite,
    setAjouterVisite,
    lignesAlimentation,
    setLignesAlimentation,
    lignesMarchandises,
    setLignesMarchandises,
    estMarchandisesGite,
    totalMarchandises,
    lignesCarburant,
    setLignesCarburant,
    lignesProduction,
    setLignesProduction,
    totalProduction,
    lignesChambre,
    setLignesChambre,
    lignesVeterinaire,
    setLignesVeterinaire,
    totalChambre,
    estChambre,
    totalAlimentation,
    totalCarburant,
    animauxAchetes,
    setAnimauxAchetes,
    animauxEnvoyes,
    setAnimauxEnvoyes,
    lotId,
    setLotId,
    lotChoisi,
    lotSansDocument,
    prixPersonnalise,
    setPrixPersonnalise,
    venduAuPoids,
    setVenduAuPoids,
    prixUnitaireSaisi,
    setPrixUnitaireSaisi,
    tauxTvaAchat,
    setTauxTvaAchat,
    compteDepenseAutre,
    setCompteDepenseAutre,
    optionsCompteDepense,
    fournisseurs,
    fournisseurId,
    fournisseurSelectionne,
    changerFournisseur,
    // crédit
    categorieRecette,
    changerCategorieRecette,
    estProductionVente,
    typeFromage,
    setTypeFromage,
    typeFromageLibre,
    setTypeFromageLibre,
    quantite,
    setQuantite,
    unite,
    setUnite,
    poidsKg,
    setPoidsKg,
    jeune,
    setJeune,
    etatAnimaux,
    setEtatAnimaux,
    animaux,
    fromages,
    setFromages,
    dateAbattoir,
    setDateAbattoir,
    fraisAbattoir,
    setFraisAbattoir,
    tauxTvaFrais,
    setTauxTvaFrais,
    setAnimaux,
    precision,
    setPrecision: choisirDetail,
    groupeRecette: groupeRecette(categorieRecette, activite),
    groupesRecette: groupesRecetteActivite(activite),
    /** Les choix de la liste « Catégorie de recette » : celles d'office, puis celles que l'utilisateur a ajoutées. */
    optionsGroupesRecette: [
      ...groupesRecetteActivite(activite)
        .filter((g) => groupeRecetteAutorise(clientSelectionne, g))
        .map((g) => ({
          value: g as string,
          label: LABEL_GROUPE_RECETTE[g],
        })),
      ...(groupeRecetteAutorise(clientSelectionne, GROUPE_RECETTE.AUTRE)
        ? categoriesAjouteesActivite
        : []
      ).map((c) => ({
        value: `${PREFIXE_CATEGORIE_AJOUTEE}${c.id}`,
        label: c.nom,
      })),
    ],
    groupeRecetteAffiche: categorieAjoutee
      ? `${PREFIXE_CATEGORIE_AJOUTEE}${categorieAjoutee.id}`
      : (groupeRecette(categorieRecette, activite) as string),
    choisirGroupeRecette,
    categorieAjoutee,
    categoriesDuGroupe: categoriesGroupe(groupeRecette(categorieRecette, activite), activite),
    changerGroupeRecette: (groupe: GroupeRecette) =>
      changerCategorieRecette(categoriesGroupe(groupe, activite)[0]),
    typeAide,
    changerTypeAide,
    typeAideLibre,
    setTypeAideLibre,
    tauxImpositionLibre,
    setTauxImpositionLibre,
    compteRecetteAutre,
    setCompteRecetteAutre,
    optionsCompteRecette,
    tauxTvaVente,
    setTauxTvaVente,
    clients,
    clientId,
    setClientId,
    choisirClient,
    prixLibre,
    fraisAbattoirAffiches,
    numeroFactureLibre,
    reajustementPossible,
    reajustement,
    setReajustement,
    offert: offertCoche,
    setOffert,
    cadeauProduit,
    setCadeauProduit,
    cadeauFrais,
    setCadeauFrais,
    commande,
    demarrerCommande,
    elementsDeLaCommande: fileDeLaCommande,
    // affichage
    compteAffiche,
    avecFacture,
    setAvecFacture,
    atelier,
    setAtelier,
    vehiculeId,
    setVehiculeId,
    objetAssurance,
    setObjetAssurance,
    motif,
    setMotif,
    voletCooperative,
    setVoletCooperative,
    voletAffiche,
    elementAgri,
    setElementAgri,
    clientSelectionne,
    enAttente,
    setEnAttente,
    sansFacture,
    setSansFacture,
    offertDepense,
    offertDepenseCoche,
    setOffertDepense,
    cadeauMontantDepense,
    setCadeauMontantDepense,
    echeance,
    setEcheance,
    circuit,
    setCircuit,
    numeroFacture,
    setNumeroFacture,
    natureUrssaf,
    setNatureUrssaf,
  };
}

export type EtatNouvelleEcriture = ReturnType<typeof useNouvelleEcriture>;
