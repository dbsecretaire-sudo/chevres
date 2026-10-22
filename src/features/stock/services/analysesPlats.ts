import type { Rappel } from '@/features/rappels/services/rappels';
import { libelleArticle } from '@/features/stock/services/stock';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { GENRE_RAPPEL, JOURS_AVANT_ANALYSE } from '@/shared/constants/rappels';
import { GENRE_ARTICLE } from '@/shared/constants/stock';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { ajouterJours } from '@/shared/utils/calendrier';
import { formatDateShortFR } from '@/shared/utils/dates';

const T = TEXTES.rappels.analysesPlats;

/** Un plat est « en stock » tant que son lot n'est ni vendu ni rappelé. */
const enStock = (l: LotFromage): boolean => !l.dateVente && !l.dateRappel;

/**
 * Les analyses de plats préparés à envoyer à un laboratoire : une par fabrication dont il reste des lots en stock, tous les `jours` jours (l'intervalle que
 * l'utilisateur a réglé d'après ce que lui demande la DDPP) à compter de la stérilisation, ou de la dernière analyse notée. Elle est rappelée `JOURS_AVANT_ANALYSE`
 * jours avant son échéance, et en retard une fois passée. Sans intervalle réglé, aucun rappel.
 */
export function rappelsAnalysesPlats(
  archive: Pick<ArchiveStock, 'lots' | 'platsFabriques' | 'articles' | 'noms' | 'listes'>,
  jours: number | undefined,
  aujourdhui: string,
): Rappel[] {
  if (!jours || jours <= 0) return [];
  const parFabrication = new Map<string, LotFromage[]>();
  for (const l of archive.lots ?? []) {
    if (!l.article.startsWith(`${GENRE_ARTICLE.PLAT}:`) || !l.mouvementId || !enStock(l)) continue;
    parFabrication.set(l.mouvementId, [...(parFabrication.get(l.mouvementId) ?? []), l]);
  }
  const limite = ajouterJours(aujourdhui, JOURS_AVANT_ANALYSE);
  const rappels: Rappel[] = [];
  for (const [mouvementId, lots] of parFabrication) {
    const fabrication = archive.platsFabriques?.[mouvementId];
    const depart = fabrication?.dateSterilisation ?? lots[0].dateFabrication;
    const derniere = [depart, ...(fabrication?.analyses ?? [])].sort().pop() as string;
    const echeance = ajouterJours(derniere, jours);
    if (echeance > limite) continue;
    const numeros = lots.map((l) => l.numero).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    rappels.push({
      id: `${GENRE_RAPPEL.ANALYSE_PLAT}:${mouvementId}:${echeance}`,
      genre: GENRE_RAPPEL.ANALYSE_PLAT,
      libelle: T.libelle(libelleArticle(lots[0].article, archive as ArchiveStock)),
      echeance,
      enRetard: echeance < aujourdhui,
      detail: (echeance < aujourdhui ? T.enRetard : T.avant)(
        formatDateShortFR(echeance),
        numeros.length === 1 ? numeros[0] : `${numeros[0]} … ${numeros[numeros.length - 1]}`,
      ),
      cible: ROUTES.PRODUCTION_PLATS,
      fabricationId: mouvementId,
    });
  }
  return rappels.sort((a, b) => a.echeance.localeCompare(b.echeance));
}
