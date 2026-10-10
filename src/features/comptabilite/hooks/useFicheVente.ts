import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { getVente, saveVente, supprimerVente } from '@/features/comptabilite/repository/ventes';
import { declarerStatutChevre, reactiverChevre } from '@/features/cheptel/repository/chevres';
import { idsDesAnimaux, venteADeclarer } from '@/features/comptabilite/utils/ventes';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { lireArchiveStock } from '@/features/stock/repository';
import { totalDeLaVente } from '@/features/stock/services/stock';
import { roleDuDetailDeVente } from '@/features/comptabilite/utils/animauxVendus';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import type { Vente } from '@/features/comptabilite/types';
import {
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_AVEC_DETAIL,
  CATEGORIES_VENTE_PRIX_INVENTAIRE,
  CATEGORIES_VENTE_VIANDE,
  CATEGORIE_VENTE,
  TYPE_FROMAGE,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import { TEXTES } from '@/shared/textes';

const montantEnTexte = (v: Vente | null | undefined) =>
  v?.prix != null ? String(v.prix).replace('.', ',') : '';

/** État et actions de la fiche d'une vente : chargement, modification (avec tampon de saisie du prix), suppression. */
export function useFicheVente(id: string | undefined) {
  const router = useRouter();

  const [vente, setVente] = useState<Vente | null>(null);
  const [form, setForm] = useState<Vente | null>(null);
  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [montantTexte, setMontantTexte] = useState('');
  const [erreur, setErreur] = useState<{ titre: string; message?: string } | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const v = await getVente(id);
    setVente(v ?? null);
    setForm(v ?? null);
    setMontantTexte(montantEnTexte(v));
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /** L'unité est fixe pour lait/cabris, comme à la création. */
  const changerCategorie = (categorie: Vente['categorie']) => {
    if (!form) return;
    const unite: Vente['unite'] =
      categorie === CATEGORIE_VENTE.LAIT
        ? UNITE_VENTE.LITRES
        : categorie === CATEGORIE_VENTE.OEUFS
          ? UNITE_VENTE.PIECE
          : (CATEGORIES_VENTE_ANIMAUX as readonly string[]).includes(categorie) ||
              (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(categorie)
            ? UNITE_VENTE.PIECE
            : form.unite === UNITE_VENTE.KG
              ? UNITE_VENTE.KG
              : UNITE_VENTE.PIECE;
    // Un autre produit : le détail, les animaux et le fromage choisis pour le précédent ne valent plus (leurs listes diffèrent).
    const change = categorie !== form.categorie;
    setForm({
      ...form,
      categorie,
      unite,
      ...(change
        ? {
            precision: undefined,
            animaux: undefined,
            jeune: undefined,
            ...(categorie === CATEGORIE_VENTE.FROMAGE
              ? {}
              : { typeFromage: undefined, typeFromageLibre: undefined }),
          }
        : {}),
    });
  };

  /** Autorise uniquement des chiffres et une virgule ou un point, et garde le texte saisi tel quel. */
  const changerMontant = (valeur: string) => {
    if (!form || !/^\d*[,.]?\d*$/.test(valeur)) return;
    setMontantTexte(valeur);
    const texte = valeur.replace(',', '.');
    setForm({ ...form, prix: texte === '' || texte === '.' ? undefined : Number(texte) });
  };

  const enregistrerModifications = async () => {
    if (!form) return;

    // La quantité d'une vente de viande (animaux entiers) est le nombre d'animaux choisis : on ne la saisit pas.
    const sansQuantite = form.categorie === CATEGORIE_VENTE.VIANDE;
    if (!sansQuantite && (!form.quantite || form.quantite <= 0)) {
      setErreur({ titre: TEXTES.commun.general.quantiteInvalide });
      return;
    }
    if (
      (CATEGORIES_VENTE_AVEC_DETAIL as readonly string[]).includes(form.categorie) &&
      !form.precision?.trim()
    ) {
      setErreur({ titre: TEXTES.comptabilite.nouvelleEcriture.detailRequis });
      return;
    }
    if (
      form.categorie === CATEGORIE_VENTE.FROMAGE &&
      (!form.typeFromage || (form.typeFromage === TYPE_FROMAGE.AUTRE && !form.typeFromageLibre?.trim()))
    ) {
      setErreur({ titre: TEXTES.comptabilite.nouvelleEcriture.typeFromageRequis });
      return;
    }
    if (!form.client?.trim()) {
      setErreur({ titre: TEXTES.commun.general.clientRequis });
      return;
    }
    // Une vente que le client souhaite déclarer a un numéro de facture.
    if (venteADeclarer(form) && !form.numeroFacture?.trim()) {
      setErreur({ titre: TEXTES.comptabilite.nouvelleEcriture.numeroFactureRequis });
      return;
    }
    if (form.categorie === CATEGORIE_VENTE.VIANDE && !(form.poidsKg && form.poidsKg > 0)) {
      setErreur({ titre: TEXTES.comptabilite.nouvelleEcriture.poidsRequis });
      return;
    }

    // Un animal sur pied, vivant ou un petit ne se vend pas sans dire lesquels : au moins une fiche du cheptel.
    const animauxForm = idsDesAnimaux(form);
    if (
      sansQuantite &&
      animauxForm.length === 0 &&
      (await roleDuDetailDeVente(activiteVente(form), form.precision))
    ) {
      setErreur({
        titre: TEXTES.comptabilite.nouvelleEcriture.animauxRequis,
        message: TEXTES.comptabilite.nouvelleEcriture.animauxRequisMessage,
      });
      return;
    }

    // Le prix total vient de l'inventaire (prix défini × quantité ou × poids) : il n'est jamais saisi.
    const quantite = sansQuantite ? Math.max(1, animauxForm.length) : form.quantite;
    let prix = form.prix;
    if ((CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(form.categorie)) {
      prix = totalDeLaVente({ ...form, quantite }, await lireArchiveStock());
    }
    if (!prix || prix < 0) {
      setErreur(
        (CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(form.categorie)
          ? {
              titre: TEXTES.comptabilite.nouvelleEcriture.prixAFixerTitre,
              message: TEXTES.comptabilite.nouvelleEcriture.prixAFixerMessage,
            }
          : { titre: TEXTES.commun.general.prixInvalide },
      );
      return;
    }

    try {
      const nettoye: Vente = {
        ...form,
        prix,
        quantite,
        client: form.client?.trim() || undefined,
        precision: form.precision?.trim() || undefined,
        numeroFacture: venteADeclarer(form) ? form.numeroFacture?.trim() : undefined,
      };
      await saveVente(nettoye);
      // Les animaux retirés de la vente redeviennent vivants ; ceux de la vente passent « vendus » à sa date.
      if (vente) {
        for (const id of idsDesAnimaux(vente)) if (!animauxForm.includes(id)) await reactiverChevre(id);
      }
      for (const id of animauxForm) await declarerStatutChevre(id, STATUT_CHEVRE.VENDUE, nettoye.date);
      setVente(nettoye);
      setForm(nettoye);
      setEditing(false);
    } catch (error) {
      console.error(error);
      setErreur({
        titre: TEXTES.commun.general.erreur,
        message: TEXTES.commun.general.impossibleDEnregistrerLesModifications,
      });
    }
  };

  const annulerModifications = () => {
    setForm(vente);
    setMontantTexte(montantEnTexte(vente));
    setEditing(false);
  };

  const supprimerDefinitivement = async () => {
    if (!vente) return;
    try {
      await supprimerVente(vente.id);
      // Les animaux de la vente supprimée redeviennent vivants dans le cheptel.
      for (const id of idsDesAnimaux(vente)) await reactiverChevre(id);
      router.back();
    } catch (error) {
      console.error(error);
      setErreur({
        titre: TEXTES.commun.general.erreur,
        message: TEXTES.comptabilite.ficheVente.impossibleDeSupprimerLaVente,
      });
    }
  };

  return {
    vente,
    form,
    setForm,
    editing,
    setEditing,
    menuOuvert,
    setMenuOuvert,
    suppressionOuverte,
    setSuppressionOuverte,
    montantTexte,
    changerMontant,
    changerCategorie,
    enregistrerModifications,
    annulerModifications,
    supprimerDefinitivement,
    erreur,
    setErreur,
  };
}
