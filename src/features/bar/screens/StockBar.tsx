import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { exporterInventaireGitePdf } from '@/features/export/inventaireGitePdf';
import { ListePersonnalisee } from '@/features/stock/components/ListePersonnalisee';
import { lireArchiveStock } from '@/features/stock/repository';
import { ajouterArticle as ajouterArticleInventaire } from '@/features/stock/services/stock';
import type { ArchiveStock, ListeInventaire } from '@/features/stock/types';
import { ROUTES } from '@/shared/constants/routes';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  CATEGORIES_GITE,
  SECTIONS_GITE,
  categoriesAvecAjoutees,
  type SectionGite,
} from '@/features/stock/utils/categories';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Fab } from '@/shared/components/Fab';
import type { Option } from '@/shared/components/OptionsModal';
import { ListRow } from '@/shared/components/ListRow';
import { ListeReordonnable } from '@/shared/components/ListeReordonnable';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { SelectField } from '@/shared/components/SelectField';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { InventaireAnnexes } from '@/features/annexes/components/InventaireAnnexes';
import { ArticleAnnexeModal } from '@/features/annexes/components/ArticleAnnexeModal';
import { enregistrerArticle, enregistrerCategorie, lireArchiveAnnexes } from '@/features/annexes/repository';
import { PREFIXE_FILTRE_ANNEXE, SECTION_ANNEXES } from '@/shared/constants/annexes';
import type { ArchiveAnnexes } from '@/features/annexes/types';
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
import { CATEGORIE_INVENTAIRE, GENRE_ARTICLE } from '@/shared/constants/stock';
import { COMPTE_PAR_SECTION_INVENTAIRE_GITE } from '@/shared/constants/planComptable';
import { RUBRIQUE_MARCHANDISE } from '@/shared/constants/comptabilite';
import { colors } from '@/shared/theme/colors';
import { formatMontant } from '@/shared/utils/dates';
import { LABEL_RUBRIQUE_MARCHANDISE } from '@/shared/textes/libelles';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Section = SectionGite;
type CategorieArticle = ArticleGite['categorie'];

const T = TEXTES.bar;
const TS = TEXTES.stock;

const CATEGORIES = CATEGORIES_GITE;
const SECTIONS = SECTIONS_GITE;

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
type Ajout = 'aliment' | CategorieArticle;

/**
 * Le stock d'un gîte (onglet Stock en bas de l'écran), construit comme celui d'une exploitation agricole : des étiquettes
 * (consommables — boissons et nourriture —, matériel, conditionnement, entretien), une liste dont chaque ligne montre son
 * niveau, un crayon pour la renommer (et fixer le prix d'une boisson) et une poignée pour la déplacer, et un bouton « + » pour
 * en ajouter. Un appui sur la ligne ajoute ou retire des unités (+1, −1).
 */
