import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import { listNaissancesGroupees, type PorteeNaissance } from '@/features/cheptel/repository/naissances';
import type { Chevre } from '@/features/cheptel/types';
import { compteAuxDocuments } from '@/features/cheptel/utils/compteAuxDocuments';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { getSettings, type InfosExploitation, type LotAnimaux } from '@/features/settings/settings';
import { estTiptag } from '@/features/cheptel/utils/tiptag';
import { lireArchiveStock } from '@/features/stock/repository';
import { numerosTiptag } from '@/features/stock/services/boucles';
import { chevresAyantAvorte } from '@/features/exploitation/services/lotsAnnuels';
import {
  boucleDesFemellesALaReproduction,
  bouclesDuLot,
  lotsDeReproduction,
} from '@/features/exploitation/services/lots';
import { FORMAT_EXPORT } from '@/shared/constants/export';
import { SEXE, STATUT_CHEVRE, agePetitMax } from '@/shared/constants/cheptel';
import { ageAtteint } from '@/shared/utils/age';
import { categorieFournisseurDe } from '@/shared/dictionnaire/categoriesFournisseur';
import { CATEGORIE_FOURNISSEUR } from '@/shared/constants/fournisseurs';
import { capitaliser, especeCourante, vocabulaire, type Vocabulaire } from '@/shared/dictionnaire/animaux';
import { TEXTES } from '@/shared/textes';

const C = TEXTES.cheptel.naissances.carnet;

/** Un petit mort avant ce nombre de jours est mort dans sa première semaine. */
const JOURS_PREMIERE_SEMAINE = 7;
/** L'âge (en jours) du sevrage : un petit mort après la première semaine et avant celui-ci est mort avant le sevrage, après c'est avant son départ. */
const JOURS_SEVRAGE = 90;

/** Les lignes d'une page A4 : le carnet papier déplié fait une moitié d'A4 et en compte 16, la page A4 en a donc 32. */
export const LIGNES_PAR_PAGE = 32;
/**
 * Les lignes d'une double page du livret, comme le carnet papier : le tableau s'étend sur les deux pages face à face (à gauche la date, les
 * n° du petit, de la mère et du père et le sexe ; à droite les observations, l'âge de départ ou de mort et le poids), 16 lignes de 7,6 mm
 * qui se retrouvent d'une page à l'autre, avec le titre, l'en-tête et la légende dans les 148 mm de hauteur moins les marges.
 */
export const LIGNES_PAR_PAGE_LIVRET = 16;

/**
 * Le carnet en feuilles A4 à ranger dans un classeur, ou en livret A6 : des feuilles A4 en portrait de quatre pages par face, à imprimer
 * recto verso, à couper en deux et à plier (comme le carnet papier, qui ouvert fait la moitié d'un A4).
 */
export type FormatCarnet = 'a4' | 'livret';

/** Une ligne du carnet : une mise bas (la mère et tous ses petits). Le père reste à écrire à la main. */
export interface LigneCabri {
  date: string;
  numero: string;
  mere: string;
  sexe: string;
  observations: string;
  age: string;
  /** Le poids de départ des petits (kg), quand l'abattoir l'a donné. */
  poids: string;
}

/** Le jour et le mois d'une date ISO, comme sur le carnet papier (l'année est celle du tableau) : 05/03. */
const jourEtMois = (iso: string): string => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;

/** Le nombre de jours entre deux dates ISO (YYYY-MM-DD). */
function joursEntre(debut: string, fin: string): number {
  const [a, m, j] = debut.split('-').map(Number);
  const [a2, m2, j2] = fin.split('-').map(Number);
  return Math.round((Date.UTC(a2, m2 - 1, j2) - Date.UTC(a, m - 1, j)) / 86400000);
}

/** L'âge au départ ou à la mort : en jours, puis en mois dès qu'il dépasse deux mois. */
const ageTexte = (jours: number): string => (jours < 60 ? C.jours(jours) : C.mois(Math.round(jours / 30)));

/**
 * Un petit parti après le 31 décembre de l'année de sa naissance, à un âge où il n'est plus un petit (la chevrette gardée, partie à
 * l'abattoir dix-neuf mois plus tard) : ce départ (et son poids) n'est pas dans le carnet de cette année. Un cabri parti à l'abattoir
 * encore petit y est, même en janvier ou février de l'année d'après.
 */
const departTardif = (c: Chevre): boolean =>
  !!c.dateStatut &&
  c.dateStatut > `${c.dateNaissance.slice(0, 4)}-12-31` &&
  ageAtteint(c.dateNaissance, agePetitMax(), c.dateStatut);

/**
 * Un petit est parti ou mort : il a un statut de sortie et une date qui compte dans le carnet (dans l'année de sa naissance, ou plus tard mais encore petit ;
 * voir departTardif).
 */
const estParti = (c: Chevre): boolean =>
  c.statut !== STATUT_CHEVRE.VIVANTE &&
  c.statut !== STATUT_CHEVRE.MORT_NE &&
  !!c.dateStatut &&
  !departTardif(c);

