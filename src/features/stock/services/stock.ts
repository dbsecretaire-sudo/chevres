import type { Facture, TypeFromage, Vente } from '@/features/comptabilite/types';
import { infosCategorie } from '@/features/stock/utils/categories';
import { lignesProductionDe } from '@/features/comptabilite/utils/lignesProduction';
import { lireArchiveStock, remplacerArchiveStock } from '@/features/stock/repository';
import type { ArchiveStock, GenreArticle, LaitJour, MouvementStock } from '@/features/stock/types';
import {
  CATEGORIE_VENTE,
  CATEGORIES_VENTE_VIANDE,
  TYPE_ALIMENT,
  TYPE_FROMAGE,
  UNITE_VENTE,
} from '@/shared/constants/comptabilite';
import {
  ARTICLE_BOUCLE,
  ARTICLE_EMBALLAGE,
  ARTICLE_MATERIEL,
  CATEGORIE_INVENTAIRE,
  CATEGORIE_PAR_GENRE,
  CONDITIONNEMENT_PAR_DEFAUT,
  FILTRE_STOCK_TOUT,
  GENRE_ARTICLE,
  CLE_PRIX_LAIT,
  CLE_PRIX_OEUFS,
  PRIX_OEUF_DEFAUT,
  ORIGINE_MOUVEMENT,
  ROLE_VIANDE,
} from '@/shared/constants/stock';
import {
  LABEL_BOUCLE,
  LABEL_EMBALLAGE,
  LABEL_MATERIEL,
  LABEL_TYPE_ALIMENT,
  LABEL_TYPE_FROMAGE,
} from '@/shared/textes/libelles';
import { typesAlimentEspece } from '@/features/comptabilite/utils/alimentation';
import {
  capitaliser,
  DICTIONNAIRE_ANIMAUX,
  especesActives,
  type EspeceAnimale,
} from '@/shared/dictionnaire/animaux';
import { laiterieActive } from '@/features/comptabilite/utils/recettes';
import { ACTIVITE_COMMUNE } from '@/shared/constants/etablissements';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { TEXTES } from '@/shared/textes';
import { generateId } from '@/shared/utils/id';
import { loadAllYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { COMPTE_BOUCLES } from '@/shared/constants/planComptable';
import { listesDOffice } from '@/features/stock/utils/doublonsListes';
import { bouclesApresAchat, synchroniserPoseBoucles } from '@/features/stock/services/boucles';
import { yearOf } from '@/shared/utils/dates';

/** L'identifiant d'un article de stock : son genre puis son code (« fromage:frais », « emballage:sac_plastique »). */
export const cleArticle = (genre: GenreArticle, code: string): string => `${genre}:${code}`;

/** Un article tel qu'on l'affiche : son identifiant, son nom et s'il a été ajouté par l'utilisateur. */
export interface ArticleAffiche {
  cle: string;
  libelle: string;
  /** Présent pour un article ajouté par l'utilisateur (le seul qu'on puisse supprimer). */
  id?: string;
  /** Le prix de vente (€) d'un fromage ou d'une viande, quand on l'a fixé. */
  prix?: number;
  /** Les litres de lait qu'il faut pour un fromage, quand on les a indiqués. */
  litresParFromage?: number;
}

/** La clé de la ligne des petits d'une espèce dans le stock de viande (cabris, agneaux, veaux, porcelets, poussins). */
export const cleJeunes = (espece: EspeceAnimale): string =>
  cleArticle(GENRE_ARTICLE.VIANDE, `${espece}_${ROLE_VIANDE.JEUNE}`);

/** Le rôle d'une ligne de viande d'office (jeunes, animal sur pied, animal vivant), ou rien pour une ligne ajoutée. */
export function roleDeLaViande(cle: string): ValeurDe<typeof ROLE_VIANDE> | undefined {
  const [, code = ''] = cle.split(':');
  const role = code.split('_')[1];
  return Object.values(ROLE_VIANDE).find((r) => r === role) && cle.startsWith(`${GENRE_ARTICLE.VIANDE}:`)
    ? (role as ValeurDe<typeof ROLE_VIANDE>)
    : undefined;
}

/**
 * Les lignes de viande tenues d'office : pour chaque espèce, ses petits (cabris, agneaux…), l'animal sur pied et l'animal
 * vivant, nommés d'après l'espèce (« Cochon sur pied », « Animaux adultes vivants » pour les chèvres).
 */
function lignesDeViandeDOffice(especes: readonly EspeceAnimale[], archive: ArchiveStock): ArticleAffiche[] {
  const nom = (cle: string, defaut: string) => archive.noms[cle] ?? defaut;
  return especes.flatMap((espece) => {
    return Object.values(ROLE_VIANDE).map((role) => {
      const cle = cleArticle(GENRE_ARTICLE.VIANDE, `${espece}_${role}`);
      const defaut =
        role === ROLE_VIANDE.JEUNE
          ? capitaliser(DICTIONNAIRE_ANIMAUX[espece].petit.pluriel)
          : role === ROLE_VIANDE.SUR_PIED
            ? DICTIONNAIRE_ANIMAUX[espece].surPied
            : DICTIONNAIRE_ANIMAUX[espece].vivant;
      return { cle, libelle: nom(cle, defaut) };
    });
  });
}

/** Ce que le filtre du stock choisit : toutes les activités, ou une espèce de l'exploitation. */
export type FiltreStock = typeof FILTRE_STOCK_TOUT | EspeceAnimale;

/**
 * Les articles d'un genre pour une activité : ceux d'office (les aliments de l'espèce ; les fromages, emballages et
 * matériel pour les chèvres et les brebis), puis ceux que l'utilisateur a ajoutés pour elle ou pour toutes les activités.
 * Sans filtre, tous. L'ordre est celui que l'utilisateur a choisi.
 */
export function articlesDuGenre(
  genre: GenreArticle,
  archive: ArchiveStock,
  filtre: FiltreStock = FILTRE_STOCK_TOUT,
  /** Pour les articles personnalisés : la liste dont on veut les articles (toutes les listes sinon). */
  listeId?: string,
): ArticleAffiche[] {
  const toutes = filtre === FILTRE_STOCK_TOUT;
  const parDefaut: ArticleAffiche[] =
    genre === GENRE_ARTICLE.ENTRETIEN ||
    genre === GENRE_ARTICLE.BATIMENT ||
    genre === GENRE_ARTICLE.EQUIPEMENT ||
    genre === GENRE_ARTICLE.PLAT ||
    genre === GENRE_ARTICLE.SAVON ||
    genre === GENRE_ARTICLE.PERSONNALISE
      ? []
      : genre === GENRE_ARTICLE.BOUCLE
        ? Object.values(ARTICLE_BOUCLE).map((code) => ({
            cle: cleArticle(genre, code),
            libelle: archive.noms[cleArticle(genre, code)] ?? LABEL_BOUCLE[code],
          }))
        : genre === GENRE_ARTICLE.VIANDE
          ? lignesDeViandeDOffice(toutes ? especesActives() : [filtre], archive)
          : genre === GENRE_ARTICLE.FROMAGE
            ? Object.values(TYPE_FROMAGE).map((code) => ({
                cle: cleArticle(genre, code),
                libelle: archive.noms[cleArticle(genre, code)] ?? LABEL_TYPE_FROMAGE[code],
              }))
            : genre === GENRE_ARTICLE.ALIMENT
              ? [
                  ...new Set(
                    (toutes ? especesActives() : [filtre]).flatMap(
                      (e) => typesAlimentEspece(e) as readonly string[],
                    ),
                  ),
                ].map((type) => ({
                  cle: cleArticle(genre, type),
                  libelle:
                    archive.noms[cleArticle(genre, type)] ??
                    LABEL_TYPE_ALIMENT[type as keyof typeof LABEL_TYPE_ALIMENT],
                }))
              : genre === GENRE_ARTICLE.EMBALLAGE
                ? Object.values(ARTICLE_EMBALLAGE).map((code) => ({
                    cle: cleArticle(genre, code),
                    libelle: archive.noms[cleArticle(genre, code)] ?? LABEL_EMBALLAGE[code],
                  }))
                : Object.values(ARTICLE_MATERIEL).map((code) => ({
                    cle: cleArticle(genre, code),
                    libelle: archive.noms[cleArticle(genre, code)] ?? LABEL_MATERIEL[code],
                  }));
  // Les articles d'office des fromages, emballages et matériel ne sont pas ceux d'un élevage qui ne fait pas de fromage.
  const dOfficeVisibles =
    genre === GENRE_ARTICLE.ALIMENT ||
    genre === GENRE_ARTICLE.VIANDE ||
    genre === GENRE_ARTICLE.BOUCLE ||
    toutes ||
    laiterieActive(filtre)
      ? parDefaut
      : [];
  const ajoutes = archive.articles
    .filter(
      (a) =>
        a.genre === genre &&
        (!listeId || a.listeId === listeId) &&
        (toutes || !a.activite || a.activite === filtre),
    )
    .map((a) => ({ cle: cleArticle(genre, a.id), libelle: a.nom, id: a.id }));
  // Un article d'office que l'utilisateur a supprimé n'est plus proposé.
  const tous = [...dOfficeVisibles.filter((a) => !archive.masques?.includes(a.cle)), ...ajoutes];
  // L'ordre choisi d'abord ; les articles qu'il ne cite pas suivent, dans l'ordre d'office.
  const ordre = archive.ordres[genre] ?? [];
  const rang = (a: ArticleAffiche) => {
    const i = ordre.indexOf(a.cle);
    return i >= 0 ? i : ordre.length + tous.indexOf(a);
  };
  return [...tous]
    .sort((a, b) => rang(a) - rang(b))
    .map((a) => ({ ...a, prix: archive.prix[a.cle], litresParFromage: archive.litresParFromage?.[a.cle] }));
}

/** Le nom d'un article d'après son identifiant (« fromage:frais » → « Frais »). */
export function libelleArticle(cle: string, archive: ArchiveStock): string {
  const [genre, code] = cle.split(':') as [GenreArticle, string];
  return articlesDuGenre(genre, archive).find((a) => a.cle === cle)?.libelle ?? code;
}

/**
 * Vrai pour les petits, l'animal sur pied et l'animal vivant : ces lignes ne se tiennent pas à la main. Les petits (cabris,
 * agneaux…) sont les animaux vivants du cheptel de l'espèce qui n'ont pas encore l'âge de sevrage ; l'animal sur pied et
 * l'animal vivant, ceux qui l'ont atteint. Une vente fait passer la fiche en « vendue » : ces nombres baissent tout seuls.
 */
export function estLigneDuCheptel(cle: string): boolean {
  return roleDeLaViande(cle) !== undefined;
}

/** Le mot qui dit d'où vient un mouvement (vente, saisie, naissance, achat, consommation). */
export function libelleOrigineMouvement(
  m: Pick<MouvementStock, 'origine' | 'automatique' | 'boucleId' | 'delta' | 'litres'>,
): string {
  if (m.automatique) return TEXTES.stock.exporter.remiseAZero;
  if (m.boucleId) return m.delta > 0 ? TEXTES.stock.entreeBoucle : TEXTES.stock.pose;
  switch (m.origine) {
    case ORIGINE_MOUVEMENT.VENTE:
      return TEXTES.stock.vente;
    case ORIGINE_MOUVEMENT.NAISSANCE:
      return TEXTES.stock.naissance;
    case ORIGINE_MOUVEMENT.ACHAT:
      return TEXTES.stock.achat;
    case ORIGINE_MOUVEMENT.CONSOMMATION:
      return TEXTES.stock.consommation;
    case ORIGINE_MOUVEMENT.RAPPEL:
      return TEXTES.stock.rappel;
    case ORIGINE_MOUVEMENT.PRODUCTION:
      return TEXTES.stock.productionLait;
    case ORIGINE_MOUVEMENT.FABRICATION:
      return TEXTES.stock.fabrication;
    case ORIGINE_MOUVEMENT.BALANCE:
      return TEXTES.stock.balanceLait;
    case ORIGINE_MOUVEMENT.VISITE:
      return TEXTES.stock.visite;
    default:
      // Des fromages entrés avec les litres de lait utilisés : une fabrication.
      return m.delta > 0 && (m.litres ?? 0) > 0 ? TEXTES.stock.fabrication : TEXTES.stock.manuel;
  }
}

/**
 * Le niveau de chaque article : la somme de ses mouvements (négatif si on a vendu plus qu'on n'avait noté). Avec les
 * effectifs du cheptel, les petits valent les petits vivants de chaque espèce (et les cabris déjà à l'abattoir, pas encore facturés), et
 * l'animal sur pied et l'animal vivant ses femelles adultes (l'animal sur pied compte aussi les adultes à l'abattoir pas encore facturés).
 */
export function niveauxDeStock(
  mouvements: MouvementStock[],
  effectifs?: Partial<Record<EspeceAnimale, { petits: number; sevres: number; femelles?: number; aFacturerAdultes?: number }>>,
): Map<string, number> {
  const niveaux = new Map<string, number>();
  for (const m of mouvements) niveaux.set(m.article, (niveaux.get(m.article) ?? 0) + m.delta);
  for (const [espece, effectif] of Object.entries(effectifs ?? {})) {
    niveaux.set(cleArticle(GENRE_ARTICLE.VIANDE, `${espece}_${ROLE_VIANDE.JEUNE}`), effectif?.petits ?? 0);
    // L'animal vivant : les adultes vivants, boucs compris. L'animal sur pied : les chèvres mortes, déjà à l'abattoir et pas
    // encore facturées (les adultes, hors cabris et tiptag).
    niveaux.set(cleArticle(GENRE_ARTICLE.VIANDE, `${espece}_${ROLE_VIANDE.VIVANT}`), effectif?.sevres ?? 0);
    niveaux.set(cleArticle(GENRE_ARTICLE.VIANDE, `${espece}_${ROLE_VIANDE.SUR_PIED}`), effectif?.aFacturerAdultes ?? 0);
  }
  return niveaux;
}

/**
 * Les emballages consommés par fromage vendu : ceux choisis, sinon ceux d'office pour ce type de fromage (aucun pour un
 * fromage ajouté). `code` est le code d'un type de fromage ou l'identifiant d'un fromage ajouté.
 */
export function conditionnementDe(code: string, archive: ArchiveStock, annee?: number): string[] {
  const personnalise = annee === undefined ? undefined : anneeDuConditionnement(code, archive, annee);
  return (
    (personnalise === undefined ? undefined : archive.conditionnementsParAnnee?.[personnalise]?.[code]) ??
    archive.conditionnements[code] ?? [...(CONDITIONNEMENT_PAR_DEFAUT[code as TypeFromage] ?? [])]
  );
}

/**
 * L'année de la personnalisation du conditionnement qui vaut pour `annee` : la plus récente jusqu'à cette année (une personnalisation
 * vaut pour l'année choisie et les suivantes). Rien quand aucune ne s'y applique : c'est alors le conditionnement de base.
 */
export function anneeDuConditionnement(
  code: string,
  archive: ArchiveStock,
  annee: number,
): number | undefined {
  return Object.entries(archive.conditionnementsParAnnee ?? {})
    .filter(([a, parCode]) => Number(a) <= annee && code in parCode)
    .map(([a]) => Number(a))
    .sort((x, y) => y - x)[0];
}

/**
 * Le fromage d'une vente dans le stock : son type, ou, pour « autre », le fromage ajouté dont le nom est celui noté dans
 * la vente (sinon « autre »).
 */
export function codeFromageDeLaVente(vente: Vente, archive: ArchiveStock): string | undefined {
  if (!vente.typeFromage) return undefined;
  if (vente.typeFromage !== TYPE_FROMAGE.AUTRE || !vente.typeFromageLibre) return vente.typeFromage;
  const nom = vente.typeFromageLibre.trim().toLowerCase();
  const ajoute = archive.articles.find(
    (a) => a.genre === GENRE_ARTICLE.FROMAGE && a.nom.trim().toLowerCase() === nom,
  );
  return ajoute?.id ?? vente.typeFromage;
}

/** Le nombre de fromages d'une vente : sa quantité (les fromages se vendent à la pièce ; au poids, rien n'est décompté). */
export function fromagesVendus(vente: Vente): number {
  return vente.unite === UNITE_VENTE.PIECE ? Math.round(vente.quantite) : 0;
}

/**
 * Les lignes de l'inventaire qu'une vente de boucherie / charcuterie peut choisir comme détail : les types de viande et de charcuterie, puis les plats préparés
 * (un plat se vend comme la charcuterie : à la pièce, lot par lot).
 */
export const lignesDeVenteDeProduits = (archive: ArchiveStock, espece?: EspeceAnimale): ArticleAffiche[] => [
  ...articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, espece),
  ...articlesDuGenre(GENRE_ARTICLE.PLAT, archive, espece),
  // Les savons ont leur propre catégorie de vente, mais leur détail se retrouve par la même liste.
  ...articlesDuGenre(GENRE_ARTICLE.SAVON, archive, espece),
];