export default function StockBar() {
  const router = useRouter();
  /** La catégorie qui est déroulée (une seule à la fois) : aucune au départ, tout est réduit. */
  const [ouvertes, setOuvertes] = useState<string[]>([]);
  /** L'activité du gîte regardée : toutes, ou le bar, le restaurant, une activité annexe. */
  const [filtre, setFiltre] = useState<string>(FILTRE_RUBRIQUE_TOUT);
  // Un lien (le crayon d'un ticket) peut ouvrir les marchandises sur une activité, même si l'inventaire était déjà ouvert.
  const { onglet: ongletDemande, espece: filtreDemande } = useLocalSearchParams<{
    onglet?: string;
    espece?: string;
  }>();
  const demande = `${ongletDemande ?? ''}|${filtreDemande ?? ''}`;
  const [demandeVue, setDemandeVue] = useState('|');
  if (demande !== demandeVue) {
    setDemandeVue(demande);
    if (filtreDemande) setFiltre(filtreDemande);
    if (ongletDemande === ONGLET_STOCK_BAR.CONSOMMABLES || ongletDemande === SECTION_ANNEXES) {
      setOuvertes([CATEGORIE_INVENTAIRE.MARCHANDISES]);
    }
  }
  /** Ce qu'on ajoute avec le + à une activité annexe : un article, ou une catégorie. */
  const [ajoutAnnexe, setAjoutAnnexe] = useState<{
    genre: 'article' | 'categorie';
    activiteId: string;
  } | null>(null);
  /** L'activité choisie à la création ou au renommage d'un article (vide : toutes les activités, d'office). */
  const [rubriqueArticle, setRubriqueArticle] = useState('');
  const [archive, setArchive] = useState<ArchiveBar>({
    boissons: [],
    aliments: [],
    articles: [],
    ordres: {},
  });
  const [mouvement, setMouvement] = useState<{ cle: string; libelle: string } | null>(null);
  const [ajout, setAjout] = useState<Ajout | null>(null);
  const [renomme, setRenomme] = useState<{ genre: 'aliment' | 'article'; id: string; nom: string } | null>(
    null,
  );
  /** Le menu en haut à droite (burger). */
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [boissonOuverte, setBoissonOuverte] = useState(false);
  const [boissonModifiee, setBoissonModifiee] = useState<Boisson | undefined>();
  /** Vrai pendant qu'on fait glisser une ligne : la page ne défile alors pas. */
  const [glisse, setGlisse] = useState(false);

  /** L'inventaire des listes ajoutées dans la structure des listes (leurs articles et leurs mouvements). */
  const [inventaire, setInventaire] = useState<ArchiveStock>({
    mouvements: [],
    articles: [],
    conditionnements: {},
    ordres: {},
    noms: {},
    lait: [],
    prix: {},
    listes: [],
  });
  /** Les activités annexes (leurs articles, prix et stocks) : elles figurent dans la catégorie des marchandises. */
  const [annexes, setAnnexes] = useState<ArchiveAnnexes>({
    activites: [],
    categories: [],
    articles: [],
    tickets: [],
  });
  /** La liste ajoutée dans laquelle on crée un article (la fenêtre d'ajout est fermée quand elle est absente). */
  const [ajoutListe, setAjoutListe] = useState<ListeInventaire | null>(null);

  const charger = useCallback(async () => {
    const [bar, stock, annexesLues] = await Promise.all([
      lireArchiveBar(),
      lireArchiveStock(),
      lireArchiveAnnexes(),
    ]);
    setArchive(bar);
    setInventaire(stock);
    setAnnexes(annexesLues);
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  /** Un article sans activité vaut pour toutes ; sinon il apparaît sous son activité (et sous « Tout »). */
  const filtreAnnexe = filtre.startsWith(PREFIXE_FILTRE_ANNEXE)
    ? filtre.slice(PREFIXE_FILTRE_ANNEXE.length)
    : undefined;
  const visible = (rubrique?: string) =>
    filtre === FILTRE_RUBRIQUE_TOUT ||
    !rubrique ||
    rubrique === filtre ||
    (!!filtreAnnexe && rubrique === RUBRIQUE_MARCHANDISE.ANNEXE);

  /** Les lignes d'une section (filtrées par activité) : les boissons et la nourriture, ou les articles d'une catégorie. */
  const avecAnnexes = annexes.activites.length > 0;
  const lignesDe = (section: Section): LigneStock[] => {
    const consommables = section === ONGLET_STOCK_BAR.CONSOMMABLES;
    const toutes: LigneStock[] = consommables
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
          archive.articles.filter((a) => a.categorie === section),
          archive.ordres[section] ?? [],
        ).map((a) => ({
          id: a.id,
          cle: `${PREFIXE_ARTICLE}${a.id}`,
          genre: 'article' as const,
          nom: a.nom,
          niveau: a.stock,
          rubrique: a.rubrique,
        }));
    // Avec des activités annexes, leurs articles (prix, stock) remplacent les anciennes boissons : seule la nourriture reste dans la liste.
    return toutes.filter((l) => visible(l.rubrique) && !(avecAnnexes && l.genre === 'boisson'));
  };

  /** Une seule catégorie est déroulée à la fois : en ouvrir une referme l'autre. */
  const basculerCategorie = (categorie: string) =>
    setOuvertes((actuelles) => (actuelles.includes(categorie) ? [] : [categorie]));

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

  /** Ce que le bouton « + » propose : un ajout pour chaque liste des catégories déroulées (toutes si aucune ne l'est). */
  const sectionsOuvertes = SECTIONS.filter((x) => ouvertes.length === 0 || ouvertes.includes(x.categorie));
  const ajoutsConsommables: Option[] = [
    {
      label: T.stock.ajouterBoisson,
      icon: 'beer' as const,
      onPress: () => {
        setBoissonModifiee(undefined);
        setBoissonOuverte(true);
      },
    },
    { label: T.stock.ajouterAliment, icon: 'restaurant' as const, onPress: () => ouvrirAjout('aliment') },
  ];
  /** Avec des activités annexes : deux entrées (un article, une catégorie) ; l'activité se choisit dans la fenêtre. */
  const ajoutsMarchandises: Option[] =
    annexes.activites.length > 0
      ? [
          {
            label: TEXTES.annexes.inventaire.ajouterArticle,
            icon: 'add-circle' as const,
            onPress: () =>
              setAjoutAnnexe({ genre: 'article', activiteId: filtreAnnexe ?? annexes.activites[0].id }),
          },
          {
            label: TEXTES.annexes.inventaire.ajouterCategorie,
            icon: 'folder' as const,
            onPress: () =>
              setAjoutAnnexe({ genre: 'categorie', activiteId: filtreAnnexe ?? annexes.activites[0].id }),
          },
        ]
      : ajoutsConsommables;
  const optionsAjoutStock: Option[] = [
    ...sectionsOuvertes.flatMap(({ section }): Option[] =>
      section === ONGLET_STOCK_BAR.CONSOMMABLES
        ? ajoutsMarchandises
        : [
            {
              label: T.stock.ajouterArticle[section as CategorieArticle],
              icon: 'add-circle' as const,
              onPress: () => ouvrirAjout(section as CategorieArticle),
            },
          ],
    ),
    ...(inventaire.listes ?? [])
      .filter((l) => ouvertes.length === 0 || ouvertes.includes(l.categorie))
      .map((l): Option => ({
        label: TS.ajouter.dansLaListe(l.nom),
        icon: 'add-circle' as const,
        onPress: () => setAjoutListe(l),
      })),
  ];

  const ouvrirAjout = (quoi: Ajout) => {
    setRubriqueArticle('');
    setAjout(quoi);
  };

  return (
    <Screen scroll={false}>
      {/* Le menu burger, à droite du titre : l'impression de l'inventaire. */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              style={commonStyles.boutonEnteteDroite}
              onPress={() => setMenuOuvert(true)}
              hitSlop={10}
              accessibilityLabel={T.stock.menu}
            >
              <Ionicons name="menu" size={26} color={colors.blanc} />
            </Pressable>
          ),
        }}
      />
      <OptionsModal
        visible={menuOuvert}
        onClose={() => setMenuOuvert(false)}
        options={[
          {
            label: TS.historique.titre,
            icon: 'time' as const,
            onPress: () => router.push(ROUTES.stockHistorique()),
          },
          {
            label: TS.structure.menu,
            icon: 'albums' as const,
            onPress: () => router.push(ROUTES.STOCK_STRUCTURE),
          },
          {
            label: T.stock.exporter.menu,
            icon: 'print' as const,
            onPress: () =>
              exporterInventaireGitePdf().catch((e: Error) =>
                Alert.alert(TEXTES.commun.general.erreurExport, e?.message ?? String(e)),
              ),
          },
        ]}
      />
      <ScrollView contentContainerStyle={commonStyles.listFab} scrollEnabled={!glisse}>
        <ChoixDeroulant<string>
          titre={TEXTES.commun.choix.activite}
          valeur={filtre}
          options={[
            { value: FILTRE_RUBRIQUE_TOUT, label: T.stock.tout },
            ...Object.values(RUBRIQUE_MARCHANDISE)
              .filter((r) => r !== RUBRIQUE_MARCHANDISE.ANNEXE || annexes.activites.length === 0)
              .map((r) => ({ value: r as string, label: LABEL_RUBRIQUE_MARCHANDISE[r] })),
            ...annexes.activites.map((a) => ({ value: `${PREFIXE_FILTRE_ANNEXE}${a.id}`, label: a.nom })),
          ]}
          onChoisir={setFiltre}
        />
        {categoriesAvecAjoutees(CATEGORIES, inventaire.categories).map(
          ({ categorie, nom, classe, perso }) => (
            <SectionDeroulante
              key={categorie}
              titre={TS.enteteCategorie(classe, nom)}
              ouverte={ouvertes.includes(categorie)}
              onBasculer={() => basculerCategorie(categorie)}
            >
              {SECTIONS.filter((x) => x.categorie === categorie).map(({ section, titre }) => {
                const lignes = lignesDe(section);
                const compte = COMPTE_PAR_SECTION_INVENTAIRE_GITE[section];
                return (
                  <View key={section} style={commonStyles.gap10}>
                    <View style={commonStyles.gap2}>
                      <Text style={commonStyles.lineBold}>{titre}</Text>
                      <Text style={commonStyles.note}>{TS.compte(compte.numero, compte.libelle)}</Text>
                    </View>
                    {lignes.length === 0 ? (
                      section === ONGLET_STOCK_BAR.CONSOMMABLES && avecAnnexes ? null : (
                        <Text style={commonStyles.mutedItalic}>
                          {section === ONGLET_STOCK_BAR.CONSOMMABLES
                            ? T.stock.aucunConsommable
                            : T.stock.aucunArticle}
                        </Text>
                      )
                    ) : (
                      <ListeReordonnable
                        elements={lignes}
                        cle={(l) => l.cle}
                        ligne={ligneStock}
                        onGlisse={setGlisse}
                        onDeplacer={async (cle, index) => {
                          await positionnerDansLeStock(
                            section,
                            cle.split(':')[1],
                            index,
                            lignes.map((l) => l.id),
                          );
                          charger();
                        }}
                      />
                    )}
                    {/* Les activités annexes (bar, restaurant, pizzas…) : des sous-catégories des boissons et de la nourriture. */}
                    {section === ONGLET_STOCK_BAR.CONSOMMABLES &&
                    (filtre === FILTRE_RUBRIQUE_TOUT ||
                      filtre === RUBRIQUE_MARCHANDISE.ANNEXE ||
                      !!filtreAnnexe) ? (
                      <InventaireAnnexes archive={annexes} activiteId={filtreAnnexe} onChange={charger} />
                    ) : null}
                  </View>
                );
              })}
              {(inventaire.listes ?? [])
                .filter((l) => l.categorie === categorie)
                .map((l) => (
                  <View key={l.id} style={commonStyles.gap10}>
                    <View style={commonStyles.gap2}>
                      <Text style={commonStyles.lineBold}>{l.nom}</Text>
                      <Text style={commonStyles.note}>{TS.compte(l.compte, l.libelleCompte)}</Text>
                    </View>
                    <ListePersonnalisee
                      liste={l}
                      archive={inventaire}
                      onChange={charger}
                      onGlisse={setGlisse}
                    />
                  </View>
                ))}
              {perso && !(inventaire.listes ?? []).some((l) => l.categorie === categorie) ? (
                <Text style={commonStyles.mutedItalic}>{TS.structure.categorieVide}</Text>
              ) : null}
            </SectionDeroulante>
          ),
        )}
      </ScrollView>

      <Fab options={optionsAjoutStock} />

      <ArticleAnnexeModal
        visible={ajoutAnnexe?.genre === 'article'}
        categories={annexes.categories.filter((c) => c.activiteId === ajoutAnnexe?.activiteId)}
        activites={annexes.activites}
        activiteId={ajoutAnnexe?.activiteId}
        onChangerActivite={(activiteId) => setAjoutAnnexe((a) => (a ? { ...a, activiteId } : a))}
        onValider={async (donnees) => {
          if (ajoutAnnexe) await enregistrerArticle({ ...donnees, activiteId: ajoutAnnexe.activiteId });
          setAjoutAnnexe(null);
          charger();
        }}
        onSupprimer={() => setAjoutAnnexe(null)}
        onFermer={() => setAjoutAnnexe(null)}
      />
      <NomModal
        visible={ajoutAnnexe?.genre === 'categorie'}
        titre={TEXTES.annexes.catalogue.ajouterCategorie}
        placeholder={TEXTES.annexes.inventaire.categoriePlaceholder}
        onValider={async (nom) => {
          if (ajoutAnnexe) await enregistrerCategorie({ activiteId: ajoutAnnexe.activiteId, nom });
          setAjoutAnnexe(null);
          charger();
        }}
        onAnnuler={() => setAjoutAnnexe(null)}
        enfants={
          <SelectField<string>
            label={TEXTES.annexes.inventaire.activite}
            required
            value={ajoutAnnexe?.activiteId ?? ''}
            onChange={(activiteId) => setAjoutAnnexe((a) => (a ? { ...a, activiteId } : a))}
            options={annexes.activites.map((a) => ({ value: a.id, label: a.nom }))}
          />
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
        visible={!!ajoutListe}
        titre={ajoutListe ? TS.ajouter.dansLaListe(ajoutListe.nom) : ''}
        placeholder={TS.ajouter.exempleArticle}
        onValider={async (nom) => {
          if (ajoutListe)
            await ajouterArticleInventaire(GENRE_ARTICLE.PERSONNALISE, nom, undefined, ajoutListe.id);
          setAjoutListe(null);
          charger();
        }}
        onAnnuler={() => setAjoutListe(null)}
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
