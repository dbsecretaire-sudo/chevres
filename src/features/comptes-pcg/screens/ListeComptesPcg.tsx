import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import {
  Stack,
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
  type Href,
} from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { Screen } from '@/shared/components/ScreenList';
import { ListRow } from '@/shared/components/ListRow';
import { EmptyState } from '@/shared/components/EmptyState';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { Fab } from '@/shared/components/Fab';
import { TableauDeDonnees, type ColonneDuTableau } from '@/shared/components/TableauDeDonnees';
import { useDispositionComptable } from '@/shared/hooks/useDispositionComptable';
import { quitterRetour, useRetourContexte } from '@/shared/navigation/contexteRetour';
import { FiltresExclusifs } from '@/shared/components/FiltresExclusifs';
import { lireArchiveStock } from '@/features/stock/repository';
import { ChoixEspeceStock } from '@/features/stock/components/ChoixEspeceStock';
import { useFiltreEspeceStock } from '@/features/stock/hooks/useFiltreEspeceStock';
import { listeValablePour } from '@/features/stock/utils/listesEspece';
import { comptesDeLInventaire } from '@/features/stock/services/stock';
import { compteAutorise } from '@/features/stock/services/structure';
import type { ArchiveStock } from '@/features/stock/types';
import { infosCategorie } from '@/features/stock/utils/categories';
import {
  compteProposePour,
  listComptesPcg,
  type CompteComptableEnregistre,
} from '@/features/comptes-pcg/repository';
import { FILTRE_STOCK_TOUT } from '@/shared/constants/stock';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

