import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { YearPicker } from '@/shared/components/YearPicker';
import { TitreCarte } from '@/features/cheptel/components/bilan/BilanBriques';
import { articlesDuGenre, libelleArticle, type FiltreStock } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, MouvementStock } from '@/features/stock/types';
import { FILTRE_STOCK_TOUT, GENRE_ARTICLE, NATURE_STOCK, ORIGINE_MOUVEMENT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE, NOMS_MOIS } from '@/shared/textes/libelles';
import { currentYear, formatDateShortFR } from '@/shared/utils/dates';
import { styles as stylesBilan } from '@/shared/styles/cheptel/BilanAnnuel.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

/** Un nombre avec la virgule décimale. */
const nombreFR = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');

/**
 * Les cartes de l'historique, rangées par nature (ce qui se vend, ce qui se consomme, les investissements) : un titre, et les
 * genres d'articles dont elle compte les mouvements.
 */
const CARTES: {
  titre: string;
  genres: GenreArticle[];
  nature: ValeurDe<typeof NATURE_STOCK>;
  lait?: boolean;
}[] = [
  { titre: T.sections.fromages, genres: [GENRE_ARTICLE.FROMAGE], nature: NATURE_STOCK.VENTE },
  // Le lait n'est pas un article du stock : ses « mouvements » viennent du journal de lait, des fabrications et des ventes.
  { titre: T.onglets.lait, genres: [], nature: NATURE_STOCK.VENTE, lait: true },
  { titre: T.onglets.viande, genres: [GENRE_ARTICLE.VIANDE], nature: NATURE_STOCK.VENTE },
  { titre: T.onglets.aliments, genres: [GENRE_ARTICLE.ALIMENT], nature: NATURE_STOCK.CONSOMMABLE },
  { titre: T.sections.emballages, genres: [GENRE_ARTICLE.EMBALLAGE], nature: NATURE_STOCK.CONSOMMABLE },
  { titre: T.onglets.entretien, genres: [GENRE_ARTICLE.ENTRETIEN], nature: NATURE_STOCK.CONSOMMABLE },
  { titre: T.sections.materiel, genres: [GENRE_ARTICLE.EQUIPEMENT], nature: NATURE_STOCK.CONSOMMABLE },
  { titre: T.sections.materiel, genres: [GENRE_ARTICLE.MATERIEL], nature: NATURE_STOCK.INVESTISSEMENT },
  { titre: T.onglets.materiel, genres: [GENRE_ARTICLE.BATIMENT], nature: NATURE_STOCK.INVESTISSEMENT },
];

/** L'identifiant du « article » lait des mouvements de l'historique. */
const CLE_LAIT = 'lait';

interface Props {
  archive: ArchiveStock;
  /** Les espèces de l'exploitation (des étiquettes par animal quand il y en a plusieurs). */
  especes: EspeceAnimale[];
  /** L'animal regardé dans le stock quand on ouvre l'historique. */
  filtreInitial: FiltreStock;
  /** Les ventes de lait de la comptabilité (leur date et leurs litres). */
  ventesLait: { id: string; date: string; litres: number }[];
}

/**
 * L'historique du stock, présenté comme le bilan annuel : les animaux et les années en étiquettes, puis une carte par type de
 * stock (aliments, fromagerie, viande, entretien) qui donne, mois par mois, le nombre de mouvements — celui de l'année
 * précédente entre parenthèses. « Détails » déroule les mouvements du mois (date, article, quantité, origine).
 */
