import { listNaissancesGroupees, type PorteeNaissance } from '@/features/cheptel/repository/naissances';
import type { Chevre } from '@/features/cheptel/types';
import { listFournisseurs } from '@/features/fournisseurs/repository';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { echapper, ecrireEtPartagerPdf } from '@/features/export/services/htmlPdf';
import { getSettings, type InfosExploitation } from '@/features/settings/settings';
import { FORMAT_EXPORT } from '@/shared/constants/export';
import { SEXE, STATUT_CHEVRE } from '@/shared/constants/cheptel';
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
 * Les lignes d'une page du livret (une page A6 en portrait, comme le carnet papier) : 18 lignes de 6,7 mm, avec le titre, l'en-tête et la
 * légende, dans les 148 mm de hauteur moins les marges que les imprimantes imposent.
 */
export const LIGNES_PAR_PAGE_LIVRET = 18;

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

/** Un petit est parti ou mort : il a un statut de sortie et une date. */
const estParti = (c: Chevre): boolean =>
  c.statut !== STATUT_CHEVRE.VIVANTE && c.statut !== STATUT_CHEVRE.MORT_NE && !!c.dateStatut;

/** Ce qu'est devenu un petit (mort-né, mort, vendu…) et son âge à ce moment-là ; rien quand il est toujours là. */
function devenirDuCabri(c: Chevre): { devenir: string; age: string } {
  // Un petit mort n'a pas d'observation : l'âge de départ / mort suffit.
  const devenir =
    c.statut === STATUT_CHEVRE.MORT_NE
      ? C.statuts.mortNe
      : estParti(c) && c.statut !== STATUT_CHEVRE.MORTE
        ? (C.statuts as Record<string, string>)[c.statut]
        : '';
  return { devenir, age: estParti(c) ? ageTexte(joursEntre(c.dateNaissance, c.dateStatut!)) : '' };
}

const lettreDuSexe = (c: Chevre): string => (c.sexe === SEXE.FEMELLE ? 'F' : c.sexe === SEXE.MALE ? 'M' : '');

/**
 * La ligne d'une mise bas : sa date, la mère, et ses petits sur la même ligne — leurs boucles et leurs sexes réunis par « + » (M + F + F).
 * Ce que sont devenus les petits (mort, vendu) et leur âge s'écrivent à la suite ; avec plusieurs petits, chacun est précédé de sa boucle.
 */
export function ligneDeLaPortee(p: PorteeNaissance): LigneCabri {
  const plusieurs = p.cabrits.length > 1;
  const parPetit = p.cabrits.map((c) => ({ c, ...devenirDuCabri(c) }));
  const texte = (valeur: (x: (typeof parPetit)[number]) => string): string =>
    parPetit
      .map((x) => ({ x, v: valeur(x) }))
      .filter((e) => e.v)
      .map((e) => (plusieurs && e.x.c.numeroBoucle ? `${e.x.c.numeroBoucle} : ${e.v}` : e.v))
      .join(', ');
  const renouvellement = p.cabrits.some((c) => c.renouvellement) ? C.renouvellement : '';
  return {
    date: jourEtMois(p.date),
    numero: p.cabrits.map((c) => c.numeroBoucle || '').filter(Boolean).join(' + '),
    mere: p.mereNumeroBoucle || C.inconnue,
    sexe: p.cabrits.map(lettreDuSexe).filter(Boolean).join(' + '),
    observations: [texte((x) => x.devenir), renouvellement].filter(Boolean).join(' · '),
    age: texte((x) => x.age),
    poids: texte((x) => (x.c.poidsKg !== undefined ? C.poidsKg(x.c.poidsKg) : '')),
  };
}

