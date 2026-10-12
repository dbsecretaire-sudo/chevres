import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { groupesActifsEspece, laiterieActive } from '@/features/comptabilite/utils/recettes';
import {
  CATEGORIES,
  SECTIONS,
  categoriesAvecAjoutees,
  type Section,
} from '@/features/stock/utils/categories';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Card } from '@/shared/components/Card';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { ROUTES } from '@/shared/constants/routes';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { BlocListe, separationBloc } from '@/shared/components/BlocListe';
import { ListeReordonnable } from '@/shared/components/ListeReordonnable';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { SelectField } from '@/shared/components/SelectField';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { ArticleStockModal } from '@/features/stock/components/ArticleStockModal';
import { DetailBouclesModal } from '@/features/stock/components/DetailBouclesModal';
import { DetailLotsModal } from '@/features/stock/components/DetailLotsModal';
import { estArticleAvecLots, lotsDeLInventaire } from '@/features/stock/services/lots';
import { Button } from '@/shared/components/Button';
import {
  bouclesPossiblesDuCheptel,
  synchroniserBouclesDuCheptel,
  type BouclePossible,
} from '@/features/stock/services/boucles';
import { ModalSynchroBoucles } from '@/features/stock/components/ModalSynchroBoucles';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { synchroBouclesActive } from '@/features/settings/settings';
import { JournalLait } from '@/features/stock/components/JournalLait';
import { LaitJourModal } from '@/features/stock/components/LaitJourModal';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { effectifsVivants, type EffectifVivant } from '@/features/cheptel/repository/chevres';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { lireArchiveStock } from '@/features/stock/repository';
import { CATEGORIE_VENTE, GROUPE_RECETTE } from '@/shared/constants/comptabilite';
import {
  ajouterArticle,
  ajouterMouvementManuel,
  articlesDuGenre,
  bilanLait,
  cleArticle,
  definirPrixArticle,
  prixDesOeufs,
  enregistrerLaitJour,
  positionnerArticle,
  supprimerLaitJour,
  renommerArticle,
  roleDeLaViande,
  estLigneDuCheptel,
  niveauxDeStock,
  masquerArticle,
  supprimerArticle,
  type ArticleAffiche,
  type FiltreStock,
} from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, LaitJour, ListeInventaire } from '@/features/stock/types';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import { COMPTE_PAR_SECTION_INVENTAIRE } from '@/shared/constants/planComptable';
import {
  CLE_PRIX_LAIT,
  CLE_PRIX_OEUFS,
  FILTRE_STOCK_TOUT,
  GENRE_ARTICLE,
  NATURE_PAR_GENRE,
  NATURE_STOCK,
  ORIGINE_MOUVEMENT,
  SECTION_STOCK,
} from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock;

/** Les boucles d'identification ne s'ajoutent pas à la main : elles entrent par un achat en comptabilité. */
type GenreAjoutable = Exclude<GenreArticle, typeof GENRE_ARTICLE.BOUCLE>;

const TEXTES_AJOUT: Record<GenreAjoutable, { titre: string; exemple: string }> = {
  [GENRE_ARTICLE.FROMAGE]: { titre: T.ajouter.fromage, exemple: T.ajouter.exempleFromage },
  [GENRE_ARTICLE.EMBALLAGE]: { titre: T.ajouter.emballages, exemple: T.ajouter.exempleEmballage },
  [GENRE_ARTICLE.MATERIEL]: { titre: T.ajouter.materiel, exemple: T.ajouter.exempleMateriel },
  [GENRE_ARTICLE.BATIMENT]: { titre: T.ajouter.batiment, exemple: T.ajouter.exempleBatiment },
  [GENRE_ARTICLE.ALIMENT]: { titre: T.ajouter.aliment, exemple: T.ajouter.exempleAliment },
  [GENRE_ARTICLE.ENTRETIEN]: { titre: T.ajouter.entretien, exemple: T.ajouter.exempleEntretien },
  [GENRE_ARTICLE.EQUIPEMENT]: {
    titre: T.ajouter.equipementConsommable,
    exemple: T.ajouter.exempleEquipementConsommable,
  },
  [GENRE_ARTICLE.VIANDE]: { titre: T.ajouter.viande, exemple: T.ajouter.exempleViande },
  [GENRE_ARTICLE.PERSONNALISE]: { titre: T.ajouter.article, exemple: T.ajouter.exempleArticle },
};

