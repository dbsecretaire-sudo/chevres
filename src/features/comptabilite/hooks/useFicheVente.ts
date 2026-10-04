import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { getVente, saveVente, supprimerVente } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import {
  CATEGORIES_VENTE_ANIMAUX,
  CATEGORIES_VENTE_VIANDE,
  CATEGORIE_VENTE,
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
    setForm({ ...form, categorie, unite });
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

    // La viande et la charcuterie n'ont pas de quantité à saisir.
    const sansQuantite = (CATEGORIES_VENTE_VIANDE as readonly string[]).includes(form.categorie);
    if (!sansQuantite && (!form.quantite || form.quantite <= 0)) {
      setErreur({ titre: TEXTES.commun.general.quantiteInvalide });
      return;
    }
    if (form.categorie !== CATEGORIE_VENTE.LAIT && (!form.prix || form.prix < 0)) {
      setErreur({ titre: TEXTES.commun.general.prixInvalide });
      return;
    }

    try {
      const nettoye: Vente = {
        ...form,
        quantite: sansQuantite ? 1 : form.quantite,
        client: form.client?.trim() || undefined,
        precision: form.precision?.trim() || undefined,
      };
      await saveVente(nettoye);
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
