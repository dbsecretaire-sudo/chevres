import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  enregistrerFournisseur,
  getFournisseur,
  supprimerFournisseur,
} from '@/features/fournisseurs/repository';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import {
  calculerResumeFournisseur,
  facturesDuFournisseur,
  nettoyerFournisseur,
} from '@/features/fournisseurs/services/resumeFournisseur';
import type { Facture } from '@/features/comptabilite/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { TEXTES } from '@/shared/textes';

/** État et actions de la fiche d'un fournisseur : chargement, modification, suppression, factures liées. */
export function useFicheFournisseur(id: string | undefined) {
  const router = useRouter();

  const [fournisseur, setFournisseur] = useState<Fournisseur | null>(null);
  const [form, setForm] = useState<Fournisseur | null>(null);
  const [ecritures, setEcritures] = useState<Facture[]>([]);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const f = await getFournisseur(id);
    setFournisseur(f ?? null);
    setForm(f ?? null);
    setEcritures(f ? facturesDuFournisseur(f, await listToutesFactures()) : []);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const enregistrerModifications = async () => {
    if (!form) return;
    const resultat = nettoyerFournisseur(form, {
      nom: TEXTES.commun.general.nomRequis,
      entreprise: TEXTES.commun.general.nomDEntrepriseRequis,
      siret: TEXTES.commun.general.siretRequis,
      adresse: TEXTES.commun.general.adressePostaleRequise,
    });
    if ('erreur' in resultat) return setErreur(resultat.erreur);

    await enregistrerFournisseur(resultat.fournisseur);
    setFournisseur(resultat.fournisseur);
    setForm(resultat.fournisseur);
    setEditing(false);
  };

  const annulerModifications = () => {
    setForm(fournisseur);
    setEditing(false);
  };

  const supprimerDefinitivement = async () => {
    if (!fournisseur) return;
    await supprimerFournisseur(fournisseur.id);
    router.back();
  };

  return {
    fournisseur,
    form,
    setForm,
    ecritures,
    resume: calculerResumeFournisseur(ecritures),
    editing,
    setEditing,
    menuOuvert,
    setMenuOuvert,
    suppressionOuverte,
    setSuppressionOuverte,
    erreur,
    setErreur,
    enregistrerModifications,
    annulerModifications,
    supprimerDefinitivement,
  };
}
