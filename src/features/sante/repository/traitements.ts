import { generateId } from '@/shared/utils/id';
import { yearOf } from '@/shared/utils/dates';
import type { Traitement } from '@/features/sante/types';
import type { Chevre } from '@/features/cheptel/types';
import { concerneLaBoucle } from '@/features/cheptel/utils/numerosBoucles';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { deleteRecord, loadAllYears, upsertRecord } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';

/** Un traitement d'après son identifiant (toutes années). */
export async function getTraitement(id: string): Promise<Traitement | undefined> {
  return (await loadAllYears(CATEGORIE_STOCKAGE.TRAITEMENTS)).find((t) => t.id === id);
}

/** Enregistre un traitement ; avec un identifiant, c'est une modification (le traitement change d'année avec sa date). */
export async function enregistrerTraitement(
  input: Omit<Traitement, 'id'> & { id?: string },
): Promise<Traitement> {
  const traitement: Traitement = { ...input, id: input.id ?? generateId(), espece: input.espece ?? especeCourante() };
  if (input.id) {
    const ancien = await getTraitement(input.id);
    if (ancien && yearOf(ancien.date) !== yearOf(traitement.date)) {
      await deleteRecord(CATEGORIE_STOCKAGE.TRAITEMENTS, input.id);
    }
  }
  await upsertRecord(CATEGORIE_STOCKAGE.TRAITEMENTS, yearOf(traitement.date), traitement);
  return traitement;
}

/** Les traitements de toutes les années pour l'espèce courante, du plus récent au plus ancien. */
export async function listTousTraitements(): Promise<Traitement[]> {
  const items = deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.TRAITEMENTS));
  return items.sort((a, b) => (b.dateFin ?? b.date).localeCompare(a.dateFin ?? a.date) || b.date.localeCompare(a.date));
}

export async function supprimerTraitement(id: string): Promise<void> {
  await deleteRecord(CATEGORIE_STOCKAGE.TRAITEMENTS, id);
}

/** Les traitements d'un animal : ceux qui nomment sa boucle, et ceux du troupeau entier. */
export async function listTraitementsPourChevre(chevre: Pick<Chevre, 'numeroBoucle'>): Promise<Traitement[]> {
  const tous = await listTousTraitements();
  return tous.filter((t) => !t.chevreNumeroBoucle?.trim() || concerneLaBoucle(t.chevreNumeroBoucle, chevre.numeroBoucle));
}
