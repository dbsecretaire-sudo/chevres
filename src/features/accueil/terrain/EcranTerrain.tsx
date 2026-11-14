import { useState, type ReactNode } from 'react';
import { Alert, Modal, ScrollView, Text, TextInput, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScannerBoucleModal } from '@/features/cheptel/components/ScannerBoucleModal';
import { listTousLesAnimauxDeLEspece } from '@/features/cheptel/repository/chevres';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { ROUTES } from '@/shared/constants/routes';
import { useFermeAccueil } from '@/features/accueil/ferme/useFermeAccueil';
import {
  tuilesDuTerrain,
  titreDuTerrain,
  ZONES_TERRAIN,
  type ComptesTerrain,
  type TuileTerrain,
  type ZoneTerrain,
} from '@/features/accueil/terrain/ecransTerrain';
import { GrilleDeTuiles } from '@/features/accueil/terrain/GrilleDeTuiles';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { MenusRepliables } from '@/features/accueil/components/MenusRepliables';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { useOuvrir } from '@/shared/navigation/useOuvrir';
import { styles } from '@/shared/styles/accueil/EcranTerrain.styles';
import { AccentColorProvider } from '@/shared/theme/AccentColorContext';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/** La tuile remplie en vert sur chaque zone, comme sur la maquette : Scanner une chèvre, Scanner un lot, Nouvelle visite. */
const TUILE_PRINCIPALE: Partial<Record<ZoneTerrain, string>> = {
  troupeau: 'scanner',
  atelier: 'scanLot',
  accueil: 'nouvelleVisite',
};

/** Les tuiles mises en tête de chaque zone, dans cet ordre ; les autres suivent. Toutes les tuiles de la zone sont toujours affichées. */
const TUILES_EN_TETE: Partial<Record<ZoneTerrain, string[]>> = {
  troupeau: ['cheptel', 'scanner', 'naissance', 'traitement', 'mouvement', 'deces'],
  atelier: ['fabriquer', 'scanLot', 'ventes', 'lait', 'stock', 'recettes'],
};

/**
 * Les grandes tuiles d'une zone, avec le chiffre utile de chacune. Sert à l'écran terrain (une page ouverte d'un appui sur la zone) et, sur le téléphone,
 * à l'accueil des onglets Chèvres et Atelier, comme sur la maquette.
 */
