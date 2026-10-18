import type { Client } from '@/features/clients/types';
import type { Fournisseur } from '@/features/fournisseurs/types';
import type { SelectOption } from '@/shared/components/SelectModal';
import { categorieClientDe } from '@/shared/dictionnaire/categoriesClient';
import { categorieFournisseurDe } from '@/shared/dictionnaire/categoriesFournisseur';
import { nomComplet } from '@/shared/utils/personne';

/** Un client dans une liste de choix : rangé sous sa catégorie (Particulier, Abattoir, Élevage…), avec `parCategories` la liste commence par elles. */
export const optionClient = (c: Client): SelectOption<string> => ({
  value: c.id,
  label: nomComplet(c),
  groupe: categorieClientDe(c.categorie).nom,
});

/** Un fournisseur dans une liste de choix : rangé sous sa catégorie (Vétérinaire, Abattoir, Élevage…). */
export const optionFournisseur = (f: Fournisseur): SelectOption<string> => ({
  value: f.id,
  label: f.nomEntreprise,
  groupe: categorieFournisseurDe(f.categorie).nom,
});
