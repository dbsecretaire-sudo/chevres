import type { EnlevementEquarrissage, LotAnimaux } from '@/features/settings/settings';
import { numerosDeBoucles } from '@/features/cheptel/utils/numerosBoucles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR } from '@/shared/utils/dates';

/** La catégorie des anciens lots d'équarrissage (ils n'existent plus : un enlèvement a sa propre fiche, sous Équarrissage). */
const ANCIENNE_CATEGORIE_EQUARRISSAGE = 'equarrissage';

/**
 * Les anciens lots d'équarrissage deviennent des enlèvements : le jour, l'équarrisseur, le n° du bon, les boucles et le bon (les fichiers) sont repris, le lot disparaît.
 * Rend les lots sans eux et la liste des enlèvements complétée — rien quand il n'y avait aucun ancien lot.
 */
export function enlevementsDepuisLesLots(
  lots: readonly LotAnimaux[],
  enlevements: readonly EnlevementEquarrissage[],
): { lots: LotAnimaux[]; enlevements: EnlevementEquarrissage[] } | null {
  const anciens = lots.filter((l) => l.categorie === ANCIENNE_CATEGORIE_EQUARRISSAGE);
  if (anciens.length === 0) return null;
  const deja = new Set(enlevements.map((e) => e.id));
  const nouveaux: EnlevementEquarrissage[] = anciens
    .filter((l) => !deja.has(l.id))
    .map((l) => ({
      id: l.id,
      date: l.dateEnlevement ?? '',
      boucles: l.boucles,
      contactCle: l.contactCle,
      numeroBon: l.numeroBon,
      fichiers: l.fichiers && l.fichiers.length > 0 ? l.fichiers : undefined,
    }));
  return { lots: lots.filter((l) => l.categorie !== ANCIENNE_CATEGORIE_EQUARRISSAGE), enlevements: [...enlevements, ...nouveaux] };
}

/** Les enlèvements qui n'ont pas encore leur bon (aucun fichier joint) : rappelés à l'accueil tant qu'il manque. */
export const enlevementsSansBon = (enlevements: readonly EnlevementEquarrissage[] | undefined): EnlevementEquarrissage[] =>
  (enlevements ?? []).filter((e) => (e.fichiers ?? []).length === 0);

/** Du plus récent au plus ancien (un enlèvement sans date en dernier). */
export const enlevementsRecentsDabord = (enlevements: readonly EnlevementEquarrissage[] | undefined): EnlevementEquarrissage[] =>
  [...(enlevements ?? [])].sort((a, b) => b.date.localeCompare(a.date));

/** Le nom d'un enlèvement dans les listes : « Enlèvement du 12/03/2026 », avec son n° de bon quand il est connu. */
export const titreDeLEnlevement = (e: Pick<EnlevementEquarrissage, 'date' | 'numeroBon'>): string => {
  const T = TEXTES.exploitation.enlevements;
  const base = e.date ? T.enlevementDu(formatDateFR(e.date)) : T.enlevementSansDate;
  return e.numeroBon ? `${base} · ${T.bonNumero(e.numeroBon)}` : base;
};

/** Ce qu'un enlèvement change sur la fiche d'un animal : son statut et son jour (« Équarrissage le … »), ou son retrait de l'enlèvement (le statut reste). */
export interface ChangementAnimalEnleve {
  id: string;
  /** Vrai : l'animal est pris par l'enlèvement (mort, au jour de l'enlèvement) ; faux : il en est retiré (le statut reste, le lien s'efface). */
  enleve: boolean;
}

/**
 * Les animaux dont la fiche change quand l'enlèvement passe de `avant` à `apres` (`avant` absent : un nouvel enlèvement) : ceux qu'il prend (statut mort, jour de l'enlèvement), ceux dont le
 * jour change avec lui, et ceux qu'il ne prend plus. Un animal déjà à jour n'en fait pas partie.
 */
export function changementsDesAnimauxEnleves(
  avant: Pick<EnlevementEquarrissage, 'id' | 'date' | 'boucles'> | undefined,
  apres: Pick<EnlevementEquarrissage, 'id' | 'date' | 'boucles'> | null,
  animaux: readonly { id: string; numeroBoucle?: string; statut: string; dateStatut?: string; enlevementId?: string }[],
): ChangementAnimalEnleve[] {
  const boucles = new Set(numerosDeBoucles(apres?.boucles ?? ''));
  const changes: ChangementAnimalEnleve[] = [];
  for (const a of animaux) {
    const numero = a.numeroBoucle?.trim();
    const dedans = !!apres && !!numero && boucles.has(numero);
    const aLui = a.enlevementId === (avant?.id ?? apres?.id);
    if (dedans) {
      const dejaAJour = a.statut === 'morte' && a.enlevementId === apres.id && a.dateStatut === apres.date;
      if (!dejaAJour) changes.push({ id: a.id, enleve: true });
    } else if (aLui) {
      changes.push({ id: a.id, enleve: false });
    }
  }
  return changes;
}
