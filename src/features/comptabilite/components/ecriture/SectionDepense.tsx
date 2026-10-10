import { estArticleBoucle } from '@/features/stock/services/boucles';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { SectionForm } from '@/shared/components/SectionForm';
import { FormField } from '@/shared/components/FormField';
import { SelectField } from '@/shared/components/SelectField';
import { SelectFieldEditable } from '@/shared/components/SelectFieldEditable';
import { LignesAlimentationEditor } from '@/features/comptabilite/components/LignesAlimentationEditor';
import { LignesMarchandisesEditor } from '@/features/comptabilite/components/LignesMarchandisesEditor';
import { ChampStockProduction } from '@/features/comptabilite/components/ecriture/ChampStockProduction';
import { ChampVisite } from '@/features/comptabilite/components/ecriture/ChampVisite';
import { LignesCarburantEditor } from '@/features/comptabilite/components/LignesCarburantEditor';
import {
  ChampCategorieCompte,
  ChampMontantTtc,
  NoteComptePcg,
} from '@/features/comptabilite/components/ecriture/ChampsEcriture';
import type { EtatNouvelleEcriture } from '@/features/comptabilite/hooks/useNouvelleEcriture';
import { OPTIONS_TAUX_TVA } from '@/features/comptabilite/utils/tva';
import type { CategorieDepense } from '@/features/comptabilite/types';
import { categoriesDepenseDuMode } from '@/features/comptabilite/utils/categories';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { formatTotalEuros } from '@/shared/utils/nombres';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';

/** Les catégories proposées : celles d'une entreprise, ou celles d'un élevage. */
const optionsCategorieDepense = () =>
  categoriesDepenseDuMode().map((value) => ({
    value: value as CategorieDepense,
    label: LABEL_CATEGORIE_DEPENSE[value],
  }));

/** Champs d'un débit (facture reçue) : catégorie, fournisseur, TVA et détail des montants. */
export function SectionDepense({ e, date }: { e: EtatNouvelleEcriture; date: ReactNode }) {
  const router = useRouter();
  const estAlimentation = e.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION;
  const estCarburant = e.categorieDepense === CATEGORIE_DEPENSE.CARBURANT;

  return (
    <>
      {/* L'identification : la date, le fournisseur et le numéro de la facture. */}
      <SectionForm>
        {date}
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

        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.nDeFactureOuObjet}
          value={e.description}
          onChangeText={e.setDescription}
          placeholder={TEXTES.comptabilite.nouvelleEcriture.precisions}
        />
      </SectionForm>

      {/* Les informations : la catégorie, la TVA et les montants. */}
      <SectionForm>
        <ChampCategorieCompte
          label={TEXTES.comptabilite.nouvelleEcriture.categorieDeDepense}
          value={e.categorieDepense}
          onChange={e.changerCategorieDepense}
          options={optionsCategorieDepense()}
          demanderCompte={e.categorieDepense === CATEGORIE_DEPENSE.AUTRE}
          compte={e.compteDepenseAutre}
          onCompteChange={(numero) => {
            e.setCompteDepenseAutre(numero);
            e.setStockArticle('');
            e.setStockQuantite(undefined);
          }}
          optionsCompte={e.optionsCompteDepense}
          pucesCompte={[
            TEXTES.comptabilite.nouvelleEcriture.groupeInventaire,
            TEXTES.comptabilite.nouvelleEcriture.groupeAutresComptes,
          ]}
          onGererComptes={() => router.push(ROUTES.COMPTES_PCG)}
        />

        {e.modeAvance ? <NoteComptePcg compte={e.compteAffiche} /> : null}

        {e.afficherTva && (
          <SelectField
            label={TEXTES.commun.general.tauxDeTva}
            value={e.tauxTvaAchat}
            onChange={e.setTauxTvaAchat}
            options={OPTIONS_TAUX_TVA}
          />
        )}

        {estAlimentation && (
          <>
            <LignesAlimentationEditor
              lignes={e.lignesAlimentation}
              onChange={e.setLignesAlimentation}
              activite={e.activite}
            />
            <Card style={commonStyles.gap10}>
              <Text style={styles.total}>
                {TEXTES.commun.general.totalFactureTtcDeuxPoints}
                {formatTotalEuros(e.totalAlimentation)}
              </Text>
            </Card>
          </>
        )}

        {e.estMarchandisesGite && (
          <>
            <LignesMarchandisesEditor lignes={e.lignesMarchandises} onChange={e.setLignesMarchandises} />
            <Card style={commonStyles.gap10}>
              <Text style={styles.total}>
                {TEXTES.commun.general.totalFactureTtcDeuxPoints}
                {formatTotalEuros(e.totalMarchandises)}
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

        {!estAlimentation && !estCarburant && !e.estMarchandisesGite && (
          <ChampMontantTtc value={e.montant} onChange={e.setMontant} />
        )}

        {e.categorieDepense === CATEGORIE_DEPENSE.VETERINAIRE && (
          <ChampVisite
            motif={e.motifVisite}
            ajouter={e.ajouterVisite}
            onMotif={e.setMotifVisite}
            onAjouter={e.setAjouterVisite}
          />
        )}

        {(e.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION ||
          e.categorieDepense === CATEGORIE_DEPENSE.AUTRE) && (
          <ChampStockProduction
            compte={e.categorieDepense === CATEGORIE_DEPENSE.AUTRE ? e.compteDepenseAutre : undefined}
            article={e.stockArticle}
            quantite={e.stockQuantite}
            debut={e.bouclesDebut}
            onChangeDebut={e.setBouclesDebut}
            onChange={(article, quantite) => {
              e.setStockArticle(article);
              e.setStockQuantite(quantite);
              if (!estArticleBoucle(article)) e.setBouclesDebut('');
            }}
          />
        )}
      </SectionForm>
    </>
  );
}
