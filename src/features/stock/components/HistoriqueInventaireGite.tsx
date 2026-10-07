import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/shared/components/Card';
import { YearPicker } from '@/shared/components/YearPicker';
import { TitreCarte } from '@/features/cheptel/components/bilan/BilanBriques';
import type { ArchiveBar } from '@/features/bar/types';
import { libelleOrigineMouvement } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
import { CATEGORIES_GITE, categoriesAvecAjoutees } from '@/features/stock/utils/categories';
import { ORIGINE_MOUVEMENT_GITE } from '@/shared/constants/bar';
import { CATEGORIE_INVENTAIRE, GENRE_ARTICLE } from '@/shared/constants/stock';
import { NOMS_MOIS } from '@/shared/textes/libelles';
import { currentYear, formatDateShortFR } from '@/shared/utils/dates';
import { styles as stylesBilan } from '@/shared/styles/cheptel/BilanAnnuel.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

/** Un mouvement de l'inventaire du gîte, quelle que soit sa provenance (le stock du gîte, ou une liste ajoutée). */
interface Entree {
  id: string;
  date: string;
  article: string;
  delta: number;
  origine: string;
  categorie: string;
}

interface Props {
  /** Les boissons, aliments et articles du gîte, avec le journal de leurs mouvements. */
  bar: ArchiveBar;
  /** Les listes ajoutées dans la structure (leurs articles et leurs mouvements). */
  inventaire: ArchiveStock;
}

const nombre = (n: number): string => String(Math.round(n * 100) / 100).replace('.', ',');
const signe = (n: number): string => `${n > 0 ? '+' : ''}${nombre(n)}`;

/**
 * L'historique de l'inventaire d'un gîte : l'année en haut, puis une carte par catégorie (37. Marchandises, 32. Autres
 * approvisionnements, 21. Immobilisations) qui donne le nombre de mouvements — celui de l'année précédente entre
 * parenthèses. « Détails » déroule les mois ; un mois déroule ses mouvements (date, article, quantité, origine).
 */
export function HistoriqueInventaireGite({ bar, inventaire }: Props) {
  const [annee, setAnnee] = useState(currentYear());
  const [ouverts, setOuverts] = useState<string[]>([]);
  const basculer = (cle: string) =>
    setOuverts((actuels) => (actuels.includes(cle) ? actuels.filter((c) => c !== cle) : [...actuels, cle]));

  const origineGite = (o: string) =>
    o === ORIGINE_MOUVEMENT_GITE.VENTE ? T.vente : o === ORIGINE_MOUVEMENT_GITE.ACHAT ? T.achat : T.manuel;

  const entrees: Entree[] = [
    ...(bar.mouvements ?? []).flatMap((m): Entree[] => {
      const nom =
        m.genre === 'boisson'
          ? bar.boissons.find((b) => b.id === m.articleId)?.nom
          : m.genre === 'aliment'
            ? bar.aliments.find((a) => a.id === m.articleId)?.nom
            : bar.articles.find((a) => a.id === m.articleId)?.nom;
      if (!nom) return [];
      const categorie =
        m.genre === 'article'
          ? bar.articles.find((a) => a.id === m.articleId)?.categorie === 'materiel'
            ? CATEGORIE_INVENTAIRE.IMMOBILISATIONS
            : CATEGORIE_INVENTAIRE.AUTRES_APPROVISIONNEMENTS
          : CATEGORIE_INVENTAIRE.MARCHANDISES;
      return [
        { id: m.id, date: m.date, article: nom, delta: m.delta, origine: origineGite(m.origine), categorie },
      ];
    }),
    ...inventaire.mouvements.flatMap((m): Entree[] => {
      if (!m.article.startsWith(`${GENRE_ARTICLE.PERSONNALISE}:`)) return [];
      const article = inventaire.articles.find((a) => a.id === m.article.split(':')[1]);
      const liste = inventaire.listes?.find((l) => l.id === article?.listeId);
      if (!article || !liste) return [];
      return [
        {
          id: m.id,
          date: m.date,
          article: article.nom,
          delta: m.delta,
          origine: libelleOrigineMouvement(m),
          categorie: liste.categorie,
        },
      ];
    }),
  ];

  const annees = [...new Set([currentYear(), ...entrees.map((e) => Number(e.date.slice(0, 4)))])].filter(
    (a) => Number.isFinite(a),
  );

  return (
    <View style={commonStyles.gap10}>
      <YearPicker annees={annees} value={annee} onChange={setAnnee} />
      <Text style={commonStyles.note}>{T.historique.comparaison(annee, annee - 1)}</Text>

      {categoriesAvecAjoutees(CATEGORIES_GITE, inventaire.categories).map(({ categorie, nom, classe }) => {
        const titre = T.enteteCategorie(classe, nom);
        const deLaCategorie = entrees.filter((e) => e.categorie === categorie);
        const duMois = (an: number, mois: number) =>
          deLaCategorie.filter((e) => e.date.startsWith(`${an}-${String(mois).padStart(2, '0')}`));
        const dansLAn = (an: number) => deLaCategorie.filter((e) => e.date.startsWith(String(an))).length;
        const mois = Array.from({ length: 12 }, (_, i) => i + 1).filter(
          (m) => duMois(annee, m).length > 0 || duMois(annee - 1, m).length > 0,
        );
        return (
          <Card key={categorie}>
            <TitreCarte titre={titre} valeur={dansLAn(annee)} comparaison={dansLAn(annee - 1)} />
            {mois.length === 0 ? (
              <Text style={commonStyles.mutedItalic}>{T.exporter.aucunMouvement}</Text>
            ) : (
              <Pressable onPress={() => basculer(categorie)}>
                <Text style={stylesBilan.voirPlus}>
                  {ouverts.includes(categorie) ? T.historique.masquer : T.historique.details}
                </Text>
              </Pressable>
            )}
            {(ouverts.includes(categorie) ? mois : []).map((m) => {
              const cle = `${categorie}:${annee}:${m}`;
              const detail = duMois(annee, m).sort((a, b) => b.date.localeCompare(a.date));
              const total = (liste: Entree[]) => liste.reduce((somme, e) => somme + e.delta, 0);
              return (
                <View key={cle} style={[commonStyles.gap6, stylesStock.moisHistorique]}>
                  <View style={stylesBilan.ligne}>
                    {detail.length > 0 ? (
                      <Pressable onPress={() => basculer(cle)}>
                        <Text style={stylesBilan.voirPlus}>{NOMS_MOIS[m - 1]}</Text>
                      </Pressable>
                    ) : (
                      <Text style={stylesBilan.ligneLabel}>{NOMS_MOIS[m - 1]}</Text>
                    )}
                    <View style={stylesBilan.ligneValeurs}>
                      <Text style={commonStyles.cardTitle}>{signe(total(detail))}</Text>
                      <Text style={commonStyles.muted}>({signe(total(duMois(annee - 1, m)))})</Text>
                    </View>
                  </View>
                  {ouverts.includes(cle)
                    ? detail.map((e) => (
                        <Text key={e.id} style={commonStyles.muted}>
                          {T.ligneMouvement(formatDateShortFR(e.date), e.article, signe(e.delta), e.origine)}
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
