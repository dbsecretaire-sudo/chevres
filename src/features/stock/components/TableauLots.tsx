import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { FiltreColonne } from '@/shared/components/FiltreColonne';
import type { ListeLots } from '@/features/stock/hooks/useListeLots';
import { DateFabricationModal } from '@/features/stock/components/DateFabricationModal';
import {
  basculerControleLot,
  controlerLots,
  etatDuLot,
  lotsDeLaFabrication,
  modifierDateFabrication,
} from '@/features/stock/services/lots';
import type { LotFromage } from '@/features/stock/types';
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
export function TableauLots({
  liste,
  onChange,
  selection,
  onBasculer,
}: {
  liste: ListeLots;
  onChange: () => void;
  /** Le mode « réserver / facturer » : les lots choisis, et leur bascule d'un appui sur la ligne. */
  selection?: ReadonlySet<string>;
  onBasculer?: (lot: LotFromage) => void;
}) {
  const { lignes, tri, trierPar, filtres, tousLesLots } = liste;
  /** Le lot dont on modifie la date de fabrication. */
  const [lotADater, setLotADater] = useState<LotFromage | undefined>();
  /** Tous les lots montrés sont contrôlés : « Tout cocher » devient « Tout décocher ». */
  const toutControle = lignes.length > 0 && lignes.every((l) => l.controleOk);
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
      {lignes.length > 0 ? (
        <View style={styles.barreActions}>
          <Pressable
            hitSlop={8}
            onPress={async () => {
              await controlerLots(
                lignes.map((l) => l.id),
                !toutControle,
              );
              onChange();
            }}
          >
            <Text style={commonStyles.lien}>
              {toutControle ? T.toutDecontroler : T.toutControler(lignes.length)}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {lignes.length === 0 ? (
        <Text style={[commonStyles.mutedItalic, styles.vide]}>{T.aucun}</Text>
      ) : (
        <ScrollView style={styles.liste} nestedScrollEnabled>
          {lignes.map((lot, i) => (
            <Pressable
              key={lot.id}
              disabled={!onBasculer}
              onPress={() => onBasculer?.(lot)}
              style={[
                styles.ligne,
                i > 0 ? styles.ligneSeparee : undefined,
                selection?.has(lot.id) ? { backgroundColor: colors.badgeBg } : undefined,
              ]}
            >
              <Text style={[styles.texteLigne, styles.colonneNumero]}>{lot.numero}</Text>
              <Pressable style={styles.colonneDate} hitSlop={6} onPress={() => setLotADater(lot)}>
                <Text style={[styles.texteLigne, styles.dateModifiable]}>
                  {formatDateShortFR(lot.dateFabrication)}
                </Text>
              </Pressable>
              {etatDuLot(lot) === ETAT_LOT.RAPPELE ? (
                <Text style={[styles.datePose, styles.colonneDate]}>{T.rappele}</Text>
              ) : (
                <Text style={[styles.texteLigne, styles.colonneDate]}>
                  {lot.dateVente
                    ? formatDateShortFR(lot.dateVente)
                    : lot.reservation
                      ? T.reserve
                      : ''}
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
            </Pressable>
          ))}
        </ScrollView>
      )}
      <DateFabricationModal
        visible={!!lotADater}
        lot={lotADater}
        nombreDeLots={lotADater ? lotsDeLaFabrication(tousLesLots, lotADater).length : 0}
        onValider={async (date) => {
          if (lotADater) await modifierDateFabrication(lotADater.id, date);
          setLotADater(undefined);
          onChange();
        }}
        onFermer={() => setLotADater(undefined)}
      />
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
