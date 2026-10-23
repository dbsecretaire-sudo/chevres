import type { Client } from '@/features/clients/types';
import { categorieDuClient } from '@/features/clients/services/categorie';
import { nomComplet } from '@/shared/utils/personne';

/** Le paramètre « categorie » d'un lien de fiche client : une ou plusieurs catégories de contact, séparées par une virgule. */
export const PARAMETRE_CATEGORIES = 'categorie';

/** Les catégories d'un lien (« entreprise,surface_commerciale ») ; rien quand le lien n'en donne pas : tous les contacts. */
export function categoriesDuLien(parametre: string | string[] | undefined): string[] | undefined {
  const brut = Array.isArray(parametre) ? parametre[0] : parametre;
  const ids = (brut ?? '').split(',').map((c) => c.trim()).filter(Boolean);
  return ids.length > 0 ? ids : undefined;
}

/** Le lien d'une page du commerce (chiffre d'affaires, commandes, tarifs) limitée aux contacts de ces catégories. */
export const lienPourCategories = (route: string, categories: readonly string[]): string =>
  categories.length > 0 ? `${route}?${PARAMETRE_CATEGORIES}=${categories.join(',')}` : route;

/** Les ventes (ou les commandes) dont le contact est d'une de ces catégories : on le retrouve par sa fiche, ou à défaut par son nom. Sans catégories : tout. */
export function deCesCategories<T extends { client?: string; clientId?: string }>(
  lignes: readonly T[],
  clients: readonly Pick<Client, 'id' | 'nom' | 'prenom' | 'categorie'>[],
  categories: readonly string[] | undefined,
): T[] {
  if (!categories) return [...lignes];
  const parId = new Map(clients.map((c) => [c.id, c]));
  const parNom = new Map(clients.map((c) => [nomComplet(c), c]));
  return lignes.filter((l) => {
    const fiche = (l.clientId ? parId.get(l.clientId) : undefined) ?? (l.client ? parNom.get(l.client) : undefined);
    return !!fiche && categories.includes(categorieDuClient(fiche));
  });
}
