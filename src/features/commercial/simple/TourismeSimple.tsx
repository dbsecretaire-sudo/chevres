import { useState } from 'react';
import { ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { GrilleDeTuiles } from '@/features/accueil/terrain/GrilleDeTuiles';
import { COMPTES_VIDES, tuilesDuTerrain, type TuileTerrain } from '@/features/accueil/terrain/ecransTerrain';
import { useEnvoiBerger } from '@/features/berger/hooks/useEnvoiBerger';
import { FormulesSimple } from '@/features/commercial/simple/FormulesSimple';
import { GroupesSimple } from '@/features/commercial/simple/GroupesSimple';
import { NouvelleVisiteSimple } from '@/features/commercial/simple/NouvelleVisiteSimple';
import { VisitesSimple } from '@/features/commercial/simple/VisitesSimple';
import { EnteteBerger } from '@/features/berger/components/EnteteBerger';
import { PageBerger } from '@/features/berger/components/PageBerger';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/** Les tuiles qui ouvrent leur page simple ici. Les autres (encaisser, tarifs) ouvrent une page existante du mode avancé. */
const AVEC_PAGE = ['nouvelleVisite', 'visites', 'repas', 'groupes'];

/** Les tuiles du tourisme, dans l'ordre de la maquette : nouvelle visite, aujourd'hui, encaisser, repas, groupes, tarifs. */
const tuilesDuTourisme = (): TuileTerrain[] => {
  const tuilesTerrain = tuilesDuTerrain('accueil', COMPTES_VIDES);
  const dansLeTerrain = (cle: string) => tuilesTerrain.filter((t) => t.cle === cle);
  return [
    ...dansLeTerrain('nouvelleVisite'),
    ...dansLeTerrain('visites').map((t) => ({ ...t, titre: 'Aujourd’hui' })),
    { cle: 'encaisser', titre: 'Encaisser', icone: 'cash', route: ROUTES.commercialVentes('encaisser') },
    { cle: 'repas', titre: 'Repas', icone: 'restaurant', route: ROUTES.COMMERCIAL_FORMULES_SIMPLE },
    { cle: 'groupes', titre: 'Groupes', icone: 'people', route: '' },
    { cle: 'tarifs', titre: 'Tarifs', icone: 'pricetag', route: ROUTES.COMMERCIAL_TARIFS },
  ];
};

/**
 * Le tourisme du mode normal : nouvelle visite, visites du jour, encaisser, repas, groupes à venir, tarifs. Les pages simples s'ouvrent ici ; encaisser et tarifs
 * ouvrent les pages du mode avancé. `onQuitter` revient à l'accueil du mode normal.
 */
export function TourismeSimple({ onQuitter }: { onQuitter: () => void }) {
  const router = useRouter();
  const { aEnvoyer, envoyer } = useEnvoiBerger();
  const [tuile, setTuile] = useState<string | null>(null);
  const retour = () => setTuile(null);
  if (tuile === 'nouvelleVisite')
    return (
      <PageBerger titre="Nouvelle visite" onRetour={retour}>
        <NouvelleVisiteSimple onTerminer={retour} />
      </PageBerger>
    );
  if (tuile === 'visites')
    return (
      <PageBerger titre="Aujourd’hui" onRetour={retour}>
        <VisitesSimple onRetour={retour} />
      </PageBerger>
    );
  if (tuile === 'repas')
    return (
      <PageBerger titre="Repas" onRetour={retour}>
        <FormulesSimple onTerminer={retour} />
      </PageBerger>
    );
  if (tuile === 'groupes')
    return (
      <PageBerger titre="Groupes" onRetour={retour}>
        <GroupesSimple />
      </PageBerger>
    );
  return (
    <ScrollView contentContainerStyle={{ padding: 12, gap: 12 }}>
      <EnteteBerger titre={TEXTES.roles.berger.tourisme} onRetour={onQuitter} aEnvoyer={aEnvoyer} onEnvoyer={envoyer} />
      <GrilleDeTuiles tuiles={tuilesDuTourisme()} onAppui={(t) => (AVEC_PAGE.includes(t.cle) ? setTuile(t.cle) : router.push(t.route as never))} />
    </ScrollView>
  );
}