/** Ce qu'est devenu un petit (mort-né, mort, vendu…) et son âge à ce moment-là ; rien quand il est toujours là. */
function devenirDuCabri(
  c: Chevre,
  tiptags: ReadonlySet<string> = new Set(),
): { devenir: string; age: string } {
  // Un petit mort n'a pas d'observation : l'âge de départ / mort suffit.
  const devenir =
    c.statut === STATUT_CHEVRE.MORT_NE
      ? C.statuts.mortNe
      : estParti(c) && c.statut !== STATUT_CHEVRE.MORTE
        ? (C.statuts as Record<string, string>)[c.statut]
        : '';
  // Règle d'or : un cabri à tiptag est destiné à l'abattoir, noté « A » même avant son départ.
  const destine = !devenir && c.statut === STATUT_CHEVRE.VIVANTE && estTiptag(c, tiptags);
  return {
    devenir: destine ? (C.statuts as Record<string, string>)[STATUT_CHEVRE.ABATTOIR] : devenir,
    age: estParti(c) ? ageTexte(joursEntre(c.dateNaissance, c.dateStatut!)) : '',
  };
}

const lettreDuSexe = (c: Chevre): string => (c.sexe === SEXE.FEMELLE ? 'F' : c.sexe === SEXE.MALE ? 'M' : '');

/**
 * La ligne d'une mise bas : sa date, la mère, et ses petits sur la même ligne — leurs boucles et leurs sexes réunis par « + » (M + F + F).
 * Ce que sont devenus les petits (mort, vendu) et leur âge s'écrivent à la suite ; avec plusieurs petits, chacun est précédé de sa boucle.
 */
export function ligneDeLaPortee(p: PorteeNaissance, tiptags: ReadonlySet<string> = new Set()): LigneCabri {
  const plusieurs = p.cabrits.length > 1;
  const parPetit = p.cabrits.map((c) => ({ c, ...devenirDuCabri(c, tiptags) }));
  const texte = (valeur: (x: (typeof parPetit)[number]) => string): string =>
    parPetit
      .map((x) => ({ x, v: valeur(x) }))
      .filter((e) => e.v)
      .map((e) => (plusieurs && e.x.c.numeroBoucle ? `${e.x.c.numeroBoucle} : ${e.v}` : e.v))
      // Plusieurs petits : une ligne par boucle (une seule valeur : rien ne change).
      .join('\n');
  // Un cabri à tiptag est destiné à l'abattoir : il n'est pas de ceux du renouvellement.
  const renouvellement = p.cabrits.some((c) => c.renouvellement && !estTiptag(c, tiptags))
    ? C.renouvellement
    : '';
  return {
    date: jourEtMois(p.date),
    numero: p.cabrits
      .map((c) => c.numeroBoucle || '')
      .filter(Boolean)
      .join('\n'),
    mere: p.mereNumeroBoucle || C.inconnue,
    sexe: p.cabrits.map(lettreDuSexe).filter(Boolean).join(' + '),
    observations: [texte((x) => x.devenir), renouvellement].filter(Boolean).join(' · '),
    age: texte((x) => x.age),
    poids: texte((x) => (x.c.poidsKg !== undefined && !departTardif(x.c) ? C.poidsKg(x.c.poidsKg) : '')),
  };
}

/** Les mises bas d'une année, une par ligne : de la plus ancienne à la plus récente d'après la date de naissance (le n° de la mère n'entre pas dans le tri : à date égale, l'ordre de saisie est gardé). */
export function lignesDeLAnnee(
  portees: PorteeNaissance[],
  tiptags: ReadonlySet<string> = new Set(),
): LigneCabri[] {
  return [...portees].sort((a, b) => a.date.localeCompare(b.date)).map((p) => ligneDeLaPortee(p, tiptags));
}

/** Les lignes coupées en pages de 32 ; la dernière page est complétée de lignes vides, où écrire à la main les naissances suivantes. */
export function pagesDeLignes(lignes: LigneCabri[], parPage = LIGNES_PAR_PAGE): LigneCabri[][] {
  const vide: LigneCabri = { date: '', numero: '', mere: '', sexe: '', observations: '', age: '', poids: '' };
  const pages: LigneCabri[][] = [];
  for (let i = 0; i < Math.max(lignes.length, 1); i += parPage) {
    const page = lignes.slice(i, i + parPage);
    while (page.length < parPage) page.push(vide);
    pages.push(page);
  }
  return pages;
}

/**
 * L'ordre des pages d'un livret de n pages (complétées au multiple de 4) sur des feuilles imprimées recto verso et pliées en deux : pour
 * chaque face, la page de gauche puis celle de droite (numérotées depuis 0). Une feuille a deux faces : la première pose la dernière page
 * à gauche et la première à droite, la seconde la deuxième à gauche et l'avant-dernière à droite, et ainsi de suite vers le milieu.
 */
export function ordreDuLivret(pages: number): [number, number][] {
  const total = Math.ceil(Math.max(pages, 1) / 4) * 4;
  const faces: [number, number][] = [];
  for (let k = 0; k < total / 4; k++) {
    faces.push([total - 1 - 2 * k, 2 * k]);
    faces.push([2 * k + 1, total - 2 - 2 * k]);
  }
  return faces;
}

/** Le mois à partir duquel les naissances sont « de fin d'année » (juillet) : celles d'avant sont « de début d'année ». */
const MOIS_FIN_D_ANNEE = 7;

/**
 * Les pages des petits d'une année : d'abord celles des naissances du début d'année, puis une page vide (des lignes à écrire à la main :
 * naissances hors saison, rattrapage), puis celles des naissances de fin d'année. Chaque groupe commence sur une page neuve.
 */
