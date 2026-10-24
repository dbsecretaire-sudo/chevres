import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { GrilleDeTuiles } from '@/features/accueil/terrain/GrilleDeTuiles';
import { useRouter } from 'expo-router';
import { COMPTES_VIDES, tuilesDuTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { EtiquettesSimple } from '@/features/production/simple/EtiquettesSimple';
import { FabricationSimple } from '@/features/production/simple/FabricationSimple';
import { LaitSimple } from '@/features/production/simple/LaitSimple';
import { VentesSimple } from '@/features/production/simple/VentesSimple';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { TEXTES } from '@/shared/textes';

/** Les tuiles de l'atelier qui ont leur flux en très grands boutons. */
const PRODUITS_DES_TUILES: Record<string, typeof PRODUIT_A_LOTS.FROMAGE | typeof PRODUIT_A_LOTS.CHARCUTERIE | typeof PRODUIT_A_LOTS.PLAT | typeof PRODUIT_A_LOTS.SAVON> = {
  fromage: PRODUIT_A_LOTS.FROMAGE,
  charcuterie: PRODUIT_A_LOTS.CHARCUTERIE,
  plat: PRODUIT_A_LOTS.PLAT,
  savon: PRODUIT_A_LOTS.SAVON,
};
/** Les tuiles qui s'ouvrent ici, sans quitter la page : les autres (le stock, les lots) ouvrent leur page. */
const AVEC_FLUX = [...Object.keys(PRODUITS_DES_TUILES), 'lait', 'etiquettes', 'ventes'];
const TUILES_MONTREES = [...AVEC_FLUX, 'stock', 'lotsAtelier'];

/**
 * La fromagerie du mode normal : le menu « Travail du produit » (fabriquer un fromage, de la charcuterie, un plat, un savon, ajouter du lait, imprimer des étiquettes, la viande
 * à vendre et à facturer, réunies dans « Ventes »), chaque tuile ouvrant son flux ici ; le stock et les lots ouvrent leur page. `onQuitter` revient à l'accueil du mode normal.
 */
export function AtelierSimple({ onQuitter }: { onQuitter: () => void }) {
  const router = useRouter();
  const [tuile, setTuile] = useState<string | null>(null);
  const retour = () => setTuile(null);
  if (tuile && tuile in PRODUITS_DES_TUILES)
    return <FabricationSimple produit={PRODUITS_DES_TUILES[tuile]} onTerminer={retour} />;
  if (tuile === 'lait') return <LaitSimple onTerminer={retour} />;
  if (tuile === 'etiquettes') return <EtiquettesSimple onTerminer={retour} />;
  if (tuile === 'ventes') return <VentesSimple onRetour={retour} />;
  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <Text style={styles.titre}>{TEXTES.roles.berger.fromagerie}</Text>
      <GrilleDeTuiles
        tuiles={tuilesDuTerrain('atelier', COMPTES_VIDES, true).filter((t) => TUILES_MONTREES.includes(t.cle))}
        onAppui={(t) => (AVEC_FLUX.includes(t.cle) ? setTuile(t.cle) : router.push(t.route as never))}
      />
      <View>
        <Pressable style={styles.discret} onPress={onQuitter} accessibilityRole="button">
          <Text style={styles.discretTexte}>{TEXTES.roles.berger.retour}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