/**
 * Vrai quand une ligne de l'inventaire est un détail possible pour cette catégorie de vente : les savons pour « Savons », les animaux du cheptel pour « Viande »,
 * les autres produits (morceaux, charcuterie, plats) pour « Boucherie / charcuterie ».
 */
export function ligneDeLaCategorie(cle: string, categorie: string): boolean {
  const savon = cle.startsWith(`${GENRE_ARTICLE.SAVON}:`);
  if (categorie === CATEGORIE_VENTE.SAVONS) return savon;
  if (savon) return false;
  return estLigneDuCheptel(cle) === (categorie === CATEGORIE_VENTE.VIANDE);
}

/**
 * Ce que la vente d'un fromage consomme : le fromage lui-même et les emballages de son conditionnement. Rien pour une
 * autre vente.
 */
export function consommationDeLaVente(
  vente: Vente,
  archive: ArchiveStock,
): { article: string; quantite: number }[] {
  // Une vente de viande retire de la ligne du stock du même nom (celle du détail de la vente) la quantité vendue.
  if ((CATEGORIES_VENTE_VIANDE as readonly string[]).includes(vente.categorie) && vente.precision) {
    const espece =
      vente.activite && vente.activite !== ACTIVITE_COMMUNE ? (vente.activite as EspeceAnimale) : undefined;
    const article = lignesDeVenteDeProduits(archive, espece).find(
      (a) => a.libelle.trim().toLowerCase() === vente.precision!.trim().toLowerCase(),
    );
    if (!article || !(vente.quantite > 0)) return [];
    // Les emballages du conditionnement de la ligne vendue baissent avec elle (la quantité vendue de chacun).
    const emballages = conditionnementDe(article.cle.split(':')[1], archive, yearOf(vente.date)).map(
      (code) => ({
        article: cleArticle(GENRE_ARTICLE.EMBALLAGE, code),
        quantite: vente.quantite,
      }),
    );
    // Les petits, l'animal sur pied et l'animal vivant : le niveau suit le cheptel (voir estLigneDuCheptel, les fiches des animaux vendus
    // changent de statut), mais la vente a son mouvement dans l'historique de l'inventaire — lié à elle : il la suit et disparaît avec elle.
    return [{ article: article.cle, quantite: vente.quantite }, ...emballages];
  }
  const fromage = codeFromageDeLaVente(vente, archive);
  if (vente.categorie !== CATEGORIE_VENTE.FROMAGE || !fromage) return [];
  const nombre = fromagesVendus(vente);
  if (nombre <= 0) return [];

  const lignes = [{ article: cleArticle(GENRE_ARTICLE.FROMAGE, fromage), quantite: nombre }];
  for (const code of conditionnementDe(fromage, archive, yearOf(vente.date))) {
    lignes.push({ article: cleArticle(GENRE_ARTICLE.EMBALLAGE, code), quantite: nombre });
  }
  return lignes;
}

