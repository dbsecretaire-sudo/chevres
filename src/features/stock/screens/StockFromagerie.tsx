import { useCallback, useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Tabs, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { ROUTES } from '@/shared/constants/routes';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { ListeReordonnable } from '@/shared/components/ListeReordonnable';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { SelectField } from '@/shared/components/SelectField';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { ArticleStockModal } from '@/features/stock/components/ArticleStockModal';
import { JournalLait } from '@/features/stock/components/JournalLait';
import { LaitJourModal } from '@/features/stock/components/LaitJourModal';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { effectifsVivants, type EffectifVivant } from '@/features/cheptel/repository/chevres';
import type { EspeceAnimale } from '@/shared/dictionnaire/animaux';
import { lireArchiveStock } from '@/features/stock/repository';
import { CATEGORIE_VENTE } from '@/shared/constants/comptabilite';
import {
  ajouterArticle,
  ajouterMouvementManuel,
  articlesDuGenre,
  bilanLait,
  cleArticle,
  conditionnementDe,
  definirConditionnement,
  definirPrixArticle,
  enregistrerLaitJour,
  positionnerArticle,
  supprimerLaitJour,
  renommerArticle,
  roleDeLaViande,
  libelleArticle,
  estLigneDuCheptel,
  niveauxDeStock,
  masquerArticle,
  supprimerArticle,
  type ArticleAffiche,
  type FiltreStock,
} from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle, LaitJour } from '@/features/stock/types';
import { LABEL_ACTIVITE_COMPTABLE } from '@/shared/textes/libelles';
import {
  ARTICLE_EMBALLAGE,
  FILTRE_STOCK_TOUT,
  GENRE_ARTICLE,
  NATURE_PAR_GENRE,
  NATURE_STOCK,
  ONGLET_STOCK,
  ORIGINE_MOUVEMENT,
  SECTION_STOCK,
} from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Onglet = ValeurDe<typeof ONGLET_STOCK>;
type Section = ValeurDe<typeof SECTION_STOCK>;

const T = TEXTES.stock;

/** Les trois onglets : ce qui se vend, ce qui se consomme, les investissements. */
const PUCES: { valeur: Onglet; label: string }[] = [
  { valeur: ONGLET_STOCK.VENTE, label: T.onglets.vente },
  { valeur: ONGLET_STOCK.CONSOMMABLES, label: T.onglets.consommables },
  { valeur: ONGLET_STOCK.INVESTISSEMENTS, label: T.onglets.investissements },
];

/**
 * Les sections déroulables de chaque onglet : leur titre, le genre d'article qu'elles listent (le lait et le conditionnement
 * n'en ont pas), et si elles ne valent que pour la fromagerie (chèvres et brebis).
 */
const SECTIONS: {
  section: Section;
  onglet: Onglet;
  titre: string;
  genre?: GenreArticle;
  fromagerie?: boolean;
}[] = [
  {
    section: SECTION_STOCK.FROMAGES,
    onglet: ONGLET_STOCK.VENTE,
    titre: T.sections.fromages,
    genre: GENRE_ARTICLE.FROMAGE,
    fromagerie: true,
  },
  { section: SECTION_STOCK.LAIT, onglet: ONGLET_STOCK.VENTE, titre: T.onglets.lait, fromagerie: true },
  {
    section: SECTION_STOCK.VIANDE,
    onglet: ONGLET_STOCK.VENTE,
    titre: T.onglets.viande,
    genre: GENRE_ARTICLE.VIANDE,
  },
  {
    section: SECTION_STOCK.ALIMENTS,
    onglet: ONGLET_STOCK.CONSOMMABLES,
    titre: T.onglets.aliments,
    genre: GENRE_ARTICLE.ALIMENT,
  },
  {
    section: SECTION_STOCK.EMBALLAGES,
    onglet: ONGLET_STOCK.CONSOMMABLES,
    titre: T.sections.emballages,
    genre: GENRE_ARTICLE.EMBALLAGE,
    fromagerie: true,
  },
  {
    section: SECTION_STOCK.CONDITIONNEMENT,
    onglet: ONGLET_STOCK.CONSOMMABLES,
    titre: T.sections.conditionnement,
    fromagerie: true,
  },
  {
    section: SECTION_STOCK.ENTRETIEN,
    onglet: ONGLET_STOCK.CONSOMMABLES,
    titre: T.onglets.entretien,
    genre: GENRE_ARTICLE.ENTRETIEN,
  },
  {
    section: SECTION_STOCK.EQUIPEMENT_CONSOMMABLE,
    onglet: ONGLET_STOCK.CONSOMMABLES,
    titre: T.sections.materiel,
    genre: GENRE_ARTICLE.EQUIPEMENT,
  },
  {
    section: SECTION_STOCK.EQUIPEMENT,
    onglet: ONGLET_STOCK.INVESTISSEMENTS,
    titre: T.sections.materiel,
    genre: GENRE_ARTICLE.MATERIEL,
    fromagerie: true,
  },
  {
    section: SECTION_STOCK.MATERIEL,
    onglet: ONGLET_STOCK.INVESTISSEMENTS,
    titre: T.onglets.materiel,
    genre: GENRE_ARTICLE.BATIMENT,
  },
];