export function pagesDeLAnnee(
  portees: PorteeNaissance[],
  parPage = LIGNES_PAR_PAGE,
  tiptags: ReadonlySet<string> = new Set(),
): LigneCabri[][] {
  const debut = portees.filter((p) => Number(p.date.slice(5, 7)) < MOIS_FIN_D_ANNEE);
  const fin = portees.filter((p) => Number(p.date.slice(5, 7)) >= MOIS_FIN_D_ANNEE);
  return [
    ...pagesDeLignes(lignesDeLAnnee(debut, tiptags), parPage),
    ...pagesDeLignes([], parPage),
    ...(fin.length > 0 ? pagesDeLignes(lignesDeLAnnee(fin, tiptags), parPage) : []),
  ];
}

/**
 * Les faces des feuilles A4 du livret A6 : chaque feuille A4 porte deux feuilles A5 (coupées en deux après l'impression), et chaque
 * feuille A5 deux pages A6 par face. Pour chaque face A4 : la feuille A5 du haut et celle du bas, chacune avec sa page de gauche puis sa
 * page de droite (numérotées depuis 0). Le recto puis le verso de chaque feuille A4 se suivent (impression recto verso, retourner sur le
 * bord long) ; la dernière feuille A4 peut n'avoir que celle du haut.
 */
export function facesA4DuLivret(pages: number): { haut: [number, number]; bas?: [number, number] }[] {
  const a5 = ordreDuLivret(pages);
  const faces: { haut: [number, number]; bas?: [number, number] }[] = [];
  for (let i = 0; i * 4 < a5.length; i++) {
    faces.push({ haut: a5[4 * i], bas: a5[4 * i + 2] });
    faces.push({ haut: a5[4 * i + 1], bas: a5[4 * i + 3] });
  }
  return faces;
}

/** Les mises bas sans les petits sans boucle (mort-nés compris, auto-consommés exceptés) : ils ne figurent pas dans le carnet ; une mise bas sans aucun petit compté disparaît. */
export function porteesAvecBoucle(portees: PorteeNaissance[]): PorteeNaissance[] {
  return portees
    .map((p) => ({ ...p, cabrits: p.cabrits.filter(compteAuxDocuments) }))
    .filter((p) => p.cabrits.length > 0);
}

/** Les mises bas rangées par année, de la plus récente à la plus ancienne. */
export function porteesParAnnee(portees: PorteeNaissance[]): { annee: string; portees: PorteeNaissance[] }[] {
  const parAnnee = new Map<string, PorteeNaissance[]>();
  for (const p of portees) {
    const annee = p.date.slice(0, 4);
    parAnnee.set(annee, [...(parAnnee.get(annee) ?? []), p]);
  }
  return [...parAnnee.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([annee, liste]) => ({ annee, portees: liste }));
}

/** Les résultats de production d'une année, d'après ses mises bas (ce qui dépend de la reproduction reste à écrire à la main). */
export interface ResultatsProduction {
  /** Les femelles ayant mis bas (chacune compte une fois). */
  misesBas: number;
  /** Les petits nés (mort-nés compris), selon la taille de la portée. */
  simples: number;
  doubles: number;
  triplesEtPlus: number;
  nes: number;
  /** Les petits morts : à la naissance (mort-nés), dans la première semaine, avant le sevrage, avant leur départ. */
  mortsNaissance: number;
  mortsSemaine: number;
  mortsSevrage: number;
  mortsDepart: number;
  /** Tous les petits morts, ceux dont la date de mort n'est pas connue compris. */
  morts: number;
  vivants: number;
  /** Les petits nés par femelle ayant mis bas, en % (100 % : un petit par mise bas) ; absent sans mise bas. */
  prolificite?: number;
  /** Les petits morts parmi les petits nés, en % ; absent sans naissance. */
  mortalite?: number;
  /** Les femelles mises à la reproduction (voir chevresMisesALaReproduction) ; absent quand le cheptel n'est pas connu. */
  misesALaReproduction?: number;
  /** Les femelles ayant avorté (le lot d'avortements de l'année) ; absent quand l'année n'a pas de lot : à écrire à la main. */
  avortements?: number;
  /** Les petits vendus (ou partis à l'abattoir) ou gardés comme reproducteurs, parmi les petits nés. */
  vendusOuGardes: number;
  /** Les femelles ayant mis bas parmi celles mises à la reproduction, en %. */
  fertilite?: number;
  /** Les petits vendus ou gardés reproducteurs par femelle mise à la reproduction, en %. */
  productivite?: number;
}

/**
 * Les femelles mises à la reproduction pour les mises bas d'une année : celles du lot de mise à la reproduction de cette année (voir
 * lotsDeReproduction), à défaut le même calcul que celui qui remplit ce lot (voir boucleDesFemellesALaReproduction) ; plus les mères de
 * l'année qui n'y seraient pas : une femelle qui a mis bas était forcément mise à la reproduction, et leur nombre ne peut pas être
 * inférieur à celui des mises bas. Le nombre est donc celui du lot de l'année.
 */
