import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import {
  rechercherDossiers,
  resumeParClient,
  type FiltreDossiers,
  type PorteeRecherche,
} from '@/features/dossiers/services/recherche';
import type { ArchiveDossiers } from '@/features/dossiers/types';
import { FILTRE_DOSSIERS } from '@/shared/constants/dossiers';
import { todayISO } from '@/shared/utils/dates';

/** État de la recherche de l'explorateur : les clients, leurs dossiers et contenus, le terme cherché et le filtre. */
export function useExplorateur(portee?: PorteeRecherche) {
  const [clients, setClients] = useState<Client[]>([]);
  const [archive, setArchive] = useState<ArchiveDossiers>({ sousDossiers: [], elements: [] });
  const [requete, setRequete] = useState('');
  const [filtre, setFiltre] = useState<FiltreDossiers>(FILTRE_DOSSIERS.TOUT);

  const charger = useCallback(async () => {
    const [listeClients, donnees] = await Promise.all([listClients(), lireArchiveDossiers()]);
    setClients(listeClients);
    setArchive(donnees);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const clientId = portee?.clientId;
  const dossierId = portee?.dossierId;

  /** Les résultats de la recherche ou du filtre ; undefined quand il n'y en a pas : on montre alors l'écran normal. */
  const resultats = useMemo(
    () => rechercherDossiers({ clients, ...archive }, requete, filtre, todayISO(), { clientId, dossierId }),
    [clients, archive, requete, filtre, clientId, dossierId],
  );
  const resume = useMemo(() => resumeParClient(archive.elements), [archive.elements]);

  return { clients, archive, requete, setRequete, filtre, setFiltre, resultats, resume, recharger: charger };
}

export type EtatExplorateur = ReturnType<typeof useExplorateur>;
