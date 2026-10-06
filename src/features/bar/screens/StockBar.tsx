import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { ListeReordonnable } from '@/shared/components/ListeReordonnable';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { BoissonModal } from '@/features/bar/components/BoissonModal';
import { ChampRubrique } from '@/features/bar/components/ChampRubrique';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import {
  ajouterAliment,
  ajouterArticleGite,
  ajusterStock,
  consommablesTries,
  enregistrerBoisson,
  lireArchiveBar,
  positionnerDansLeStock,
  renommerAliment,
  renommerArticleGite,
  supprimerAliment,
  supprimerArticleGite,
  supprimerBoisson,
  triesSelonOrdre,
} from '@/features/bar/repository';
import type { Aliment, ArchiveBar, ArticleGite, Boisson } from '@/features/bar/types';
import { FILTRE_RUBRIQUE_TOUT, ONGLET_STOCK_BAR } from '@/shared/constants/bar';
import { RUBRIQUE_MARCHANDISE } from '@/shared/constants/comptabilite';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { LABEL_RUBRIQUE_MARCHANDISE } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Onglet = ValeurDe<typeof ONGLET_STOCK_BAR>;
type Categorie = ArticleGite['categorie'];

const T = TEXTES.bar;
const PUCES: { valeur: Onglet; label: string }[] = [
  { valeur: ONGLET_STOCK_BAR.CONSOMMABLES, label: T.stock.onglets.consommables },
  { valeur: ONGLET_STOCK_BAR.MATERIEL, label: T.stock.onglets.materiel },
  { valeur: ONGLET_STOCK_BAR.CONDITIONNEMENT, label: T.stock.onglets.conditionnement },
  { valeur: ONGLET_STOCK_BAR.ENTRETIEN, label: T.stock.onglets.entretien },
];

const PREFIXE_BOISSON = 'boisson:';
const PREFIXE_ALIMENT = 'aliment:';
const PREFIXE_ARTICLE = 'article:';

/** Une ligne du stock : sa clé de stock, son nom, son niveau, et ce qu'il y a de plus (le prix d'une boisson). */
interface LigneStock {
  id: string;
  cle: string;
  genre: 'boisson' | 'aliment' | 'article';
  nom: string;
  niveau: number;
  prix?: number;
  rubrique?: string;
}

/** Ce qu'on crée avec le bouton « + » : un aliment (consommables), ou un article d'une catégorie. */
type Ajout = 'aliment' | Categorie;

/**
 * Le stock d'un gîte (onglet Stock en bas de l'écran), construit comme celui d'une exploitation agricole : des étiquettes
 * (consommables — boissons et nourriture —, matériel, conditionnement, entretien), une liste dont chaque ligne montre son
 * niveau, un crayon pour la renommer (et fixer le prix d'une boisson) et une poignée pour la déplacer, et un bouton « + » pour
 * en ajouter. Un appui sur la ligne ajoute ou retire des unités (+1, −1).
 */
