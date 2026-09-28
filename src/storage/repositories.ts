import { generateId } from '@/utils/id';
import { yearOf } from '@/utils/dates';
import { ageEnMois, categorieAnimal, cleTriChevre } from '@/utils/chevreLabel';
import { LABEL_TYPE_AIDE, tauxImpositionAide } from '@/utils/planComptable';
import type {
  Chevre,
  Controle,
  Facture,
  Sexe,
  StatutChevre,
  TypeAide,
  TypeAliment,
  Vente,
  VisiteVeterinaire,
} from '@/types/models';
import {
  deleteRecord,
  findRecord,
  getYears,
  loadAllYears,
  loadYear,
  upsertRecord,
} from './localStore';

// ---------------------------------------------------------------------------
// Cheptel
// ---------------------------------------------------------------------------

export async function listChevresVivantes(): Promise<Chevre[]> {
  const all = await loadAllYears('cheptel');
  return all
    .filter((c) => c.statut === 'vivante')
    .sort((a, b) => cleTriChevre(a).localeCompare(cleTriChevre(b)));
}

/** Chèvres mortes, abattues ou vendues : conservées mais masquées de la liste principale. */
export async function listChevresHistorique(): Promise<Chevre[]> {
  const all = await loadAllYears('cheptel');
  return all
    .filter((c) => c.statut !== 'vivante')
    .sort((a, b) => (b.dateStatut ?? '').localeCompare(a.dateStatut ?? ''));
}

/** Pour chaque mère (n° de boucle), la date de sa dernière mise bas connue. */
export async function dernieresMisesBasParMere(): Promise<Record<string, string>> {
  const all = await loadAllYears('cheptel');
  const resultat: Record<string, string> = {};
  for (const c of all) {
    if (!c.mereNumeroBoucle) continue;
    const actuelle = resultat[c.mereNumeroBoucle];
    if (!actuelle || c.dateNaissance > actuelle) resultat[c.mereNumeroBoucle] = c.dateNaissance;
  }
  return resultat;
}

export async function getChevre(id: string): Promise<Chevre | undefined> {
  return findRecord('cheptel', id);
}

/** mereId est toujours recalculé depuis mereNumeroBoucle : c'est ce lien qui alimente la descendance affichée sur la fiche de la mère. */
export async function saveChevre(chevre: Chevre): Promise<void> {
  const mereId = chevre.mereNumeroBoucle
    ? (await loadAllYears('cheptel')).find((c) => c.numeroBoucle === chevre.mereNumeroBoucle && c.id !== chevre.id)?.id
    : undefined;
  await upsertRecord('cheptel', yearOf(chevre.dateNaissance), { ...chevre, mereId });
}

export async function creerChevre(input: {
  numeroBoucle?: string;
  dateBouclage?: string;
  nom?: string;
  sexe: Sexe;
  dateNaissance: string;
  mereId?: string;
  mereNumeroBoucle?: string;
  notes?: string;
  /** Permet de créer directement un cabrit mort-né (statut !== 'vivante' dès la naissance). */
  statut?: StatutChevre;
  renouvellement?: boolean;
  renouvellementAnnee?: number;
}): Promise<Chevre> {
  const statut = input.statut ?? 'vivante';
  const chevre: Chevre = {
    id: generateId(),
    numeroBoucle: input.numeroBoucle,
    dateBouclage: input.dateBouclage,
    nom: input.nom,
    sexe: input.sexe,
    dateNaissance: input.dateNaissance,
    mereId: input.mereId,
    mereNumeroBoucle: input.mereNumeroBoucle,
    statut,
    dateStatut: statut !== 'vivante' ? input.dateNaissance : undefined,
    renouvellement: input.renouvellement,
    renouvellementAnnee: input.renouvellement ? input.renouvellementAnnee : undefined,
    notes: input.notes,
  };
  await saveChevre(chevre);
  return chevre;
}

