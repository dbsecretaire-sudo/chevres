import { useCallback, useMemo } from 'react';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { categoriesDuContact, listesAvecCategorie } from '@/features/contacts/services/fiche';
import { categoriesClient } from '@/shared/dictionnaire/categoriesClient';
import { categoriesFournisseur } from '@/shared/dictionnaire/categoriesFournisseur';

/**
 * Les catégories d'un contact : les listes des clients et des fournisseurs réunies (une ligne par identifiant), les identifiants que
 * chaque côté connaît, et de quoi ajouter à l'une ou l'autre liste la catégorie qu'on vient de choisir, pour qu'elle vaille des deux côtés.
 */
export function useCategoriesContact() {
  const { settings, patchSettings } = useAppSettings();
  const clients = categoriesClient();
  const fournisseurs = categoriesFournisseur();

  const categories = useMemo(() => categoriesDuContact(fournisseurs, clients), [fournisseurs, clients]);
  const idsConnus = useMemo(
    () => ({ client: clients.map((c) => c.id), fournisseur: fournisseurs.map((c) => c.id) }),
    [clients, fournisseurs],
  );

  /** Ajoute la catégorie à la liste des clients ou à celle des fournisseurs qui ne la connaît pas encore. */
  const assurerCategorie = useCallback(
    async (id: string) => {
      const categorie = categories.find((c) => c.id === id);
      if (!categorie) return;
      const listes = listesAvecCategorie(categorie, clients, fournisseurs);
      if (!listes.modifiees) return;
      await patchSettings({
        exploitation: {
          ...settings.exploitation,
          categoriesClient: listes.clients,
          categoriesFournisseur: listes.fournisseurs,
        },
      });
    },
    [categories, clients, fournisseurs, patchSettings, settings.exploitation],
  );

  return { categories, idsConnus, assurerCategorie };
}
