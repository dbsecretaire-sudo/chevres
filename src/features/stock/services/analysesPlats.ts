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

/** Les jours entre deux analyses de chaque produit transformé (absent : pas de rappel pour ce produit). */
export interface JoursEntreAnalyses {
  plat?: number;
  savon?: number;
}

/** Un lot est « en stock » tant qu'il n'est ni vendu ni rappelé. */
const enStock = (l: LotFromage): boolean => !l.dateVente && !l.dateRappel;

/**
 * Les analyses de plats préparés et de savons à envoyer à un laboratoire : une par fabrication dont il reste des lots en stock, tous les `jours` jours (l'intervalle
 * que l'utilisateur a réglé d'après ce que lui demande la DDPP, ou l'évaluateur de la sécurité pour un savon) à compter de la stérilisation (de la saponification
 * pour un savon), ou de la dernière analyse notée. Elle est rappelée `JOURS_AVANT_ANALYSE` jours avant son échéance, et en retard une fois passée. Sans intervalle
 * réglé pour le produit, aucun rappel.
 */
export function rappelsAnalysesPlats(
  archive: Pick<ArchiveStock, 'lots' | 'platsFabriques' | 'articles' | 'noms' | 'listes'>,
  jours: JoursEntreAnalyses,
  aujourdhui: string,
): Rappel[] {
  const parFabrication = new Map<string, LotFromage[]>();
  for (const l of archive.lots ?? []) {
    const intervalle = l.article.startsWith(`${GENRE_ARTICLE.SAVON}:`) ? jours.savon : l.article.startsWith(`${GENRE_ARTICLE.PLAT}:`) ? jours.plat : undefined;
    if (!intervalle || intervalle <= 0 || !l.mouvementId || !enStock(l)) continue;
    parFabrication.set(l.mouvementId, [...(parFabrication.get(l.mouvementId) ?? []), l]);
  }
  const limite = ajouterJours(aujourdhui, JOURS_AVANT_ANALYSE);
  const rappels: Rappel[] = [];
  for (const [mouvementId, lots] of parFabrication) {
    const savon = lots[0].article.startsWith(`${GENRE_ARTICLE.SAVON}:`);
    const intervalle = (savon ? jours.savon : jours.plat) as number;
    const fabrication = archive.platsFabriques?.[mouvementId];
    const depart = fabrication?.dateSterilisation ?? fabrication?.dateSaponification ?? lots[0].dateFabrication;
    const derniere = [depart, ...(fabrication?.analyses ?? [])].sort().pop() as string;
    const echeance = ajouterJours(derniere, intervalle);
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
      cible: savon ? ROUTES.PRODUCTION_SAVONS : ROUTES.PRODUCTION_PLATS,
      fabricationId: mouvementId,
    });
  }
  return rappels.sort((a, b) => a.echeance.localeCompare(b.echeance));
}
