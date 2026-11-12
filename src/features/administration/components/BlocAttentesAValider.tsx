import { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { appeler, exploitationDeLaConnexion, lireConnexion } from '@/features/sync/synchronisation';
import { ROUTES } from '@/shared/constants/routes';
import { colors } from '@/shared/theme/colors';

/** Une saisie d'utilisateur en attente, telle que le serveur la renvoie (seul l'auteur sert ici). */
interface AttenteResumee {
  auteur: string;
}

/**
 * Sous les rappels de l'accueil, pour le modérateur : une ligne par utilisateur qui a des modifications à valider (« Modification de … à valider »).
 * Rien pour un utilisateur, ni quand il n'y a rien à valider. Un appui ouvre l'administration, où on les valide.
 */
export function BlocAttentesAValider() {
  const router = useRouter();
  const [parAuteur, setParAuteur] = useState<[string, number][]>([]);

  // Rechargé à chaque retour sur l'accueil : une saisie validée ou refusée dans l'administration disparaît d'ici.
  useFocusEffect(
    useCallback(() => {
      let actif = true;
      lireConnexion()
        .then(async (connexion) => {
          // Un utilisateur (ou un compte sans connexion) ne voit pas les saisies des autres.
          if (!connexion || connexion.role === 'utilisateur') return;
          const reponse = await appeler('attentes', 'GET', {
            jeton: connexion.jeton,
            parametres: `&etablissement=${await exploitationDeLaConnexion()}`,
          });
          if (!actif || reponse.statut !== 200) return;
          const compte = new Map<string, number>();
          for (const attente of (reponse.json.attentes ?? []) as AttenteResumee[]) {
            compte.set(attente.auteur, (compte.get(attente.auteur) ?? 0) + 1);
          }
          setParAuteur([...compte.entries()]);
        })
        .catch(() => undefined);
      return () => {
        actif = false;
      };
    }, []),
  );

  if (parAuteur.length === 0) return null;
  return (
    <View style={{ gap: 8 }}>
      {parAuteur.map(([auteur, nombre]) => (
        <Pressable
          key={auteur}
          accessibilityRole="button"
          onPress={() => router.push(ROUTES.ADMINISTRATION as never)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderRadius: 14, borderWidth: 1, borderColor: colors.border, padding: 14 }}
        >
          <Ionicons name="create-outline" size={22} color={colors.primary} />
          <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: colors.text }}>
            {`Modification de ${auteur} à valider`}
          </Text>
          <View style={{ minWidth: 26, height: 26, borderRadius: 13, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Text style={{ color: colors.blanc, fontWeight: '800', fontSize: 13 }}>{nombre}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}