const TEXTES_AJOUT: Record<GenreArticle, { titre: string; exemple: string }> = {
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
};

/** Un fromage ou une viande se vend : il a un prix de vente. */
const seVend = (cle: string): boolean =>
  cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`) || cle.startsWith(`${GENRE_ARTICLE.VIANDE}:`);

/** Le code d'un article (« fromage:frais » → « frais »). */
const codeDe = (cle: string): string => cle.split(':')[1];

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
  const fromagerie =
    filtreCourant === FILTRE_STOCK_TOUT
      ? especes.some((e) => e === TYPE_ANIMAL_ETABLISSEMENT.CHEVRES || e === TYPE_ANIMAL_ETABLISSEMENT.BREBIS)
      : filtreCourant === TYPE_ANIMAL_ETABLISSEMENT.CHEVRES ||
        filtreCourant === TYPE_ANIMAL_ETABLISSEMENT.BREBIS;
  // La fromagerie et le lait ne concernent que les chèvres et les brebis ; le reste vaut pour tous les animaux.
  const sectionsVisibles = SECTIONS.filter((x) => fromagerie || !x.fromagerie);
  /** L'activité choisie à la création d'un article : « toutes les activités » (vide) d'office. */
  const [activiteAjout, setActiviteAjout] = useState('');
  const { onglet: ongletDemande, espece: especeDemandee } = useLocalSearchParams<{
    onglet?: string;
    espece?: string;
  }>();
  const [choisi, setOnglet] = useState<Onglet | undefined>();
  /** Les sections qui sont déroulées : aucune au départ, tout est réduit. */
  const [ouvertes, setOuvertes] = useState<Section[]>([]);
  // Un lien (le crayon d'un formulaire) peut ouvrir un onglet et un animal précis, même si le stock était déjà ouvert.
  const demande = `${ongletDemande ?? ''}|${especeDemandee ?? ''}`;
  const [demandeVue, setDemandeVue] = useState('|');
  if (demande !== demandeVue) {
    setDemandeVue(demande);
    if (especeDemandee) setFiltre(especeDemandee as FiltreStock);
    // Le lien nomme une section (les aliments, la viande…) ou un onglet : on ouvre l'onglet, et la section.
    const sectionDemandee = SECTIONS.find((x) => x.section === ongletDemande);
    if (sectionDemandee) {
      setOnglet(sectionDemandee.onglet);
      setOuvertes((actuelles) =>
        actuelles.includes(sectionDemandee.section) ? actuelles : [...actuelles, sectionDemandee.section],
      );
    } else if (ongletDemande) setOnglet(ongletDemande as Onglet);
  }
  const onglet: Onglet = choisi ?? ONGLET_STOCK.VENTE;
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
  const [ajout, setAjout] = useState<GenreArticle | null>(null);
  /** L'article qu'on s'apprête à supprimer (la confirmation est ouverte quand il est présent). */
  const [aSupprimer, setASupprimer] = useState<ArticleAffiche | null>(null);
  /** L'article dont on modifie le nom (le crayon de sa ligne). */
  const [renomme, setRenomme] = useState<ArticleAffiche | null>(null);
  /** Le litrage qu'on modifie (« nouveau » pour en noter un) ; la fenêtre est fermée quand il est absent. */
  const [laitOuvert, setLaitOuvert] = useState<LaitJour | 'nouveau' | null>(null);
  /** Le fromage dont on modifie le conditionnement. */
  const [enEdition, setEnEdition] = useState<string | null>(null);
  /** Vrai pendant qu'on fait glisser une ligne : la page ne défile alors pas. */
  const [glisse, setGlisse] = useState(false);
  /** Le menu en haut à droite (burger) et la feuille des statistiques qu'il ouvre. */
  const [menuOuvert, setMenuOuvert] = useState(false);

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

  const ligne = (a: ArticleAffiche, poignee: ReactNode) => {
    const niveau = niveaux.get(a.cle) ?? 0;
    return (
      <ListRow
        key={a.cle}
        title={a.libelle}
        subtitle={
          niveau < 0
            ? T.negatif
            : a.prix
              ? roleDeLaViande(a.cle)
                ? T.parKg(formatMontant(a.prix))
                : formatMontant(a.prix)
              : undefined
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
        onPress={estLigneDuCheptel(a.cle) ? undefined : () => setArticle(a)}
      />
    );
  };

  /** La liste glissable des articles d'un genre (filtrée par activité). */
  const liste = (genre: GenreArticle) => (
    <ListeReordonnable
      elements={articlesDuGenre(genre, archive, filtreCourant)}
      cle={(a) => a.cle}
      ligne={ligne}
      onGlisse={setGlisse}
      onDeplacer={async (cle, index) => {
        await positionnerArticle(genre, cle, index, filtreCourant);
        charger();
      }}
    />
  );

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

  const ouvrirAjout = (genre: GenreArticle) => {
    // L'article est proposé pour l'animal actif ; on peut le passer à une autre activité, ou à toutes.
    setActiviteAjout(especes.includes(especeActive) ? especeActive : '');
    setAjout(genre);
  };

  const creer = async (nom: string) => {
    if (ajout) await ajouterArticle(ajout, nom, activiteAjout || undefined);
    setAjout(null);
    charger();
  };

  const renommer = async (nom: string, prix?: number) => {
    if (renomme) {
      await renommerArticle(renomme.cle, nom);
      // Seuls les fromages et les viandes se vendent : eux seuls ont un prix.
      if (seVend(renomme.cle)) await definirPrixArticle(renomme.cle, prix);
    }
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

  const basculerSection = (section: Section) =>
    setOuvertes((actuelles) =>
      actuelles.includes(section) ? actuelles.filter((s) => s !== section) : [...actuelles, section],
    );

  const emballages = articlesDuGenre(GENRE_ARTICLE.EMBALLAGE, archive, filtreCourant);
  const fromages = articlesDuGenre(GENRE_ARTICLE.FROMAGE, archive, filtreCourant);

  /** Le conditionnement : pour chaque fromage, les emballages qu'une vente consomme (un crayon les modifie un par un). */
  const conditionnement = (
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
  );

  /** Ce que le bouton « + » propose : un ajout pour chaque section de l'onglet (un article, ou un litrage de lait). */
  const optionsAjout = sectionsVisibles
    .filter((x) => x.onglet === onglet)
    .map(({ section, genre }) =>
      genre
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

        <PucesDefilantes<Onglet> puces={PUCES} valeur={onglet} onChoisir={setOnglet} />

        {sectionsVisibles
          .filter((x) => x.onglet === onglet)
          .map(({ section, titre, genre }) => (
            <SectionDeroulante
              key={section}
              titre={titre}
              nombre={
                genre
                  ? articlesDuGenre(genre, archive, filtreCourant).length
                  : section === SECTION_STOCK.LAIT
                    ? archive.lait.length
                    : fromages.length
              }
              ouverte={ouvertes.includes(section)}
              onBasculer={() => basculerSection(section)}
            >
              {genre ? (
                liste(genre)
              ) : section === SECTION_STOCK.LAIT ? (
                <JournalLait
                  lait={archive.lait}
                  bilan={bilanLait(archive, litresVendus)}
                  onOuvrir={setLaitOuvert}
                />
              ) : (
                conditionnement
              )}
            </SectionDeroulante>
          ))}
      </ScrollView>

      {/* Le menu burger, à droite du titre : les statistiques de la fromagerie (lait par fromage) et l'historique. */}
      <Tabs.Screen
        options={{
          headerRight: () => (
            <Pressable
              style={commonStyles.boutonEnteteDroite}
              onPress={() => setMenuOuvert(true)}
              hitSlop={10}
              accessibilityLabel={T.statistiques.menu}
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
            label: T.historique.titre,
            icon: 'time' as const,
            onPress: () =>
              router.push(
                ROUTES.stockHistorique(filtreCourant === FILTRE_STOCK_TOUT ? undefined : filtreCourant),
              ),
          },
          ...(fromagerie
            ? [
                {
                  label: T.statistiques.titre,
                  icon: 'stats-chart' as const,
                  onPress: () => router.push(ROUTES.STOCK_STATISTIQUES),
                },
              ]
            : []),
        ]}
      />

      <Fab options={optionsAjout} />

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
        titre={T.renommer.titre}
        nom={renomme?.libelle}
        prix={renomme?.prix}
        avecPrix={!!renomme && seVend(renomme.cle)}
        parKg={!!renomme && roleDeLaViande(renomme.cle) !== undefined}
        onValider={renommer}
        onSupprimer={() => {
          setASupprimer(renomme);
          setRenomme(null);
        }}
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
        titre={ajout ? TEXTES_AJOUT[ajout].titre : ''}
        placeholder={ajout ? TEXTES_AJOUT[ajout].exemple : T.ajouter.nom}
        onValider={creer}
        onAnnuler={() => setAjout(null)}
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
