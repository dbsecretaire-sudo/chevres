import { ScrollView, StyleSheet, Text } from 'react-native';
import type { EntreeDeColonne } from '@/features/accueil/ferme/typesFerme';
import { BlocLignes } from '@/shared/components/BlocListe';
import { ListRow } from '@/shared/components/ListRow';
import { commonStyles } from '@/shared/styles/commonStyles';
import { colors } from '@/shared/theme/colors';
import { TEXTES } from '@/shared/textes';

/** Une ligne de ce que le côté garde ou compte (« 12 animaux vivants », « Stock insuffisant ! »). */
export interface LigneDeResume {
  cle: string;
  texte: string;
  alerte?: boolean;
}

interface Props {
  titre: string;
  resume: readonly LigneDeResume[];
  intervenants: readonly EntreeDeColonne[];
  gestion: readonly EntreeDeColonne[];
  onIntervenant: (cle: string) => void;
  onGestion: (cle: string) => void;
}

/** Un nombre à droite d'une ligne : les lots à facturer, les rappels à valider. */
const Nombre = ({ valeur }: { valeur?: number }) =>
  valeur ? <Text style={styles.nombre}>{valeur}</Text> : null;

/**
 * L'accueil de l'affichage sobre : sans scène ni dessin, en nuances de gris. Les mêmes informations et la même organisation que l'accueil dessiné : ce que garde le
 * côté (l'exploitation, l'atelier ou l'agritourisme), la gestion, puis les intervenants, en listes.
 */
export function AccueilSobre({ titre, resume, intervenants, gestion, onIntervenant, onGestion }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.contenu}>
      <Text style={commonStyles.subheading}>{titre}</Text>
      <BlocLignes>
        {resume.map((l) => (
          <Text key={l.cle} style={[styles.resume, l.alerte && styles.alerte]}>
            {l.alerte ? `⚠ ${l.texte}` : l.texte}
          </Text>
        ))}
      </BlocLignes>
      <Text style={styles.section}>{TEXTES.accueil.ferme.gestion}</Text>
      <BlocLignes>
        {gestion.map((e) => (
          <ListRow key={e.cle} title={e.titre} trailing={<Nombre valeur={e.pastille} />} onPress={() => onGestion(e.cle)} />
        ))}
      </BlocLignes>
      <Text style={styles.section}>{TEXTES.accueil.ferme.intervenants}</Text>
      <BlocLignes>
        {intervenants.map((e) => (
          <ListRow key={e.cle} title={e.titre} trailing={<Nombre valeur={e.pastille} />} onPress={() => onIntervenant(e.cle)} />
        ))}
      </BlocLignes>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: { gap: 10, paddingBottom: 16 },
  section: { fontSize: 13, fontWeight: '800', color: colors.textMuted, textTransform: 'uppercase', marginTop: 8 },
  resume: { fontSize: 15, color: colors.text },
  alerte: { fontWeight: '800', color: colors.danger },
  nombre: { fontSize: 14, fontWeight: '800', color: colors.text },
});
