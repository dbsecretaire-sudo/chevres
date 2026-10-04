import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { LignesAlimentationEditor } from '@/features/comptabilite/components/LignesAlimentationEditor';
import { LignesCarburantEditor } from '@/features/comptabilite/components/LignesCarburantEditor';
import {
  ChampCategorieCompte,
  ChampMontantTtc,
  NoteComptePcg,
} from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import type { CategorieDepense } from '@/features/comptabilite/types';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { formatTotalEuros } from '@/shared/utils/nombres';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';

const OPTIONS_CATEGORIE_DEPENSE = Object.entries(LABEL_CATEGORIE_DEPENSE).map(([value, label]) => ({
  value: value as CategorieDepense,
  label,
}));

/** Champs d'un débit (facture reçue) : catégorie, fournisseur, TVA et détail des montants. */
export function SectionDepense({ e }: { e: EtatNouvelleEcriture }) {
  const router = useRouter();
  const estAlimentation = e.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION;
  const estCarburant = e.categorieDepense === CATEGORIE_DEPENSE.CARBURANT;

  return (
    <>
      <FormField
        label={TEXTES.comptabilite.nouvelleEcriture.nDeFacture}
        value={e.description}
        onChangeText={e.setDescription}
        placeholder={TEXTES.comptabilite.nouvelleEcriture.precisions}
      />
      <ChampCategorieCompte
        label={TEXTES.comptabilite.nouvelleEcriture.categorieDeDepense}
        value={e.categorieDepense}
        onChange={e.changerCategorieDepense}
        options={OPTIONS_CATEGORIE_DEPENSE}
        demanderCompte={e.categorieDepense === CATEGORIE_DEPENSE.AUTRE}
        compte={e.compteDepenseAutre}
        onCompteChange={e.setCompteDepenseAutre}
        optionsCompte={e.optionsCompteDepense}
        onGererComptes={() => router.push(ROUTES.COMPTES_PCG)}
      />

      <NoteComptePcg compte={e.compteAffiche} />

      <SelectFieldEditable
        label={TEXTES.commun.general.fournisseur}
        required
        searchable
        placeholder={TEXTES.commun.general.choixDuFournisseur}
        value={e.fournisseurId}
        onChange={e.changerFournisseur}
        options={e.fournisseurs.map((f) => ({ value: f.id, label: f.nomEntreprise }))}
        onEdit={() => router.push(ROUTES.FOURNISSEURS)}
      />

      <SelectField
        label={TEXTES.commun.general.tauxDeTva}
        value={e.tauxTvaAchat}
        onChange={e.setTauxTvaAchat}
        options={OPTIONS_TAUX_TVA}
      />

      {estAlimentation && (
        <>
          <LignesAlimentationEditor
            lignes={e.lignesAlimentation}
            onChange={e.setLignesAlimentation}
            types={e.typesAliment}
          />
          <Card style={commonStyles.gap10}>
            <Text style={styles.total}>
              {TEXTES.commun.general.totalFactureTtcDeuxPoints}
              {formatTotalEuros(e.totalAlimentation)}
            </Text>
          </Card>
        </>
      )}

      {estCarburant && (
        <>
          <LignesCarburantEditor lignes={e.lignesCarburant} onChange={e.setLignesCarburant} />
          <Card style={commonStyles.gap10}>
            <Text style={styles.total}>
              {TEXTES.commun.general.totalFactureTtcDeuxPoints}
              {formatTotalEuros(e.totalCarburant)}
            </Text>
          </Card>
        </>
      )}

      {!estAlimentation && !estCarburant && <ChampMontantTtc value={e.montant} onChange={e.setMontant} />}
    </>
  );
}
