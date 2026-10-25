import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { annulerAchat, enregistrerAchat } from '@/features/berger/services/achat';
import { dateDuJour } from '@/features/berger/services/soin';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { SEXE } from '@/shared/constants/cheptel';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { parseDecimal } from '@/shared/utils/nombres';

const T = TEXTES.roles.berger;

interface Props {
  /** Enregistré : l'écran de confirmation, avec de quoi annuler (les identifiants créés). */
  onFait: (titre: string, detail: string, annuler: () => Promise<void>) => void;
}

/** Un animal qui arrive chez soi : la boucle (facultative), le sexe, le vendeur, le prix (facultatif) et la date. */
export function AchatSimple({ onFait }: Props) {
  const { espece } = useEtablissement();
  const [boucle, setBoucle] = useState('');
  const [sexe, setSexe] = useState<typeof SEXE.FEMELLE | typeof SEXE.MALE>(SEXE.FEMELLE);
  const [vendeur, setVendeur] = useState('');
  const [prix, setPrix] = useState('');
  const [date, setDate] = useState(dateDuJour());
  const [enCours, setEnCours] = useState(false);

  const montant = parseDecimal(prix);
  const prixSaisi = prix.trim() !== '';

  const valider = async () => {
    setEnCours(true);
    try {
      const ids = await enregistrerAchat({
        boucle,
        sexe,
        vendeur,
        date,
        prix: prixSaisi && montant > 0 ? montant : undefined,
        activite: espece,
      });
      onFait(T.achatFait, T.achatDetail(boucle.trim(), prixSaisi && montant > 0 ? montant : undefined), () => annulerAchat(ids));
    } catch (erreur) {
      Alert.alert(T.erreur, erreur instanceof Error ? erreur.message : String(erreur));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={commonStyles.gap10}>
      <FormField label={T.achatBoucle} value={boucle} onChangeText={setBoucle} keyboardType="number-pad" />

      <Text style={commonStyles.cardTitle}>{T.achatSexe}</Text>
      <View style={commonStyles.row}>
        {[
          { valeur: SEXE.FEMELLE, libelle: T.ficheSexe(true) },
          { valeur: SEXE.MALE, libelle: T.ficheSexe(false) },
        ].map(({ valeur, libelle }) => (
          <Pressable
            key={valeur}
            accessibilityRole="button"
            onPress={() => setSexe(valeur)}
            style={[commonStyles.chip, valeur === sexe && { backgroundColor: colors.primary }]}
          >
            <Text style={[{ fontWeight: '600', color: colors.text }, valeur === sexe && commonStyles.textWhite]}>{libelle}</Text>
          </Pressable>
        ))}
      </View>

      <FormField label={T.achatVendeur} value={vendeur} onChangeText={setVendeur} />
      <FormField label={T.achatPrix} value={prix} onChangeText={setPrix} keyboardType="decimal-pad" />
      <Text style={commonStyles.muted}>{prixSaisi ? T.achatAvecPrix : T.achatSansPrix}</Text>

      <DateField label={T.achatDate} value={date} onChange={setDate} />

      <Button label={T.achatValider} onPress={valider} loading={enCours} />
    </ScrollView>
  );
}

