import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { ListeReordonnable } from '@/shared/components/ListeReordonnable';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { LaitParFromage } from '@/features/stock/components/LaitParFromage';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import { lireArchiveStock } from '@/features/stock/repository';
import {
  ajouterArticle,
  ajouterMouvementManuel,
  articlesDuGenre,
  cleArticle,
  conditionnementDe,
  definirConditionnement,
  positionnerArticle,
  renommerArticle,
  libelleArticle,
  niveauxDeStock,
  supprimerArticle,
  type ArticleAffiche,
} from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import {
  ARTICLE_EMBALLAGE,
  GENRE_ARTICLE,
  NOMBRE_MOUVEMENTS_AFFICHES,
  ONGLET_STOCK,
  ORIGINE_MOUVEMENT,
} from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatDateShortFR, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Onglet = ValeurDe<typeof ONGLET_STOCK>;

const T = TEXTES.stock;
const PUCES: { valeur: Onglet; label: string }[] = [
  { valeur: ONGLET_STOCK.FROMAGE, label: T.onglets.fromage },
  { valeur: ONGLET_STOCK.EMBALLAGES, label: T.onglets.emballages },
  { valeur: ONGLET_STOCK.MATERIEL, label: T.onglets.materiel },
  { valeur: ONGLET_STOCK.CONDITIONNEMENT, label: T.onglets.conditionnement },
];

/** Le genre d'article de chaque onglet qui liste des articles. */
const GENRE_PAR_ONGLET: Partial<Record<Onglet, GenreArticle>> = {
  [ONGLET_STOCK.FROMAGE]: GENRE_ARTICLE.FROMAGE,
  [ONGLET_STOCK.EMBALLAGES]: GENRE_ARTICLE.EMBALLAGE,
  [ONGLET_STOCK.MATERIEL]: GENRE_ARTICLE.MATERIEL,
};

const TEXTES_AJOUT: Record<GenreArticle, { titre: string; exemple: string }> = {
  [GENRE_ARTICLE.FROMAGE]: { titre: T.ajouter.fromage, exemple: T.ajouter.exempleFromage },
  [GENRE_ARTICLE.EMBALLAGE]: { titre: T.ajouter.emballages, exemple: T.ajouter.exempleEmballage },
  [GENRE_ARTICLE.MATERIEL]: { titre: T.ajouter.materiel, exemple: T.ajouter.exempleMateriel },
};

/** Le code d'un article (« fromage:frais » → « frais »). */
const codeDe = (cle: string): string => cle.split(':')[1];

/**
 * Le stock de la fromagerie, en quatre parties : les fromages (avec le lait qu'il faut par fromage), les emballages, le
 * matériel, et le conditionnement (les emballages que chaque fromage vendu consomme, qu'un crayon permet de modifier un
 * par un). Chaque vente de fromage fait baisser tout seul le fromage et ses emballages ; le bouton « + » ajoute un
 * article au nom de son choix, et une ligne se déplace avec ses flèches.
 */