/** Un fromage ou une viande se vend : il a un prix de vente. */
const seVend = (cle: string): boolean =>
  cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`) || cle.startsWith(`${GENRE_ARTICLE.VIANDE}:`);

/**
 * Le stock d'une exploitation agricole, en trois onglets rangés par nature : ce qui se vend (fromages, lait, viande), ce qui se
 * consomme (aliments, emballages et leur conditionnement, entretien) et les investissements (équipement de fromagerie,
 * matériel). Chaque onglet a ses sections qui se déroulent. Chaque vente de fromage fait baisser tout seul le fromage et ses
 * emballages ; le bouton « + » ajoute un article au nom de son choix, qu'un crayon renomme et qu'une poignée déplace.
 */
export default function StockFromagerie() {
  // La fromagerie n'existe que pour des chèvres ou des brebis ; les aliments et l'entretien sont là pour toute exploitation.
  // Un lien peut ouvrir directement un onglet.
  const router = useRouter();
  const { especes, espece: especeActive } = useEtablissement();
  // Le stock se regarde pour un animal (l'animal actif d'office, quand l'exploitation en élève plusieurs) ou pour toutes les
  // activités. Un choix explicite l'emporte ; sans choix, le filtre suit l'animal actif.
  const [filtre, setFiltre] = useState<FiltreStock | null>(null);
  const voulu: FiltreStock = filtre ?? especeActive;
  const filtreCourant: FiltreStock =
    voulu === FILTRE_STOCK_TOUT || especes.includes(voulu) ? voulu : FILTRE_STOCK_TOUT;
  // La fromagerie et le lait : les chèvres, les brebis et les vaches.
  const fromagerie = (filtreCourant === FILTRE_STOCK_TOUT ? especes : [filtreCourant]).some((espece) =>
    laiterieActive(espece),
  );
  // Les œufs : les espèces qui en vendent (les poules).
  const poules = (filtreCourant === FILTRE_STOCK_TOUT ? especes : [filtreCourant]).some((espece) =>
    groupesActifsEspece(espece).includes(GROUPE_RECETTE.OEUFS),
  );
  const sectionsVisibles = SECTIONS.filter((x) => (fromagerie || !x.fromagerie) && (poules || !x.poules));
  /** L'activité choisie à la création d'un article : « toutes les activités » (vide) d'office. */
  const [activiteAjout, setActiviteAjout] = useState('');
  const { onglet: ongletDemande, espece: especeDemandee } = useLocalSearchParams<{
    onglet?: string;
    espece?: string;
  }>();
  /** La catégorie qui est déroulée (une seule à la fois) : aucune au départ, tout est réduit. */
  const [ouvertes, setOuvertes] = useState<string[]>([]);
  // Un lien (le crayon d'un formulaire) peut ouvrir une liste et un animal précis, même si l'inventaire était déjà ouvert.
  const demande = `${ongletDemande ?? ''}|${especeDemandee ?? ''}`;
  const [demandeVue, setDemandeVue] = useState('|');
  if (demande !== demandeVue) {
    setDemandeVue(demande);
    if (especeDemandee) setFiltre(especeDemandee as FiltreStock);
    // Le lien nomme une liste (les aliments, les animaux…) ou une catégorie : on déroule la catégorie qui la contient.
    const categorieDemandee =
      SECTIONS.find((x) => x.section === ongletDemande)?.categorie ??
      CATEGORIES.find((x) => x.categorie === ongletDemande)?.categorie;
    if (categorieDemandee) {
      setOuvertes([categorieDemandee]);
    }
  }
  /** Les animaux vivants de chaque espèce du cheptel : le niveau des petits, de l'animal sur pied et de l'animal vivant. */
  const [effectifs, setEffectifs] = useState<Partial<Record<EspeceAnimale, EffectifVivant>>>({});
  const [archive, setArchive] = useState<ArchiveStock>({
    mouvements: [],
    articles: [],
    conditionnements: {},
    ordres: {},
    noms: {},
    lait: [],
    prix: {},
  });
  const [article, setArticle] = useState<ArticleAffiche | null>(null);
  /** Le genre d'article qu'on est en train d'ajouter (la fenêtre de saisie est fermée quand il est absent). */
  const [ajout, setAjout] = useState<GenreAjoutable | null>(null);
  /** La sorte de boucles dont on regarde le détail, et si sa fenêtre est ouverte. */
  const [boucleOuverte, setBoucleOuverte] = useState<ArticleAffiche | null>(null);
  const [boucleVisible, setBoucleVisible] = useState(false);
  /** Le fromage dont on regarde les lots (par numéro de lot), et si sa fenêtre est ouverte. */
  const [fromageOuvert, setFromageOuvert] = useState<ArticleAffiche | null>(null);
  const [fromageVisible, setFromageVisible] = useState(false);
  /** La synchronisation des boucles avec le cheptel : les numéros que portent les animaux, et si sa fenêtre est ouverte. */
  const [possibles, setPossibles] = useState<BouclePossible[]>([]);
  const [synchroOuverte, setSynchroOuverte] = useState(false);
  const synchro = synchroBouclesActive(useAppSettings().settings.exploitation);
  /** Pour un ajout dans une liste personnalisée : cette liste. */
  const [listeAjout, setListeAjout] = useState<ListeInventaire | null>(null);
  /** L'article qu'on s'apprête à supprimer (la confirmation est ouverte quand il est présent). */
  const [aSupprimer, setASupprimer] = useState<ArticleAffiche | null>(null);
  /** L'article dont on modifie le nom (le crayon de sa ligne). */
  const [renomme, setRenomme] = useState<ArticleAffiche | null>(null);
  /** Le litrage qu'on modifie (« nouveau » pour en noter un) ; la fenêtre est fermée quand il est absent. */
  const [prixLaitOuvert, setPrixLaitOuvert] = useState(false);
  const [prixOeufsOuvert, setPrixOeufsOuvert] = useState(false);
  const [laitOuvert, setLaitOuvert] = useState<LaitJour | 'nouveau' | null>(null);
  /** Vrai pendant qu'on fait glisser une ligne : la page ne défile alors pas. */
  const [glisse, setGlisse] = useState(false);
  /** Le menu en haut à droite (burger) et la feuille des statistiques qu'il ouvre. */

  /** Les litres de lait vendus (les ventes de lait en comptabilité), pour le lait restant. */
  const [ventesLait, setVentesLait] = useState<{ id: string; date: string; litres: number }[]>([]);
  const litresVendus = ventesLait.reduce((total, v) => total + v.litres, 0);

  const charger = useCallback(async () => {
    const [stock, ventes, vivants] = await Promise.all([
      lireArchiveStock(),
      listToutesVentes(),
      effectifsVivants(),
    ]);
    setArchive(stock);
    setEffectifs(vivants);
    setPossibles(await bouclesPossiblesDuCheptel());
    setVentesLait(
      ventes
        .filter((v) => v.categorie === CATEGORIE_VENTE.LAIT && v.quantite)
        .map((v) => ({ id: v.id, date: v.date, litres: v.quantite ?? 0 })),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const niveaux = niveauxDeStock(archive.mouvements, effectifs);
  /** Vrai quand un des articles de la liste a une quantité négative (une production ou un achat n'a pas été noté). */
  const aUnNegatif = (articles: ArticleAffiche[]) => articles.some((a) => (niveaux.get(a.cle) ?? 0) < 0);

  const ligne = (a: ArticleAffiche, poignee: ReactNode) => {
    const niveau = niveaux.get(a.cle) ?? 0;
    return (
      <ListRow
        key={a.cle}
        title={a.libelle}
        subtitle={
          niveau < 0 ? (
            <Text style={styles.perte}>{T.negatif}</Text>
          ) : a.prix ? (
            roleDeLaViande(a.cle) ? (
              T.parKg(formatMontant(a.prix))
            ) : (
              formatMontant(a.prix)
            )
          ) : undefined
        }
        trailing={
          <View style={stylesStock.fin}>
            <Text style={[styles.resultatLigne, niveau < 0 ? styles.perte : undefined]}>
              {a.cle.startsWith(`${GENRE_ARTICLE.ALIMENT}:`) ? T.kilos(niveau) : T.unites(niveau)}
            </Text>
            <Pressable onPress={() => setRenomme(a)} hitSlop={8} accessibilityLabel={T.renommer.modifier}>
              <Ionicons name="pencil" size={18} color={colors.primary} />
            </Pressable>
            {poignee}
          </View>
        }
        // L'animal sur pied et l'animal vivant suivent le cheptel : on n'y ajoute ni ne retire à la main.
        onPress={
          estLigneDuCheptel(a.cle)
            ? undefined
            : estArticleAvecLots(a.cle)
              ? () => {
                  setFromageOuvert(a);
                  setFromageVisible(true);
                }
              : () => setArticle(a)
        }
      />
    );
  };

  /** Une sorte de boucles : le nombre de boucles à poser ; un appui ouvre le détail des numéros (ni renommer, ni déplacer). */
  const ligneBoucles = (a: ArticleAffiche) => {
    const niveau = niveaux.get(a.cle) ?? 0;
    return (
      <ListRow
        key={a.cle}
        title={a.libelle}
        subtitle={T.boucles.resume(
          (archive.boucles ?? []).filter((b) => b.article === a.cle).length,
          (archive.boucles ?? []).filter((b) => b.article === a.cle && !!b.chevreId).length,
        )}
        trailing={
          <View style={stylesStock.fin}>
            <Text style={[styles.resultatLigne, niveau < 0 ? styles.perte : undefined]}>
              {T.unites(niveau)}
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </View>
        }
        onPress={() => {
          setBoucleOuverte(a);
          setBoucleVisible(true);
        }}
      />
    );
  };

  /** La liste glissable des articles d'un genre (filtrée par activité). */
  /** Les articles d'une liste : un genre (filtré par activité), dont les lignes de viande se partagent entre deux catégories. */
  const articlesDeLaListe = (genre: GenreArticle, section?: Section, listeId?: string) =>
    articlesDuGenre(genre, archive, filtreCourant, listeId).filter((a) =>
      genre !== GENRE_ARTICLE.VIANDE
        ? true
        : section === SECTION_STOCK.ANIMAUX
          ? roleDeLaViande(a.cle) !== undefined
          : roleDeLaViande(a.cle) === undefined,
    );

  /** La liste glissable des articles d'une section (les lignes des animaux suivent le cheptel : elles ne se déplacent pas). */
  const liste = (genre: GenreArticle, section?: Section, listeId?: string) => {
    const elements = articlesDeLaListe(genre, section, listeId);
    if (genre === GENRE_ARTICLE.BOUCLE)
      return (
        <BlocListe>
          {elements.map((a, i) => (
            <View key={a.cle} style={i > 0 ? separationBloc : undefined}>
              {ligneBoucles(a)}
            </View>
          ))}
        </BlocListe>
      );
    if (section === SECTION_STOCK.ANIMAUX)
      return (
        <BlocListe>
          {elements.map((a, i) => (
            <View key={a.cle} style={i > 0 ? separationBloc : undefined}>
              {ligne(a, null)}
            </View>
          ))}
        </BlocListe>
      );
    return (
      <ListeReordonnable
        elements={elements}
        cle={(a) => a.cle}
        ligne={ligne}
        onGlisse={setGlisse}
        onDeplacer={async (cle, index) => {
          // La liste affichée est une partie du genre : on place la ligne là où se trouve celle qu'elle remplace.
          const autres = elements.filter((a) => a.cle !== cle);
          const complet = articlesDuGenre(genre, archive, filtreCourant)
            .map((a) => a.cle)
            .filter((c) => c !== cle);
          const cible = autres[index];
          const indexComplet = cible ? complet.indexOf(cible.cle) : complet.length;
          await positionnerArticle(genre, cle, indexComplet, filtreCourant);
          charger();
        }}
      />
    );
  };

  const synchroniserLesBoucles = async (tiptags: string[]) => {
    setSynchroOuverte(false);
    const reprises = await synchroniserBouclesDuCheptel(tiptags);
    await charger();
    Alert.alert(T.boucles.synchro.fait(reprises));
  };

  const valider = async (cle: string, delta: number, litres?: number) => {
    // Retirer d'un consommable (aliment, emballage, entretien), c'est ce qui a été consommé.
    const consomme =
      delta < 0 && NATURE_PAR_GENRE[cle.split(':')[0] as GenreArticle] === NATURE_STOCK.CONSOMMABLE;
    await ajouterMouvementManuel(
      cle,
      delta,
      todayISO(),
      litres,
      consomme ? ORIGINE_MOUVEMENT.CONSOMMATION : ORIGINE_MOUVEMENT.MANUEL,
    );
    setArticle(null);
    charger();
  };

  /** Supprime l'article confirmé : un article ajouté disparaît, un article d'office est masqué. */
  const retirer = async () => {
    if (aSupprimer?.id) await supprimerArticle(aSupprimer.id);
    else if (aSupprimer) await masquerArticle(aSupprimer.cle);
    setASupprimer(null);
    charger();
  };

  const ouvrirAjout = (genre: GenreAjoutable, liste?: ListeInventaire) => {
    setListeAjout(liste ?? null);
    // L'article est proposé pour l'animal actif ; on peut le passer à une autre activité, ou à toutes.
    setActiviteAjout(especes.includes(especeActive) ? especeActive : '');
    setAjout(genre);
  };

  const creer = async (nom: string) => {
    if (ajout) await ajouterArticle(ajout, nom, activiteAjout || undefined, listeAjout?.id);
    setAjout(null);
    setListeAjout(null);
    charger();
  };

  const renommer = async (nom: string, prix?: number) => {
    if (renomme) {
      if (nom) await renommerArticle(renomme.cle, nom);
      // Seuls les fromages et les viandes se vendent : eux seuls ont un prix.
      if (seVend(renomme.cle)) await definirPrixArticle(renomme.cle, prix);
    }
    setRenomme(null);
    charger();
  };

  /** Vrai quand le crayon modifie un fromage ou une viande (produit fini ou animal) : on n'y change que le prix. */
  const produitFiniModifie =
    !!renomme && [GENRE_ARTICLE.FROMAGE, GENRE_ARTICLE.VIANDE].some((g) => renomme.cle.startsWith(`${g}:`));

  /** Une seule catégorie est déroulée à la fois : en ouvrir une referme l'autre. */
  const basculerCategorie = (categorie: string) =>
    setOuvertes((actuelles) => (actuelles.includes(categorie) ? [] : [categorie]));

  /** Ce que le bouton « + » propose : un ajout pour chaque liste des catégories déroulées (toutes si aucune ne l'est). */
  const optionsAjout = sectionsVisibles
    .filter((x) => ouvertes.length === 0 || ouvertes.includes(x.categorie))
    // Les fromages et la viande (produits finis et produits animaux) entrent par la Production et sortent par les ventes : on n'en
    // ajoute pas ici.
    .filter((x) => x.genre !== GENRE_ARTICLE.FROMAGE && x.genre !== GENRE_ARTICLE.VIANDE)
    .map(({ section, genre }) =>
      genre === GENRE_ARTICLE.BOUCLE
        ? null
        : genre
          ? {
              label: TEXTES_AJOUT[genre].titre,
              icon: 'add-circle' as const,
              onPress: () => ouvrirAjout(genre),
            }
          : section === SECTION_STOCK.LAIT
            ? {
                label: T.laitJour.ajouter,
                icon: 'add-circle' as const,
                onPress: () => setLaitOuvert('nouveau'),
              }
            : null,
    )
    .filter((x) => x !== null);
  const optionsListes = (archive.listes ?? [])
    .filter((l) => ouvertes.length === 0 || ouvertes.includes(l.categorie))
    .map((l) => ({
      label: T.ajouter.dansLaListe(l.nom),
      icon: 'add-circle' as const,
      onPress: () => ouvrirAjout(GENRE_ARTICLE.PERSONNALISE, l),
    }));

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab} scrollEnabled={!glisse}>
        {especes.length > 1 ? (
          <ChoixDeroulant<FiltreStock>
            titre={TEXTES.commun.choix.animal}
            valeur={filtreCourant}
            options={[
              { value: FILTRE_STOCK_TOUT, label: TEXTES.comptabilite.parActivite.toutes },
              ...especes.map((e) => ({ value: e as FiltreStock, label: LABEL_ACTIVITE_COMPTABLE[e] })),
            ]}
            onChoisir={setFiltre}
          />
        ) : null}

        {categoriesAvecAjoutees(CATEGORIES, archive.categories, archive.reglagesCategories).map(
          ({ categorie, nom, classe, perso }) => {
            const listes = sectionsVisibles.filter((x) => x.categorie === categorie);
            const listesPerso = (archive.listes ?? []).filter((l) => l.categorie === categorie);
            // Une catégorie ajoutée se montre même sans liste ; une catégorie d'office sans rien à montrer, non.
            if (listes.length === 0 && listesPerso.length === 0 && !perso) return null;
            return (
              <SectionDeroulante
                key={categorie}
                titre={T.enteteCategorie(classe, nom)}
                ouverte={ouvertes.includes(categorie)}
                onBasculer={() => basculerCategorie(categorie)}
                alerte={
                  listes.some(
                    ({ section, genre }) => !!genre && aUnNegatif(articlesDeLaListe(genre, section)),
                  ) ||
                  listesPerso.some((l) =>
                    aUnNegatif(articlesDeLaListe(GENRE_ARTICLE.PERSONNALISE, undefined, l.id)),
                  )
                }
              >
                {listes.map(({ section, titre, genre }) => {
                  const compte = COMPTE_PAR_SECTION_INVENTAIRE[section];
                  return (
                    <View key={section} style={commonStyles.gap10}>
                      <View style={commonStyles.rowSpaceBetween}>
                        <View style={commonStyles.gap2}>
                          <Text style={commonStyles.lineBold}>{titre}</Text>
                          <Text style={commonStyles.note}>{T.compte(compte.numero, compte.libelle)}</Text>
                        </View>
                        <View style={commonStyles.row}>
                          {genre && aUnNegatif(articlesDeLaListe(genre, section)) ? <PastilleAlerte /> : null}
                          {section === SECTION_STOCK.FROMAGES && fromagerie ? (
                            <Pressable
                              onPress={() => router.push(ROUTES.STOCK_STATISTIQUES)}
                              hitSlop={10}
                              accessibilityLabel={T.statistiques.titre}
                            >
                              <Ionicons name="stats-chart" size={24} color={colors.primary} />
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                      {genre ? (
                        <>
                          {genre === GENRE_ARTICLE.BOUCLE && synchro && possibles.length > 0 ? (
                            <Card>
                              <Text style={commonStyles.lineBold}>{T.boucles.synchro.titre}</Text>
                              <Text style={commonStyles.muted}>
                                {T.boucles.synchro.message(possibles.length)}
                              </Text>
                              <Button
                                variant="secondary"
                                label={T.boucles.synchro.bouton}
                                onPress={() => setSynchroOuverte(true)}
                              />
                            </Card>
                          ) : null}
                          {liste(genre, section)}
                        </>
                      ) : section === SECTION_STOCK.LAIT ? (
                        <JournalLait
                          lait={archive.lait}
                          bilan={bilanLait(archive, litresVendus)}
                          prix={archive.prix[CLE_PRIX_LAIT]}
                          onModifierPrix={() => setPrixLaitOuvert(true)}
                          onOuvrir={setLaitOuvert}
                        />
                      ) : section === SECTION_STOCK.OEUFS ? (
                        <Card>
                          <View style={commonStyles.rowSpaceBetween}>
                            <Text style={commonStyles.muted}>{T.oeufs.prixDeLOeuf}</Text>
                            <Pressable
                              style={commonStyles.rowFin}
                              onPress={() => setPrixOeufsOuvert(true)}
                              hitSlop={8}
                              accessibilityLabel={T.oeufs.modifierLePrix}
                            >
                              <Text style={commonStyles.lineBold}>
                                {T.oeufs.prixOeuf(formatMontant(prixDesOeufs(archive)))}
                              </Text>
                              <Ionicons name="pencil" size={18} color={colors.ajout} />
                            </Pressable>
                          </View>
                          <Text style={commonStyles.note}>{T.oeufs.note}</Text>
                        </Card>
                      ) : null}
                    </View>
                  );
                })}
                {listesPerso.map((l) => (
                  <View key={l.id} style={commonStyles.gap10}>
                    <View style={commonStyles.gap2}>
                      <Text style={commonStyles.lineBold}>{l.nom}</Text>
                      <Text style={commonStyles.note}>{T.compte(l.compte, l.libelleCompte)}</Text>
                    </View>
                    {articlesDeLaListe(GENRE_ARTICLE.PERSONNALISE, undefined, l.id).length === 0 ? (
                      <Text style={commonStyles.mutedItalic}>{T.ajouter.listeVide}</Text>
                    ) : (
                      liste(GENRE_ARTICLE.PERSONNALISE, undefined, l.id)
                    )}
                  </View>
                ))}
                {perso && listesPerso.length === 0 ? (
                  <Text style={commonStyles.mutedItalic}>{T.structure.categorieVide}</Text>
                ) : null}
              </SectionDeroulante>
            );
          },
        )}
      </ScrollView>

      {/* À droite du titre : la structure des listes et l'historique des mouvements (les statistiques sont sur Fromages, le PDF dans Organisation › PDF). */}
      <Stack.Screen
        options={{
          headerRight: () => (
            <View
              style={[
                commonStyles.headerDroite,
                commonStyles.boutonEnteteDroite,
                commonStyles.headerDroiteEspacee,
              ]}
            >
              <Pressable
                onPress={() => router.push(ROUTES.STOCK_STRUCTURE)}
                hitSlop={10}
                accessibilityLabel={T.structure.titre}
              >
                <Ionicons name="albums" size={24} color={colors.blanc} />
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push(
                    ROUTES.stockHistorique(filtreCourant === FILTRE_STOCK_TOUT ? undefined : filtreCourant),
                  )
                }
                hitSlop={10}
                accessibilityLabel={T.historique.titre}
              >
                <Ionicons name="time" size={24} color={colors.blanc} />
              </Pressable>
            </View>
          ),
        }}
      />

      <Fab options={[...optionsAjout, ...optionsListes]} />

      <ModalSynchroBoucles
        visible={synchroOuverte}
        possibles={possibles}
        onValider={synchroniserLesBoucles}
        onAnnuler={() => setSynchroOuverte(false)}
      />

      <ArticleStockModal
        visible={prixLaitOuvert}
        titre={T.laitJour.modifierLePrix}
        prix={archive.prix[CLE_PRIX_LAIT]}
        avecPrix
        libellePrix={T.articleModal.prixLitre}
        onValider={async (_nom, prix) => {
          await definirPrixArticle(CLE_PRIX_LAIT, prix);
          setPrixLaitOuvert(false);
          charger();
        }}
        onAnnuler={() => setPrixLaitOuvert(false)}
      />

      <ArticleStockModal
        visible={prixOeufsOuvert}
        titre={T.oeufs.modifierLePrix}
        prix={prixDesOeufs(archive)}
        avecPrix
        libellePrix={T.oeufs.prixLabel}
        onValider={async (_nom, prix) => {
          await definirPrixArticle(CLE_PRIX_OEUFS, prix);
          setPrixOeufsOuvert(false);
          charger();
        }}
        onAnnuler={() => setPrixOeufsOuvert(false)}
      />

      <LaitJourModal
        visible={laitOuvert !== null}
        entree={laitOuvert && laitOuvert !== 'nouveau' ? laitOuvert : undefined}
        onValider={async (valeurs) => {
          await enregistrerLaitJour(valeurs);
          setLaitOuvert(null);
          charger();
        }}
        onSupprimer={async () => {
          if (laitOuvert && laitOuvert !== 'nouveau') await supprimerLaitJour(laitOuvert.id);
          setLaitOuvert(null);
          charger();
        }}
        onFermer={() => setLaitOuvert(null)}
      />

      <DetailLotsModal
        visible={fromageVisible}
        article={fromageOuvert}
        lots={archive.lots ?? []}
        sansLot={
          fromageOuvert
            ? Math.max(
                0,
                (niveaux.get(fromageOuvert.cle) ?? 0) -
                  lotsDeLInventaire(archive, 'en_stock', fromageOuvert.cle).length,
              )
            : 0
        }
        onChange={charger}
        onFermer={() => setFromageVisible(false)}
      />

      <DetailBouclesModal
        visible={boucleVisible}
        article={boucleOuverte}
        boucles={archive.boucles ?? []}
        onFermer={() => setBoucleVisible(false)}
      />

      <MouvementStockModal
        article={article}
        unite={article?.cle.startsWith(`${GENRE_ARTICLE.ALIMENT}:`) ? TEXTES.commun.general.kg : undefined}
        consommable={
          !!article &&
          NATURE_PAR_GENRE[article.cle.split(':')[0] as GenreArticle] === NATURE_STOCK.CONSOMMABLE
        }
        niveau={article ? niveaux.get(article.cle) : undefined}
        avecLitres={article?.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)}
        libelleLitres={
          article?.cle === cleArticle(GENRE_ARTICLE.FROMAGE, 'brocciu') ? T.modal.litresBrocciu : undefined
        }
        onValider={valider}
        onSupprimer={() => {
          setASupprimer(article);
          setArticle(null);
        }}
        onFermer={() => setArticle(null)}
      />
      <ArticleStockModal
        visible={!!renomme}
        titre={produitFiniModifie ? (renomme?.libelle ?? '') : T.renommer.titre}
        nom={renomme?.libelle}
        prix={renomme?.prix}
        avecPrix={!!renomme && seVend(renomme.cle)}
        parKg={!!renomme && roleDeLaViande(renomme.cle) !== undefined}
        // Un produit fini ou animal : seul son prix de vente se modifie (ni nom, ni suppression).
        libellePrix={
          produitFiniModifie
            ? renomme && roleDeLaViande(renomme.cle)
              ? T.articleModal.prixKg
              : T.articleModal.prix
            : undefined
        }
        onValider={renommer}
        onSupprimer={
          produitFiniModifie
            ? undefined
            : () => {
                setASupprimer(renomme);
                setRenomme(null);
              }
        }
        onAnnuler={() => setRenomme(null)}
      />
      <ConfirmModal
        visible={!!aSupprimer}
        title={T.suppression.titre}
        message={T.suppression.message(aSupprimer?.libelle ?? '')}
        confirmLabel={TEXTES.commun.general.supprimer}
        onCancel={() => setASupprimer(null)}
        onConfirm={retirer}
      />
      <NomModal
        visible={!!ajout}
        titre={listeAjout ? T.ajouter.dansLaListe(listeAjout.nom) : ajout ? TEXTES_AJOUT[ajout].titre : ''}
        placeholder={ajout ? TEXTES_AJOUT[ajout].exemple : T.ajouter.nom}
        onValider={creer}
        onAnnuler={() => {
          setAjout(null);
          setListeAjout(null);
        }}
        enfants={
          especes.length > 1 ? (
            <SelectField<string>
              label={T.ajouter.activite}
              value={activiteAjout}
              onChange={setActiviteAjout}
              options={[
                { value: '', label: T.ajouter.toutesActivites },
                ...especes.map((e) => ({ value: e as string, label: LABEL_ACTIVITE_COMPTABLE[e] })),
              ]}
            />
          ) : null
        }
      />
    </Screen>
  );
}
