import { TYPE_FROMAGE } from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';

/** Le code de fromage d'un article de l'inventaire (« fromage:frais » → « frais ») : un fromage ajouté par l'utilisateur est « autre », avec son nom. */
export function fromageDeLArticle(cle: string, libelle: string): { typeFromage: ValeurDe<typeof TYPE_FROMAGE>; typeFromageLibre?: string } {
  const code = cle.split(':')[1];
  const connu = (Object.values(TYPE_FROMAGE) as string[]).includes(code) && code !== TYPE_FROMAGE.AUTRE;
  return connu ? { typeFromage: code as ValeurDe<typeof TYPE_FROMAGE> } : { typeFromage: TYPE_FROMAGE.AUTRE, typeFromageLibre: libelle };
}
