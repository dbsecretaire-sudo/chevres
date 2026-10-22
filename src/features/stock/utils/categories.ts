import type { CategorieInventairePerso, GenreArticle, ReglageCategorie } from '@/features/stock/types';
import { ONGLET_STOCK_BAR } from '@/shared/constants/bar';
import {
  CATEGORIE_INVENTAIRE,
  CLASSE_INVENTAIRE,
  GENRE_ARTICLE,
  PREFIXE_CATEGORIE_PERSO,
  PREFIXES_COMPTE_PAR_CATEGORIE,
  SECTION_STOCK,
} from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ACTIVITE_SOCIETE } from '@/shared/constants/etablissements';
import { activitesEtablissement, modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TEXTES } from '@/shared/textes';

export type Categorie = ValeurDe<typeof CATEGORIE_INVENTAIRE>;
export type Section = ValeurDe<typeof SECTION_STOCK>;

const T = TEXTES.stock;

/** Les catégories d'une exploitation agricole, dans l'ordre de l'organisation comptable : leur nom (la marchandise est celle d'un gîte). */
export const CATEGORIES: { categorie: Categorie; nom: string }[] = [
  { categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS, nom: T.categories.produitsFinis },
  { categorie: CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX, nom: T.categories.produitsAnimaux },
  { categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES, nom: T.categories.matieresPremieres },
  { categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS, nom: T.categories.autresApprovisionnements },
  { categorie: CATEGORIE_INVENTAIRE.IMMOBILISATIONS, nom: T.categories.immobilisations },
];

/**
 * Les listes d'office de chaque catégorie : leur titre, le genre d'article qu'elles listent (le lait n'en a pas), et si elles ne valent que pour la fromagerie (chèvres et brebis). Les petits, l'animal sur pied et l'animal
 * vivant forment la catégorie des produits animaux ; les autres lignes de viande, celle des produits finis.
 */
export const SECTIONS: {
  section: Section;
  categorie: Categorie;
  titre: string;
  genre?: GenreArticle;
  fromagerie?: boolean;
  /** Vrai pour ce qui ne vaut que pour les poules (les œufs). */
  poules?: boolean;
}[] = [
  {
    section: SECTION_STOCK.FROMAGES,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
    titre: T.titresListes.fromages,
    genre: GENRE_ARTICLE.FROMAGE,
    fromagerie: true,
  },
  {
    section: SECTION_STOCK.LAIT,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
    titre: T.titresListes.lait,
    fromagerie: true,
  },
  {
    section: SECTION_STOCK.OEUFS,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
    titre: T.titresListes.oeufs,
    poules: true,
  },
  {
    section: SECTION_STOCK.VIANDE,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
    titre: T.titresListes.viande,
    genre: GENRE_ARTICLE.VIANDE,
  },
  {
    section: SECTION_STOCK.PLATS,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
    titre: T.titresListes.plats,
    genre: GENRE_ARTICLE.PLAT,
    fromagerie: true,
  },
  {
    section: SECTION_STOCK.ANIMAUX,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX,
    titre: T.titresListes.animaux,
    genre: GENRE_ARTICLE.VIANDE,
  },
  {
    section: SECTION_STOCK.ALIMENTS,
    categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES,
    titre: T.titresListes.aliments,
    genre: GENRE_ARTICLE.ALIMENT,
  },
  {
    section: SECTION_STOCK.BOUCLES,
    categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES,
    titre: T.titresListes.boucles,
    genre: GENRE_ARTICLE.BOUCLE,
  },
  {
    section: SECTION_STOCK.EMBALLAGES,
    categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
    titre: T.titresListes.emballages,
    genre: GENRE_ARTICLE.EMBALLAGE,
    fromagerie: true,
  },
  {
    section: SECTION_STOCK.ENTRETIEN,
    categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
    titre: T.titresListes.entretien,
    genre: GENRE_ARTICLE.ENTRETIEN,
  },
  {
    section: SECTION_STOCK.EQUIPEMENT_CONSOMMABLE,
    categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
    titre: T.titresListes.equipement,
    genre: GENRE_ARTICLE.EQUIPEMENT,
  },
  {
    section: SECTION_STOCK.EQUIPEMENT,
    categorie: CATEGORIE_INVENTAIRE.IMMOBILISATIONS,
    titre: T.titresListes.equipement,
    genre: GENRE_ARTICLE.MATERIEL,
    fromagerie: true,
  },
  {
    section: SECTION_STOCK.MATERIEL,
    categorie: CATEGORIE_INVENTAIRE.IMMOBILISATIONS,
    titre: T.titresListes.materiel,
    genre: GENRE_ARTICLE.BATIMENT,
  },
];

export type SectionGite = ValeurDe<typeof ONGLET_STOCK_BAR>;

const TG = TEXTES.bar.stock;

/** Les catégories de l'inventaire d'un gîte, dans l'ordre de l'organisation comptable : leur nom. */
export const CATEGORIES_GITE: { categorie: Categorie; nom: string }[] = [
  { categorie: CATEGORIE_INVENTAIRE.MARCHANDISES, nom: T.categories.marchandises },
  { categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS, nom: T.categories.autresApprovisionnements },
  { categorie: CATEGORIE_INVENTAIRE.IMMOBILISATIONS, nom: T.categories.immobilisations },
];

