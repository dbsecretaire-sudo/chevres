import { yearOf } from '@/shared/utils/dates';
import { ageAtteint } from '@/shared/utils/age';
import type { Chevre, Sexe, StatutChevre } from '@/features/cheptel/types';
import { loadAllYears } from '@/shared/storage/localStore';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { SEXE, STATUT_CHEVRE, agePetitMax, DERNIER_MOIS_PREMIER_SEMESTRE } from '@/shared/constants/cheptel';
import { FIN_ANNEE_MOIS_JOUR } from '@/shared/constants/temps';

/** Une date de sortie avec le nombre d'animaux concernés ce jour-là (plusieurs abattages groupés le même jour, par exemple). */
export interface DateEtNombre {
  date: string;
  nombre: number;
}

export interface Bilan {
  annee: number;
  cabritsTotal: number;
  /** Nés au 1er semestre de l'année (naissances tardives, souvent la fin de la campagne N-1). */
  cabritsPremierSemestre: number;
  /** Nés au 2e semestre de l'année (début de la nouvelle campagne). */
  cabritsSecondSemestre: number;
  cabritsRenouvellement: number;
  /** Petits vendus dans l'année qui ont une boucle : ils comptent dans les naissances. */
  cabritsVendusBoucles: number;
  cabritsAbattoir: number;
  cabritsAbattoirDates: DateEtNombre[];
  cabritsAutoconsommes: number;
  cabritsMortNes: number;
  cabritsRestants: number;
  miseBasCount: number;
  chevresMortesAnnee: number;
  chevresAbattoirAnnee: number;
  chevresAbattoirDates: DateEtNombre[];
  /** Chèvres vendues dans l'année qui ont une boucle : déjà retirées du nombre de chèvres. */
  chevresVenduesBouclees: number;
  chevresAutoconsommeesAnnee: number;
  chevresVivantesFinAnnee: number;
  /** Parmi les chèvres vivantes ci-dessus, celles désignées pour le renouvellement cette année-là précisément. */
  chevresRenouvellementFinAnnee: number;
  boucsMortsAnnee: number;
  boucsAbattoirAnnee: number;
  boucsAbattoirDates: DateEtNombre[];
  boucsVendusBoucles: number;
  boucsAutoconsommesAnnee: number;
  boucsVivantsFinAnnee: number;
  /** Parmi les boucs vivants ci-dessus, ceux désignés pour le renouvellement cette année-là précisément. */
  boucsRenouvellementFinAnnee: number;
  stockDebutAnnee: number;
  stockFinAnnee: number;
}

/**
 * Reconstitue un bilan annuel (naissances, sorties, effectif) à partir des statuts actuels
 * du cheptel. L'effectif de fin d'année est un instantané reconstruit (né avant/pendant
 * l'année ET encore présent à la fin de l'année d'après les statuts actuels) : il ne s'agit
 * pas d'un historique figé, donc un changement de statut tardif peut légèrement déplacer
 * un mouvement d'une année à l'autre.
 */
