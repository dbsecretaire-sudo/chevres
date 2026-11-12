import type { Chevre } from '@/features/cheptel/types';
import type { PorteeNaissance } from '@/features/cheptel/repository/naissances';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { formatDateFR } from '@/shared/utils/dates';

/** Le texte sans accent ni majuscule, pour qu'un nom tapé sans accent retrouve « Sébastien ». */
const simple = (texte: string): string =>
  texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Vrai quand le petit répond à la recherche : son acheteur, son n° de boucle ou sa date de naissance, ou son sexe si la recherche est « M » ou « F ». */
function petitRetenu(c: Chevre, terme: string, sexe: string | undefined, acheteur: string | undefined): boolean {
  if (sexe) return sexe === (c.sexe === SEXE.FEMELLE ? 'f' : 'm');
  return [acheteur, c.numeroBoucle, c.dateNaissance, formatDateFR(c.dateNaissance)].some((champ) =>
    simple(champ ?? '').includes(terme),
  );
}

/**
 * Les naissances qui répondent à la recherche. Si le n° de la mère répond, toute la mise bas reste ; sinon on n'y montre que les petits
 * qui répondent, et une mise bas sans petit retenu disparaît. `clients` : l'acheteur de chaque petit vendu. Une recherche vide ne filtre pas.
 */
export function filtrerNaissances(
  portees: readonly PorteeNaissance[],
  recherche: string,
  clients: ReadonlyMap<string, string>,
): PorteeNaissance[] {
  const terme = simple(recherche);
  if (!terme) return [...portees];
  // « M » ou « F » tout seuls cherchent le sexe ; une lettre isolée ne doit pas retenir tous les noms qui la contiennent.
  const sexe = terme === 'm' || terme === 'f' ? terme : undefined;
  return portees
    .map((p) => {
      const mereRetenue = !sexe && simple(p.mereNumeroBoucle).includes(terme);
      return { ...p, cabrits: p.cabrits.filter((c) => mereRetenue || petitRetenu(c, terme, sexe, clients.get(c.id))) };
    })
    .filter((p) => p.cabrits.length > 0);
}

/** Le statut des petits demandé : tous, les vivants, ou les vendus. */
export type StatutNaissance = 'tous' | typeof STATUT_CHEVRE.VIVANTE | typeof STATUT_CHEVRE.VENDUE;

/** Les naissances dont les petits ont ce statut : une mise bas sans petit de ce statut disparaît. « Tous » ne filtre pas. */
export function filtrerNaissancesParStatut(portees: readonly PorteeNaissance[], statut: StatutNaissance): PorteeNaissance[] {
  if (statut === 'tous') return [...portees];
  return portees
    .map((p) => ({ ...p, cabrits: p.cabrits.filter((c) => c.statut === statut) }))
    .filter((p) => p.cabrits.length > 0);
}
