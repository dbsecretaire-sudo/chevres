import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { GrilleDeTuiles } from '@/features/accueil/terrain/GrilleDeTuiles';
import { tuilesDuTerrain, type ComptesTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { EtiquettesSimple } from '@/features/production/simple/EtiquettesSimple';
import { FabricationSimple } from '@/features/production/simple/FabricationSimple';
import { LaitSimple } from '@/features/production/simple/LaitSimple';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';

/** Aucun chiffre sur les tuiles : le mode normal n'en a pas besoin. */
const SANS_COMPTES: ComptesTerrain = {
  delais: 0,
  ventesSansDocument: 0,
  aCompleter: 0,
  lotsAFacturer: 0,
  viandeAFacturer: 0,
  lotsARappeler: 0,
  stockNegatif: false,
  visitesAVenir: 0,
};

/** Les tuiles de l'atelier qui ont leur flux en très grands boutons. */
const PRODUITS_DES_TUILES: Record<string, typeof PRODUIT_A_LOTS.FROMAGE | typeof PRODUIT_A_LOTS.CHARCUTERIE | typeof PRODUIT_A_LOTS.PLAT | typeof PRODUIT_A_LOTS.SAVON> = {
  fromage: PRODUIT_A_LOTS.FROMAGE,
  charcuterie: PRODUIT_A_LOTS.CHARCUTERIE,
  plat: PRODUIT_A_LOTS.PLAT,
  savon: PRODUIT_A_LOTS.SAVON,
};
const AVEC_FLUX = [...Object.keys(PRODUITS_DES_TUILES), 'lait', 'etiquettes'];

/**
 * La fromagerie du mode normal : le menu « Travail du produit » (fabriquer un fromage, de la charcuterie, un plat, un savon, ajouter du lait, imprimer des étiquettes),
 * chaque tuile ouvrant son flux en très grands boutons, sans autre page. `onQuitter` revient à l'accueil du mode normal.
 */
export function AtelierSimple({ onQuitter }: { onQuitter: () => void }) {
  const [tuile, setTuile] = useState<string | null>(null);
  const retour = () => setTuile(null);
  if (tuile && tuile in PRODUITS_DES_TUILES)
    return <FabricationSimple produit={PRODUITS_DES_TUILES[tuile]} onTerminer={retour} />;
  if (tuile === 'lait') return <LaitSimple onTerminer={retour} />;
  if (tuile === 'etiquettes') return <EtiquettesSimple onTerminer={retour} />;
  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <Text style={styles.titre}>{TEXTES.roles.berger.fromagerie}</Text>
      <GrilleDeTuiles
        tuiles={tuilesDuTerrain('atelier', SANS_COMPTES).filter((t) => AVEC_FLUX.includes(t.cle))}
        onAppui={(t) => setTuile(t.cle)}
      />
      <View>
        <Pressable style={styles.discret} onPress={onQuitter} accessibilityRole="button">
          <Text style={styles.discretTexte}>{TEXTES.roles.berger.retour}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
