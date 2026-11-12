import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ConfirmModal } from '@/shared/components/ConfirmModal';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROLE } from '@/shared/constants/roles';
import { useEtablissement } from '@/features/etablissements/context/EtablissementContext';
import { seDeconnecter } from '@/features/sync/synchronisation';
import { useRole } from '@/features/roles/context/RoleContext';
import { styles } from '@/shared/styles/roles/Roles.styles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.roles.choix;

/**
 * « Quel mode ? », demandé une fois l'établissement choisi (le mode vaut pour cet établissement : en changer redemande le mode) — le mode normal (ses saisies simples) d'abord,
 * puis le mode avancé (toute l'application). Un lien ramène au choix de l'établissement.
 */
export function ChoixDuRole() {
  const { choisir, estCompteUtilisateur } = useRole();
  const [deconnexionDemandee, setDeconnexionDemandee] = useState(false);
  const { actif, ouvrirSelecteur, peutChangerEtablissement } = useEtablissement();
  return (
    <SafeAreaView style={styles.page}>
      <View style={styles.contenu}>
        <Text style={styles.detail}>{actif.nom}</Text>
        <Text style={styles.titre}>{T.titre}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => choisir(ROLE.BERGER)}
          style={({ pressed }) => [styles.grosBouton, pressed ? styles.grosBoutonAppuye : null]}
        >
          <Ionicons name="paw" size={52} color={colors.blanc} />
          <Text style={styles.grosTexte}>{T.berger}</Text>
          <Text style={styles.aide}>{T.bergerAide}</Text>
        </Pressable>
        {/* Un compte « utilisateur » n'a ni le mode avancé, ni le choix de l'exploitation. */}
        {estCompteUtilisateur ? null : (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => choisir(ROLE.SECRETAIRE)}
              style={({ pressed }) => [styles.grosBouton, styles.grosBoutonClair, pressed ? styles.grosBoutonAppuye : null]}
            >
              <Ionicons name="briefcase" size={52} color={colors.primary} />
              <Text style={[styles.grosTexte, styles.grosTexteClair]}>{T.secretaire}</Text>
              <Text style={[styles.aide, styles.aideClaire]}>{T.secretaireAide}</Text>
            </Pressable>
            {/* Le modérateur n'a pas le choix de son établissement : le lien n'existe pas pour lui. */}
            {peutChangerEtablissement ? (
              <Pressable style={styles.discret} onPress={ouvrirSelecteur} accessibilityRole="link">
                <Text style={styles.discretTexte}>{T.changerEtablissement}</Text>
              </Pressable>
            ) : null}
          </>
        )}
        {/* Un compte utilisateur n'a que le mode normal : ici, il peut se déconnecter (sinon, rien ne le lui permet en mode normal). */}
        {estCompteUtilisateur ? (
          <Pressable style={styles.discret} onPress={() => setDeconnexionDemandee(true)} accessibilityRole="button">
            <Text style={styles.discretTexte}>Déconnexion</Text>
          </Pressable>
        ) : null}
      </View>
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
    </SafeAreaView>
  );
}
