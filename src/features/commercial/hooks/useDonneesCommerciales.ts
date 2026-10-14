import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { listToutesVentes, listVentes } from '@/features/comptabilite/repository/ventes';
import type { Vente } from '@/features/comptabilite/types';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';

/** Les ventes de l'année choisie (ou de toutes les années) et les clients : ce dont les écrans du volet Commercial se nourrissent. */
export function useDonneesCommerciales() {
  const { settings, setAnneeActive, choisirToutesAnnees } = useAppSettings();
  const regrouper = !!settings.toutesAnnees;
  const [annees, setAnnees] = useState<number[]>([settings.anneeActive]);
  const [ventes, setVentes] = useState<Vente[]>([]);
  /** Toutes les ventes de toutes les années : le jour de la dernière vente d'un client ne dépend pas de l'année regardée. */
  const [toutesVentes, setToutesVentes] = useState<Vente[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      Promise.all([
        toutesLesAnneesConnues(),
        listToutesVentes(),
        regrouper ? undefined : listVentes(settings.anneeActive),
        listClients(),
      ]).then(([listeAnnees, toutes, deLAnnee, listeClients]) => {
        if (!actif) return;
        setAnnees(listeAnnees);
        setToutesVentes(toutes);
        setVentes(deLAnnee ?? toutes);
        setClients(listeClients);
      });
      return () => {
        actif = false;
      };
    }, [settings.anneeActive, regrouper]),
  );

  return {
    annee: settings.anneeActive,
    annees,
    regrouper,
    setAnneeActive,
    choisirToutesAnnees,
    ventes,
    toutesVentes,
    clients,
  };
}
