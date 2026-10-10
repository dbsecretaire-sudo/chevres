import type { Chevre, StatutChevre } from '@/features/cheptel/types';
import type { Facture, Vente } from '@/features/comptabilite/types';
import type { Controle } from '@/features/exploitation/types';
import { formaterHectares, totauxSurfaces } from '@/features/exploitation/services/surfaces';
import { PARAMETRES_LAIT, SURFACES_TERRAIN } from '@/shared/constants/controles';
import { SEXE } from '@/shared/constants/cheptel';
import { formatDateShortFR, formatMontant } from '@/shared/utils/dates';
import { lignesAnalyse } from '@/features/exploitation/services/analysesLait';
import type { BilanAlimentation } from '@/features/exploitation/services/bilanAlimentation';
import { compteDeFacture } from '@/features/export/services/lignesExport';
import { CATEGORIE_RECETTE, TYPE_ALIMENT, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import {
  LABEL_CATEGORIE_DEPENSE,
  LABEL_CATEGORIE_RECETTE,
  LABEL_CATEGORIE_VENTE,
  LABEL_TYPE_ALIMENT,
  LIBELLES_STATUT_CHEVRE,
} from '@/shared/textes/libelles';
import { TEXTES } from '@/shared/textes';

export interface RecapCompte {
  numero: string;
  libelle: string;
  total: number;
  count: number;
}

/** Regroupe les factures par compte PCG (débit en négatif, crédit en positif), triées par n° de compte. */
export function recapParCompte(factures: Facture[]): RecapCompte[] {
  const parCompte = new Map<string, Omit<RecapCompte, 'numero'>>();
  for (const f of factures) {
    const compte = compteDeFacture(f);
    if (!compte) continue;
    const existant = parCompte.get(compte.numero) ?? { libelle: compte.libelle, total: 0, count: 0 };
    existant.total += f.type === TYPE_FACTURE.RECUE ? -f.montant : f.montant;
    existant.count += 1;
    parCompte.set(compte.numero, existant);
  }
  return Array.from(parCompte.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([numero, v]) => ({ numero, ...v }));
}

/**
 * Les factures rangées par n° de compte du plan comptable, puis par date (la plus ancienne d'abord) : celles qui n'ont pas de
 * compte viennent à la fin.
 */
export function facturesParCompteEtDate(factures: Facture[]): Facture[] {
  // Sans compte : après tous les autres (« ~ » vient après les chiffres).
  const numero = (f: Facture) => compteDeFacture(f)?.numero ?? '~';
  return [...factures].sort((a, b) => numero(a).localeCompare(numero(b)) || a.date.localeCompare(b.date));
}

/** Lignes du récapitulatif par compte ; `formaterSolde` adapte la valeur au format (nombre brut ou texte). */
export function lignesRecapCompte(recap: RecapCompte[], formaterSolde: (total: number) => string | number) {
  return recap.map((r) => ({
    [TEXTES.export.colonnes.nCompte]: r.numero,
    [TEXTES.export.colonnes.libelle]: r.libelle,
    [TEXTES.export.colonnes.nombreDeFactures]: r.count,
    [TEXTES.export.colonnes.soldeEur]: formaterSolde(r.total),
  }));
}

/** Une ligne par type d'aliment, puis le total hors « autre » ; `vide` remplace les valeurs absentes. */
export function lignesAlimentation(alimentation: BilanAlimentation, vide: string) {
  return [
    ...alimentation.lignes.map((ligne) => ({
      [TEXTES.export.colonnes.aliment]: ligne.libelle,
      [TEXTES.export.colonnes.montant]: ligne.montant,
      [TEXTES.export.colonnes.quantiteKg]: ligne.quantiteKg,
      [TEXTES.export.colonnes.kgParAnimal]: ligne.kgParAnimal ?? vide,
    })),
    {
      [TEXTES.export.colonnes.aliment]: LABEL_TYPE_ALIMENT[TYPE_ALIMENT.AUTRE],
      [TEXTES.export.colonnes.montant]: alimentation.autre.montant,
      [TEXTES.export.colonnes.quantiteKg]: alimentation.autre.quantiteKg,
      [TEXTES.export.colonnes.kgParAnimal]: vide,
    },
    {
      [TEXTES.export.colonnes.aliment]: TEXTES.commun.general.totalHorsAutre,
      [TEXTES.export.colonnes.montant]: alimentation.total,
      [TEXTES.export.colonnes.quantiteKg]: alimentation.totalKg,
      [TEXTES.export.colonnes.kgParAnimal]: vide,
    },
  ];
}

/** Les recettes et les dépenses de l'année : les ventes et les factures émises, d'un côté ; les factures reçues, de l'autre. */
export function totauxDeLAnnee(ventes: Vente[], factures: Facture[]) {
  const recues = factures.filter((f) => f.type === TYPE_FACTURE.RECUE);
  const emises = factures.filter(
    (f) => f.type === TYPE_FACTURE.EMISE && f.categorieRecette !== CATEGORIE_RECETTE.DEPOT,
  );
  return {
    recettes: ventes.reduce((t, v) => t + (v.prix ?? 0), 0) + emises.reduce((t, f) => t + f.montant, 0),
    depenses: recues.reduce((t, f) => t + f.montant, 0),
    nombreDepenses: recues.length,
  };
}

/** Une ligne par catégorie (nombre et total TTC), la plus importante d'abord, puis une ligne de total. */
export function lignesParCategorie(items: Vente[] | Facture[], genre: 'ventes' | 'emises' | 'recues') {
  const c = TEXTES.export.colonnes;
  const P = TEXTES.export.pdf.annee.colonnes;
  const groupes = new Map<string, { nombre: number; total: number }>();
  const ajouter = (libelle: string, montant: number) => {
    const groupe = groupes.get(libelle) ?? { nombre: 0, total: 0 };
    groupe.nombre += 1;
    groupe.total += montant;
    groupes.set(libelle, groupe);
  };
  if (genre === 'ventes') {
    for (const v of items as Vente[]) ajouter(LABEL_CATEGORIE_VENTE[v.categorie], v.prix ?? 0);
  } else {
    for (const f of items as Facture[]) {
      if (genre === 'recues' && f.type === TYPE_FACTURE.RECUE) {
        ajouter(
          f.categorieDepense ? LABEL_CATEGORIE_DEPENSE[f.categorieDepense] : P.sansCategorie,
          f.montant,
        );
      }
      if (
        genre === 'emises' &&
        f.type === TYPE_FACTURE.EMISE &&
        f.categorieRecette !== CATEGORIE_RECETTE.DEPOT
      ) {
        ajouter(
          f.categorieRecette ? LABEL_CATEGORIE_RECETTE[f.categorieRecette] : P.sansCategorie,
          f.montant,
        );
      }
    }
  }
  const lignes = [...groupes.entries()].sort(([, a], [, b]) => b.total - a.total);
  if (lignes.length === 0) return [];
  return [
    ...lignes.map(([libelle, g]) => ({
      [c.categorie]: libelle,
      [P.nombre]: g.nombre,
      [P.totalTtc]: formatMontant(g.total),
    })),
    {
      [c.categorie]: TEXTES.export.pdf.planComptable.total,
      [P.nombre]: lignes.reduce((t, [, g]) => t + g.nombre, 0),
      [P.totalTtc]: formatMontant(lignes.reduce((t, [, g]) => t + g.total, 0)),
    },
  ];
}

/** Le cheptel de l'année par statut (vivante, vendue, morte…), femelles et mâles, puis le total. */
export function lignesSyntheseCheptel(chevres: Chevre[]) {
  const c = TEXTES.export.colonnes;
  const P = TEXTES.export.pdf.annee.colonnes;
  const parStatut = new Map<StatutChevre, { femelles: number; males: number }>();
  for (const chevre of chevres) {
    const ligne = parStatut.get(chevre.statut) ?? { femelles: 0, males: 0 };
    if (chevre.sexe === SEXE.MALE) ligne.males += 1;
    else ligne.femelles += 1;
    parStatut.set(chevre.statut, ligne);
  }
  if (parStatut.size === 0) return [];
  const lignes = [...parStatut.entries()];
  return [
    ...lignes.map(([statut, l]) => ({
      [c.statut]: LIBELLES_STATUT_CHEVRE[statut][0],
      [P.femelles]: l.femelles,
      [P.males]: l.males,
      [P.total]: l.femelles + l.males,
    })),
    {
      [c.statut]: TEXTES.export.pdf.planComptable.total,
      [P.femelles]: lignes.reduce((t, [, l]) => t + l.femelles, 0),
      [P.males]: lignes.reduce((t, [, l]) => t + l.males, 0),
      [P.total]: chevres.length,
    },
  ];
}

/** Les terrains : leurs quatre surfaces en hectares, puis le total de chaque surface. */
export function lignesTerrains(terrains: Controle[]) {
  const c = TEXTES.export.colonnes;
  const T = TEXTES.exploitation.controles.surfaces;
  const ligne = (nom: string, valeur: (cle: (typeof SURFACES_TERRAIN)[number]) => string | number) => ({
    [T.nomTerrain]: nom,
    ...Object.fromEntries(SURFACES_TERRAIN.map((cle) => [c[cle], valeur(cle)])),
  });
  if (terrains.length === 0) return [];
  const totaux = totauxSurfaces(terrains);
  return [
    ...terrains.map((t) =>
      ligne(t.type, (cle) => (t[cle] === undefined ? '' : formaterHectares(t[cle] ?? 0))),
    ),
    ligne(TEXTES.export.pdf.planComptable.total, (cle) => formaterHectares(totaux[cle])),
  ];
}

/**
 * Les analyses de lait en tableau : un paramètre par ligne, une analyse par colonne (nommée par son mois), chaque cellule avec son
 * grade quand il y en a un. Les analyses sont données par paquets de six : un tableau de plus de six colonnes ne tient pas en
 * largeur.
 */
export function tableauxAnalysesLait(analyses: Controle[], parPaquet = 6): Record<string, string>[][] {
  const L = TEXTES.exploitation.controles.lait;
  const triees = [...analyses].sort((a, b) => a.date.localeCompare(b.date));
  const paquets: Controle[][] = [];
  for (let i = 0; i < triees.length; i += parPaquet) paquets.push(triees.slice(i, i + parPaquet));
  return paquets.map((paquet) => {
    const lignes = paquet.map((a) => ({ analyse: a, lignes: lignesAnalyse(a) }));
    const parametres = PARAMETRES_LAIT.filter((p) =>
      lignes.some((l) => l.lignes.some((x) => x.cle === p.cle)),
    );
    return parametres.map((p) => ({
      [TEXTES.export.pdf.annee.colonnes.parametre]: L.parametres[p.cle],
      ...Object.fromEntries(
        lignes.map(({ analyse, lignes: resultats }) => {
          const ligne = resultats.find((x) => x.cle === p.cle);
          return [
            `${analyse.type} (${formatDateShortFR(analyse.date)})`,
            ligne ? (ligne.grade ? L.rapport.valeurGrade(ligne.valeur, ligne.grade) : ligne.valeur) : '',
          ];
        }),
      ),
    }));
  });
}