/** Met le stock à jour pour une vente créée ou modifiée : ses anciens mouvements sont remplacés par les nouveaux. */
export async function synchroniserStockVente(vente: Vente): Promise<void> {
  const archive = await lireArchiveStock();
  const autres = archive.mouvements.filter((m) => m.venteId !== vente.id);
  const nouveaux: MouvementStock[] = consommationDeLaVente(vente, archive).map(({ article, quantite }) => ({
    id: generateId(),
    article,
    date: vente.date,
    delta: -quantite,
    origine: ORIGINE_MOUVEMENT.VENTE,
    venteId: vente.id,
  }));
  if (nouveaux.length === 0 && autres.length === archive.mouvements.length) return;
  await remplacerArchiveStock({ ...archive, mouvements: [...autres, ...nouveaux] });
}

/**
 * Met le stock d'aliments à jour pour une facture d'alimentation créée ou modifiée : les kilos de chaque ligne entrent au
 * stock de l'aliment choisi (celui d'office, ou celui ajouté au stock sous ce nom). Ses anciens mouvements sont remplacés par
 * les nouveaux : rien n'est compté deux fois, même si la facture est enregistrée plusieurs fois. Ce qui restait du même
 * aliment est remis à zéro (consommé) à chaque nouvel achat : voir avecRemisesAZero.
 */
