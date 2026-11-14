import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { detaillerSaisie, libelleZone, type ChampDetail } from '@/features/administration/services/resumeSaisie';
import { colors } from '@/shared/theme/colors';
import { commonStyles } from '@/shared/styles/commonStyles';

/** Une saisie à détailler : sa zone, la fiche avant et après, son auteur et sa date (ou sa décision). */
export interface SaisieAffichee {
  zone: string;
  contenu: unknown;
  actuel: unknown;
  auteur: string;
  cree_le: string;
}

/** Une ligne du détail : « avant → après » pour un champ modifié, la seule valeur pour un ajout ou une suppression. */
function texteChamp(champ: ChampDetail): string {
  if (champ.apres === undefined) return champ.avant ?? '—';
  if (champ.avant === undefined) return champ.apres;
  return `${champ.avant} → ${champ.apres}`;
}

/** Toutes les informations d'une saisie d'utilisateur, dans une fenêtre : chaque élément, avec ce qui change. */
export function DetailDeLaSaisie({ attente, onFermer }: { attente: SaisieAffichee; onFermer: () => void }) {
  const blocs = detaillerSaisie(attente.actuel, attente.contenu);
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onFermer}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 16 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: 14, padding: 16, maxHeight: '85%', gap: 10 }}>
          <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{libelleZone(attente.zone)}</Text>
          <Text style={commonStyles.muted}>
            {attente.auteur} · {attente.cree_le}
          </Text>
          <ScrollView>
            <View style={{ gap: 12 }}>
              {blocs.map((bloc, i) => (
                <View key={`${i}-${bloc.titre}`} style={{ gap: 4 }}>
                  <Text style={{ fontWeight: '700', color: colors.text }}>{bloc.titre}</Text>
                  {bloc.champs.map((champ) => (
                    <Text key={champ.nom} style={{ color: colors.text }}>
                      {champ.nom} : {texteChamp(champ)}
                    </Text>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
          <Pressable
            accessibilityRole="button"
            onPress={onFermer}
            style={{ paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.primary, alignSelf: 'flex-end' }}
          >
            <Text style={{ color: colors.blanc, fontWeight: '700' }}>Fermer</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