/**
 * Supprime définitivement la fiche (contrairement à déclarer morte/abattoir/vendue,
 * qui garde l'enregistrement). Les fiches de sa descendance gardent son n° de boucle
 * en texte pour l'affichage, mais ne pourront plus être reliées à sa fiche.
 */
export async function supprimerChevre(id: string): Promise<void> {
  await deleteRecord('cheptel', id);
}

export async function declarerStatutChevre(
  id: string,
  statut: StatutChevre,
  dateStatut: string,
): Promise<void> {
  const chevre = await getChevre(id);
  if (!chevre) return;
  await saveChevre({ ...chevre, statut, dateStatut });
}

export async function reactiverChevre(id: string): Promise<void> {
  const chevre = await getChevre(id);
  if (!chevre) return;
  await saveChevre({ ...chevre, statut: 'vivante', dateStatut: undefined });
}

export async function chevresAnnees(): Promise<number[]> {
  return getYears('cheptel');
}

/** Le n° de boucle doit être unique dans tout le cheptel (toutes années, tous statuts confondus). */
export async function numeroBoucleExiste(numeroBoucle: string, excludeId?: string): Promise<boolean> {
  const all = await loadAllYears('cheptel');
  return all.some((c) => c.numeroBoucle === numeroBoucle && c.id !== excludeId);
}

