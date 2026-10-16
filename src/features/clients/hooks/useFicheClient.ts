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
import { nomComplet } from '@/shared/utils/personne';
import { TEXTES } from '@/shared/textes';

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

  const enregistrerModifications = async () => {
    if (!form) return;
    if (!form.nom.trim()) return setErreur(TEXTES.commun.general.nomRequis);

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
    setForm(nettoye);
    setEditing(false);
  };

  const annulerModifications = () => {
    setForm(client);
    setEditing(false);
  };

  const supprimerDefinitivement = async () => {
    if (!client) return;
    await supprimerClient(client.id);
    router.back();
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
    annulerModifications,
    supprimerDefinitivement,
    recharger: charger,
  };
}
