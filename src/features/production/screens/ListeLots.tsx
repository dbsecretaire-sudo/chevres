import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { SuggestionParcours } from '@/features/didacticiel/components/SuggestionParcours';
import { Screen } from '@/shared/components/ScreenList';
import { CadreDeJeu } from '@/features/stock/components/CadreDeJeu';
import { CarteDeStock, grilleDeCartes } from '@/features/stock/components/CartesDuStock';
import { BoutonPlat } from '@/shared/components/BoutonPlat';
import { TableauDeDonnees } from '@/shared/components/TableauDeDonnees';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { ModaleImageArticle } from '@/features/stock/components/ModaleImageArticle';
import { piecesDisponibles } from '@/features/fichiers/services/pieces';
import { emojiDeLArticle } from '@/features/stock/services/entrepotJeu';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { YearPicker } from '@/shared/components/YearPicker';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { toutesLesAnneesConnues } from '@/shared/storage/annees';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { DetailLotsModal } from '@/features/stock/components/DetailLotsModal';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit, lotsDeLInventaire } from '@/features/stock/services/lots';
import { ajouterArticle, niveauxDeStock, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock, GenreArticle } from '@/features/stock/types';
import { ETAT_LOT, GENRE_ARTICLE, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { ROUTES } from '@/shared/constants/routes';
import { CATEGORIE_RECETTE, TYPE_FACTURE } from '@/shared/constants/comptabilite';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

/**
 * Les fromages (un par type) ou la charcuterie (une ligne de l'inventaire par produit) de l'animal actif : son stock et ses lots.
 * Un appui ouvre le détail des lots (fabrication, vente, rappel, contrôle) ; le bouton + fabrique des produits numérotés ou en
 * rappelle.
 */
export function ListeLots({ produit }: { produit: ValeurDe<typeof PRODUIT_A_LOTS> }) {
  const fromage = produit === PRODUIT_A_LOTS.FROMAGE;
  const plat = produit === PRODUIT_A_LOTS.PLAT;
  const savon = produit === PRODUIT_A_LOTS.SAVON;
  const T = fromage
    ? TEXTES.production.fromages
    : plat
      ? TEXTES.production.plats
      : savon
        ? TEXTES.production.savons
        : TEXTES.production.charcuterie;
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [ouvert, setOuvert] = useState<ArticleAffiche | null>(null);
  const [visible, setVisible] = useState(false);
  /** L'article dont on change l'image (le crayon de sa carte). */
  const [imageDe, setImageDe] = useState<{ cle: string; titre: string; emoji: string } | null>(null);
  /** La fenêtre qui demande le nom d'un nouveau produit (il entre à l'inventaire, sans stock : la fabrication le remplit). */
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  /** L'année des lots (leur fabrication) et du stock (à la fin de l'année), ou toutes les années regroupées. */
  const { settings, setAnneeActive, choisirToutesAnnees, patchSettings } = useAppSettings();
  /** Les plats et les savons : la fenêtre de l'intervalle entre deux analyses (un échantillon part à un laboratoire, voir rappelsAnalysesPlats). */
  const [analyseOuverte, setAnalyseOuverte] = useState(false);
  const jourAnalyse = savon
    ? settings.exploitation?.joursEntreAnalysesSavons
    : settings.exploitation?.joursEntreAnalysesPlats;
  const regrouper = !!settings.toutesAnnees;
  const [annees, setAnnees] = useState<number[]>([]);

  const charger = useCallback(async () => {
    setAnnees(await toutesLesAnneesConnues());
    setArchive(await lireArchiveStock());
  }, []);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const articles = archive ? articlesDuProduit(produit, archive, espece) : [];
  const annee = String(settings.anneeActive);
  // Le poste de comptabilité : les variétés en tableau.
  const comptable = useDispositionComptable();
  // Une année : ses lots fabriqués, et le stock tel qu'il est à la fin de cette année.
  const mouvements = (archive?.mouvements ?? []).filter((m) => regrouper || m.date.slice(0, 4) <= annee);
  const niveaux = archive ? niveauxDeStock(mouvements) : new Map<string, number>();
  const lots = (archive?.lots ?? []).filter((l) => regrouper || l.dateFabrication.startsWith(annee));
  const enStock = (cle: string) => lotsDeLInventaire({ lots }, ETAT_LOT.EN_STOCK, cle).length;

  return (
    <CadreDeJeu>
      <Screen scroll={false} transparent>
        <Stack.Screen
          options={{
            // Ajouter une variété (un produit), à côté des statistiques de lait pour les fromages.
            headerRight: () => (
              <View style={commonStyles.row}>
                {fromage ? (
                  <Pressable
                    style={commonStyles.boutonEnteteDroite}
                    onPress={() => router.push(ROUTES.PRODUCTION_STATISTIQUES)}
                    hitSlop={10}
                    accessibilityLabel={TEXTES.production.fromages.statistiques}
                  >
                    <Ionicons name="stats-chart" size={24} color={colors.blanc} />
                  </Pressable>
                ) : null}
                {savon ? (
                  <Pressable
                    style={commonStyles.boutonEnteteDroite}
                    onPress={() => router.push(ROUTES.productionSavonDossier('') as never)}
                    hitSlop={10}
                    accessibilityLabel={TEXTES.production.savons.dossierBouton}
                  >
                    <Ionicons name="clipboard-outline" size={24} color={colors.blanc} />
                  </Pressable>
                ) : null}
                {plat || savon ? (
                  <Pressable
                    style={commonStyles.boutonEnteteDroite}
                    onPress={() => setAnalyseOuverte(true)}
                    hitSlop={10}
                    accessibilityLabel={savon ? TEXTES.rappels.analysesPlats.reglerSavons : TEXTES.rappels.analysesPlats.regler}
                  >
                    <Ionicons name="flask-outline" size={24} color={colors.blanc} />
                  </Pressable>
                ) : null}
                <Pressable
                  style={commonStyles.boutonEnteteDroite}
                  onPress={() => setAjoutOuvert(true)}
                  hitSlop={10}
                  accessibilityLabel={T.ajouter.titre}
                >
                  <Ionicons name="add-circle-outline" size={26} color={colors.blanc} />
                </Pressable>
              </View>
            ),
          }}
        />
        <ScrollView contentContainerStyle={commonStyles.listFab}>
          <LigneFiltres>
            <YearPicker
              annees={annees}
              value={settings.anneeActive}
              onChange={setAnneeActive}
              tout={regrouper}
              onChoisirTout={choisirToutesAnnees}
            />
            <SelecteurEspece />
          </LigneFiltres>
          {plat || savon ? null : <SuggestionParcours parcoursId={fromage ? 'vente-fromage' : 'vente-charcuterie'} />}
          {articles.length === 0 ? (
            <EmptyState title={T.aucun} />
          ) : (
            comptable ? (
              // Le poste de comptabilité : un tableau (variété, en stock, lots) ; un clic ouvre le détail des lots.
              <TableauDeDonnees
                integre
                colonnes={[
                  { cle: 'variete', titre: 'Variété', poids: 3, valeur: (a) => a.libelle },
                  { cle: 'stock', titre: 'En stock', poids: 1, aligne: 'droite', valeur: (a) => niveaux.get(a.cle) ?? 0 },
                  {
                    cle: 'lots',
                    titre: 'Lots',
                    poids: 2,
                    valeur: (a) => enStock(a.cle),
                    texte: (a) => TEXTES.production.fromages.ligne(enStock(a.cle), lotsDeLInventaire({ lots }, ETAT_LOT.TOUT, a.cle).length),
                  },
                  {
                    cle: 'modifier',
                    titre: '',
                    poids: 1,
                    aligne: 'droite',
                    triable: false,
                    valeur: () => '',
                    rendu: (a) =>
                      piecesDisponibles() ? (
                        <BoutonPlat
                          libelle={TEXTES.stock.articleModal.image.modifier}
                          onPress={() =>
                            setImageDe({ cle: a.cle, titre: a.libelle, emoji: emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle) })
                          }
                        />
                      ) : null,
                  },
                ]}
                lignes={articles}
                cleDeLaLigne={(a) => a.cle}
                vide={T.aucun}
                onLigne={(a) => {
                  setOuvert(a);
                  setVisible(true);
                }}
              />
            ) : (
            // Les cartes du stock, comme à la grange : le dessin, le nom, ses lots en petit et la pastille de ce qu'il en reste ; un appui ouvre le détail des lots.
            <View style={grilleDeCartes}>
              {articles.map((a, i) => {
                const total = lotsDeLInventaire({ lots }, ETAT_LOT.TOUT, a.cle).length;
                const niveau = niveaux.get(a.cle) ?? 0;
                return (
                  <CarteDeStock
                    key={a.cle}
                    cle={a.cle}
                    libelleDuCrayon={TEXTES.stock.articleModal.image.modifier}
                    onRenommer={
                      piecesDisponibles()
                        ? () =>
                            setImageDe({
                              cle: a.cle,
                              titre: a.libelle,
                              emoji: emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle),
                            })
                        : undefined
                    }
                    rang={i}
                    emoji={emojiDeLArticle(a.cle.split(':')[0] as GenreArticle, a.libelle)}
                    titre={a.libelle}
                    sous={TEXTES.production.fromages.ligne(enStock(a.cle), total)}
                    quantite={String(niveau)}
                    niveau={niveau}
                    onPress={() => {
                      setOuvert(a);
                      setVisible(true);
                    }}
                  />
                );
              })}
            </View>
            )
          )}
        </ScrollView>
        <ModaleImageArticle article={imageDe} onFermer={() => setImageDe(null)} />
        <Fab
          options={[
            {
              label: T.fabriquer,
              icon: 'add-circle',
              onPress: () => router.push(ROUTES.productionFabrication(produit)),
            },
            // Facturer : la vente s'enregistre comme toute recette, ouverte sur les fromages (ou la boucherie / charcuterie), où l'on choisit les lots.
            {
              label: T.facturer,
              icon: 'document-text',
              onPress: () =>
                router.push({
                  pathname: ROUTES.COMPTABILITE_NOUVELLE,
                  params: {
                    type: TYPE_FACTURE.EMISE,
                    categorie: fromage
                      ? CATEGORIE_RECETTE.FROMAGE
                      : savon
                        ? CATEGORIE_RECETTE.SAVONS
                        : CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE,
                  },
                }),
            },
          ]}
        />
        <NomModal
          visible={ajoutOuvert}
          titre={T.ajouter.titre}
          placeholder={T.ajouter.exemple}
          onValider={async (nom) => {
            await ajouterArticle(
              fromage
                ? GENRE_ARTICLE.FROMAGE
                : plat
                  ? GENRE_ARTICLE.PLAT
                  : savon
                    ? GENRE_ARTICLE.SAVON
                    : GENRE_ARTICLE.VIANDE,
              nom,
              espece,
            );
            setAjoutOuvert(false);
            charger();
          }}
          onAnnuler={() => setAjoutOuvert(false)}
        />
        <NomModal
          visible={analyseOuverte}
          titre={savon ? TEXTES.rappels.analysesPlats.reglerSavons : TEXTES.rappels.analysesPlats.regler}
          valeurInitiale={jourAnalyse ? String(jourAnalyse) : ''}
          placeholder={TEXTES.rappels.analysesPlats.placeholder}
          enfants={
            <Text style={commonStyles.note}>
              {savon ? TEXTES.rappels.analysesPlats.reglerSavonsAide : TEXTES.rappels.analysesPlats.reglerAide}
            </Text>
          }
          onValider={async (texte) => {
            const jours = Number(texte.trim());
            // Vide : plus de rappel d'analyse ; sinon un nombre de jours entier.
            if (texte.trim() && !(Number.isInteger(jours) && jours > 0)) return Alert.alert(TEXTES.rappels.analysesPlats.invalide);
            await patchSettings({
              exploitation: {
                ...settings.exploitation,
                ...(savon
                  ? { joursEntreAnalysesSavons: jours > 0 ? jours : undefined }
                  : { joursEntreAnalysesPlats: jours > 0 ? jours : undefined }),
              },
            });
            setAnalyseOuverte(false);
          }}
          onAnnuler={() => setAnalyseOuverte(false)}
        />
        <DetailLotsModal
          visible={visible}
          article={ouvert}
          lots={lots}
          sansLot={ouvert ? Math.max(0, (niveaux.get(ouvert.cle) ?? 0) - enStock(ouvert.cle)) : 0}
          onChange={charger}
          // Dans Production, les lots s'ouvrent sur ceux qui sont en stock (l'inventaire, lui, montre tout).
          etatInitial={ETAT_LOT.EN_STOCK}
          archive={archive}
          onFermer={() => setVisible(false)}
        />
      </Screen>
    </CadreDeJeu>
  );
}