export function GrilleTerrain({ zone, enTete, remplir = false }: { zone: ZoneTerrain; enTete?: ReactNode; remplir?: boolean }) {
  // La place que la grille peut prendre, mesurée à l'écran (pour que les tuiles s'y ajustent).
  const [hauteur, setHauteur] = useState(0);
  const ouvrir = useOuvrir();
  const router = useRouter();
  // « Scanner une chèvre » lit la boucle avec la caméra, puis ouvre la fiche de l'animal vivant qui la porte (et non la liste du cheptel).
  const [scanOuvert, setScanOuvert] = useState(false);
  // « Écrire le numéro de boucle » : la photo se ferme, et on tape le numéro (il ouvre la même fiche que le scan).
  const [saisieOuverte, setSaisieOuverte] = useState(false);
  const [numeroSaisi, setNumeroSaisi] = useState('');
  const surTuile =(t: TuileTerrain) => (t.cle === 'scanner' ? setScanOuvert(true) : ouvrir(t.route));
  const trouverLaChevre = async (numero: string) => {
    const animaux = await listTousLesAnimauxDeLEspece();
    const animal = animaux.find((a) => (a.numeroBoucle ?? '').trim() === numero.trim() && a.statut === STATUT_CHEVRE.VIVANTE);
    if (!animal) {
      Alert.alert('Chèvre introuvable', 'Aucune chèvre vivante ne porte ce numéro.');
      return;
    }
    router.push(ROUTES.ficheChevre(animal.id) as never);
  };
  const f = useFermeAccueil();
  const comptes: ComptesTerrain = {
    animaux: f.stats?.totalVivantes,
    naissances: f.stats?.cabritsAnnee,
    delais: f.delais,
    grammesParAnimalParJour: f.stats?.gParAnimalParJour,
    ventesSansDocument: f.ventesSansDocument,
    lotsAFacturer: f.lotsAFacturer,
    viandeAFacturer: f.transformation.viande,
    viandeAVendre: f.viandeAVendre,
    lotsARappeler: f.lotsARappeler,
    stockNegatif: f.stockNegatif,
    visitesAVenir: f.agritourisme.aVenir,
  };
  const toutes = tuilesDuTerrain(zone, comptes);
  // « Fabriquer » : les quatre produits en grandes tuiles à pastille, pour que la page ne paraisse pas vide.
  const grandes = zone === 'fabriquer';
  const ordre = TUILES_EN_TETE[zone];
  const tuiles = ordre
    ? [
        ...ordre.map((cle) => toutes.find((t) => t.cle === cle)).filter((t): t is TuileTerrain => t !== undefined),
        ...toutes.filter((t) => !ordre.includes(t.cle)),
      ]
    : toutes;
  // Les lignes (réglages, rubriques du « Plus ») se rangent sous les grandes tuiles, en liste titrée « Gestion ».
  const grandesTuiles = tuiles.filter((t) => !t.ligne);
  // Un menu titré par groupe (« Gestion » par défaut), dans l'ordre où les groupes apparaissent.
  const lignesDeMenu = tuiles.filter((t) => t.ligne);
  const titresDesMenus = [...new Set(lignesDeMenu.map((t) => t.groupe ?? 'Gestion'))];
  // Les menus se replient : un seul groupe déplié à la fois.
  const gestion = (
    <MenusRepliables>
      {titresDesMenus.map((titre) => (
        <GroupeAccueil key={titre} titre={titre}>
          <BlocLignes>
            {lignesDeMenu
              .filter((t) => (t.groupe ?? 'Gestion') === titre)
              .map((t) => (
                <ListRow key={t.cle} title={t.titre} icone={t.icone} onPress={() => surTuile(t)} />
              ))}
          </BlocLignes>
        </GroupeAccueil>
      ))}
    </MenusRepliables>
  );
  return (
    <AccentColorProvider color={colors.primary} softColor={colors.badgeBg}>
      {/* Ce qui demande une action (alertes de santé, rappels) passe au-dessus des tuiles. Avec « remplir », les tuiles prennent la place restante, sans défiler. */}
      {remplir ? (
        <View style={[commonStyles.screenBg, styles.contenu, { flex: 1 }]}>
          {enTete}
          {/* La grille prend la place restante, et défile si les tuiles n'y tiennent pas : aucune tuile n'est cachée sous la barre du bas. */}
          <View style={{ flex: 1 }} onLayout={(e) => setHauteur(e.nativeEvent.layout.height)}>
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              <GrilleDeTuiles
                tuiles={grandesTuiles}
                principale={TUILE_PRINCIPALE[zone]}
                onAppui={surTuile}
                hauteurDispo={hauteur}
                variante={grandes ? 'simple' : 'avance'}
                grandes={grandes}
              />
              {gestion}
            </ScrollView>
          </View>
        </View>
      ) : (
        <ScrollView style={commonStyles.screenBg} contentContainerStyle={styles.contenu}>
          {enTete}
          <GrilleDeTuiles
            tuiles={grandesTuiles}
            principale={TUILE_PRINCIPALE[zone]}
            onAppui={surTuile}
            variante={grandes ? 'simple' : 'avance'}
            grandes={grandes}
          />
          {gestion}
        </ScrollView>
      )}
      <ScannerBoucleModal
        visible={scanOuvert}
        onClose={() => setScanOuvert(false)}
        onDetected={(numero) => {
          void trouverLaChevre(numero);
        }}
        onEcrire={() => {
          setScanOuvert(false);
          setSaisieOuverte(true);
        }}
      />
      <Modal visible={saisieOuverte} transparent animationType="fade" onRequestClose={() => setSaisieOuverte(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: colors.surface, borderRadius: 16, padding: 16, gap: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>Numéro de boucle</Text>
            <TextInput
              value={numeroSaisi}
              onChangeText={setNumeroSaisi}
              keyboardType="number-pad"
              autoFocus
              placeholder="Numéro de boucle"
              style={{ backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 12, fontSize: 18, color: colors.text }}
            />
            <Button
              label="Ouvrir la fiche"
              disabled={numeroSaisi.trim() === ''}
              onPress={() => {
                setSaisieOuverte(false);
                void trouverLaChevre(numeroSaisi);
                setNumeroSaisi('');
              }}
            />
            <Button label="Annuler" variant="secondary" onPress={() => setSaisieOuverte(false)} />
          </View>
        </View>
      </Modal>
    </AccentColorProvider>
  );
}

/**
 * L'écran « terrain » d'une zone de l'accueil (le troupeau, le travail du produit, la fabrication, l'accueil du public) : de très grands boutons, une action chacun,
 * avec le chiffre utile dessus. Il s'ouvre d'un appui sur la partie animée de la zone, à la place de la page d'avant (qui reste dans les menus).
 */
export default function EcranTerrain() {
  const { zone: zoneDemandee } = useLocalSearchParams<{ zone?: string }>();
  const zone: ZoneTerrain = ZONES_TERRAIN.find((z) => z === zoneDemandee) ?? 'troupeau';
  return (
    <>
      <Stack.Screen options={{ title: titreDuTerrain(zone) }} />
      <GrilleTerrain zone={zone} />
    </>
  );
}
