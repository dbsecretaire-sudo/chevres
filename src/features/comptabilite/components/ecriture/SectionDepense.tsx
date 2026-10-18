import { estBoucleNumerotee } from '@/features/stock/services/boucles';
import { AnimauxAchetesEditor } from '@/features/comptabilite/components/AnimauxAchetesEditor';
import { AnimauxEnvoyesChoix } from '@/features/comptabilite/components/AnimauxEnvoyesChoix';
import { LignesChambreEditor } from '@/features/comptabilite/components/LignesChambreEditor';
import { LignesVeterinaireEditor } from '@/features/comptabilite/components/LignesVeterinaireEditor';
import { LignesProductionEditor } from '@/features/comptabilite/components/LignesProductionEditor';
import { useAdresseCourante } from '@/shared/hooks/useAdresseCourante';
import type { ReactNode } from 'react';
import { Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Card } from '@/shared/components/Card';
import { Checkbox } from '@/shared/components/Checkbox';
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
import {
  categorieDepenseAutorisee,
  depenseImposee,
  fournituresSeulementBoucles,
} from '@/features/fournisseurs/services/categorie';
import {
  categorieFournisseurDe,
  pasPayeeAffichee,
  sansFactureAffichee,
} from '@/shared/dictionnaire/categoriesFournisseur';
import type { Fournisseur } from '@/features/fournisseurs/types';
import { CATEGORIE_DEPENSE } from '@/shared/constants/comptabilite';
import { ROUTES } from '@/shared/constants/routes';
import { formatTotalEuros } from '@/shared/utils/nombres';
import { styles } from '@/shared/styles/comptabilite/NouvelleEcriture.styles';
import { commonStyles } from '@/shared/styles/commonStyles';
import { ChampAtelier } from '@/features/comptabilite/components/ChampAtelier';
import { ChampElementAgritourisme } from '@/features/comptabilite/components/ChampElementAgritourisme';
import { ATELIER } from '@/shared/constants/ateliers';
import { ChampPaiement } from '@/features/comptabilite/components/ChampPaiement';
import { ajouterMois } from '@/features/comptabilite/services/tresorerie';
import { todayISO } from '@/shared/utils/dates';
import { modeEntreprise } from '@/shared/dictionnaire/entreprise';
import { TEXTES } from '@/shared/textes';
import { LABEL_CATEGORIE_DEPENSE } from '@/shared/textes/libelles';
import { optionFournisseur } from '@/features/contacts/services/optionsContacts';

/** Les catégories proposées : celles d'une entreprise, ou celles d'un élevage. */
const optionsCategorieDepense = (fournisseur: Fournisseur | undefined) => {
  const toutes = categoriesDepenseDuMode();
  const permises = toutes.filter((value) => categorieDepenseAutorisee(fournisseur, value));
  // Aucune des dépenses permises n'existe dans ce mode (une activité financière, par exemple) : le choix reste entier.
  return (permises.length > 0 ? permises : toutes).map((value) => ({
    value: value as CategorieDepense,
    label: LABEL_CATEGORIE_DEPENSE[value],
  }));
};

/** Champs d'un débit (facture reçue) : catégorie, fournisseur, TVA et détail des montants. */
export function SectionDepense({ e, date }: { e: EtatNouvelleEcriture; date: ReactNode }) {
  return (
    <>
      <SectionDepenseContact e={e} date={date} />
      <SectionDepenseDetail e={e} />
    </>
  );
}

/** La première étape d'une dépense : la date, le fournisseur, le numéro de la facture et le paiement. */
export function SectionDepenseContact({ e, date }: { e: EtatNouvelleEcriture; date: ReactNode }) {
  const router = useRouter();
  const retour = useAdresseCourante();
  /** La catégorie du fournisseur choisi : elle dit quelles cases (paiement, non facturée) s'affichent. */
  const categorieDuTiers = e.fournisseurSelectionne
    ? categorieFournisseurDe(e.fournisseurSelectionne.categorie)
    : undefined;

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
          options={e.fournisseurs.map(optionFournisseur)}
          parCategories
          onEdit={() => router.push(ROUTES.fournisseursDepuis(retour))}
        />

        <FormField
          label={TEXTES.comptabilite.nouvelleEcriture.nDeFactureOuObjet}
          value={e.description}
          onChangeText={e.setDescription}
          placeholder={TEXTES.comptabilite.nouvelleEcriture.precisions}
        />
        {/* Le paiement : payée à sa date (d'office), ou pas encore — la trésorerie la compte à son échéance. */}
        {pasPayeeAffichee(categorieDuTiers) ? (
          <ChampPaiement
            libelle={TEXTES.comptabilite.tresorerie.paiement.pasPayee}
            enAttente={e.enAttente}
            onEnAttente={(attente) => {
              e.setEnAttente(attente);
              if (attente && !e.echeance) e.setEcheance(ajouterMois(todayISO(), 1));
            }}
            echeance={e.echeance}
            onEcheance={e.setEcheance}
          />
        ) : null}
        {sansFactureAffichee(categorieDuTiers) ? (
          <Checkbox
            label={TEXTES.comptabilite.nouvelleEcriture.depenseNonFacturee}
            value={e.sansFacture}
            onChange={e.setSansFacture}
          />
        ) : null}
        {e.sansFacture && sansFactureAffichee(categorieDuTiers) ? (
          <Text style={commonStyles.note}>{TEXTES.comptabilite.nouvelleEcriture.depenseNonFactureeAide}</Text>
        ) : null}
      </SectionForm>
    </>
  );
}

