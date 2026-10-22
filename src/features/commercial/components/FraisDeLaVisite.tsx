import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { lireArchiveCommercial } from '@/features/commercial/repository';
import { elementsDeFormule } from '@/features/commercial/services/agritourisme';
import { coutsParFormule, type CoutFormule } from '@/features/commercial/services/coutsAgritourisme';
import { listFactures } from '@/features/comptabilite/repository/factures';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { SectionForm } from '@/shared/components/SectionForm';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatMontant } from '@/shared/utils/dates';

const T = TEXTES.commercial.agritourisme.couts;

/**
 * Les frais d'une visite, sur sa fiche : ce que coûte une visite de sa formule d'après l'année de la visite (les charges de l'atelier Agritourisme — assurances,
 * office de tourisme, flyers… — réparties sur les visites, et le carburant du véhicule touristique d'après les kilomètres de la formule), et ce qu'il reste de la recette.
 */
export function FraisDeLaVisite({ formuleId, date, recette }: { formuleId: string; date: string; recette: number }) {
  const { settings } = useAppSettings();
  const [cout, setCout] = useState<CoutFormule | null>(null);
  const annee = Number(date.slice(0, 4)) || new Date().getFullYear();
  const flotte = settings.exploitation?.flotte;
  useEffect(() => {
    Promise.all([lireArchiveCommercial(), listFactures(annee)])
      .then(([archive, factures]) => {
        const couts = coutsParFormule({
          visites: archive.visites.filter((v) => v.date.startsWith(String(annee))),
          formules: archive.formules,
          elements: elementsDeFormule(archive),
          factures,
          horsTaxes: false,
          vehicules: flotte,
        });
        setCout(couts.formules.find((c) => c.formule.id === formuleId) ?? null);
      })
      .catch(() => undefined);
  }, [annee, formuleId, flotte]);

  if (!cout || cout.composants.length === 0) return null;
  return (
    <SectionForm titre={T.fraisDeLaVisite}>
      <Text style={commonStyles.lineBold}>{T.parVisite(formatMontant(cout.coutParVisite))}</Text>
      {cout.composants.map((c) => (
        <Text key={c.cle || 'commun'} style={commonStyles.note}>
          {T.composantCourt(c.libelle ?? T.commun, formatMontant(c.parVisite))}
        </Text>
      ))}
      {recette > 0 ? <Text style={commonStyles.lineBold}>{T.apresFrais(formatMontant(recette - cout.coutParVisite))}</Text> : null}
      <Text style={commonStyles.note}>{T.fraisAide}</Text>
    </SectionForm>
  );
}
