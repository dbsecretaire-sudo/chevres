import { useEffect, useState } from 'react';
import { Modal, Pressable, Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { SelectField } from '@/shared/components/SelectField';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { anneesDuSuivi } from '@/features/cheptel/services/suiviMouvements';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { exporterBordereauxPertePdf } from '@/features/export/bordereauPertePdf';
import { exporterSuiviMouvementsPdf } from '@/features/export/suiviMouvementsPdf';
import { loadAllYears } from '@/shared/storage/localStore';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { styles } from '@/shared/styles/cheptel/ListeCheptel.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { currentYear } from '@/shared/utils/dates';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.suiviMouvements;

/** Le choix « toutes les années » de la liste. */
const TOUTES = 'toutes';

/** Les documents du dossier PAC : le choix de l'année (ou de toutes), puis le suivi des mouvements ou les bordereaux de perte en PDF. */
export function FenetreSuiviMouvements({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { espece } = useEtablissement();
  const [annees, setAnnees] = useState<number[]>([]);
  const [choix, setChoix] = useState(String(currentYear()));
  const [encours, setEncours] = useState(false);
  /** Vrai quand les bordereaux demandés n'ont aucune perte à déclarer. */
  const [sansPerte, setSansPerte] = useState(false);

  useEffect(() => {
    if (!visible) return;
    loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL).then((tous) =>
      setAnnees(anneesDuSuivi(deEspeceCourante(tous), currentYear())),
    );
  }, [visible, espece]);

  const options = [
    { value: TOUTES, label: T.toutesLesAnnees },
    ...[...annees].reverse().map((a) => ({ value: String(a), label: String(a) })),
  ];
  const anneesChoisies = choix === TOUTES ? annees : [Number(choix)];
  const generer = async (creer: (annees: number[]) => Promise<number | void>) => {
    setEncours(true);
    setSansPerte(false);
    try {
      const nombre = await creer(anneesChoisies);
      if (nombre === 0) setSansPerte(true);
      else onClose();
    } finally {
      setEncours(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <Pressable style={styles.feuille}>
          <Text style={styles.titreFeuille}>{T.fenetreTitre}</Text>
          <Text style={commonStyles.note}>{T.fenetreAide}</Text>
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
          <Button
            label={T.genererSuivi}
            onPress={() => generer(exporterSuiviMouvementsPdf)}
            disabled={encours || annees.length === 0}
          />
          <Button
            label={T.genererBordereaux}
            onPress={() => generer(exporterBordereauxPertePdf)}
            disabled={encours || annees.length === 0}
          />
          <Text style={commonStyles.note}>{T.aideBordereaux}</Text>
          {sansPerte ? <Text style={commonStyles.mutedItalic}>{T.aucunePerte}</Text> : null}
          <Button variant="secondary" label={TEXTES.commun.general.annuler} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
