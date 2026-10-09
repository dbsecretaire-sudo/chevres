import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import type { Client } from '@/features/clients/types';
import { NoteAFacturer } from '@/features/dossiers/components/NoteAFacturer';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import { facturerLaNote, lignesDeLaNote, type LigneDeNote } from '@/features/dossiers/services/facturation';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';

interface Props {
  client: Client;
  /** Appelé une fois la note facturée (les recettes créées s'ajoutent aux écritures du client). */
  onFacturee?: () => void;
}

/**
 * La note d'un client, dans sa fiche : ses prestations ajoutées sur la note et pas encore facturées, avec le bouton qui les
 * facture sous un seul numéro. Rien quand la note est vide.
 */
export function NoteDuClient({ client, onFacturee }: Props) {
  const { settings } = useAppSettings();
  const [lignes, setLignes] = useState<LigneDeNote[]>([]);

  const recharger = useCallback(async () => {
    setLignes(lignesDeLaNote((await lireArchiveDossiers()).elements, client.id));
  }, [client.id]);
  useFocusEffect(
    useCallback(() => {
      recharger();
    }, [recharger]),
  );

  const facturer = async (numeroFacture: string, date: string) => {
    await facturerLaNote(client.id, numeroFacture, date, client, settings.exploitation?.entreprise);
    await recharger();
    onFacturee?.();
  };

  return <NoteAFacturer lignes={lignes} onFacturer={facturer} />;
}