export async function synchroniserStockAlimentation(facture: Facture): Promise<void> {
  const archive = await lireArchiveStock();
  const autres = archive.mouvements.filter((m) => m.factureId !== facture.id);
  const nouveaux: MouvementStock[] = [];
  for (const ligne of facture.lignesAlimentation ?? []) {
    if (!ligne.quantiteKg) continue;
    // Un aliment ajouté au stock, ou un matériel ou un équipement, se retrouve par son nom.
    const cle =
      ligne.type === TYPE_ALIMENT.AUTRE
        ? [GENRE_ARTICLE.ALIMENT, GENRE_ARTICLE.BATIMENT, GENRE_ARTICLE.EQUIPEMENT]
            .flatMap((g) => articlesDuGenre(g, archive))
            .find((a) => a.libelle === ligne.typeLibre)?.cle
        : cleArticle(GENRE_ARTICLE.ALIMENT, ligne.type);
    if (!cle) continue;
    nouveaux.push({
      id: generateId(),
      article: cle,
      date: facture.date,
      delta: ligne.quantiteKg,
      origine: ORIGINE_MOUVEMENT.ACHAT,
      factureId: facture.id,
    });
  }
  // Un achat de production (sel, emballages, boucles…) : la quantité de chaque fourniture entre au stock de son article.
  for (const ligne of lignesProductionDe(facture)) {
    if (!ligne.article || !(ligne.quantite && ligne.quantite > 0)) continue;
    nouveaux.push({
      id: generateId(),
      article: ligne.article,
      date: facture.date,
      delta: ligne.quantite,
      origine: ORIGINE_MOUVEMENT.ACHAT,
      factureId: facture.id,
    });
  }
  // Un achat de boucles : chacune entre dans l'inventaire avec son numéro (de la première, à la suite).
  const boucles = bouclesApresAchat(archive.boucles ?? [], facture);
  const bouclesChangees = JSON.stringify(boucles) !== JSON.stringify(archive.boucles ?? []);
  if (nouveaux.length === 0 && autres.length === archive.mouvements.length && !bouclesChangees) return;
  await remplacerArchiveStock({ ...archive, mouvements: [...autres, ...nouveaux], boucles });
  // Des animaux portent peut-être déjà certaines de ces boucles : elles sont alors posées.
  if (bouclesChangees) await synchroniserPoseBoucles();
}

/**
 * Les articles que l'on peut acheter pour la production (emballages, matériel, équipement, bâtiment, entretien et les
 * articles des listes ajoutées) : ceux dont un achat augmente le stock.
 */