export function HistoriqueStock({ archive, especes, filtreInitial, ventesLait }: Props) {
  const [filtre, setFiltre] = useState<FiltreStock>(filtreInitial);
  const [annee, setAnnee] = useState(currentYear());
  const [ouverts, setOuverts] = useState<string[]>([]);

  const annees = [
    ...new Set([currentYear(), ...archive.mouvements.map((m) => Number(m.date.slice(0, 4)))]),
  ].filter((a) => Number.isFinite(a));

  const basculer = (cle: string) =>
    setOuverts((actuels) => (actuels.includes(cle) ? actuels.filter((c) => c !== cle) : [...actuels, cle]));

  const origine = (o: string) =>
    o === ORIGINE_MOUVEMENT.VENTE
      ? T.vente
      : o === ORIGINE_MOUVEMENT.NAISSANCE
        ? T.naissance
        : o === ORIGINE_MOUVEMENT.ACHAT
          ? T.achat
          : o === ORIGINE_MOUVEMENT.CONSOMMATION
            ? T.consommation
            : T.manuel;

  /** Le lait de l'historique : seulement celui qui a été vendu (les ventes de lait de la comptabilité), en litres sortis. */
  const mouvementsLait = (): MouvementStock[] =>
    ventesLait.map((v) => ({
      id: v.id,
      article: CLE_LAIT,
      date: v.date,
      delta: -v.litres,
      origine: ORIGINE_MOUVEMENT.VENTE,
    }));

  /** Les mouvements d'une carte pour un animal (ou tous) : ceux des articles de ses genres que cet animal concerne. */
  const mouvementsDeLaCarte = (
    genres: GenreArticle[],
    avecAutomatiques = false,
    lait = false,
  ): MouvementStock[] => {
    if (lait) return mouvementsLait();
    const cles = new Set(genres.flatMap((g) => articlesDuGenre(g, archive, filtre).map((a) => a.cle)));
    return archive.mouvements.filter(
      (m) =>
        (avecAutomatiques || !m.automatique) &&
        genres.includes(m.article.split(':')[0] as GenreArticle) &&
        cles.has(m.article),
    );
  };

  return (
    <View style={commonStyles.gap10}>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnnee} />
        {especes.length > 1 ? (
          <ChoixDeroulant<FiltreStock>
            titre={TEXTES.commun.choix.animal}
            valeur={filtre}
            options={[
              { value: FILTRE_STOCK_TOUT, label: TEXTES.comptabilite.parActivite.toutes },
              ...especes.map((e) => ({ value: e as FiltreStock, label: LABEL_ACTIVITE_COMPTABLE[e] })),
            ]}
            onChoisir={setFiltre}
          />
        ) : null}
      </LigneFiltres>
      <Text style={commonStyles.note}>{T.historique.comparaison(annee, annee - 1)}</Text>

      {CARTES.filter(({ genres, lait }) =>
        // Une carte sans article pour cet animal (la fromagerie d'une exploitation de cochons) n'a rien à montrer ; le lait
        // suit la fromagerie (chèvres et brebis).
        lait
          ? articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive, filtre).length > 0
          : genres.some((g) => articlesDuGenre(g, archive, filtre).length > 0),
      ).map(({ titre, genres, nature, lait }, index, visibles) => {
        const idCarte = lait ? CLE_LAIT : genres[0];
        const premiereDeSaNature = index === 0 || visibles[index - 1].nature !== nature;
        // Ce qui se vend (fromages, lait, viande) ne montre que ce qui a été vendu : en quantités positives.
        const ventesSeules = nature === NATURE_STOCK.VENTE;
        const seulementVentes = (liste: MouvementStock[]) =>
          ventesSeules ? liste.filter((m) => m.origine === ORIGINE_MOUVEMENT.VENTE) : liste;
        const mouvements = seulementVentes(mouvementsDeLaCarte(genres, false, lait));
        const unite = lait
          ? ' L'
          : genres.includes(GENRE_ARTICLE.ALIMENT)
            ? ` ${TEXTES.commun.general.kg}`
            : '';
        const dansLAnnee = seulementVentes(mouvementsDeLaCarte(genres, true, lait)).filter((m) =>
          m.date.startsWith(String(annee)),
        );
        const entre = dansLAnnee.filter((m) => m.delta > 0).reduce((somme, m) => somme + m.delta, 0);
        const sortiPar = (origine: string) =>
          -dansLAnnee
            .filter((m) => m.origine === origine)
            .reduce((somme, m) => somme + Math.min(m.delta, 0), 0);
        const bilan = ventesSeules
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
        const duMois = (an: number, mois: number) =>
          mouvements.filter((m) => m.date.startsWith(`${an}-${String(mois).padStart(2, '0')}`));
        const dansLAn = (an: number) => mouvements.filter((m) => m.date.startsWith(String(an))).length;
        const mois = Array.from({ length: 12 }, (_, i) => i + 1).filter(
          (m) => duMois(annee, m).length > 0 || duMois(annee - 1, m).length > 0,
        );
        return (
          <View key={idCarte} style={commonStyles.gap10}>
            {premiereDeSaNature ? (
              <Text style={commonStyles.subheading}>{T.historique.natures[nature]}</Text>
            ) : null}
            <Card>
              <TitreCarte titre={titre} valeur={dansLAn(annee)} comparaison={dansLAn(annee - 1)} />
              <Text style={commonStyles.note}>{bilan}</Text>
              {mois.length === 0 ? (
                <Text style={commonStyles.mutedItalic}>{T.historique.aucun}</Text>
              ) : (
                <Pressable onPress={() => basculer(idCarte)}>
                  <Text style={stylesBilan.voirPlus}>
                    {ouverts.includes(idCarte) ? T.historique.masquer : T.historique.details}
                  </Text>
                </Pressable>
              )}
              {(ouverts.includes(idCarte) ? mois : []).map((m) => {
                const cle = `${idCarte}:${annee}:${m}`;
                const ouvert = ouverts.includes(cle);
                const detail = duMois(annee, m).sort((a, b) => b.date.localeCompare(a.date));
                return (
                  <View key={cle} style={[commonStyles.gap6, stylesStock.moisHistorique]}>
                    {/* Le mois est lui-même le lien : il déroule ses mouvements. */}
                    <View style={stylesBilan.ligne}>
                      {detail.length > 0 ? (
                        <Pressable
                          onPress={() => basculer(cle)}
                          accessibilityLabel={ouvert ? T.historique.masquer : T.historique.details}
                        >
                          <Text style={stylesBilan.voirPlus}>{NOMS_MOIS[m - 1]}</Text>
                        </Pressable>
                      ) : (
                        <Text style={stylesBilan.ligneLabel}>{NOMS_MOIS[m - 1]}</Text>
                      )}
                      <View style={stylesBilan.ligneValeurs}>
                        <Text style={commonStyles.cardTitle}>
                          {totalDuMois(annee, m)}
                          {unite}
                        </Text>
                        <Text style={commonStyles.muted}>({totalDuMois(annee - 1, m)})</Text>
                      </View>
                    </View>
                    {ouvert
                      ? detail.map((x) => (
                          <Text key={x.id} style={commonStyles.muted}>
                            {T.ligneMouvement(
                              formatDateShortFR(x.date),
                              x.article === CLE_LAIT ? T.onglets.lait : libelleArticle(x.article, archive),
                              ventesSeules
                                ? `${-x.delta}${lait ? ' L' : ''}`
                                : `${x.delta > 0 ? '+' : ''}${x.delta}`,
                              origine(x.origine),
                            )}
                          </Text>
                        ))
                      : null}
                  </View>
                );
              })}
            </Card>
          </View>
        );
      })}
    </View>
  );
}
