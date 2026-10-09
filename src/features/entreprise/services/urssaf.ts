import type { NatureUrssaf } from '@/features/comptabilite/types';
import { recettesDeLAnnee, type RecetteEntreprise } from '@/features/entreprise/services/fiscaliteEntreprise';
import type { InfosEntreprise } from '@/features/settings/settings';
import { CATEGORIE_DEPENSE, CATEGORIE_RECETTE } from '@/shared/constants/comptabilite';
import {
  NATURE_URSSAF,
  NATURE_URSSAF_DE_L_HEBERGEMENT,
  NATURE_URSSAF_DES_SERVICES_PAR_REGIME,
  NATURE_URSSAF_DES_SERVICES_PAR_DEFAUT,
  PREFIXES_COMPTE_VENTE_MARCHANDISES,
  TAUX_URSSAF_PAR_NATURE,
} from '@/shared/constants/entreprise';

/** Le taux de cotisations (%) d'une nature de recette : celui des informations de l'entreprise, sinon le taux indicatif. */
export const tauxUrssafDe = (nature: NatureUrssaf, infos?: InfosEntreprise): number =>
  infos?.tauxUrssaf?.[nature] ?? TAUX_URSSAF_PAR_NATURE[nature];

/** La nature d'une prestation de services quand rien de plus précis n'est dit : celle du régime « micro » de l'entreprise. */
export function natureDesServices(infos?: InfosEntreprise): NatureUrssaf {
  const regime = infos?.regimeFiscal;
  return regime && regime in NATURE_URSSAF_DES_SERVICES_PAR_REGIME
    ? NATURE_URSSAF_DES_SERVICES_PAR_REGIME[regime as keyof typeof NATURE_URSSAF_DES_SERVICES_PAR_REGIME]
    : NATURE_URSSAF_DES_SERVICES_PAR_DEFAUT;
}

/**
 * La nature d'une recette pour l'URSSAF : celle choisie sur la facture ; sinon d'après sa catégorie — une vente de production,
 * de marchandises, la restauration et le bar sont des ventes de marchandises, l'hébergement une prestation commerciale ; les
 * autres prestations suivent le régime de l'entreprise (libérales en BNC, commerciales ou artisanales en BIC services).
 */
export function natureDeLaRecette(recette: RecetteEntreprise, infos?: InfosEntreprise): NatureUrssaf {
  if (recette.vente) return NATURE_URSSAF.VENTE_MARCHANDISES;
  const facture = recette.facture;
  if (!facture) return natureDesServices(infos);
  if (facture.natureUrssaf) return facture.natureUrssaf;
  // Un remboursement fait à un client (un séjour du gîte) : la nature de l'hébergement, sauf choix contraire.
  if (facture.categorieDepense === CATEGORIE_DEPENSE.REMBOURSEMENT_CLIENT)
    return NATURE_URSSAF_DE_L_HEBERGEMENT;
  const compte = facture.compteManuel ?? '';
  if (PREFIXES_COMPTE_VENTE_MARCHANDISES.some((p) => compte.startsWith(p)))
    return NATURE_URSSAF.VENTE_MARCHANDISES;
  switch (facture.categorieRecette) {
    case CATEGORIE_RECETTE.VENTE_MARCHANDISES:
    case CATEGORIE_RECETTE.RESTAURATION:
    case CATEGORIE_RECETTE.BAR:
      return NATURE_URSSAF.VENTE_MARCHANDISES;
    case CATEGORIE_RECETTE.HEBERGEMENT:
      return NATURE_URSSAF.SERVICES_COMMERCIAUX;
    default:
      return natureDesServices(infos);
  }
}

/** Ce qu'une nature de recette donne à déclarer : le chiffre d'affaires hors taxes, le taux et les cotisations. */
export interface LigneNatureUrssaf {
  nature: NatureUrssaf;
  chiffreAffaires: number;
  taux: number;
  cotisations: number;
}

/** Un mois à déclarer : le détail par nature de recette, comme dans la déclaration de l'URSSAF. */
export interface MoisUrssaf {
  /** 1 à 12 */
  mois: number;
  natures: LigneNatureUrssaf[];
  chiffreAffaires: number;
  cotisations: number;
}