export const articlesAchetables = (archive: ArchiveStock): ArticleAffiche[] =>
  [
    GENRE_ARTICLE.EMBALLAGE,
    GENRE_ARTICLE.MATERIEL,
    GENRE_ARTICLE.EQUIPEMENT,
    GENRE_ARTICLE.BATIMENT,
    GENRE_ARTICLE.ENTRETIEN,
    GENRE_ARTICLE.BOUCLE,
    GENRE_ARTICLE.PERSONNALISE,
  ].flatMap((genre) => articlesDuGenre(genre, archive));

/**
 * Les fournitures d'un achat de production : les articles des sections « autres approvisionnements » (classe 32 : emballages,
 * entretien, équipement consommable) et « immobilisations » (classe 21 : matériel, bâtiment) de l'inventaire, avec les listes ajoutées
 * rangées dans l'une de ces sections. Ni les produits finis (35), ni les matières premières (31 : aliments, boucles).
 */
export function rubriquesDeFournitures(archive: ArchiveStock): { genre: GenreArticle; listeId?: string }[] {
  const classeDe = (categorie: string) =>
    infosCategorie(categorie, archive.categories, archive.reglagesCategories).classe;
  const classes = [CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS, CATEGORIE_INVENTAIRE.IMMOBILISATIONS].map(
    classeDe,
  );
  const fourniture = (categorie: string) => classes.includes(classeDe(categorie));
  const genres = [
    GENRE_ARTICLE.EMBALLAGE,
    GENRE_ARTICLE.EQUIPEMENT,
    GENRE_ARTICLE.ENTRETIEN,
    GENRE_ARTICLE.MATERIEL,
    GENRE_ARTICLE.BATIMENT,
  ].filter((g) => fourniture(CATEGORIE_PAR_GENRE[g]));
  return [
    ...genres.map((genre) => ({ genre })),
    ...(archive.listes ?? [])
      .filter((l) => fourniture(l.categorie))
      .map((l) => ({ genre: GENRE_ARTICLE.PERSONNALISE as GenreArticle, listeId: l.id })),
  ];
}

/** Les articles qu'une facture d'achat de production peut fournir : ceux des rubriques de fournitures (emballages, entretien, matériel, listes ajoutées). */
export function articlesDeFournitures(archive: ArchiveStock): ArticleAffiche[] {
  return rubriquesDeFournitures(archive).flatMap((r) =>
    r.listeId
      ? articlesDuGenre(GENRE_ARTICLE.PERSONNALISE, archive, FILTRE_STOCK_TOUT, r.listeId)
      : articlesDuGenre(r.genre, archive),
  );
}

/** Les comptes qui ont une liste dans l'inventaire : ceux des listes d'office et des listes ajoutées, et celui des boucles d'identification. */
export const comptesDeLInventaire = (archive: Pick<ArchiveStock, 'listes'>): string[] => [
  ...new Set([
    ...(archive.listes ?? []).map((l) => l.compte),
    ...listesDOffice().map((l) => l.compte),
    COMPTE_BOUCLES.numero,
  ]),
];

/** Retire du stock ce qu'une facture d'alimentation supprimée y avait ajouté. */
export async function retirerStockAlimentation(factureId: string): Promise<void> {
  const archive = await lireArchiveStock();
  const boucles = (archive.boucles ?? []).filter((b) => b.factureId !== factureId);
  const parties = new Set((archive.boucles ?? []).filter((b) => b.factureId === factureId).map((b) => b.id));
  const restants = archive.mouvements.filter(
    (m) => m.factureId !== factureId && !parties.has(m.boucleId ?? ''),
  );
  if (restants.length !== archive.mouvements.length || boucles.length !== (archive.boucles ?? []).length) {
    await remplacerArchiveStock({ ...archive, mouvements: restants, boucles });
  }
}

/** Rend au stock ce qu'une vente supprimée avait consommé. */
export async function retirerStockVente(venteId: string): Promise<void> {
  const archive = await lireArchiveStock();
  const restants = archive.mouvements.filter((m) => m.venteId !== venteId);
  if (restants.length !== archive.mouvements.length) {
    await remplacerArchiveStock({ ...archive, mouvements: restants });
  }
}

/**
 * Ajoute (quantité positive) ou retire (négative) des unités d'un article, à la main : production, achat, casse…
 * Pour des fromages fabriqués, on peut noter les litres de lait qu'il a fallu.
 */
export async function ajouterMouvementManuel(
  article: string,
  delta: number,
  date: string,
  litres?: number,
  origine: ValeurDe<typeof ORIGINE_MOUVEMENT> = ORIGINE_MOUVEMENT.MANUEL,
): Promise<void> {
  const archive = await lireArchiveStock();
  await remplacerArchiveStock({
    ...archive,
    mouvements: [...archive.mouvements, { id: generateId(), article, date, delta, origine, litres }],
  });
}

/** Ajoute un article (fromage, emballage ou matériel) avec le nom choisi. */
export async function ajouterArticle(
  genre: GenreArticle,
  nom: string,
  activite?: string,
  /** Pour un article personnalisé : la liste qui le contient. */
  listeId?: string,
): Promise<string> {
  const archive = await lireArchiveStock();
  const id = generateId();
  await remplacerArchiveStock({
    ...archive,
    articles: [...archive.articles, { id, genre, nom: nom.trim(), activite, listeId }],
  });
  return cleArticle(genre, id);
}

/** Supprime un article ajouté par l'utilisateur, ses mouvements, et son nom dans les conditionnements. */
export async function supprimerArticle(id: string): Promise<void> {
  const archive = await lireArchiveStock();
  const conditionnements: ArchiveStock['conditionnements'] = {};
  for (const [code, emballages] of Object.entries(archive.conditionnements)) {
    if (code !== id) conditionnements[code] = emballages.filter((e) => e !== id);
  }
  const conditionnementsParAnnee: Record<string, Record<string, string[]>> = {};
  for (const [annee, parCode] of Object.entries(archive.conditionnementsParAnnee ?? {})) {
    conditionnementsParAnnee[annee] = {};
    for (const [code, emballages] of Object.entries(parCode)) {
      if (code !== id) conditionnementsParAnnee[annee][code] = emballages.filter((e) => e !== id);
    }
  }
  const ordres: ArchiveStock['ordres'] = {};
  for (const [genre, cles] of Object.entries(archive.ordres)) {
    ordres[genre as GenreArticle] = (cles ?? []).filter((cle) => cle.split(':')[1] !== id);
  }
  await remplacerArchiveStock({
    ...archive,
    mouvements: archive.mouvements.filter((m) => m.article.split(':')[1] !== id),
    articles: archive.articles.filter((a) => a.id !== id),
    conditionnements,
    conditionnementsParAnnee,
    ordres,
  });
}