export default function StockBar() {
  const [onglet, setOnglet] = useState<Onglet>(ONGLET_STOCK_BAR.CONSOMMABLES);
  /** L'activité du gîte regardée : toutes, ou le bar, le restaurant, une activité annexe. */
  const [filtre, setFiltre] = useState<string>(FILTRE_RUBRIQUE_TOUT);
  /** L'activité choisie à la création ou au renommage d'un article (vide : toutes les activités, d'office). */
  const [rubriqueArticle, setRubriqueArticle] = useState('');
  const [archive, setArchive] = useState<ArchiveBar>({
    boissons: [],
    aliments: [],
    articles: [],
    tickets: [],
    ordres: {},
  });
  const [mouvement, setMouvement] = useState<{ cle: string; libelle: string } | null>(null);
  const [ajout, setAjout] = useState<Ajout | null>(null);
  const [renomme, setRenomme] = useState<{ genre: 'aliment' | 'article'; id: string; nom: string } | null>(
    null,
  );
  const [boissonOuverte, setBoissonOuverte] = useState(false);
  const [boissonModifiee, setBoissonModifiee] = useState<Boisson | undefined>();
  /** Vrai pendant qu'on fait glisser une ligne : la page ne défile alors pas. */
  const [glisse, setGlisse] = useState(false);

  const charger = useCallback(async () => setArchive(await lireArchiveBar()), []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const consommables = onglet === ONGLET_STOCK_BAR.CONSOMMABLES;

  /** Un article sans activité vaut pour toutes ; sinon il apparaît sous son activité (et sous « Tout »). */
  const visible = (rubrique?: string) => filtre === FILTRE_RUBRIQUE_TOUT || !rubrique || rubrique === filtre;

  const toutesLesLignes: LigneStock[] = consommables
    ? consommablesTries(archive).flatMap((c): LigneStock[] => {
        if (c.genre === 'boisson') {
          const b = archive.boissons.find((x) => x.id === c.id);
          return b
            ? [
                {
                  id: b.id,
                  cle: `${PREFIXE_BOISSON}${b.id}`,
                  genre: 'boisson',
                  nom: b.nom,
                  niveau: b.stock ?? 0,
                  prix: b.prix,
                  rubrique: b.rubrique,
                },
              ]
            : [];
        }
        const a = archive.aliments.find((x) => x.id === c.id);
        return a
          ? [
              {
                id: a.id,
                cle: `${PREFIXE_ALIMENT}${a.id}`,
                genre: 'aliment',
                nom: a.nom,
                niveau: a.stock,
                rubrique: a.rubrique,
              },
            ]
          : [];
      })
    : triesSelonOrdre<ArticleGite>(
        archive.articles.filter((a) => a.categorie === onglet),
        archive.ordres[onglet] ?? [],
      ).map((a) => ({
        id: a.id,
        cle: `${PREFIXE_ARTICLE}${a.id}`,
        genre: 'article' as const,
        nom: a.nom,
        niveau: a.stock,
        rubrique: a.rubrique,
      }));
  const lignes = toutesLesLignes.filter((l) => visible(l.rubrique));

  const valider = async (cle: string, delta: number) => {
    if (cle.startsWith(PREFIXE_BOISSON))
      await ajusterStock('boisson', cle.slice(PREFIXE_BOISSON.length), delta);
    else if (cle.startsWith(PREFIXE_ALIMENT))
      await ajusterStock('aliment', cle.slice(PREFIXE_ALIMENT.length), delta);
    else await ajusterStock('article', cle.slice(PREFIXE_ARTICLE.length), delta);
    setMouvement(null);
    charger();
  };

  /** Supprime l'aliment ou l'article dont on ajuste le stock (une boisson se supprime avec son crayon). */
  const retirer = async () => {
    if (mouvement?.cle.startsWith(PREFIXE_ALIMENT))
      await supprimerAliment(mouvement.cle.slice(PREFIXE_ALIMENT.length));
    else if (mouvement?.cle.startsWith(PREFIXE_ARTICLE))
      await supprimerArticleGite(mouvement.cle.slice(PREFIXE_ARTICLE.length));
    setMouvement(null);
    charger();
  };

  const creer = async (nom: string) => {
    const rubrique = (rubriqueArticle || undefined) as Aliment['rubrique'];
    if (ajout === 'aliment') await ajouterAliment(nom, rubrique);
    else if (ajout) await ajouterArticleGite(ajout, nom, rubrique);
    setAjout(null);
    charger();
  };

  const renommer = async (nom: string) => {
    const rubrique = (rubriqueArticle || undefined) as Aliment['rubrique'];
    if (renomme?.genre === 'aliment') await renommerAliment(renomme.id, nom, rubrique);
    else if (renomme) await renommerArticleGite(renomme.id, nom, rubrique);
    setRenomme(null);
    charger();
  };

  const validerBoisson = async (nom: string, prix: number, rubrique?: Boisson['rubrique']) => {
    await enregistrerBoisson({ id: boissonModifiee?.id, nom, prix, rubrique });
    setBoissonOuverte(false);
    charger();
  };

  const retirerBoisson = async () => {
    if (boissonModifiee) await supprimerBoisson(boissonModifiee.id);
    setBoissonOuverte(false);
    charger();
  };

  const modifier = (ligne: LigneStock) => {
    if (ligne.genre === 'boisson') {
      setBoissonModifiee(archive.boissons.find((b) => b.id === ligne.id));
      setBoissonOuverte(true);
    } else {
      setRubriqueArticle(ligne.rubrique ?? '');
      setRenomme({ genre: ligne.genre, id: ligne.id, nom: ligne.nom });
    }
  };

  const ligneStock = (ligne: LigneStock, poignee: ReactNode) => (
    <ListRow
      key={ligne.cle}
      title={ligne.nom}
      subtitle={
        ligne.niveau < 0 ? T.stock.negatif : ligne.prix !== undefined ? formatMontant(ligne.prix) : undefined
      }
      trailing={
        <View style={stylesStock.fin}>
          <Text style={[styles.resultatLigne, ligne.niveau < 0 ? styles.perte : undefined]}>
            {ligne.niveau}
          </Text>
          <Pressable onPress={() => modifier(ligne)} hitSlop={8} accessibilityLabel={T.stock.modifierBoisson}>
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </Pressable>
          {poignee}
        </View>
      }
      onPress={() => setMouvement({ cle: ligne.cle, libelle: ligne.nom })}
    />
  );

  const ouvrirAjout = (quoi: Ajout) => {
    setRubriqueArticle('');
    setAjout(quoi);
  };

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab} scrollEnabled={!glisse}>
        <PucesDefilantes<string>
          puces={[
            { valeur: FILTRE_RUBRIQUE_TOUT, label: T.stock.tout },
            ...Object.values(RUBRIQUE_MARCHANDISE).map((r) => ({
              valeur: r as string,
              label: LABEL_RUBRIQUE_MARCHANDISE[r],
            })),
          ]}
          valeur={filtre}
          onChoisir={setFiltre}
        />
        <PucesDefilantes<Onglet> puces={PUCES} valeur={onglet} onChoisir={setOnglet} />

        {lignes.length === 0 ? (
          <Text style={commonStyles.mutedItalic}>
            {consommables ? T.stock.aucunConsommable : T.stock.aucunArticle}
          </Text>
        ) : (
          <ListeReordonnable
            elements={lignes}
            cle={(l) => l.cle}
            ligne={ligneStock}
            onGlisse={setGlisse}
            onDeplacer={async (cle, index) => {
              await positionnerDansLeStock(
                onglet,
                cle.split(':')[1],
                index,
                lignes.map((l) => l.id),
              );
              charger();
            }}
          />
        )}
      </ScrollView>

      <Fab
        options={
          consommables
            ? [
                {
                  label: T.stock.ajouterBoisson,
                  icon: 'beer',
                  onPress: () => {
                    setBoissonModifiee(undefined);
                    setBoissonOuverte(true);
                  },
                },
                { label: T.stock.ajouterAliment, icon: 'restaurant', onPress: () => ouvrirAjout('aliment') },
              ]
            : [
                {
                  label: T.stock.ajouterArticle[onglet as Categorie],
                  icon: 'add-circle',
                  onPress: () => ouvrirAjout(onglet as Categorie),
                },
              ]
        }
      />

      <MouvementStockModal
        article={mouvement}
        onValider={valider}
        onSupprimer={mouvement && !mouvement.cle.startsWith(PREFIXE_BOISSON) ? retirer : undefined}
        onFermer={() => setMouvement(null)}
      />
      <BoissonModal
        visible={boissonOuverte}
        boisson={boissonModifiee}
        onValider={validerBoisson}
        onSupprimer={retirerBoisson}
        onFermer={() => setBoissonOuverte(false)}
      />
      <NomModal
        visible={!!renomme}
        titre={T.stock.renommerArticle}
        valeurInitiale={renomme?.nom}
        onValider={renommer}
        onAnnuler={() => setRenomme(null)}
        enfants={<ChampRubrique value={rubriqueArticle} onChange={setRubriqueArticle} />}
      />
      <NomModal
        visible={!!ajout}
        titre={ajout === 'aliment' ? T.stock.ajouterAliment : ajout ? T.stock.ajouterArticle[ajout] : ''}
        placeholder={ajout === 'aliment' ? T.stock.nomAliment : ajout ? T.stock.exempleArticle[ajout] : ''}
        onValider={creer}
        onAnnuler={() => setAjout(null)}
        enfants={<ChampRubrique value={rubriqueArticle} onChange={setRubriqueArticle} />}
      />
    </Screen>
  );
}