export default function ComptesPcgIndex() {
  const router = useRouter();
  const navigation = useNavigation();
  const { retour, categorie } = useLocalSearchParams<{ retour?: string; categorie?: string }>();
  /** Ouverts depuis une page d'Organisation : la flèche y ramène (sinon, depuis l'écran dont on vient : `retour`). */
  const retourContexte = useRetourContexte();
  const cible = retour ?? retourContexte;
  const [comptes, setComptes] = useState<CompteComptableEnregistre[]>([]);
  const [recherche, setRecherche] = useState('');
  /** Les comptes qui ont une liste dans l'inventaire (« Inventaire »), les autres sont « Service » ; un seul filtre à la fois. */
  const [comptesInventaire, setComptesInventaire] = useState<string[]>([]);
  const [suivi, setSuivi] = useState<string | null>(TEXTES.comptesPcg.nouveauComptePcg.suivi.service);
  // Les comptes se voient pour une espèce, comme l'inventaire : pas de compte du lait ni du fromage pour des cochons.
  const { especes, filtreCourant, choisirFiltre, concernees } = useFiltreEspeceStock();
  /** Les catégories de l'inventaire et ce qu'on y a personnalisé : pour trier les comptes selon une catégorie. */
  const [archive, setArchive] = useState<ArchiveStock | null>(null);

  const charger = useCallback(async () => {
    setComptes(await listComptesPcg());
    const stock = await lireArchiveStock();
    setArchive(stock);
    setComptesInventaire(comptesDeLInventaire(stock));
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
      // La flèche de retour vers l'écran d'où l'on vient ne vaut que pour cette visite.
      return () => navigation.setParams({ retour: undefined, categorie: undefined } as never);
    }, [charger, navigation]),
  );

  /** Ouvert depuis « Ajouter une liste » d'une catégorie : seuls les comptes qu'elle autorise sont montrés. */
  const regles =
    categorie && archive ? infosCategorie(categorie, archive.categories, archive.reglagesCategories) : null;

  const filtres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    const duCategorie = regles
      ? comptes.filter((c) =>
          compteAutorise(regles.categorie, c.numero, archive?.categories, archive?.reglagesCategories),
        )
      : comptes;
    const deLEspece = duCategorie.filter(
      (c) => listeValablePour(c.numero, concernees) && compteProposePour(c, concernees),
    );
    const duSuivi = suivi
      ? deLEspece.filter(
          (c) =>
            comptesInventaire.includes(c.numero) ===
            (suivi === TEXTES.comptesPcg.nouveauComptePcg.suivi.inventaire),
        )
      : deLEspece;
    if (!q) return duSuivi;
    return duSuivi.filter((c) => [c.numero, c.libelle].some((v) => v?.toLowerCase().includes(q)));
  }, [comptes, comptesInventaire, recherche, suivi, regles, archive, concernees]);

  const comptable = useDispositionComptable();
  /** Les colonnes du tableau : le numéro, le libellé, et si le compte a une liste dans l'inventaire ou sert aux écritures seules (« Service »). */
  const colonnesDuTableau: readonly ColonneDuTableau<CompteComptableEnregistre>[] = [
    { cle: 'numero', titre: 'N°', poids: 1, valeur: (c) => c.numero },
    { cle: 'libelle', titre: 'Libellé', poids: 5, valeur: (c) => c.libelle ?? '' },
    {
      cle: 'suivi',
      titre: 'Suivi',
      poids: 1.2,
      valeur: (c) =>
        comptesInventaire.includes(c.numero) ? TEXTES.comptesPcg.nouveauComptePcg.suivi.inventaire : TEXTES.comptesPcg.nouveauComptePcg.suivi.service,
    },
  ];

  return (
    <Screen scroll={false}>
      {/* Ouvert depuis un autre écran (la structure de l'inventaire…) : la flèche y ramène. */}
      <Stack.Screen
        options={{
          headerLeft: cible
            ? () => (
                <Pressable
                  style={commonStyles.boutonCompact}
                  onPress={() => {
                    if (!retour) quitterRetour();
                    router.navigate(cible as Href);
                  }}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.blanc} />
                </Pressable>
              )
            : undefined,
        }}
      />
      <View style={commonStyles.topPadded}>
        <ChampRecherche
          value={recherche}
          onChangeText={setRecherche}
          placeholder={TEXTES.comptesPcg.listeComptesPcg.nOuLibellePoints}
        />
        {regles ? (
          <View style={commonStyles.gap2}>
            <Text style={commonStyles.cardTitle}>
              {TEXTES.stock.enteteCategorie(regles.classe, regles.nom)}
            </Text>
            <Text style={commonStyles.note}>
              {TEXTES.stock.structure.comptesAutorises(regles.prefixes.join(', '))}
            </Text>
          </View>
        ) : (
          <>
            <ChoixEspeceStock especes={especes} valeur={filtreCourant} onChoisir={choisirFiltre} />
            <FiltresExclusifs
              choix={[
                TEXTES.comptesPcg.nouveauComptePcg.suivi.inventaire,
                TEXTES.comptesPcg.nouveauComptePcg.suivi.service,
              ]}
              valeur={suivi}
              onChoisir={setSuivi}
            />
          </>
        )}
      </View>

      {/* Un doute sur le compte à utiliser : le plan comptable général complet, à consulter. */}
      {regles ? null : (
        <Pressable
          style={commonStyles.topPadded}
          onPress={() => router.push(ROUTES.PLAN_COMPTABLE as never)}
          accessibilityRole="link"
        >
          <Text style={commonStyles.lien}>{TEXTES.comptesPcg.planGeneral.lien}</Text>
        </Pressable>
      )}
      {comptable ? (
        // Le poste de comptabilité : un tableau (numéro, libellé, suivi), un clic ouvre le compte ; « Nouveau compte » est dessous.
        <TableauDeDonnees
          colonnes={colonnesDuTableau}
          lignes={filtres}
          cleDeLaLigne={(c) => c.id}
          tri={{ cle: 'numero' }}
          vide={TEXTES.comptesPcg.listeComptesPcg.aucunCompte}
          onLigne={(c) =>
            router.push(ROUTES.ficheComptePcg(c.id, especes.length > 1 && filtreCourant !== FILTRE_STOCK_TOUT ? filtreCourant : undefined))
          }
        />
      ) : (
      <FlatList
        data={filtres}
        keyExtractor={(item) => item.id}
        contentContainerStyle={commonStyles.listFab}
        ListEmptyComponent={
          <EmptyState
            title={TEXTES.comptesPcg.listeComptesPcg.aucunCompte}
            subtitle={TEXTES.comptesPcg.listeComptesPcg.ajoutezDesComptesPcgPour}
          />
        }
        renderItem={({ item }) => (
          <ListRow
            title={item.numero}
            subtitle={item.libelle}
            onPress={() =>
              router.push(
                ROUTES.ficheComptePcg(
                  item.id,
                  especes.length > 1 && filtreCourant !== FILTRE_STOCK_TOUT ? filtreCourant : undefined,
                ),
              )
            }
          />
        )}
      />
      )}

      <Fab
        options={[
          {
            label: TEXTES.commun.general.nouveauCompte,
            icon: 'add',
            onPress: () => router.push(ROUTES.COMPTE_PCG_NOUVEAU),
          },
        ]}
      />
    </Screen>
  );
}
