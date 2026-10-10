import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import type { ListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import { ETAT_BOUCLE, TRI_BOUCLE } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatDateShortFR } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/stock/TableauBoucles.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.boucles;

/** Le choix de la liste des boucles (l'état : toutes, posées ou à poser), avec le nombre de boucles montrées. */
export function FiltresBoucles({ liste }: { liste: ListeBoucles }) {
  return (
    <View style={styles.choix}>
      <ChoixDeroulant<ValeurDe<typeof ETAT_BOUCLE>>
        titre={T.titreEtat}
        valeur={liste.etat}
        options={Object.values(ETAT_BOUCLE).map((valeur) => ({ value: valeur, label: T.etat[valeur] }))}
        onChoisir={liste.setEtat}
      />
      <Text style={commonStyles.muted}>{T.nombre(liste.lignes.length)}</Text>
    </View>
  );
}

/**
 * Le tableau des boucles : une ligne par numéro, avec sa date de pose et sa date d'achat, et une case cochée quand l'animal qui la
 * porte n'est plus vivant. Un appui sur le titre d'une colonne trie la liste d'après elle. C'est la même vue dans l'inventaire et
 * dans les contrôles : l'inventaire des boucles ne se modifie qu'en comptabilité (achat) et au cheptel (pose).
 */
export function TableauBoucles({ liste }: { liste: ListeBoucles }) {
  const { lignes, tri, croissant, trierPar, morts, etat } = liste;

  const titreColonne = (colonne: ValeurDe<typeof TRI_BOUCLE>, style: object) => (
    <Pressable
      style={[styles.titreColonne, style]}
      onPress={() => trierPar(colonne)}
      hitSlop={6}
      accessibilityLabel={T.triPar(T.colonnes[colonne])}
    >
      <Text style={styles.texteEntete}>{T.colonnes[colonne]}</Text>
      {tri === colonne ? (
        <Ionicons name={croissant ? 'arrow-up' : 'arrow-down'} size={12} color={colors.textMuted} />
      ) : null}
    </Pressable>
  );

  return (
    <View style={styles.cadre}>
      <View style={styles.entete}>
        {titreColonne(TRI_BOUCLE.NUMERO, styles.colonneNumero)}
        {titreColonne(TRI_BOUCLE.POSE, styles.colonneDate)}
        {titreColonne(TRI_BOUCLE.ACHAT, styles.colonneDate)}
        <View style={styles.colonneMorte}>
          <Text style={styles.titreMorte}>{T.morte}</Text>
        </View>
      </View>
      {lignes.length === 0 ? (
        <Text style={[commonStyles.mutedItalic, styles.vide]}>
          {etat === ETAT_BOUCLE.POSEE
            ? T.aucunePosee
            : etat === ETAT_BOUCLE.NON_POSEE
              ? T.aucuneNonPosee
              : T.aucuneBoucle}
        </Text>
      ) : (
        <ScrollView style={styles.liste} nestedScrollEnabled>
          {lignes.map((b, i) => (
            <View key={b.id} style={[styles.ligne, i > 0 ? styles.ligneSeparee : undefined]}>
              <Text style={[styles.texteLigne, styles.colonneNumero]}>{b.numero}</Text>
              <Text style={[styles.datePose, styles.colonneDate]}>
                {b.datePose ? formatDateShortFR(b.datePose) : b.chevreId ? T.posee : ''}
              </Text>
              <Text style={[styles.texteLigne, styles.colonneDate]}>{formatDateShortFR(b.dateAchat)}</Text>
              <View style={styles.colonneMorte}>
                <Ionicons
                  name={b.chevreId && morts.has(b.chevreId) ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={colors.text}
                  accessibilityLabel={T.morte}
                />
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
