import { useCallback, useState } from 'react';
import {
  ligneProductionVide,
  lignesProductionFinales,
  versLignesProductionForm,
  type LigneProductionForm,
} from '@/features/comptabilite/forms/lignesProduction';
import {
  lignesChambreFinales,
  lignesChambreParDefaut,
  versLignesChambreForm,
  type LigneChambreForm,
} from '@/features/comptabilite/forms/lignesChambre';
import { lignesVeterinaireRetenues } from '@/features/comptabilite/forms/lignesVeterinaire';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { delierLaFactureDuLot } from '@/features/lots-animaux/services/departDAnimaux';
import { retirerLesLotsDAbattoir } from '@/features/lots-animaux/services/lotsSansFacture';
import { retirerStockAlimentation, synchroniserStockAlimentation } from '@/features/stock/services/stock';
import { lireArchiveStock } from '@/features/stock/repository';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { erreurAchatBoucles } from '@/features/stock/services/boucles';
import {
  retirerVisiteFacture,
  synchroniserVisiteFacture,
} from '@/features/sante/services/visitesFacture';
import {
  enregistrerFacture,
  getFacture,
  supprimerFacture,
} from '@/features/comptabilite/repository/factures';
import { listComptesPcg, type CompteComptableEnregistre } from '@/features/comptes-pcg/repository';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import { listClients } from '@/features/clients/repository';
import {
  lignesAlimentationFinales,
  versLignesAlimentationForm,
  type LigneAlimentForm,
} from '@/features/comptabilite/forms/lignesAlimentation';
import {
  lignesCarburantFinales,
  versLignesCarburantForm,
  type LigneCarburantForm,
} from '@/features/comptabilite/forms/lignesCarburant';
import type { ActiviteComptable, Facture } from '@/features/comptabilite/types';
import { activiteFacture } from '@/features/comptabilite/utils/activite';
import { typesAlimentEspece } from '@/features/comptabilite/utils/alimentation';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import {
  CATEGORIE_DEPENSE,
  CATEGORIE_RECETTE,
  TYPE_ALIMENT,
  TYPE_FACTURE,
} from '@/shared/constants/comptabilite';
import { COMPTE_PAR_DEPENSE, COMPTE_PAR_RECETTE } from '@/shared/constants/planComptable';
import { totalMontants } from '@/shared/utils/nombres';
import { nomComplet } from '@/shared/utils/personne';
import { getChevre, reactiverChevre } from '@/features/cheptel/repository/chevres';
import { idsDesAnimauxEnvoyes } from '@/features/comptabilite/utils/ventes';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { TEXTES } from '@/shared/textes';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

const montantEnTexte = (f: Facture) => String(f.montant).replace('.', ',');

