import type { Rappel } from '@/features/rappels/services/rappels';
import type { ArchiveCommercial } from '@/features/commercial/types';
import { ETAPES_ACCUEIL_OBLIGATOIRES } from '@/shared/constants/agritourisme';
import { GENRE_RAPPEL } from '@/shared/constants/rappels';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commercial.agritourisme.accueilPublic;

/** Les démarches obligatoires d'accueil du public qui ne sont pas faites (dans l'ordre de la liste). */
export const etapesAccueilManquantes = (archive: Pick<ArchiveCommercial, 'accueilPublic'>): string[] =>
  ETAPES_ACCUEIL_OBLIGATOIRES.filter((etape) => !archive.accueilPublic?.[etape]?.fait);

/** Vrai quand la ferme reçoit du public : des visites ou des formules d'agritourisme existent. */
export const accueilDuPublic = (archive: Pick<ArchiveCommercial, 'visites' | 'formules'>): boolean =>
  archive.visites.length > 0 || archive.formules.length > 0;

/**
 * Le rappel des démarches d'accueil du public : un seul, tant qu'une démarche obligatoire manque et que la ferme organise des visites. Aucune coche : il se valide en
 * faisant les démarches, dans Agritourisme › Accueil du public.
 */
export function rappelsAccueilPublic(
  archive: Pick<ArchiveCommercial, 'visites' | 'formules' | 'accueilPublic'>,
  aujourdhui: string,
): Rappel[] {
  if (!accueilDuPublic(archive)) return [];
  const manquantes = etapesAccueilManquantes(archive);
  if (manquantes.length === 0) return [];
  return [
    {
      id: GENRE_RAPPEL.ACCUEIL_PUBLIC,
      genre: GENRE_RAPPEL.ACCUEIL_PUBLIC,
      libelle: T.rappel,
      echeance: aujourdhui,
      enRetard: true,
      detail: T.manque(manquantes.map((e) => T.etapes[e as keyof typeof T.etapes].titre).join(', ')),
      cible: ROUTES.COMMERCIAL_ACCUEIL_PUBLIC,
    },
  ];
}
