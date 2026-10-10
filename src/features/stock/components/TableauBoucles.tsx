import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { bouclesDeLInventaire, trierBoucles } from '@/features/stock/services/boucles';
import type { BoucleStock } from '@/features/stock/types';
import { ETAT_BOUCLE, TRI_BOUCLE } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatDateShortFR } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/stock/TableauBoucles.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.boucles;

interface Props {
  /** Toutes les boucles de l'inventaire. */
  boucles: BoucleStock[];
  /** L'article dont on montre les boucles (« boucle:boucles » ou « boucle:rouges »). */
  article: string;
}

/**
 * Le détail d'une sorte de boucles : une ligne par numéro, avec sa date de pose et sa date d'achat. On choisit les boucles
 * à poser ou les posées, et un appui sur le titre d'une colonne trie la liste d'après elle. C'est la même vue dans
 * l'inventaire et dans les contrôles : l'inventaire des boucles ne se modifie qu'en comptabilité (achat) et au cheptel (pose).
 */
export function TableauBoucles({ boucles, article }: Props) {
  const [etat, setEtat] = useState<ValeurDe<typeof ETAT_BOUCLE>>(ETAT_BOUCLE.TOUT);
  const [tri, setTri] = useState<ValeurDe<typeof TRI_BOUCLE>>(TRI_BOUCLE.NUMERO);
  const [croissant, setCroissant] = useState(true);

  const lignes = trierBoucles(bouclesDeLInventaire({ boucles }, etat, article), tri, croissant);

  const trierPar = (colonne: ValeurDe<typeof TRI_BOUCLE>) => {
    if (colonne === tri) setCroissant(!croissant);
    else {
      setTri(colonne);
      setCroissant(true);
    }
  };

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
    <View style={commonStyles.gap10}>
      <View style={styles.choix}>
        <ChoixDeroulant<ValeurDe<typeof ETAT_BOUCLE>>
          titre={T.titreEtat}
          valeur={etat}
          options={Object.values(ETAT_BOUCLE).map((valeur) => ({ value: valeur, label: T.etat[valeur] }))}
          onChoisir={setEtat}
        />
        <Text style={commonStyles.muted}>{T.nombre(lignes.length)}</Text>
      </View>
      <View style={styles.cadre}>
        <View style={styles.entete}>
          {titreColonne(TRI_BOUCLE.NUMERO, styles.colonneNumero)}
          {titreColonne(TRI_BOUCLE.POSE, styles.colonneDate)}
          {titreColonne(TRI_BOUCLE.ACHAT, styles.colonneDate)}
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
                  {b.datePose ? formatDateShortFR(b.datePose) : ''}
                </Text>
                <Text style={[styles.texteLigne, styles.colonneDate]}>{formatDateShortFR(b.dateAchat)}</Text>
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}
