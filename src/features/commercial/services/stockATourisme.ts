import { besoinsDeLaVisite } from '@/features/commercial/services/stockVisite';
import { commandeOuverte } from '@/features/commercial/services/commandes';
import type { ArchiveCommercial } from '@/features/commercial/types';
import type { Rappel } from '@/features/rappels/services/rappels';
import { libelleArticle, niveauxDeStock } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { STATUT_VISITE } from '@/shared/constants/agritourisme';
import { GENRE_RAPPEL, JOURS_STOCK_A_PREVOIR } from '@/shared/constants/rappels';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';
import { ajouterJours } from '@/shared/utils/calendrier';
import { formatDateShortFR } from '@/shared/utils/dates';

const T = TEXTES.rappels.stockAPrevoir;

interface Besoin {
  article: string;
  quantite: number;
}

const nombre = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');

/** Ce qu'il faut préparer : chaque article avec sa quantité, et ce qui manque en stock (rien quand le stock suffit). */
function detailDesBesoins(
  besoins: readonly Besoin[],
  niveaux: ReadonlyMap<string, number>,
  archive: ArchiveStock,
): { detail: string; manque: boolean } {
  const manques = besoins.filter((b) => (niveaux.get(b.article) ?? 0) < b.quantite);
  const liste = besoins.map((b) => `${nombre(b.quantite)} × ${libelleArticle(b.article, archive)}`).join(', ');
  if (manques.length === 0) return { detail: T.aPreparer(liste), manque: false };
  const absent = manques
    .map((b) => `${nombre(b.quantite - Math.max(0, niveaux.get(b.article) ?? 0))} × ${libelleArticle(b.article, archive)}`)
    .join(', ');
  return { detail: `${T.aPreparer(liste)} · ${T.ilManque(absent)}`, manque: true };
}

/**
 * Les rappels du stock à prévoir pour l'agritourisme : pour chaque visite prévue dans les `JOURS_STOCK_A_PREVOIR` jours qui viennent, ce que sa formule consomme (selon le
 * nombre de participants), et pour chaque commande ouverte à livrer dans ce délai, ses lignes. Chaque rappel dit ce qu'il faut préparer et, en rouge, ce qui manque au
 * stock. Ils se valident une fois la préparation faite (le rappel disparaît).
 */
export function rappelsStockATourisme(
  commercial: Pick<ArchiveCommercial, 'visites' | 'formules' | 'commandes'>,
  stock: ArchiveStock,
  valides: readonly string[],
  aujourdhui: string,
  jours: number = JOURS_STOCK_A_PREVOIR,
): Rappel[] {
  const limite = ajouterJours(aujourdhui, jours);
  const niveaux = niveauxDeStock(stock.mouvements);
  const rappels: Rappel[] = [];
  for (const visite of commercial.visites) {
    if (visite.statut !== STATUT_VISITE.PREVUE || visite.date < aujourdhui || visite.date > limite) continue;
    const formule = commercial.formules.find((f) => f.id === visite.formuleId);
    const besoins = besoinsDeLaVisite(formule, visite.participants);
    if (besoins.length === 0) continue;
    const id = `${GENRE_RAPPEL.STOCK_A_PREVOIR}:visite:${visite.id}@${visite.date}`;
    if (valides.includes(id)) continue;
    const { detail, manque } = detailDesBesoins(besoins, niveaux, stock);
    rappels.push({
      id,
      genre: GENRE_RAPPEL.STOCK_A_PREVOIR,
      libelle: T.visite(visite.client, formatDateShortFR(visite.date), visite.participants),
      echeance: visite.date,
      enRetard: manque,
      detail,
      cible: ROUTES.visiteAgritourisme(visite.id),
    });
  }
  for (const commande of commercial.commandes) {
    const livraison = commande.livraisonPrevue;
    if (!commandeOuverte(commande) || !livraison || livraison < aujourdhui || livraison > limite) continue;
    const parArticle = new Map<string, number>();
    for (const l of commande.lignes) parArticle.set(l.article, (parArticle.get(l.article) ?? 0) + l.quantite);
    const besoins = [...parArticle].map(([article, quantite]) => ({ article, quantite })).filter((b) => b.quantite > 0);
    if (besoins.length === 0) continue;
    const id = `${GENRE_RAPPEL.STOCK_A_PREVOIR}:commande:${commande.id}@${livraison}`;
    if (valides.includes(id)) continue;
    const { detail, manque } = detailDesBesoins(besoins, niveaux, stock);
    rappels.push({
      id,
      genre: GENRE_RAPPEL.STOCK_A_PREVOIR,
      libelle: T.commande(commande.client, formatDateShortFR(livraison)),
      echeance: livraison,
      enRetard: manque,
      detail,
      cible: ROUTES.commande(commande.id),
    });
  }
  return rappels.sort((a, b) => a.echeance.localeCompare(b.echeance));
}
