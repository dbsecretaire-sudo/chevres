import { useState } from 'react';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ROUTES } from '@/shared/constants/routes';
import { TEXTES } from '@/shared/textes';

/** Menu discret dans l'en-tête de Comptabilité : détail, fournisseurs, clients et fiscalité. */
export function ComptabiliteHeaderMenu() {
  const router = useRouter();
  useEtablissement();
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <Pressable style={commonStyles.boutonCompact} onPress={() => setOuvert(true)}>
        <Ionicons name="ellipsis-vertical" size={22} color="#fff" />
      </Pressable>
      <OptionsModal
        visible={ouvert}
        onClose={() => setOuvert(false)}
        title={TEXTES.commun.general.comptabilite}
        options={[
          {
            label: TEXTES.commun.general.detail,
            icon: 'bar-chart',
            onPress: () => router.push(ROUTES.COMPTABILITE_DETAIL),
          },
          {
            label: TEXTES.commun.general.fournisseurs,
            icon: 'people',
            onPress: () => router.push(ROUTES.FOURNISSEURS),
          },
          {
            label: TEXTES.commun.general.clients,
            icon: 'person',
            onPress: () => router.push(ROUTES.CLIENTS),
          },
          {
            label: TEXTES.comptabilite.fiscalite.titre,
            icon: 'receipt',
            onPress: () => router.push(ROUTES.FISCALITE),
          },
        ]}
      />
    </>
  );
}
