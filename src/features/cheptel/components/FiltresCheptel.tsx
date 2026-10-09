import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { ChampRecherche } from '@/shared/components/ChampRecherche';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { Button } from '@/shared/components/Button';
import type { EtatListeCheptel } from '@/features/cheptel/hooks/useListeCheptel';
import { OPTIONS_TRI } from '@/features/cheptel/utils/filtresCheptel';
import { FILTRE_CATEGORIE_CHEPTEL, TRI_CHEPTEL } from '@/shared/constants/cheptel';
import { styles } from '@/shared/styles/cheptel/ListeCheptel.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';

const T = TEXTES.cheptel.listeCheptel;

/** Deux champs côte à côte sur une même ligne de filtres. */
function LigneFiltres({ gauche, droite }: { gauche: React.ReactNode; droite?: React.ReactNode }) {
  return (
    <View style={styles.filtres}>
      <View style={commonStyles.flex1}>{gauche}</View>
      <View style={commonStyles.flex1}>{droite}</View>
    </View>
  );
}

/**
 * La barre de la liste du cheptel : le champ de recherche et « Filtrer » sur une ligne, comme en comptabilité. Les filtres
 * (statut, catégorie, tri, critères précis) sont dans la fenêtre qu'ouvre « Filtrer ».
 */
export function FiltresCheptel({ e }: { e: EtatListeCheptel }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <>
      <View style={styles.rechercheLigne}>
        <View style={commonStyles.flex1}>
          <ChampRecherche
            value={e.recherche}
            onChangeText={e.setRecherche}
            placeholder={T.dansTousLesChampsPoints}
          />
        </View>
        <Pressable style={commonStyles.chip} onPress={() => setOuvert(true)}>
          <Text style={commonStyles.labelMuted}>
            {e.filtresActifs
              ? TEXTES.comptabilite.listeTransactions.filtresActifs
              : TEXTES.commun.general.filtrer}
          </Text>
        </Pressable>
      </View>
      <View style={styles.resultatRow}>
        <Text style={commonStyles.mutedBold}>
          {T.resultatDeuxPoints}
          {e.filtrees.length}
        </Text>
        {e.filtresActifs ? (
          <Pressable onPress={e.reinitialiserFiltres}>
            <Text style={styles.effacerTexte}>{TEXTES.comptabilite.listeTransactions.effacer}</Text>
          </Pressable>
        ) : null}
      </View>
      <FenetreFiltres e={e} visible={ouvert} onClose={() => setOuvert(false)} />
    </>
  );
}