export async function calculerBilan(annee: number): Promise<Bilan> {
  const agePetit = agePetitMax();
  /** Vrai si l'animal avait déjà dépassé l'âge de petit à cette date (voir agePetitMax). */
  const estAdulteLe = (dateNaissance: string, dateRef: string) =>
    ageAtteint(dateNaissance, agePetit, dateRef);
  const avecVendusSansBoucle = deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL));
  // Un animal vendu sans boucle n'est pas identifié : sa naissance (petit ou adulte) n'entre ni dans les naissances ni dans
  // l'effectif du bilan. Sa vente reste comptée à part, « non bouclée », à titre d'information.
  const venduSansBoucle = (c: Chevre) => c.statut === STATUT_CHEVRE.VENDUE && !c.numeroBoucle;
  const toutes = avecVendusSansBoucle.filter((c) => !venduSansBoucle(c));

  const anneeStatut = (c: Chevre) => (c.dateStatut ? yearOf(c.dateStatut) : undefined);
  const neeAvant = (c: Chevre) => yearOf(c.dateNaissance) < annee;
  const finAnnee = `${annee}-${FIN_ANNEE_MOIS_JOUR}`;

  // Cabrits nés pendant l'année civile N (01/01 au 31/12).
  const neeCetteAnnee = (c: Chevre) => yearOf(c.dateNaissance) === annee;

  const cabrits = toutes.filter(neeCetteAnnee);
  const premierSemestre = (c: Chevre) => Number(c.dateNaissance.slice(5, 7)) <= DERNIER_MOIS_PREMIER_SEMESTRE;

  // Sortie comptée comme cabrit : l'animal avait encore moins de l’âge limite du petit au moment de la sortie, et
  // celle-ci a eu lieu pendant l'année N — indépendamment de l'année de naissance (un cabrit né fin
  // N-1 et sorti début N relève du bilan N, pas de celui de sa naissance).
  const sortiCommeCabrit = (c: Chevre) =>
    !!c.dateStatut && anneeStatut(c) === annee && !estAdulteLe(c.dateNaissance, c.dateStatut);

  // Cabrits de la cohorte encore effectivement cabrits au 31/12 (vivants et toujours petits à cette
  // date) — sert de base à « Total cabris », puisque les sorties ci-dessus ne sont plus un sous-
  // ensemble garanti de cette cohorte (elles peuvent venir d'un cabri né l'année précédente).
  const cabritsRestants = cabrits.filter(
    (c) =>
      !estAdulteLe(c.dateNaissance, finAnnee) &&
      (c.statut === STATUT_CHEVRE.VIVANTE || (anneeStatut(c) ?? -Infinity) > annee),
  ).length;

  const porteesCetteAnnee = new Set(
    cabrits.filter((c) => c.mereNumeroBoucle).map((c) => `${c.mereNumeroBoucle}__${c.dateNaissance}`),
  );

  // Sortie comptée comme chèvre/bouc adulte : il fallait déjà avoir dépassé l’âge limite du petit au moment de la sortie —
  // sinon c'est un cabri (même né une année précédente) et sa sortie relève de la carte Cabrits, pas
  // de celle-ci (évite qu'un cabri de fin d'année parti tôt à l'abattoir soit compté comme une chèvre).
  const sortiesPreexistantesListe = (sexe: Sexe, statut: StatutChevre) =>
    toutes.filter(
      (c) =>
        c.sexe === sexe &&
        neeAvant(c) &&
        c.statut === statut &&
        anneeStatut(c) === annee &&
        !!c.dateStatut &&
        estAdulteLe(c.dateNaissance, c.dateStatut),
    );
  const sortiesPreexistantes = (sexe: Sexe, statut: StatutChevre) =>
    sortiesPreexistantesListe(sexe, statut).length;

  // Regroupe par date de sortie, avec le nombre d'animaux concernés chaque jour (plusieurs abattages
  // le même jour sont fréquents) — trié chronologiquement.
  const grouperParDate = (items: Chevre[]): DateEtNombre[] => {
    const compte = new Map<string, number>();
    for (const c of items) {
      if (!c.dateStatut) continue;
      compte.set(c.dateStatut, (compte.get(c.dateStatut) ?? 0) + 1);
    }
    return Array.from(compte.entries())
      .map(([date, nombre]) => ({ date, nombre }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  const stockDebutAnnee = toutes.filter(
    (c) => neeAvant(c) && (c.statut === STATUT_CHEVRE.VIVANTE || (anneeStatut(c) ?? Infinity) >= annee),
  ).length;

  const stockFinAnnee = toutes.filter(
    (c) =>
      yearOf(c.dateNaissance) <= annee &&
      (c.statut === STATUT_CHEVRE.VIVANTE || (anneeStatut(c) ?? -Infinity) > annee),
  ).length;

  // Adultes (âge limite du petit dépassé) d'un sexe donné, vivant(e)s au 31/12 de l'année N, reconstitué comme stockFinAnnee.
  const estAdulteVivantFinAnnee = (sexe: Sexe) => (c: Chevre) =>
    c.sexe === sexe &&
    estAdulteLe(c.dateNaissance, finAnnee) &&
    (c.statut === STATUT_CHEVRE.VIVANTE || (anneeStatut(c) ?? -Infinity) > annee);
  const estChevreVivanteFinAnnee = estAdulteVivantFinAnnee(SEXE.FEMELLE);
  const estBoucVivantFinAnnee = estAdulteVivantFinAnnee(SEXE.MALE);
  const chevresVivantesFinAnnee = toutes.filter(estChevreVivanteFinAnnee).length;
  const boucsVivantsFinAnnee = toutes.filter(estBoucVivantFinAnnee).length;

  // Parmi ces adultes, ceux/celles désigné(e)s pour le renouvellement cette année-là précisément (pas
  // les années précédentes) — le reste étant le troupeau déjà établi, plus ancien.
  const chevresRenouvellementFinAnnee = toutes.filter(
    (c) => estChevreVivanteFinAnnee(c) && c.renouvellement && c.renouvellementAnnee === annee,
  ).length;
  const boucsRenouvellementFinAnnee = toutes.filter(
    (c) => estBoucVivantFinAnnee(c) && c.renouvellement && c.renouvellementAnnee === annee,
  ).length;

  // Basé sur l'année de désignation indiquée par l'utilisateur (renouvellementAnnee), pas sur l'année
  // de naissance : un cabrit né au second semestre peut être désigné l'année suivante.
  const renouvellementDesignes = toutes.filter(
    (c) => c.renouvellement && c.renouvellementAnnee === annee,
  ).length;

  // Un animal vendu passe en « vendue » sur sa fiche quand la vente le désigne : il est compté par son statut, comme avant.
  const venduesAvecBoucle = (sexe: Sexe) =>
    sortiesPreexistantesListe(sexe, STATUT_CHEVRE.VENDUE).filter((c) => !!c.numeroBoucle);

  const cabritsVendusListe = avecVendusSansBoucle.filter(
    (c) => c.statut === STATUT_CHEVRE.VENDUE && sortiCommeCabrit(c),
  );
  const cabritsAbattoirListe = toutes.filter(
    (c) => c.statut === STATUT_CHEVRE.ABATTOIR && sortiCommeCabrit(c),
  );
  const chevresAbattoirListe = sortiesPreexistantesListe(SEXE.FEMELLE, STATUT_CHEVRE.ABATTOIR);
  const boucsAbattoirListe = sortiesPreexistantesListe(SEXE.MALE, STATUT_CHEVRE.ABATTOIR);

  return {
    annee,
    cabritsTotal: cabrits.length,
    cabritsPremierSemestre: cabrits.filter(premierSemestre).length,
    cabritsSecondSemestre: cabrits.filter((c) => !premierSemestre(c)).length,
    cabritsRenouvellement: renouvellementDesignes,
    cabritsVendusBoucles: cabritsVendusListe.filter((c) => !!c.numeroBoucle).length,
    cabritsAbattoir: cabritsAbattoirListe.length,
    cabritsAbattoirDates: grouperParDate(cabritsAbattoirListe),
    cabritsAutoconsommes: toutes.filter(
      (c) => c.statut === STATUT_CHEVRE.AUTOCONSOMMEE && sortiCommeCabrit(c),
    ).length,
    cabritsMortNes: cabrits.filter((c) => c.statut === STATUT_CHEVRE.MORT_NE).length,
    cabritsRestants,
    miseBasCount: porteesCetteAnnee.size,
    chevresMortesAnnee: sortiesPreexistantes(SEXE.FEMELLE, STATUT_CHEVRE.MORTE),
    chevresAbattoirAnnee: chevresAbattoirListe.length,
    chevresAbattoirDates: grouperParDate(chevresAbattoirListe),
    chevresVenduesBouclees: venduesAvecBoucle(SEXE.FEMELLE).length,
    chevresAutoconsommeesAnnee: sortiesPreexistantes(SEXE.FEMELLE, STATUT_CHEVRE.AUTOCONSOMMEE),
    chevresVivantesFinAnnee,
    chevresRenouvellementFinAnnee,
    boucsMortsAnnee: sortiesPreexistantes(SEXE.MALE, STATUT_CHEVRE.MORTE),
    boucsAbattoirAnnee: boucsAbattoirListe.length,
    boucsAbattoirDates: grouperParDate(boucsAbattoirListe),
    boucsVendusBoucles: venduesAvecBoucle(SEXE.MALE).length,
    boucsAutoconsommesAnnee: sortiesPreexistantes(SEXE.MALE, STATUT_CHEVRE.AUTOCONSOMMEE),
    boucsVivantsFinAnnee,
    boucsRenouvellementFinAnnee,
    stockDebutAnnee,
    stockFinAnnee,
  };
}
