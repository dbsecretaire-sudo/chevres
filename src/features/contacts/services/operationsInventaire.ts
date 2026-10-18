import { laiterieActive, oeufsActifs } from '@/features/comptabilite/utils/recettes';
import { lireArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock } from '@/features/stock/types';
import { SECTIONS, categoriesDeLEtablissement } from '@/features/stock/utils/categories';
import { CATEGORIE_DEPENSE, GROUPE_RECETTE } from '@/shared/constants/comptabilite';
import { CATEGORIE_INVENTAIRE, SECTION_STOCK } from '@/shared/constants/stock';
import { especeCourante } from '@/shared/dictionnaire/animaux';

/**
 * Les opérations d'une catégorie de contact : pour chaque liste de l'inventaire (Fromages, Animaux, Aliments…), vendre ou acheter. Un contact
 * peut acheter ou vendre dans les dépenses comme dans les recettes : chaque liste a donc toujours ses deux sens.
 */
export type SensOperation = 'vente' | 'achat';

/** Une liste de l'inventaire proposée dans les opérations (d'office, ou ajoutée par l'utilisateur). */
export interface ListeOperation {
  /** L'identifiant de la liste : celui de sa section d'office, ou « perso:… » pour une liste ajoutée. */
  cle: string;
  titre: string;
}

/** Le nom d'une liste sans son préfixe : « Achat — Aliment » devient « Aliment », « Ventes — Fromages » devient « Fromages » (le sens est dans la case). */
export const nomDeLaListe = (titre: string): string => titre.replace(/^\s*(?:ventes?|achats?)\s*[—–-]\s*/i, '').trim() || titre;

/** Une catégorie de l'inventaire (Produits finis, Produits animaux…) et ses listes. */
export interface RubriqueOperations {
  categorie: string;
  titre: string;
  listes: ListeOperation[];
}

/** L'identifiant d'une opération : « produits_finis:fromages:vente ». */
export const idOperation = (categorie: string, liste: string, sens: SensOperation): string =>
  `${categorie}:${liste}:${sens}`;

/** Toutes les opérations (les deux sens de chaque liste) d'une rubrique. */
export const operationsDeLaRubrique = (rubrique: RubriqueOperations, sens?: SensOperation): string[] =>
  rubrique.listes.flatMap((l) =>
    (sens ? [sens] : (['vente', 'achat'] as const)).map((s) => idOperation(rubrique.categorie, l.cle, s)),
  );

/**
 * Les rubriques de l'inventaire avec leurs listes : celles d'office de l'espèce (pas de fromages pour des cochons, pas d'œufs sans poules),
 * puis celles que l'utilisateur a ajoutées. Une rubrique sans liste n'est pas proposée.
 */
export function rubriquesDOperations(archive: Pick<ArchiveStock, 'listes' | 'categories' | 'reglagesCategories'>): RubriqueOperations[] {
  const espece = especeCourante();
  const fromagerie = laiterieActive(espece);
  const poules = oeufsActifs(espece);
  return categoriesDeLEtablissement(archive.categories ?? [], archive.reglagesCategories ?? {})
    .map<RubriqueOperations>((c) => ({
      categorie: c.categorie,
      titre: c.nom,
      listes: [
        ...SECTIONS.filter((s) => s.categorie === c.categorie && (fromagerie || !s.fromagerie) && (poules || !s.poules)).map(
          (s) => ({ cle: s.section, titre: nomDeLaListe(s.titre) }),
        ),
        ...(archive.listes ?? [])
          .filter((l) => l.categorie === c.categorie && !l.masquePour?.includes(espece))
          .map((l) => ({ cle: `perso:${l.id}`, titre: nomDeLaListe(l.nom) })),
      ],
    }))
    .filter((r) => r.listes.length > 0);
}

/** Les rubriques de l'inventaire de l'établissement actif. */
export async function lireRubriquesDOperations(): Promise<RubriqueOperations[]> {
  return rubriquesDOperations(await lireArchiveStock());
}

/** Le libellé d'une opération : « Vente - Fromages », « Achat - Animaux ». */
export const libelleOperation = (sens: SensOperation, liste: string): string =>
  `${sens === 'vente' ? 'Vente' : 'Achat'} - ${liste}`;

// --- Le lien avec les catégories d'écriture : ce que chaque liste ouvre dans une nouvelle écriture -----------------------------------------

