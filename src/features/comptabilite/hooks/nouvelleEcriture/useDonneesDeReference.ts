import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { listClients } from '@/features/clients/repository';
import type { Client } from '@/features/clients/types';
import { listComptesPcg, type CompteComptableEnregistre } from '@/features/comptes-pcg/repository';
import { chargerCategoriesRecetteInventaire } from '@/features/comptabilite/repository/categoriesRecetteInventaire';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { lireArchiveStock } from '@/features/stock/repository';
import { comptesDeLInventaire } from '@/features/stock/services/stock';

/**
 * Ce que l'écriture lit à chaque ouverture (et à chaque retour sur l'écran) : les fournisseurs et les clients à choisir, les comptes du plan
 * comptable, ceux des listes de l'inventaire (un achat sur l'un d'eux entre au stock) et la version des catégories de recette de
 * l'inventaire (elle change quand on revient de l'écran qui les règle).
 */
export function useDonneesDeReference() {
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);
  /** Les comptes des listes de l'inventaire : un achat sur l'un d'eux entre au stock. */
  const [comptesInventaire, setComptesInventaire] = useState<string[]>([]);
  // Les listes ajoutées à l'inventaire (35. Produits finis, 33. Produits animaux) : relues à chaque ouverture.
  const [versionGroupes, setVersionGroupes] = useState(0);
  useFocusEffect(
    useCallback(() => {
      chargerCategoriesRecetteInventaire().then(() => setVersionGroupes((v) => v + 1));
      listFournisseurs().then(setFournisseurs);
      listClients().then(setClients);
      listComptesPcg().then(setComptes);
      lireArchiveStock().then((archive) => setComptesInventaire(comptesDeLInventaire(archive)));
    }, []),
  );
  return { fournisseurs, clients, comptes, comptesInventaire, versionGroupes };
}
