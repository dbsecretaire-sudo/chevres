import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text } from 'react-native';
import { Button } from '@/shared/components/Button';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { effectifALaMontee } from '@/features/cheptel/services/estive';
import { deEspeceCourante } from '@/features/cheptel/utils/espece';
import { listToutesVentes } from '@/features/comptabilite/repository/ventes';
import { estLeGestionnaire, exporterDeclarationEstivePdf } from '@/features/export/declarationEstivePdf';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { ReglagesEstive } from '@/features/settings/settings';
import { CATEGORIE_STOCKAGE } from '@/shared/constants/stockage';
import { loadAllYears } from '@/shared/storage/localStore';
import { styles } from '@/shared/styles/cheptel/ListeCheptel.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

const T = TEXTES.cheptel.suiviMouvements;
const E = T.estive;

/**
 * La déclaration de montée et descente d'estive (la transhumance) d'une année : les dates, la zone d'estive et le gestionnaire se saisissent
 * ici (et se retrouvent d'une fois à l'autre), puis le PDF est rempli d'après l'exploitation et le cheptel au jour de la montée.
 */
export function FenetreEstive({
  visible,
  annee,
  onClose,
  onGeneree,
}: {
  visible: boolean;
  annee: number;
  onClose: () => void;
  /** Appelée une fois le PDF généré (la fenêtre qui l'a ouverte peut se fermer aussi). */
  onGeneree?: () => void;
}) {
  const { settings, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const nomExploitant = infos?.nomExploitant ?? '';
  const [valeurs, setValeurs] = useState<ReglagesEstive>({});
  const [effectif, setEffectif] = useState<number | undefined>();
  const [encours, setEncours] = useState(false);

  // À l'ouverture : ce qui a été saisi pour cette année.
  useEffect(() => {
    if (!visible) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValeurs(infos?.estives?.[String(annee)] ?? {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, annee]);

  // L'effectif au jour de la montée suit la date choisie.
  useEffect(() => {
    if (!visible) return;
    // Sans date de montée, l'effectif est celui d'aujourd'hui.
    const date = valeurs.dateMontee || todayISO();
    let actuel = true;
    Promise.all([loadAllYears(CATEGORIE_STOCKAGE.CHEPTEL), listToutesVentes()]).then(([tous, ventes]) => {
      if (!actuel) return;
      setEffectif(
        effectifALaMontee(deEspeceCourante(tous), ventes, date, {
          abattoir: T.abattoir,
          autoConsommation: T.autoConsommation,
        }),
      );
    });
    return () => {
      actuel = false;
    };
  }, [visible, valeurs.dateMontee]);

  const maj = (patch: Partial<ReglagesEstive>) => setValeurs((v) => ({ ...v, ...patch }));

  const generer = async () => {
    setEncours(true);
    try {
      await patchSettings({
        exploitation: { ...infos, estives: { ...infos?.estives, [String(annee)]: valeurs } },
      });
      await exporterDeclarationEstivePdf(annee, valeurs);
      onClose();
      onGeneree?.();
    } finally {
      setEncours(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <Pressable style={styles.feuille}>
          <ScrollView contentContainerStyle={styles.feuilleContenu}>
            <Text style={styles.titreFeuille}>
              {E.fenetreTitre} — {annee}
            </Text>
            <Text style={commonStyles.note}>{E.fenetreAide}</Text>
            <DateField
              label={E.dateMontee}
              value={valeurs.dateMontee ?? ''}
              onChange={(dateMontee) => maj({ dateMontee })}
            />
            <DateField
              label={E.dateDescente}
              value={valeurs.dateDescente ?? ''}
              onChange={(dateDescente) => maj({ dateDescente })}
            />
            <Text style={commonStyles.note}>{E.aideDates}</Text>
            {effectif === undefined ? null : (
              <Text style={commonStyles.lineBold}>
                {E.effectif(effectif, formatDateFR(valeurs.dateMontee || todayISO()))}
                {valeurs.dateMontee ? '' : ` ${E.effectifAujourdhui}`}
              </Text>
            )}
            <FormField
              label={E.zone}
              value={valeurs.zone ?? ''}
              onChangeText={(zone) => maj({ zone })}
              placeholder={E.zoneExemple}
            />
            <Checkbox
              label={E.moiGestionnaire}
              value={
                estLeGestionnaire({
                  moiGestionnaire: valeurs.moiGestionnaire,
                  gestionnaire: valeurs.gestionnaire,
                  identite: { numeroPacage: '', siret: '', numeroExploitation: '', nom: nomExploitant },
                })
              }
              onChange={(moiGestionnaire) => maj({ moiGestionnaire })}
            />
            <Text style={commonStyles.note}>{E.aideMoiGestionnaire}</Text>
            <FormField
              label={E.gestionnaire}
              value={valeurs.gestionnaire ?? ''}
              onChangeText={(gestionnaire) => maj({ gestionnaire })}
            />
            <FormField
              label={E.communeGestionnaire}
              value={valeurs.communeGestionnaire ?? ''}
              onChangeText={(communeGestionnaire) => maj({ communeGestionnaire })}
            />
            <Button label={E.generer} onPress={generer} loading={encours} />
            <Button variant="secondary" label={TEXTES.commun.general.annuler} onPress={onClose} />
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
