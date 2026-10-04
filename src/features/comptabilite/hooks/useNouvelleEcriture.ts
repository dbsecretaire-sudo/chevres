import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { enregistrerFacture } from '@/features/comptabilite/repository/factures';
import { enregistrerVente } from '@/features/comptabilite/repository/ventes';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import { listClients } from '@/features/clients/repository';
import { listComptesPcg, type CompteComptableEnregistre } from '@/features/comptes-pcg/repository';
import { construireEcriture, type ErreurSaisie } from '@/features/comptabilite/forms/construireEcriture';
import { ligneAlimentVide, type LigneAlimentForm } from '@/features/comptabilite/forms/lignesAlimentation';
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
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { totalMontants } from '@/shared/utils/nombres';
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
  TYPE_FACTURE,
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

  useFocusEffect(
    useCallback(() => {
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
      lignes.map((l) => (l.activite || types.includes(l.type) ? l : { ...l, type: types[0] })),
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

  const enregistrer = async () => {
    setEnregistrement(true);
    try {
      const resultat = construireEcriture({
        activite,
        type,
        date,
        tiers,
        description,
        montant,
        categorieDepense,
        lignesAlimentation,
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
        precision,
        clientSelectionne,
        estProductionVente,
        tvaEmise: tvaEntreprise && type === TYPE_FACTURE.EMISE && categorieRecette !== CATEGORIE_RECETTE.AIDE,
      });
      if ('erreur' in resultat) {
        setErreur(resultat.erreur);
        return;
      }
      if ('vente' in resultat) await enregistrerVente(resultat.vente);
      else await enregistrerFacture(resultat.facture);
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
    precision,
    setPrecision,
    groupeRecette: groupeRecette(categorieRecette, activite),
    groupesRecette: groupesRecetteActivite(activite),
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