/** Les mises bas d'une année, une par ligne : de la plus ancienne à la plus récente d'après la date de naissance (le n° de la mère n'entre pas dans le tri : à date égale, l'ordre de saisie est gardé). */
export function lignesDeLAnnee(portees: PorteeNaissance[]): LigneCabri[] {
  return [...portees].sort((a, b) => a.date.localeCompare(b.date)).map(ligneDeLaPortee);
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
export function pagesDeLAnnee(portees: PorteeNaissance[], parPage = LIGNES_PAR_PAGE): LigneCabri[][] {
  const debut = portees.filter((p) => Number(p.date.slice(5, 7)) < MOIS_FIN_D_ANNEE);
  const fin = portees.filter((p) => Number(p.date.slice(5, 7)) >= MOIS_FIN_D_ANNEE);
  return [
    ...pagesDeLignes(lignesDeLAnnee(debut), parPage),
    ...pagesDeLignes([], parPage),
    ...(fin.length > 0 ? pagesDeLignes(lignesDeLAnnee(fin), parPage) : []),
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

/** Les mises bas sans les petits sans boucle (mort-nés compris) : ils ne figurent pas dans le carnet ; une mise bas sans aucun petit avec boucle disparaît. */
export function porteesAvecBoucle(portees: PorteeNaissance[]): PorteeNaissance[] {
  return portees
    .map((p) => ({ ...p, cabrits: p.cabrits.filter((c) => !!c.numeroBoucle?.trim()) }))
    .filter((p) => p.cabrits.length > 0);
}

/** Les mises bas rangées par année, de la plus récente à la plus ancienne. */
export function porteesParAnnee(portees: PorteeNaissance[]): { annee: string; portees: PorteeNaissance[] }[] {
  const parAnnee = new Map<string, PorteeNaissance[]>();
  for (const p of portees) {
    const annee = p.date.slice(0, 4);
    parAnnee.set(annee, [...(parAnnee.get(annee) ?? []), p]);
  }
  return [...parAnnee.entries()].sort((a, b) => b[0].localeCompare(a[0])).map(([annee, liste]) => ({ annee, portees: liste }));
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
}

export function resultatsDeLAnnee(portees: PorteeNaissance[]): ResultatsProduction {
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
  };
  for (const p of portees) {
    const taille = p.cabrits.length;
    if (taille === 1) r.simples += 1;
    else if (taille === 2) r.doubles += 2;
    else r.triplesEtPlus += taille;
    r.nes += taille;
    for (const c of p.cabrits) {
      if (c.statut === STATUT_CHEVRE.MORT_NE) {
        r.mortsNaissance += 1;
        r.morts += 1;
      } else if (c.statut === STATUT_CHEVRE.MORTE) {
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
  .interieur { position: absolute; left: 0; top: 0; width: 105mm; height: 148.25mm; padding: 5mm; overflow: hidden; }
  .a6 h1 { font-size: 9pt; margin: 0 0 1mm; }
  .a6 th { font-size: 5.5pt; padding: 0.4mm 0.4mm; overflow-wrap: anywhere; }
  .a6 td { height: 6.7mm; font-size: 7pt; padding: 0 0.6mm; }
  .a6 td.libre { font-size: 7pt; }
  .a6 colgroup col:nth-child(1) { width: 9% !important; }
  .a6 colgroup col:nth-child(2) { width: 17% !important; }
  .a6 colgroup col:nth-child(3) { width: 14% !important; }
  .a6 colgroup col:nth-child(4) { width: 11% !important; }
  .a6 colgroup col:nth-child(5) { width: 11% !important; }
  .a6 colgroup col:nth-child(6) { width: 9% !important; }
  .a6 colgroup col:nth-child(7) { width: 14% !important; }
  .a6 colgroup col:nth-child(8) { width: 15% !important; }
  .a6 .note { font-size: 5.5pt; margin: 0.8mm 0 0; }
  .a6 .colonnes { flex-direction: column; gap: 2mm; }
  .a6 .champ { margin-bottom: 2.4mm; font-size: 7pt; }
  .a6 .champ .valeur { min-height: 3.5mm; }
  .a6 .resultats { zoom: 0.7; }
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
  td.libre { text-align: left; font-size: 9.5pt; overflow-wrap: anywhere; }
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
  const periode = annees.length === 0 ? '' : annees.length === 1 ? annees[0] : `${annees[0]} – ${annees[annees.length - 1]}`;
  const lignes = [infos?.nomExploitant?.trim(), infos?.numeroExploitation ? `${C.exploitation} : ${infos.numeroExploitation}` : ''].filter(Boolean);
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
            const connu = l === C.veterinaire ? contacts.veterinaire : l === C.groupement ? contacts.groupement : [];
            return `${champ(l, connu[0])}${champ('', connu[1])}`;
          })
          .join('')}
      </div>
    </div>
  </div>`;
}

/** Le tableau des petits d'une année : une ligne par petit. */
function pageCabris(annee: string, lignes: LigneCabri[], v: Vocabulaire): string {
  const c = C.colonnes;
  const lignesHtml = lignes
    .map(
      (l) =>
        `<tr><td>${echapper(l.date)}</td><td>${echapper(l.numero)}</td><td>${echapper(l.mere)}</td><td></td><td>${echapper(l.sexe)}</td><td class="libre">${echapper(l.observations)}</td><td>${echapper(l.age)}</td><td>${echapper(l.poids)}</td></tr>`,
    )
    .join('');
  return `<div class="page">
    <h1>${echapper(capitaliser(v.petit.pluriel))} — ${echapper(annee)}</h1>
    <table>
      <colgroup><col style="width:9%" /><col style="width:18%" /><col style="width:11%" /><col style="width:8%" /><col style="width:10%" /><col style="width:23%" /><col style="width:11%" /><col style="width:10%" /></colgroup>
      <thead><tr><th>${echapper(c.date)}</th><th>${echapper(c.numero(v.petit.singulier))}</th><th>${echapper(c.mere)}</th><th>${echapper(c.pere)}</th><th>${echapper(c.sexe)}</th><th>${echapper(c.observations)}</th><th>${echapper(c.age)}</th><th>${echapper(c.poids)}</th></tr></thead>
      <tbody>${lignesHtml}</tbody>
    </table>
    <p class="note">${echapper(C.legende)}</p>
  </div>`;
}

const pourcent = (n: number | undefined): string => (n === undefined ? '' : `${n} %`);

/** La page des résultats de production et du calcul des taux d'une année : ce que les mises bas permettent de calculer est déjà écrit. */
function pageResultats(annee: string, r: ResultatsProduction, v: Vocabulaire): string {
  const T = C.resultats;
  const f = v.femelle.pluriel;
  const p = v.petit.pluriel;
  const boite = (intitule: string, valeur = '') =>
    `<div class="boite"><div class="intitule">${echapper(intitule)}</div><div class="case">${echapper(valeur)}</div></div>`;
  const groupe = (titre: string, lignes: [string, number][]) =>
    `<div class="groupe"><div class="titre">${echapper(titre)}</div><div class="lignes">${lignes
      .map(([l, n], k) => `<div class="l${k === lignes.length - 1 ? ' total' : ''}"><span>${echapper(l)}</span><b>${n}</b></div>`)
      .join('')}</div></div>`;
  const taux = (nom: string, formule: string, valeur = '') =>
    `<div class="taux"><div class="tete"><div class="nom">${echapper(nom)} =</div><div class="valeur">${echapper(valeur)}</div></div><div class="formule">${echapper(formule)}</div></div>`;
  return `<div class="page resultats">
    <div class="colonnes">
      <div>
        <h1>${echapper(T.titre)} — ${echapper(annee)}</h1>
        ${boite(T.misesALaReproduction(f))}
        ${boite(T.avorte(f))}
        ${boite(T.misBas(f), String(r.misesBas))}
        ${groupe(T.nes(p), [[T.simples, r.simples], [T.doubles, r.doubles], [T.triples, r.triplesEtPlus], [T.total, r.nes]])}
        ${groupe(T.morts(p), [
          [T.naissance, r.mortsNaissance],
          [T.premiereSemaine, r.mortsSemaine],
          [T.avantSevrage, r.mortsSevrage],
          [T.avantDepart, r.mortsDepart],
          [T.total, r.morts],
        ])}
        ${boite(T.vivants(p), String(r.vivants))}
      </div>
      <div>
        <h1>${echapper(T.taux)}</h1>
        ${taux(T.fertilite, T.formuleFertilite(f))}
        ${taux(T.prolificite, T.formuleProlificite(p, f), pourcent(r.prolificite))}
        ${taux(T.productivite, T.formuleProductivite(p, f))}
        ${taux(T.mortalite, T.formuleMortalite(p), pourcent(r.mortalite))}
        <p class="note">${echapper(T.aCompleter(f))}</p>
      </div>
    </div>
  </div>`;
}

/** Le carnet de mise bas, sur le modèle du carnet papier : les données personnelles, puis pour chaque année les petits et les résultats de production. */
export function carnetMiseBasHtml(
  portees: PorteeNaissance[],
  infos?: InfosExploitation,
  v: Vocabulaire = vocabulaire(especeCourante()),
  format: FormatCarnet = 'a4',
  contacts: ContactsDuCarnet = { veterinaire: [], groupement: [] },
): string {
  const annees = porteesParAnnee(porteesAvecBoucle(portees)).reverse();
  const parPage = format === 'livret' ? LIGNES_PAR_PAGE_LIVRET : LIGNES_PAR_PAGE;
  const pages = [
    pageCouverture(infos, annees.map((a) => a.annee)),
    pageDonnees(infos, contacts),
    ...(annees.length === 0
      ? [`<div class="page"><p class="vide">${echapper(C.aucune)}</p></div>`]
      : annees.flatMap(({ annee, portees: liste }) => [
          ...pagesDeLAnnee(liste, parPage).map((page) => pageCabris(annee, page, v)),
          pageResultats(annee, resultatsDeLAnnee(liste), v),
        ])),
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
    const demi5 = ([gauche, droite]: [number, number]) => `<div class="demi5">${page6(gauche)}${page6(droite)}</div>`;
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
  const [portees, settings, fournisseurs] = await Promise.all([listNaissancesGroupees(), getSettings(), listFournisseurs()]);
  const html = carnetMiseBasHtml(
    portees,
    settings.exploitation,
    vocabulaire(especeCourante()),
    format,
    contactsDuCarnet(fournisseurs),
  );
  if (format === 'livret') {
    await ecrireEtPartagerPdf(html, `${C.fichierLivret}.${FORMAT_EXPORT.PDF}`, C.titre, { sansMarges: true });
    return;
  }
  await ecrireEtPartagerPdf(html, `${C.fichier}.${FORMAT_EXPORT.PDF}`, C.titre);
}