export async function listDescendance(chevreId: string): Promise<Chevre[]> {
  const all = await loadAllYears('cheptel');
  return all
    .filter((c) => c.mereId === chevreId)
    .sort((a, b) => b.dateNaissance.localeCompare(a.dateNaissance));
}

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
  cabritsVendus: number;
  cabritsAbattoir: number;
  cabritsAbattoirDates: DateEtNombre[];
  cabritsAutoconsommes: number;
  cabritsMortNes: number;
  cabritsRestants: number;
  miseBasCount: number;
  chevresMortesAnnee: number;
  chevresAbattoirAnnee: number;
  chevresAbattoirDates: DateEtNombre[];
  chevresVenduesAnnee: number;
  chevresAutoconsommeesAnnee: number;
  chevresVivantesFinAnnee: number;
  /** Parmi les chèvres vivantes ci-dessus, celles désignées pour le renouvellement cette année-là précisément. */
  chevresRenouvellementFinAnnee: number;
  boucsMortsAnnee: number;
  boucsAbattoirAnnee: number;
  boucsAbattoirDates: DateEtNombre[];
  boucsVendusAnnee: number;
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
  const toutes = await loadAllYears('cheptel');

  const anneeStatut = (c: Chevre) => (c.dateStatut ? yearOf(c.dateStatut) : undefined);
  const neeAvant = (c: Chevre) => yearOf(c.dateNaissance) < annee;
  const finAnnee = `${annee}-12-31`;

  // Cabrits nés pendant l'année civile N (01/01 au 31/12).
  const neeCetteAnnee = (c: Chevre) => yearOf(c.dateNaissance) === annee;

  const cabrits = toutes.filter(neeCetteAnnee);
  const premierSemestre = (c: Chevre) => Number(c.dateNaissance.slice(5, 7)) <= 6;

  // Âge en mois révolus entre deux dates (contrairement à ageEnMois, qui compare à aujourd'hui) —
  // sert à vérifier qu'une sortie (vente/abattoir/auto-consommation) a bien eu lieu pendant que
  // l'animal était encore un cabri (moins de 6 mois), et pas des années plus tard une fois adulte.
  const ageEnMoisEntre = (dateNaissance: string, dateRef: string) => {
    const naissance = new Date(`${dateNaissance}T00:00:00`);
    const ref = new Date(`${dateRef}T00:00:00`);
    let mois = (ref.getFullYear() - naissance.getFullYear()) * 12 + (ref.getMonth() - naissance.getMonth());
    if (ref.getDate() < naissance.getDate()) mois -= 1;
    return mois;
  };

  // Sortie comptée comme cabrit : l'animal avait encore moins de 6 mois au moment de la sortie, et
  // celle-ci a eu lieu pendant l'année N — indépendamment de l'année de naissance (un cabrit né fin
  // N-1 et sorti début N relève du bilan N, pas de celui de sa naissance).
  const sortiCommeCabrit = (c: Chevre) =>
    !!c.dateStatut && anneeStatut(c) === annee && ageEnMoisEntre(c.dateNaissance, c.dateStatut) < 6;

  // Cabrits de la cohorte encore effectivement cabrits au 31/12 (vivants et toujours < 6 mois à cette
  // date) — sert de base à « Total cabris », puisque les sorties ci-dessus ne sont plus un sous-
  // ensemble garanti de cette cohorte (elles peuvent venir d'un cabri né l'année précédente).
  const cabritsRestants = cabrits.filter(
    (c) =>
      ageEnMoisEntre(c.dateNaissance, finAnnee) < 6 &&
      (c.statut === 'vivante' || (anneeStatut(c) ?? -Infinity) > annee),
  ).length;

  const porteesCetteAnnee = new Set(
    cabrits.filter((c) => c.mereNumeroBoucle).map((c) => `${c.mereNumeroBoucle}__${c.dateNaissance}`),
  );

  // Sortie comptée comme chèvre/bouc adulte : il fallait déjà avoir 6 mois au moment de la sortie —
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
        ageEnMoisEntre(c.dateNaissance, c.dateStatut) >= 6,
    );
  const sortiesPreexistantes = (sexe: Sexe, statut: StatutChevre) => sortiesPreexistantesListe(sexe, statut).length;

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
    (c) => neeAvant(c) && (c.statut === 'vivante' || (anneeStatut(c) ?? Infinity) >= annee),
  ).length;

  const stockFinAnnee = toutes.filter(
    (c) => yearOf(c.dateNaissance) <= annee && (c.statut === 'vivante' || (anneeStatut(c) ?? -Infinity) > annee),
  ).length;

  // Adultes (6 mois+) d'un sexe donné, vivant(e)s au 31/12 de l'année N, reconstitué comme stockFinAnnee.
  const estAdulteVivantFinAnnee = (sexe: Sexe) => (c: Chevre) =>
    c.sexe === sexe &&
    ageEnMoisEntre(c.dateNaissance, finAnnee) >= 6 &&
    (c.statut === 'vivante' || (anneeStatut(c) ?? -Infinity) > annee);
  const estChevreVivanteFinAnnee = estAdulteVivantFinAnnee('F');
  const estBoucVivantFinAnnee = estAdulteVivantFinAnnee('M');
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
  const renouvellementDesignes = toutes.filter((c) => c.renouvellement && c.renouvellementAnnee === annee).length;

  const cabritsAbattoirListe = toutes.filter((c) => c.statut === 'abattoir' && sortiCommeCabrit(c));
  const chevresAbattoirListe = sortiesPreexistantesListe('F', 'abattoir');
  const boucsAbattoirListe = sortiesPreexistantesListe('M', 'abattoir');

  return {
    annee,
    cabritsTotal: cabrits.length,
    cabritsPremierSemestre: cabrits.filter(premierSemestre).length,
    cabritsSecondSemestre: cabrits.filter((c) => !premierSemestre(c)).length,
    cabritsRenouvellement: renouvellementDesignes,
    cabritsVendus: toutes.filter((c) => c.statut === 'vendue' && sortiCommeCabrit(c)).length,
    cabritsAbattoir: cabritsAbattoirListe.length,
    cabritsAbattoirDates: grouperParDate(cabritsAbattoirListe),
    cabritsAutoconsommes: toutes.filter((c) => c.statut === 'autoconsommee' && sortiCommeCabrit(c)).length,
    cabritsMortNes: cabrits.filter((c) => c.statut === 'mortne').length,
    cabritsRestants,
    miseBasCount: porteesCetteAnnee.size,
    chevresMortesAnnee: sortiesPreexistantes('F', 'morte'),
    chevresAbattoirAnnee: chevresAbattoirListe.length,
    chevresAbattoirDates: grouperParDate(chevresAbattoirListe),
    chevresVenduesAnnee: sortiesPreexistantes('F', 'vendue'),
    chevresAutoconsommeesAnnee: sortiesPreexistantes('F', 'autoconsommee'),
    chevresVivantesFinAnnee,
    chevresRenouvellementFinAnnee,
    boucsMortsAnnee: sortiesPreexistantes('M', 'morte'),
    boucsAbattoirAnnee: boucsAbattoirListe.length,
    boucsAbattoirDates: grouperParDate(boucsAbattoirListe),
    boucsVendusAnnee: sortiesPreexistantes('M', 'vendue'),
    boucsAutoconsommesAnnee: sortiesPreexistantes('M', 'autoconsommee'),
    boucsVivantsFinAnnee,
    boucsRenouvellementFinAnnee,
    stockDebutAnnee,
    stockFinAnnee,
  };
}

