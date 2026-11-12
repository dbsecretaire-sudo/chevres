import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/shared/components/Button';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { listTousLesAnimauxDeLEspece, saveChevre } from '@/features/cheptel/repository/chevres';
import type { Chevre } from '@/features/cheptel/types';
import { useEnlevements } from '@/features/lots-animaux/hooks/useEnlevements';
import { useConfirmerSortie } from '@/shared/hooks/useConfirmerSortie';
import { STATUT_CHEVRE } from '@/shared/constants/cheptel';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { formatDateFR, todayISO } from '@/shared/utils/dates';

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
 * Une chèvre vivante trouvée par sa boucle demande d'abord confirmation : passer une bête en « morte » ne se défait pas d'un geste.
 */
export default function DeclarerDeces() {
  const router = useRouter();
  const { enregistrer } = useEnlevements();
  const [boucle, setBoucle] = useState('');
  const [cause, setCause] = useState<(typeof CAUSES)[number]['cle']>('maladie');
  const [date, setDate] = useState(todayISO());
  const [equarrissage, setEquarrissage] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  /** La chèvre vivante trouvée, en attente de la confirmation du décès. */
  const [animalAConfirmer, setAnimalAConfirmer] = useState<Chevre | undefined>();
  const [enCours, setEnCours] = useState(false);
  const sortie = useConfirmerSortie(boucle.trim() !== '');

  const libelleCause = CAUSES.find((c) => c.cle === cause)?.libelle ?? '';

  /** Cherche la chèvre vivante par sa boucle, puis demande la confirmation ; rien n'est écrit avant. */
  const verifier = async () => {
    setMessage(null);
    const animaux = await listTousLesAnimauxDeLEspece();
    const animal = animaux.find((a) => (a.numeroBoucle ?? '').trim() === boucle.trim() && a.statut === STATUT_CHEVRE.VIVANTE);
    if (!animal) {
      setMessage('Aucune chèvre vivante ne porte ce numéro.');
      return;
    }
    setAnimalAConfirmer(animal);
  };

  const confirmerDeces = async () => {
    const animal = animalAConfirmer;
    if (!animal) return;
    setAnimalAConfirmer(undefined);
    setEnCours(true);
    try {
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
    <ScrollView contentContainerStyle={[commonStyles.gap10, { padding: 16 }]} style={{ backgroundColor: colors.background }}>
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
      {/* Le bouton reste grisé tant que la boucle est vide : on dit pourquoi, au lieu de le laisser muet. */}
      {boucle.trim() === '' ? <Text style={commonStyles.note}>Saisissez la boucle de la chèvre pour déclarer son décès.</Text> : null}
      <Button label="Valider le décès" onPress={verifier} loading={enCours} disabled={boucle.trim() === ''} />

      <ConfirmModal
        visible={!!animalAConfirmer}
        title={`Déclarer ${boucle.trim()} morte ?`}
        message={`Elle passera en « morte » au ${formatDateFR(date)} (${libelleCause}).${equarrissage ? ' Un enlèvement d’équarrissage sera ajouté à la liste.' : ''}`}
        confirmLabel="Déclarer le décès"
        onCancel={() => setAnimalAConfirmer(undefined)}
        onConfirm={confirmerDeces}
      />
      <ConfirmModal
        visible={sortie.enAttente}
        title={TEXTES.commun.sortieSansEnregistrer.titre}
        message={TEXTES.commun.sortieSansEnregistrer.message}
        confirmLabel={TEXTES.commun.sortieSansEnregistrer.quitter}
        onCancel={sortie.rester}
        onConfirm={sortie.quitter}
      />
    </ScrollView>
  );
}