export default function StockFromagerie() {
  const [onglet, setOnglet] = useState<Onglet>(ONGLET_STOCK.FROMAGE);
  const [archive, setArchive] = useState<ArchiveStock>({
    mouvements: [],
    articles: [],
    conditionnements: {},
    ordres: {},
    noms: {},
  });
  const [article, setArticle] = useState<ArticleAffiche | null>(null);
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  /** L'article dont on modifie le nom (le crayon de sa ligne). */
  const [renomme, setRenomme] = useState<ArticleAffiche | null>(null);
  /** Le fromage dont on modifie le conditionnement. */
  const [enEdition, setEnEdition] = useState<string | null>(null);
  /** Vrai pendant qu'on fait glisser une ligne : la page ne défile alors pas. */
  const [glisse, setGlisse] = useState(false);

  const charger = useCallback(async () => setArchive(await lireArchiveStock()), []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const niveaux = niveauxDeStock(archive.mouvements);
  const genre = GENRE_PAR_ONGLET[onglet];

  const ligne = (a: ArticleAffiche, poignee: ReactNode) => {
    const niveau = niveaux.get(a.cle) ?? 0;
    return (
      <ListRow
        key={a.cle}
        title={a.libelle}
        subtitle={niveau < 0 ? T.negatif : undefined}
        trailing={
          <View style={stylesStock.fin}>
            <Text style={[styles.resultatLigne, niveau < 0 ? styles.perte : undefined]}>
              {T.unites(niveau)}
            </Text>
            <Pressable onPress={() => setRenomme(a)} hitSlop={8} accessibilityLabel={T.renommer.modifier}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </Pressable>
            {poignee}
          </View>
        }
        onPress={() => setArticle(a)}
      />
    );
  };

  const valider = async (cle: string, delta: number, litres?: number) => {
    await ajouterMouvementManuel(cle, delta, todayISO(), litres);
    setArticle(null);
    charger();
  };

  const retirer = async () => {
    if (article?.id) await supprimerArticle(article.id);
    setArticle(null);
    charger();
  };

  const creer = async (nom: string) => {
    if (genre) await ajouterArticle(genre, nom);
    setAjoutOuvert(false);
    charger();
  };

  const renommer = async (nom: string) => {
    if (renomme) await renommerArticle(renomme.cle, nom);
    setRenomme(null);
    charger();
  };

  const basculerEmballage = async (fromage: string, code: string) => {
    const actuels = conditionnementDe(fromage, archive);
    await definirConditionnement(
      fromage,
      actuels.includes(code) ? actuels.filter((c) => c !== code) : [...actuels, code],
    );
    charger();
  };

  const recents = [...archive.mouvements]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, NOMBRE_MOUVEMENTS_AFFICHES);
  const emballages = articlesDuGenre(GENRE_ARTICLE.EMBALLAGE, archive);
  const fromages = articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive);

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab} scrollEnabled={!glisse}>
        <PucesDefilantes<Onglet> puces={PUCES} valeur={onglet} onChoisir={setOnglet} />

        {genre ? (
          <ListeReordonnable
            elements={articlesDuGenre(genre, archive)}
            cle={(a) => a.cle}
            ligne={ligne}
            onGlisse={setGlisse}
            onDeplacer={async (cle, index) => {
              await positionnerArticle(genre, cle, index);
              charger();
            }}
          />
        ) : (
          <>
            <Text style={commonStyles.note}>{T.conditionnement.aide}</Text>
            {fromages.map((f) => {
              const code = codeDe(f.cle);
              const codes = conditionnementDe(code, archive);
              const edition = enEdition === code;
              return (
                <Card key={f.cle}>
                  <View style={stylesStock.enteteCarte}>
                    <Text style={commonStyles.cardTitle}>{f.libelle}</Text>
                    <Pressable
                      onPress={() => setEnEdition(edition ? null : code)}
                      hitSlop={8}
                      accessibilityLabel={T.conditionnement.modifier}
                    >
                      <Ionicons name={edition ? 'checkmark' : 'pencil'} size={20} color={colors.primary} />
                    </Pressable>
                  </View>
                  {edition ? (
                    <>
                      <Text style={commonStyles.note}>{T.conditionnement.choisirLesEmballages}</Text>
                      {emballages.map((e) => {
                        const emballage = codeDe(e.cle);
                        // Les sacs se saisissent à la vente : on ne les coche pas ici.
                        const sac = emballage === ARTICLE_EMBALLAGE.SAC_PLASTIQUE;
                        return (
                          <Checkbox
                            key={e.cle}
                            label={e.libelle}
                            value={!sac && codes.includes(emballage)}
                            disabled={sac}
                            onChange={() => basculerEmballage(code, emballage)}
                          />
                        );
                      })}
                    </>
                  ) : (
                    <Text style={commonStyles.muted}>
                      {codes.length === 0
                        ? T.conditionnement.aucun
                        : codes
                            .map((c) => libelleArticle(cleArticle(GENRE_ARTICLE.EMBALLAGE, c), archive))
                            .join(' + ')}
                    </Text>
                  )}
                </Card>
              );
            })}
          </>
        )}

        {onglet === ONGLET_STOCK.FROMAGE ? <LaitParFromage archive={archive} /> : null}

        {onglet === ONGLET_STOCK.EMBALLAGES || onglet === ONGLET_STOCK.MATERIEL ? (
          <>
            <Text style={commonStyles.cardTitle}>{T.mouvements}</Text>
            {recents.length === 0 ? (
              <Text style={commonStyles.mutedItalic}>{T.aucunMouvement}</Text>
            ) : (
              recents.map((m) => (
                <Text key={m.id} style={commonStyles.muted}>
                  {T.ligneMouvement(
                    formatDateShortFR(m.date),
                    libelleArticle(m.article, archive),
                    `${m.delta > 0 ? '+' : ''}${m.delta}`,
                    m.origine === ORIGINE_MOUVEMENT.VENTE ? T.vente : T.manuel,
                  )}
                </Text>
              ))
            )}
          </>
        ) : null}
      </ScrollView>

      {genre ? (
        <Fab
          options={[
            { label: TEXTES_AJOUT[genre].titre, icon: 'add-circle', onPress: () => setAjoutOuvert(true) },
          ]}
        />
      ) : null}

      <MouvementStockModal
        article={article}
        avecLitres={article?.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)}
        libelleLitres={
          article?.cle === cleArticle(GENRE_ARTICLE.FROMAGE, 'brocciu') ? T.modal.litresBrocciu : undefined
        }
        onValider={valider}
        onSupprimer={article?.id ? retirer : undefined}
        onFermer={() => setArticle(null)}
      />
      <NomModal
        visible={!!renomme}
        titre={T.renommer.titre}
        valeurInitiale={renomme?.libelle}
        onValider={renommer}
        onAnnuler={() => setRenomme(null)}
      />
      <NomModal
        visible={ajoutOuvert}
        titre={genre ? TEXTES_AJOUT[genre].titre : ''}
        placeholder={genre ? TEXTES_AJOUT[genre].exemple : T.ajouter.nom}
        onValider={creer}
        onAnnuler={() => setAjoutOuvert(false)}
      />
    </Screen>
  );
}
