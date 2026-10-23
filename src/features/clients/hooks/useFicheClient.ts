import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { enregistrerClient, getClient, supprimerClient } from '@/features/clients/repository';
import { partagerCoordonneesDuClient } from '@/features/contacts/repository';
import {
  calculerResumeClient,
  ecrituresDuClient,
  filtrerParClient,
} from '@/features/clients/services/resumeClient';
import type { Client } from '@/features/clients/types';
import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import type { Facture, Vente } from '@/features/comptabilite/types';
import { useEnregistrementAuto } from '@/shared/hooks/useEnregistrementAuto';
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';
import { retournerALaPageDAvant } from '@/shared/navigation/retourAvant';

/** État et actions de la fiche d'un client : chargement, écritures liées et résumé, modification, suppression. */
export function useFicheClient(id: string | undefined) {
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [form, setForm] = useState<Client | null>(null);
  const [ventes, setVentes] = useState<Vente[]>([]);
  const [factures, setFactures] = useState<Facture[]>([]);

  const [editing, setEditing] = useState(false);
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [suppressionOuverte, setSuppressionOuverte] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  const charger = useCallback(async () => {
    if (!id) return;
    const c = await getClient(id);
    setClient(c ?? null);
    setForm(c ?? null);
    if (!c) {
      setVentes([]);
      setFactures([]);
      return;
    }
    const [toutesVentes, toutesFactures] = await Promise.all([listToutesVentes(), listToutesFactures()]);
    const duClient = filtrerParClient(nomComplet(c), toutesVentes, toutesFactures);
    setVentes(duClient.ventes);
    setFactures(duClient.factures);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const ecritures = useMemo(() => ecrituresDuClient(ventes, factures), [ventes, factures]);
  const resume = useMemo(
    () => calculerResumeClient(ventes, factures, ecritures),
    [ventes, factures, ecritures],
  );

  /** Enregistré tout seul (`auto`), il ne dit rien d'une saisie incomplète et laisse la fiche en modification. */
  const enregistrerModifications = async (auto = false): Promise<boolean> => {
    if (!form) return false;
    if (!form.nom.trim()) {
      if (!auto) setErreur(TEXTES.commun.general.nomRequis);
      return false;
    }

    const nettoye: Client = {
      ...form,
      nom: form.nom.trim(),
      prenom: form.prenom?.trim() || undefined,
      telephone: form.telephone?.trim() || undefined,
      email: form.email?.trim() || undefined,
      adressePostale: form.adressePostale?.trim() || undefined,
    };
    await enregistrerClient(nettoye);
    // Son adresse, son téléphone et son e-mail passent à sa fiche fournisseur, s'il en a une.
    await partagerCoordonneesDuClient(nettoye);
    setClient(nettoye);
    if (!auto) {
      setForm(nettoye);
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
    if (!client) return;
    await supprimerClient(client.id);
    retournerALaPageDAvant(router);
  };

  return {
    client,
    form,
    setForm,
    ecritures,
    resume,
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
    recharger: charger,
  };
}