/** Les listes d'office de chaque catégorie d'un gîte : les boissons et la nourriture, les consommables, le matériel. */
export const SECTIONS_GITE: { section: SectionGite; categorie: Categorie; titre: string }[] = [
  {
    section: ONGLET_STOCK_BAR.CONSOMMABLES,
    categorie: CATEGORIE_INVENTAIRE.MARCHANDISES,
    titre: TG.boissonsNourriture,
  },
  {
    section: ONGLET_STOCK_BAR.CONDITIONNEMENT,
    categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
    titre: TG.onglets.conditionnement,
  },
  {
    section: ONGLET_STOCK_BAR.ENTRETIEN,
    categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
    titre: TG.onglets.entretien,
  },
  {
    section: ONGLET_STOCK_BAR.MATERIEL,
    categorie: CATEGORIE_INVENTAIRE.IMMOBILISATIONS,
    titre: TG.onglets.materiel,
  },
];

/** Le nom de chaque catégorie d'office. */
const NOMS_CATEGORIE: Record<Categorie, string> = {
  [CATEGORIE_INVENTAIRE.PRODUITS_FINIS]: T.categories.produitsFinis,
  [CATEGORIE_INVENTAIRE.PRODUITS_ANIMAUX]: T.categories.produitsAnimaux,
  [CATEGORIE_INVENTAIRE.MATIERES_PREMIERES]: T.categories.matieresPremieres,
  [CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS]: T.categories.autresApprovisionnements,
  [CATEGORIE_INVENTAIRE.MARCHANDISES]: T.categories.marchandises,
  [CATEGORIE_INVENTAIRE.IMMOBILISATIONS]: T.categories.immobilisations,
};

/** Une catégorie de l'inventaire telle qu'on l'affiche : d'office ou ajoutée par l'utilisateur. */
export interface InfosCategorie {
  /** L'identifiant : « produits_finis »… ou « perso:… » pour une catégorie ajoutée. */
  categorie: string;
  nom: string;
  /** Le numéro de classe (35, 31…). */
  classe: string;
  /** Les débuts de compte que ses listes peuvent avoir. */
  prefixes: readonly string[];
  /** Vrai pour une catégorie ajoutée par l'utilisateur (qu'il peut renommer et supprimer). */
  perso: boolean;
}

/** L'identifiant, dans les listes, d'une catégorie ajoutée. */
export const idCategoriePerso = (categorie: CategorieInventairePerso): string =>
  `${PREFIXE_CATEGORIE_PERSO}${categorie.id}`;

const estDOffice = (categorie: string): categorie is Categorie => categorie in NOMS_CATEGORIE;

/** Ce qu'on sait d'une catégorie (d'office ou ajoutée) ; une catégorie inconnue est rangée avec les autres approvisionnements. */
export function infosCategorie(
  categorie: string,
  ajoutees: CategorieInventairePerso[] = [],
  /** Ce que l'utilisateur a personnalisé des catégories d'office (voir ArchiveStock.reglagesCategories). */
  personnalises: Record<string, ReglageCategorie> = {},
): InfosCategorie {
  if (estDOffice(categorie)) {
    return {
      categorie,
      nom: personnalises[categorie]?.nom ?? NOMS_CATEGORIE[categorie],
      classe: personnalises[categorie]?.classe ?? CLASSE_INVENTAIRE[categorie],
      prefixes: personnalises[categorie]?.prefixes ?? PREFIXES_COMPTE_PAR_CATEGORIE[categorie],
      perso: false,
    };
  }
  const perso = ajoutees.find((c) => idCategoriePerso(c) === categorie);
  if (perso) {
    return { categorie, nom: perso.nom, classe: perso.classe, prefixes: perso.prefixes, perso: true };
  }
  return infosCategorie(CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS, [], personnalises);
}

/** Les catégories d'un inventaire : celles d'office données, puis celles que l'utilisateur a ajoutées (dans l'ordre d'ajout). */
export function categoriesAvecAjoutees(
  base: { categorie: Categorie; nom: string }[],
  ajoutees: CategorieInventairePerso[] = [],
  personnalises: Record<string, ReglageCategorie> = {},
): InfosCategorie[] {
  return [
    ...base.map(({ categorie }) => infosCategorie(categorie, [], personnalises)),
    ...ajoutees.map((c) => infosCategorie(idCategoriePerso(c), ajoutees, personnalises)),
  ];
}

/** Vrai pour un établissement qui est un gîte : il a ses propres catégories d'inventaire (marchandises, immobilisations…). */
export const etablissementGite = (): boolean =>
  modeEntreprise() && activitesEtablissement().includes(ACTIVITE_SOCIETE.ASSOCIATION);

/** Les catégories de l'inventaire de l'établissement, celles d'office puis celles que l'utilisateur a ajoutées. */
export const categoriesDeLEtablissement = (
  ajoutees: CategorieInventairePerso[] = [],
  personnalises: Record<string, ReglageCategorie> = {},
): InfosCategorie[] =>
  categoriesAvecAjoutees(etablissementGite() ? CATEGORIES_GITE : CATEGORIES, ajoutees, personnalises);
