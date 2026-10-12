import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExplicationModal, type Explication } from '@/shared/components/ExplicationModal';
import { InfoModal } from '@/shared/components/InfoModal';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

interface Props {
  label: string;
  required?: boolean;
  /** Une explication longue : un « ? » à côté du nom l'ouvre dans une fenêtre (plutôt qu'un long texte sous le champ). */
  explication?: Explication;
}

/** Le nom d'un champ (ou d'une valeur calculée), avec un « ? » qui ouvre son explication dans une fenêtre quand il en a une. */
export function LibelleChamp({ label, required, explication }: Props) {
  const [ouverte, setOuverte] = useState(false);
  return (
    <View style={commonStyles.rowCentre}>
      <Text style={commonStyles.lineSemiBold}>
        {label}
        {required ? <Text style={commonStyles.required}> *</Text> : null}
      </Text>
      {explication ? (
        <>
          <Pressable onPress={() => setOuverte(true)} hitSlop={8} accessibilityLabel={label}>
            <Ionicons name="help-circle-outline" size={20} color={colors.textMuted} />
          </Pressable>
          {typeof explication === 'string' ? (
            <InfoModal
              visible={ouverte}
              title={label}
              message={explication}
              onClose={() => setOuverte(false)}
            />
          ) : (
            <ExplicationModal
              visible={ouverte}
              titre={label}
              explication={explication}
              onClose={() => setOuverte(false)}
            />
          )}
        </>
      ) : null}
    </View>
  );
}
