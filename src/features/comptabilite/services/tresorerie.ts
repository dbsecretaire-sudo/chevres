import { listToutesFactures } from '@/features/comptabilite/repository/factures';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import type { Facture, Vente } from '@/features/comptabilite/types';
import type { ContratAssurance, Emprunt, PeriodiciteAssurance, ReglagesTresorerie } from '@/features/settings/settings';
import { CATEGORIE_DEPENSE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import {
  CATEGORIES_DEPENSE_HORS_TRESORERIE,
  CATEGORIES_RECETTE_HORS_TRESORERIE,
  TYPE_ECHEANCE,
} from '@/shared/constants/tresorerie';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { todayISO } from '@/shared/utils/dates';

// La trésorerie : le solde du compte mois par mois, d'après les paiements saisis (ventes et factures payées à leur date, ou à leur date de
// paiement), puis, à venir, les sommes à encaisser, à payer et les mensualités des emprunts. Une aide de gestion, pas un relevé de banque.

export type TypeEcheance = ValeurDe<typeof TYPE_ECHEANCE>;

/** Une somme qui doit entrer (positive) ou sortir (négative) du compte. */
export interface EvenementTresorerie {
  /** La date d'échéance (AAAA-MM-JJ). */
  date: string;
  /** Positif : une entrée ; négatif : une sortie. */
  montant: number;
  type: TypeEcheance;
  source: 'vente' | 'facture' | 'emprunt' | 'assurance';
  id: string;
  /** Le client, le fournisseur ou l'emprunt, de quoi reconnaître l'échéance. */
  libelle: string;
  /** Vrai quand la date d'échéance est dépassée et que la somme n'est toujours pas passée. */
  enRetard: boolean;
}

export interface MoisTresorerie {
  /** 1 à 12 */
  mois: number;
  encaissements: number;
  decaissements: number;
  net: number;
  /** Le solde à la fin du mois. */
  solde: number;
  /** Vrai quand le mois est à venir, ou contient des échéances qui n'ont pas encore eu lieu. */
  prevision: boolean;
}

export interface Tresorerie {
  annee: number;
  /** Vrai quand le solde de départ est renseigné : sans lui, les soldes partent de zéro. */
  soldeDefini: boolean;
  /** Le solde au 1er janvier de l'année. */
  soldeDebut: number;
  mois: MoisTresorerie[];
  /** Le solde d'aujourd'hui, d'après les paiements enregistrés. */
  soldeActuel: number;
  /** Le mois de l'année où le solde est le plus bas. */
  pointBas: { mois: number; solde: number };
  /** Le seuil d'alerte, et les mois dont le solde passe dessous. */
  seuil: number;
  alertes: { mois: number; solde: number }[];
  /** Ce qui est à venir dans les douze prochains mois (à encaisser, à payer, emprunts), de la date la plus proche à la plus lointaine. */
  echeances: EvenementTresorerie[];
  totaux: { aEncaisser: number; aPayer: number; emprunts: number };
}

export interface EntreeTresorerie {
  annee: number;
  ventes: Vente[];
  factures: Facture[];
  reglages?: ReglagesTresorerie;
  emprunts?: Emprunt[];
  /** Les contrats d'assurance de l'échéancier (à donner seulement quand il est activé). */
  contratsAssurance?: ContratAssurance[];
  /** La date d'aujourd'hui (AAAA-MM-JJ) : avant, les paiements sont faits ; après, ils sont à venir. */
  aujourdhui?: string;
}

/** Le nombre de mois à venir que l'échéancier montre. */
const MOIS_ECHEANCIER = 12;

/** Le dernier jour d'un mois (28 à 31). */
const joursDuMois = (annee: number, mois: number) => new Date(annee, mois, 0).getDate();

/** Une date ISO décalée d'un nombre de mois (le jour est ramené au dernier du mois quand il n'existe pas : 31 → 30). */
export function ajouterMois(date: string, mois: number): string {
  const [a, m, j] = date.split('-').map(Number);
  const total = a * 12 + (m - 1) + mois;
  const annee = Math.floor(total / 12);
  const moisCible = (total % 12) + 1;
  const jour = Math.min(j, joursDuMois(annee, moisCible));
  return `${annee}-${String(moisCible).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

/** Les échéances d'un emprunt : une par mois, à partir de la première. */
export function echeancesDEmprunt(emprunt: Emprunt): { date: string; montant: number }[] {
  return Array.from({ length: Math.max(0, emprunt.nombreEcheances) }, (_, i) => ({
    date: ajouterMois(emprunt.premiereEcheance, i),
    montant: emprunt.mensualite,
  }));
}

/** Le nombre de mois entre deux primes de chaque périodicité. */
const MOIS_PAR_PERIODICITE: Record<PeriodiciteAssurance, number> = {
  mensuelle: 1,
  trimestrielle: 3,
  semestrielle: 6,
  annuelle: 12,
};

/** Les échéances d'un contrat d'assurance entre deux dates (comprises) : une prime à chaque période, à partir de la prochaine échéance. */
export function echeancesDeContrat(contrat: ContratAssurance, depuis: string, jusqua: string): { date: string; montant: number }[] {
  const pas = MOIS_PAR_PERIODICITE[contrat.periodicite] ?? 12;
  const echeances: { date: string; montant: number }[] = [];
  for (let i = 0; i < 600; i += 1) {
    const date = ajouterMois(contrat.prochaineEcheance, i * pas);
    if (date > jusqua) break;
    if (date >= depuis) echeances.push({ date, montant: contrat.prime });
  }
  return echeances;
}

/** Les jours d'écart entre deux dates ISO. */
const joursEntre = (a: string, b: string): number =>
  Math.abs(Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86_400_000));

/** Une prime déjà notée comme dépense d'assurance à moins d'un mois de l'échéance : elle ne se compte pas deux fois. */
const PRIME_DEJA_NOTEE_JOURS = 30;

/** Les paiements faits (avec leur date) et les sommes à venir, d'après les ventes, les factures et les emprunts. */
function mouvements(entree: EntreeTresorerie, aujourdhui: string) {
  const faits: { date: string; montant: number }[] = [];
  const aVenir: EvenementTresorerie[] = [];

  for (const v of entree.ventes) {
    const montant = v.prix ?? 0;
    if (v.payee === false) {
      const date = v.echeance ?? v.date;
      aVenir.push({
        date,
        montant,
        type: TYPE_ECHEANCE.A_ENCAISSER,
        source: 'vente',
        id: v.id,
        libelle: v.client ?? '',
        enRetard: date < aujourdhui,
      });
    } else {
      faits.push({ date: v.datePaiement ?? v.date, montant });
    }
  }

  for (const f of entree.factures) {
    const emise = f.type === TYPE_FACTURE.EMISE;
    const horsTresorerie = emise
      ? !!f.categorieRecette && CATEGORIES_RECETTE_HORS_TRESORERIE.includes(f.categorieRecette)
      : !!f.categorieDepense && CATEGORIES_DEPENSE_HORS_TRESORERIE.includes(f.categorieDepense);
    if (horsTresorerie) continue;
    const montant = emise ? f.montant : -f.montant;
    if (f.payee === false) {
      const date = f.echeance ?? f.date;
      aVenir.push({
        date,
        montant,
        type: emise ? TYPE_ECHEANCE.A_ENCAISSER : TYPE_ECHEANCE.A_PAYER,
        source: 'facture',
        id: f.id,
        libelle: f.tiers,
        enRetard: date < aujourdhui,
      });
    } else {
      faits.push({ date: f.datePaiement ?? f.date, montant });
    }
  }

  // Les mensualités passées sont supposées déjà saisies comme des dépenses : seules celles à venir comptent.
  for (const e of entree.emprunts ?? []) {
    for (const echeance of echeancesDEmprunt(e)) {
      if (echeance.date < aujourdhui) continue;
      aVenir.push({
        date: echeance.date,
        montant: -echeance.montant,
        type: TYPE_ECHEANCE.EMPRUNT,
        source: 'emprunt',
        id: e.id,
        libelle: e.nom,
        enRetard: false,
      });
    }
  }
  // Les primes des contrats d'assurance, quand l'échéancier est activé : celles à venir, sauf celles déjà notées comme dépense.
  const horizon = ajouterMois(aujourdhui, MOIS_ECHEANCIER);
  const primesNotees = entree.factures
    .filter((f) => f.type === TYPE_FACTURE.RECUE && (f.categorieDepense === CATEGORIE_DEPENSE.ASSURANCES || f.categorieDepense === CATEGORIE_DEPENSE.ASSURANCE_VEHICULE))
    .map((f) => f.date);
  for (const contrat of entree.contratsAssurance ?? []) {
    for (const echeance of echeancesDeContrat(contrat, aujourdhui, horizon)) {
      if (primesNotees.some((d) => joursEntre(d, echeance.date) <= PRIME_DEJA_NOTEE_JOURS)) continue;
      aVenir.push({
        date: echeance.date,
        montant: -echeance.montant,
        type: TYPE_ECHEANCE.A_PAYER,
        source: 'assurance',
        id: contrat.id,
        libelle: contrat.nom,
        enRetard: false,
      });
    }
  }
  return { faits, aVenir };
}

/** La trésorerie d'une année, d'après les ventes, les factures et les emprunts donnés (calcul pur). */
export function calculerTresorerie(entree: EntreeTresorerie): Tresorerie {
  const aujourdhui = entree.aujourdhui ?? todayISO();
  const { annee } = entree;
  const depart = entree.reglages?.soldeDepart ?? 0;
  const dateDepart = entree.reglages?.dateSolde ?? '0000-01-01';
  const seuil = entree.reglages?.seuilAlerte ?? 0;
  const { faits, aVenir } = mouvements(entree, aujourdhui);
  /** La date où une somme à venir compte : celle d'aujourd'hui quand elle est en retard. */
  const dateEffective = (e: EvenementTresorerie) => (e.date < aujourdhui ? aujourdhui : e.date);
  const debutAnnee = `${annee}-01-01`;

  const faitsDepuisLeDepart = faits.filter((m) => m.date >= dateDepart);
  const soldeDebut =
    depart +
    faitsDepuisLeDepart.filter((m) => m.date < debutAnnee).reduce((t, m) => t + m.montant, 0) +
    aVenir.filter((e) => dateEffective(e) < debutAnnee).reduce((t, e) => t + e.montant, 0);
  const soldeActuel =
    depart + faitsDepuisLeDepart.filter((m) => m.date <= aujourdhui).reduce((t, m) => t + m.montant, 0);

  const moisCourant = Number(aujourdhui.slice(5, 7));
  const anneeCourante = Number(aujourdhui.slice(0, 4));
  let solde = soldeDebut;
  const mois: MoisTresorerie[] = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const cle = `${annee}-${String(m).padStart(2, '0')}`;
    const duMois = [
      ...faitsDepuisLeDepart.filter((x) => x.date.startsWith(cle)),
      ...aVenir.filter((e) => dateEffective(e).startsWith(cle)),
    ];
    const encaissements = duMois.filter((x) => x.montant > 0).reduce((t, x) => t + x.montant, 0);
    const decaissements = duMois.filter((x) => x.montant < 0).reduce((t, x) => t - x.montant, 0);
    solde += encaissements - decaissements;
    return {
      mois: m,
      encaissements,
      decaissements,
      net: encaissements - decaissements,
      solde,
      prevision:
        annee > anneeCourante ||
        (annee === anneeCourante && m > moisCourant) ||
        aVenir.some((e) => dateEffective(e).startsWith(cle)),
    };
  });

  const plusBas = mois.reduce((bas, m) => (m.solde < bas.solde ? m : bas), mois[0]);
  // L'échéancier : ce qui est à venir dans les douze prochains mois (les mensualités d'un long emprunt ne l'encombrent pas).
  const horizon = ajouterMois(aujourdhui, MOIS_ECHEANCIER);
  const echeances = aVenir.filter((e) => e.date <= horizon).sort((a, b) => a.date.localeCompare(b.date));
  const somme = (type: TypeEcheance) =>
    Math.abs(echeances.filter((e) => e.type === type).reduce((t, e) => t + e.montant, 0));

  return {
    annee,
    soldeDefini: entree.reglages?.soldeDepart !== undefined,
    soldeDebut,
    mois,
    soldeActuel,
    pointBas: { mois: plusBas.mois, solde: plusBas.solde },
    seuil,
    alertes: mois.filter((m) => m.solde < seuil).map((m) => ({ mois: m.mois, solde: m.solde })),
    echeances,
    totaux: {
      aEncaisser: somme(TYPE_ECHEANCE.A_ENCAISSER),
      aPayer: somme(TYPE_ECHEANCE.A_PAYER),
      emprunts: somme(TYPE_ECHEANCE.EMPRUNT),
    },
  };
}

/** La trésorerie d'une année, d'après les ventes, factures et emprunts enregistrés. */
export async function tresorerie(
  annee: number,
  options: { reglages?: ReglagesTresorerie; emprunts?: Emprunt[]; contratsAssurance?: ContratAssurance[] },
): Promise<Tresorerie> {
  const [ventes, factures] = await Promise.all([listToutesVentes(), listToutesFactures()]);
  return calculerTresorerie({ annee, ventes, factures, ...options });
}
