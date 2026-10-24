import { AncreVisite } from '@/shared/components/AncreVisite';
import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { TitreCarte } from '@/features/cheptel/components/bilan/BilanBriques';
import {
  articlesDuGenre,
  libelleArticle,
  libelleOrigineMouvement,
  type FiltreStock,
} from '@/features/stock/services/stock';
import { CLE_LAIT, mouvementsDuLait } from '@/features/stock/services/historiqueLait';
import type { ArchiveStock, GenreArticle, MouvementStock } from '@/features/stock/types';
import { idCategoriePerso, infosCategorie } from '@/features/stock/utils/categories';
import {
  CATEGORIE_INVENTAIRE,
  CHIFFRE_COMPTE_IMMOBILISATION,
  FILTRE_STOCK_TOUT,
  GENRE_ARTICLE,
  NATURE_STOCK,
  ORIGINE_MOUVEMENT,
} from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { LABEL_CATEGORIE_VENTE, NOMS_MOIS } from '@/shared/textes/libelles';
import { currentYear, formatDateShortFR } from '@/shared/utils/dates';
import { styles as stylesBilan } from '@/shared/styles/cheptel/BilanAnnuel.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

/** Un nombre avec la virgule décimale. */
const nombreFR = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');

/**
 * Les cartes de l'historique, rangées par catégorie de l'inventaire (35. Produits finis, 31. Matières premières…) : un titre, et les
 * genres d'articles dont elle compte les mouvements.
 */
/** Le nom de chaque catégorie de l'inventaire. */
const CARTES: {
  titre: string;
  genres: GenreArticle[];
  nature: ValeurDe<typeof NATURE_STOCK>;
  /** La catégorie de l'inventaire (celle de l'organisation comptable) sous laquelle la carte est rangée. */
  categorie: string;
  lait?: boolean;
  /** Une carte de ce qui se vend qui montre aussi ses entrées (les fabrications de fromages, le lait produit). */
  entrees?: boolean;
  /** Pour la carte d'une liste personnalisée : cette liste. */
  listeId?: string;
}[] = [
  {
    titre: T.sections.fromages,
    genres: [GENRE_ARTICLE.FROMAGE],
    nature: NATURE_STOCK.VENTE,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
    entrees: true,
  },
  // Le lait n'est pas un article du stock : ses « mouvements » viennent du journal de lait, des fabrications et des ventes.
  {
    titre: T.onglets.lait,
    genres: [],
    nature: NATURE_STOCK.VENTE,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
    lait: true,
    entrees: true,
  },
  {
    titre: T.onglets.viande,
    genres: [GENRE_ARTICLE.VIANDE],
    nature: NATURE_STOCK.VENTE,
    categorie: CATEGORIE_INVENTAIRE.PRODUITS_FINIS,
  },
  {
    titre: T.onglets.aliments,
    genres: [GENRE_ARTICLE.ALIMENT],
    nature: NATURE_STOCK.CONSOMMABLE,
    categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES,
  },
  {
    titre: T.sections.emballages,
    genres: [GENRE_ARTICLE.EMBALLAGE],
    nature: NATURE_STOCK.CONSOMMABLE,
    categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
  },
  {
    titre: T.sections.boucles,
    genres: [GENRE_ARTICLE.BOUCLE],
    nature: NATURE_STOCK.CONSOMMABLE,
    categorie: CATEGORIE_INVENTAIRE.MATIERES_PREMIERES,
  },
  {
    titre: T.onglets.entretien,
    genres: [GENRE_ARTICLE.ENTRETIEN],
    nature: NATURE_STOCK.CONSOMMABLE,
    categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
  },
  {
    titre: T.sections.materiel,
    genres: [GENRE_ARTICLE.EQUIPEMENT],
    nature: NATURE_STOCK.CONSOMMABLE,
    categorie: CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS,
  },
  {
    titre: T.sections.materiel,
    genres: [GENRE_ARTICLE.MATERIEL],
    nature: NATURE_STOCK.INVESTISSEMENT,
    categorie: CATEGORIE_INVENTAIRE.IMMOBILISATIONS,
  },
  {
    titre: T.onglets.materiel,
    genres: [GENRE_ARTICLE.BATIMENT],
    nature: NATURE_STOCK.INVESTISSEMENT,
    categorie: CATEGORIE_INVENTAIRE.IMMOBILISATIONS,
  },
];

/** Le début de l'« article » d'un animal vendu lu dans la comptabilité : la suite est la catégorie de la vente. */
const PREFIXE_VENTE_ANIMAUX = 'vente_animaux:';

