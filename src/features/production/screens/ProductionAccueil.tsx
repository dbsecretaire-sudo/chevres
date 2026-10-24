import { useCallback, useState } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { PastilleAlerte } from '@/shared/components/PastilleAlerte';
import { lireArchiveStock } from '@/features/stock/repository';
import { articlesDuProduit, estArticleAvecLots } from '@/features/stock/services/lots';
import {
  articlesDuGenre,
  estLigneDuCheptel,
  niveauxDeStock,
  resynchroniserStockDesVentes,
  type ArticleAffiche,
} from '@/features/stock/services/stock';
import { GENRE_ARTICLE, PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { Screen } from '@/shared/components/Screen';
import { AncreVisite } from '@/shared/components/AncreVisite';
import { BlocLignes } from '@/shared/components/BlocListe';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { ListRow } from '@/shared/components/ListRow';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { laiterieActive, oeufsActifs } from '@/features/comptabilite/utils/recettes';
import { FAMILLE_CONTROLE, VOLET_ANALYSES_PAR_ESPECE } from '@/shared/constants/controles';
import { ESPECES_PETITS_RUMINANTS } from '@/shared/constants/primes';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { ROUTES } from '@/shared/constants/routes';
import { useAccueilEnDeuxColonnes, useLigneActive } from '@/bureau/colonnes';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.production.accueil;
const G = T.groupes;

/**
 * L'onglet Production d'un élevage, à côté du Cheptel : des groupes titrés — le produit (fromages et charcuterie par lot, viande
 * vendue), l'analyse et le contrôle du lait, les produits dangereux (rappels de lots). Le stock y est branché : les lots sont ceux de l'inventaire.
 */
export default function ProductionAccueil() {
  const ouvrir = useOuvrir();
  const { espece } = useEtablissement();
  // Un stock en négatif (plus vendu que fabriqué) : la ligne du produit porte la pastille rouge.
  const [negatifs, setNegatifs] = useState<Record<string, boolean>>({});
  useFocusEffect(
    useCallback(() => {
      resynchroniserStockDesVentes()
        .then(() => lireArchiveStock())
        .then((archive) => {
          const niveaux = niveauxDeStock(archive.mouvements);
          const aUnNegatif = (articles: ArticleAffiche[]) =>
            articles.some((a) => (niveaux.get(a.cle) ?? 0) < 0);
          setNegatifs({
            fromages: aUnNegatif(articlesDuProduit(PRODUIT_A_LOTS.FROMAGE, archive, espece)),
            charcuterie: aUnNegatif(articlesDuProduit(PRODUIT_A_LOTS.CHARCUTERIE, archive, espece)),
            // La viande vendue : les animaux entiers de l'inventaire (les produits de charcuterie ont leur ligne à part).
            viande: aUnNegatif(
              // Le niveau d'un animal suit le cheptel, pas les mouvements : il n'a pas d'alerte de stock négatif.
              articlesDuGenre(GENRE_ARTICLE.VIANDE, archive, espece).filter(
                (a) => !estArticleAvecLots(a.cle) && !estLigneDuCheptel(a.cle),
              ),
            ),
          });
        });
    }, [espece]),
  );
  // Le lait, les fromages et son contrôle ne concernent que les espèces qui ont une laiterie (chèvres, brebis, vaches).
  const laiterie = laiterieActive(espece);
  const estActive = useLigneActive();
  // Deux colonnes : le menu est déjà à gauche, la colonne de droite montre les fromages (ou la viande sans laiterie).
  const redirection = useAccueilEnDeuxColonnes(
    laiterie
      ? ROUTES.PRODUCTION_FROMAGES
      : oeufsActifs(espece)
        ? ROUTES.PRODUCTION_OEUFS
        : ROUTES.PRODUCTION_VIANDE,
  );
  type Ligne = {
    cle: string;
    titre: string;
    aide: string;
    icone: keyof typeof Ionicons.glyphMap;
    route: string;
  };
  /** Le premier groupe : ce qu'on produit et vend (fromages, viande, boucherie / charcuterie). */
  const produits: Ligne[] = [
    ...(oeufsActifs(espece)
      ? [{ cle: 'oeufs', ...T.oeufs, icone: 'egg' as const, route: ROUTES.PRODUCTION_OEUFS }]
      : []),
    ...(laiterie
      ? [{ cle: 'fromages', ...T.fromages, icone: 'restaurant' as const, route: ROUTES.PRODUCTION_FROMAGES }]
      : []),
    { cle: 'viande', ...T.viande, icone: 'restaurant', route: ROUTES.PRODUCTION_VIANDE },
    { cle: 'charcuterie', ...T.charcuterie, icone: 'cut', route: ROUTES.PRODUCTION_CHARCUTERIE },
  ];
  /** L'analyse et le contrôle du lait (une laiterie seulement) et les rappels de lots : un groupe titré chacun. */
  const laitier: Ligne[] = laiterie
    ? [
        {
          cle: 'laitier',
          ...T.laitier,
          icone: 'flask' as const,
          route: ROUTES.santeControles(FAMILLE_CONTROLE.LAITIER),
        },
        // Le lait par chèvre (ou brebis) et par traite : une page à part du contrôle laitier, pour les petits ruminants.
        ...(ESPECES_PETITS_RUMINANTS.includes(espece)
          ? [
              {
                cle: 'productionLait',
                ...T.productionLait,
                icone: 'water' as const,
                route: ROUTES.PRODUCTION_LAIT,
              },
            ]
          : []),
      ]
    : [];
  /** Les analyses des autres espèces : l'abattoir et les autocontrôles (cochons, vaches), la salmonelle des fientes (poules). */
  const voletAnalyses = VOLET_ANALYSES_PAR_ESPECE[espece];
  const analyses: Ligne[] = voletAnalyses
    ? [
        voletAnalyses === FAMILLE_CONTROLE.OFFICIEL
          ? {
              cle: 'officiel',
              ...T.officiel,
              icone: 'shield-checkmark' as const,
              route: ROUTES.santeControles(voletAnalyses),
            }
          : {
              cle: 'salmonelle',
              ...T.salmonelle,
              icone: 'flask' as const,
              route: ROUTES.santeControles(voletAnalyses),
            },
      ]
    : [];
  const dangereux: Ligne[] = [
    { cle: 'rappels', ...T.rappels, icone: 'notifications', route: ROUTES.PRODUCTION_RAPPELS_LOTS },
  ];
  const groupes = [
    { titre: G.produit, lignes: produits },
    { titre: G.laitier, lignes: laitier },
    { titre: G.analyses, lignes: analyses },
    { titre: G.dangereux, lignes: dangereux },
  ].filter((g) => g.lignes.length > 0);
  if (redirection) return redirection;
  return (
    <Screen>
      <SelecteurEspece />
      {groupes.map((groupe) => (
        <GroupeAccueil key={groupe.titre} titre={groupe.titre}>
          <BlocLignes>
            {groupe.lignes.map((l) => (
              <AncreVisite key={l.cle} id={`rubrique:${l.route}`}>
                <ListRow
                  title={l.titre}
                  subtitle={l.aide}
                  icone={l.icone}
                  actif={estActive(l.route)}
                  trailing={
                    negatifs[l.cle] ? (
                      <View style={commonStyles.row}>
                        <PastilleAlerte />
                        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                      </View>
                    ) : undefined
                  }
                  onPress={() => ouvrir(l.route)}
                />
              </AncreVisite>
            ))}
          </BlocLignes>
        </GroupeAccueil>
      ))}
    </Screen>
  );
}
