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

/** Les tuiles de l'atelier qui ont leur flux en très grands boutons. */
const PRODUITS_DES_TUILES: Record<string, typeof PRODUIT_A_LOTS.FROMAGE | typeof PRODUIT_A_LOTS.CHARCUTERIE | typeof PRODUIT_A_LOTS.PLAT | typeof PRODUIT_A_LOTS.SAVON> = {
  fromage: PRODUIT_A_LOTS.FROMAGE,
  charcuterie: PRODUIT_A_LOTS.CHARCUTERIE,
  plat: PRODUIT_A_LOTS.PLAT,
  savon: PRODUIT_A_LOTS.SAVON,
};
/** Les tuiles qui s'ouvrent ici, sans quitter la page : les autres (le stock, les lots) ouvrent leur page. */
const AVEC_FLUX = [...Object.keys(PRODUITS_DES_TUILES), 'lait', 'etiquettes', 'ventes', 'scanLot'];
const TUILES_MONTREES = [...AVEC_FLUX, 'stock', 'lotsAtelier'];

/**
 * La fromagerie du mode normal : le menu « Travail du produit » (fabriquer un fromage, de la charcuterie, un plat, un savon, ajouter du lait, imprimer des étiquettes, la viande
 * à vendre et à facturer, réunies dans « Ventes »), chaque tuile ouvrant son flux ici ; le stock et les lots ouvrent leur page. `onQuitter` revient à l'accueil du mode normal.
 */
export function AtelierSimple({ onQuitter }: { onQuitter: () => void }) {
  const router = useRouter();
  const { aEnvoyer, envoyer } = useEnvoiBerger();
  const [tuile, setTuile] = useState<string | null>(null);
  const retour = () => setTuile(null);
  if (tuile && tuile in PRODUITS_DES_TUILES)
    return (
      <PageBerger titre="Fabriquer" onRetour={retour}>
        <FabricationSimple produit={PRODUITS_DES_TUILES[tuile]} onTerminer={retour} />
      </PageBerger>
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
        tuiles={tuilesDuTerrain('atelier', COMPTES_VIDES, true).filter((t) => TUILES_MONTREES.includes(t.cle))}
        onAppui={(t) => (AVEC_FLUX.includes(t.cle) ? setTuile(t.cle) : router.push(t.route as never))}
      />
    </ScrollView>
  );
}
