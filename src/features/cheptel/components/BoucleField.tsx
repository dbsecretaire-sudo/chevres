import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/shared/theme/colors';
import { useAccentColor } from '@/shared/theme/AccentColorContext';
import { useAppSettings } from '@/features/settings/context/AppSettingsContext';
import { identificationCheptel } from '@/features/settings/settings';
import { especeCourante } from '@/shared/dictionnaire/animaux';
import { ScannerBoucleModal } from '@/features/cheptel/components/ScannerBoucleModal';
import { styles } from '@/shared/styles/cheptel/BoucleField.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { useFondChamp } from '@/shared/theme/FondChampContext';

interface Props {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  /** Un message d'erreur sous le champ (le n° est déjà utilisé, par exemple) : le champ passe en rouge. */
  erreur?: string;
}

/** Champ n° de boucle avec bouton pour le remplir en scannant l'étiquette à la caméra. */
export function BoucleField({ label, value, onChangeText, placeholder, required, erreur }: Props) {
  const accent = useAccentColor();
  const { settings } = useAppSettings();
  // Les animaux saisis ici sont ceux de l'espèce courante : c'est l'indicatif de son cheptel qui précède la boucle.
  const indicatif = identificationCheptel(settings.exploitation, especeCourante()).indicatifMarquage;
  const [scannerOuvert, setScannerOuvert] = useState(false);
  const fond = useFondChamp();

  return (
    <View style={commonStyles.gap6}>
      <Text style={commonStyles.lineSemiBold}>
        {label}
        {required ? <Text style={commonStyles.required}> *</Text> : null}
      </Text>
      <View style={styles.rowStretch}>
        {indicatif ? (
          <View style={styles.indicatifBadge}>
            <Text style={styles.indicatifTexte}>{indicatif}</Text>
          </View>
        ) : null}
        <TextInput
          style={[
            commonStyles.input,
            commonStyles.flex1,
            { backgroundColor: fond },
            erreur && { borderColor: colors.danger },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
        />
        <Pressable style={styles.boutonScan} onPress={() => setScannerOuvert(true)}>
          <Ionicons name="camera" size={22} color={accent} />
        </Pressable>
      </View>

      {erreur ? <Text style={commonStyles.required}>{erreur}</Text> : null}

      <ScannerBoucleModal
        visible={scannerOuvert}
        onClose={() => setScannerOuvert(false)}
        onDetected={onChangeText}
      />
    </View>
  );
}
