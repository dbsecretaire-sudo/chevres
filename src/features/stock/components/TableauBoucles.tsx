import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { FiltreColonne } from '@/shared/components/FiltreColonne';
import type { ListeBoucles } from '@/features/stock/hooks/useListeBoucles';
import {
  estArticleRebouclage,
  estBoucleDeRemplacement,
  nePasPoser,
  texteDeLaRemarque,
} from '@/features/stock/services/boucles';
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
export function TableauBoucles({ liste, pleinePage = false }: { liste: ListeBoucles; pleinePage?: boolean }) {
  const { lignes, tri, trierPar, morts, etat, filtres } = liste;
  /** La boucle de remplacement (rouge, rebouclage) s'achète en quantité : son numéro est celui de remplacement (vide tant qu'elle est en stock), avec sa date d'achat. */
  const rouge = estBoucleDeRemplacement(liste.article);
  const rebouclage = estArticleRebouclage(liste.article);
  const titreNumero = rouge ? T.numeroRemplacement : T.colonnes.numero;
  const titrePose = rebouclage ? T.poseRebouclage : rouge ? T.poseRouge : T.colonnes.pose;
  /** La colonne dont le menu de filtre est ouvert. */
  const [menu, setMenu] = useState<'numero' | 'pose' | 'achat' | 'morte' | null>(null);
  const nomsColonnes = {
    numero: titreNumero,
    pose: titrePose,
    achat: T.colonnes.achat,
    morte: T.morte,
  };
  const triDeLaColonne = {
    numero: TRI_BOUCLE.NUMERO,
    pose: TRI_BOUCLE.POSE,
    achat: TRI_BOUCLE.ACHAT,
  } as const;

  /** Le bouton de filtre d'une colonne : coloré quand un filtre est posé. */
  const boutonFiltre = (colonne: 'numero' | 'pose' | 'achat' | 'morte') => (
    <Pressable
      onPress={() => setMenu(colonne)}
      hitSlop={6}
      accessibilityLabel={TEXTES.commun.filtreColonne.filtrer(nomsColonnes[colonne])}
    >
      <Ionicons
        name="arrow-down"
        size={filtres.actif(colonne) ? 14 : 12}
        color={filtres.actif(colonne) ? colors.primary : colors.textMuted}
      />
    </Pressable>
  );

  const titreColonne = (colonne: ValeurDe<typeof TRI_BOUCLE>, style: object) => (
    <View style={[styles.celluleEntete, style]}>
      <Pressable
        style={styles.titreColonne}
        onPress={() => trierPar(colonne)}
        hitSlop={6}
        accessibilityLabel={T.triPar(T.colonnes[colonne])}
      >
        <Text style={[styles.texteEntete, tri === colonne && styles.texteEnteteTrie]}>
          {colonne === TRI_BOUCLE.NUMERO
            ? titreNumero
            : colonne === TRI_BOUCLE.POSE
              ? titrePose
              : T.colonnes[colonne]}
        </Text>
      </Pressable>
      {boutonFiltre(colonne)}
    </View>
  );

  return (
    <View style={styles.cadre}>
      <View style={styles.entete}>
        {titreColonne(TRI_BOUCLE.NUMERO, styles.colonneNumero)}
        {titreColonne(TRI_BOUCLE.POSE, styles.colonneDate)}
        {titreColonne(TRI_BOUCLE.ACHAT, styles.colonneDate)}
        <View style={[styles.celluleEntete, styles.colonneMorte]}>
          <Text style={styles.titreMorte}>{T.morte}</Text>
          {boutonFiltre('morte')}
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
        <ScrollView style={pleinePage ? undefined : styles.liste} nestedScrollEnabled>
          {lignes.map((b, i) => (
            <View key={b.id} style={[styles.ligne, i > 0 ? styles.ligneSeparee : undefined]}>
              <View style={styles.colonneNumero}>
                <Text style={styles.texteLigne}>{b.numero}</Text>
                {b.remarque ? <Text style={styles.remarqueBoucle}>{texteDeLaRemarque(b.remarque)}</Text> : null}
              </View>
              {nePasPoser(b) ? (
                <View style={styles.colonneDate}>
                  <Ionicons name="ban" size={18} color={colors.danger} accessibilityLabel={T.nePasPoser} />
                </View>
              ) : (
                <Text style={[styles.datePose, styles.colonneDate]}>
                  {b.datePose ? formatDateShortFR(b.datePose) : b.chevreId ? T.posee : ''}
                </Text>
              )}
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
      {menu ? (
        <FiltreColonne
          key={menu}
          visible
          colonne={nomsColonnes[menu]}
          valeurs={liste.valeursDeLaColonne(menu)}
          gardees={filtres.gardees(menu)}
          onAppliquer={(gardees) => filtres.appliquer(menu, gardees)}
          onTrier={
            menu === 'morte'
              ? undefined
              : (sensCroissant) => liste.trierEn(triDeLaColonne[menu], sensCroissant)
          }
          onFermer={() => setMenu(null)}
        />
      ) : null}
    </View>
  );
}
