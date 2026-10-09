import { useCallback, useMemo, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { lireArchiveDossiers } from '@/features/dossiers/repository';
import {
  contenusDeLAnnee,
  rechercherDossiers,
  resumeParClient,
  type FiltreDossiers,
  type PorteeRecherche,
} from '@/features/dossiers/services/recherche';
import type { ArchiveDossiers } from '@/features/dossiers/types';
import { FILTRE_DOSSIERS } from '@/shared/constants/dossiers';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { currentYear, todayISO } from '@/shared/utils/dates';

/**
 * État de la recherche de l'explorateur : les clients, leurs dossiers et contenus, le terme cherché et le filtre. Les contenus
 * affichés sont ceux de l'année active (leur date ou leur échéance y tombe), ou tous avec « Tout » : `archiveAffichee`. `archive`
 * garde tout (la note à facturer d'un client, par exemple, ne dépend pas de l'année).
 */
export function useExplorateur(portee?: PorteeRecherche) {
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const toutesAnnees = !!settings.toutesAnnees;
  const annee = settings.anneeActive;
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
  const archiveAffichee = useMemo<ArchiveDossiers>(
    () => ({
      sousDossiers: archive.sousDossiers,
      elements: contenusDeLAnnee(archive.elements, toutesAnnees ? undefined : annee),
    }),
    [archive, annee, toutesAnnees],
  );
  const resultats = useMemo(
    () =>
      rechercherDossiers({ clients, ...archiveAffichee }, requete, filtre, todayISO(), {
        clientId,
        dossierId,
      }),
    [clients, archiveAffichee, requete, filtre, clientId, dossierId],
  );
  const resume = useMemo(() => resumeParClient(archiveAffichee.elements), [archiveAffichee.elements]);
  /** Les années proposées : celles des contenus (date, échéance), l'année en cours et l'année active. */
  const annees = useMemo(
    () => [
      ...new Set(
        [
          currentYear(),
          annee,
          ...archive.elements.flatMap((e) => [
            Number(e.date.slice(0, 4)),
            Number((e.echeance ?? '').slice(0, 4)),
          ]),
        ].filter((a) => Number.isFinite(a) && a > 0),
      ),
    ],
    [archive.elements, annee],
  );

  /** Les contenus que l'année active cache : la recherche et les listes ne les montrent pas, l'écran le dit (« tout voir »). */
  const masques = archive.elements.length - archiveAffichee.elements.length;

  return {
    clients,
    archive,
    masques,
    archiveAffichee,
    requete,
    setRequete,
    filtre,
    setFiltre,
    resultats,
    resume,
    annee,
    annees,
    toutesAnnees,
    setAnneeActive,
    choisirToutesAnnees,
    recharger: charger,
  };
}

export type EtatExplorateur = ReturnType<typeof useExplorateur>;