export interface Urssaf {
  annee: number;
  mois: MoisUrssaf[];
  /** Le total de l'année pour chaque nature. */
  parNature: LigneNatureUrssaf[];
  totalChiffreAffaires: number;
  totalCotisations: number;
}

const auCentime = (montant: number): number => Math.round(montant * 100) / 100;

/** Les natures de recette, dans l'ordre de la déclaration. */
const NATURES = Object.values(NATURE_URSSAF) as NatureUrssaf[];

function ligne(nature: NatureUrssaf, chiffreAffaires: number, infos?: InfosEntreprise): LigneNatureUrssaf {
  const taux = tauxUrssafDe(nature, infos);
  return {
    nature,
    chiffreAffaires: auCentime(chiffreAffaires),
    taux,
    cotisations: auCentime((chiffreAffaires * taux) / 100),
  };
}

/**
 * Ce qu'une recette donne à déclarer, par nature : tout dans sa nature, sauf pour une facture de séjour dont une part est
 * une vente de marchandises (les repas) et une autre n'est pas du chiffre d'affaires (la taxe de séjour). Hors taxes ; négatif
 * pour un remboursement.
 */
function partsDeLaRecette(
  r: RecetteEntreprise,
  infos?: InfosEntreprise,
): { nature: NatureUrssaf; ht: number }[] {
  const nature = natureDeLaRecette(r, infos);
  const ht = r.ttc - r.tva;
  const facture = r.facture;
  if (!facture || (!facture.partVenteUrssaf && !facture.partHorsCaUrssaf) || r.ttc === 0)
    return [{ nature, ht }];
  const ratio = ht / r.ttc;
  const vente = (facture.partVenteUrssaf ?? 0) * ratio;
  const horsCa = (facture.partHorsCaUrssaf ?? 0) * ratio;
  return [
    { nature: NATURE_URSSAF.VENTE_MARCHANDISES, ht: vente },
    { nature, ht: ht - vente - horsCa },
  ];
}

/**
 * Les déclarations URSSAF de l'année, mois par mois : pour chaque nature de recette (vente de marchandises, prestations
 * commerciales ou artisanales, prestations libérales), le chiffre d'affaires hors taxes encaissé et les cotisations dues
 * (chiffre d'affaires × taux). Les ventes que le client ne souhaite pas déclarer (sans facture) n'y sont pas.
 */
export function urssafDe(annee: number, recettes: RecetteEntreprise[], infos?: InfosEntreprise): Urssaf {
  const montants = new Map<string, number>();
  const cle = (mois: number, nature: NatureUrssaf) => `${mois}:${nature}`;
  for (const r of recettes) {
    for (const { nature, ht } of partsDeLaRecette(r, infos)) {
      montants.set(cle(r.mois, nature), (montants.get(cle(r.mois, nature)) ?? 0) + ht);
    }
  }

  const mois: MoisUrssaf[] = Array.from({ length: 12 }, (_, i) => {
    const natures = NATURES.map((n) => ligne(n, montants.get(cle(i + 1, n)) ?? 0, infos));
    return {
      mois: i + 1,
      natures,
      chiffreAffaires: auCentime(natures.reduce((s, l) => s + l.chiffreAffaires, 0)),
      cotisations: auCentime(natures.reduce((s, l) => s + l.cotisations, 0)),
    };
  });

  const parNature = NATURES.map((n) => {
    const lignes = mois.map((m) => m.natures.find((l) => l.nature === n)!);
    return {
      nature: n,
      chiffreAffaires: auCentime(lignes.reduce((s, l) => s + l.chiffreAffaires, 0)),
      taux: tauxUrssafDe(n, infos),
      cotisations: auCentime(lignes.reduce((s, l) => s + l.cotisations, 0)),
    };
  });

  return {
    annee,
    mois,
    parNature,
    totalChiffreAffaires: auCentime(parNature.reduce((s, l) => s + l.chiffreAffaires, 0)),
    totalCotisations: auCentime(parNature.reduce((s, l) => s + l.cotisations, 0)),
  };
}

/** Les déclarations URSSAF de l'année, lues dans les ventes et factures enregistrées. */
export async function calculerUrssaf(annee: number, infos?: InfosEntreprise): Promise<Urssaf> {
  return urssafDe(annee, await recettesDeLAnnee(annee, true), infos);
}
