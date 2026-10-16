import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Screen } from '@/shared/components/ScreenList';
import { BlocLignes } from '@/shared/components/BlocListe';
import { EmptyState } from '@/shared/components/EmptyState';
import { Fab } from '@/shared/components/Fab';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { ListRow } from '@/shared/components/ListRow';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { DetailLotsModal } from '@/features/stock/components/DetailLotsModal';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit, lotsDeLInventaire } from '@/features/stock/services/lots';
import { ajouterArticle, niveauxDeStock, type ArticleAffiche } from '@/features/stock/services/stock';
import type { ArchiveStock } from '@/features/stock/types';
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
  const T = fromage ? TEXTES.production.fromages : TEXTES.production.charcuterie;
  const router = useRouter();
  const { espece } = useEtablissement();
  const [archive, setArchive] = useState<ArchiveStock | null>(null);
  const [ouvert, setOuvert] = useState<ArticleAffiche | null>(null);
  const [visible, setVisible] = useState(false);
  /** La fenêtre qui demande le nom d'un nouveau produit (il entre à l'inventaire, sans stock : la fabrication le remplit). */
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  const charger = useCallback(() => lireArchiveStock().then(setArchive), []);
  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger]),
  );

  const articles = archive ? articlesDuProduit(produit, archive, espece) : [];
  const niveaux = archive ? niveauxDeStock(archive.mouvements) : new Map<string, number>();
  const lots = archive?.lots ?? [];
  const enStock = (cle: string) => lotsDeLInventaire({ lots }, ETAT_LOT.EN_STOCK, cle).length;

  return (
    <Screen scroll={false}>
      <Stack.Screen
        options={{
          // Les réglages de la liste : ajouter une variété (un produit), à côté des statistiques de lait pour les fromages.
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
              <Pressable
                style={commonStyles.boutonEnteteDroite}
                onPress={() => setAjoutOuvert(true)}
                hitSlop={10}
                accessibilityLabel={T.ajouter.titre}
              >
                <Ionicons name="settings" size={24} color={colors.blanc} />
              </Pressable>
            </View>
          ),
        }}
      />
      <ScrollView contentContainerStyle={commonStyles.listFab}>
        <SelecteurEspece />
        {articles.length === 0 ? (
          <EmptyState title={T.aucun} />
        ) : (
          <BlocLignes>
            {articles.map((a) => {
              const total = lotsDeLInventaire({ lots }, ETAT_LOT.TOUT, a.cle).length;
              return (
                <ListRow
                  key={a.cle}
                  title={a.libelle}
                  subtitle={TEXTES.production.fromages.ligne(enStock(a.cle), total)}
                  trailing={
                    <View style={commonStyles.row}>
                      {/* Un stock en négatif (plus vendu que fabriqué) : toujours la pastille rouge. */}
                      {(niveaux.get(a.cle) ?? 0) < 0 ? <PastilleAlerte /> : null}
                      <Text style={commonStyles.lineBold}>{niveaux.get(a.cle) ?? 0}</Text>
                      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                    </View>
                  }
                  onPress={() => {
                    setOuvert(a);
                    setVisible(true);
                  }}
                />
              );
            })}
          </BlocLignes>
        )}
      </ScrollView>
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
                  categorie: fromage ? CATEGORIE_RECETTE.FROMAGE : CATEGORIE_RECETTE.BOUCHERIE_CHARCUTERIE,
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
          await ajouterArticle(fromage ? GENRE_ARTICLE.FROMAGE : GENRE_ARTICLE.VIANDE, nom, espece);
          setAjoutOuvert(false);
          charger();
        }}
        onAnnuler={() => setAjoutOuvert(false)}
      />
      <DetailLotsModal
        visible={visible}
        article={ouvert}
        lots={lots}
        sansLot={ouvert ? Math.max(0, (niveaux.get(ouvert.cle) ?? 0) - enStock(ouvert.cle)) : 0}
        onChange={charger}
        onFermer={() => setVisible(false)}
      />
    </Screen>
  );
}
