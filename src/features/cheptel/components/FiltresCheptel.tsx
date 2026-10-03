import { Pressable, Text, TextInput, View } from 'react-native';
import { DateField } from '@/shared/components/DateField';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { colors } from '@/shared/theme/colors';
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

/** Filtres de la liste du cheptel : statut, catégorie, tri, recherche et critères précis du tri actif. */
export function FiltresCheptel({ e }: { e: EtatListeCheptel }) {
  const { precis, majPrecis, triActif } = e;

  const optionsTri =
    e.categorieFiltre === FILTRE_CATEGORIE_CHEPTEL.CHEVRE
      ? OPTIONS_TRI
      : OPTIONS_TRI.filter((o) => o.value !== TRI_CHEPTEL.MISE_BAS);

  return (
    <>
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
          <SelectField label={T.trierFiltrePar} value={triActif} onChange={e.setTri} options={optionsTri} />
        }
        droite={
          <>
            <Text style={styles.searchLabel}>{TEXTES.commun.general.rechercher}</Text>
            <TextInput
              style={styles.search}
              placeholder={T.dansTousLesChampsPoints}
              placeholderTextColor={colors.textMuted}
              value={e.recherche}
              onChangeText={e.setRecherche}
            />
          </>
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

      <View style={styles.resultatRow}>
        <LienEffacer e={e} />
        <Text style={commonStyles.mutedBold}>
          {T.resultatDeuxPoints}
          {e.filtrees.length}
        </Text>
      </View>
    </>
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