/** Supprime un article d'office (il ne se retire pas du code : on le masque), avec ses mouvements et son prix. */
export async function masquerArticle(cle: string): Promise<void> {
  const archive = await lireArchiveStock();
  const prix = { ...archive.prix };
  delete prix[cle];
  const litresParFromage = { ...archive.litresParFromage };
  delete litresParFromage[cle];
  await remplacerArchiveStock({
    ...archive,
    mouvements: archive.mouvements.filter((m) => m.article !== cle),
    prix,
    litresParFromage,
    masques: [...new Set([...(archive.masques ?? []), cle])],
  });
}

/** Fixe le prix de vente d'un article (un fromage ou une viande) ; sans prix, il est retiré. */
export async function definirPrixArticle(cle: string, prix: number | undefined): Promise<void> {
  const archive = await lireArchiveStock();
  const autres = { ...archive.prix };
  delete autres[cle];
  await remplacerArchiveStock({ ...archive, prix: prix && prix > 0 ? { ...autres, [cle]: prix } : autres });
}

/** Fixe les litres de lait qu'il faut pour un fromage ; sans litres, ils sont retirés. */
export async function definirLitresParFromage(cle: string, litres: number | undefined): Promise<void> {
  const archive = await lireArchiveStock();
  const autres = { ...archive.litresParFromage };
  delete autres[cle];
  await remplacerArchiveStock({
    ...archive,
    litresParFromage: litres && litres > 0 ? { ...autres, [cle]: litres } : autres,
  });
}

/** Enregistre le litrage d'un jour : un nouveau (sans identifiant) ou un litrage modifié. */
export async function enregistrerLaitJour(entree: Omit<LaitJour, 'id'> & { id?: string }): Promise<void> {
  const archive = await lireArchiveStock();
  const complete: LaitJour = { ...entree, id: entree.id ?? generateId() };
  const existe = archive.lait.some((l) => l.id === complete.id);
  await remplacerArchiveStock({
    ...archive,
    lait: existe
      ? archive.lait.map((l) => (l.id === complete.id ? complete : l))
      : [...archive.lait, complete],
  });
}

export async function supprimerLaitJour(id: string): Promise<void> {
  const archive = await lireArchiveStock();
  await remplacerArchiveStock({ ...archive, lait: archive.lait.filter((l) => l.id !== id) });
}

/** Change le nom d'un article : celui d'un article ajouté, ou le nom affiché d'un article d'office. */
export async function renommerArticle(cle: string, nom: string): Promise<void> {
  const archive = await lireArchiveStock();
  const id = cle.split(':')[1];
  if (archive.articles.some((a) => a.id === id)) {
    await remplacerArchiveStock({
      ...archive,
      articles: archive.articles.map((a) => (a.id === id ? { ...a, nom: nom.trim() } : a)),
    });
  } else {
    await remplacerArchiveStock({ ...archive, noms: { ...archive.noms, [cle]: nom.trim() } });
  }
}

/**
 * Refait les mouvements de stock des ventes déjà enregistrées (celles de l'année donnée et des suivantes, ou toutes) d'après le
 * conditionnement en vigueur à leur date : un conditionnement modifié met le stock à jour, au lieu de ne valoir que pour les ventes à venir.
 */
export async function resynchroniserStockDesVentes(depuisAnnee?: number): Promise<boolean> {
  const ventes = (await loadAllYears(CATEGORIE_STOCKAGE.VENTES)).filter(
    (v) => depuisAnnee === undefined || yearOf(v.date) >= depuisAnnee,
  );
  if (ventes.length === 0) return false;
  const archive = await lireArchiveStock();
  const ids = new Set(ventes.map((v) => v.id));
  const autres = archive.mouvements.filter((m) => !(m.venteId && ids.has(m.venteId)));
  const anciens = archive.mouvements.filter((m) => m.venteId && ids.has(m.venteId));
  const nouveaux: MouvementStock[] = ventes.flatMap((vente) =>
    consommationDeLaVente(vente, archive).map(({ article, quantite }) => ({
      id: generateId(),
      article,
      date: vente.date,
      delta: -quantite,
      origine: ORIGINE_MOUVEMENT.VENTE,
      venteId: vente.id,
    })),
  );
  // Rien n'est réécrit quand les mouvements sont déjà ceux que le conditionnement donne.
  const signature = (liste: MouvementStock[]) =>
    liste
      .map((m) => `${m.venteId}|${m.article}|${m.date}|${m.delta}`)
      .sort()
      .join('\n');
  if (signature(anciens) === signature(nouveaux)) return false;
  await remplacerArchiveStock({ ...archive, mouvements: [...autres, ...nouveaux] });
  return true;
}

/** Choisit les emballages consommés par fromage vendu pour un fromage (son code, ou l'identifiant d'un fromage ajouté). */
export async function definirConditionnement(
  code: string,
  emballages: string[],
  /** Avec une année : le conditionnement vaut à partir de cette année (les années d'avant gardent le leur). */
  annee?: number,
): Promise<void> {
  const archive = await lireArchiveStock();
  if (annee === undefined) {
    await remplacerArchiveStock({
      ...archive,
      conditionnements: { ...archive.conditionnements, [code]: emballages },
    });
    await resynchroniserStockDesVentes();
    return;
  }
  const parAnnee = { ...(archive.conditionnementsParAnnee ?? {}) };
  parAnnee[String(annee)] = { ...(parAnnee[String(annee)] ?? {}), [code]: emballages };
  await remplacerArchiveStock({ ...archive, conditionnementsParAnnee: parAnnee });
  await resynchroniserStockDesVentes(annee);
}

