import { LigneFiltres } from '@/shared/components/LigneFiltres';
import { BlocRappels } from '@/features/rappels/components/BlocRappels';
import { BlocSante } from '@/features/exploitation/components/BlocSante';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { Screen } from '@/shared/components/Screen';
import { YearPicker } from '@/shared/components/YearPicker';
import AccueilEntreprise from '@/features/accueil/screens/AccueilEntreprise';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TuilesAccueil } from '@/features/accueil/components/TuilesAccueil';
import { useAccueil } from '@/features/accueil/hooks/useAccueil';

/** Accueil de l'élevage, ou celui de l'entreprise quand l'établissement actif n'est pas un élevage. */
export default function Accueil() {
  return modeEntreprise() ? <AccueilEntreprise /> : <AccueilElevage />;
}

function AccueilElevage() {
  const { annee, annees, setAnneeActive, stats } = useAccueil();

  return (
    <Screen>
      <LigneFiltres>
        <YearPicker annees={annees} value={annee} onChange={setAnneeActive} />
        <SelecteurEspece />
      </LigneFiltres>

      {/* Ce qui demande qu'on s'en occupe : les délais d'attente, le bilan sanitaire, les déclarations à faire (rien quand tout va bien). */}
      <BlocSante />
      <BlocRappels />

      {/* Les quatre chiffres de l'élevage ; le détail (pyramide des âges, mouvements) est dans Cheptel › Statistiques. */}
      <TuilesAccueil stats={stats} annee={annee} />
    </Screen>
  );
}
