import { useState } from 'react';
import { ScrollView, Pressable, Text, View } from 'react-native';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { useRouter } from 'expo-router';
import { changerAffichage } from '@/bureau/changerAffichage';
import { GroupeAccueil } from '@/features/accueil/components/GroupeAccueil';
import { MenusRepliables } from '@/features/accueil/components/MenusRepliables';
import { SectionsRubrique } from '@/features/accueil/components/SectionsRubrique';
import { RUBRIQUES } from '@/features/accueil/rubriques/rubriquesDuPlus';
import { CarteModeAvance } from '@/features/settings/components/CarteModeAvance';
import { seDeconnecter } from '@/features/sync/synchronisation';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';
import { AFFICHAGE, modeAffichage, type ModeAffichage } from '@/shared/utils/affichage';
import { estBureau } from '@/shared/utils/plateforme';

/**
 * La page « Plus » : l'exploitation (agritourisme, établissement, listes, contacts, données, réglages), puis le mode avancé,
 * l'administration et la déconnexion, et l'affichage.
 */
export default function EcranPlus() {
  const router = useRouter();
  // Sous Windows, les autres affichages (version Windows soft, mobile, sobre) : un choix recharge la fenêtre.
  const autresAffichages: ModeAffichage[] = estBureau() ? Object.values(AFFICHAGE).filter((mode) => mode !== modeAffichage) : [];
  const [deconnexionDemandee, setDeconnexionDemandee] = useState(false);
  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 10 }} style={{ backgroundColor: colors.background }}>
      <MenusRepliables>
      <SectionsRubrique sections={RUBRIQUES.reglages.sections} />
      <GroupeAccueil titre="Plus">
        <CarteModeAvance />
        <BlocLignes>
          <ListRow
            title="Administrateur"
            subtitle="Comptes, rôles et saisies à valider"
            icone="shield-outline"
            onPress={() => router.push(ROUTES.ADMINISTRATION as never)}
          />
          {/* Se déconnecter du compte de la ferme : le mode avancé se referme jusqu'à la prochaine connexion. */}
          <ListRow title="Déconnexion" icone="log-out-outline" onPress={() => setDeconnexionDemandee(true)} />
        </BlocLignes>
      </GroupeAccueil>
      </MenusRepliables>
      {autresAffichages.length > 0 ? (
        <View style={{ gap: 10, marginTop: 8 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '700' }}>{TEXTES.navigation.affichage.titre}</Text>
          {autresAffichages.map((mode) => (
            <Pressable
              key={mode}
              accessibilityRole="button"
              onPress={() => changerAffichage(mode)}
              style={{ backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}
            >
              <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{TEXTES.navigation.affichage[mode]}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <ConfirmModal
        visible={deconnexionDemandee}
        title="Déconnexion"
        message="Voulez-vous vraiment vous déconnecter de l’application ?"
        confirmLabel="Se déconnecter"
        onCancel={() => setDeconnexionDemandee(false)}
        onConfirm={() => {
          setDeconnexionDemandee(false);
          seDeconnecter().catch(() => undefined);
        }}
      />
    </ScrollView>
  );
}