export async function resolveChevreIdParBoucle(numeroBoucle?: string): Promise<string | undefined> {
  if (!numeroBoucle?.trim()) return undefined;
  const all = await loadAllYears('cheptel');
  return all.find((c) => c.numeroBoucle === numeroBoucle.trim())?.id;
}

// ---------------------------------------------------------------------------
// Naissances : pas de fichier dédié — un cabrit est une Chevre dont
// dateNaissance + mereNumeroBoucle le rattachent à une portée. On enregistre
// une mise bas d'un coup (plusieurs cabrits) puis on regroupe pour l'affichage.
// ---------------------------------------------------------------------------

export interface CabritInput {
  numeroBoucle?: string;
  sexe: Sexe;
  nom?: string;
  mortNe?: boolean;
  renouvellement?: boolean;
  renouvellementAnnee?: number;
}

export async function enregistrerNaissance(input: {
  date: string;
  mereId?: string;
  mereNumeroBoucle: string;
  cabrits: CabritInput[];
  notes?: string;
}): Promise<Chevre[]> {
  const notes = input.notes ? `Naissance: ${input.notes}` : undefined;

  let mereId = input.mereId;
  if (!mereId) {
    const toutes = await loadAllYears('cheptel');
    mereId = toutes.find((c) => c.numeroBoucle === input.mereNumeroBoucle)?.id;
  }

  return Promise.all(
    input.cabrits.map((c) =>
      creerChevre({
        numeroBoucle: c.numeroBoucle,
        nom: c.nom,
        sexe: c.sexe,
        dateNaissance: input.date,
        mereId,
        mereNumeroBoucle: input.mereNumeroBoucle,
        notes,
        statut: c.mortNe ? 'mortne' : 'vivante',
        renouvellement: c.renouvellement,
        renouvellementAnnee: c.renouvellement ? c.renouvellementAnnee : undefined,
      }),
    ),
  );
}

export interface PorteeNaissance {
  date: string;
  mereNumeroBoucle: string;
  cabrits: Chevre[];
}