/** Retire le conditionnement choisi d'un élément (un fromage retrouve celui d'office, une autre ligne n'en a plus). */
export async function retirerConditionnement(code: string, annee?: number): Promise<void> {
  const archive = await lireArchiveStock();
  if (annee !== undefined) {
    // Seule la personnalisation de cette année est retirée : l'année retrouve le conditionnement d'avant.
    const parAnnee = { ...(archive.conditionnementsParAnnee ?? {}) };
    const { [code]: _retire, ...reste } = parAnnee[String(annee)] ?? {};
    if (Object.keys(reste).length > 0) parAnnee[String(annee)] = reste;
    else delete parAnnee[String(annee)];
    await remplacerArchiveStock({ ...archive, conditionnementsParAnnee: parAnnee });
    await resynchroniserStockDesVentes(annee);
    return;
  }
  const conditionnements = { ...archive.conditionnements };
  delete conditionnements[code];
  // Le conditionnement retiré l'est aussi de toutes les années.
  const parAnnee: Record<string, Record<string, string[]>> = {};
  for (const [a, parCode] of Object.entries(archive.conditionnementsParAnnee ?? {})) {
    const { [code]: _retire, ...reste } = parCode;
    if (Object.keys(reste).length > 0) parAnnee[a] = reste;
  }
  await remplacerArchiveStock({ ...archive, conditionnements, conditionnementsParAnnee: parAnnee });
  await resynchroniserStockDesVentes();
}

/** Place un article à un index précis de la liste de son genre (après l'avoir glissé à cet endroit). */
export async function positionnerArticle(
  genre: GenreArticle,
  cle: string,
  nouvelIndex: number,
  /** La liste affichée (filtrée par activité) dans laquelle on a glissé la ligne. */
  filtre: FiltreStock = FILTRE_STOCK_TOUT,
): Promise<void> {
  const archive = await lireArchiveStock();
  const plein = articlesDuGenre(genre, archive).map((a) => a.cle);
  const affichees = articlesDuGenre(genre, archive, filtre).map((a) => a.cle);
  const index = affichees.indexOf(cle);
  if (index < 0 || nouvelIndex < 0 || nouvelIndex >= affichees.length) return;
  affichees.splice(nouvelIndex, 0, ...affichees.splice(index, 1));
  // Les lignes affichées reprennent, dans leur nouvel ordre, les places qu'elles occupaient dans la liste complète.
  const places = plein.map((c, i) => (affichees.includes(c) ? i : -1)).filter((i) => i >= 0);
  const cles = [...plein];
  places.forEach((place, rang) => (cles[place] = affichees[rang]));
  await remplacerArchiveStock({ ...archive, ordres: { ...archive.ordres, [genre]: cles } });
}

/** Le lait : ce qui a été produit, ce qui a servi aux fromages, ce qui a été vendu, et ce qu'il en reste. */
export interface BilanLait {
  produit: number;
  utilise: number;
  vendu: number;
  restant: number;
}

/**
 * Le bilan du lait : les litres notés jour par jour, moins ceux des fabrications (les litres saisis en ajoutant des fromages ;
 * pour le brocciu, ceux versés dans le lactosérum) et ceux des ventes de lait.
 */
export function bilanLait(archive: ArchiveStock, litresVendus: number): BilanLait {
  const arrondi = (nombre: number) => Math.round(nombre * 100) / 100;
  const note = archive.lait.reduce((total, l) => total + l.litres, 0);
  const utilise = archive.mouvements
    .filter((m) => m.origine === ORIGINE_MOUVEMENT.MANUEL && m.delta > 0)
    .reduce((total, m) => total + (m.litres ?? 0), 0);
  // Tout ce qui a été utilisé ou vendu a forcément été produit : le lait produit est au moins ce qui est sorti (le litrage noté
  // peut être plus grand, la différence est ce qu'il reste).
  const produit = Math.max(note, utilise + litresVendus);
  return {
    produit: arrondi(produit),
    utilise: arrondi(utilise),
    vendu: arrondi(litresVendus),
    restant: arrondi(produit - utilise - litresVendus),
  };
}

/** Une sortie de lait (vente au récolteur, fabrication de fromages) : son identifiant, sa date et ses litres. */
export interface SortieLait {
  id: string;
  date: string;
  litres: number;
}

/**
 * La balance automatique du lait : tout ce qui est sorti (vendu, utilisé en fromagerie) a forcément été produit. Les sorties, de la
 * plus ancienne à la plus récente, puisent d'abord dans le lait noté au journal ; ce qui n'est pas couvert est ajouté en production,
 * pour la même quantité et à la même date que la sortie. Le total produit est ainsi le plus grand du lait noté et du lait sorti,
 * comme dans le bilan du lait.
 */
export function productionDeduite(litresNotes: number, sorties: SortieLait[]): SortieLait[] {
  let reserve = litresNotes;
  const deduites: SortieLait[] = [];
  for (const sortie of [...sorties].sort((a, b) => a.date.localeCompare(b.date))) {
    const couvert = Math.min(reserve, sortie.litres);
    reserve -= couvert;
    const reste = Math.round((sortie.litres - couvert) * 100) / 100;
    if (reste > 0) deduites.push({ ...sortie, litres: reste });
  }
  return deduites;
}

/** Le lait utilisé pour les fabrications d'un fromage sur une année : par fromage, et mois par mois. */
export interface StatistiqueLait {
  /** Litres de lait par fromage sur l'année. */
  litresParFromage: number;
  litres: number;
  fromages: number;
  /** Litres par fromage pour chaque mois (janvier = index 0) ; absent quand rien n'a été fabriqué ce mois-là. */
  parMois: (number | undefined)[];
}

/**
 * Le lait qu'il a fallu par fromage, d'après les fabrications notées dans le stock avec leurs litres (un ajout de fromages
 * et les litres de lait utilisés). Pour le brocciu, les litres sont ceux versés dans le lactosérum. Absent sans donnée.
 */
