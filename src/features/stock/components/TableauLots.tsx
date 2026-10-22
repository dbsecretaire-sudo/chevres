import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ChoixDeroulant } from '@/shared/components/ChoixDeroulant';
import { OptionsModal } from '@/shared/components/OptionsModal';
import { NomModal } from '@/features/dossiers/components/NomModal';
import { exporterEtiquettesLotPdf } from '@/features/export/etiquettesLotPdf';
import { exporterTracabiliteLotPdf } from '@/features/export/tracabiliteLotPdf';
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
import { detailDuLotDePlat } from '@/features/stock/services/detailDuPlat';
import type { ArchiveStock, LotFromage } from '@/features/stock/types';
import { ETAT_LOT, TRI_LOT } from '@/shared/constants/stock';
import type { ValeurDe } from '@/shared/constants/valeurDe';
import { colors } from '@/shared/theme/colors';
import { formatDateShortFR } from '@/shared/utils/dates';
import { commonStyles } from '@/shared/styles/commonStyles';
import { styles } from '@/shared/styles/stock/TableauBoucles.styles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.stock.lots;

/** Une impression qui échoue le dit, au lieu de ne rien faire. */
const imprimer = (impression: Promise<void>) =>
  impression.catch((e: unknown) => Alert.alert(T.erreurImpression, e instanceof Error ? e.message : ''));

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
  archive,
}: {
  liste: ListeLots;
  onChange: () => void;
  /** Le stock, pour dire sous un lot de plat préparé sa stérilisation, sa durabilité et ses ingrédients. */
  archive?: ArchiveStock | null;
  /** Le mode « réserver / facturer » : les lots choisis, et leur bascule d'un appui sur la ligne. */
  selection?: ReadonlySet<string>;
  onBasculer?: (lot: LotFromage) => void;
}) {
  const { lignes, tri, trierPar, filtres, tousLesLots } = liste;
  /** Le lot dont on modifie la date de fabrication. */
  const [lotADater, setLotADater] = useState<LotFromage | undefined>();
  /** Le lot dont on imprime l'étiquette ou la fiche de traçabilité, et l'étiquette en attente du contenu net. */
  const [lotAImprimer, setLotAImprimer] = useState<LotFromage | undefined>();
  const [etiquetteDe, setEtiquetteDe] = useState<LotFromage | undefined>();
  /** Un lot rappelé n'est plus à contrôler : sa case ne se coche plus, et « Tout cocher » ne le compte pas. */
  const rappele = (l: LotFromage) => etatDuLot(l) === ETAT_LOT.RAPPELE;
  const aControler = lignes.filter((l) => !rappele(l));
  /** Tous les lots à contrôler montrés le sont : « Tout cocher » devient « Tout décocher ». */
  const toutControle = aControler.length > 0 && aControler.every((l) => l.controleOk);
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
      {aControler.length > 0 ? (
        <View style={styles.barreActions}>
          <Pressable
            hitSlop={8}
            onPress={async () => {
              await controlerLots(
                aControler.map((l) => l.id),
                !toutControle,
              );
              onChange();
            }}
          >
            <Text style={commonStyles.lien}>
              {toutControle ? T.toutDecontroler : T.toutControler(aControler.length)}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {lignes.length === 0 ? (
        <Text style={[commonStyles.mutedItalic, styles.vide]}>{T.aucun}</Text>
      ) : (
        <ScrollView style={styles.liste} nestedScrollEnabled>
          {lignes.map((lot, i) => {
            const detail = archive ? detailDuLotDePlat(lot, archive) : [];
            return (
              <View key={lot.id}>
                <Pressable
                  disabled={!onBasculer}
                  onPress={() => onBasculer?.(lot)}
                  style={[
                    styles.ligne,
                    i > 0 ? styles.ligneSeparee : undefined,
                    selection?.has(lot.id) ? { backgroundColor: colors.badgeBg } : undefined,
                  ]}
                >
                  {archive ? (
                    <Pressable
                      style={[styles.colonneNumero, styles.celluleNumero]}
                      hitSlop={6}
                      onPress={() => setLotAImprimer(lot)}
                      accessibilityLabel={T.imprimer}
                    >
                      <Text style={styles.texteLigne}>{lot.numero}</Text>
                      <Ionicons name="print-outline" size={14} color={colors.textMuted} />
                    </Pressable>
                  ) : (
                    <Text style={[styles.texteLigne, styles.colonneNumero]}>{lot.numero}</Text>
                  )}
                  <Pressable style={styles.colonneDate} hitSlop={6} onPress={() => setLotADater(lot)}>
                    <Text style={[styles.texteLigne, styles.dateModifiable]}>
                      {formatDateShortFR(lot.dateFabrication)}
                    </Text>
                  </Pressable>
                  {etatDuLot(lot) === ETAT_LOT.RAPPELE ? (
                    <Text style={[styles.datePose, styles.colonneDate]}>{T.rappele}</Text>
                  ) : (
                    <Text style={[styles.texteLigne, styles.colonneDate]}>
                      {lot.dateVente ? formatDateShortFR(lot.dateVente) : lot.reservation ? T.reserve : ''}
                    </Text>
                  )}
                  <Pressable
                    style={[styles.colonneMorte, rappele(lot) ? { opacity: 0.35 } : null]}
                    hitSlop={6}
                    disabled={rappele(lot)}
                    onPress={async () => {
                      await basculerControleLot(lot.id);
                      onChange();
                    }}
                    accessibilityLabel={T.controle}
                  >
                    <Ionicons
                      name={lot.controleOk && !rappele(lot) ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={colors.text}
                    />
                  </Pressable>
                </Pressable>
                {/* Un plat préparé : sa stérilisation, sa durabilité minimale et ses ingrédients, sous son numéro. */}
                {detail.map((ligneDetail) => (
                  <Text
                    key={ligneDetail}
                    style={[commonStyles.note, { paddingHorizontal: 12, paddingBottom: 4 }]}
                  >
                    {ligneDetail}
                  </Text>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
      <OptionsModal
        visible={!!lotAImprimer}
        onClose={() => setLotAImprimer(undefined)}
        title={lotAImprimer?.numero}
        options={[
          // Les étiquettes : tous les produits à lots (fromages, charcuterie, plats préparés, savons).
          ...(lotAImprimer
            ? [
                {
                  label: T.etiquettes,
                  icon: 'pricetag-outline' as const,
                  onPress: () => imprimer(exporterEtiquettesLotPdf(lotAImprimer.id)),
                },
                {
                  label: T.etiquettesAvecContenu,
                  icon: 'pricetags-outline' as const,
                  onPress: () => setEtiquetteDe(lotAImprimer),
                },
              ]
            : []),
          {
            label: T.tracabilite,
            icon: 'git-network-outline' as const,
            onPress: () => {
              if (lotAImprimer) imprimer(exporterTracabiliteLotPdf(lotAImprimer.id));
            },
          },
        ]}
      />
      <NomModal
        visible={!!etiquetteDe}
        titre={T.contenuNetTitre}
        placeholder={T.contenuNetExemple}
        onValider={(texte) => {
          const lotEtiquete = etiquetteDe;
          setEtiquetteDe(undefined);
          if (lotEtiquete) imprimer(exporterEtiquettesLotPdf(lotEtiquete.id, texte));
        }}
        onAnnuler={() => setEtiquetteDe(undefined)}
      />
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
