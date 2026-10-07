import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { enregistrerFacture } from '@/features/comptabilite/repository/factures';
import { synchroniserStockAchat } from '@/features/bar/services/achats';
import {
  articlesDuGenre,
  roleDeLaViande,
  synchroniserStockAlimentation,
  type FiltreStock,
} from '@/features/stock/services/stock';
import { lireArchiveStock } from '@/features/stock/repository';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { enregistrerVente } from '@/features/comptabilite/repository/ventes';
import { declarerStatutChevre } from '@/features/cheptel/repository/chevres';
import { idsDesAnimaux } from '@/features/comptabilite/utils/ventes';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import {
  PREFIXE_CATEGORIE_AJOUTEE,
  categoriesAjouteesEspece,
} from '@/features/comptabilite/utils/choixGroupesRecette';
import { LABEL_GROUPE_RECETTE } from '@/shared/textes/libelles';
import { chargerChoixGroupesRecette } from '@/features/comptabilite/repository/groupesRecette';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import { listClients } from '@/features/clients/repository';
import { listComptesPcg, type CompteComptableEnregistre } from '@/features/comptes-pcg/repository';
import { construireEcriture, type ErreurSaisie } from '@/features/comptabilite/forms/construireEcriture';
import { ligneAlimentVide, type LigneAlimentForm } from '@/features/comptabilite/forms/lignesAlimentation';
import {
  ligneMarchandiseVide,
  type LigneMarchandiseForm,
} from '@/features/comptabilite/forms/lignesMarchandises';
import { ligneCarburantVide, type LigneCarburantForm } from '@/features/comptabilite/forms/lignesCarburant';
import type {
  ActiviteComptable,
  CategorieDepense,
  CategorieRecette,
  TypeAide,
  TypeFacture,
  TypeFromage,
  UniteVente,
} from '@/features/comptabilite/types';
import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { todayISO } from '@/shared/utils/dates';
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
import { TEXTES } from '@/shared/textes';
import {
  CATEGORIES_DEPENSE_ENTREPRISE,
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  POURCENTAGE_MIN,
  TAUX_TVA_ACHAT_DEFAUT,
  TAUX_TVA_ACHAT_ENTREPRISE_DEFAUT,
  TAUX_TVA_RECETTE_ENTREPRISE,
  TAUX_TVA_CARBURANT,
  TAUX_TVA_VENTE_PAR_CATEGORIE,
  TYPE_AIDE,
  TYPE_ALIMENT,
  TYPE_FACTURE,
  CATEGORIES_VENTE_VIANDE,
  TYPE_FROMAGE,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import {
  COMPTE_PAR_DEPENSE,
  COMPTE_PAR_RECETTE,
  TAUX_IMPOSITION_TYPE_AIDE,
} from '@/shared/constants/planComptable';

/** Taux de TVA proposé pour une recette (celui de la vente de production, 0 pour une aide ou autre). */
const tauxTvaParDefaut = (categorie: CategorieRecette): number =>
  estCategorieVente(categorie) ? TAUX_TVA_VENTE_PAR_CATEGORIE[categorie] : 0;

/** Préfixes des comptes PCG de charges (6…) et de produits (7…) proposés dans les listes. */
const PREFIXE_COMPTES_DEPENSE = '6';
const PREFIXE_COMPTES_RECETTE = '7';

/** État, valeurs calculées et actions du formulaire « Nouvelle écriture » (débit/crédit). */
export function useNouvelleEcriture(typeInitial?: TypeFacture) {
  const router = useRouter();
  const { settings } = useAppSettings();
  // Une entreprise n'a pas d'espèces : ses écritures sont « communes », avec ses propres catégories. La TVA ne
  // s'applique (champ affiché, taux enregistré) que si elle a coché « Assujetti à la TVA » dans ses informations.
  const entreprise = modeEntreprise();
  const tvaEntreprise = entreprise && !!settings.exploitation?.entreprise?.tvaApplicable;
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
  const [date, setDate] = useState(todayISO());
  const [tiers, setTiers] = useState('');
  const [description, setDescription] = useState('');
  const [montant, setMontant] = useState('');
  const [enregistrement, setEnregistrement] = useState(false);
  const [erreur, setErreur] = useState<ErreurSaisie | null>(null);

  // Débit (facture reçue)
  const [categorieDepense, setCategorieDepense] = useState<CategorieDepense>(
    entreprise ? CATEGORIES_DEPENSE_ENTREPRISE[0] : CATEGORIE_DEPENSE.ALIMENTATION,
  );
  const [lignesAlimentation, setLignesAlimentation] = useState<LigneAlimentForm[]>([ligneAlimentVide()]);
  const [lignesMarchandises, setLignesMarchandises] = useState<LigneMarchandiseForm[]>([
    ligneMarchandiseVide(),
  ]);
  const [lignesCarburant, setLignesCarburant] = useState<LigneCarburantForm[]>([ligneCarburantVide()]);
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
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [fournisseurId, setFournisseurId] = useState('');

  // Crédit (facture émise ou vente de production)
  // Première recette de l'espèce courante : le lait pour les chèvres, la charcuterie pour les cochons…
  const [categorieRecette, setCategorieRecette] = useState<CategorieRecette>(
    premiereCategorieRecette(activiteInitiale),
  );
  const [typeFromage, setTypeFromage] = useState<TypeFromage>(TYPE_FROMAGE.FRAIS);
  const [typeFromageLibre, setTypeFromageLibre] = useState('');
  const [quantite, setQuantite] = useState('');
  const [unite, setUnite] = useState<UniteVente>(UNITE_VENTE.PIECE);
  const [poidsKg, setPoidsKg] = useState('');
  const [sacs, setSacs] = useState('');
  const [jeune, setJeune] = useState<boolean | undefined>();
  /** Les fiches des animaux sur pied ou vivants vendus (vide : aucun choisi). */
  const [animaux, setAnimaux] = useState<string[]>([]);
  const [precision, setPrecision] = useState('');
  const [typeAide, setTypeAide] = useState<TypeAide>(TYPE_AIDE.PAIEMENT_BASE);
  const [typeAideLibre, setTypeAideLibre] = useState('');
  const [tauxImpositionLibre, setTauxImpositionLibre] = useState(
    String(TAUX_IMPOSITION_TYPE_AIDE[TYPE_AIDE.PAIEMENT_BASE]),
  );
  const [compteRecetteAutre, setCompteRecetteAutre] = useState(
    COMPTE_PAR_RECETTE[CATEGORIE_RECETTE.AUTRE].numero,
  );
  const [tauxTvaVente, setTauxTvaVente] = useState(
    entreprise
      ? tauxTvaEntreprise(premiereCategorieRecette(activiteInitiale))
      : String(tauxTvaParDefaut(premiereCategorieRecette(especeCourante()))),
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState('');

  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);

  // Les catégories de recette cochées pour chaque espèce : relues à chaque ouverture, et à chaque enregistrement du choix.
  const [versionGroupes, setVersionGroupes] = useState(0);
  useFocusEffect(
    useCallback(() => {
      chargerChoixGroupesRecette().then(() => setVersionGroupes((v) => v + 1));
      listFournisseurs().then(setFournisseurs);
      listClients().then(setClients);
      listComptesPcg().then(setComptes);
    }, []),
  );

  // --- Valeurs calculées ---
  const clientSelectionne = clients.find((c) => c.id === clientId);
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
  const totalMarchandises = totalMontants(lignesMarchandises);
  const totalAlimentation = totalMontants(lignesAlimentation);
  const totalCarburant = totalMontants(lignesCarburant);

  const comptesDepense = comptes.filter((c) => c.numero.startsWith(PREFIXE_COMPTES_DEPENSE));
  const comptesRecette = comptes.filter((c) => c.numero.startsWith(PREFIXE_COMPTES_RECETTE));
  const versOptionCompte = (c: CompteComptableEnregistre) => ({
    value: c.numero,
    label: `${c.numero} — ${c.libelle}`,
    shortLabel: c.numero,
  });
  const optionsCompteDepense = comptesDepense.map(versOptionCompte);
  const optionsCompteRecette = comptesRecette.map(versOptionCompte);

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

  const changerFournisseur = (id: string) => {
    setFournisseurId(id);
    setTiers(fournisseurs.find((f) => f.id === id)?.nomEntreprise ?? '');
  };

  const changerTypeAide = (v: TypeAide) => {
    setTypeAide(v);
    setTauxImpositionLibre(String(v === TYPE_AIDE.AUTRE ? POURCENTAGE_MIN : TAUX_IMPOSITION_TYPE_AIDE[v]));
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
      setTauxTvaVente(String(TAUX_TVA_VENTE_PAR_CATEGORIE[v]));
      rattacherSiCommun();
    } else if (entreprise) {
      setTauxTvaVente(tauxTvaEntreprise(v));
    }
  };

  const changerCategorieDepense = (v: CategorieDepense) => {
    setCategorieDepense(v);
    if (v === CATEGORIE_DEPENSE.ALIMENTATION) rattacherSiCommun();
    // Une entreprise garde le taux choisi (ou l'absence de TVA) ; un élevage a un taux par défaut selon la catégorie.
    if (!entreprise) {
      setTauxTvaAchat(String(v === CATEGORIE_DEPENSE.CARBURANT ? TAUX_TVA_CARBURANT : TAUX_TVA_ACHAT_DEFAUT));
    }
  };

  // Une catégorie ajoutée par l'utilisateur : une recette « autre » dont le compte est celui qu'il a choisi.
  const [categorieAjouteeId, setCategorieAjouteeId] = useState<string | undefined>();
  const categoriesAjouteesActivite =
    activite === ACTIVITE_COMMUNE || entreprise ? [] : categoriesAjouteesEspece(activite);
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

  const enregistrer = async () => {
    setEnregistrement(true);
    try {
      // Un animal sur pied, vivant ou un petit ne se vend pas sans dire lesquels ni leur poids : les fiches du cheptel et le poids
      // sont obligatoires.
      if ((CATEGORIES_VENTE_VIANDE as readonly string[]).includes(categorieRecette)) {
        const archive = await lireArchiveStock();
        const filtre = activite === ACTIVITE_COMMUNE ? undefined : (activite as FiltreStock);
        const ligne = articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, filtre).find(
          (a) => a.libelle === precision,
        );
        if (ligne && roleDeLaViande(ligne.cle)) {
          if (animaux.length === 0) {
            setErreur({
              titre: TEXTES.comptabilite.nouvelleEcriture.animauxRequis,
              message: TEXTES.comptabilite.nouvelleEcriture.animauxRequisMessage,
            });
            return;
          }
          if (!(parseDecimal(poidsKg) > 0)) {
            setErreur({ titre: TEXTES.comptabilite.nouvelleEcriture.poidsRequis });
            return;
          }
        }
      }
      const resultat = construireEcriture({
        activite,
        type,
        date,
        tiers,
        description: description.trim() || categorieAjoutee?.nom || '',
        montant,
        categorieDepense,
        lignesAlimentation,
        lignesMarchandises: estMarchandisesGite ? lignesMarchandises : undefined,
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
        sacs,
        jeune,
        animaux,
        precision,
        clientSelectionne,
        estProductionVente,
        tvaEmise: tvaEntreprise && type === TYPE_FACTURE.EMISE && categorieRecette !== CATEGORIE_RECETTE.AIDE,
      });
      if ('erreur' in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      if ('vente' in resultat) {
        const vente = await enregistrerVente(resultat.vente);
        // Les animaux vendus quittent le cheptel : leur fiche passe en « vendue » à la date de la vente.
        for (const id of idsDesAnimaux(vente))
          await declarerStatutChevre(id, STATUT_CHEVRE.VENDUE, vente.date);
      } else {
        const achat = resultat.facture.lignesMarchandises;
        const enregistree = await enregistrerFacture({
          ...resultat.facture,
          stockApplique: achat?.length ? true : undefined,
        });
        // Un achat de marchandises du gîte augmente le stock de ce qui est acheté ; une facture d'alimentation, celui des aliments.
        await synchroniserStockAchat(undefined, achat, enregistree.date);
        await synchroniserStockAlimentation(enregistree);
      }
      router.back();
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
    setDate,
    description,
    setDescription,
    montant,
    setMontant,
    enregistrement,
    erreur,
    setErreur,
    enregistrer,
    annuler: () => router.back(),
    // débit
    categorieDepense,
    changerCategorieDepense,
    lignesAlimentation,
    setLignesAlimentation,
    lignesMarchandises,
    setLignesMarchandises,
    estMarchandisesGite,
    totalMarchandises,
    lignesCarburant,
    setLignesCarburant,
    totalAlimentation,
    totalCarburant,
    tauxTvaAchat,
    setTauxTvaAchat,
    compteDepenseAutre,
    setCompteDepenseAutre,
    optionsCompteDepense,
    fournisseurs,
    fournisseurId,
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
    sacs,
    setSacs,
    jeune,
    setJeune,
    animaux,
    setAnimaux,
    precision,
    setPrecision,
    groupeRecette: groupeRecette(categorieRecette, activite),
    groupesRecette: groupesRecetteActivite(activite),
    /** Les choix de la liste « Catégorie de recette » : celles d'office, puis celles que l'utilisateur a ajoutées. */
    optionsGroupesRecette: [
      ...groupesRecetteActivite(activite).map((g) => ({
        value: g as string,
        label: LABEL_GROUPE_RECETTE[g],
      })),
      ...categoriesAjouteesActivite.map((c) => ({
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
    // affichage
    compteAffiche,
  };
}

export type EtatNouvelleEcriture = ReturnType<typeof useNouvelleEcriture>;