/** La catégorie de dépense qu'ouvre une liste de l'inventaire (achat, ou vente dans les dépenses). */
export function depenseDeLaListe(categorie: string, liste: string): string {
  if (categorie === CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX && liste === SECTION_STOCK.ANIMAUX) return CATEGORIE_DEPENSE.ANIMAUX_VIVANTS;
  if (categorie === CATEGORIE_INVENTAIRE.MATIERES_PREMIERES && liste === SECTION_STOCK.ALIMENTS) return CATEGORIE_DEPENSE.ALIMENTATION;
  if (
    categorie === CATEGORIE_INVENTAIRE.MATIERES_PREMIERES ||
    categorie === CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS ||
    categorie === CATEGORIE_INVENTAIRE.IMMOBILISATIONS
  )
    return CATEGORIE_DEPENSE.PRODUCTION;
  return CATEGORIE_DEPENSE.AUTRE;
}

/** Le groupe de recette qu'ouvre une liste de l'inventaire (vente, ou achat dans les recettes). */
export function groupeRecetteDeLaListe(categorie: string, liste: string): string {
  if (categorie === CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX && liste === SECTION_STOCK.ANIMAUX) return GROUPE_RECETTE.VIANDE;
  if (categorie === CATEGORIE_INVENTAIRE.PRODUITS_FINIS) {
    if (liste === SECTION_STOCK.FROMAGES) return GROUPE_RECETTE.FROMAGES;
    if (liste === SECTION_STOCK.LAIT) return GROUPE_RECETTE.LAIT;
    if (liste === SECTION_STOCK.OEUFS) return GROUPE_RECETTE.OEUFS;
    if (liste === SECTION_STOCK.VIANDE) return GROUPE_RECETTE.BOUCHERIE;
  }
  return GROUPE_RECETTE.AUTRE;
}

const decouper = (id: string): { categorie: string; liste: string; sens: SensOperation } | null => {
  const morceaux = id.split(':');
  const sens = morceaux[morceaux.length - 1];
  if (sens !== 'vente' && sens !== 'achat') return null;
  // « perso:abc » (liste ou catégorie ajoutée) contient des deux-points : la catégorie est le premier morceau (ou « perso:x »).
  const categorie = morceaux[0] === 'perso' ? `perso:${morceaux[1]}` : morceaux[0];
  const reste = morceaux.slice(categorie.split(':').length, -1).join(':');
  return { categorie, liste: reste, sens };
};

/**
 * Les sens qu'une liste propose dans les dépenses : l'achat, et pour les animaux aussi la vente — des animaux vivants envoyés à l'abattoir
 * sortent de l'inventaire (une vente) mais se facturent en dépense. C'est la seule vente qu'une dépense compte.
 */
export function sensDansLesDepenses(categorie: string, liste: string): SensOperation[] {
  return categorie === CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX && liste === SECTION_STOCK.ANIMAUX ? ['achat', 'vente'] : ['achat'];
}

/** Une opération que les dépenses comptent : un achat, ou la vente d'animaux (vers l'abattoir). */
export const estPermiseEnDepense = (id: string): boolean => {
  const o = decouper(id);
  return !!o && sensDansLesDepenses(o.categorie, o.liste).includes(o.sens);
};

/** Les catégories de dépense que des opérations ouvrent (chacune une fois). */
export const depensesDesOperations = (operations: readonly string[]): string[] => [
  ...new Set(operations.flatMap((id) => {
    const o = decouper(id);
    return o ? [depenseDeLaListe(o.categorie, o.liste)] : [];
  })),
];

/** Les groupes de recette que des opérations ouvrent (chacun une fois). */
export const groupesRecetteDesOperations = (operations: readonly string[]): string[] => [
  ...new Set(operations.flatMap((id) => {
    const o = decouper(id);
    return o ? [groupeRecetteDeLaListe(o.categorie, o.liste)] : [];
  })),
];

/**
 * Les opérations que des dépenses déjà réglées (avant cette organisation) ouvraient : une catégorie de dépense coche les achats des listes
 * qu'elle ouvre. Les dépenses sans liste (carburant, réparation, impôts…) n'en ont pas : elles restent à part.
 */
export function operationsDesDepenses(depenses: readonly string[], rubriques: RubriqueOperations[]): string[] {
  return rubriques.flatMap((r) =>
    r.listes
      .filter((l) => depenses.includes(depenseDeLaListe(r.categorie, l.cle)) && depenseDeLaListe(r.categorie, l.cle) !== CATEGORIE_DEPENSE.AUTRE)
      .map((l) => idOperation(r.categorie, l.cle, 'achat')),
  );
}

/** Les opérations que des groupes de recette déjà réglés ouvraient : un groupe coche les ventes des listes qu'il ouvre. */
export function operationsDesRecettes(groupes: readonly string[], rubriques: RubriqueOperations[]): string[] {
  return rubriques.flatMap((r) =>
    r.listes
      .filter((l) => groupes.includes(groupeRecetteDeLaListe(r.categorie, l.cle)) && groupeRecetteDeLaListe(r.categorie, l.cle) !== GROUPE_RECETTE.AUTRE)
      .map((l) => idOperation(r.categorie, l.cle, 'vente')),
  );
}
