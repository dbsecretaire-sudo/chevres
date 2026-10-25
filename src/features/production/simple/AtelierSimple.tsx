import { useState } from 'react';
import { ScrollView } from 'react-native';
import { GrilleDeTuiles } from '@/features/accueil/terrain/GrilleDeTuiles';
import { useRouter } from 'expo-router';
import { PageBerger } from '@/features/berger/components/PageBerger';
import { EnteteBerger } from '@/features/berger/components/EnteteBerger';
import { useEnvoiBerger } from '@/features/berger/hooks/useEnvoiBerger';
import { COMPTES_VIDES, tuilesDuTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { EtiquettesSimple } from '@/features/production/simple/EtiquettesSimple';
import { FabricationSimple } from '@/features/production/simple/FabricationSimple';
import { LaitSimple } from '@/features/production/simple/LaitSimple';
import { ScanLotSimple } from '@/features/production/simple/ScanLotSimple';
import { VentesSimple } from '@/features/production/simple/VentesSimple';
import { PRODUIT_A_LOTS } from '@/shared/constants/stock';
import { TEXTES } from '@/shared/textes';

/** Les produits qu'on fabrique : la tuile « Fabriquer » ouvre la liste de ces quatre-là, chacun avec son flux en très grands boutons. */
const PRODUITS_DES_TUILES: Record<string, typeof PRODUIT_A_LOTS.FROMAGE | typeof PRODUIT_A_LOTS.CHARCUTERIE | typeof PRODUIT_A_LOTS.PLAT | typeof PRODUIT_A_LOTS.SAVON> = {
  fromage: PRODUIT_A_LOTS.FROMAGE,
  charcuterie: PRODUIT_A_LOTS.CHARCUTERIE,
  plat: PRODUIT_A_LOTS.PLAT,
  savon: PRODUIT_A_LOTS.SAVON,
};
/** Les tuiles qui s'ouvrent ici, sans quitter la page : les autres (le stock) ouvrent leur page. */
const AVEC_FLUX = ['fabriquer', 'lait', 'etiquettes', 'ventes', 'scanLot'];

/**
 * La fromagerie du mode normal : le menu de l'atelier (lait du jour, fabriquer, scanner un lot, étiquettes, vendre, stock). « Fabriquer » ouvre les quatre produits
 * (fromage, charcuterie, plat, savon) ; chaque flux s'ouvre ici, le stock ouvre sa page. `onQuitter` revient à l'accueil du mode normal.
 */
export function AtelierSimple({ onQuitter }: { onQuitter: () => void }) {
  const router = useRouter();
  const { aEnvoyer, envoyer } = useEnvoiBerger();
  const [tuile, setTuile] = useState<string | null>(null);
  const retour = () => setTuile(null);
  // Un produit fabriqué revient à la liste des produits, pas au menu.
  const retourFabriquer = () => setTuile('fabriquer');
  if (tuile && tuile in PRODUITS_DES_TUILES)
    return (
      <PageBerger titre="Fabriquer" onRetour={retourFabriquer}>
        <FabricationSimple produit={PRODUITS_DES_TUILES[tuile]} onTerminer={retourFabriquer} />
      </PageBerger>
    );
  if (tuile === 'fabriquer')
    return (
      <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
        <EnteteBerger titre="Fabriquer" onRetour={retour} aEnvoyer={aEnvoyer} onEnvoyer={envoyer} />
        <GrilleDeTuiles tuiles={tuilesDuTerrain('fabriquer', COMPTES_VIDES)} onAppui={(t) => setTuile(t.cle)} />
      </ScrollView>
    );
  if (tuile === 'lait')
    return (
      <PageBerger titre="Lait du jour" onRetour={retour}>
        <LaitSimple onTerminer={retour} />
      </PageBerger>
    );
  if (tuile === 'etiquettes')
    return (
      <PageBerger titre="Étiquettes" onRetour={retour}>
        <EtiquettesSimple onTerminer={retour} />
      </PageBerger>
    );
  if (tuile === 'ventes')
    return (
      <PageBerger titre="Vendre" onRetour={retour}>
        <VentesSimple onRetour={retour} />
      </PageBerger>
    );
  if (tuile === 'scanLot')
    return (
      <PageBerger titre="Scanner un lot" onRetour={retour}>
        <ScanLotSimple onRetour={retour} />
      </PageBerger>
    );
  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <EnteteBerger titre={TEXTES.roles.berger.fromagerie} onRetour={onQuitter} aEnvoyer={aEnvoyer} onEnvoyer={envoyer} />
      <GrilleDeTuiles
        tuiles={tuilesDuTerrain('atelier', COMPTES_VIDES)}
        onAppui={(t) => (AVEC_FLUX.includes(t.cle) ? setTuile(t.cle) : router.push(t.route as never))}
      />
    </ScrollView>
  );
}
