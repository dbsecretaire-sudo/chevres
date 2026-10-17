import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { Screen } from '@/shared/components/Screen';
import { Button } from '@/shared/components/Button';
import { SelectField } from '@/shared/components/SelectField';
import type { Chevre } from '@/features/cheptel/types';
import { SelecteurEspece } from '@/features/etablissements/components/SelecteurEspece';
import { FenetreEstive } from '@/features/cheptel/components/FenetreEstive';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { anneesDuSuivi } from '@/features/cheptel/services/suiviMouvements';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { exporterBordereauxPertePdf } from '@/features/export/bordereauPertePdf';
import { exporterRecensementPdf } from '@/features/export/recensementPdf';
import { recensementAnnuel } from '@/features/cheptel/services/recensement';
import { exporterSuiviMouvementsPdf, especeDuSuivi } from '@/features/export/suiviMouvementsPdf';
import { loadAllYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { commonStyles } from '@/shared/styles/commonStyles';
import { currentYear } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.suiviMouvements;

/** Le choix « toutes les années » de la liste. */
const TOUTES = 'toutes';

/**
 * Le dossier PAC : tous les documents de la campagne, remplis d'après le cheptel, au même endroit — le suivi des mouvements, les
 * bordereaux de perte, le recensement annuel et la déclaration d'estive. On choisit l'année, puis le document.
 */
export default function DossierPac() {
  const { espece } = useEtablissement();
  const [annees, setAnnees] = useState<number[]>([]);
  const [choix, setChoix] = useState(String(currentYear()));
  const [encours, setEncours] = useState(false);
  /** Vrai quand les bordereaux demandés n'ont aucune perte à déclarer. */
  const [sansPerte, setSansPerte] = useState(false);
  const [estiveOuverte, setEstiveOuverte] = useState(false);
  const [animauxDuCheptel, setAnimauxDuCheptel] = useState<Chevre[]>([]);

  useEffect(() => {
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL).then((tous) => {
      setAnnees(anneesDuSuivi(deEspeceCourante(tous), currentYear()));
      setAnimauxDuCheptel(deEspeceCourante(tous));
    });
  }, [espece]);

  const options = [
    { value: TOUTES, label: T.toutesLesAnnees },
    ...[...annees].reverse().map((a) => ({ value: String(a), label: String(a) })),
  ];
  const anneesChoisies = choix === TOUTES ? annees : [Number(choix)];
  const annee = choix === TOUTES ? currentYear() : Number(choix);
  // Le recensement de l'année choisie d'après le cheptel : de quoi expliquer son nombre de petits nés.
  const recensement = animauxDuCheptel.length > 0 ? recensementAnnuel(animauxDuCheptel, annee + 1) : null;
  const generer = async (creer: (annees: number[]) => Promise<number | void>) => {
    setEncours(true);
    setSansPerte(false);
    try {
      const nombre = await creer(anneesChoisies);
      if (nombre === 0) setSansPerte(true);
    } finally {
      setEncours(false);
    }
  };

  return (
    <Screen>
      <SelecteurEspece />
      <Text style={commonStyles.note}>{T.fenetreAide}</Text>
      {!especeDuSuivi(espece) ? <Text style={commonStyles.mutedItalic}>{T.pasPourCetteEspece}</Text> : null}
      {annees.length === 0 ? (
        <Text style={commonStyles.mutedItalic}>{T.aucunAnimal}</Text>
      ) : (
        <SelectField
          label={T.annee}
          value={choix}
          onChange={(valeur) => {
            setChoix(valeur);
            setSansPerte(false);
          }}
          options={options}
        />
      )}
      <Button label={T.genererSuivi} onPress={() => generer(exporterSuiviMouvementsPdf)} disabled={encours || annees.length === 0} />
      <Button label={T.genererBordereaux} onPress={() => generer(exporterBordereauxPertePdf)} disabled={encours || annees.length === 0} />
      <Text style={commonStyles.note}>{T.aideBordereaux}</Text>
      {sansPerte ? <Text style={commonStyles.mutedItalic}>{T.aucunePerte}</Text> : null}
      <Button
        variant="secondary"
        label={`${T.recensement.bouton} — ${annee + 1}`}
        onPress={() => generer(async () => exporterRecensementPdf(annee))}
        disabled={encours || annees.length === 0}
      />
      <Text style={commonStyles.note}>{T.recensement.aide(annee)}</Text>
      {recensement && recensement.nesTotal > 0 ? (
        <Text style={commonStyles.note}>
          {T.recensement.detailNes(annee, recensement.nesTotal, recensement.nesSansBoucle, recensement.nesMorts, recensement.nes)}
        </Text>
      ) : null}
      <Button variant="secondary" label={T.estive.bouton} onPress={() => setEstiveOuverte(true)} />
      <FenetreEstive visible={estiveOuverte} annee={annee} onClose={() => setEstiveOuverte(false)} />
    </Screen>
  );
}
