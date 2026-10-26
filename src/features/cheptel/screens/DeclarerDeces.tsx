import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { listTousLesAnimauxDeLEspece, saveChevre } from '@/features/cheptel/repository/chevres';
import { useEnlevements } from '@/features/lots-animaux/hooks/useEnlevements';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { todayISO } from '@/shared/utils/dates';

/** Les causes d'un décès, comme sur la maquette, avec « perdue en montagne » (la bête n'a pas été retrouvée). */
const CAUSES = [
  { cle: 'maladie', libelle: 'Maladie' },
  { cle: 'accident', libelle: 'Accident' },
  { cle: 'mise-bas', libelle: 'Mise bas' },
  { cle: 'montagne', libelle: 'Perdue en montagne' },
  { cle: 'inconnue', libelle: 'Inconnue' },
] as const;

/**
 * Déclarer un décès : la boucle de l'animal, la cause, le jour, et l'interrupteur « Prévenir l'équarrissage ». Le décès passe la fiche en « morte » et la cause
 * s'écrit dans ses notes ; avec l'interrupteur, un enlèvement d'équarrissage est créé pour ce jour, avec sa boucle (il se complète ensuite avec le bon).
 */
export default function DeclarerDeces() {
  const router = useRouter();
  const { enregistrer } = useEnlevements();
  const [boucle, setBoucle] = useState('');
  const [cause, setCause] = useState<(typeof CAUSES)[number]['cle']>('maladie');
  const [date, setDate] = useState(todayISO());
  const [equarrissage, setEquarrissage] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  const valider = async () => {
    setEnCours(true);
    setMessage(null);
    try {
      const animaux = await listTousLesAnimauxDeLEspece();
      const animal = animaux.find((a) => (a.numeroBoucle ?? '').trim() === boucle.trim() && a.statut === STATUT_CHEVRE.VIVANTE);
      if (!animal) {
        setMessage('Aucune chèvre vivante ne porte ce numéro.');
        return;
      }
      const libelleCause = CAUSES.find((c) => c.cle === cause)?.libelle ?? '';
      await saveChevre({
        ...animal,
        statut: STATUT_CHEVRE.MORTE,
        dateStatut: date,
        notes: [animal.notes, `Décès : ${libelleCause}`].filter(Boolean).join(' · '),
      });
      if (equarrissage) await enregistrer({ date, boucles: boucle.trim() });
      router.back();
    } finally {
      setEnCours(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={commonStyles.gap10} style={{ backgroundColor: colors.background }}>
      <FormField label="Boucle de la chèvre" value={boucle} onChangeText={setBoucle} keyboardType="number-pad" />

      <Text style={commonStyles.cardTitle}>Cause</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CAUSES.map((c) => {
          const actif = cause === c.cle;
          return (
            <Pressable
              key={c.cle}
              accessibilityRole="button"
              accessibilityState={{ selected: actif }}
              onPress={() => setCause(c.cle)}
              style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1, borderColor: actif ? colors.primary : colors.border, backgroundColor: actif ? colors.primary : colors.surface }}
            >
              <Text style={{ fontWeight: '600', color: actif ? colors.blanc : colors.text }}>{c.libelle}</Text>
            </Pressable>
          );
        })}
      </View>

      <DateField label="Date" value={date} onChange={setDate} />

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontWeight: '700', color: colors.text }}>Prévenir l’équarrissage</Text>
          <Text style={{ color: colors.textMuted }}>Ajoute l’enlèvement à la liste</Text>
        </View>
        <Switch value={equarrissage} onValueChange={setEquarrissage} trackColor={{ true: colors.primary }} />
      </View>

      {message ? <Text style={{ color: colors.danger }}>{message}</Text> : null}
      <Button label="Valider le décès" onPress={valider} loading={enCours} disabled={boucle.trim() === ''} />
    </ScrollView>
  );
}
