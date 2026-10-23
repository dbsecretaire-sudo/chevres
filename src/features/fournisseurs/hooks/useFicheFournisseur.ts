import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  enregistrerFournisseur,
  getFournisseur,
  supprimerFournisseur,
} from '@/features/fournisseurs/repository';
import { partagerCoordonneesDuFournisseur } from '@/features/contacts/repository';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import {
  calculerResumeFournisseur,
  facturesDuFournisseur,
  nettoyerFournisseur,
} from '@/features/fournisseurs/services/resumeFournisseur';
import type { Facture } from '@/features/comptabilite/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { TEXTES } from '@/shared/textes';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

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

  /** Enregistré tout seul (`auto`), il ne dit rien d'une saisie incomplète et laisse la fiche en modification. */
  const enregistrerModifications = async (auto = false): Promise<boolean> => {
    if (!form) return false;
    const resultat = nettoyerFournisseur(form, {
      entreprise: TEXTES.commun.general.nomDEntrepriseRequis,
    });
    if ('erreur' in resultat) {
      if (!auto) setErreur(resultat.erreur);
      return false;
    }

    await enregistrerFournisseur(resultat.fournisseur);
    // Son adresse, son téléphone et son e-mail passent à sa fiche client, s'il en a une.
    await partagerCoordonneesDuFournisseur(resultat.fournisseur);
    setFournisseur(resultat.fournisseur);
    if (!auto) {
      setForm(resultat.fournisseur);
      setEditing(false);
    }
    return true;
  };

  // Tout changement de la fiche s'enregistre tout seul.
  useEnregistrementAuto({
    actif: editing,
    signature: JSON.stringify(form),
    enregistrer: () => enregistrerModifications(true),
  });

  const supprimerDefinitivement = async () => {
    if (!fournisseur) return;
    await supprimerFournisseur(fournisseur.id);
    retournerALaPageDAvant(router);
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
    supprimerDefinitivement,
  };
}