export function statistiqueLait(
  mouvements: MouvementStock[],
  cle: string,
  annee: number,
): StatistiqueLait | undefined {
  const fabrications = mouvements.filter(
    (m) =>
      m.article === cle &&
      m.origine === ORIGINE_MOUVEMENT.MANUEL &&
      m.delta > 0 &&
      (m.litres ?? 0) > 0 &&
      m.date.startsWith(String(annee)),
  );
  const somme = (liste: MouvementStock[], champ: 'litres' | 'delta') =>
    liste.reduce((total, m) => total + (m[champ] ?? 0), 0);
  const litres = somme(fabrications, 'litres');
  const fromages = somme(fabrications, 'delta');
  if (fromages <= 0) return undefined;
  const arrondi = (nombre: number) => Math.round(nombre * 100) / 100;
  return {
    litres,
    fromages,
    litresParFromage: arrondi(litres / fromages),
    parMois: Array.from({ length: 12 }, (_, mois) => {
      const duMois = fabrications.filter((m) => Number(m.date.slice(5, 7)) === mois + 1);
      const fromagesDuMois = somme(duMois, 'delta');
      return fromagesDuMois > 0 ? arrondi(somme(duMois, 'litres') / fromagesDuMois) : undefined;
    }),
  };
}

/**
 * Le prix de vente défini à l'inventaire pour ce que la vente a vendu : le litre de lait, le fromage de son type, la ligne de
 * viande de son détail. Rien quand l'inventaire n'en a pas (ou pour une vente sans inventaire, comme les œufs).
 */
/** Le prix de vente de l'œuf : celui de l'inventaire, sinon le prix d'office (0,50 €). */
export const prixDesOeufs = (archive: Pick<ArchiveStock, 'prix'>): number =>
  archive.prix[CLE_PRIX_OEUFS] ?? PRIX_OEUF_DEFAUT;

export function prixUnitaireDeLaVente(
  vente: Vente,
  archive: ArchiveStock,
  /** Les prix de la catégorie du contact de la vente, par identifiant d'article (la grille de tarifs) : ils passent avant l'inventaire. */
  prixDuContact?: Record<string, number>,
): number | undefined {
  if (vente.categorie === CATEGORIE_VENTE.LAIT) return archive.prix[CLE_PRIX_LAIT];
  if (vente.categorie === CATEGORIE_VENTE.OEUFS) return prixDesOeufs(archive);
  if (vente.categorie === CATEGORIE_VENTE.FROMAGE) {
    const code = codeFromageDeLaVente(vente, archive);
    if (!code) return undefined;
    const article = cleArticle(GENRE_ARTICLE.FROMAGE, code);
    return prixDuContact?.[article] ?? archive.prix[article];
  }
  const ligne = ligneDeViandeDeLaVente(vente, archive);
  return ligne ? (prixDuContact?.[ligne.cle] ?? archive.prix[ligne.cle]) : undefined;
}

/** Le rôle de la ligne de viande choisie comme détail d'une vente (cabris, animal sur pied, animal vivant) ; rien pour une autre ligne. */
export function roleDeLaLigneDeLaVente(
  vente: Pick<Vente, 'categorie' | 'precision' | 'activite'>,
  archive: ArchiveStock,
): ValeurDe<typeof ROLE_VIANDE> | undefined {
  const ligne = ligneDeViandeDeLaVente(vente as Vente, archive);
  return ligne ? roleDeLaViande(ligne.cle) : undefined;
}

/** L'article de l'inventaire (« plat:… », « viande:… ») qu'une vente de viande, de charcuterie ou de plat a choisi comme détail ; rien pour une autre vente. */
export const articleDeLaLigneDeLaVente = (vente: Pick<Vente, 'categorie' | 'precision' | 'activite'>, archive: ArchiveStock): string | undefined =>
  ligneDeViandeDeLaVente(vente as Vente, archive)?.cle;

/** La ligne de viande de l'inventaire qu'une vente a choisie comme détail (un animal, un morceau, un produit). */
function ligneDeViandeDeLaVente(vente: Vente, archive: ArchiveStock): ArticleAffiche | undefined {
  if (!(CATEGORIES_VENTE_VIANDE as readonly string[]).includes(vente.categorie) || !vente.precision)
    return undefined;
  const espece =
    vente.activite && vente.activite !== ACTIVITE_COMMUNE ? (vente.activite as EspeceAnimale) : undefined;
  return lignesDeVenteDeProduits(archive, espece).find(
    (a) => a.libelle.trim().toLowerCase() === vente.precision!.trim().toLowerCase(),
  );
}

/**
 * Le prix total d'une vente, tel que l'inventaire le fixe : le prix défini là × la quantité (les litres, les fromages, les
 * morceaux) — ou × le poids pour un animal, dont le prix se compte au kilo. Rien quand l'inventaire ne donne pas de prix.
 */
export function totalDeLaVente(
  vente: Vente,
  archive: ArchiveStock,
  prixDuContact?: Record<string, number>,
): number | undefined {
  // Le prix unitaire personnalisé de la vente (s'il y en a un) remplace celui de l'inventaire. Des animaux vivants vendus au poids vif (réforme) :
  // le prix au kilo se saisit, l'inventaire ne le donne pas (il donne celui d'un animal).
  if (vente.venduAuPoids && !vente.prixUnitairePersonnalise) return undefined;
  const unitaire = vente.prixUnitairePersonnalise || prixUnitaireDeLaVente(vente, archive, prixDuContact);
  if (!unitaire) return undefined;
  // Un petit ou un animal sur pied se vend au kilo (son poids, 1 kg tant qu'il n'est pas saisi) ; un animal vivant (élevage, lait, compagnie), à
  // la tête ; le reste, à la pièce ou au litre.
  const ligne = ligneDeViandeDeLaVente(vente, archive);
  const role = ligne ? roleDeLaViande(ligne.cle) : undefined;
  const auKilo = role !== undefined && (role !== ROLE_VIANDE.VIVANT || !!vente.venduAuPoids);
  const multiplicateur = auKilo ? (vente.poidsKg ?? 0) || 1 : vente.quantite;
  if (!(multiplicateur > 0)) return undefined;
  return Math.round(unitaire * multiplicateur * 100) / 100;
}