/** Regroupe les cabrits du cheptel par (mère, date de naissance) pour l'écran Naissances. */
export async function listNaissancesGroupees(): Promise<PorteeNaissance[]> {
  const all = await loadAllYears('cheptel');
  const cabrits = all.filter((c) => c.mereNumeroBoucle);
  const groupes = new Map<string, PorteeNaissance>();
  for (const c of cabrits) {
    const key = `${c.mereNumeroBoucle}__${c.dateNaissance}`;
    const existing = groupes.get(key);
    if (existing) existing.cabrits.push(c);
    else groupes.set(key, { date: c.dateNaissance, mereNumeroBoucle: c.mereNumeroBoucle!, cabrits: [c] });
  }
  return Array.from(groupes.values()).sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Visites vétérinaires
// ---------------------------------------------------------------------------

export async function enregistrerVisiteVeterinaire(
  input: Omit<VisiteVeterinaire, 'id' | 'chevreId'>,
): Promise<VisiteVeterinaire> {
  const chevreId = await resolveChevreIdParBoucle(input.chevreNumeroBoucle);
  const visite: VisiteVeterinaire = { id: generateId(), chevreId, ...input };
  await upsertRecord('visites_veterinaire', yearOf(visite.date), visite);
  return visite;
}

export async function listVisitesVeterinaire(annee: number): Promise<VisiteVeterinaire[]> {
  const items = await loadYear('visites_veterinaire', annee);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function visitesAnnees(): Promise<number[]> {
  return getYears('visites_veterinaire');
}

export async function supprimerVisiteVeterinaire(id: string): Promise<void> {
  await deleteRecord('visites_veterinaire', id);
}

export async function listVisitesPourChevre(chevreId: string): Promise<VisiteVeterinaire[]> {
  const all = await loadAllYears('visites_veterinaire');
  return all.filter((v) => v.chevreId === chevreId).sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Factures
// ---------------------------------------------------------------------------

export async function enregistrerFacture(input: Omit<Facture, 'id'>): Promise<Facture> {
  const facture: Facture = { id: generateId(), ...input };
  await upsertRecord('factures', yearOf(facture.date), facture);
  return facture;
}

export async function getFacture(id: string): Promise<Facture | undefined> {
  return findRecord('factures', id);
}

export async function listFactures(annee: number): Promise<Facture[]> {
  const items = await loadYear('factures', annee);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function facturesAnnees(): Promise<number[]> {
  return getYears('factures');
}

export async function supprimerFacture(id: string): Promise<void> {
  await deleteRecord('factures', id);
}

const TYPES_ALIMENT: TypeAliment[] = ['mais', 'luzerne', 'foin', 'paille', 'autre'];
/** "Autre" est exclu des totaux/moyennes : la précision libre peut recouvrir un aliment acheté pour un tout autre élevage que les chèvres. */
const TYPES_ALIMENT_COMPTABILISES: TypeAliment[] = ['mais', 'luzerne', 'foin', 'paille'];

export interface BilanAlimentationType {
  montant: number;
  quantiteKg: number;
}

export interface BilanAlimentation {
  parType: Record<TypeAliment, BilanAlimentationType>;
  total: number;
  totalKg: number;
  nombreAnimaux: number;
  coutParAnimal: number | undefined;
  /** Total (hors Autre) en kg, par animal, sur l'année entière. */
  kgParAnimal: number | undefined;
  /** Le même total (hors Autre), ramené à un g/jour/animal — pour comparer à une ration journalière connue. */
  gParAnimalParJour: number | undefined;
  /** Kg par animal, par type d'aliment (undefined si aucun animal, ou pour "Autre"). */
  kgParAnimalParType: Record<TypeAliment, number | undefined>;
  /** Coût (€) par animal, par type d'aliment (undefined si aucun animal, ou pour "Autre"). */
  montantParAnimalParType: Record<TypeAliment, number | undefined>;
}

/**
 * Additionne les lignes d'alimentation de toutes les factures reçues de l'année
 * (une facture peut contenir plusieurs types d'aliments), et calcule le coût et le
 * kg par animal en divisant par l'effectif actuel (chèvres + boucs vivants).
 */
export async function calculerBilanAlimentation(annee: number): Promise<BilanAlimentation> {
  const factures = await listFactures(annee);
  const parType: Record<TypeAliment, BilanAlimentationType> = {
    mais: { montant: 0, quantiteKg: 0 },
    luzerne: { montant: 0, quantiteKg: 0 },
    foin: { montant: 0, quantiteKg: 0 },
    paille: { montant: 0, quantiteKg: 0 },
    autre: { montant: 0, quantiteKg: 0 },
  };
  for (const f of factures) {
    if (f.type !== 'recue' || f.categorieDepense !== 'alimentation') continue;
    for (const ligne of f.lignesAlimentation ?? []) {
      parType[ligne.type].montant += ligne.montant;
      parType[ligne.type].quantiteKg += ligne.quantiteKg ?? 0;
    }
  }
  const total = TYPES_ALIMENT_COMPTABILISES.reduce((s, t) => s + parType[t].montant, 0);
  const totalKg = TYPES_ALIMENT_COMPTABILISES.reduce((s, t) => s + parType[t].quantiteKg, 0);

  const vivantes = await listChevresVivantes();
  const nombreAnimaux = vivantes.filter((c) => {
    const cat = categorieAnimal(c);
    // Un cabrit sevré (2 mois et plus) mange déjà comme un adulte et compte dans l'effectif.
    return cat !== 'cabrit' || ageEnMois(c.dateNaissance) >= 2;
  }).length;

  const kgParAnimalParType = Object.fromEntries(
    TYPES_ALIMENT.map((t) => [
      t,
      TYPES_ALIMENT_COMPTABILISES.includes(t) && nombreAnimaux > 0 ? parType[t].quantiteKg / nombreAnimaux : undefined,
    ]),
  ) as Record<TypeAliment, number | undefined>;

  const montantParAnimalParType = Object.fromEntries(
    TYPES_ALIMENT.map((t) => [
      t,
      TYPES_ALIMENT_COMPTABILISES.includes(t) && nombreAnimaux > 0 ? parType[t].montant / nombreAnimaux : undefined,
    ]),
  ) as Record<TypeAliment, number | undefined>;

  const kgParAnimal = nombreAnimaux > 0 ? totalKg / nombreAnimaux : undefined;

  return {
    parType,
    total,
    totalKg,
    nombreAnimaux,
    coutParAnimal: nombreAnimaux > 0 ? total / nombreAnimaux : undefined,
    kgParAnimal,
    gParAnimalParJour: kgParAnimal !== undefined ? (kgParAnimal * 1000) / 365 : undefined,
    kgParAnimalParType,
    montantParAnimalParType,
  };
}

// ---------------------------------------------------------------------------
// Ventes (lait et fromage)
// ---------------------------------------------------------------------------

export async function enregistrerVente(input: Omit<Vente, 'id'>): Promise<Vente> {
  const vente: Vente = { id: generateId(), ...input };
  await upsertRecord('ventes', yearOf(vente.date), vente);
  return vente;
}

export async function listVentes(annee: number): Promise<Vente[]> {
  const items = await loadYear('ventes', annee);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function ventesAnnees(): Promise<number[]> {
  return getYears('ventes');
}

export async function supprimerVente(id: string): Promise<void> {
  await deleteRecord('ventes', id);
}

export async function getVente(id: string): Promise<Vente | undefined> {
  return findRecord('ventes', id);
}

export async function saveVente(
  vente: Vente
): Promise<void> {
  await upsertRecord(
    'ventes',
    yearOf(vente.date),
    vente,
  );
}

/**
 * Part du montant d'une facture qui n'est pas de catégorie « Autre » : 0 si la facture entière est
 * catégorisée « Autre » (dépense ou recette) ; pour une facture « Alimentation », le montant total
 * moins les lignes elles-mêmes de type « Autre » (une facture peut regrouper plusieurs aliments,
 * certains catégorisés, d'autres non) ; sinon le montant complet. Sert à exclure « Autre » — non
 * représentatif de la santé financière de l'activité — des soldes, sans jamais changer le montant
 * réel affiché sur la facture elle-même.
 */
export function montantHorsAutre(f: Facture): number {
  if (f.type === 'recue' && f.categorieDepense === 'autre') return 0;
  if (f.type === 'emise' && f.categorieRecette === 'autre') return 0;
  if (f.categorieDepense === 'alimentation') {
    const partAutre = (f.lignesAlimentation ?? [])
      .filter((l) => l.type === 'autre')
      .reduce((s, l) => s + l.montant, 0);
    return f.montant - partAutre;
  }
  return f.montant;
}

export interface Transaction {
  id: string;
  date: string;
  montant?: number;
  /** Part de `montant` comptant réellement dans les soldes (hors « Autre ») — voir montantHorsAutre(). */
  montantComptabilise?: number;
  sens: 'entree' | 'sortie';
  titre: string;
  sousTitre: string;
  source: 'vente' | 'facture';
}

/** Vue unifiée : ventes (lait/fromage/cabris) + factures (reçues/émises), triée par date décroissante. */
export async function listTransactions(annee: number): Promise<Transaction[]> {
  const [ventes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);

  const deVentes: Transaction[] = ventes.map((v) => ({
    id: v.id,
    date: v.date,
    montant: v.prix,
    montantComptabilise: v.prix,
    sens: 'entree',
    titre:
      v.categorie === 'lait'
        ? `Lait — ${v.quantite} L`
        : v.categorie === 'cabris'
          ? `Cabris — ${v.quantite} tête${v.quantite > 1 ? 's' : ''}`
          : `Fromage — ${v.quantite} ${v.unite}`,
    sousTitre: 'Vente de production',
    source: 'vente',
  }));

  const deFactures: Transaction[] = factures.map((f) => ({
    id: f.id,
    date: f.date,
    montant: f.montant,
    montantComptabilise: montantHorsAutre(f),
    sens: f.type === 'emise' ? 'entree' : 'sortie',
    titre: f.tiers,
    sousTitre:
      f.categorieRecette === 'aide' && f.typeAide
        ? f.typeAide === 'autre' && f.typeAideLibre
          ? f.typeAideLibre
          : LABEL_TYPE_AIDE[f.typeAide]
        : f.description,
    source: 'facture',
  }));

  return [...deVentes, ...deFactures].sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Fiscalité (micro-BA, déclaration RSA) — agrégats calculés à partir des ventes
// et factures déjà enregistrées. Voir avertissement dans les écrans concernés :
// ces calculs organisent vos propres montants, ils ne remplacent pas une
// confirmation avec votre comptable, la MSA ou la CAF.
// ---------------------------------------------------------------------------

export interface AideParType {
  type: TypeAide;
  /** Libellé précis à afficher (utilise le texte libre pour les types "autre" distincts). */
  libelle: string;
  imposable: number;
  nonImposable: number;
}

export interface RecettesMicroBA {
  annee: number;
  ventesProduits: number; // lait + fromage + cabris (Vente + Facture émise catégorisée)
  aidesParType: AideParType[];
  aidesImposables: number;
  aidesNonImposables: number;
  autresRecettesImposables: number;
  totalImposable: number;
}

/**
 * Total des recettes brutes de l'année, pertinent pour le régime micro-BA
 * (recettes encaissées, hors aides explicitement marquées non imposables).
 * Les aides sont ventilées par type car leur caractère imposable peut différer
 * de l'une à l'autre.
 */
export async function calculerRecettesMicroBA(annee: number): Promise<RecettesMicroBA> {
  const [ventes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);

  const ventesProduits = ventes.reduce((s, v) => s + (v.prix ?? 0), 0);
  const emises = factures.filter((f) => f.type === 'emise');

  const aides = emises.filter((f) => f.categorieRecette === 'aide');
  const parType = new Map<string, AideParType>();
  for (const f of aides) {
    const type = f.typeAide ?? 'autre';
    // Pour "autre", chaque libellé libre différent reste une ligne distincte (ex: GNR vs gros
    // rouleurs) plutôt que d'être fusionné dans un seul bloc "Autre aide".
    const libelle = type === 'autre' && f.typeAideLibre ? f.typeAideLibre : LABEL_TYPE_AIDE[type];
    const cle = type === 'autre' ? `autre:${libelle}` : type;
    const taux = tauxImpositionAide(type, f.tauxImposition);
    const montantImposable = (f.montant * taux) / 100;
    const entree = parType.get(cle) ?? { type, libelle, imposable: 0, nonImposable: 0 };
    entree.imposable += montantImposable;
    entree.nonImposable += f.montant - montantImposable;
    parType.set(cle, entree);
  }
  const aidesParType = Array.from(parType.values());
  const aidesImposables = aidesParType.reduce((s, a) => s + a.imposable, 0);
  const aidesNonImposables = aidesParType.reduce((s, a) => s + a.nonImposable, 0);

  const autresRecettesImposables = emises
    .filter((f) => f.categorieRecette !== 'aide' && f.imposable !== false)
    .reduce((s, f) => s + f.montant, 0);

  return {
    annee,
    ventesProduits,
    aidesParType,
    aidesImposables,
    aidesNonImposables,
    autresRecettesImposables,
    totalImposable: ventesProduits + aidesImposables + autresRecettesImposables,
  };
}

export interface RecettesMois {
  mois: number; // 1-12
  ventesProduits: number;
  facturesEmises: number;
  aides: number;
  total: number;
}

/** Ventilation mois par mois des recettes de l'année (utile pour la déclaration trimestrielle RSA). */
export async function calculerRecettesMensuelles(annee: number): Promise<RecettesMois[]> {
  const [ventes, factures] = await Promise.all([listVentes(annee), listFactures(annee)]);
  const emises = factures.filter((f) => f.type === 'emise');

  const mois: RecettesMois[] = Array.from({ length: 12 }, (_, i) => ({
    mois: i + 1,
    ventesProduits: 0,
    facturesEmises: 0,
    aides: 0,
    total: 0,
  }));

  for (const v of ventes) {
    const m = Number(v.date.slice(5, 7)) - 1;
    if (m >= 0 && m < 12) mois[m].ventesProduits += v.prix ?? 0;
  }
  for (const f of emises) {
    const m = Number(f.date.slice(5, 7)) - 1;
    if (m < 0 || m >= 12) continue;
    if (f.categorieRecette === 'aide') mois[m].aides += f.montant;
    else mois[m].facturesEmises += f.montant;
  }
  for (const m of mois) {
    m.total = m.ventesProduits + m.facturesEmises + m.aides;
  }

  return mois;
}

// ---------------------------------------------------------------------------
// Contrôles
// ---------------------------------------------------------------------------

export async function enregistrerControle(input: Omit<Controle, 'id' | 'chevreId'>): Promise<Controle> {
  const chevreId = await resolveChevreIdParBoucle(input.chevreNumeroBoucle);
  const controle: Controle = { id: generateId(), chevreId, ...input };
  await upsertRecord('controles', yearOf(controle.date), controle);
  return controle;
}

export async function listControles(annee: number): Promise<Controle[]> {
  const items = await loadYear('controles', annee);
  return items.sort((a, b) => b.date.localeCompare(a.date));
}

export async function controlesAnnees(): Promise<number[]> {
  return getYears('controles');
}

export async function supprimerControle(id: string): Promise<void> {
  await deleteRecord('controles', id);
}

export async function listControlesPourChevre(chevreId: string): Promise<Controle[]> {
  const all = await loadAllYears('controles');
  return all.filter((c) => c.chevreId === chevreId).sort((a, b) => b.date.localeCompare(a.date));
}

// ---------------------------------------------------------------------------
// Toutes les années connues, toutes catégories confondues (pour le sélecteur d'année)
// ---------------------------------------------------------------------------

export async function toutesLesAnneesConnues(): Promise<number[]> {
  const groups = await Promise.all([
    getYears('cheptel'),
    getYears('visites_veterinaire'),
    getYears('factures'),
    getYears('ventes'),
    getYears('controles'),
  ]);
  const set = new Set<number>(groups.flat());
  set.add(new Date().getFullYear());
  return Array.from(set).sort((a, b) => b - a);
}
