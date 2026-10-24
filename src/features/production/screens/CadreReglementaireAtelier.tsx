import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { ListeFichiers } from '@/features/fichiers/components/ListeFichiers';
import { choisirFichiers, piecesDisponibles, rangerFichier, supprimerPiece } from '@/features/fichiers/services/pieces';
import type { PieceJointe } from '@/features/fichiers/types';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import type { EtapeReglementaire } from '@/features/stock/types';
import { Checkbox } from '@/shared/components/Checkbox';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { Screen } from '@/shared/components/Screen';
import { SectionForm } from '@/shared/components/SectionForm';
import { ETAPES_ATELIER, ETAPES_ATELIER_OBLIGATOIRES } from '@/shared/constants/cadreAtelier';
import { TYPES_FICHIERS_ACCEPTES } from '@/shared/constants/fichiers';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { todayISO } from '@/shared/utils/dates';

const T = TEXTES.exploitation.cadreAtelier;

/**
 * Le cadre réglementaire de l'atelier : ce qu'il faut avoir fait pour fabriquer et vendre des fromages, de la viande, de la charcuterie (déclaration d'activité, plan de maîtrise
 * sanitaire, analyses, santé du troupeau, étiquetage, agrément, abattage, vente directe) et les points propres à la Corse (le brocciu AOP). Chaque démarche a sa case « Fait », sa
 * date, sa référence et ses pièces jointes ; des liens mènent aux sources officielles. C'est un pense-bête : il ne remplace ni la DDPP, ni l'INAO, ni la chambre d'agriculture.
 */
export default function CadreReglementaireAtelier() {
  const { settings, patchSettings } = useAppSettings();
  const infos = settings.exploitation;
  const etapes = infos?.cadreAtelier ?? {};
  const manque = ETAPES_ATELIER_OBLIGATOIRES.filter((e) => !etapes[e]?.fait);

  const maj = (cle: string, modification: Partial<EtapeReglementaire>) =>
    patchSettings({ exploitation: { ...infos, cadreAtelier: { ...etapes, [cle]: { ...(etapes[cle] ?? {}), ...modification } } } });
  const ajouterFichiers = async (cle: string) => {
    if (!piecesDisponibles()) return Alert.alert(TEXTES.fichiers.indisponibleWeb);
    try {
      const nouveaux: PieceJointe[] = [];
      for (const choisi of await choisirFichiers(TYPES_FICHIERS_ACCEPTES, true)) nouveaux.push(await rangerFichier(choisi));
      await maj(cle, { fichiers: [...(etapes[cle]?.fichiers ?? []), ...nouveaux] });
    } catch (erreur: unknown) {
      Alert.alert(erreur instanceof Error ? erreur.message : TEXTES.fichiers.erreurAjout);
    }
  };
  const retirerFichier = async (cle: string, piece: PieceJointe) => {
    await supprimerPiece(piece);
    await maj(cle, { fichiers: (etapes[cle]?.fichiers ?? []).filter((f) => f.id !== piece.id) });
  };

  return (
    <Screen>
      <Text style={commonStyles.note}>{T.intro}</Text>
      <Text style={commonStyles.lineBold}>
        {manque.length === 0 ? T.enRegle : T.incomplet(manque.map((e) => T.etapes[e as keyof typeof T.etapes].titre).join(', '))}
      </Text>
      {ETAPES_ATELIER.map((cle) => {
        const textes = T.etapes[cle as keyof typeof T.etapes];
        const donnees = etapes[cle] ?? {};
        return (
          <SectionForm
            key={cle}
            titre={`${textes.titre} · ${ETAPES_ATELIER_OBLIGATOIRES.includes(cle) ? T.obligatoire : T.aVerifier}`}
            aide={textes.aide}
          >
            {textes.liens.map((lien) => (
              <Pressable key={lien.url} onPress={() => void Linking.openURL(lien.url)} accessibilityRole="link">
                <Text style={commonStyles.lien}>{lien.titre}</Text>
              </Pressable>
            ))}
            <Checkbox
              label={T.fait}
              value={!!donnees.fait}
              onChange={(fait) => maj(cle, { fait: fait || undefined, date: fait && !donnees.date ? todayISO() : donnees.date })}
            />
            <DateField label={T.date} value={donnees.date ?? ''} onChange={(date) => maj(cle, { date })} />
            <FormField
              label={textes.reference}
              defaultValue={donnees.reference ?? ''}
              onEndEditing={(ev) => {
                maj(cle, { reference: ev.nativeEvent.text.trim() || undefined });
              }}
            />
            <View>
              <ListeFichiers
                titre={T.fichiers}
                libelleAjout={T.ajouterFichier}
                pieces={donnees.fichiers ?? []}
                onAjouter={() => ajouterFichiers(cle)}
                onRetirer={(piece) => retirerFichier(cle, piece)}
              />
            </View>
          </SectionForm>
        );
      })}
      <SectionForm titre={T.notes} aide={T.aideNotes}>
        <FormField
          label={T.notes}
          defaultValue={infos?.notesCadreAtelier ?? ''}
          multiline
          style={commonStyles.textarea}
          onEndEditing={(ev) => {
            patchSettings({ exploitation: { ...infos, notesCadreAtelier: ev.nativeEvent.text.trim() || undefined } });
          }}
        />
      </SectionForm>
    </Screen>
  );
}