/** Le nom d'un article de l'historique : le lait, un animal vendu (sa catégorie de vente) ou un article du stock. */
const nomArticle = (article: string, archive: ArchiveStock): string =>
  article === CLE_LAIT
    ? T.onglets.lait
    : article.startsWith(PREFIXE_VENTE_ANIMAUX)
      ? LABEL_CATEGORIE_VENTE[
          article.slice(PREFIXE_VENTE_ANIMAUX.length) as keyof typeof LABEL_CATEGORIE_VENTE
        ]
      : libelleArticle(article, archive);

interface Props {
  archive: ArchiveStock;
  /** Les espèces de l'exploitation (des étiquettes par animal quand il y en a plusieurs). */
  especes: EspeceAnimale[];
  /** L'animal regardé dans le stock quand on ouvre l'historique. */
  filtreInitial: FiltreStock;
  /** Les ventes de lait de la comptabilité (leur date et leurs litres). */
  ventesLait: { id: string; date: string; litres: number }[];
  /** Les ventes d'animaux de la comptabilité (cabris, animal sur pied, vivant, mort) : leur date et leur nombre de têtes. */
  ventesAnimaux: { id: string; date: string; nombre: number; categorie: string; activite: string }[];
}

/**
 * L'historique du stock, présenté comme le bilan annuel : les animaux et les années en étiquettes, puis une carte par type de
 * stock (aliments, fromagerie, viande, entretien) qui donne, mois par mois, le nombre de mouvements — celui de l'année
 * précédente entre parenthèses. « Détails » déroule les mouvements du mois (date, article, quantité, origine).
 */
/** Les colonnes du tableau des mouvements d'une carte : date, article, quantité (positive à la vente), origine. */
function colonnesDeLHistorique(archive: ArchiveStock, ventesSeules: boolean, lait: boolean | undefined): ColonneDuTableau<MouvementStock>[] {
  return [
    { cle: 'date', titre: 'Date', poids: 1, valeur: (m) => m.date, texte: (m) => formatDateShortFR(m.date) },
    { cle: 'article', titre: 'Article', poids: 3, valeur: (m) => nomArticle(m.article, archive) },
    {
      cle: 'quantite',
      titre: 'Quantité',
      poids: 1,
      aligne: 'droite',
      valeur: (m) => (ventesSeules ? -m.delta : m.delta),
      texte: (m) => (ventesSeules ? `${-m.delta}${lait ? ' L' : ''}` : `${m.delta > 0 ? '+' : ''}${nombreFR(m.delta)}${lait ? ' L' : ''}`),
    },
    { cle: 'origine', titre: 'Origine', poids: 2, valeur: (m) => libelleOrigineMouvement(m) },
  ];
}

