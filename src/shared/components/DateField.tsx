import { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors } from '@/shared/theme/colors';
import {
  aujourdhuiDansLAnnee,
  depuisJourMoisAnnee,
  enJourMoisAnnee,
  estDateISO,
  formatDateFR,
  jourEtMois,
  toISODate,
} from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { HEURE_MIDI } from '@/shared/constants/temps';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.commun.dateField;

interface Props {
  label: string;
  value: string; // ISO YYYY-MM-DD
  onChange: (iso: string) => void;
  required?: boolean;
  /**
   * Une année imposée (le filtre d'une période, quand une année active est choisie) : le champ commence par « 2025- » et on n'en
   * complète que le mois et le jour ; le choix d'une date reste dans cette année. Absente : l'année est libre.
   */
  anneeImposee?: number;
  /** Vrai : la date s'écrit jour d'abord, « JJ-MM-AAAA » (les filtres), au lieu de « AAAA-MM-JJ ». */
  jourMoisAnnee?: boolean;
}

export function DateField({ label, value, onChange, required, anneeImposee, jourMoisAnnee }: Props) {
  const [showPicker, setShowPicker] = useState(false);
  // Sur le web on tape la date : le texte en cours de saisie reste ici, et seule une vraie date remonte au formulaire.
  /** Ce que le champ montre d'une valeur : « JJ-MM » (année imposée), « JJ-MM-AAAA », ou la date telle quelle. */
  const affichageDe = (iso: string) =>
    jourMoisAnnee ? (anneeImposee ? jourEtMois(iso) : enJourMoisAnnee(iso)) : iso;
  const [saisie, setSaisie] = useState(affichageDe(value));
  const [valeurVue, setValeurVue] = useState(value);
  if (valeurVue !== value) {
    // La valeur a changé de l'extérieur (chargement, bouton) : la saisie la suit.
    setValeurVue(value);
    setSaisie(affichageDe(value));
  }
  /** Le début d'une date de l'année imposée (« 2025- »), qu'on ne peut pas effacer. */
  const prefixe = anneeImposee ? `${anneeImposee}-` : '';

  const aide = anneeImposee ? (
    <>
      <Text style={commonStyles.note}>
        {jourMoisAnnee ? (anneeImposee ? T.formatJourMois : T.formatJourMoisAnnee) : T.format}
      </Text>
      <Text style={commonStyles.note}>{T.anneeImposee}</Text>
    </>
  ) : null;

  if (Platform.OS === 'web' && jourMoisAnnee) {
    // « JJ-MM-AAAA » ; avec une année imposée, on n'écrit que le jour et le mois (« JJ-MM »).
    const invalide = saisie !== '' && !depuisJourMoisAnnee(saisie, anneeImposee);
    const bordure = invalide ? { borderColor: colors.danger } : undefined;
    const surChangement = (texte: string) => {
      // Quand l'année est imposée, le tiret se met seul entre le jour et le mois (« 1001 » devient « 10-01 »).
      const chiffres = anneeImposee ? texte.replace(/[^\d-]/g, '').slice(0, 5) : texte;
      const propre =
        anneeImposee && /^\d{3,4}$/.test(chiffres)
          ? `${chiffres.slice(0, 2)}-${chiffres.slice(2)}`
          : chiffres;
      const nouveau =
        anneeImposee && /^\d{2}$/.test(propre) && propre.length > saisie.length ? `${propre}-` : propre;
      setSaisie(nouveau);
      if (nouveau === '') onChange('');
      else {
        const iso = depuisJourMoisAnnee(nouveau, anneeImposee);
        if (iso) onChange(iso);
      }
    };
    return (
      <View style={commonStyles.gap6}>
        <Text style={commonStyles.lineSemiBold}>
          {label}
          {required ? <Text style={commonStyles.required}> *</Text> : null}
        </Text>
        <TextInput
          style={[commonStyles.inputBox, bordure]}
          value={saisie}
          onChangeText={surChangement}
          placeholder={anneeImposee ? T.jourMois : T.jourMoisAnnee}
          placeholderTextColor={colors.textMuted}
          maxLength={anneeImposee ? 5 : undefined}
        />
        <Text style={invalide ? commonStyles.required : commonStyles.note}>
          {anneeImposee ? T.formatJourMois : T.formatJourMoisAnnee}
        </Text>
        {anneeImposee ? (
          <Text style={invalide ? commonStyles.required : commonStyles.note}>{T.anneeImposee}</Text>
        ) : null}
      </View>
    );
  }

  if (Platform.OS === 'web') {
    const affiche = anneeImposee ? saisie || prefixe : saisie;
    // Une date de l'année imposée pas encore complétée (« 2025- » seul) n'est pas une erreur tant qu'on n'y a rien écrit.
    const invalide = affiche !== '' && affiche !== prefixe && !estDateISO(affiche);
    return (
      <View style={commonStyles.gap6}>
        <Text style={commonStyles.lineSemiBold}>
          {label}
          {required ? <Text style={commonStyles.required}> *</Text> : null}
        </Text>
        <TextInput
          style={[commonStyles.inputBox, invalide && { borderColor: colors.danger }]}
          value={affiche}
          onChangeText={(texte) => {
            // L'année imposée reste : ce qu'on écrit avant ou à la place de « 2025- » est ramené à l'année choisie.
            const nouveau = anneeImposee ? prefixe + texte.replace(/^\d{0,4}-?/, '') : texte;
            setSaisie(nouveau);
            if (anneeImposee && nouveau === prefixe) onChange('');
            else if (estDateISO(nouveau)) onChange(nouveau);
          }}
          placeholder={T.aaaaMmJj}
          placeholderTextColor={colors.textMuted}
        />
        {anneeImposee ? (
          <>
            <Text style={invalide ? commonStyles.required : commonStyles.note}>{T.format}</Text>
            <Text style={invalide ? commonStyles.required : commonStyles.note}>{T.anneeImposee}</Text>
          </>
        ) : invalide ? (
          <Text style={commonStyles.required}>{T.invalide}</Text>
        ) : null}
      </View>
    );
  }

  const dateValue = value
    ? new Date(`${value}${HEURE_MIDI}`)
    : anneeImposee
      ? new Date(`${aujourdhuiDansLAnnee(anneeImposee)}${HEURE_MIDI}`)
      : new Date();

  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineSemiBold}>
        {label}
        {required ? <Text style={commonStyles.required}> *</Text> : null}
      </Text>
      <Pressable style={commonStyles.inputBox} onPress={() => setShowPicker(true)}>
        <Text style={commonStyles.valueText}>
          {value
            ? jourMoisAnnee
              ? affichageDe(value)
              : formatDateFR(value)
            : anneeImposee && jourMoisAnnee
              ? T.jourMois
              : prefixe}
        </Text>
      </Pressable>
      {aide}
      {showPicker && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          // Une année imposée : on ne choisit qu'une date de cette année.
          minimumDate={anneeImposee ? new Date(`${anneeImposee}-01-01${HEURE_MIDI}`) : undefined}
          maximumDate={anneeImposee ? new Date(`${anneeImposee}-12-31${HEURE_MIDI}`) : undefined}
          onValueChange={(_event, selected) => {
            onChange(toISODate(selected));
            if (Platform.OS === 'android') setShowPicker(false);
          }}
          onDismiss={() => setShowPicker(false)}
        />
      )}
    </View>
  );
}
