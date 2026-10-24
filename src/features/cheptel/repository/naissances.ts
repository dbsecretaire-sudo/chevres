import type { Chevre, Sexe } from '@/features/cheptel/types';
import { creerChevre } from '@/features/cheptel/repository/chevres';
import { loadAllYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { TEXTES } from '@/shared/textes';

// Naissances : pas de fichier dédié — un cabrit est une Chevre dont
// dateNaissance + mereNumeroBoucle le rattachent à une portée. On enregistre
// une mise bas d'un coup (plusieurs cabrits) puis on regroupe pour l'affichage.

export interface CabritInput {
  numeroBoucle?: string;
  sexe: Sexe;
  nom?: string;
  mortNe?: boolean;
  renouvellement?: boolean;
  renouvellementAnnee?: number;
  aCompleter?: boolean;
}

export async function enregistrerNaissance(input: {
  date: string;
  mereId?: string;
  mereNumeroBoucle: string;
  cabrits: CabritInput[];
  notes?: string;
}): Promise<Chevre[]> {
  const notes = input.notes ? TEXTES.cheptel.naissances.naissanceNotes(input.notes) : undefined;

  let mereId = input.mereId;
  if (!mereId) {
    const toutes = deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL));
    mereId = toutes.find((c) => c.numeroBoucle === input.mereNumeroBoucle)?.id;
  }

  const creees = await Promise.all(
    input.cabrits.map((c) =>
      creerChevre({
        numeroBoucle: c.numeroBoucle,
        nom: c.nom,
        sexe: c.sexe,
        dateNaissance: input.date,
        mereId,
        mereNumeroBoucle: input.mereNumeroBoucle,
        notes,
        statut: c.mortNe ? STATUT_CHEVRE.MORT_NE : STATUT_CHEVRE.VIVANTE,
        renouvellement: c.renouvellement,
        renouvellementAnnee: c.renouvellement ? c.renouvellementAnnee : undefined,
        aCompleter: c.aCompleter,
      }),
    ),
  );

  return creees;
}

export interface PorteeNaissance {
  date: string;
  mereNumeroBoucle: string;
  cabrits: Chevre[];
}

/** Regroupe les cabrits du cheptel par (mère, date de naissance) pour l'écran Naissances. */
export async function listNaissancesGroupees(): Promise<PorteeNaissance[]> {
  const all = deEspeceCourante(await loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL));
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
