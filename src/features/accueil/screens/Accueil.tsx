import { LigneFiltres } from '@/features/etablissements/components/LigneFiltres';
import { BlocRappels } from '@/features/rappels/components/BlocRappels';
import { AncreVisite } from '@/shared/components/AncreVisite';
import { BoutonDidacticiel } from '@/features/didacticiel/components/BoutonDidacticiel';
import { BlocSante } from '@/features/exploitation/components/BlocSante';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import AccueilEntreprise from '@/features/accueil/screens/AccueilEntreprise';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TuilesAccueil } from '@/features/accueil/components/TuilesAccueil';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';
import AccueilFerme from '@/features/accueil/ferme/AccueilFerme';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';

/** Accueil de l'élevage, ou celui de l'entreprise quand l'établissement actif n'est pas un élevage. */
export default function Accueil() {
  const { settings } = useAppSettings();
  if (modeEntreprise()) return <AccueilEntreprise />;
  // L'élevage : la ferme (d'office), ou l'accueil classique en liste quand le réglage le demande.
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
