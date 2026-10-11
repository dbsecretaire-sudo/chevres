import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { FiltreColonne } from '@/shared/components/FiltreColonne';
import type { ListeLots } from '@/features/stock/hooks/useListeLots';
import { basculerControleLot, etatDuLot } from '@/features/stock/services/lots';
import { ETAT_LOT, TRI_LOT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatDateShortFR } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/stock/TableauBoucles.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.lots;

/** Le choix de l'état des lots (tous, en stock, vendus, rappelés), avec le nombre de lots montrés. */
export function FiltresLots({ liste }: { liste: ListeLots }) {
  return (
    <View style={styles.choix}>
      <ChoixDeroulant<ValeurDe<typeof ETAT_LOT>>
        titre={T.titreEtat}
        valeur={liste.etat}
        options={Object.values(ETAT_LOT).map((valeur) => ({ value: valeur, label: T.etat[valeur] }))}
        onChoisir={liste.setEtat}
      />
      <Text style={commonStyles.muted}>{T.nombre(liste.lignes.length)}</Text>
    </View>
  );
}

/**
 * Le tableau des lots d'un fromage : une ligne par fromage, avec sa date de fabrication, sa date de vente (ou « Rappelé ») et la
 * case de son contrôle, qui se coche d'un appui. Un appui sur le titre d'une colonne trie la liste d'après elle. Les fromages entrent
 * par une fabrication (Production › Fromages) et sortent par une vente (Comptabilité) ou un rappel.
 */
export function TableauLots({ liste, onChange }: { liste: ListeLots; onChange: () => void }) {
  const { lignes, tri, trierPar, filtres } = liste;
  /** La colonne dont le menu de filtre est ouvert. */
  const [menu, setMenu] = useState<'numero' | 'fabrication' | 'vente' | 'controle' | null>(null);
  const nomsColonnes = {
    numero: T.colonnes.numero,
    fabrication: T.colonnes.fabrication,
    vente: T.colonnes.vente,
    controle: T.controle,
  };
  const triDeLaColonne = {
    numero: TRI_LOT.NUMERO,
    fabrication: TRI_LOT.FABRICATION,
    vente: TRI_LOT.VENTE,
  } as const;

  /** Le bouton de filtre d'une colonne : coloré quand un filtre est posé. */
  const boutonFiltre = (colonne: 'numero' | 'fabrication' | 'vente' | 'controle') => (
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

  const titreColonne = (colonne: ValeurDe<typeof TRI_LOT>, style: object) => (
    <View style={[styles.celluleEntete, style]}>
      <Pressable
        style={styles.titreColonne}
        onPress={() => trierPar(colonne)}
        hitSlop={6}
        accessibilityLabel={T.triPar(T.colonnes[colonne])}
      >
        <Text style={[styles.texteEntete, tri === colonne && styles.texteEnteteTrie]}>
          {T.colonnes[colonne]}
        </Text>
      </Pressable>
      {boutonFiltre(colonne)}
    </View>
  );

  return (
    <View style={styles.cadre}>
      <View style={styles.entete}>
        {titreColonne(TRI_LOT.NUMERO, styles.colonneNumero)}
        {titreColonne(TRI_LOT.FABRICATION, styles.colonneDate)}
        {titreColonne(TRI_LOT.VENTE, styles.colonneDate)}
        <View style={[styles.celluleEntete, styles.colonneMorte]}>
          <Text style={styles.titreMorte}>{T.controle}</Text>
          {boutonFiltre('controle')}
        </View>
      </View>
      {lignes.length === 0 ? (
        <Text style={[commonStyles.mutedItalic, styles.vide]}>{T.aucun}</Text>
      ) : (
        <ScrollView style={styles.liste} nestedScrollEnabled>
          {lignes.map((lot, i) => (
            <View key={lot.id} style={[styles.ligne, i > 0 ? styles.ligneSeparee : undefined]}>
              <Text style={[styles.texteLigne, styles.colonneNumero]}>{lot.numero}</Text>
              <Text style={[styles.texteLigne, styles.colonneDate]}>
                {formatDateShortFR(lot.dateFabrication)}
              </Text>
              {etatDuLot(lot) === ETAT_LOT.RAPPELE ? (
                <Text style={[styles.datePose, styles.colonneDate]}>{T.rappele}</Text>
              ) : (
                <Text style={[styles.texteLigne, styles.colonneDate]}>
                  {lot.dateVente ? formatDateShortFR(lot.dateVente) : ''}
                </Text>
              )}
              <Pressable
                style={styles.colonneMorte}
                hitSlop={6}
                onPress={async () => {
                  await basculerControleLot(lot.id);
                  onChange();
                }}
                accessibilityLabel={T.controle}
              >
                <Ionicons
                  name={lot.controleOk ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={colors.text}
                />
              </Pressable>
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
            menu === 'controle'
              ? undefined
              : (sensCroissant) => liste.trierEn(triDeLaColonne[menu], sensCroissant)
          }
          onFermer={() => setMenu(null)}
        />
      ) : null}
    </View>
  );
}