/** État et actions de la fiche d'une facture : chargement, modification (lignes, tiers, TVA), suppression. */
export function useFicheFacture(id: string | undefined) {
  const router = useRouter();
  const { settings, patchSettings } = useAppSettings();

  const [facture, setFacture] = useState<Facture | null>(null);
  const [form, setForm] = useState<Facture | null>(null);
  const [lignes, setLignes] = useState<LigneAlimentForm[]>([]);
  const [lignesCarburant, setLignesCarburant] = useState<LigneCarburantForm[]>([]);
  const [lignesProduction, setLignesProduction] = useState<LigneProductionForm[]>([]);
  const [lignesChambre, setLignesChambre] = useState<LigneChambreForm[]>([]);
  /** Une facture de la Chambre d'agriculture saisie sans détail : on choisit de la détailler par article. */
  const [detaillerChambre, setDetaillerChambre] = useState(false);
  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);
  const [montantTexte, setMontantTexte] = useState('');
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<{ titre: string; message?: string } | null>(null);

  const estAlimentation = facture?.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION;
  const estCarburant = facture?.categorieDepense === CATEGORIE_DEPENSE.CARBURANT;
  /** Un achat de production : le détail par fourniture (une ancienne facture n'a qu'un article, repris comme première fourniture). */
  const estProduction = facture?.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION;
  /** Une dépense « Autre » détaillée par article de la Chambre d'agriculture (les anciennes factures gardent un seul montant). */
  const estChambre =
    facture?.categorieDepense === CATEGORIE_DEPENSE.AUTRE &&
    ((facture.lignesChambre?.length ?? 0) > 0 || detaillerChambre);
  /** Activité affichée dans le formulaire (celle de la facture, ou celle déduite pour les anciennes factures). */
  const activiteForm: ActiviteComptable = form ? activiteFacture(form) : especeCourante();
  /** Une dépense offerte par le fournisseur (un cadeau) : ses lignes dont le bouton « Cadeau » est actif comptent 0 € (ni la Chambre, ni le carburant). */
  const offerteLignes = !!form?.offert && !estChambre && !estCarburant;
  const totalAlimentation = totalMontants(lignes, offerteLignes);
  const totalCarburant = totalMontants(lignesCarburant);
  const totalProduction = totalMontants(lignesProduction, offerteLignes);
  /** Le total d'une facture de la Chambre : ses articles, plus les boucles qu'elle commande. */
  const totalChambre = totalMontants(lignesChambre) + totalProduction;

  const charger = useCallback(async () => {
    if (!id) return;
    const f = await getFacture(id);
    setFacture(f ?? null);
    setForm(f ?? null);
    setLignes(f ? versLignesAlimentationForm(f) : []);
    setLignesCarburant(f ? versLignesCarburantForm(f) : []);
    // Une facture de la Chambre n'a de boucles que celles qu'elle a commandées (sinon, une ligne vide, pas son montant entier).
    const detailleeParChambre =
      f?.categorieDepense === CATEGORIE_DEPENSE.AUTRE && (f.lignesChambre?.length ?? 0) > 0;
    setLignesProduction(
      f
        ? detailleeParChambre && !f.lignesProduction?.length
          ? [ligneProductionVide()]
          : versLignesProductionForm(f)
        : [],
    );
    setLignesChambre(f ? versLignesChambreForm(f) : []);
    setDetaillerChambre(false);
    setMontantTexte(f ? montantEnTexte(f) : '');
    setComptes(await listComptesPcg());
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
      listFournisseurs().then(setFournisseurs);
      listClients().then(setClients);
    }, [charger]),
  );

  const changerActivite = (activite: ActiviteComptable) => {
    setForm((prev) => (prev ? { ...prev, activite } : prev));
    // Les lignes d'alimentation passent au premier aliment de la nouvelle espèce si le leur n'en fait pas partie.
    const types = typesAlimentEspece(activite === ACTIVITE_COMMUNE ? especeCourante() : activite);
    setLignes((prev) =>
      prev.map((l) =>
        l.activite || l.type === TYPE_ALIMENT.AUTRE || types.includes(l.type) ? l : { ...l, type: types[0] },
      ),
    );
  };

  const choisirFournisseur = (fournisseurId: string) => {
    const fournisseur = fournisseurs.find((f) => f.id === fournisseurId);
    setForm((prev) => (prev ? { ...prev, tiers: fournisseur?.nomEntreprise ?? '' } : prev));
  };

  const choisirClient = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    setForm((prev) => (prev ? { ...prev, tiers: client ? nomComplet(client) : '' } : prev));
  };

  const changerTauxTva = (valeur: string) => {
    setForm((prev) => (prev ? { ...prev, tauxTva: valeur === '' ? undefined : Number(valeur) } : prev));
  };

  /** Garde le texte tel que saisi (virgule comprise) et n'en déduit le montant qu'à part. */
  const changerMontant = (valeur: string) => {
    if (!form || !/^\d*[,.]?\d*$/.test(valeur)) return;
    setMontantTexte(valeur);
    const texte = valeur.replace(',', '.');
    setForm({ ...form, montant: texte === '' || texte === '.' ? 0 : Number(texte) || 0 });
  };

  /** Enregistré tout seul (`auto`), il ne dit rien d'une saisie incomplète et laisse la fiche en modification. */
  const enregistrerModifications = async (auto = false): Promise<boolean> => {
    if (!form) return false;
    const refuser = (e: { titre: string; message?: string }) => {
      if (!auto) setErreur(e);
      return false;
    };

    if (!form.tiers.trim()) {
      return refuser({
        titre:
          form.type === TYPE_FACTURE.RECUE
            ? TEXTES.commun.general.fournisseurRequis
            : TEXTES.commun.general.clientRequis,
      });
    }

    let aEnregistrer = form;
    /** Dépense offerte sans détail par ligne : son bouton « Cadeau » (actif d'office) la compte 0 €. */
    let montantOfferte = false;

    if (estAlimentation) {
      const lignesFinales = lignesAlimentationFinales(lignes, activiteForm, offerteLignes);
      if (lignesFinales.length === 0) {
        return refuser({
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        });
      }
      aEnregistrer = { ...form, montant: totalAlimentation, lignesAlimentation: lignesFinales };
    } else if (estCarburant) {
      const lignesRetenues = lignesCarburantFinales(lignesCarburant);
      if (lignesRetenues.length === 0) {
        return refuser({
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontantPour,
        });
      }
      aEnregistrer = { ...form, montant: totalCarburant, lignesCarburant: lignesRetenues };
    } else if (estProduction) {
      const lignesRetenues = lignesProductionFinales(lignesProduction, offerteLignes);
      if (lignesRetenues.length === 0) {
        return refuser({
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        });
      }
      if (lignesRetenues.some((l) => l.article && !(l.quantite && l.quantite > 0))) {
        return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.stockProduction.quantiteRequise });
      }
      // Le détail remplace l'article unique des anciennes factures.
      aEnregistrer = {
        ...form,
        montant: totalProduction,
        lignesProduction: lignesRetenues,
        stockArticle: undefined,
        stockQuantite: undefined,
        bouclesDebut: undefined,
      };
    } else if (estChambre) {
      const lignesRetenues = lignesChambreFinales(lignesChambre);
      if (lignesRetenues.length === 0) {
        return refuser({
          titre: TEXTES.commun.general.montantInvalide,
          message: TEXTES.commun.general.ajoutezAuMoinsUnMontant,
        });
      }
      // Les boucles commandées avec la facture entrent à l'inventaire ; sans elles, l'ancien détail par fourniture est retiré.
      const boucles = lignesProductionFinales(lignesProduction);
      if (boucles.some((l) => l.article && !(l.quantite && l.quantite > 0))) {
        return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.stockProduction.quantiteRequise });
      }
      aEnregistrer = {
        ...form,
        montant: [...lignesRetenues, ...boucles].reduce((total, l) => total + l.montant, 0),
        lignesChambre: lignesRetenues,
        lignesProduction: boucles.length > 0 ? boucles : undefined,
        stockArticle: undefined,
        stockQuantite: undefined,
        bouclesDebut: undefined,
      };
    } else {
      montantOfferte = offerteLignes && form.cadeauMontant !== false;
      if (montantOfferte) aEnregistrer = { ...form, montant: 0 };
      else if (!form.montant || form.montant <= 0) return refuser({ titre: TEXTES.commun.general.montantInvalide });
    }
    // Offerte : le montant sans détail est offert, ou au moins une ligne l'est (le bouton « Cadeau » du formulaire n'est jamais enregistré).
    const aDesOfferts =
      montantOfferte ||
      [
        ...(aEnregistrer.lignesAlimentation ?? []),
        ...(aEnregistrer.lignesProduction ?? []),
      ].some((l) => l.offert);
    aEnregistrer = { ...aEnregistrer, offert: offerteLignes && aDesOfferts ? true : undefined, cadeauMontant: undefined };

    if (aEnregistrer.stockArticle && !(aEnregistrer.stockQuantite && aEnregistrer.stockQuantite > 0)) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.stockProduction.quantiteRequise });
    }
    if (
      aEnregistrer.categorieDepense === CATEGORIE_DEPENSE.VETERINAIRE &&
      aEnregistrer.visiteVeterinaire &&
      !aEnregistrer.motifVisite?.trim()
    ) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.visite.motifRequis });
    }
    // Les lignes « ce qui a été fait » d'une dépense vétérinaire : celles qui disent un acte ou un traitement seulement.
    aEnregistrer = { ...aEnregistrer, lignesVeterinaire: lignesVeterinaireRetenues(aEnregistrer) };
    const erreurBoucles = erreurAchatBoucles(await lireArchiveStock(), aEnregistrer);
    if (erreurBoucles) {
      return refuser({ titre: erreurBoucles });
    }

    try {
      await enregistrerFacture(aEnregistrer);
      await synchroniserStockAlimentation(aEnregistrer);
      await synchroniserVisiteFacture(aEnregistrer);
      setFacture(aEnregistrer);
      if (!auto) {
        setForm(aEnregistrer);
        setEditing(false);
      }
      return true;
    } catch (error) {
      console.error(error);
      return refuser({
        titre: TEXTES.commun.general.erreur,
        message: TEXTES.commun.general.impossibleDEnregistrerLesModifications,
      });
    }
  };

  // Tout changement de la fiche s'enregistre tout seul.
  useEnregistrementAuto({
    actif: editing,
    signature: JSON.stringify([
      form,
      lignes,
      lignesCarburant,
      lignesProduction,
      lignesChambre,
    ]),
    enregistrer: () => enregistrerModifications(true),
  });

  const supprimerDefinitivement = async () => {
    if (!facture) return;
    try {
      await supprimerFacture(facture.id);
      // Un lot d'abattoir lié à cette facture n'a plus de raison d'être : il disparaît, et ses animaux (hors vente) reviennent vivants.
      const lotsActuels = settings.exploitation?.lots ?? [];
      // Un lot créé au départ des animaux (avec son document de circulation) survit à sa facture : il attend simplement d'être refacturé.
      const lies = lotsActuels.filter((l) => l.abattoir && !l.depart && l.factureId === facture.id);
      const departs = lotsActuels.some((l) => l.depart && l.factureId === facture.id);
      if (lies.length > 0 || departs) {
        const restants = lies.length > 0 ? (await retirerLesLotsDAbattoir(lotsActuels, lies)).lots : lotsActuels;
        await patchSettings({
          exploitation: { ...settings.exploitation, lots: delierLaFactureDuLot(restants, facture.id) },
        });
      }
      // Les animaux envoyés avec la dépense reviennent vivants dans le cheptel — sauf ceux d'un lot de départ, qui restent à l'abattoir.
      for (const id of facture.lotId ? [] : idsDesAnimauxEnvoyes(facture)) {
        if ((await getChevre(id))?.statut === STATUT_CHEVRE.ABATTOIR) await reactiverChevre(id);
      }
      await retirerVisiteFacture(facture.id);
      await retirerStockAlimentation(facture.id);
      retournerALaPageDAvant(router);
    } catch (error) {
      console.error(error);
      setErreur({
        titre: TEXTES.commun.general.erreur,
        message: TEXTES.comptabilite.ficheFacture.impossibleDeSupprimerLaFacture,
      });
    }
  };

  /** Compte PCG de la facture : fixe selon la catégorie, ou choisi à la main pour « Autre ». */
  const compteAffiche = !facture
    ? undefined
    : facture.categorieDepense
      ? facture.categorieDepense === CATEGORIE_DEPENSE.AUTRE && facture.compteManuel
        ? (comptes.find((c) => c.numero === facture.compteManuel) ??
          COMPTE_PAR_DEPENSE[CATEGORIE_DEPENSE.AUTRE])
        : COMPTE_PAR_DEPENSE[facture.categorieDepense]
      : facture.categorieRecette
        ? (facture.categorieRecette === CATEGORIE_RECETTE.AUTRE ||
            facture.categorieRecette === CATEGORIE_RECETTE.HEBERGEMENT) &&
          facture.compteManuel
          ? (comptes.find((c) => c.numero === facture.compteManuel) ??
            COMPTE_PAR_RECETTE[facture.categorieRecette])
          : COMPTE_PAR_RECETTE[facture.categorieRecette]
        : undefined;

  return {
    facture,
    form,
    setForm,
    lignes,
    setLignes,
    lignesCarburant,
    setLignesCarburant,
    lignesProduction,
    setLignesProduction,
    lignesChambre,
    setLignesChambre,
    estChambre,
    totalChambre,
    /** Détaille une facture de la Chambre d'agriculture par article (les articles habituels, à compléter). */
    detaillerChambreAgriculture: () => {
      setLignesChambre(lignesChambreParDefaut());
      setLignesProduction([ligneProductionVide()]);
      setDetaillerChambre(true);
    },
    estProduction,
    totalProduction,
    fournisseurs,
    clients,
    montantTexte,
    estAlimentation,
    estCarburant,
    activiteForm,
    changerActivite,
    totalAlimentation,
    totalCarburant,
    compteAffiche,
    editing,
    setEditing,
    menuOuvert,
    setMenuOuvert,
    suppressionOuverte,
    setSuppressionOuverte,
    erreur,
    setErreur,
    choisirFournisseur,
    choisirClient,
    changerTauxTva,
    changerMontant,
    enregistrerModifications,
    supprimerDefinitivement,
  };
}

export type EtatFicheFacture = ReturnType<typeof useFicheFacture>;
