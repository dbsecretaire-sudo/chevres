import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { YearPicker } from '@/shared/components/YearPicker';
import { TitreCarte } from '@/features/cheptel/components/bilan/BilanBriques';
import { articlesDuGenre, libelleArticle, type FiltreStock } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, MouvementStock } from '@/features/stock/types';
import { FILTRE_STOCK_TOUT, GENRE_ARTICLE, ORIGINE_MOUVEMENT } from '@/shared/constants/stock';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { LABEL_ACTIVITE_COMPTABLE, NOMS_MOIS } from '@/shared/textes/libelles';
import { currentYear, formatDateShortFR } from '@/shared/utils/dates';
import { styles as stylesBilan } from '@/shared/styles/cheptel/BilanAnnuel.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

/** Les cartes de l'historique : un titre, et les genres d'articles dont elle compte les mouvements. */
const CARTES: { titre: string; genres: GenreArticle[] }[] = [
  { titre: T.onglets.aliments, genres: [GENRE_ARTICLE.ALIMENT] },
  {
    titre: T.onglets.fromagerie,
    genres: [GENRE_ARTICLE.FROMAGE, GENRE_ARTICLE.EMBALLAGE, GENRE_ARTICLE.MATERIEL],
  },
  { titre: T.onglets.viande, genres: [GENRE_ARTICLE.VIANDE] },
  { titre: T.onglets.entretien, genres: [GENRE_ARTICLE.ENTRETIEN] },
];

interface Props {
  archive: ArchiveStock;
  /** Les espèces de l'exploitation (des étiquettes par animal quand il y en a plusieurs). */
  especes: EspeceAnimale[];
  /** L'animal regardé dans le stock quand on ouvre l'historique. */
  filtreInitial: FiltreStock;
}

/**
 * L'historique du stock, présenté comme le bilan annuel : les animaux et les années en étiquettes, puis une carte par type de
 * stock (aliments, fromagerie, viande, entretien) qui donne, mois par mois, le nombre de mouvements — celui de l'année
 * précédente entre parenthèses. « Détails » déroule les mouvements du mois (date, article, quantité, origine).
 */
export function HistoriqueStock({ archive, especes, filtreInitial }: Props) {
  const [filtre, setFiltre] = useState<FiltreStock>(filtreInitial);
  const [annee, setAnnee] = useState(currentYear());
  const [ouverts, setOuverts] = useState<string[]>([]);

  const annees = [
    ...new Set([currentYear(), ...archive.mouvements.map((m) => Number(m.date.slice(0, 4)))]),
  ].filter((a) => Number.isFinite(a));

  const basculer = (cle: string) =>
    setOuverts((actuels) => (actuels.includes(cle) ? actuels.filter((c) => c !== cle) : [...actuels, cle]));

  const origine = (o: string) =>
    o === ORIGINE_MOUVEMENT.VENTE ? T.vente : o === ORIGINE_MOUVEMENT.NAISSANCE ? T.naissance : T.manuel;

  /** Les mouvements d'une carte pour un animal (ou tous) : ceux des articles de ses genres que cet animal concerne. */
  const mouvementsDeLaCarte = (genres: GenreArticle[]): MouvementStock[] => {
    const cles = new Set(genres.flatMap((g) => articlesDuGenre(g, archive, filtre).map((a) => a.cle)));
    return archive.mouvements.filter(
      (m) => genres.includes(m.article.split(':')[0] as GenreArticle) && cles.has(m.article),
    );
  };

  return (
    <View style={commonStyles.gap10}>
      {especes.length > 1 ? (
        <PucesDefilantes<FiltreStock>
          puces={[
            { valeur: FILTRE_STOCK_TOUT, label: TEXTES.comptabilite.parActivite.toutes },
            ...especes.map((e) => ({ valeur: e as FiltreStock, label: LABEL_ACTIVITE_COMPTABLE[e] })),
          ]}
          valeur={filtre}
          onChoisir={setFiltre}
        />
      ) : null}
      <YearPicker annees={annees} value={annee} onChange={setAnnee} />
      <Text style={commonStyles.note}>{T.historique.comparaison(annee, annee - 1)}</Text>

      {CARTES.map(({ titre, genres }) => {
        const mouvements = mouvementsDeLaCarte(genres);
        const duMois = (an: number, mois: number) =>
          mouvements.filter((m) => m.date.startsWith(`${an}-${String(mois).padStart(2, '0')}`));
        const dansLAn = (an: number) => mouvements.filter((m) => m.date.startsWith(String(an))).length;
        const mois = Array.from({ length: 12 }, (_, i) => i + 1).filter(
          (m) => duMois(annee, m).length > 0 || duMois(annee - 1, m).length > 0,
        );
        // Une carte sans article pour cet animal (la fromagerie d'une exploitation de cochons) n'a rien à montrer.
        if (genres.every((g) => articlesDuGenre(g, archive, filtre).length === 0)) return null;
        return (
          <Card key={titre}>
            <TitreCarte titre={titre} valeur={dansLAn(annee)} comparaison={dansLAn(annee - 1)} />
            {mois.length === 0 ? (
              <Text style={commonStyles.mutedItalic}>{T.historique.aucun}</Text>
            ) : (
              <Pressable onPress={() => basculer(titre)}>
                <Text style={stylesBilan.voirPlus}>
                  {ouverts.includes(titre) ? T.historique.masquer : T.historique.details}
                </Text>
              </Pressable>
            )}
            {(ouverts.includes(titre) ? mois : []).map((m) => {
              const cle = `${titre}:${annee}:${m}`;
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
                        <Text style={stylesBilan.voirPlus}>{NOMS_MOIS[m]}</Text>
                      </Pressable>
                    ) : (
                      <Text style={stylesBilan.ligneLabel}>{NOMS_MOIS[m]}</Text>
                    )}
                    <View style={stylesBilan.ligneValeurs}>
                      <Text style={commonStyles.cardTitle}>{detail.length}</Text>
                      <Text style={commonStyles.muted}>({duMois(annee - 1, m).length})</Text>
                    </View>
                  </View>
                  {ouvert
                    ? detail.map((x) => (
                        <Text key={x.id} style={commonStyles.muted}>
                          {T.ligneMouvement(
                            formatDateShortFR(x.date),
                            libelleArticle(x.article, archive),
                            `${x.delta > 0 ? '+' : ''}${x.delta}`,
                            origine(x.origine),
                          )}
                        </Text>
                      ))
                    : null}
                </View>
              );
            })}
          </Card>
        );
      })}
    </View>
  );
}
