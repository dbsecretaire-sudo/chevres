import { useState } from 'react';
import { ScrollView } from 'react-native';
import { GrilleDeTuiles } from '@/features/accueil/terrain/GrilleDeTuiles';
import { COMPTES_VIDES, tuilesDuTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { AccueilPublicSimple } from '@/features/commercial/simple/AccueilPublicSimple';
import { FormulesSimple } from '@/features/commercial/simple/FormulesSimple';
import { NouvelleVisiteSimple } from '@/features/commercial/simple/NouvelleVisiteSimple';
import { VisitesSimple } from '@/features/commercial/simple/VisitesSimple';
import { EnteteBerger } from '@/features/berger/components/EnteteBerger';
import { useEnvoiBerger } from '@/features/berger/hooks/useEnvoiBerger';
import { TEXTES } from '@/shared/textes';

/** Les tuiles de l'accueil du public qui ont leur page simple (les contacts ouvrent leur page à part). */
const TUILES = ['nouvelleVisite', 'visites', 'formules', 'accueilPublic'];

/**
 * Le tourisme du mode normal : les mêmes tuiles que « Accueil du public » (nouvelle visite, visites, formules, obligations), chacune ouvrant sa page simple ici.
 * `onQuitter` revient à l'accueil du mode normal.
 */
export function TourismeSimple({ onQuitter }: { onQuitter: () => void }) {
  const { aEnvoyer, envoyer } = useEnvoiBerger();
  const [tuile, setTuile] = useState<string | null>(null);
  const retour = () => setTuile(null);
  if (tuile === 'nouvelleVisite') return <NouvelleVisiteSimple onTerminer={retour} />;
  if (tuile === 'visites') return <VisitesSimple onRetour={retour} />;
  if (tuile === 'formules') return <FormulesSimple onTerminer={retour} />;
  if (tuile === 'accueilPublic') return <AccueilPublicSimple onTerminer={retour} />;
  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <EnteteBerger titre={TEXTES.roles.berger.tourisme} onRetour={onQuitter} aEnvoyer={aEnvoyer} onEnvoyer={envoyer} />
      <GrilleDeTuiles
        tuiles={tuilesDuTerrain('accueil', COMPTES_VIDES).filter((t) => TUILES.includes(t.cle))}
        onAppui={(t) => setTuile(t.cle)}
      />
    </ScrollView>
  );
}