/** La fenêtre des filtres : statut, catégorie, tri et critères précis du tri actif. */
function FenetreFiltres({
  e,
  visible,
  onClose,
}: {
  e: EtatListeCheptel;
  visible: boolean;
  onClose: () => void;
}) {
  const { precis, majPrecis, triActif } = e;

  const optionsTri =
    e.categorieFiltre === FILTRE_CATEGORIE_CHEPTEL.CHEVRE
      ? OPTIONS_TRI
      : OPTIONS_TRI.filter((o) => o.value !== TRI_CHEPTEL.MISE_BAS);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={commonStyles.backdrop} onPress={onClose}>
        <Pressable style={styles.feuille}>
          <Text style={styles.titreFeuille}>{TEXTES.commun.general.filtrer}</Text>
          <ScrollView contentContainerStyle={styles.feuilleContenu} keyboardShouldPersistTaps="handled">
            <LigneFiltres
              gauche={
                <SelectField
                  label={TEXTES.commun.general.statut}
                  value={e.statutFiltre}
                  onChange={e.setStatutFiltre}
                  options={e.optionsStatut}
                />
              }
              droite={
                <SelectField
                  label={T.categorie}
                  value={e.categorieFiltre}
                  onChange={e.setCategorieFiltre}
                  options={e.optionsCategorie}
                />
              }
            />

            <LigneFiltres
              gauche={
                <SelectField
                  label={T.trierFiltrePar}
                  value={triActif}
                  onChange={e.setTri}
                  options={optionsTri}
                />
              }
            />

            {triActif === TRI_CHEPTEL.NAISSANCE && (
              <LigneFiltres
                gauche={
                  <DateField
                    label={T.dateDeNaissanceDu}
                    value={precis.dateNaissanceDebut}
                    onChange={(v) => majPrecis({ dateNaissanceDebut: v })}
                  />
                }
                droite={
                  <DateField
                    label={T.dateDeNaissanceAu}
                    value={precis.dateNaissanceFin}
                    onChange={(v) => majPrecis({ dateNaissanceFin: v })}
                  />
                }
              />
            )}

            {triActif === TRI_CHEPTEL.ABATTOIR && (
              <LigneFiltres
                gauche={
                  <DateField
                    label={T.dateDAbattageDu}
                    value={precis.dateAbattoirDebut}
                    onChange={(v) => majPrecis({ dateAbattoirDebut: v })}
                  />
                }
                droite={
                  <DateField
                    label={T.dateDAbattageAu}
                    value={precis.dateAbattoirFin}
                    onChange={(v) => majPrecis({ dateAbattoirFin: v })}
                  />
                }
              />
            )}

            {triActif === TRI_CHEPTEL.MORTE && (
              <LigneFiltres
                gauche={
                  <FormField
                    label={T.annee}
                    value={precis.anneeMorte}
                    onChangeText={(v) => majPrecis({ anneeMorte: v })}
                    keyboardType="number-pad"
                    placeholder={T.aaaa}
                  />
                }
                droite={<Text style={commonStyles.note}>{T.nombreDAnimauxMortsSur}</Text>}
              />
            )}

            {triActif === TRI_CHEPTEL.RENOUVELLEMENT && (
              <LigneFiltres
                gauche={
                  <FormField
                    label={TEXTES.commun.general.anneeDeDesignation}
                    value={precis.anneeRenouv}
                    onChangeText={(v) => majPrecis({ anneeRenouv: v })}
                    keyboardType="number-pad"
                    placeholder={T.aaaa}
                  />
                }
              />
            )}

            {triActif === TRI_CHEPTEL.ANNEE && (
              <LigneFiltres
                gauche={
                  <FormField
                    label={T.annee}
                    value={precis.anneePresence}
                    onChangeText={(v) => majPrecis({ anneePresence: v })}
                    keyboardType="number-pad"
                    placeholder={T.aaaa}
                  />
                }
                droite={<Text style={commonStyles.note}>{T.chevresNeesAvantPendantCette}</Text>}
              />
            )}

            <LienEffacer e={e} />
          </ScrollView>
          <View style={commonStyles.row}>
            <Button
              style={commonStyles.flex1}
              variant="secondary"
              label={TEXTES.comptabilite.filtreTransactionsModal.reinitialiser}
              onPress={e.reinitialiserFiltres}
            />
            <Button
              style={commonStyles.flex1}
              label={TEXTES.comptabilite.filtreTransactionsModal.appliquer}
              onPress={onClose}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Lien « Effacer… » proposé quand un critère précis du tri actif est renseigné. */
function LienEffacer({ e }: { e: EtatListeCheptel }) {
  const { precis, majPrecis, triActif } = e;

  const effacer = (libelle: string, patch: Partial<typeof precis>) => (
    <Pressable onPress={() => majPrecis(patch)}>
      <Text style={styles.effacerTexte}>{libelle}</Text>
    </Pressable>
  );

  if (triActif === TRI_CHEPTEL.NAISSANCE && (precis.dateNaissanceDebut || precis.dateNaissanceFin))
    return effacer(T.effacerLaDateDeNaissance, { dateNaissanceDebut: '', dateNaissanceFin: '' });
  if (triActif === TRI_CHEPTEL.ABATTOIR && (precis.dateAbattoirDebut || precis.dateAbattoirFin))
    return effacer(T.effacerLaDateDAbattage, { dateAbattoirDebut: '', dateAbattoirFin: '' });
  if (triActif === TRI_CHEPTEL.MORTE && precis.anneeMorte)
    return effacer(T.effacerLAnnee, { anneeMorte: '' });
  if (triActif === TRI_CHEPTEL.RENOUVELLEMENT && precis.anneeRenouv)
    return effacer(T.effacerLAnneeDeRenouvellement, { anneeRenouv: '' });
  if (triActif === TRI_CHEPTEL.ANNEE && precis.anneePresence)
    return effacer(T.effacerLAnnee, { anneePresence: '' });
  return <View />;
}