export function chevresMisesALaReproduction(
  animaux: Chevre[],
  annee: number,
  meres: string[] = [],
  lots: LotAnimaux[] = [],
): number {
  const deLots = lotsDeReproduction(lots, annee);
  if (deLots.length > 0) {
    // Les femelles des lots : une boucle qui n'est pas celle d'un mâle du cheptel (un animal sorti ou inconnu compte aussi).
    const males = new Set(
      animaux.filter((c) => c.sexe === SEXE.MALE && c.numeroBoucle).map((c) => c.numeroBoucle),
    );
    const desLots = new Set(deLots.flatMap((l) => bouclesDuLot(l)).filter((b) => !males.has(b)));
    return desLots.size + new Set(meres.filter((m) => m && !desLots.has(m))).size;
  }
  const calculees = new Set(boucleDesFemellesALaReproduction(animaux, annee));
  return calculees.size + new Set(meres.filter((m) => m && !calculees.has(m))).size;
}

/**
 * Les résultats de production d'une année. Les morts sont ceux au 31 décembre de cette année : un petit mort l'année d'après était
 * vivant à la fin de l'année de sa naissance, il compte parmi les vivants. `annee` : celle des naissances (à défaut, celle de la
 * première mise bas).
 */
export function resultatsDeLAnnee(
  portees: PorteeNaissance[],
  annee: number | string = portees[0]?.date.slice(0, 4) ?? '',
  misesALaReproduction?: number,
  avortements?: number,
): ResultatsProduction {
  const finAnnee = `${annee}-12-31`;
  const r: ResultatsProduction = {
    misesBas: new Set(portees.map((p) => p.mereNumeroBoucle)).size,
    simples: 0,
    doubles: 0,
    triplesEtPlus: 0,
    nes: 0,
    mortsNaissance: 0,
    mortsSemaine: 0,
    mortsSevrage: 0,
    mortsDepart: 0,
    morts: 0,
    vivants: 0,
    vendusOuGardes: 0,
    misesALaReproduction,
    avortements,
  };
  for (const p of portees) {
    const taille = p.cabrits.length;
    if (taille === 1) r.simples += 1;
    else if (taille === 2) r.doubles += 2;
    else r.triplesEtPlus += taille;
    r.nes += taille;
    for (const c of p.cabrits) {
      // Vendus (à l'abattoir compris) ou gardés comme reproducteurs, à n'importe quelle date : un petit gardé quelques mois est vendu l'année d'après.
      if (
        c.statut === STATUT_CHEVRE.VENDUE ||
        c.statut === STATUT_CHEVRE.ABATTOIR ||
        (c.renouvellement && c.statut === STATUT_CHEVRE.VIVANTE)
      ) {
        r.vendusOuGardes += 1;
      }
      if (c.statut === STATUT_CHEVRE.MORT_NE) {
        r.mortsNaissance += 1;
        r.morts += 1;
      } else if (c.statut === STATUT_CHEVRE.MORTE || c.statut === STATUT_CHEVRE.AUTOCONSOMMEE) {
        // Un petit auto-consommé n'est ni vendu ni parti de l'élevage : il compte parmi les morts.
        // Mort après la fin de l'année : vivant au 31 décembre.
        if (c.dateStatut && c.dateStatut > finAnnee) continue;
        r.morts += 1;
        if (!c.dateStatut) continue;
        const jours = joursEntre(c.dateNaissance, c.dateStatut);
        if (jours < JOURS_PREMIERE_SEMAINE) r.mortsSemaine += 1;
        else if (jours < JOURS_SEVRAGE) r.mortsSevrage += 1;
        else r.mortsDepart += 1;
      }
    }
  }
  r.vivants = r.nes - r.morts;
  if (r.misesBas > 0) r.prolificite = Math.round((r.nes / r.misesBas) * 100);
  if (r.nes > 0) r.mortalite = Math.round((r.morts / r.nes) * 100);
  if (misesALaReproduction) {
    r.fertilite = Math.round((r.misesBas / misesALaReproduction) * 100);
    r.productivite = Math.round((r.vendusOuGardes / misesALaReproduction) * 100);
  }
  return r;
}

