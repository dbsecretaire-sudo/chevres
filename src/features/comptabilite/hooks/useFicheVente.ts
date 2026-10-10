import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { getVente, saveVente, supprimerVente } from '@/features/comptabilite/repository/ventes';
import { declarerStatutChevre, reactiverChevre } from '@/features/cheptel/repository/chevres';
import {
  idsDesAnimaux,
  sortieDesAnimauxDeLaVente,
  venteADeclarer,
} from '@/features/comptabilite/utils/ventes';
import { activiteVente } from '@/features/comptabilite/utils/activite';
import { lireArchiveStock } from '@/features/stock/repository';
import { totalDeLaVente } from '@/features/stock/services/stock';
import { fromagesRequis } from '@/features/stock/services/lots';
import { roleDuDetailDeVente } from '@/features/comptabilite/utils/animauxVendus';
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
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
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

  /** Enregistré tout seul (`auto`), il ne dit rien d'une saisie incomplète et laisse la fiche en modification. */
  const enregistrerModifications = async (auto = false): Promise<boolean> => {
    if (!form) return false;
    const refuser = (e: { titre: string; message?: string }) => {
      if (!auto) setErreur(e);
      return false;
    };

    // La quantité d'une vente de viande (animaux entiers) est le nombre d'animaux choisis : on ne la saisit pas.
    const sansQuantite = form.categorie === CATEGORIE_VENTE.VIANDE;
    if (!sansQuantite && (!form.quantite || form.quantite <= 0)) {
      return refuser({ titre: TEXTES.commun.general.quantiteInvalide });
    }
    if (
      (CATEGORIES_VENTE_AVEC_DETAIL as readonly string[]).includes(form.categorie) &&
      !form.precision?.trim()
    ) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.detailRequis });
    }
    if (
      form.categorie === CATEGORIE_VENTE.FROMAGE &&
      (!form.typeFromage || (form.typeFromage === TYPE_FROMAGE.AUTRE && !form.typeFromageLibre?.trim()))
    ) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.typeFromageRequis });
    }
    if (!form.client?.trim()) {
      return refuser({ titre: TEXTES.commun.general.clientRequis });
    }
    // Un fromage qui a des lots en stock se vend lot par lot : on les désigne.
    if (fromagesRequis(await lireArchiveStock(), form)) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.lotsRequis });
    }
    // Une vente que le client souhaite déclarer a un numéro de facture.
    if (venteADeclarer(form) && !form.numeroFacture?.trim()) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.numeroFactureRequis });
    }
    if (form.categorie === CATEGORIE_VENTE.VIANDE && !(form.poidsKg && form.poidsKg > 0)) {
      return refuser({ titre: TEXTES.comptabilite.nouvelleEcriture.poidsRequis });
    }

    // Un animal sur pied, vivant ou un petit ne se vend pas sans dire lesquels : au moins une fiche du cheptel.
    const animauxForm = idsDesAnimaux(form);
    if (
      sansQuantite &&
      animauxForm.length === 0 &&
      (await roleDuDetailDeVente(activiteVente(form), form.precision))
    ) {
      return refuser({
        titre: TEXTES.comptabilite.nouvelleEcriture.animauxRequis,
        message: TEXTES.comptabilite.nouvelleEcriture.animauxRequisMessage,
      });
    }

    // Le prix total vient de l'inventaire (prix défini × quantité ou × poids) : il n'est jamais saisi.
    const quantite = sansQuantite ? Math.max(1, animauxForm.length) : form.quantite;
    let prix = form.prix;
    if ((CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(form.categorie)) {
      prix = totalDeLaVente({ ...form, quantite }, await lireArchiveStock());
    }
    if (!prix || prix < 0) {
      return refuser(
        (CATEGORIES_VENTE_PRIX_INVENTAIRE as readonly string[]).includes(form.categorie)
          ? {
              titre: TEXTES.comptabilite.nouvelleEcriture.prixAFixerTitre,
              message: TEXTES.comptabilite.nouvelleEcriture.prixAFixerMessage,
            }
          : { titre: TEXTES.commun.general.prixInvalide },
      );
    }

    try {
      const nettoye: Vente = {
        ...form,
        prix,
        quantite,
        client: form.client?.trim() || undefined,
        precision: form.precision?.trim() || undefined,
        numeroFacture: venteADeclarer(form) ? form.numeroFacture?.trim() : undefined,
        // Pas de date d'abattoir quand la vente n'est pas déclarée : l'animal passe en « morte ».
        dateAbattoir: venteADeclarer(form) ? form.dateAbattoir : undefined,
      };
      await saveVente(nettoye);
      // Les animaux retirés de la vente redeviennent vivants ; ceux de la vente passent « vendus » à sa date.
      if (vente) {
        for (const id of idsDesAnimaux(vente)) if (!animauxForm.includes(id)) await reactiverChevre(id);
      }
      // Les animaux vendus : « abattoir » pour une vente de viande déclarée (à la date d'abattoir), « morte » si elle ne l'est pas, « vendus » sinon.
      const sortie = sortieDesAnimauxDeLaVente(nettoye);
      for (const id of animauxForm) await declarerStatutChevre(id, sortie.statut, sortie.date);
      setVente(nettoye);
      if (!auto) {
        setForm(nettoye);
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
    signature: JSON.stringify(form),
    enregistrer: () => enregistrerModifications(true),
  });

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
    supprimerDefinitivement,
    erreur,
    setErreur,
  };
}
