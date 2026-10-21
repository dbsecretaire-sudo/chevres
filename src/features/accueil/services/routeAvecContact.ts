import type { Contact } from '@/features/contacts/services/contacts';

/**
 * L'adresse d'une nouvelle écriture, ouverte avec un intervenant déjà choisi dans « Contact » : son fournisseur pour une dépense (`type=recue`), son
 * client pour une recette (`type=emise`) ; sans type dans l'adresse, l'un ou l'autre selon ce qu'est l'intervenant (les deux, s'il est les deux).
 */
export function routeAvecContact(route: string, contact?: Pick<Contact, 'client' | 'fournisseur'>): string {
  if (!contact) return route;
  const recue = /[?&]type=recue(&|$)/.test(route);
  const emise = /[?&]type=emise(&|$)/.test(route);
  const ajouts: string[] = [];
  if (!emise && contact.fournisseur?.id) ajouts.push(`fournisseur=${contact.fournisseur.id}`);
  if (!recue && contact.client?.id) ajouts.push(`client=${contact.client.id}`);
  if (ajouts.length === 0) return route;
  return `${route}${route.includes('?') ? '&' : '?'}${ajouts.join('&')}`;
}
