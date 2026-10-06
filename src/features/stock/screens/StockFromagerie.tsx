import { useCallback, useState, type ReactNode } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Tabs, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { TYPE_ANIMAL_ETABLISSEMENT } from '@/shared/constants/etablissements';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/shared/components/ScreenList';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
import { Fab } from '@/shared/components/Fab';
import { ListRow } from '@/shared/components/ListRow';
import { ListeReordonnable } from '@/shared/components/ListeReordonnable';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { PucesDefilantes } from '@/shared/components/PucesDefilantes';
import { SectionDeroulante } from '@/shared/components/SectionDeroulante';
import { SelectField } from '@/shared/components/SelectField';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { ArticleStockModal } from '@/features/stock/components/ArticleStockModal';
import { HistoriqueStock } from '@/features/stock/components/HistoriqueStock';
import { JournalLait } from '@/features/stock/components/JournalLait';
import { LaitJourModal } from '@/features/stock/components/LaitJourModal';
import { LaitParFromage } from '@/features/stock/components/LaitParFromage';
import { MouvementStockModal } from '@/features/stock/components/MouvementStockModal';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
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
  niveauxDeStock,
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
  ONGLET_STOCK,
  SECTION_FROMAGERIE,
} from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatMontant, todayISO } from '@/shared/utils/dates';
import { styles } from '@/shared/styles/trading/Trading.styles';
import { styles as stylesStock } from '@/shared/styles/stock/Stock.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

type Onglet = ValeurDe<typeof ONGLET_STOCK>;
type Section = ValeurDe<typeof SECTION_FROMAGERIE>;

const T = TEXTES.stock;
const PUCE_FROMAGERIE: { valeur: Onglet; label: string } = {
  valeur: ONGLET_STOCK.FROMAGERIE,
  label: T.onglets.fromagerie,
};
const PUCE_LAIT: { valeur: Onglet; label: string } = { valeur: ONGLET_STOCK.LAIT, label: T.onglets.lait };
const PUCES_AUTRES: { valeur: Onglet; label: string }[] = [
  { valeur: ONGLET_STOCK.ALIMENTS, label: T.onglets.aliments },
  { valeur: ONGLET_STOCK.VIANDE, label: T.onglets.viande },
  { valeur: ONGLET_STOCK.ENTRETIEN, label: T.onglets.entretien },
];

/** Le genre d'article des onglets qui ne listent qu'un genre. */
const GENRE_PAR_ONGLET: Partial<Record<Onglet, GenreArticle>> = {
  [ONGLET_STOCK.ALIMENTS]: GENRE_ARTICLE.ALIMENT,
  [ONGLET_STOCK.VIANDE]: GENRE_ARTICLE.VIANDE,
  [ONGLET_STOCK.ENTRETIEN]: GENRE_ARTICLE.ENTRETIEN,
};

/** Les sections déroulables de la fromagerie : leur titre, et le genre d'article qu'elles listent (le conditionnement n'en a pas). */
const SECTIONS: { section: Section; titre: string; genre?: GenreArticle }[] = [
  { section: SECTION_FROMAGERIE.FROMAGES, titre: T.sections.fromages, genre: GENRE_ARTICLE.FROMAGE },
  { section: SECTION_FROMAGERIE.EMBALLAGES, titre: T.sections.emballages, genre: GENRE_ARTICLE.EMBALLAGE },
  { section: SECTION_FROMAGERIE.MATERIEL, titre: T.sections.materiel, genre: GENRE_ARTICLE.MATERIEL },
  { section: SECTION_FROMAGERIE.CONDITIONNEMENT, titre: T.sections.conditionnement },
];

const TEXTES_AJOUT: Record<GenreArticle, { titre: string; exemple: string }> = {
  [GENRE_ARTICLE.FROMAGE]: { titre: T.ajouter.fromage, exemple: T.ajouter.exempleFromage },
  [GENRE_ARTICLE.EMBALLAGE]: { titre: T.ajouter.emballages, exemple: T.ajouter.exempleEmballage },
  [GENRE_ARTICLE.MATERIEL]: { titre: T.ajouter.materiel, exemple: T.ajouter.exempleMateriel },
  [GENRE_ARTICLE.ALIMENT]: { titre: T.ajouter.aliment, exemple: T.ajouter.exempleAliment },
  [GENRE_ARTICLE.ENTRETIEN]: { titre: T.ajouter.entretien, exemple: T.ajouter.exempleEntretien },
  [GENRE_ARTICLE.VIANDE]: { titre: T.ajouter.viande, exemple: T.ajouter.exempleViande },
};