const STYLES = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 0 4mm; font-size: 10.5pt; }
  .page { page-break-after: always; }
  /* Le livret A6 : des feuilles A4 en portrait, quatre pages A6 par face (deux feuilles A5 l'une sur l'autre, deux pages chacune). */
  .a6 .page { page-break-after: auto; }
  .face { width: 210mm; height: 296.5mm; page-break-after: always; overflow: hidden; }
  .face:last-child { page-break-after: auto; }
  .demi5 { width: 210mm; height: 148.25mm; display: flex; }
  .demi5 + .demi5 { border-top: 0.2mm dotted #aaa; }
  .page6 { width: 105mm; height: 148.25mm; position: relative; overflow: hidden; }
  .page6:first-child { border-right: 0.2mm dotted #aaa; }
  /* Les pages intérieures, en portrait comme la couverture : une marge que les imprimantes savent tenir. */
  .interieur { position: absolute; left: 0; top: 0; width: 105mm; height: 148.25mm; padding: 3.5mm; overflow: hidden; }
  /* Les marges : 5 mm sur les bords de la feuille A4 (la limite de l'imprimante), 2 mm seulement du côté de la reliure (le pli au milieu de la
     feuille) et de la coupe entre les deux feuilles A5, où l'imprimante imprime jusqu'au bord, comme dans le carnet d'origine. */
  .demi5 .page6:first-child .interieur { padding-left: 5mm; padding-right: 2mm; }
  .demi5 .page6:last-child .interieur { padding-left: 2mm; padding-right: 5mm; }
  .face .demi5:last-child .interieur { padding-top: 2mm; padding-bottom: 5mm; }
  .face .demi5:first-child .interieur { padding-top: 5mm; padding-bottom: 2mm; }
  .a6 h1 { font-size: 9pt; margin: 0 0 1mm; }
  .a6 h1.titre-cabris.a-droite { font-size: 14pt; text-align: right; margin: 0 0 1.5mm; }
  /* La page de gauche n'a pas de titre : son tableau commence à la même hauteur que celui de la page de droite. */
  .a6 .page > table:first-child { margin-top: 7.5mm; }
  .a6 th { font-size: 6pt; padding: 0.4mm 0.6mm; overflow-wrap: anywhere; }
  .a6 tr { height: 7.6mm; }
  .a6 td { height: 7.6mm; font-size: 7.5pt; padding: 0 0.8mm; }
  .a6 td .c { line-height: 1.15; overflow-wrap: anywhere; }
  .a6 td.libre { font-size: 7pt; }
  .a6 .note { font-size: 5.5pt; margin: 0.8mm 0 0; }
  .a6 .colonnes { flex-direction: column; gap: 2mm; }
  .a6 .champ { margin-bottom: 2.4mm; font-size: 7pt; }
  .a6 .champ .valeur { min-height: 3.5mm; }
  .a6 .resultats { zoom: 0.85; }
  .a6 .page6 > .page > .couverture { height: 136mm; margin: 6mm; padding: 14mm 8mm 8mm; border-radius: 2mm; }
  .a6 .couverture .grand { font-size: 24pt; }
  .a6 .couverture .periode { font-size: 11pt; margin-top: 3mm; }
  .a6 .couverture .exploitation { font-size: 8pt; padding-top: 3mm; border-top-width: 0.8mm; }
  .numero-page { position: absolute; bottom: 2mm; left: 0; right: 0; text-align: center; font-size: 6pt; color: #777; }
  .page:last-child { page-break-after: auto; }
  h1 { font-family: 'Arial Narrow', Arial, sans-serif; font-weight: 800; font-size: 20pt; margin: 0 0 5mm; line-height: 1.1; }
  .couverture { background: #5da844; color: #fff; height: 250mm; padding: 28mm 16mm 16mm; display: flex; flex-direction: column; justify-content: space-between; border-radius: 4mm; }
  
  .couverture .grand { font-family: 'Arial Narrow', Arial, sans-serif; font-weight: 800; font-size: 44pt; line-height: 1.05; color: #ffe94d; }
  .couverture .periode { font-size: 18pt; font-weight: 700; margin-top: 6mm; }
  .couverture .exploitation { font-size: 13pt; line-height: 1.6; border-top: 1.5mm solid #ffe94d; padding-top: 6mm; }
  .colonnes { display: flex; gap: 8mm; }
  .colonnes > div { flex: 1; }
  .champ { margin: 0 0 4.5mm; display: flex; align-items: flex-end; gap: 2mm; }
  .champ .valeur { flex: 1; border-bottom: 1px dotted #111; min-height: 5.5mm; padding: 0 2mm; color: #1a2a8a; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
  th, td { border: 1.3px solid #111; padding: 1mm 2mm; text-align: center; vertical-align: middle; }
  th { font-size: 9.5pt; font-weight: 700; }
  td { height: 7mm; padding-top: 0; padding-bottom: 0; font-size: 10pt; }
  td.libre { text-align: center; font-size: 9.5pt; overflow-wrap: anywhere; }
  .boite { display: flex; margin: 0 0 4mm; }
  .boite .intitule { flex: 1; border: 1.3px solid #111; padding: 2mm 3mm; }
  .boite .case { width: 18mm; border: 1.3px solid #111; border-left: none; font-weight: 700; color: #1a2a8a; display: flex; align-items: center; justify-content: center; }
  .groupe { display: flex; border: 1.3px solid #111; margin: 0 0 4mm; }
  .groupe .titre { width: 34%; padding: 2mm 3mm; border-right: 1.3px solid #111; display: flex; align-items: center; }
  .groupe .lignes { flex: 1; }
  .groupe .l { display: flex; border-bottom: 1.3px solid #111; }
  .groupe .l:last-child { border-bottom: none; }
  .groupe .l span { flex: 1; padding: 1.2mm 3mm; font-size: 10pt; }
  .groupe .l b { width: 14mm; border-left: 1.3px solid #111; text-align: center; padding: 1.2mm 0; color: #1a2a8a; }
  .groupe .l.total span { font-weight: 800; }
  .taux { border: 1.3px solid #111; margin: 0 0 5mm; }
  .taux .tete { display: flex; }
  .taux .nom { flex: 1; background: #ddd; font-weight: 800; padding: 1.5mm 3mm; border-bottom: 1.3px solid #111; }
  .taux .valeur { width: 18mm; border-left: 1.3px solid #111; border-bottom: 1.3px solid #111; text-align: center; font-weight: 700; color: #1a2a8a; padding: 1.5mm 0; }
  .taux .formule { text-align: center; padding: 2.5mm 3mm; font-size: 10pt; }
  .note { font-size: 8.5pt; color: #555; font-style: italic; margin-top: 3mm; }
  .vide { font-style: italic; color: #555; }
`;

/** Un champ des données personnelles : son libellé, puis une ligne en pointillés où la valeur connue est déjà écrite. */
const champ = (libelle: string, valeur = ''): string =>
  `<div class="champ"><span>${libelle ? `${echapper(libelle)} :` : ''}</span><span class="valeur">${echapper(valeur)}</span></div>`;

/** La couverture : le titre, les années du carnet, et l'exploitation. */
function pageCouverture(infos: InfosExploitation | undefined, annees: string[]): string {
  const periode =
    annees.length === 0
      ? ''
      : annees.length === 1
        ? annees[0]
        : `${annees[0]} – ${annees[annees.length - 1]}`;
  const lignes = [
    infos?.nomExploitant?.trim(),
    infos?.numeroExploitation ? `${C.exploitation} : ${infos.numeroExploitation}` : '',
  ].filter(Boolean);
  return `<div class="page">
    <div class="couverture">
      <div><div class="grand">${echapper(C.titre)}</div>${periode ? `<div class="periode">${echapper(periode)}</div>` : ''}</div>
      <div class="exploitation">${lignes.map((l) => echapper(l as string)).join('<br>')}</div>
    </div>
  </div>`;
}

/** Une page sans rien : le verso de la couverture, ou une page de réserve du livret. */
const PAGE_BLANCHE = '<div class="page blanche"></div>';

/** La quatrième de couverture du livret : le même vert que la couverture, sans texte. */
const QUATRIEME_DE_COUVERTURE = '<div class="page"><div class="couverture"></div></div>';

/** Les coordonnées utiles que le carnet reprend des contacts : chacune en deux lignes (le nom, puis le téléphone et l'adresse). */
export interface ContactsDuCarnet {
  veterinaire: string[];
  groupement: string[];
}

/** Le premier contact d'une catégorie : son nom, puis son téléphone et son adresse ; rien sans contact dans cette catégorie. */
function coordonneesDeLaCategorie(fournisseurs: Fournisseur[], categorie: string): string[] {
  const vet = fournisseurs.find((f) => categorieFournisseurDe(f.categorie).id === categorie);
  if (!vet) return [];
  const nom = vet.nomEntreprise?.trim() || [vet.nom, vet.prenom].filter(Boolean).join(' ');
  return [nom, [vet.telephone, vet.adressePostale?.replace(/\s*\n\s*/g, ', ')].filter(Boolean).join(' · ')];
}

/** Le vétérinaire et le groupement sanitaire (GDS) des coordonnées utiles, d'après les contacts de ces catégories. */
export function contactsDuCarnet(fournisseurs: Fournisseur[]): ContactsDuCarnet {
  return {
    veterinaire: coordonneesDeLaCategorie(fournisseurs, CATEGORIE_FOURNISSEUR.VETERINAIRE),
    groupement: coordonneesDeLaCategorie(fournisseurs, CATEGORIE_FOURNISSEUR.GROUPEMENT_SANITAIRE),
  };
}

/** La page des données personnelles et des coordonnées utiles (à compléter à la main). */
function pageDonnees(infos: InfosExploitation | undefined, contacts: ContactsDuCarnet): string {
  const [nom = '', ...reste] = (infos?.nomExploitant ?? '').trim().split(/\s+/);
  const adresse = (infos?.adresseExploitant ?? '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  return `<div class="page">
    <div class="colonnes">
      <div>
        <h1>${echapper(C.titre)}<br>${echapper(C.donnees)}</h1>
        ${champ(C.nom, nom)}${champ(C.prenom, reste.join(' '))}${champ(C.adresse, adresse[0])}${champ('', adresse.slice(1).join(' · '))}
        ${champ(C.tel)}${champ(C.exploitation, infos?.numeroExploitation)}${champ(C.siret, infos?.siret)}
      </div>
      <div>
        <h1>${echapper(C.coordonnees)}</h1>
        ${[C.groupement, C.veterinaire, C.veterinaireSanitaire, C.inseminateur]
          .map((l) => {
            const connu =
              l === C.veterinaire ? contacts.veterinaire : l === C.groupement ? contacts.groupement : [];
            return `${champ(l, connu[0])}${champ('', connu[1])}`;
          })
          .join('')}
      </div>
    </div>
  </div>`;
}

/**
 * Le tableau des petits d'une année : une ligne par mise bas. En entier sur une page A4 ; dans le livret, la moitié gauche (date, n° du
 * petit, n° de la mère, n° du père, sexe) ou la moitié droite (observations, âge de départ ou de mort, poids de départ) : les deux pages
 * face à face se lisent ensemble, ligne par ligne.
 */
function pageCabris(
  annee: string,
  lignes: LigneCabri[],
  v: Vocabulaire,
  moitie?: 'gauche' | 'droite',
): string {
  const c = C.colonnes;
  const colonnes: {
    th: string;
    valeur: (l: LigneCabri) => string;
    libre?: boolean;
    entiere: number;
    gauche?: number;
    droite?: number;
  }[] = [
    { th: c.date, valeur: (l) => l.date, entiere: 9, gauche: 15 },
    { th: c.numero(v.petit.singulier), valeur: (l) => l.numero, entiere: 18, gauche: 28 },
    { th: c.mere, valeur: (l) => l.mere, entiere: 11, gauche: 23 },
    { th: c.pere, valeur: () => '', entiere: 8, gauche: 20 },
    { th: c.sexe, valeur: (l) => l.sexe, entiere: 10, gauche: 14 },
    { th: c.observations, valeur: (l) => l.observations, libre: true, entiere: 23, droite: 38 },
    { th: c.age, valeur: (l) => l.age, entiere: 11, droite: 34 },
    { th: c.poids, valeur: (l) => l.poids, entiere: 10, droite: 28 },
  ];
  const choisies =
    moitie === 'gauche' ? colonnes.slice(0, 5) : moitie === 'droite' ? colonnes.slice(5) : colonnes;
  const largeur = (col: (typeof colonnes)[number]) =>
    moitie === 'gauche' ? col.gauche : moitie === 'droite' ? col.droite : col.entiere;
  const lignesHtml = lignes
    .map(
      (l) =>
        `<tr>${choisies.map((col) => `<td${col.libre ? ' class="libre"' : ''}><div class="c">${echapper(col.valeur(l)).replace(/\n/g, '<br>')}</div></td>`).join('')}</tr>`,
    )
    .join('');
  // Le titre n'est que sur la page de droite du livret (du côté du poids de départ), grand et aligné à droite ; la page de gauche n'en a pas.
  const titre =
    moitie === 'gauche'
      ? ''
      : `<h1 class="titre-cabris${moitie === 'droite' ? ' a-droite' : ''}">${echapper(capitaliser(v.petit.pluriel))} — ${echapper(annee)}</h1>`;
  return `<div class="page">
    ${titre}
    <table>
      <colgroup>${choisies.map((col) => `<col style="width:${largeur(col)}%" />`).join('')}</colgroup>
      <thead><tr>${choisies.map((col) => `<th>${echapper(col.th)}</th>`).join('')}</tr></thead>
      <tbody>${lignesHtml}</tbody>
    </table>
    ${moitie === 'gauche' ? '' : `<p class="note">${echapper(C.legende)}</p>`}
  </div>`;
}

const pourcent = (n: number | undefined): string => (n === undefined ? '' : `${n} %`);

/** La page des résultats de production et du calcul des taux d'une année : ce que les mises bas permettent de calculer est déjà écrit. */
function partiesResultats(
  annee: string,
  r: ResultatsProduction,
  v: Vocabulaire,
): { gauche: string; droite: string } {
  const T = C.resultats;
  const f = v.femelle.pluriel;
  const p = v.petit.pluriel;
  const boite = (intitule: string, valeur = '') =>
    `<div class="boite"><div class="intitule">${echapper(intitule)}</div><div class="case">${echapper(valeur)}</div></div>`;
  const groupe = (titre: string, lignes: [string, number][]) =>
    `<div class="groupe"><div class="titre">${echapper(titre)}</div><div class="lignes">${lignes
      .map(
        ([l, n], k) =>
          `<div class="l${k === lignes.length - 1 ? ' total' : ''}"><span>${echapper(l)}</span><b>${n}</b></div>`,
      )
      .join('')}</div></div>`;
  const taux = (nom: string, formule: string, valeur = '') =>
    `<div class="taux"><div class="tete"><div class="nom">${echapper(nom)} =</div><div class="valeur">${echapper(valeur)}</div></div><div class="formule">${echapper(formule)}</div></div>`;
  return {
    gauche: `<h1>${echapper(T.titre)} — ${echapper(annee)}</h1>
        ${boite(T.misesALaReproduction(f), String(r.misesALaReproduction ?? ''))}
        ${boite(T.avorte(f), String(r.avortements ?? ''))}
        ${boite(T.misBas(f), String(r.misesBas))}
        ${groupe(T.nes(p), [
          [T.simples, r.simples],
          [T.doubles, r.doubles],
          [T.triples, r.triplesEtPlus],
          [T.total, r.nes],
        ])}
        ${groupe(T.morts(p), [
          [T.naissance, r.mortsNaissance],
          [T.premiereSemaine, r.mortsSemaine],
          [T.avantSevrage, r.mortsSevrage],
          [T.avantDepart, r.mortsDepart],
          [T.total, r.morts],
        ])}
        ${boite(T.vivants(p), String(r.vivants))}`,
    droite: `<h1>${echapper(T.taux)}</h1>
        ${taux(T.fertilite, T.formuleFertilite(f), pourcent(r.fertilite))}
        ${taux(T.prolificite, T.formuleProlificite(p, f), pourcent(r.prolificite))}
        ${taux(T.productivite, T.formuleProductivite(p, f), pourcent(r.productivite))}
        ${taux(T.mortalite, T.formuleMortalite(p), pourcent(r.mortalite))}
        <p class="note">${echapper(T.aCompleter(f))}</p>`,
  };
}

/** La page des résultats de production et du calcul des taux (feuille A4) : les deux moitiés côte à côte. */
function pageResultats(annee: string, r: ResultatsProduction, v: Vocabulaire): string {
  const { gauche, droite } = partiesResultats(annee, r, v);
  return `<div class="page resultats"><div class="colonnes"><div>${gauche}</div><div>${droite}</div></div></div>`;
}

/** Les deux pages face à face du livret : les résultats de production à gauche, le calcul des taux à droite. */
const pagesResultatsLivret = (annee: string, r: ResultatsProduction, v: Vocabulaire): string[] => {
  const { gauche, droite } = partiesResultats(annee, r, v);
  return [`<div class="page resultats">${gauche}</div>`, `<div class="page resultats">${droite}</div>`];
};

/** Le carnet de mise bas, sur le modèle du carnet papier : les données personnelles, puis pour chaque année les petits et les résultats de production. */
export function carnetMiseBasHtml(
  portees: PorteeNaissance[],
  infos?: InfosExploitation,
  v: Vocabulaire = vocabulaire(especeCourante()),
  format: FormatCarnet = 'a4',
  contacts: ContactsDuCarnet = { veterinaire: [], groupement: [] },
  /** Le cheptel : il donne les femelles mises à la reproduction (sans lui, ces cases et les taux qui en dépendent restent à écrire à la main). */
  animaux?: Chevre[],
  /** Les lots d'animaux : ceux de mise à la reproduction donnent les femelles mises à la reproduction d'une année. */
  lots: LotAnimaux[] = [],
  /** Les numéros des tiptag de l'inventaire : un cabri à tiptag est destiné à l'abattoir (« A »). */
  tiptags: ReadonlySet<string> = new Set(),
): string {
  const annees = porteesParAnnee(porteesAvecBoucle(portees)).reverse();
  const resultats = (annee: string, liste: PorteeNaissance[]) =>
    resultatsDeLAnnee(
      liste,
      annee,
      animaux
        ? chevresMisesALaReproduction(
            animaux,
            Number(annee),
            liste.map((p) => p.mereNumeroBoucle),
            lots,
          )
        : undefined,
      chevresAyantAvorte(lots, Number(annee)),
    );
  const parPage = format === 'livret' ? LIGNES_PAR_PAGE_LIVRET : LIGNES_PAR_PAGE;
  const pages = [
    pageCouverture(
      infos,
      annees.map((a) => a.annee),
    ),
    pageDonnees(infos, contacts),
    ...(annees.length === 0
      ? [`<div class="page"><p class="vide">${echapper(C.aucune)}</p></div>`]
      : annees.flatMap(({ annee, portees: liste }) =>
          format === 'livret'
            ? [
                // Une double page par tableau (la moitié gauche, puis la droite), puis les résultats et les taux face à face.
                ...pagesDeLAnnee(liste, parPage, tiptags).flatMap((page) => [
                  pageCabris(annee, page, v, 'gauche'),
                  pageCabris(annee, page, v, 'droite'),
                ]),
                ...pagesResultatsLivret(annee, resultats(annee, liste), v),
              ]
            : [
                ...pagesDeLAnnee(liste, parPage, tiptags).map((page) => pageCabris(annee, page, v)),
                pageResultats(annee, resultats(annee, liste), v),
              ],
        )),
  ];
  if (format === 'livret') {
    // Comme un livre : la couverture, son verso blanc, puis les pages ; à la fin, le verso blanc de la quatrième de couverture (verte) en
    // dernière page. Des pages blanches de réserve complètent au multiple de 4 : chaque feuille A5 porte quatre pages.
    const livret = [pages[0], PAGE_BLANCHE, ...pages.slice(1)];
    while ((livret.length + 2) % 4 !== 0) livret.push(PAGE_BLANCHE);
    livret.push(PAGE_BLANCHE, QUATRIEME_DE_COUVERTURE);
    // Pas de numéro sur les couvertures ni sur les pages blanches.
    const page6 = (k: number) => {
      const speciale = /couverture|blanche/.test(livret[k]);
      return `<div class="page6">${speciale ? livret[k] : `<div class="interieur">${livret[k]}</div><div class="numero-page">${k + 1}</div>`}</div>`;
    };
    const demi5 = ([gauche, droite]: [number, number]) =>
      `<div class="demi5">${page6(gauche)}${page6(droite)}</div>`;
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body class="a6">
  ${facesA4DuLivret(livret.length)
    .map((face) => `<div class="face">${demi5(face.haut)}${face.bas ? demi5(face.bas) : ''}</div>`)
    .join('')}
</body>
</html>`;
  }
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>${STYLES}</style>
</head>
<body>
  ${pages.join('')}
</body>
</html>`;
}

/**
 * Crée le carnet de mise bas de l'espèce courante, d'après les naissances enregistrées, et l'ouvre à l'envoi ou à l'impression : en feuilles
 * A4 portrait, ou en livret A6 (A4 portrait, recto verso en retournant sur le bord long, à couper en deux et à plier).
 */
export async function exporterCarnetMiseBasPdf(format: FormatCarnet = 'a4'): Promise<void> {
  const [portees, settings, fournisseurs, animaux] = await Promise.all([
    listNaissancesGroupees(),
    getSettings(),
    listFournisseurs(),
    listTousLesAnimauxDeLEspece(),
  ]);
  const html = carnetMiseBasHtml(
    portees,
    settings.exploitation,
    vocabulaire(especeCourante()),
    format,
    contactsDuCarnet(fournisseurs),
    animaux,
    settings.exploitation?.lots ?? [],
    numerosTiptag((await lireArchiveStock()).boucles),
  );
  if (format === 'livret') {
    await ecrireEtPartagerPdf(html, `${C.fichierLivret}.${FORMAT_EXPORT.PDF}`, C.titre, { sansMarges: true });
    return;
  }
  await ecrireEtPartagerPdf(html, `${C.fichier}.${FORMAT_EXPORT.PDF}`, C.titre);
}