export function HistoriqueStock({ archive, especes, filtreInitial, ventesLait, ventesAnimaux }: Props) {
  // L'animal est celui de la capsule du haut : la page n'a plus son propre choix.
  const [filtre] = useState<FiltreStock>(filtreInitial);
  // Le poste de comptabilité : les mouvements de l'année en tableau (date, article, quantité, origine), au lieu des mois dépliés.
  const comptable = useDispositionComptable();
  const [annee, setAnnee] = useState(currentYear());

  const annees = [
    ...new Set([currentYear(), ...archive.mouvements.map((m) => Number(m.date.slice(0, 4)))]),
  ].filter((a) => Number.isFinite(a));

  /** Les cartes : celles d'office, puis une par liste ajoutée dans la structure, rangées par catégorie (celle de la comptabilité). */
  const ordreCategories = [
    ...(Object.values(CATEGORIE_INVENTAIRE) as string[]),
    ...(archive.categories ?? []).map(idCategoriePerso),
  ];
  const cartes: (typeof CARTES)[number][] = [
    ...CARTES,
    ...(archive.listes ?? []).map((l) => ({
      titre: l.nom,
      genres: [GENRE_ARTICLE.PERSONNALISE] as GenreArticle[],
      // Les mouvements d'une liste ajoutée sont des saisies : des entrées et des sorties, comme un consommable (ou un achat).
      nature: infosCategorie(l.categorie, archive.categories, archive.reglagesCategories).prefixes.some((p) =>
        p.startsWith(CHIFFRE_COMPTE_IMMOBILISATION),
      )
        ? NATURE_STOCK.INVESTISSEMENT
        : NATURE_STOCK.CONSOMMABLE,
      categorie: l.categorie,
      listeId: l.id,
    })),
  ].sort((a, b) => ordreCategories.indexOf(a.categorie) - ordreCategories.indexOf(b.categorie));

  /** Le lait de l'historique : produit, utilisé pour les fromages et vendu (voir mouvementsDuLait). */
  const mouvementsLait = (): MouvementStock[] => mouvementsDuLait(archive, ventesLait);

  /**
   * Les animaux vendus qui ne passent par aucun article du stock (cabris, animal sur pied, vivant : ces lignes suivent le cheptel) :
   * ils n'ont pas de mouvement, on les lit donc dans les ventes de la comptabilité — celles de l'animal regardé.
   */
  const mouvementsAnimaux = (): MouvementStock[] => {
    const avecMouvement = new Set(archive.mouvements.map((m) => m.venteId).filter(Boolean));
    return ventesAnimaux
      .filter((v) => !avecMouvement.has(v.id) && (filtre === FILTRE_STOCK_TOUT || v.activite === filtre))
      .map((v) => ({
        id: v.id,
        article: `${PREFIXE_VENTE_ANIMAUX}${v.categorie}`,
        date: v.date,
        delta: -v.nombre,
        origine: ORIGINE_MOUVEMENT.VENTE,
      }));
  };

  /** Les mouvements d'une carte pour un animal (ou tous) : ceux des articles de ses genres que cet animal concerne. */
  const mouvementsDeLaCarte = (
    genres: GenreArticle[],
    avecAutomatiques = false,
    lait = false,
    listeId?: string,
  ): MouvementStock[] => {
    if (lait) return mouvementsLait();
    const animaux = genres.includes(GENRE_ARTICLE.VIANDE) ? mouvementsAnimaux() : [];
    const cles = new Set(
      genres.flatMap((g) => articlesDuGenre(g, archive, filtre, listeId).map((a) => a.cle)),
    );
    return [
      ...archive.mouvements.filter(
        (m) =>
          (avecAutomatiques || !m.automatique) &&
          genres.includes(m.article.split(':')[0] as GenreArticle) &&
          cles.has(m.article),
      ),
      ...animaux,
    ];
  };

  return (
    <View style={commonStyles.gap10}>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnnee} />
      </LigneFiltres>
      <Text style={commonStyles.note}>{T.historique.comparaison(annee, annee - 1)}</Text>

      {cartes
        .filter(({ genres, lait, listeId }) =>
          // Une carte sans article pour cet animal (la fromagerie d'une exploitation de cochons) n'a rien à montrer ; le lait
          // suit la fromagerie (chèvres et brebis).
          lait
            ? articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive, filtre).length > 0
            : genres.some((g) => articlesDuGenre(g, archive, filtre, listeId).length > 0),
        )
        .map(({ titre, genres, nature, categorie, lait, listeId, entrees }, index, visibles) => {
          const idCarte = listeId ?? (lait ? CLE_LAIT : genres[0]);
          const premiereDeSaNature = index === 0 || visibles[index - 1].categorie !== categorie;
          // Ce qui se vend (fromages, lait, viande) ne montre que ce qui a été vendu : en quantités positives.
          const ventesSeules = nature === NATURE_STOCK.VENTE && !entrees;
          const seulementVentes = (liste: MouvementStock[]) =>
            ventesSeules ? liste.filter((m) => m.origine === ORIGINE_MOUVEMENT.VENTE) : liste;
          const mouvements = seulementVentes(mouvementsDeLaCarte(genres, false, lait, listeId));
          const unite = lait
            ? ' L'
            : genres.includes(GENRE_ARTICLE.ALIMENT)
              ? ` ${TEXTES.commun.general.kg}`
              : '';
          const dansLAnnee = seulementVentes(mouvementsDeLaCarte(genres, true, lait, listeId)).filter(
            (m) => m.date.startsWith(String(annee)) && !(entrees && m.automatique),
          );
          const entre = dansLAnnee.filter((m) => m.delta > 0).reduce((somme, m) => somme + m.delta, 0);
          const sortiPar = (origine: string) =>
            -dansLAnnee
              .filter((m) => m.origine === origine)
              .reduce((somme, m) => somme + Math.min(m.delta, 0), 0);
          const bilan = entrees
            ? lait
              ? T.historique.bilanLait(
                  `${nombreFR(entre)}${unite}`,
                  `${nombreFR(sortiPar(ORIGINE_MOUVEMENT.FABRICATION))}${unite}`,
                  `${nombreFR(sortiPar(ORIGINE_MOUVEMENT.VENTE))}${unite}`,
                )
              : T.historique.bilanFromage(nombreFR(entre), nombreFR(sortiPar(ORIGINE_MOUVEMENT.VENTE)))
            : ventesSeules
              ? T.historique.bilanVendu(`${nombreFR(sortiPar(ORIGINE_MOUVEMENT.VENTE))}${unite}`)
              : nature === NATURE_STOCK.CONSOMMABLE
                ? T.historique.bilanConsommable(
                    `${nombreFR(entre)}${unite}`,
                    `${nombreFR(sortiPar(ORIGINE_MOUVEMENT.CONSOMMATION))}${unite}`,
                  )
                : T.historique.bilanInvestissement(`${nombreFR(entre)}${unite}`);
          /** Ce que les mouvements d'un mois ajoutent (ou retirent) au stock ; pour ce qui se vend, les quantités vendues. */
          const totalDuMois = (an: number, mois: number): string =>
            nombreFR(
              (ventesSeules ? -1 : 1) *
                mouvements
                  .filter((x) => x.date.startsWith(`${an}-${String(mois).padStart(2, '0')}`))
                  .reduce((somme, x) => somme + x.delta, 0),
            );
          const totalDeLAnnee = (an: number): string =>
            nombreFR((ventesSeules ? -1 : 1) * mouvements.filter((x) => x.date.startsWith(String(an))).reduce((somme, x) => somme + x.delta, 0));
          const duMois = (an: number, mois: number) =>
            mouvements.filter((m) => m.date.startsWith(`${an}-${String(mois).padStart(2, '0')}`));
          const dansLAn = (an: number) => mouvements.filter((m) => m.date.startsWith(String(an))).length;
          const mois = Array.from({ length: 12 }, (_, i) => i + 1).filter(
            (m) => duMois(annee, m).length > 0 || duMois(annee - 1, m).length > 0,
          );
          return (
            <AncreVisite key={idCarte} id={`historique.${idCarte}`}>
            <View style={commonStyles.gap10}>
              {premiereDeSaNature ? (
                <Text style={commonStyles.subheading}>
                  {T.enteteCategorie(
                    infosCategorie(categorie, archive.categories, archive.reglagesCategories).classe,
                    infosCategorie(categorie, archive.categories, archive.reglagesCategories).nom,
                  )}
                </Text>
              ) : null}
              <Card>
                <TitreCarte titre={titre} valeur={dansLAn(annee)} comparaison={dansLAn(annee - 1)} />
                <Text style={commonStyles.note}>{bilan}</Text>
                {lait ? <Text style={commonStyles.note}>{T.historique.noteLait}</Text> : null}
                {mois.length === 0 ? <Text style={commonStyles.mutedItalic}>{T.historique.aucun}</Text> : null}
                {comptable && mois.length > 0 ? (
                  <TableauDeDonnees
                    integre
                    colonnes={colonnesDeLHistorique(archive, ventesSeules, lait)}
                    lignes={mouvements.filter((m) => m.date.startsWith(String(annee)))}
                    cleDeLaLigne={(m) => m.id}
                    vide={T.historique.aucun}
                    tri={{ cle: 'date', decroissant: true }}
                    pied={
                      <Text style={commonStyles.cardTitle}>
                        {totalDeLAnnee(annee)}
                        {unite}
                      </Text>
                    }
                  />
                ) : null}
                {/* Les mois et leurs mouvements sont toujours affichés d'office : plus de « Détails » ni de « Masquer ». */}
                {(comptable ? [] : mois).map((m) => {
                  const cle = `${idCarte}:${annee}:${m}`;
                  const detail = duMois(annee, m).sort((a, b) => b.date.localeCompare(a.date));
                  return (
                    <View key={cle} style={[commonStyles.gap6, stylesStock.moisHistorique]}>
                      <View style={stylesBilan.ligne}>
                        <Text style={stylesBilan.ligneLabel}>{NOMS_MOIS[m - 1]}</Text>
                        <View style={stylesBilan.ligneValeurs}>
                          <Text style={commonStyles.cardTitle}>
                            {totalDuMois(annee, m)}
                            {unite}
                          </Text>
                          <Text style={commonStyles.muted}>({totalDuMois(annee - 1, m)})</Text>
                        </View>
                      </View>
                      {detail.map((x) => (
                        <Text key={x.id} style={commonStyles.muted}>
                          {T.ligneMouvement(
                            formatDateShortFR(x.date),
                            nomArticle(x.article, archive),
                            ventesSeules
                              ? `${-x.delta}${lait ? ' L' : ''}`
                              : `${x.delta > 0 ? '+' : ''}${nombreFR(x.delta)}${lait ? ' L' : ''}`,
                            libelleOrigineMouvement(x),
                          )}
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </Card>
            </View>
            </AncreVisite>
          );
        })}
    </View>
  );
}
