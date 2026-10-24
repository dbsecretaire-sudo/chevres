import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { BlocRappels } from '@/features/rappels/components/BlocRappels';
import { AncreVisite } from '@/shared/components/AncreVisite';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { BlocSante } from '@/features/sante/components/BlocSante';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import { TuilesAccueil } from '@/features/accueil/components/TuilesAccueil';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';
import AccueilFerme from '@/features/accueil/ferme/AccueilFerme';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';

/** Accueil de l'élevage : la ferme (d'office), ou l'accueil classique en liste quand le réglage le demande. */
export default function Accueil() {
  const { settings } = useAppSettings();
  return settings.exploitation?.accueilClassique ? <AccueilElevage /> : <AccueilFerme />;
}

function AccueilElevage() {
  const { annee, annees, setAnneeActive, stats } = useAccueil();

  return (
    <Screen>
      <AncreVisite id="accueil.filtres">
        <LigneFiltres>
          <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
          <SelecteurEspece />
          <BoutonDidacticiel />
        </LigneFiltres>
      </AncreVisite>

      {/* Ce qui demande qu'on s'en occupe : les délais d'attente, le bilan sanitaire, les déclarations à faire (rien quand tout va bien). */}
      <BlocSante />
      <BlocRappels />

      {/* Les quatre chiffres de l'élevage ; le détail (pyramide des âges, mouvements) est dans Cheptel › Statistiques. */}
      <TuilesAccueil stats={stats} annee={annee} />
    </Screen>
  );
}