/** La seconde étape d'une dépense : la catégorie, ce qui est acheté (le détail), la TVA et le montant. */
export function SectionDepenseDetail({ e }: { e: EtatNouvelleEcriture }) {
  const router = useRouter();
  const estAlimentation = e.categorieDepense === CATEGORIE_DEPENSE.ALIMENTATION;
  const estProduction = e.categorieDepense === CATEGORIE_DEPENSE.PRODUCTION;
  const estCarburant = e.categorieDepense === CATEGORIE_DEPENSE.CARBURANT;
  const estAnimauxVivants = e.categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS;

  return (
    <>
      {/* Les informations : la catégorie, la TVA et les montants. */}
      <SectionForm>
        <ChampCategorieCompte
          label={TEXTES.comptabilite.nouvelleEcriture.categorieDeDepense}
          value={e.categorieDepense}
          onChange={e.changerCategorieDepense}
          options={optionsCategorieDepense(e.fournisseurSelectionne)}
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
          puceCompteParDefaut={TEXTES.comptabilite.nouvelleEcriture.groupeAutresComptes}
          onGererComptes={() => router.push(ROUTES.COMPTES_PCG)}
        />
        <NoteComptePcg compte={e.compteAffiche} />
        {/* Ce qui est propre à la catégorie, puis le montant, la TVA et l'atelier : le même ordre qu'à la modification d'une facture. */}
        {e.categorieDepense === CATEGORIE_DEPENSE.VETERINAIRE && (
          <>
            <ChampVisite
              motif={e.motifVisite}
              ajouter={e.ajouterVisite}
              onMotif={e.setMotifVisite}
              onAjouter={e.setAjouterVisite}
            />
            <LignesVeterinaireEditor
              lignes={e.lignesVeterinaire}
              onChange={e.setLignesVeterinaire}
              dateParDefaut={e.date}
            />
          </>
        )}
        {e.categorieDepense === CATEGORIE_DEPENSE.AUTRE && (
          <ChampStockProduction
            compte={e.compteDepenseAutre}
            article={e.stockArticle}
            quantite={e.stockQuantite}
            debut={e.bouclesDebut}
            onChangeDebut={e.setBouclesDebut}
            onChange={(article, quantite) => {
              e.setStockArticle(article);
              e.setStockQuantite(quantite);
              if (!estBoucleNumerotee(article)) e.setBouclesDebut('');
            }}
          />
        )}
        {estAnimauxVivants && <AnimauxAchetesEditor animaux={e.animauxAchetes} onChange={e.setAnimauxAchetes} />}
        {e.categorieDepense === CATEGORIE_DEPENSE.ANIMAUX_VIVANTS_VENTE && (
          <AnimauxEnvoyesChoix valeur={e.animauxEnvoyes} onChange={e.setAnimauxEnvoyes} />
        )}
        {estProduction && (
          <>
            <LignesProductionEditor
              lignes={e.lignesProduction}
              onChange={e.setLignesProduction}
              seulementBoucles={fournituresSeulementBoucles(e.fournisseurSelectionne)}
            />
            <Card style={commonStyles.gap10}>
              <Text style={styles.total}>
                {TEXTES.commun.general.totalFactureTtcDeuxPoints}
                {formatTotalEuros(e.totalProduction)}
              </Text>
            </Card>
          </>
        )}
        {e.estChambre && (
          <>
            <LignesChambreEditor lignes={e.lignesChambre} onChange={e.setLignesChambre} />
            <LignesProductionEditor
              lignes={e.lignesProduction}
              onChange={e.setLignesProduction}
              seulementBoucles
              titre={TEXTES.fournisseurs.chambre.boucles}
            />
            <Card style={commonStyles.gap10}>
              <Text style={styles.total}>
                {TEXTES.commun.general.totalFactureTtcDeuxPoints}
                {formatTotalEuros(e.totalChambre)}
              </Text>
            </Card>
          </>
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
        {!estAlimentation && !estProduction && !estCarburant && !e.estMarchandisesGite && !e.estChambre && (
          <ChampMontantTtc value={e.montant} onChange={e.setMontant} />
        )}
        {e.afficherTva && (
          <SelectField
            label={TEXTES.commun.general.tauxDeTva}
            value={e.tauxTvaAchat}
            onChange={e.setTauxTvaAchat}
            options={OPTIONS_TAUX_TVA}
          />
        )}
        {/* L'atelier de la charge (facultatif) : la marge par atelier de la rentabilité. */}
        {/* Un fournisseur dont la catégorie impose la dépense (un vétérinaire) n'en demande pas l'atelier. */}
        {modeEntreprise() || depenseImposee(e.fournisseurSelectionne) ? null : (
          <ChampAtelier value={e.atelier} onChange={e.setAtelier} />
        )}
        {e.atelier === ATELIER.AGRITOURISME ? (
          <ChampElementAgritourisme value={e.elementAgri} onChange={e.setElementAgri} />
        ) : null}
      </SectionForm>
    </>
  );
}
