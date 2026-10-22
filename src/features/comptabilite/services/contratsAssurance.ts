import { ajouterMois } from '@/features/comptabilite/services/tresorerie';
import type { Facture } from '@/features/comptabilite/types';
import type { ContratAssurance, PeriodiciteAssurance, Vehicule } from '@/features/settings/settings';
import { CATEGORIE_DEPENSE, OBJET_ASSURANCE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { LABEL_OBJET_ASSURANCE } from '@/shared/textes/libelles';

/** Un contrat qu'on peut proposer d'après ce qui est déjà noté : son nom, et ce qu'on en sait (la prime, la périodicité, la prochaine échéance). */
export interface PropositionContrat {
  /** Ce qu'il couvre, avec son assureur : la même clé que celle gardée dans le contrat (`source`), pour ne pas le proposer deux fois. */
  cle: string;
  nom: string;
  prime?: number;
  periodicite: PeriodiciteAssurance;
  prochaineEcheance?: string;
}

const MOIS_PAR_PERIODICITE: Record<PeriodiciteAssurance, number> = {
  mensuelle: 1,
  trimestrielle: 3,
  semestrielle: 6,
  annuelle: 12,
};

/** La périodicité qu'on devine de l'écart entre deux primes (en jours) : environ un mois, un trimestre, un semestre ; sinon annuelle. */
export function periodiciteDeLEcart(jours: number): PeriodiciteAssurance {
  if (jours <= 45) return 'mensuelle';
  if (jours <= 135) return 'trimestrielle';
  if (jours <= 270) return 'semestrielle';
  return 'annuelle';
}

const joursEntre = (a: string, b: string): number =>
  Math.abs(Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86_400_000));

/** La première échéance à partir d'aujourd'hui, en suivant le rythme depuis la dernière prime. */
function prochaineApres(derniere: string, periodicite: PeriodiciteAssurance, aujourdhui: string): string {
  const pas = MOIS_PAR_PERIODICITE[periodicite];
  let date = ajouterMois(derniere, pas);
  for (let i = 0; i < 600 && date < aujourdhui; i += 1) date = ajouterMois(date, pas);
  return date;
}

/**
 * Les contrats qu'on propose d'ajouter à l'échéancier, tirés de ce qui est déjà noté : une proposition par assureur et par ce qu'il couvre (les
 * bâtiments, les animaux, les visiteurs, chaque véhicule), avec la dernière prime, la périodicité devinée entre les deux dernières, et la prochaine
 * échéance. Seuls les véhicules actifs (désignés par leur plaque) comptent : un véhicule inactif, ou dont l'assurance est résiliée depuis sa dernière prime,
 * n'est pas proposé. Les véhicules actifs sans assurance notée le sont aussi. Ceux déjà dans l'échéancier ne sont pas reproposés.
 */
export function propositionsDeContrats(
  factures: readonly Facture[],
  vehicules: readonly Pick<Vehicule, 'id' | 'plaque' | 'actif' | 'assuranceResilieeLe'>[],
  contrats: readonly Pick<ContratAssurance, 'source'>[],
  aujourdhui: string,
): PropositionContrat[] {
  const plaque = (id: string | undefined): string | undefined => vehicules.find((v) => v.id === id)?.plaque;
  const groupes = new Map<string, Facture[]>();
  for (const f of factures) {
    const assurance = f.categorieDepense === CATEGORIE_DEPENSE.ASSURANCES || f.categorieDepense === CATEGORIE_DEPENSE.ASSURANCE_VEHICULE;
    if (f.type !== TYPE_FACTURE.RECUE || !assurance) continue;
    // L'ancienne catégorie « assurance véhicule » couvre un véhicule.
    const objet = f.objetAssurance || (f.categorieDepense === CATEGORIE_DEPENSE.ASSURANCE_VEHICULE ? OBJET_ASSURANCE.VEHICULE : '');
    const cle = `${f.tiers}|${objet}|${f.vehiculeId ?? ''}`;
    groupes.set(cle, [...(groupes.get(cle) ?? []), f]);
  }
  const propositions: PropositionContrat[] = [];
  for (const [cle, liste] of groupes) {
    const [tiers, objet, vehiculeId] = cle.split('|');
    const triees = [...liste].sort((a, b) => b.date.localeCompare(a.date));
    if (vehiculeId) {
      const vehicule = vehicules.find((v) => v.id === vehiculeId);
      // Un véhicule qui n'est plus actif, ou dont l'assurance est résiliée depuis la dernière prime, n'a plus de contrat à suivre.
      if (!vehicule || vehicule.actif === false || (vehicule.assuranceResilieeLe && triees[0].date <= vehicule.assuranceResilieeLe)) continue;
    }
    const periodicite = triees[1] ? periodiciteDeLEcart(joursEntre(triees[0].date, triees[1].date)) : 'annuelle';
    const couvre = vehiculeId
      ? `Véhicule ${plaque(vehiculeId) ?? ''}`.trim()
      : objet
        ? (LABEL_OBJET_ASSURANCE[objet as keyof typeof LABEL_OBJET_ASSURANCE] ?? objet)
        : 'Assurance';
    propositions.push({
      cle,
      nom: tiers ? `${couvre} — ${tiers}` : couvre,
      prime: triees[0].montant,
      periodicite,
      prochaineEcheance: prochaineApres(triees[0].date, periodicite, aujourdhui),
    });
  }
  // Un véhicule de la flotte sans assurance notée.
  for (const v of vehicules.filter((x) => x.actif !== false)) {
    const cle = `|${OBJET_ASSURANCE.VEHICULE}|${v.id}`;
    if ([...groupes.keys()].some((k) => k.endsWith(`|${OBJET_ASSURANCE.VEHICULE}|${v.id}`))) continue;
    propositions.push({ cle, nom: `Véhicule ${v.plaque}`, periodicite: 'annuelle' });
  }
  const prises = new Set(contrats.map((c) => c.source).filter(Boolean));
  return propositions.filter((p) => !prises.has(p.cle)).sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
}