/** Un fromage ou une viande se vend : il a un prix de vente. */
const seVend = (cle: string): boolean =>
  cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`) || cle.startsWith(`${GENRE_ARTICLE.VIANDE}:`);

/** Le code d'un article (« fromage:frais » → « frais »). */
const codeDe = (cle: string): string => cle.split(':')[1];

/**
 * Le stock d'une exploitation agricole, en trois parties : la fromagerie (des sections qui se déroulent — fromages avec le
 * lait qu'il faut par fromage, emballages, matériel et conditionnement, les emballages que chaque fromage vendu consomme),
 * les aliments et l'entretien. Chaque vente de fromage fait baisser tout seul le fromage et ses emballages ; le bouton « + »
 * ajoute un article au nom de son choix, qu'un crayon renomme et qu'une poignée déplace.
 */
export default function StockFromagerie() {
  // La fromagerie n'existe que pour des chèvres ou des brebis ; les aliments et l'entretien sont là pour toute exploitation.
  // Un lien peut ouvrir directement un onglet.
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
  // Le lait se note pour les chèvres et les brebis, comme la fromagerie ; la viande et l'entretien valent pour tous les animaux.
  const puces = fromagerie ? [PUCE_FROMAGERIE, PUCE_LAIT, ...PUCES_AUTRES] : PUCES_AUTRES;
  /** L'activité choisie à la création d'un article : « toutes les activités » (vide) d'office. */
  const [activiteAjout, setActiviteAjout] = useState('');
  const { onglet: ongletDemande, espece: especeDemandee } = useLocalSearchParams<{
    onglet?: string;
    espece?: string;
  }>();
  const [choisi, setOnglet] = useState<Onglet | undefined>();
  // Un lien (le crayon d'un formulaire) peut ouvrir un onglet et un animal précis, même si le stock était déjà ouvert.
  const demande = `${ongletDemande ?? ''}|${especeDemandee ?? ''}`;
  const [demandeVue, setDemandeVue] = useState('|');
  if (demande !== demandeVue) {
    setDemandeVue(demande);
    if (especeDemandee) setFiltre(especeDemandee as FiltreStock);
    if (ongletDemande) setOnglet(ongletDemande as Onglet);
  }
  const onglet: Onglet = choisi && puces.some((p) => p.valeur === choisi) ? choisi : puces[0].valeur;
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
  /** L'article dont on modifie le nom (le crayon de sa ligne). */
  const [renomme, setRenomme] = useState<ArticleAffiche | null>(null);
  /** Le litrage qu'on modifie (« nouveau » pour en noter un) ; la fenêtre est fermée quand il est absent. */
  const [laitOuvert, setLaitOuvert] = useState<LaitJour | 'nouveau' | null>(null);
  /** Le fromage dont on modifie le conditionnement. */
  const [enEdition, setEnEdition] = useState<string | null>(null);
  /** Les sections de la fromagerie qui sont déroulées : aucune au départ, tout est réduit. */
  const [ouvertes, setOuvertes] = useState<Section[]>([]);
  /** Vrai pendant qu'on fait glisser une ligne : la page ne défile alors pas. */
  const [glisse, setGlisse] = useState(false);
  /** Le menu en haut à droite (burger) et la feuille des statistiques qu'il ouvre. */
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [statistiquesOuvertes, setStatistiquesOuvertes] = useState(false);
  const [historiqueOuvert, setHistoriqueOuvert] = useState(false);

  /** Les litres de lait vendus (les ventes de lait en comptabilité), pour le lait restant. */
  const [litresVendus, setLitresVendus] = useState(0);

  const charger = useCallback(async () => {
    const [stock, ventes] = await Promise.all([lireArchiveStock(), listToutesVentes()]);
    setArchive(stock);
    setLitresVendus(
      ventes
        .filter((v) => v.categorie === CATEGORIE_VENTE.LAIT)
        .reduce((total, v) => total + (v.quantite ?? 0), 0),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const niveaux = niveauxDeStock(archive.mouvements);
  const genreOnglet = GENRE_PAR_ONGLET[onglet];

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
        onPress={() => setArticle(a)}
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
    await ajouterMouvementManuel(cle, delta, todayISO(), litres);
    setArticle(null);
    charger();
  };

  const retirer = async () => {
    if (article?.id) await supprimerArticle(article.id);
    setArticle(null);
    charger();
  };

  const ouvrirAjout = (genre: GenreArticle) => {
    setActiviteAjout('');
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

  /** Ce que le bouton « + » propose : les trois genres de la fromagerie, ou celui de l'onglet (aliments, entretien). */
  const optionsAjout =
    onglet === ONGLET_STOCK.LAIT
      ? [{ label: T.laitJour.ajouter, icon: 'add-circle' as const, onPress: () => setLaitOuvert('nouveau') }]
      : genreOnglet
        ? [
            {
              label: TEXTES_AJOUT[genreOnglet].titre,
              icon: 'add-circle' as const,
              onPress: () => ouvrirAjout(genreOnglet),
            },
          ]
        : SECTIONS.flatMap(({ genre }) =>
            genre
              ? [
                  {
                    label: TEXTES_AJOUT[genre].titre,
                    icon: 'add-circle' as const,
                    onPress: () => ouvrirAjout(genre),
                  },
                ]
              : [],
          );

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={commonStyles.listFab} scrollEnabled={!glisse}>
        {especes.length > 1 ? (
          <PucesDefilantes<FiltreStock>
            puces={[
              { valeur: FILTRE_STOCK_TOUT, label: TEXTES.comptabilite.parActivite.toutes },
              ...especes.map((e) => ({ valeur: e as FiltreStock, label: LABEL_ACTIVITE_COMPTABLE[e] })),
            ]}
            valeur={filtreCourant}
            onChoisir={setFiltre}
          />
        ) : null}

        {puces.length > 1 ? (
          <PucesDefilantes<Onglet> puces={puces} valeur={onglet} onChoisir={setOnglet} />
        ) : null}

        {onglet === ONGLET_STOCK.LAIT ? (
          <JournalLait
            lait={archive.lait}
            bilan={bilanLait(archive, litresVendus)}
            onOuvrir={setLaitOuvert}
          />
        ) : genreOnglet ? (
          liste(genreOnglet)
        ) : (
          SECTIONS.map(({ section, titre, genre }) => (
            <SectionDeroulante
              key={section}
              titre={titre}
              nombre={articlesDuGenre(genre ?? GENRE_ARTICLE.FROMAGE, archive, filtreCourant).length}
              ouverte={ouvertes.includes(section)}
              onBasculer={() => basculerSection(section)}
            >
              {genre ? liste(genre) : conditionnement}
            </SectionDeroulante>
          ))
        )}
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
          ...(fromagerie
            ? [
                {
                  label: T.statistiques.titre,
                  icon: 'stats-chart' as const,
                  onPress: () => setStatistiquesOuvertes(true),
                },
              ]
            : []),
          { label: T.historique.titre, icon: 'time' as const, onPress: () => setHistoriqueOuvert(true) },
        ]}
      />
      <Modal
        visible={historiqueOuvert}
        transparent
        animationType="fade"
        onRequestClose={() => setHistoriqueOuvert(false)}
      >
        <Pressable style={commonStyles.backdrop} onPress={() => setHistoriqueOuvert(false)}>
          <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={commonStyles.subheading}>{T.historique.titre}</Text>
            <ScrollView style={stylesStock.feuilleStatistiques}>
              <HistoriqueStock archive={archive} especes={especes} filtreInitial={filtreCourant} />
            </ScrollView>
            <Button
              variant="secondary"
              label={T.statistiques.fermer}
              onPress={() => setHistoriqueOuvert(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>
      <Modal
        visible={statistiquesOuvertes}
        transparent
        animationType="fade"
        onRequestClose={() => setStatistiquesOuvertes(false)}
      >
        <Pressable style={commonStyles.backdrop} onPress={() => setStatistiquesOuvertes(false)}>
          <Pressable style={commonStyles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={commonStyles.subheading}>{T.statistiques.titre}</Text>
            <ScrollView style={stylesStock.feuilleStatistiques}>
              <LaitParFromage archive={archive} />
            </ScrollView>
            <Button
              variant="secondary"
              label={T.statistiques.fermer}
              onPress={() => setStatistiquesOuvertes(false)}
            />
          </Pressable>
        </Pressable>
      </Modal>

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
        avecLitres={article?.cle.startsWith(`${GENRE_ARTICLE.FROMAGE}:`)}
        libelleLitres={
          article?.cle === cleArticle(GENRE_ARTICLE.FROMAGE, 'brocciu') ? T.modal.litresBrocciu : undefined
        }
        onValider={valider}
        onSupprimer={article?.id ? retirer : undefined}
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
        onAnnuler={() => setRenomme(null)}
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
